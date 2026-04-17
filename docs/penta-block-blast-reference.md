# penta_block_blast 구현 레퍼런스

> 대상: `/Users/blue/Documents/GitHub/penta_block_blast/` (Flutter)
> 용도: `app/(tabs)/puzzle/blockmatch` (RN · Reanimated 4 · Skia) 포팅을 위한 구현 참조
> 작성일: 2026-04-17
> 관련 문서:
> - `docs/blockmatch-plan.md` (angelica 측 구현 계획)
> - `docs/blockmatch-ui-comparison.md` (비주얼 톤 비교)

---

## 0. 개요

penta_block_blast는 **9×10 블록 퍼즐** Flutter 게임이다. 이 문서는 다음 5축을 한 곳에 정리한다.

1. 아키텍처 — 보드 상태 표현, 데이터 흐름
2. 보드 UI — 레이아웃·그리드·배경
3. 블록 UI — 베벨 셀·특수 블록·트레이 프리뷰
4. 애니메이션·햅틱·사운드
5. **블록 생성 로직** + **움직임/드래그 로직** (핵심)

RN 포팅 관점의 매핑 팁은 각 섹션 끝과 마지막 부록에 모았다.

---

## 1. 아키텍처 요약

### 1.1 핵심 파일 트리

```
lib/
  core/
    board.dart              Board / BoardSize
    board_bits.dart         90-char ASCII 보드 표현 (핫패스)
    board_utils.dart        isFilled / canPlace / setCells 등
    point.dart              Point, rotateCW90
    placement.dart          Placement 결과 모델
    rotation_cache.dart     회전별 정규화 cells/bbox 캐시
    shape_definition.dart   ShapeDefinition (id, cells, color?)
    shape_colors.dart       shapeColorFor(id, shapeOrder, palette)
    shape_validator.dart    cells 검증
  game/
    engine/
      spawn.dart            ★ PRNG + 가중치 스폰
      turn_engine.dart      배치→클리어→큐 advance 일괄 처리
      line_clear.dart       터치된 행/열만 스캔
      ghost_calculator.dart 후보 검사
      ghost_logic.dart      고스트 상태 관리
    coordinators/
      game_input_handler.dart  ★ 드래그 수명주기
      drag_geometry.dart       ★ 핑거→피스 오프셋
      ghost_snapper.dart       ★ 스냅 + 히스테리시스
      minimap_drag_logic.dart  미니맵 좌표 매핑
      game_color_manager.dart  shape→color 배정
      game_animation_manager.dart, game_turn_manager.dart ...
    components/
      beveled_block.dart    ★ 4면 사다리꼴 + 하이라이트
      special_block.dart    특수 블록 점멸
      board_cell.dart, ghost_cell.dart
      game_board_section.dart
      painters/board_painter.dart
      shape_preview.dart    트레이 프리뷰
      drag_preview_overlay.dart
      rainbow_stagger_overlay.dart
  services/
    haptic_service.dart     ★ 햅틱 매핑
    sound_service.dart      ★ SFX 매핑
```

### 1.2 상태 구분

| 계층 | 위치 | 예 |
|---|---|---|
| Persistent | `GameState` (VM) | `boardBits`, `currentShapeId`, `previewQueue`, `gameSeed`, `drawIndex`, `rotationIndex`, 콤보/홀드 |
| Transient (gesture) | `GameInputHandler` | `_tapStartPosition`, 드래그 위치, `_hasDragged`, `_hasEnteredMinimap`, 마지막 고스트 |
| Static | 모듈 로드 시 | `RotationCache` 전체, 색 맵, 스폰 가중치 테이블, 도형 정의 |

**per-frame**: 고스트 스냅 계산 (드래그 업데이트마다).
**once per action**: `TurnEngine.apply` (배치 커밋), 큐 advance, 라인 클리어.

---

## 2. 보드 표현

### 2.1 `boardBits` — 90문자 ASCII 문자열

9×10 보드를 **2D 배열이 아닌 90글자 문자열**로 저장. `codeUnitAt()` 직접 접근이라 파싱 오버헤드 0.

| 문자 | 코드 | 의미 |
|---|---|---|
| `'0'` | 48 | 빈 칸 |
| `'1'` | 49 | 일반 블록 |
| `'2'` | 50 | 특수 (generic) |
| `'3'` | 51 | 특수 (horizontal) |
| `'4'` | 52 | 특수 (vertical) |
| `'5'` | 53 | 아머 |
| `'6'` | 54 | 아머 cracked |

인덱스: `boardIndex(x, y) = y * 9 + x` (row-major).

### 2.2 회전 캐시

`RotationCache`는 도형별 4회전 결과(정규화 cells + bbox width/height)를 **앱 시작 시 1회 계산**해 테이블로 보관. 런타임 회전 계산 0.

회전 알고리즘: `Point(y, -x)` → 정규화(min X/Y=0).

---

## 3. 보드 UI

### 3.1 크기 계산 (`game_board_section.dart`)

```
cellSize = min(availW / 9, availH / 10)
boardWidth  = cellSize * 9
boardHeight = cellSize * 10
```

- 좌우 패딩 16px, 상하 마진 0.
- `prioritizeWidth` 플래그로 좁은 화면에서 가로 우선 모드 선택 가능.
- `ClipRRect(BorderRadius.circular(2))` — 2px 라운딩. 그림자·elevation 없음.

### 3.2 그리드 렌더 (`_BoardPainter`)

- 배경: `AppPalette.boardBackground = #C04909` (번트 오렌지).
- 그리드 선: `#FFF6DF`, `strokeWidth = 1.0 / devicePixelRatio` (1 물리 픽셀).
- **anti-alias off**, `_snapToPhysicalPixelCenter`로 물리 픽셀 센터 스냅 → shimmer 방지.
- 전체 선을 단일 Path에 모아 한 번에 `drawPath` (per-cell 루프 없음).

### 3.3 채워진 셀 외곽선

`_BoardBlockGridPainter`가 별도로 채워진 셀의 **노출된 엣지만** 0.5px `#FFF6DF`로 그려 덩어리 분리감 강조.

### 3.4 빈 셀 드래그 하이라이트

- 유효 타겟: `#E1FF00` (노랑) @ **0.3 alpha**.
- 무효 타겟: `grey` @ 0.3 alpha.

### 3.5 고스트 (`_GhostCell` + `_GhostBlockOutlinePainter`)

- **채움**: 현재 피스 색 @ **0.6 alpha**, `bevelFraction 0.20` (실 블록 0.18보다 약간 큼).
- **외곽선 (2-layer)**:
  - Outer glow: 피스 색 @ 0.4 alpha, `strokeWidth 2.0`, blur 8.0px
  - Main line: 피스 색 full, `strokeWidth 1.5`, blur 3.0px
- 글로우 먼저, 메인선 overlay 순.

---

## 4. 블록 UI

### 4.1 베벨 수학 (`BeveledBlock`)

셀 한 변 S에서:
```
clampedBevel = min(S * bevelFraction, S / 2)
```
`bevelFraction` 기본 0.18 (고스트 0.20).

**4면 사다리꼴 HSL Lightness 보정**:

| 면 | 보정 | 의도 |
|---|---|---|
| Top | **+0.15** | 가장 밝게 (광원 상단) |
| Left | **+0.06** | 약간 밝게 |
| Right | **−0.15** | 어둡게 |
| Bottom | **−0.30** | 가장 어둡게 |
| Inner | ±0 (베이스) | 본체 |

Inner rect: `(bevel, bevel) → (W-bevel, H-bevel)`.

### 4.2 내부 하이라이트 (광택)

linear gradient (SVG 43×43 기준 좌표계를 셀 크기로 스케일):

- 방향: (8,8) → (35,21) (좌상 → 우중하)
- 색: `offWhite`, alpha `0.69 * blockOpacity`
- 3 stops: `(0.370, 1.00)`, `(0.688, 0.658)`, `(1.00, 0.20)`

상단부 위주의 젖은 느낌(wet/glossy).

### 4.3 개별 블록 라운딩

**없음** (corner radius 0). 그리드와 베벨만으로 덩어리감 형성.

### 4.4 특수 블록 (`SpecialBlock`)

베이스: `#C5C5C5` (armor `#A0A0A0` + 10% radius + 4 볼트, cracked `#808080` + 지그재그 stroke 6%).

내부 아이콘 `#E1FF00` 노랑 (generic은 중앙 빨강 점 `#FF0000`).

**점멸 애니**: 1000ms 주기, `Curves.easeInOutSine`, alpha 0 ↔ 1.

### 4.5 트레이 프리뷰 (`ShapePreview`)

- 컨테이너는 `maxExtent * cellSize` **정사각형** (회전 시 레이아웃 흔들림 방지).
- 피스 센터 정렬: `margin = (squareSize - actualDim) / 2`.
- 보드와 **동일 `cellSize`** 사용 (1:1).
- 회전 시 `AnimatedRotation`, turns 값 `±0.25` 단위, ~200ms linear, 컨테이너 중심 기준.

---

## 5. 애니메이션 카탈로그

| 이벤트 | duration | 속성 | 커브 | 비고 |
|---|---|---|---|---|
| 회전(탭) | ~200ms | `turns` ±0.25 | linear | AnimatedRotation 기본 |
| 배치 settle | 즉시 | — | — | 바운스/스냅 애니 없음 |
| 라인 클리어 | 200~400ms | flash→fade | row별 stagger | row당 50~100ms |
| 콤보 배지 pop | 800ms | scale + opacity + 색 | scale `easeOut`, opacity linear | |
| 리워드 하이라이트 | 800ms (펄스 500ms) | frame pulse | `easeInOutSine` | `rewardHighlightController` |
| Rainbow stagger | **1200ms** | 행별 opacity+scale | opacity `easeOut`, scale `easeOutBack` | 아래 참조 |
| 아이템 획득 궤적 | 800ms | 곡선 이동 + 회전 + scale(1→0.5) + opacity | pos `easeOut`, rot `easeInOut` | index*100ms stagger |
| 스테이지 클리어 풀 시퀀스 | 500+1200+1000+600ms | rainbow → fill → message → modal | — | 4-phase |

### 5.1 Rainbow stagger 상세 (`rainbow_stagger_overlay.dart`)

- `rowDurationRatio = 0.4` → 행당 **480ms**
- `staggerDelayRatio = (1 - 0.4) / 9 ≈ 66.7ms` 간격
- reveal (start): bottom → top
- cover (end): top → bottom

### 5.2 관찰: 배치/무효 릴리즈 모두 애니 없음

유효 배치는 보드가 즉시 업데이트(텔레포트). 무효 릴리즈도 프리뷰가 그냥 사라짐 — shake, bounce, return-to-tray 애니 전부 부재. **피드백은 햅틱·사운드로만** 전달.

---

## 6. 햅틱 & 사운드

### 6.1 햅틱 (`HapticService`)

- 모두 `_settings.isHapticEnabled` 게이트.
- iOS: `HapticFeedback` 네이티브.
- Android: `vibration` 패키지 — `[delays]` + `[intensities]` 페어.

| 이벤트 | 패턴 |
|---|---|
| dragSnapLight | iOS light / Android 30ms @ 100 |
| light / medium / heavy | 30 / 50 / 80 ms @ 100 / 180 / 255 |
| selection | 20ms @ 100 |
| itemAcquired | delays [0,30,60,80], intensities [0,128,0,255] — 2펄스 light→heavy |
| specialBlockCleared | [0,80,80,30], [0,255,0,128] — heavy→light |
| rewardHighlighted | 3펄스 medium·medium·heavy |
| settingsMenuStaggered | 5×20ms, 40ms 간격 |
| hapticToggleEnabled | 3펄스 heavy·medium·heavy |
| onboardingTargetHighlighted | 쉐이크 4×40ms + 스케일업 3×(80/120ms) |

### 6.2 사운드 (`SoundManager`, `audioplayers`)

에셋당 `AudioPlayer` 캐시, 재생 중 재트리거 시 auto-restart. `_settings.isSoundEnabled` 게이트.

| 이벤트 | 파일 |
|---|---|
| 게임 시작 | `sfx/game_start.ogg` |
| 피스 선택/회전 | `sfx/select_block.ogg` |
| 홀드 | `sfx/hold_block.ogg` |
| 배치 | `sfx/snap_block.ogg` |
| 단일 라인 클리어 | `sfx/clear_line_[a-e].ogg` 랜덤 |
| 다중 라인 | `sfx/clear_line_multiple_[a-c].ogg` 랜덤 |
| 콤보 1~4x | `good.ogg` / `great.ogg` / `excellent.ogg` / `amazing.ogg` |
| 버튼 클릭 | `sfx/click.ogg` (**80ms 스로틀**) |
| 설정 오픈 | `sfx/open_settings.ogg` |

### 6.3 시각 보조 효과

- 콤보 배지: `#FF4F2A` 코랄 골드 글로우 + 펄스
- 리워드 프레임: `#FFD84D` 골드
- 라인 클리어: 피스 색 섬광 200~400ms
- 고스트: 피스 색 @0.4 지속 글로우

---

## 7. 블록 생성 로직 ★

### 7.1 결정적 PRNG (`spawn.dart`)

```dart
int _mixSeed(int gameSeed, int drawIndex) =>
    gameSeed ^ (drawIndex * 0x9E3779B9);

int _mix32(int v) {
  v = (v ^ (v >> 16)) * 0x85EBCA6B;
  v = (v ^ (v >> 13)) * 0xC2B2AE35;
  return v ^ (v >> 16);
}

int _nextIndex(int gameSeed, int drawIndex, int modulo) =>
    _mix32(_mixSeed(gameSeed, drawIndex)).abs() % modulo;
```

**상수**
- `0x9E3779B9` — golden-ratio / FNV 상수
- `0x85EBCA6B`, `0xC2B2AE35` — Murmur3 32bit fmix 계수

**핵심 관례**: 한 draw에서 2번 뽑을 때 `drawIndex*2`와 `drawIndex*2+1`로 스트림 분리 (stage1=셀 수, stage2=그룹 내 도형).

### 7.2 가중치 테이블

```dart
const _cellCountWeights    = {1:10, 2:7,  3:5,  4:3,  5:2};   // 'weighted'
const _polyominoTypeWeights = {1:3, 2:7, 3:15, 4:60, 5:15};   // 'polyomino-weighted' (기본)
```

**기본 정책 분포** (합계 100):

| 셀 수 | 확률 | 대표 도형 |
|---|---|---|
| 1 | 3% | monomino |
| 2 | 7% | domino |
| 3 | 15% | L/I tromino |
| 4 | **60%** | tetromino (I/O/T/S/Z/L/J) |
| 5 | 15% | pentomino |

같은 셀 수 그룹 내에선 uniform.

### 7.3 파이프라인

```
드래그 릴리즈
  → GameInputHandler.handleDragEnd
  → onPlacement(x, y)
  → GameViewModel.onPlacement
  → GameTurnManager.executeTurn
  → TurnEngine.apply:
      1. setCells (boardBits 갱신)
      2. 라인 클리어 (터치된 행/열만 스캔)
      3. advanceQueue:
          current = queue[0]
          queue.removeAt(0)
          queue.add(spawnNext(gameSeed, drawIndex++, policy))
      4. 콤보/홀드 플래그 리셋
  → GameColorManager.syncColorsFromState
  → GameUiState emit → ShapePreview 리렌더 (애니 없음, 원프레임 시프트)
```

### 7.4 색 배정 (`GameColorManager`)

```
color = shape.color?? palette[shapeOrder.indexOf(id) % palette.length]
```

- 도형 SVG에 명시 색이 있으면 override.
- 없으면 **shapeOrder 기반 결정적 매핑** — 같은 shape ID는 세션 내 항상 같은 색.
- 거울쌍(L4/J4, S4/Z4)은 팔레트 앞/뒤로 분산해 시각 구분감 확보.

### 7.5 스테이지 덱 모드

```
if (stage?.hasFixedDeck == true) {
  use stage.deck[deckIndex++]
  if (deckIndex >= deck.length) gameOver()
} else {
  spawnNext(gameSeed, drawIndex++, 'polyomino-weighted')
}
```

---

## 8. 움직임 로직 ★

### 8.1 드래그 수명주기 (`game_input_handler.dart`)

1. `handleTapDown` — `_tapStartPosition` 기록, `_hasDragged = false`.
2. `handleDragStart` — 상태만 검증, 실제 드래그는 첫 델타까지 지연.
3. `handleDragUpdate`:
   - **최초 이동** (`details.delta.distance > 0` && `!_hasDragged`): 드래그 활성화, 미니맵 중심 고정.
   - **이후**: 위치는 **델타 누적** (`current + delta`, 절대값 아님 → 프레임 간 보간 부드러움).
   - 매 프레임 `_updateGhostInMinimapMode()` 호출.
4. `handleDragEnd`:
   - `ghostValid && ghostAnchor != null` → `onPlacement(x, y)` 비동기 호출.
   - 아니면 silently 취소 (피드백 없음).
5. `handleTap` (이동 없었음) → **시계방향 회전**.

**거부 조건**: game-over phase ≠ idle, `canDragShape() == false` (onboarding 등).
**최소 이동 임계**: 없음 — 첫 논제로 델타가 임계.

### 8.2 핑거→피스 오프셋 (`drag_geometry.dart`)

```dart
Offset shapeTopLeftFromFinger(Offset finger, RotationState rot, double cellSize) {
  final w = rot.width * cellSize;
  final h = rot.height * cellSize;
  return Offset(
    finger.dx - w * 0.5,     // 수평: 피스 중앙을 손가락에
    finger.dy - h - 40,      // 수직: 바닥중앙이 손가락보다 40px 위
  );
}
```

- **40px 상향 오프셋** — 손가락에 피스가 가려지지 않게.
- 픽업 시 scale/opacity 변화 없음.
- 프리뷰는 최상위 오버레이(`DragPreviewOverlay`)로 렌더, 좌표는 global→local 변환해 보드와 정렬.

### 8.3 고스트 스냅 (`GhostSnapper.snap`)

```
rawCenterX = anchorLocal.dx / cellSize    // 연속 좌표 (0.0 ~ 9.0)
rawCenterY = anchorLocal.dy / cellSize

// 1) 보드 바깥 → invalid (위치는 히스테리시스용으로 리턴)
if (outside) return invalidAt(rawCenter)

// 2) 가장 가까운 셀
anchorX = clamp(floor(rawCenterX), 0, 8)
anchorY = clamp(floor(rawCenterY), 0, 9)

// 3) 셀 중심까지 거리²
dx = rawCenterX - (anchorX + 0.5)
dy = rawCenterY - (anchorY + 0.5)
distSq = dx*dx + dy*dy

// 4) SHOW threshold
if (distSq > SHOW_THRESHOLD_SQ = 0.5) return invalidAt(...)

// 5) shape origin 보정
originX = anchorX - rot.topLeftMostCell.x
originY = anchorY - rot.topLeftMostCell.y

// 6) 배치 가능성
valid = canPlaceBits(boardBits, rot, originX, originY)

// 7) Hysteresis
if (valid && lastValid && distSq < KEEP_THRESHOLD_SQ = 2.25)
  return keepPreviousGhost()

return GhostSnapResult(originX, originY, valid, distSq)
```

**두 임계값** (튜닝 최대 민감 파라미터):

| 상수 | 값 | 의미 |
|---|---|---|
| `SHOW_THRESHOLD_SQ` | **0.5** | 고스트가 처음 보이기 시작하는 반경 (≈0.707셀) |
| `KEEP_THRESHOLD_SQ` | **2.25** | 한 번 스냅됐으면 1.5셀 반경까지는 유지 → **지터 억제** |

### 8.4 미니맵 모드 (`minimap_drag_logic.dart`)

- 상수: `minimapSize = 300`, `minimapAspectRatio = 0.9`, `verticalOffset = 160`, `fingerYOffset = 30`.
- **발동**: 손가락이 트레이 위 300×(300/0.9 ≈ 333)px Rect에 진입.
- **좌표 매핑**:
  ```
  relative = (finger - minimapRect.origin) / minimapSize   // [0,1]
  boardPx  = relative * boardSize                          // 정비례 1:1
  ```
- 일반 모드의 **−40px Y 오프셋은 미니맵 모드에선 제거** (핑거 = 피스 중심).
- sticky: `_hasEnteredMinimap = true` 이후 살짝 벗어나도 해제되지 않음.

### 8.5 회전 (탭)

- 버튼 탭 → `ShapePreview._currentTurns ± 0.25`.
- `AnimatedRotation` ~200ms linear, 정사각 컨테이너 중심 기준.
- 회전 즉시 **고스트 재평가** (애니 대기 없이 동기).

### 8.6 릴리즈 반응

| 케이스 | 시각 | 오디오·햅틱 |
|---|---|---|
| 유효 | 보드 즉시 스냅 (바운스 없음) | `playSnap()` + 햅틱 snap |
| 무효 | 프리뷰 사라짐 (페이드 없음) | **없음** |

---

## 9. 라인 클리어 & 턴 엔진

### 9.1 `line_clear.dart` 최적화

- **터치된 행/열만** 스캔 (`placedYIndices`, `placedXIndices`). 전체 보드 순회 안 함.
- `indicesToClear` 마킹 후 **일괄 소거** (한 번의 순회로 멀티 라인 처리).
- 세로 특수 블록은 가로 라인에서 살아남음 (직교 보존).
- 아머는 소거 대신 **상태 변이** `'5' → '6'`.

### 9.2 `TurnEngine.apply` 순서

1. `setCells` → boardBits 갱신
2. 라인 감지 + 클리어
3. `_advanceQueue()` → 새 피스 스폰
4. 콤보·홀드 플래그 리셋
5. 새 `TurnResult` 리턴

---

## 10. RN/Reanimated 4/Skia 포팅 매핑

| 원본 | RN/Expo 매핑 |
|---|---|
| `boardBits: String` | `SharedValue<string>` (90char) 또는 `Uint8Array` |
| `RotationCache` | 모듈 로드 시 정적 JS 객체 생성 |
| 도형 색 맵 | `useMemo` + 팔레트 해시 키 |
| `GhostSnapper.snap` | **worklet 함수** — 매 프레임 드래그 업데이트에서 호출 |
| 드래그 위치·고스트 | SharedValues (finger, anchor, valid), `useAnimatedReaction`으로 Skia 커밋 |
| `TurnEngine.apply` | 일반 JS (배치 시점 1회, `runOnJS`) |
| `BoardPainter` | Skia `Canvas.drawPath` 단일 path + `antiAlias: false`, 물리픽셀 스냅 |
| `BeveledBlock` | Skia 4 trapezoid paths + 내부 `LinearGradient` (lightness ±0.15/0.06/0.15/0.30) |
| `ShapePreview` | Skia canvas OR RN View + `useAnimatedStyle` 회전 |
| `DragPreviewOverlay` | `Portal` or absolute-positioned Animated.View 최상위 |
| PRNG | JS로 포트, `>>> 0` 무부호 시프트 주의 (BigInt 불필요) |
| 햅틱 | `expo-haptics` (iOS 매핑) + Android fallback (`Vibration.vibrate([patterns])`) |
| 사운드 | `expo-audio`, 80ms 스로틀 유지 |
| Rainbow stagger | Reanimated `withSequence` + `withDelay(66.7ms * rowIdx)` |

### 10.1 체감 품질 top 5 (이 숫자들만 맞춰도 80%)

1. `SHOW_THRESHOLD_SQ = 0.5`
2. `KEEP_THRESHOLD_SQ = 2.25`
3. 드래그 핑거 → 피스 바닥 **+40px 위**
4. 베벨 lightness **±(0.15 / 0.06 / 0.15 / 0.30)**
5. 스폰 가중치 **(3, 7, 15, 60, 15)**

### 10.2 지연 없이 가져올 것

- `isFilled` 등 보드 유틸을 **JS 직접 구현** — 한 글자 문자열 비교로 끝.
- 회전 캐시 정적화.
- 라인 스캔 시 터치된 인덱스만 순회.
- `antiAlias: false` + 픽셀 센터 스냅 (그리드 shimmer 방지).

### 10.3 잠재 함정

- **absolute 좌표가 아닌 델타 누적** 드래그 추적 (프레임 보간 부드러움).
- 40px 오프셋을 **미니맵 모드에선 제거**.
- 미니맵 진입 sticky.
- 세로/가로 특수 블록의 직교 보존 룰.
- 아머는 클리어가 아닌 상태 변이.
- 탭과 드래그 구분은 `_hasDragged` 플래그로 — 최소 거리 임계는 없음.

---

## 11. 파일 크로스-레퍼런스

| 궁금할 때 | 원본 파일 |
|---|---|
| 보드 표현 | `lib/core/board_bits.dart`, `board.dart` |
| 도형 정의·회전 | `lib/core/shape_definition.dart`, `rotation_cache.dart` |
| 스폰·PRNG | `lib/game/engine/spawn.dart` |
| 드래그 수명주기 | `lib/game/coordinators/game_input_handler.dart` |
| 오프셋 공식 | `lib/game/coordinators/drag_geometry.dart` |
| 고스트 스냅 | `lib/game/coordinators/ghost_snapper.dart` |
| 미니맵 | `lib/game/coordinators/minimap_drag_logic.dart` |
| 색 배정 | `lib/game/coordinators/game_color_manager.dart`, `lib/core/shape_colors.dart` |
| 배치 커밋 | `lib/game/engine/turn_engine.dart` |
| 라인 클리어 | `lib/game/engine/line_clear.dart` |
| 베벨 렌더 | `lib/game/components/beveled_block.dart` |
| 특수 블록 | `lib/game/components/special_block.dart` |
| 보드 페인터 | `lib/game/components/painters/board_painter.dart` |
| 트레이 | `lib/game/components/shape_preview.dart` |
| 드래그 오버레이 | `lib/game/components/drag_preview_overlay.dart` |
| Rainbow stagger | `lib/game/components/rainbow_stagger_overlay.dart` |
| 햅틱 | `lib/services/haptic_service.dart` |
| 사운드 | `lib/services/sound_service.dart` |
