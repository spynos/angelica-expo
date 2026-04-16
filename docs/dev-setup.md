# 로컬 개발 빌드 환경 설정

실기기에서 development build를 실행하기 위한 환경 설정 가이드.

> **왜 로컬 빌드?**
> 네이티브 패키지가 추가될 때마다 EAS 빌드가 필요한데, EAS는 매번 약 20분이 소요된다.
> 로컬 빌드는 Gradle 캐시가 쌓인 이후 1~2분으로 단축된다.

---

## 공통 준비

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 파일 확인 (.env)
# EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY 필요
```

---

## Android

### 필수 설치

| 항목 | 설치 방법 |
|------|-----------|
| Android Studio | https://developer.android.com/studio |
| Android SDK (API 36) | Android Studio → SDK Manager |
| NDK 27.1 | Android Studio → SDK Manager → SDK Tools |

### JAVA_HOME 설정 (중요)

시스템 JDK가 아닌 **Android Studio 번들 JDK**를 사용해야 한다.
시스템에 JDK 8 등 구버전이 설치돼 있으면 Gradle이 JVM 버전 에러를 낸다.

**macOS `~/.zshrc`에 추가:**

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

적용:

```bash
source ~/.zshrc
java -version  # openjdk 21.x 이 출력되면 정상
```

**Windows (PowerShell 프로필에 추가):**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

### 기기 연결

1. 안드로이드 기기에서 **개발자 옵션 → USB 디버깅** 활성화
2. USB로 Mac에 연결
3. 기기 인식 확인:

```bash
adb devices
# List of devices attached
# XXXXXXXX  device  ← 이렇게 보여야 함
```

### 빌드 실행

```bash
npx expo run:android
```

- 첫 빌드: ~10분 (Gradle 캐시 생성, NDK 다운로드 포함)
- 이후 빌드: ~1~2분
- 빌드 완료 후 기기에 자동 설치되고 Metro 서버에 연결됨

### 이후 개발 (Metro만 실행)

dev client APK가 기기에 설치된 상태라면 네이티브 재빌드 없이 Metro만 실행:

```bash
npx expo start --dev-client
```

기기에서 앱을 열면 자동으로 로컬 Metro에 연결된다.

---

## iOS

### 필수 설치

| 항목 | 설치 방법 |
|------|-----------|
| Xcode 16+ | App Store |
| Xcode Command Line Tools | `xcode-select --install` |
| CocoaPods | `sudo gem install cocoapods` |

### 기기 연결

1. iPhone을 USB로 Mac에 연결
2. Xcode에서 기기를 신뢰 처리
3. Apple 개발자 계정으로 서명 설정 (Xcode → Signing & Capabilities)

### 빌드 실행

```bash
npx expo run:ios --device
```

---

## 네이티브 패키지 추가 시

`expo-navigation-bar`, `expo-camera` 등 네이티브 모듈이 추가된 경우:

```bash
npm install <패키지>
npx expo run:android  # 로컬 재빌드 (EAS 불필요)
```

Gradle 캐시가 있으므로 변경된 모듈만 재컴파일해 EAS보다 훨씬 빠르다.

---

## 알려진 문제

### `Gradle requires JVM 17 or later`

JAVA_HOME이 시스템 JDK 8을 가리키는 경우. → [JAVA_HOME 설정](#java_home-설정-중요) 참고.

### `IBM_SEMERU member field not found`

Gradle 9.0.0과 JDK 21 조합에서 발생하는 호환성 버그.
`android/gradle/wrapper/gradle-wrapper.properties`의 Gradle 버전을 확인:

```
distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip
```

### `Read timed out` (Gradle 의존성 다운로드)

네트워크 일시 장애. 재실행하면 해결된다:

```bash
npx expo run:android
```
