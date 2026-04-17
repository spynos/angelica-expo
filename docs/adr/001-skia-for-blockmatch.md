# ADR-001: 블록매치 UI를 `@shopify/react-native-skia`로 전환

- **날짜**: 2026-04-16
- **상태**: Accepted

## 배경

블록매치 보드/블록 시각 강화 작업(`docs/blockmatch-ui-comparison.md` 참고)으로 `BeveledBlock` 입체 페인팅을 도입했고, 1차 구현은 이미 설치돼있던 `react-native-svg` 위에서 진행했다. 이후 두 가지 시각 글리치가 반복적으로 발생:

1. **Drop placement 깜빡임** — placed cell의 SVG가 mount되어 native 페인트가 끝나기까지 1~2 프레임(~30ms) 걸리고, 그 사이 floating piece가 사라져 빈 자리가 노출됨. floating opacity HOLD 패턴(2 RAF)으로 1차 마스킹.
2. **대기열 슬롯 fade 시 "따닥" 더블 블링크** — piece prop이 바뀌면 PieceShape 안의 BeveledBlock 인스턴스들이 unmount/remount되며 새 SVG가 한 프레임 opacity 1로 노출되고, useEffect로 늦게 opacity 0이 적용. Reanimated `entering={FadeIn}`으로 1차 마스킹.

근본 원인은 `react-native-svg`의 **per-element native view 모델**: 한 셀당 SVG 노드 9개 × 100칸 = 900 native view, piece 변경 시마다 React reconciliation + native mount/unmount + paint 파이프라인이 돌아간다. 마스킹 패턴들은 표면 수습일 뿐, `useEffect` 타이밍에 의존하는 이상 다른 폴리시 작업(라인 클리어 파티클, Combo Badge 펄스, Next Queue 트랜지션 등)을 추가할수록 같은 종류의 글리치가 더 도드라질 것으로 판단.

## 결정

블록매치 UI 렌더 레이어를 `react-native-svg`에서 **`@shopify/react-native-skia`**로 전환한다.

- 보드 100칸 + ghost 프리뷰를 **단일 `<Canvas>`** 안에서 페인팅 (`Board.tsx`).
- `BeveledBlock`/`PieceShape`/`Cell`은 Skia children(`<Group>`/`<Path>`/`<Rect>`/`<LinearGradient>`)으로 재작성.
- 트레이 슬롯과 floating piece는 자체 `<Canvas>` 래퍼 사용 (`PieceShapeView`).
- `GhostOverlay` 별도 컴포넌트는 폐기, Board canvas 안 `<Group transform={useDerivedValue(...)}>`로 흡수 — shared value가 워클릿 안에서 직접 ghost 위치/투명도를 구동.
- 페인팅 알고리즘(트라페조이드 좌표, HSL face shift +15/+6/-15/-30, top-left 하이라이트 그라디언트)은 1:1 그대로 유지.

## 고려한 대안

| 대안 | 장점 | 단점 |
|------|------|------|
| **현재 선택: react-native-skia** | Flutter 레퍼런스(penta_block_blast)와 같은 엔진, 단일 native view, 워클릿 직접 페인트 가능, mount cost 0, 향후 파티클·셰이더 자연스러움 | 앱 사이즈 +5~6MB(iOS/Android), dev client 재빌드 필요, 멘탈 모델 전환(선언 → 페인트) |
| react-native-svg + pre-mount pool | 신규 의존성 0, 인프라 재사용 | 100×9=900 SVG view 항상 메모리 상주, 콜드스타트 ↑, 풀 관리 복잡, useEffect 타이밍 본질 문제 잔존 |
| 순수 View + transform skew (의사 베벨) | 가장 가벼움, 의존성 0 | 트라페조이드 정확 표현 불가, 하이라이트 그라디언트 별도 dep(`expo-linear-gradient`), 품질 ~80% |
| 이미지 스프라이트 (PNG rasterized) | 네이티브 Image는 가장 빠름 | 14색 × 사이즈 조합별 PNG 다수 생성, 색 변경 시 재생성, 메모리 ↑ |
| WebView + HTML canvas | 웹 코드 재사용 | 브릿지 비용, 터치/폰트 통합 깨짐, RN 게임 UI 부적합 |

## 결과

### 긍정적 효과
- placement 깜빡임과 트레이 슬롯 "따닥" 글리치 **둘 다 원천 해결** (mount cost 0).
- floating HOLD 패턴(2 RAF) 의존도 ↓ — 측정 후 단순화 가능.
- Board의 100 cells가 1개 native view로 통합, React 트리 깊이 대폭 감소.
- Ghost 프리뷰가 진짜로 React 트리 밖으로 빠짐(7875c3f 커밋의 의도를 더 강하게 실현).
- 향후 게임 폴리시 작업(`docs/blockmatch-ui-comparison.md` Tier 1.2 라인 클리어 파티클 / Tier 2.4 Combo Badge / Tier 3.8 Next Queue 트랜지션) 시 Skia가 자연스러움.

### 트레이드오프 / 단점
- **앱 사이즈 ~+5.8MB(iOS) / ~+4MB(Android App Bundle)**.
- **dev client 재빌드 필수**. 이후 OTA 업데이트만으론 갱신 안 됨(네이티브 의존성).
- **Android 실기에서 일부 디바이스 silent rendering drop** (Skia 알려진 이슈). 완화: `<Canvas androidWarmup>` 사용, 첫 빌드 후 실기 검증.
- 멘탈 모델 전환 — 선언적 컴포넌트 → "그림을 그린다". Flutter CustomPaint 경험 있으면 친숙.
- `react-native-svg`는 의존성에 남겨둠 (블록매치에서만 제거; 다른 화면 잠재 사용). 정리는 별도 chore 커밋.

## 관련 파일

**NEW**
- `src/components/blockmatch/BeveledBlock.tsx` — Skia 재작성 (`BeveledBlockSkia` + Canvas 래퍼 `BeveledBlock`)

**MODIFY (전체 재작성)**
- `src/components/blockmatch/Cell.tsx` — `BlockmatchCellSkia` 함수 export, 기존 React 컴포넌트 삭제
- `src/components/blockmatch/Board.tsx` — 단일 Canvas 구조, ghost prop 수용, BoardRow 폐기
- `src/components/blockmatch/PieceShape.tsx` — `PieceShapeSkia` + `PieceShapeView` (Canvas 래퍼)
- `src/components/blockmatch/PieceTray.tsx` — PreviewSlot fade entering 제거

**MODIFY (부분)**
- `app/(tabs)/puzzle/blockmatch.tsx` — GhostOverlay 임포트/렌더 제거, Board에 ghost prop 전달

**DELETE**
- `src/components/blockmatch/GhostOverlay.tsx` — Board Canvas 내부로 흡수

**DEPENDENCY**
- `package.json` — `@shopify/react-native-skia` v2.4.18 추가
