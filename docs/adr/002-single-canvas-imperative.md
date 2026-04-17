# ADR-002: 블록매치를 단일 Canvas + shared-value imperative 렌더로 전환

- **날짜**: 2026-04-17
- **상태**: Accepted
- **관련**: ADR-001 (react-native-svg → react-native-skia 1차 도입, 선언적 컴포넌트)

## 배경

ADR-001에서 `react-native-svg`의 per-element native view 모델이 깜빡임의 근본 원인이라 판단, `@shopify/react-native-skia`로 전환했다. 당시 구현은 **선언적 Skia 컴포넌트** (`<Canvas>` 안에 `<Path>`, `<Rect>`, `<LinearGradient>` 등을 React 트리로 배치)로 유지했다.

이후 다음 문제가 해소되지 않음을 확인:

- 트레이에서 블록 드래그 시작
- 보드에 블록 배치
- invalid 드롭 후 트레이 복귀
- 미리보기 슬롯 piece 교체

여러 라운드의 부분 수정(Canvas 고정 크기, 2 RAF, hide-before-show, fade 제거 등)에도 깜빡임이 지속. 반면 Flutter 레퍼런스 `penta_block_blast`는 같은 케이스에서 깜빡임이 전혀 없음.

**원인 파악**:
- penta = **단일 Flutter build → 단일 CustomPaint**. 상태 변화 → 한 프레임에 모든 paint 완료.
- 우리(선언적 Skia) = **Zustand → React reconcile → react-native-skia child reconcile → Skia native paint**. 각 boundary에서 frame/thread lag 누적.
- React 렌더 사이클이 시각 업데이트 hot path에 끼어있는 한, 부분 수정으론 완전히 제거 불가.

## 결정

**React를 시각 업데이트 hot path에서 완전히 제거**. Flutter CustomPaint 모델과 구조적으로 등가인 아키텍처로 재설계:

- 게임 플레이 영역 전체를 **단일 `<Canvas>`** 한 개 native view로 렌더
- Zustand 게임 상태를 **Reanimated shared value로 미러링** (useEffect로 1회 atomic sync)
- `useDerivedValue` + `Skia.PictureRecorder` 패턴으로 **worklet에서 imperative draw**
- `<Picture picture={derivedPicture} />`를 Canvas 안에 배치 → Picture 객체 교체로 React 개입 없이 시각 갱신
- 제스처만 **투명 RN View overlay**로 Canvas 위에 배치 (hit-test)

시각 업데이트 흐름:
```
shared value write → useDerivedValue worklet 재실행
  → PictureRecorder에 imperative draw 명령
  → finishRecordingAsPicture → <Picture> 갱신
  → Skia GPU paint (React 미개입, 동일 프레임)
```

## 고려한 대안

| 대안 | 장점 | 단점 |
|------|------|------|
| **현재 선택: 단일 Canvas + imperative Picture (shared-value 구동)** | penta와 동등한 렌더 모델, React lag 원천 제거, worklet으로 모든 시각 업데이트 동일 프레임 보장 | 코드 구조 전면 재설계, 레이아웃을 canvas-local 좌표로 모두 계산, 디버깅이 React DevTools 밖 |
| 선언적 Skia + 공유값 props | 구조 변경 최소 | React reconcile 사이클 잔존 → lag 완전 제거 불가 (ADR-001이 이 방향, 실패) |
| View 의사 베벨 + 선언적 조합 | Skia 의존 0 | 품질 저하, 근본 문제 해결 안 됨 |
| 별도 게임 엔진(react-native-game-engine 등) | 게임 전용 최적화 | 생태계 작음, 학습/마이그레이션 비용 큼 |
| 이미지 스프라이트(PNG) | 네이티브 Image 매우 빠름 | 색/크기 조합별 사전 생성, 메모리 증가, 색 변경 유연성 손실 |

## 결과

### 긍정적 효과
- 4가지 깜빡임 케이스(드래그 시작 / 보드 배치 / invalid 드롭 복귀 / 미리보기 교체)가 **구조적으로 불가능**해짐 — 모든 시각 업데이트가 한 worklet pass에서 완료.
- penta와 같은 model 공유 → Tier 2+ 폴리시(파티클, 콤보 펄스, 레인보우 stagger 등) 추가 시 자연스러움.
- 렌더 트리 깊이 대폭 축소: native view 5개(board + tray×3 + floating) → **1개**.
- `useState`(floatingSnapshot, waitingForSpawn 등) 우회 패턴 전부 제거 → 코드 단순화.

### 트레이드오프 / 단점
- 디버깅 시 React DevTools에서 블록매치 UI 구조를 못 봄 (Canvas 안은 Skia worklet).
- 레이아웃을 canvas-local 좌표로 직접 계산해야 함 → 화면 크기 변경(회전 등) 대응 시 재계산 로직 필요.
- gesture는 RN View overlay로 분리 배치 → hit-test 좌표가 어긋나지 않도록 canvas origin 측정(measureInWindow) 필요.
- Skia 워클릿 호환성 주의: Map 대신 배열/플레인 object, React state 직접 참조 금지, closure 객체는 frozen 필요.

### 기존 ADR과의 관계
ADR-001의 `@shopify/react-native-skia` 의존성 도입 결정은 그대로 유효. 본 ADR은 **동일 라이브러리의 사용 패턴을 선언적 → imperative로 전환**하는 상세 결정.

## 관련 파일

### NEW
- `src/lib/blockmatch/useGameSharedValues.ts` — Zustand 상태 → shared value sync hook, 베벨 컬러 pre-compute
- `src/components/blockmatch/skia-drawers.ts`   — worklet imperative draw 헬퍼 (beveled block / piece shape / board cell)
- `src/components/blockmatch/GameSurface.tsx`   — 단일 Canvas + 5 Picture 레이어(static / board / ghost / tray / floating)
- `src/components/blockmatch/GestureOverlay.tsx`— 투명 RN View 제스처 레이어

### MODIFY
- `app/(tabs)/puzzle/blockmatch.tsx` — Board/PieceTray/floating overlay 제거, GameSurface 단일 마운트. 게임 로직 훅만 유지.
- `src/lib/blockmatch/colors.ts`      — `BevelColors` 타입 + `bevelColorsForPieceId` pre-compute 추가

### DELETE (선언적 Skia 컴포넌트들)
- `src/components/blockmatch/Board.tsx`
- `src/components/blockmatch/Cell.tsx`
- `src/components/blockmatch/BeveledBlock.tsx`
- `src/components/blockmatch/PieceShape.tsx`
- `src/components/blockmatch/PieceTray.tsx`
- `src/components/blockmatch/DraggablePiece.tsx`

### UNCHANGED
- `src/lib/blockmatch/engine.ts` / `board.ts` / `lineClear.ts` / `score.ts` / `generator.ts` / `pieces.ts` / `types.ts`
- `src/store/blockmatch.ts`
- `src/components/blockmatch/ScorePanel.tsx`, `GameOverSheet.tsx`
- `constants/theme.ts`
- `@shopify/react-native-skia` 2.4.18 (재설치 불필요)
