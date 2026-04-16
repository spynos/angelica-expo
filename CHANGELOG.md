# 변경 로그 (Changelog)

이 프로젝트의 모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 1.1.0을 따르며,
버전 관리는 [유의적 버전(SemVer)](https://semver.org/lang/ko/) 체계를 따릅니다.

## [Unreleased]

### Added

- 블록매치에서 대기열 블록을 탭으로 회전할 때 `-90°`에서 `0°`로 살짝 튕기며
  돌아오는 스프링 회전 애니메이션을 추가했습니다. Reanimated의 layout
  animation(`entering`)과 `initialValues`를 사용해 UI 스레드에서 새 형태를
  원자적으로 `-90°` 상태로 마운트하므로, 기존 `useAnimatedStyle` 방식에서
  발생하던 "회전된 형태가 한 프레임 깜박이는" 글리치가 완전히 사라집니다.

- 안드로이드에서 앱 실행 시 상태바(시계·알림 아이콘)와 하단 네비게이션 바를
  자동으로 숨기는 풀스크린 몰입형 모드를 적용했습니다. `expo-navigation-bar`
  패키지를 도입하고, `overlay-swipe` 동작으로 설정해 가장자리 스와이프로
  일시적으로 바를 소환할 수 있습니다. iOS는 상태바만 숨깁니다.

### Fixed

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
