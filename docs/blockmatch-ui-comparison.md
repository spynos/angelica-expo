# 블록매치 UI 비교 — penta_block_blast vs angelica-expo

> 대상: `app/(tabs)/puzzle/blockmatch` UI 강화 작업
> 비교 기준: Flutter 레퍼런스 프로젝트 `penta_block_blast` (`/Users/blue/Documents/GitHub/penta_block_blast/`)
> 작성일: 2026-04-16

---

## 0. 목적

`angelica-expo`의 블록매치 화면을 시각적으로 강화하기 위해, 동일 장르의 Flutter 레퍼런스 프로젝트(`penta_block_blast`)를 분해해 본 결과를 정리한다. 본 문서는 **현황 비교 + 우선순위 제안**까지 다루고, 실제 구현 결정은 별도 ADR 또는 plan 문서에서 관리한다.

---

## 1. penta_block_blast 비주얼 정체성

### 1.1 컬러 / 톤
- **항상 다크/웜 톤** (라이트 모드 없음).
- 배경 그라디언트: `#F5740B` → `#E85A06` (오렌지).
- 보드 셀: 크림/탄 `#FAD9C4`, 그리드라인 `#FFF6DF`, 보드 배경 `#C04909`.
- 텍스트: 오프화이트 `#FFF6DF`, 강조 골드 `#FFD84D`, 콤보 코랄 `#FF4F2A`.
- **Rainbow 7색 배열** (특수 효과용): 빨/주/노/초/파/보/바이올렛.

### 1.2 시그니처 시각 요소

#### Beveled Block (`lib/game/components/beveled_block.dart`, 184줄)
하나의 base color에서 4면을 HSL Lightness 보정으로 페인팅:
- Top: **+15%** (가장 밝음)
- Left: **+6%**
- Right: **−15%**
- Bottom: **−30%** (가장 어두움 — 깊이감)

추가로 top-left에 **SVG 변환된 트라페조이드 하이라이트 그라디언트** (offWhite → 0.658 opacity → 투명).
**블록을 회전해도 하이라이트는 항상 12시 방향 유지** — 회전 카운터밸런스 처리.
ghost 블록은 동일 페인팅에 opacity 0.5 + bevel 비율 0.20.

#### Combo Badge (`combo_badge.dart`, 189줄)
- 코멧 모양 이미지(`combo_bg.png`) + 텍스트 오버레이.
- Spawn: scale 0 → **1.3 overshoot** → 1.0 (400ms).
- Decay: 1.0 → 0.95 (180ms).
- Visible 동안 펄스 루프: 1.0 ↔ 1.04 (1100ms, sine easing).

#### Line Clear Effect (`line_clear_effect.dart`, 300+줄)
- 블록 shrink + fill color 페이드 (블록 shrink 120ms).
- Fill fade-in 220ms / hold 160ms / fade-out 220ms.
- **사각 speck 파티클 버스트** (블록당 4×4 그리드, velocity + gravity).
- Row/Column/Area별 stagger 지연 (행 30ms, area 50ms 단위).

#### Rainbow Stagger Overlay (`rainbow_stagger_overlay.dart`, 200+줄)
- 보드 전체에 7색 그라디언트가 행 단위로 채워졌다 사라짐.
- Appear: 아래→위 stagger (easeOutBack scale).
- Disappear: 위→아래 (easeInBack).
- 1200ms 총 + 500ms pre-delay.

#### Next Queue Animator (`next_queue_animator.dart`, 300+줄)
- 3-phase: **exit (blackhole shrink)** → shift left → **enter (slide-in from right)**.
- 총 500ms, 사이즈/레이아웃 변화 중 jitter 방지.

### 1.3 타이포그래피 (이중 폰트 시스템)
- **Fugaz One** (google_fonts): 헤드라인, "FANTASTIC!", "STAGE X COMPLETE", 큰 숫자. 36–48px, weight 900.
- **IBM Plex Sans KR**: 본문, 스코어, 라벨. 14–22px, weight 700 강제.
- 헤드라인엔 `Shadow(color: black, offset: (4,4), blurRadius: 10)` + 추가 글로우.
- 모달/오버레이엔 `AutoSizeText`로 반응형 크기.

### 1.4 인터랙션 / 애니메이션 디테일
- **피스 스폰**: scale 0→1 + opacity 0→1 (400ms, 200ms 지연, ease-out).
- **회전**: 200ms easeOutCubic, **최단 경로** (3→0은 역방향).
- **BouncyButton**: 누를 때 1.0→0.95 (100ms), 떼면 spring back.
- **Game Over 모달**: Gaussian blur 5px 백드롭 + scale 0→1 (800ms, **elasticOut**).
- **Drag preview**: 손가락 따라가는 floating overlay, 영역 밖이면 grey-out.
- **Stuck hint**: 유효 수가 없을 때 회전 버튼 펄스 (800ms reverse 반복).
- **사운드**: line clear, combo, button click, game over, stage clear 각각 SFX. BGM 스테이지별 루프.
- **햅틱**: line clear/콤보 시 vibration package 사용.
- **iOS 무음 스위치 감지**, Android **audio focus 복원**.

### 1.5 아키텍처 트릭 (참고)
- **Rotation Cache**: 모든 폴리오미노의 4방향 회전을 시작 시 미리 계산 → O(1) 회전 룩업.
- **Ghost Calculator**: 보드 비트필드(9×9 = 81 bit)로 충돌 검사, 실시간 유효 위치 계산.
- **Mirror pair color assignment**: L/J, S/Z 같은 대칭 쌍에 front/back 컬러를 짝지어 시각적 대칭 유지.
- **Effect Manager**: 라인 클리어/팝업/파티클을 비차단 파이프라인으로 동시 실행. 파티클은 Widget이 아닌 CustomPainter.
- **Layered Rendering**: 보드 배경 → 그리드 → 블록 → 고스트 → 아이템 → 이펙트, 드래그 프리뷰는 `IgnorePointer`로 터치 가로채기 방지.

### 1.6 핵심 파일 (벤치마크 시 참조)
| 파일 | 역할 |
|---|---|
| `lib/app/theme/palette.dart` | 단일 컬러 소스 |
| `lib/game/components/beveled_block.dart` | 3D 베벨 블록 페인터 |
| `lib/game/components/combo_badge.dart` | 콤보 배지 펄스 |
| `lib/game/components/rainbow_stagger_overlay.dart` | 레인보우 stagger |
| `lib/game/effects/line_clear_effect.dart` | 라인 클리어 + 파티클 |
| `lib/game/components/next_queue_animator.dart` | Next 큐 트랜지션 |
| `lib/game/components/game_over_overlay.dart` | Game Over 모달 |
| `lib/game/components/shape_preview.dart` | 회전 카운터밸런스 |
| `lib/core/shape_colors.dart` | mirror pair 컬러 할당 |

---

## 2. angelica-expo 블록매치 현황

### 2.1 비주얼 톤
- **라이트 모드 우선** (배경 `#FAF7F2`, 다크 모드 `#1C1A17`).
- **플랫 컬러 셀**, `Radius.sm` (6px) 둥근 모서리.
- **그림자 / 하이라이트 / 베벨 없음**, 빈 셀에 1px 보더(`#E2DDD3`).
- 미니멀 / 모던 톤.

### 2.2 컬러 시스템 (`src/lib/blockmatch/colors.ts`)
- 사이즈별(1~5칸) HSL base hue + per-shape variation (±8~11° hue, ±8~11% lightness).
- Saturation 52~80% (눈 피로 방지).
- 장애물은 고정 컬러 + 패턴 (스트라이프/도트)로 시각 구분 (`Cell.tsx`):
  - basic `#5A554D`, horiz `#C8773A` + 가로 스트라이프, vert `#5C4A8F` + 세로 스트라이프, durable2 `#A05E28` + 도트, composite `#3D3B38`.

### 2.3 타이포그래피
- **GowunBatang** (한글 본문/제목): `display`, `heading1`(24px), `heading2`, `bodyLg`.
- **AstaSans** (라틴/숫자): `bodyMd`, `bodySm`, `labelLg`, `labelSm`(12px).
- 토큰은 `constants/theme.ts` 강제 사용.

### 2.4 현재 진행 중인 작업 (`feat/blockmatch-upgrade-2`)
최근 커밋이 모두 **고스트 스냅 프리뷰 perf/UX 다듬기**:
- `7875c3f` perf: 고스트를 React 트리에서 분리 (shared values로 이전, UI 스레드 1~3ms stutter 제거)
- `2586e81` feat: 고스트 sticky hysteresis (1.5셀 반경)
- `1be20f6` feat: 드래그 시작 200ms grace period
- `7f71e24` fix: floating fade-in을 snapshot clear commit 이후로 지연
- 이전: spring 회전 애니메이션, 사이즈별 컬러 팔레트, 반응형 트레이.

### 2.5 perf 패턴 (이미 정착된 것)
- **Shared values**: `dragAbsX/Y`, `isDragging`, `floatingOpacity`, `ghostRow/Col/Opacity` — React 재렌더 없이 UI 스레드 갱신.
- **`useAnimatedStyle` 워클릿**: 워클릿 안에서 `runOnJS`로 JS 콜백.
- **Snapshot 패턴**: floating fade-out 동안 직전 스냅샷 표시.
- **메모이제이션**: `PieceShapeView`, `BoardRow` 메모로 부모 재렌더 격리.

---

## 3. Gap 분석 — 무엇이 빠져있는가

| 항목 | penta_block_blast | angelica-expo | Gap |
|---|---|---|---|
| 3D 입체감 (베벨 + 하이라이트) | ✅ CustomPaint | ✅ SVG `BeveledBlock` (`src/components/blockmatch/BeveledBlock.tsx`) | 해소됨 |
| 보드 그리드 (배경/empty 톤차) | ✅ 오렌지 + 크림 | ✅ `Palette.boardWarm` 토큰 (cream + emptyTint) | 해소됨 (톤 다름) |
| 라인 클리어 파티클 | ✅ 사각 speck 버스트 | ❌ 행 페이드만 | **큼** |
| Combo Badge 애니메이션 | ✅ scale + 펄스 + 이미지 | ⚠️ 숫자만 | 중 |
| 피스 스폰 scale-in | ✅ 400ms scale + fade | ⚠️ 페이드만 | 소 |
| Next Queue 트랜지션 | ✅ 3-phase | ❌ 정적 | 중 |
| 점수 팝업 (floating text) | ✅ TextPopupEffect | ❌ | 중 |
| 사운드 + 햅틱 | ✅ 풍부 | ❌ (미확인) | 정책 결정 |
| Game Over 모달 폴리시 | ✅ blur + elasticOut | ⚠️ 기본 Modal | 소 |
| 헤드라인 폰트 임팩트 | ✅ Fugaz One + Shadow | 🟡 GowunBatang (가능) | 소 |
| Rainbow stagger | ✅ 특수 클리어 | ❌ | 보류 (콘텐츠 미정) |
| Stuck hint (회전 펄스) | ✅ | ❌ | 소 |
| BouncyButton | ✅ | ⚠️ 일부 | 소 |

---

## 4. 우선순위 제안 (ROI 순)

### Tier 1 — 시각 정체성 변화가 큰 것
1. **3D 베벨 블록 셀** — ✅ 완료 (1차 SVG 기반 → 후속 `@shopify/react-native-skia`로 전환, `docs/adr/001-skia-for-blockmatch.md`).
2. **라인 클리어 scale+fade + 파티클** — Skia 도입 후 자연스럽게 추가 가능. 한 Canvas 안에 파티클 그리면 native view 추가 0.
3. **피스 스폰 scale-in 추가** — 한 줄 변경 수준 (`DraggablePiece.tsx`). spring scale 추가.

### Tier 2 — 폴리시
4. **Combo Badge 펄스 애니메이션** — 별도 floating 컴포넌트로 분리. 이미지 에셋(코멧)은 디자인 결정 후.
5. **헤드라인 임팩트 강화** — GowunBatang의 size/weight 강화 + `Shadow` (또는 `react-native-svg` 텍스트 글로우).
6. **Game Over Modal 폴리시** — `expo-blur` BlurView + elasticOut spring scale.
7. **Floating Score Popup** — 라인 클리어 시 점수 텍스트 위로 떠오르며 페이드.

### Tier 3 — 복잡도 높음
8. **Next Queue 3-phase 트랜지션** — 마지막 순서. 현재 큐 구조 손봐야 함.
9. **사운드 + 햅틱 통합** — 별도 정책 결정 필요 (앱 전체 톤이 무음 지향이면 보류).

### 보류
- **Rainbow stagger 오버레이**: 게임 콘텐츠(특수 클리어 트리거 시점) 정의 후.

---

## 5. 제약 / 의사결정 필요 항목

### 기술 제약
- `constants/theme.ts` 토큰 사용 강제 — 새 컬러는 토큰화 필요.
- Reanimated 4 + Gesture Handler 2.30 — 워클릿 안에서 `runOnJS`.
- 렌더 엔진은 **`@shopify/react-native-skia`** (Flutter `CustomPainter` 등가물). 도입 결정은 ADR-001.
- `--no-verify` 금지, atomic commit, `/커밋` 슬래시 커맨드 사용.

### 사전 결정 필요
1. ~~**`react-native-skia` 도입 여부**~~ — 결정됨. ADR-001 참고.
2. **다크 톤 채택 여부** — 레퍼런스는 웜 오렌지 게임 톤. 현재 angelica-expo는 라이트 미니멀. 게임 영역만 다른 톤을 쓸지, 일관성 유지할지.
3. **사운드/햅틱 정책** — 앱 전체 정책과 정합.
4. **Fugaz One 같은 게임용 헤드라인 폰트 추가 여부** — 현재 GowunBatang/AstaSans 2종 체제 유지가 원칙이면 보류.

---

## 6. 다음 단계

본 문서를 기반으로, 실제 작업에 들어갈 항목을 골라:
- 단일 항목이면 직접 구현 → `/커밋`.
- Tier 1처럼 구조 변경이 큰 건은 별도 plan 문서 (`docs/blockmatch-ui-uplift-plan.md`) 또는 ADR로 의사결정 기록 후 진행.
