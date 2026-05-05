# ADR-001: Expo Go 지원 중단, development build / production build 전용

- **날짜**: 2026-05-01
- **상태**: Accepted

## 배경

`angelica-expo`는 SDK 55 기반 React Native 앱이며, 다음과 같이 Expo Go에서는
동작할 수 없는 네이티브 모듈에 의존한다:

- `react-native-mmkv` — 동기 KV 스토리지 (Sudoku 세션, 활동 통계 등에 사용)
- `expo-glass-effect` — iOS 26+ Liquid Glass 탭바
- `expo-apple-authentication` — Apple Sign-In 네이티브 버튼
- `react-native-reanimated@4` — Worklets 런타임
- `expo-navigation-bar` — Android 몰입형 모드 제어

이전에는 Expo Go에서도 일부 화면을 시연·테스트할 수 있도록
`Constants.executionEnvironment === StoreClient`로 환경을 감지하고, MMKV 대신
AsyncStorage 기반 동기 어댑터를 사용하거나, 네이티브 모듈을 동적 `require`로
감싸 fallback UI를 노출하는 방식을 유지했다 (`src/lib/storage.ts`,
`src/components/LiquidTabBar.tsx`, `src/lib/social-auth.ts`,
`app/(auth)/login.tsx`).

이 방식은 다음과 같은 비용을 만들어냈다:

1. **두 개의 런타임 분기를 항상 머릿속에 유지해야 함** — 새 네이티브 의존성을
   추가할 때마다 "Expo Go에서는 어떻게 동작할 것인가"를 고려해야 한다.
2. **AsyncStorage 어댑터의 근본적 한계** — MMKV는 동기 API를 제공하지만
   AsyncStorage는 비동기다. 동기처럼 보이는 어댑터를 만들어도 hydration 이전
   읽기는 누락되며, 게임 세션 같은 핵심 데이터의 정합성을 보장할 수 없다.
3. **타입 안정성 저하** — 동적 `require`는 `let X: typeof import('...') | null`
   같은 패턴을 강제해 모든 사용처가 nullable 가드를 갖게 된다.
4. **CI/EAS 빌드와의 무관성** — 실제 배포는 development build 또는 production
   build로만 이루어지며, Expo Go는 어디에서도 빌드 산출물의 일부가 아니다.

실사용 흐름이 dev build로 굳어졌으므로 Expo Go 호환을 위한 분기를 유지할
실익이 사라졌다.

## 결정

Expo Go 지원을 공식적으로 중단한다. 앞으로 이 저장소는 다음 두 가지 빌드만
지원한다:

- **development build** — `eas build --profile development` 또는 `expo run:ios`/
  `expo run:android`
- **production build** — `eas build --profile production`

구체적으로 다음을 적용한다:

- `src/lib/storage.ts`에서 `isExpoGo` 감지 로직과 AsyncStorage fallback 어댑터를
  제거하고 MMKV 단독 사용으로 되돌린다.
- `src/components/LiquidTabBar.tsx`, `src/lib/social-auth.ts`,
  `app/(auth)/login.tsx`에서 `expo-glass-effect`·`expo-apple-authentication`을
  감싸던 동적 `require`/null-가드 분기를 제거하고 정적 `import`로 복원한다.
- `package.json`에서 `start:go` 스크립트를 삭제한다.
- AsyncStorage 패키지(`@react-native-async-storage/async-storage`) 자체는
  Supabase auth 세션 저장에 계속 쓰이므로 dependency에 유지한다.

## 고려한 대안

| 대안 | 장점 | 단점 |
|------|------|------|
| **현재 선택: dev build 전용** | 분기 코드 제거, 타입 정합성 회복, 동기 KV 보장 | 빠른 시연 시 Expo Go로 즉시 띄울 수 없음 |
| Expo Go 호환 유지 | 신규 기여자가 native 빌드 없이 시연 가능 | 모든 native 의존성 추가 시 fallback 필요, 데이터 정합성 위험 |
| Expo Go 전용 별도 브랜치 | main은 깔끔, 시연 브랜치 별도 유지 | 두 브랜치 동기화 비용이 분기 코드보다 큼 |

## 결과

### 긍정적 효과

- `src/lib/storage.ts`가 94줄 → 11줄로 축소.
- 네이티브 모듈 사용처에서 `if (X != null)` 가드와 fallback UI 제거.
- 신규 native 의존성 추가 시 Expo Go 호환을 고려할 필요 없음.
- 게임 세션이 항상 MMKV 동기 API에 기대므로 hydration race 가능성 제거.

### 트레이드오프 / 단점

- 신규 기여자도 dev build 환경(Xcode / Android Studio + Java 17 또는 EAS Build
  계정)을 갖춰야 한다. `docs/dev-setup.md`를 참고.
- iOS 시연 시 Apple Developer 디바이스 등록과 provisioning이 필요하다 (이미
  EAS internal distribution으로 진행 중).

## 관련 파일

- `app.json` — `expo-image` 플러그인 복원
- `app/(auth)/login.tsx` — 정적 `expo-apple-authentication` import
- `src/components/LiquidTabBar.tsx` — 정적 `expo-glass-effect` import
- `src/lib/social-auth.ts` — 정적 `expo-apple-authentication` import
- `src/lib/storage.ts` — MMKV 단독 사용
- `package.json` — `start:go` 스크립트 제거
- `CHANGELOG.md` — `[Unreleased] / Removed`
