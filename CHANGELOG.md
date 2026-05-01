# 변경 로그 (Changelog)

이 프로젝트의 모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 1.1.0을 따르며,
버전 관리는 [유의적 버전(SemVer)](https://semver.org/lang/ko/) 체계를 따릅니다.

## [Unreleased]

### Changed

- Expo SDK 55 호환 패치 버전으로 의존성을 정렬했습니다 (`npx expo install --check`).
  `expo-auth-session`·`expo-dev-client`·`expo-image`·`expo-linking`·
  `expo-notifications`·`expo-router`·`expo-system-ui`·`expo-updates`·
  `react-native`·`react-native-worklets`이 패치 버전 단위로 갱신되었고
  `package-lock.json`이 동기화되었습니다. 이는 EAS Build에서 `npm ci`가
  `package.json`과 lock 파일 불일치(특히 `react-native-worklets@0.8.x`
  transitive 요구)를 이유로 INSTALL_DEPENDENCIES 단계에서 실패하던 문제를
  해결합니다.

### Added

- 블록매치 블록에 사이즈(=셀 갯수)별 톤을 입히는 팔레트를 추가했습니다.
  같은 갯수 블록은 같은 톤 계열(사이즈 1=코랄 피치 / 2=허니 골드 /
  3=프레시 민트 / 4=브라이트 아쿠아 / 5=라이트 라일락)로 묶이고, 같은
  사이즈 내 각 모양은 명도·색상을 미세하게 변조해 구분합니다. 배치된
  보드 블록도 원 피스 색을 그대로 유지하도록 `Cell`에 `pieceId`를
  저장하고, 트레이·드래그·고스트 프리뷰 모두 HSL 기반 팔레트
  (`src/lib/blockmatch/colors.ts`)에서 색을 조회합니다. 크림색 보드
  배경에서 또렷하게 뜨도록 채도 50~80% 범위로 설정했고, 고스트 하이라이트는
  해당 피스 색상을 +10% 밝게 써서 "떠 있는 프리뷰" 인상을 유지합니다.

- 블록매치에서 대기열 블록을 탭으로 회전할 때 `-90°`에서 `0°`로 살짝 튕기며
  돌아오는 스프링 회전 애니메이션을 추가했습니다. Reanimated의 layout
  animation(`entering`)과 `initialValues`를 사용해 UI 스레드에서 새 형태를
  원자적으로 `-90°` 상태로 마운트하므로, 기존 `useAnimatedStyle` 방식에서
  발생하던 "회전된 형태가 한 프레임 깜박이는" 글리치가 완전히 사라집니다.

- 안드로이드에서 앱 실행 시 상태바(시계·알림 아이콘)와 하단 네비게이션 바를
  자동으로 숨기는 풀스크린 몰입형 모드를 적용했습니다. `expo-navigation-bar`
  패키지를 도입하고, `overlay-swipe` 동작으로 설정해 가장자리 스와이프로
  일시적으로 바를 소환할 수 있습니다. iOS는 상태바만 숨깁니다.

### Changed

- 블록매치에서 고스트 프리뷰가 한 번 유효 셀에 잡힌 뒤 손가락이 살짝
  배치 불가 영역으로 흔들렸을 때 **고스트가 곧장 사라지지 않도록**
  비대칭 히스테리시스를 적용했습니다. 유효 → 유효 전환은 기존대로 0.5칸
  임계값(`Math.round`)으로 즉시 따라가지만, 유효 → 무효 전환은 플로팅
  피스 중심이 마지막 스냅에서 1.5칸을 넘어가야 비로소 고스트가 꺼집니다
  (`app/(tabs)/puzzle/blockmatch.tsx`의 `GHOST_STICKY_CELLS`). 마지막
  유효 위치를 `lastValidGhostRef`로 기억해 두고, 무효 셀로 들어왔을 때
  연속(non-rounded) 그리드 좌표 기준 Chebyshev 거리로 판정합니다.
  결과적으로 어렵게 잡은 스냅 위치가 미세 떨림으로 깜빡 꺼지는 현상이
  사라지고, "마지막 좋은 위치"가 끈끈하게 유지됩니다.

- 블록매치 보드에서 피스를 끌어 옮길 때 **스냅 구간(유효 배치 영역)에서
  플로팅 피스 이동이 끊겨 보이던 문제**를 해결했습니다. 기존엔 손가락이
  셀 경계를 넘을 때마다 `setGhost(...)`로 React state를 갱신했고,
  이로 인해 `Board` → `BoardRow` → `BlockmatchCell`이 재조정되며 섀도트리
  커밋이 1~3 ms 동안 UI 스레드를 점유, Reanimated의 플로팅 피스 워크릿이
  그 프레임을 놓쳐 끊겨 보였습니다. 이제 고스트는 React state가 아니라
  `ghostRow`/`ghostCol`/`ghostOpacity` 셰어드 밸류로 관리되며, 새로 만든
  `GhostOverlay`(보드 위 절대 위치 `Animated.View`)가 워크릿으로 위치를
  갱신합니다. `Board`/`BlockmatchCell`은 더 이상 고스트 prop을 받지 않고,
  드래그 중 보드 React 리렌더는 0회입니다 (피스 배치/스테이지 클리어 때만
  렌더). 부수적으로 `PieceShapeView`를 `React.memo`로 감싸 잔여 재조정도
  제거했습니다.

- 블록매치에서 대기열 블록을 드래그 시작한 직후 보드의 고스트 프리뷰가
  곧장 점등되어 **블록 등장과 스냅이 한 박자로 보이던 문제**를 완화했습니다.
  드래그가 활성화된 시점에서 200 ms 동안은 `setGhost` 호출을 억제하고,
  유예가 끝나면 마지막으로 알려진 손가락 위치 기준으로 고스트를 1회
  평가합니다. 사용자가 손가락을 멈춘 채 유예가 끝나는 경우를 위해
  `setTimeout` 폴백을 두어, 그 시점에 `dragAbsX/Y` 값으로 고스트를
  띄워줍니다 (`app/(tabs)/puzzle/blockmatch.tsx`의 `GHOST_GRACE_MS`).
  결과적으로 "플로팅 피스 등장 → 잠깐의 호흡 → 고스트 점등"이라는
  두 박자 흐름이 만들어져 더 자연스럽게 이어집니다.

### Fixed

- 블록매치에서 새 드래그를 시작하는 순간 **직전에 놓은 블록**이 한순간
  플로팅 오버레이에 비치던 문제를 고쳤습니다. 기존 구현은 드래그가 활성화될 때
  `runOnJS(setFloatingSnapshot)(null)`을 호출하면서 동시에 50 ms 페이드인을
  시작했는데, JS 스레드의 React 커밋이 한두 프레임만 밀려도 페이드인이 진행
  중인 오버레이가 **이전 스냅샷**을 잠깐 렌더하는 경합이 있었습니다.
  이제는 `beginFloatingFadeIn` JS 콜백을 거쳐 (1) `setFloatingSnapshot(null)`을
  먼저 React에 커밋하고, (2) `requestAnimationFrame` 한 틱 뒤에야
  `withTiming(1)`을 시작합니다. 플로팅 피스 등장이 약 16 ms 늦어지는
  대신 옛 블록이 비치는 일이 사라집니다.

- 블록매치에서 피스를 보드에 놓을 때 "깜빡" 하며 배치되던 현상을 완화했습니다.
  플로팅 오버레이의 opacity를 `isDragging` 플래그에서 분리된 `floatingOpacity`
  shared value로 빼고, `useAnimatedReaction`으로 드래그 종료 시 120 ms 페이드
  아웃을 걸었습니다. 또한 `handleDrop`에서 `dispatch('place')` 직전에 현재 피스를
  `floatingSnapshot` state에 고정해, 디스패치로 `state.current`가 다음 큐 피스로
  바뀌어도 페이드 중인 오버레이는 **방금 놓은 피스**를 계속 렌더합니다. 이전
  구현은 `state.current`를 그대로 쓰다 보니, 페이드아웃이 끝나기 전에 다음 피스가
  드롭 위치에 한 프레임 번쩍 뜨는 글리치가 있었습니다. 스냅샷은 다음 드래그
  시작 시 같은 `useAnimatedReaction`이 `runOnJS`로 초기화합니다 — 드래그 시작
  페이드인을 50 ms로 두어, React가 `setFloatingSnapshot(null)`을 커밋하기 전에
  오버레이가 보이지 않도록 했습니다.

- 블록매치에서 새 피스가 큐에 등장할 때 가끔 회전된 모습으로 또는 회전 중인
  채로 등장하던 현상을 수정했습니다. 기존 회전 useEffect는 "새 피스인지"를
  `piece.defId !== basePiece.defId`로만 판정했는데, 직전 피스와 같은 `defId`가
  연속으로 뽑히면(약 5%/draw) snap 분기를 놓쳐 `basePiece`와 `rotation`이
  이전 피스 상태로 남고, 마침 in-flight였던 스프링이 새 피스 위에서 그대로
  진행되어 "새 피스가 회전하면서 등장하는" 듯 보였습니다. 이전 piece prop을
  `prevPieceRef`로 추적해 **`defId`가 같고 `rotationIdx`가 정확히 +1**인 경우만
  회전 탭으로 간주하고 그 외 모든 piece 변경은 `basePiece`·`rotation`을 snap
  하도록 했습니다. 회전 애니메이션이 사용자 탭 피드백 전용으로만 작동하므로
  새 피스는 항상 fade-in으로만 등장합니다.

- 블록매치에서 회전 애니메이션이 끝나기 전에 빠르게 연속으로 탭할 때 발생하던
  깜박임을 수정했습니다. 기존 구조는 `innerKey`가 `defId-rotationIdx`라 매 탭마다
  inner view가 unmount/remount됐고, 직전 마운트의 entering 애니메이션이 `initialValues`
  를 적용하기 전에 새 마운트가 들어오면 한 프레임 정도 빈 슬롯이 노출됐습니다.
  inner view를 한 번만 마운트하고, 회전을 shared value(`rotation`)로 직접
  스프링하는 방식으로 바꿨습니다. 도착 시점의 피스를 `basePiece` 스냅샷으로
  보관하고 `rotation`을 `(piece.rotationIdx - basePiece.rotationIdx) × 90°`로
  스프링하면, `pureRotations` 규약상 `basePiece`를 N×90° 회전한 픽셀이
  `rotations[i+N]`을 0°로 그린 픽셀과 동일하므로 셰이프 swap 자체가 필요 없습니다.
  연속 탭은 같은 shared value의 스프링 타깃을 갱신할 뿐이라 마운트 경합이
  사라지고 회전이 부드럽게 이어집니다.

- 블록매치에서 회전 대칭성이 완전한 피스(monomino, 2×2 정사각형, X-펜토미노)를
  탭으로 회전시킬 때 발생하던 깜박임을 수정했습니다. 이런 피스는 `pureRotations`
  결과 길이가 1이라 회전해도 셰이프가 동일한데, 기존엔 `rotate` 액션이 항상
  `rotationIdx`를 증가시켜 `innerKey`가 바뀌고 entering 애니메이션이 작동했습니다.
  결과적으로 셰이프가 중간 각도(-45° 등)에서 기울어 보였다가 같은 자리로 돌아오는
  wobble이 깜박임으로 보였습니다. 엔진의 `rotate` 케이스에서 `def.rotations.length
  <= 1`이면 상태를 바꾸지 않도록 무효화 처리해, 회전이 의미 있는 피스에서만
  애니메이션이 실행되도록 했습니다.

- 블록매치에서 비대칭 피스를 4번째로 회전할 때 발생하던 깜박임을 수정했습니다.
  기존 `variants()`는 한 피스의 회전 배열에 순수 90° 회전 4개뿐 아니라 그
  반사(거울상) 4개까지 포함해 총 8개 오리엔테이션을 저장했고, 탭으로 회전
  인덱스를 증가시키다가 3→4로 넘어가면 셰이프가 "회전"이 아니라 "반사"로
  바뀌었습니다. 회전 애니메이션은 새 셰이프를 `rotate(-90°)`에서 `0°`로
  스프링하도록 설계돼 "새 셰이프의 -90° = 이전 셰이프" 전제에 의존하는데,
  반사는 이 전제를 깨므로 첫 프레임에서 시각적 점프가 보였습니다. 피스
  정의에 저장하는 회전 배열을 순수 90° 회전 4개로 제한(`pureRotations`)하고,
  `freeKey`만 기존처럼 회전·반사를 모두 고려해 자유 폴리오미노 중복을 걸러
  내도록 분리했습니다.

- 블록매치에서 대기열 블록을 탭으로 회전할 때마다 블록이 새로 렌더되는 듯
  반짝이던 현상을 수정했습니다. pan 제스처의 `onFinalize`가 탭 동작에서도
  실행되어 드래그 종료 fade-in 애니메이션이 매 회전마다 재발화되던 것이
  원인이었습니다. `didDragStart` 공유값 플래그로 `onStart`(실제 드래그 확정)
  가 발동한 경우에만 drag-end 신호를 JS로 전달하도록 했습니다.

- 블록매치에서 대기열 블록을 탭(회전)할 때 플로팅 피스가 순간 나타났다 사라지던
  현상을 수정했습니다. `isDragging` 활성화를 `onBegin`에서 `onStart`(pan 확정
  후)로 이동해, `minDistance`를 충족하지 못한 탭 동작에서는 플로팅 피스가
  전혀 표시되지 않습니다. 드래그 인식 임계값도 2px → 20px로 높여 탭과
  드래그를 더 명확히 구분합니다.

- 블록매치에서 블록 배치 후 대기열에 이전 블록이 순간 깜박이다가 새 블록으로
  전환되던 현상을 수정했습니다. `onFinalize`(UI 스레드)에서 opacity를 직접
  복원하는 대신 `runOnJS`로 JS 스레드에 신호를 보내, React가 새 피스로
  리렌더한 뒤에 fade-in이 시작되도록 했습니다.

- 블록매치에서 드래그 시작 시 대기열의 원본 블록이 반투명하게 남아 보이던
  문제를 수정했습니다. 드래그 중에는 대기열 자리의 블록을 완전히 숨깁니다.

- 블록매치에서 블록을 배치한 직후 다음 블록을 드래그할 때 플로팅 피스가
  이전 배치 위치에서 순간이동하던 버그를 수정했습니다. 팬 제스처의
  `onBegin` 시점에 `dragX`/`dragY` 공유값을 손가락 좌표로 즉시 초기화해
  `onUpdate` 첫 이벤트 전까지 잘못된 위치가 렌더되지 않도록 했습니다.

### Changed

- 블록매치에서 보드 위로 블록을 가져갔을 때 배치할 수 없는 위치의
  고스트 프리뷰를 붉은색으로 표시하던 동작을 제거하고, 해당 위치에서는
  고스트 프리뷰 자체가 보이지 않도록 변경했습니다. 유효한 위치에서만
  연두색 하이라이트가 뜨고, 유효하지 않은 위치에서는 보드 원래 상태가
  그대로 보이므로 시각적 노이즈가 줄어듭니다.

- 블록매치 대기열 슬롯을 정사각형 비율로 만들었습니다. 기존에는 가로·세로
  크기가 달라 1×5 같은 직선형 피스를 90° 회전하면 가로/세로 제약이 비대칭
  으로 걸려 블록 셀 크기가 달라지던 문제가 있었습니다. 슬롯을 정사각형으로
  맞추면 `fitCellSize`가 두 방향에서 동일한 제약을 계산하므로 회전 전후
  블록 크기가 동일하게 유지됩니다. 큰 화면에서는 220px로 상한을 두어 슬롯이
  지나치게 커지지 않게 했습니다.

- 블록매치 대기열 슬롯 전체를 탭·드래그 히트 영역으로 확장했습니다. 기존에는
  실제 블록 모양만 포인터에 반응해 주변 여백을 눌러도 회전·드래그가 시작되지
  않았는데, `DraggablePiece`의 외곽 래퍼가 슬롯을 가득 채우도록 바꿔 슬롯
  어디를 눌러도 제스처가 인식됩니다. 피스 자체는 회전 애니메이션을 담당하는
  내부 래퍼에 의해 여전히 슬롯 중앙에 정렬된 채 렌더됩니다.

- 블록매치 대기열과 다음 블록 미리보기 영역을 반응형으로 개선했습니다.
  화면 폭에 비례해 미리보기 슬롯 크기(60~96px로 클램프)와 현재 피스
  슬롯의 너비·높이를 계산하고, 각 피스의 바운딩 박스와 슬롯 크기를
  바탕으로 블록 셀 크기를 동적으로 산정합니다. 작은 기기에서도 펜토미노
  (5칸 직선)가 슬롯을 넘지 않고, 큰 기기에서는 슬롯과 블록이 자연스럽게
  함께 커집니다. `Dimensions.get('window')` 대신 `useWindowDimensions`
  훅을 사용해 회전·폰트 스케일 변화에도 레이아웃이 갱신됩니다.

- 블록매치 드래그 성능을 개선했습니다. 플로팅 피스 위치를 Reanimated
  공유값(SharedValue)으로 전환해 드래그 중 JS 스레드 리렌더를 제거했고,
  고스트 업데이트를 셀 경계를 넘을 때만 실행하도록 스로틀링했습니다.
  `BoardRow`·`BlockmatchCell`에 `React.memo`와 행별 bitmask를 적용해
  변경된 셀만 리렌더합니다. 저사양 기기에서도 60fps에 근접한 드래그
  응답성을 제공합니다.

- 블록매치 게임의 드래그 조작감을 개선했습니다. 트레이의 블록을 보드로
  옮길 때 손가락 위쪽 180px 위치에 실제 배치 모습이 떠다니고(플로팅
  오버레이), 보드 격자에 스냅된 고스트 프리뷰가 별도로 표시됩니다.
  손가락에 가려지지 않으면서 정확한 배치 위치를 미리 볼 수 있도록
  두 단계 시각 피드백 구조로 재설계했습니다. SafeAreaView 헤더
  오프셋을 보정해 고스트가 플로팅 블록과 정확히 겹치도록 했습니다.

- `expo prebuild` 시 Gradle wrapper 버전을 8.13으로 고정하는 config plugin
  (`plugins/with-gradle-version.js`)을 추가했습니다. Expo SDK 55 플러그인들이
  Gradle 9.0.0의 breaking change(`IBM_SEMERU` 제거)와 호환되지 않아 로컬
  Android 빌드가 실패하던 문제를 방지합니다.

- Expo SDK 55에 맞춰 프로젝트 의존성을 일괄 정합화했습니다.
  `react-native` 0.81.5 → 0.83.4, `react` / `react-dom` 19.1.0 → 19.2.0,
  `react-native-worklets` 0.5.1 → 0.7.2, `react-native-reanimated` → 4.2.1,
  `react-native-screens` → ~4.23.0, `react-native-gesture-handler` → ~2.30.0,
  `react-native-svg` → 15.15.3, 그 외 모든 `expo-*` 패키지를 ~55.0.x로 정렬
  (총 29개 패키지).
- SDK 55에 맞춰 `app.json`을 정리했습니다. 기본값이 된
  `newArchEnabled`, `android.edgeToEdgeEnabled` 필드를 제거하고,
  `expo-font`와 `expo-image` config plugin을 자동 등록했습니다.

### Fixed

- 안드로이드 빌드 시 Metro 번들러가 `whatwg-fetch`를 해석하지 못하던 문제를
  수정했습니다. `@expo/metro-runtime@6.1.2`가 TypeScript 소스(`src/*.ts`)를
  그대로 배포하는 버그를 우회하기 위해 `metro.config.js`에 커스텀
  `resolveRequest` 훅을 추가했습니다.
