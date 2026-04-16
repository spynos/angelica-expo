# Troubleshooting

---

## [2026-04-16] Metro 번들러 Android 빌드 실패 (whatwg-fetch / expo 버전 불일치)

### 문제
`npx expo start --dev-client` 실행 시 Android 번들링 실패.

**에러 1:**
```
Unable to resolve "@expo/log-box/lib" from "node_modules/expo-router/build/renderRootComponent.js"
```

**에러 2:**
```
Unable to resolve "whatwg-fetch" from "node_modules/@expo/metro-runtime/src/location/install.native.ts"
```

### 원인

**에러 1 — 패키지 버전 불일치:**
`package.json`은 `expo ~54.0.33`, `expo-router ~6.0.23`을 명시하고 있었으나,
`package-lock.json`이 `expo@55.x`, `expo-router@55.x`를 가리키고 있어 버전 불일치 발생.
`@expo/log-box@55.x`는 `lib/` 디렉토리가 없는 구조라 해석 실패.

**에러 2 — Metro resolver 버그:**
`@expo/metro-runtime@6.1.2`가 TypeScript 소스(`src/index.ts`)를 그대로 배포하는 구조.
Metro가 `install.native.ts`를 번들링할 때 `whatwg-fetch`를 찾지 못하는 resolver 버그.
(`whatwg-fetch`는 설치되어 있으나 Node.js와 달리 Metro resolver가 node_modules 내부 TS 파일에서 의존성 탐색 실패)

### 해결

**에러 1 — 재설치:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm install whatwg-fetch
```

**에러 2 — metro.config.js 추가:**
```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'whatwg-fetch') {
    return {
      filePath: require.resolve('whatwg-fetch'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

**Watchman 재시작** (파일 감시 누락 시):
```bash
watchman watch-del '/path/to/project' ; watchman watch-project '/path/to/project'
```

### 관련 파일
- `metro.config.js` (신규 생성)
- `package.json` (whatwg-fetch 추가)
- `package-lock.json` (재생성)
