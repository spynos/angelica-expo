# ADR-003: 블록매치 셀 페인팅을 베벨에서 플랫(파스텔 단색)으로 전환

- **날짜**: 2026-05-05
- **상태**: Accepted
- **관련**: ADR-002 (단일 Canvas + shared-value imperative 렌더)

## 배경

ADR-001/002로 정착한 v2 렌더는 시각 표현으로 `penta_block_blast`의 베벨 블록(4면 사다리꼴 + 좌상단 하이라이트 그라디언트)을 그대로 포팅했다. 장애물 또한 penta의 SpecialBlock 그대로 — offwhite/black α-overlay 베벨 + 펄스 아이콘.

이 페인팅 정책이 다음의 부담을 동반함을 확인:

- **시각적 정보 노이즈**: 베벨 4면 + 하이라이트 + 사이즈별 5색 + 사이즈 내 H/L spread → 보드가 "장식이 가득한 디테일"로 읽혀 카페 톤(`#FAF7F2` 크림 보드)과 충돌.
- **장애물 형상 비대칭**: penta의 9% / 44% 베벨 inset 차이로 같은 보드 위에 두 가지 silhouette이 공존 → 학습성 추가 부담.
- **분리감 부재**: 인접 셀이 베벨로 시각적으로 결합되어, 사용자가 "각 타일이 박혀 있는 트레이" 같은 느낌을 원해도 표현되지 않음.

브랜드 가이드(앙겔리카 카페 — 따뜻한 크림 + 파스텔 톤)와 정합되는 방향으로 페인팅 정책을 단순화하는 것이 맞다고 판단.

## 결정

`penta_block_blast`의 베벨 페인팅을 v2 렌더에서 제거하고, **플랫 단색 + 셀 분리감 + 사이즈별 파스텔 1색**으로 전환한다.

구체:

- **블록**: 사이즈 1~5 각각 단일 파스텔 색(s≈35–58, l≈72–78). 사이즈 내부 H/L spread = 0.
- **셀 모양**: 라운드 사각형 1개. 베벨/하이라이트 페인트·레이어 모두 제거.
- **셀 분리감**: `CELL_INSET_RATIO = 0.08`로 각 셀이 보드 배경 위에 떠 있는 것처럼 그려짐.
- **셀 라운딩**: `CELL_RADIUS_RATIO = 0.18`.
- **빈 칸**: 솔리드 fill 제거, 보드 배경(`#FAF7F2`) 위에 hairline stroke(`#E5DCC9`, 0.75px)만.
- **장애물**:
  - 베벨/펄스 제거. 단일 fill + 평면 마커.
  - basic = 차콜 단색 (마커 X)
  - horiz = 머스타드 + 가로 줄무늬 2줄
  - vert = 더스티 퍼플 + 세로 줄무늬 2줄
  - durable2 = 브론즈 + 점 2개 (hp=1이면 두 번째 점이 흐려짐)
  - composite = 차콜 + 십자(┼)
- **드래그 중 블록**: 셀별 미세 그림자(`dy=2 blur=6 #0000001F`)로 들린 느낌만 표현.

## 영향

### 코드
- `src/lib/blockmatch/colors.ts`: BASE 5색을 파스텔로 교체, spread = 0. `bevelColorsForPieceId` 등 베벨 API는 v1 dead-code(`src/components/blockmatch/GameSurface.tsx` 등)의 컴파일 호환을 위해 export 유지(런타임 미사용).
- `src/components/blockmatch/v2/canvas/drawers.tsx`: `BeveledBlockShape` → `FlatBlockShape`로 교체. `SpecialFrustum` 등 penta 베벨 헬퍼와 펄스 아이콘 모두 삭제. `BoardBackground`는 cream fill + 빈 칸 outline path만.
- `src/components/blockmatch/v2/engine/constants.ts`: `CELL_INSET_RATIO`, `CELL_RADIUS_RATIO`, `EMPTY_CELL_STROKE_PX` 추가. `BOARD_BG_COLOR`는 cream(`#FAF7F2`)으로, `BOARD_GRID_COLOR`는 hairline 톤으로 변경.
- `EntityNode` / `GhostNode` / `DragPieceOverlay` / `PiecePreview`: `FlatBlockShape` + `colorForPieceId` 사용. **per-cell counter-rotation 제거** — 베벨 face가 없어 orientation 보존 필요 없음.
- `BoardCanvasV2`: 장애물 펄스 SharedValue 제거.

### 디자인
- `docs/blockmatch-plan.md` §5.5는 본 결정으로 갱신.

### 보존되는 결정
- ADR-001(Skia 채택), ADR-002(단일 Canvas + imperative): 본 변경은 **페인팅 정책만 교체**이므로 두 결정 모두 그대로 유효.

## 대안

| 대안 | 검토 | 채택 안 한 이유 |
|---|---|---|
| 베벨 inset만 줄여 부드럽게 | 1차 검토 | "사이즈별 5색 + 베벨"의 정보 밀도가 여전히 높음. 분리감도 안 생김 |
| 모든 블록 단일 단색(스크린샷 그대로) | 2차 검토 | 사이즈 구분이 셀 개수 세기로만 가능 → 학습성 약화. 사용자도 "사이즈별 색은 유지" 선택 |
| 베벨 유지 + 채도만 낮추기 | 검토 | 시각 노이즈가 줄긴 하나 brand fit 부족. 분리감 문제 미해결 |

## 후속

- 색은 시뮬레이터에서 시각 검토 후 튠. 본 ADR의 HSL 값은 1차 시안.
- v1 dead code(`GameSurface.tsx`, `skia-drawers.ts`, `useGameSharedValues.ts`, `GestureOverlay.tsx`) 제거는 별도 정리 commit으로 분리. 본 ADR 시점에서는 컴파일 호환만 유지.
- 펄스/그림자 디테일 — 사용자 피드백에 따라 조정 가능 (본 결정은 "현재는 드래그에만 미세 그림자")

## 업데이트 — 2026-05-05: 사이즈 내부 톤온톤 부활

같은 사이즈에 속한 모양들이 100% 동일한 색을 쓰니(특히 사이즈 5의 12종 펜토미노) 트레이/오버레이/보드 위에서 모양 구분이 거의 안 된다는 사용성 피드백.

원안에서 "사이즈 내부 H/L spread = 0"으로 못 박았던 부분을 부분적으로 되돌린다. 단, **hue spread는 0으로 유지**해서 사이즈별 색 정체성(코랄/버터/세이지/스카이/라벤더)은 그대로 둔다.

- `L_SPREADS`: `{1:0, 2:0, 3:4, 4:7, 5:9}` — 모양 개수에 비례한 명도 사다리
- `H_SPREADS`: 전부 0 (톤온톤 유지)
- 채도(s)도 base 그대로

근거: 톤온톤은 같은 hue 안의 lightness 변주를 의미. 같은 사이즈는 한 가족으로 묶이고, 옆 사이즈와는 hue 자체가 달라 절대 안 겹친다. ADR-001/002, 그리고 본 ADR의 "플랫 페인팅" 큰 결정은 영향 없음 — 베벨/하이라이트는 여전히 없고, 셀당 단일 fill 한 겹.

