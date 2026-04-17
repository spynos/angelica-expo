# 블록매치 (Block Match) 개발 계획서 v0.1

> 대상: `app/(tabs)/puzzle/blockmatch` 경로
> 기준 명세: 블록매치 개발 명세서 v1.0
> 기존 패턴 참고: 스도쿠 (`src/lib/sudoku.ts`, `src/components/SudokuBoard.tsx`, `app/(tabs)/puzzle/sudoku/[difficulty].tsx`)

---

## 0. 목표

명세서 v1.0의 MVP를 구현한다. 라인 클리어 + 콤보 + 장애물(기본 1종) + 폴리오미노 배치 + 게임 오버 판정까지 동작하는 한 판 플레이가 가능한 상태가 1차 목표.

이후 점진적으로 장애물 다양화, 로그라이크 난이도 곡선, 일일 챌린지 등을 확장한다.

---

## 1. 마일스톤

### M1. 코어 게임 엔진 (UI 없음)
- 보드/블록/배치/라인 클리어/점수 로직만 순수 함수로 구현.
- 콘솔 또는 단위 테스트로 동작 검증.

### M2. 기본 플레이 화면
- 10x10 보드 렌더링 + 트레이(현재 1 + 다음 2) + 드래그 배치 + 회전 + 점수 표시.
- 장애물은 **기본 1종**만 (라인 클리어 시 제거).
- 게임 오버 판정 + 재시작.

### M3. 장애물 다양화
- 가로/세로 전용, 내구도, 복합 장애물 추가.
- 각 장애물 시각 차별화 (색·패턴).

### M4. 로그라이크 스테이지
- 점수/턴 기반 난이도 곡선, 스테이지 진행에 따른 장애물 증가.

### M5. 메타 (확장)
- 최고 점수 영구 저장, 통계, 기록 화면 연결.

본 문서는 **M1–M2를 상세히** 다루고, M3 이후는 인터페이스 예약만 둔다.

---

## 2. 디렉토리 / 파일 구성

```
src/
  lib/
    blockmatch/
      board.ts          # 보드 표현, 셀 enum, 충돌/배치 판정
      pieces.ts         # 폴리오미노 정의, 회전, 거울상 생성
      generator.ts      # 블록 큐 생성기, 스테이지(장애물) 생성기
      lineClear.ts      # 라인 감지/클리어, 장애물 반응
      score.ts          # 점수/콤보 계산
      engine.ts         # GameState + reducer (place, rotate, restart …)
      types.ts          # 공용 타입
      __tests__/        # 순수 함수 유닛 테스트 (선택)
  components/
    blockmatch/
      Board.tsx         # 보드 그리드 렌더
      Cell.tsx          # 셀 (블록/장애물 변종)
      PieceTray.tsx     # 현재 + 다음 2개 미리보기
      DraggablePiece.tsx# 드래그/회전 처리 (Reanimated + Gesture)
      ScorePanel.tsx    # 점수/콤보/최고기록
      GameOverSheet.tsx # 종료 모달
  store/
    blockmatch.ts       # zustand 또는 useReducer 래퍼 (선택)

app/
  (tabs)/puzzle/
    blockmatch.tsx      # 화면 진입점 (현재 ComingSoonGame → 교체)
```

> 스도쿠가 `src/lib/sudoku.ts` 단일 파일로 끝났던 것과 달리 블록매치는 도메인이 더 크므로 폴더로 분리한다.

---

## 3. 데이터 모델

### 3.1 셀 (`Cell`)

```ts
type CellKind =
  | { kind: 'empty' }
  | { kind: 'block' }                     // 플레이어가 놓은 블록
  | { kind: 'obstacle'; id: ObstacleId }; // 장애물

type ObstacleId =
  | 'basic'      // 기본: 모든 라인 클리어
  | 'horiz'      // 가로 전용
  | 'vert'       // 세로 전용
  | 'durable2'   // 내구도 2
  | 'composite'; // 가로+세로 각 1회 등 (M3에서 정의)

type ObstacleState = {
  id: ObstacleId;
  hp: number;            // 남은 클리어 횟수
  needs: { h: number; v: number }; // 남은 가로/세로 클리어 수
};
```

보드는 길이 100의 `Cell[]` flat 배열 (스도쿠와 동일 패턴, idx = r*10 + c).

### 3.2 블록 (`Piece`)

```ts
type PieceShape = ReadonlyArray<readonly [number, number]>; // (dr, dc) offsets, 정규화됨
type PieceDef = {
  id: string;            // 'I4', 'L3', ...
  size: 1 | 2 | 3 | 4 | 5;
  rotations: PieceShape[]; // 0/90/180/270, 거울상 포함 시 추가
};

type ActivePiece = {
  defId: string;
  rotationIdx: number;   // 0..rotations.length-1
};
```

회전은 사전 계산된 `rotations` 배열의 인덱스만 증가시키는 식으로 처리 → 매 프레임 회전 행렬 곱셈 회피.

### 3.3 게임 상태 (`GameState`)

```ts
type GameState = {
  board: Cell[];
  current: ActivePiece;
  next: [ActivePiece, ActivePiece]; // 미리보기 2개
  score: number;
  combo: number;          // 직전 턴 라인 클리어 수
  highScore: number;      // MMKV에서 hydrate
  stage: number;          // 로그라이크용 (M4)
  isOver: boolean;
  seed: string;           // 디버깅/리플레이용
};
```

엔진은 순수 함수 reducer 로 노출한다:

```ts
function reduce(state: GameState, action: Action): GameState;
type Action =
  | { type: 'place'; pieceIdx: 0 | 1 | 2; row: number; col: number }
  | { type: 'rotate'; pieceIdx: 0 | 1 | 2 }
  | { type: 'restart'; seed?: string };
```

> 트레이 전체에서 어떤 슬롯을 놓을지 선택 가능하게 두면 명세 확장 여지가 있지만, MVP는 명세대로 **현재(슬롯0)만 배치 가능**으로 제한한다. 회전도 슬롯0만 허용.

---

## 4. 핵심 알고리즘

### 4.1 폴리오미노 정의
- 모노/도미/트리/테트로/펜타 전부를 enumerate.
  - 1: 1종, 2: 1종, 3: 2종, 4: 5종, 5: 12종 (one-sided), 거울상 포함 시 18종.
- 빌드 타임에 회전+거울상 생성 후 정규화(좌상단 (0,0) 기준)하여 중복 제거.
- `pieces.ts`에서 `ALL_PIECES: PieceDef[]` 로 export.

### 4.2 충돌/배치 판정
```ts
canPlace(board, piece, row, col): boolean
applyPlace(board, piece, row, col): Cell[]   // 새 보드 반환 (불변)
```
- 각 offset 셀이 보드 안에 있고 `empty`인지 확인.

### 4.3 라인 클리어
- 배치 직후 가로 10줄 / 세로 10줄 검사.
- 채워진 라인 인덱스를 모은 뒤:
  1. 일반 `block` 셀 → empty
  2. `obstacle` 셀 → 방향 정보(`'h' | 'v'`)와 함께 `damage(obstacle, dir)` 호출
  3. damage 결과 hp ≤ 0 인 장애물 → 제거 + 추가 점수
- 동시 클리어 수(`linesCleared`)와 제거된 장애물 수를 turn summary 로 반환.

### 4.4 게임 오버
- 배치 후 다음 `current`(= 기존 next[0]) 가 보드 어디에도 들어가지 않으면 `isOver = true`.
- 검사 비용: 100칸 × 회전 수 ≈ 최대 800 회 비교. 충분히 가볍다.

### 4.5 점수
```
linesCleared = 0:  +0
1: +100
2: +250
3: +450
4: +700
5+: +700 + (n-4)*300

obstacleBonus = removedObstacles.reduce((s,o)=> s + OBSTACLE_BONUS[o.id], 0)
comboMultiplier = 1 + 0.2 * max(combo - 1, 0)   // 콤보 2부터 가산
turnScore = (lineScore + obstacleBonus) * comboMultiplier
```
- 콤보는 라인 클리어가 0인 턴에 0으로 리셋.
- 정확한 수치는 플레이테스트 후 튜닝.

### 4.6 스테이지/장애물 생성 (M2 단순 버전)
- 게임 시작 시 보드의 임의 위치에 `basic` 장애물 N개 배치 (N = 5 시작).
- 같은 셀 중복 X, 경계에서 1셀 이상 떨어뜨리는 등 여유 규칙.
- M4에서 `stage`에 따라 N과 종류를 증가시키도록 시그니처를 미리 잡아둔다:
  ```ts
  generateStage(stage: number, rng: Rng): { board: Cell[]; queueSeed: string }
  ```

### 4.7 RNG / 시드
- `mulberry32` 같은 시드 PRNG 를 채택해 리플레이/디버깅 가능하도록.
- 블록 큐는 "bag 시스템"으로: 각 사이즈 분포가 한쪽으로 치우치지 않게 가중 샘플링.

---

## 5. UI / 인터랙션

### 5.1 레이아웃 (세로 모바일 기준)
```
[Header: 점수 / 콤보 / 최고기록]
[Board 10x10 — 화면 너비 90%, 정사각형]
[PieceTray — 현재(큰) + 다음2(작게)]
```

### 5.2 셀 크기
- `cellSize = floor((screenWidth - 2*padding) / 10)`
- 보드 컨테이너는 정사각형, `aspectRatio: 1`.

### 5.3 드래그 배치
- `react-native-gesture-handler` + `react-native-reanimated` (이미 의존성 존재 가정, 없으면 추가).
- `DraggablePiece` 가 절대좌표로 떠 있고, `onUpdate`에서 보드 좌표 환산.
  - `targetCell = floor((dragX - boardOriginX) / cellSize)`
  - 손가락 위치 위쪽에 약간 오프셋(터치 가림 방지).
- 드래그 중 보드 위에 **고스트 미리보기** 표시: `canPlace`이면 강조색, 아니면 빨간색.
- 손 떼는 순간 (`onEnd`) 유효하면 dispatch `place`, 아니면 원위치 스프링.

### 5.4 회전
- 트레이의 현재 블록을 **탭** → 90° 회전 (`rotate` action).
- 드래그 중 두 번째 손가락 탭 회전은 추후 검토 (MVP 제외).

### 5.5 시각 디자인 토큰
- 플레이어 블록: 사이즈별(1~5칸) HSL 팔레트 — `src/lib/blockmatch/colors.ts` 의 `BASE` 정의 + per-shape variation. 각 셀은 4면 베벨(top +15 / left +6 / right −15 / bottom −30) + top-left 하이라이트 페인팅 (penta_block_blast `beveled_block.dart` 채용).
- 렌더 엔진: **`@shopify/react-native-skia` 명령형 모드**. 게임 플레이 영역 전체를 **단일 `<Canvas>`** 한 개 native view로 그림. `useDerivedValue` worklet이 `Skia.PictureRecorder`로 imperative draw → `<Picture>` 교체로 React 개입 없이 시각 갱신. 도입 배경: `docs/adr/001-skia-for-blockmatch.md` (Skia 도입) + `docs/adr/002-single-canvas-imperative.md` (단일 Canvas + imperative 전환).
- 깜빡임 케이스(드래그 시작, 배치, 복귀, 미리보기 교체)는 모든 시각 업데이트가 한 worklet pass에서 끝나므로 구조적으로 발생하지 않는다.
- 보드 배경: `Palette.boardWarm.background` (`#FAF7F2`). 다크모드에서도 항상 웜 라이트 톤 고정.
- 빈 칸: `Palette.boardWarm.emptyTint` (`#F0E9DA`) — 보드 배경보다 살짝 어두운 tint 로 그리드감 형성.
- 그리드라인: `Palette.boardWarm.gridLine` (`#E5DCC9`) — 명시적 보더 대신 보드 vs emptyTint 색차로 구현. 추후 hairline 보더 추가 여지.
- 장애물 색상 (M3 확정 전 가안):
  - basic   → 진한 회색 `#5A554D`
  - horiz   → `#C8773A` (오렌지) + 가로 줄무늬
  - vert    → `#5C4A8F` (퍼플) + 세로 줄무늬
  - durable → `#A05E28` + 작은 숫자 `2`
- 장애물 셀은 이번 라운드에서 베벨 미적용 (별도 시각 언어 유지).

### 5.6 애니메이션
- 라인 클리어: 200ms 페이드+축소.
- 콤보 발생: 점수 패널 살짝 펄스.
- 장애물 파괴: 채도 빠지며 사라짐.

---

## 6. 영속성

`src/lib/storage.ts` 의 MMKV 인스턴스를 그대로 사용한다.

```ts
type BlockMatchPersist = {
  highScore: number;
  lastSession?: GameState;  // 진행 중 게임 복원 (선택)
};

const KEY_BM_HIGH = 'blockmatch:highScore';
const KEY_BM_SESSION = 'blockmatch:session';
```

- 게임 종료 시 highScore 갱신.
- 진행 중 세션 저장은 M2에서 제외하고, 화면 이탈 시 게임이 일시 중단되도록만 (앱 backgrounding 시점은 추후).

---

## 7. 화면 전환

- `app/(tabs)/puzzle/blockmatch.tsx` 가 `BlockMatchGameScreen` 컴포넌트를 렌더.
- 게임 오버 시 모달:
  - "다시하기" → reducer `restart`
  - "퍼즐 홈으로" → `router.back()`
- 퍼즐 홈(`app/(tabs)/puzzle/index.tsx`) 의 블록매치 카드에서 `comingSoon: true` 제거 + `byline` 수정. (M2 완료 시점에)

---

## 8. 테스트 전략

순수 함수 로직은 jest로 단위 테스트:
- `pieces`: 회전이 4·8 종류로 정규화되는지, 거울상 중복 제거.
- `board.canPlace` / `applyPlace`: 경계, 충돌, 정상 케이스.
- `lineClear`: 다중 라인 동시, 장애물 hp 감소, 가로 전용 장애물이 세로 클리어에 반응 안 함.
- `score`: 1~5줄, 콤보 가산, 장애물 보너스.
- `engine.reduce('place')` 종합 시나리오: 게임 오버 판정 포함.

UI 테스트는 MVP 범위 외(수동 QA).

---

## 9. 의존성 점검

| 필요 | 현재 보유 | 비고 |
|------|----------|------|
| react-native-gesture-handler | 확인 필요 | expo-router가 의존 → 보통 설치됨 |
| react-native-reanimated | 확인 필요 | 동상 |
| react-native-mmkv | ✅ (`storage.ts`) | 그대로 사용 |
| zustand | 확인 필요 | 없으면 useReducer 로 대체 |

> 본 계획 승인 후 `package.json` 점검 → 누락된 것만 설치.

---

## 10. 작업 순서 (M1 → M2 체크리스트)

### M1
1. `src/lib/blockmatch/types.ts` — 타입 정의
2. `pieces.ts` — 폴리오미노 enumerate + 회전/거울상 + 정규화
3. `board.ts` — `canPlace`, `applyPlace`, 헬퍼
4. `lineClear.ts` — 라인 감지 + 장애물 데미지
5. `score.ts` — 점수/콤보
6. `generator.ts` — 시드 PRNG, 블록 큐, 스테이지 생성
7. `engine.ts` — `initialState`, `reduce`, `canPlaceAnywhere` (게임 오버)
8. (선택) jest 테스트

### M2
9. `Cell.tsx` / `Board.tsx` — 정적 렌더
10. `PieceTray.tsx` — 미리보기 + 회전 탭
11. `DraggablePiece.tsx` — gesture + ghost preview
12. `ScorePanel.tsx`, `GameOverSheet.tsx`
13. `app/(tabs)/puzzle/blockmatch.tsx` 교체 — `BlockMatchGameScreen` 마운트
14. MMKV highScore 저장
15. 퍼즐 홈 카드 `comingSoon` 해제

---

## 11. 열어둔 결정 사항

- **블록 큐 정책**: bag 기반(균형) vs 완전 랜덤 + 가중치. 디폴트는 가중치, 플레이테스트 후 결정.
- **트레이 슬롯 배치 자유도**: 명세는 "현재 1개"만 배치. 사용성 위해 next도 드래그 허용할지는 M2 후반 결정.
- **회전 UX**: 탭 회전 외에 트레이에서 두 손가락 회전 제스처를 줄지.
- **모바일 햅틱**: 라인 클리어/배치/오류 시 햅틱 추가 여부 (Expo Haptics).
- **다크모드 대응**: 장애물 색이 다크 배경에서 충분히 대비되는지 별도 토큰 필요.

---

## 12. 한 줄 정의 (재인용)

> "랜덤 생성된 퍼즐 환경에서 블록을 배치해 장애물을 제거하고 최고 점수를 노리는 로그라이크 라인 퍼즐 게임"
