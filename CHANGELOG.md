# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Aligned project dependencies to Expo SDK 55: `react-native` 0.81.5 → 0.83.4,
  `react` / `react-dom` 19.1.0 → 19.2.0, `react-native-worklets` 0.5.1 → 0.7.2,
  `react-native-reanimated` → 4.2.1, `react-native-screens` → ~4.23.0,
  `react-native-gesture-handler` → ~2.30.0, `react-native-svg` → 15.15.3, plus
  all `expo-*` packages bumped to ~55.0.x (29 packages total).
- Cleaned up `app.json` for SDK 55: removed deprecated `newArchEnabled` and
  `android.edgeToEdgeEnabled` fields (both defaults in SDK 55); auto-registered
  `expo-font` and `expo-image` config plugins.

### Fixed

- Metro bundler failing to resolve `whatwg-fetch` during Android builds. Added
  a custom `resolveRequest` hook in `metro.config.js` to work around the
  `@expo/metro-runtime@6.1.2` TypeScript-source resolution bug.
