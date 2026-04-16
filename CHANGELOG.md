# 변경 로그 (Changelog)

이 프로젝트의 모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 1.1.0을 따르며,
버전 관리는 [유의적 버전(SemVer)](https://semver.org/lang/ko/) 체계를 따릅니다.

## [Unreleased]

### Added

- 안드로이드에서 앱 실행 시 상태바(시계·알림 아이콘)와 하단 네비게이션 바를
  자동으로 숨기는 풀스크린 몰입형 모드를 적용했습니다. `expo-navigation-bar`
  패키지를 도입하고, `overlay-swipe` 동작으로 설정해 가장자리 스와이프로
  일시적으로 바를 소환할 수 있습니다. iOS는 상태바만 숨깁니다.

### Fixed

- 블록매치에서 드래그 시작 시 대기열의 원본 블록이 반투명하게 남아 보이던
  문제를 수정했습니다. 드래그 중에는 대기열 자리의 블록을 완전히 숨깁니다.

- 블록매치에서 블록을 배치한 직후 다음 블록을 드래그할 때 플로팅 피스가
  이전 배치 위치에서 순간이동하던 버그를 수정했습니다. 팬 제스처의
  `onBegin` 시점에 `dragX`/`dragY` 공유값을 손가락 좌표로 즉시 초기화해
  `onUpdate` 첫 이벤트 전까지 잘못된 위치가 렌더되지 않도록 했습니다.

### Changed

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
