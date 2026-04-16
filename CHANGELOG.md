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

### Changed

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
