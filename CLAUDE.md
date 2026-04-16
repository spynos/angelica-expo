# CLAUDE.md

이 파일은 Claude Code (claude.com/code)가 이 저장소에서 작업할 때 참고하는 프로젝트별 지침입니다.

---

## 프로젝트 개요

**angelica-expo** — Expo SDK 55 기반 React Native 앱.
- 카페(`/cafe`), 퍼즐 게임(`/puzzle`, 블록매치·스도쿠 등), 프로필(`/profile`) 탭 구성
- 백엔드: Supabase
- Apple/Google OAuth 로그인 (`expo-auth-session`)
- 한국어 UI 우선

## 핵심 기술 스택

- **런타임**: Expo SDK 55 / React Native 0.83 / React 19.2
- **라우팅**: expo-router v6 (file-based)
- **애니메이션·제스처**: react-native-reanimated 4 / react-native-gesture-handler 2.30
- **상태관리**: Zustand (`src/store/`)
- **백엔드**: `@supabase/supabase-js`
- **폰트**: GowunBatang (한글 본문/제목), AstaSans (라틴/숫자)

## 디렉토리 구조

```
app/                    expo-router 라우트
  (auth)/               로그인 화면
  (tabs)/               메인 탭
    cafe/               카페 기능
    puzzle/             퍼즐 게임
    profile.tsx
src/
  components/           재사용 가능한 UI 컴포넌트
  lib/                  도메인 로직 (게임 규칙, Supabase 클라이언트 등)
  store/                Zustand 스토어
  types/                공유 타입
constants/theme.ts      디자인 토큰 (Colors, Spacing, Radius, Typography)
docs/                   기획·설계 문서
plugins/                Expo config plugin (Gradle 버전 고정 등)
```

## 문서 가이드

작업 종류에 따라 갱신할 문서가 다릅니다:

| 문서 | 언제 갱신하나 |
|---|---|
| `CHANGELOG.md` | **사용자에게 보이는 변경**(기능 추가, UX 개선, 버그 수정, 의존성 정합화 등). `[Unreleased]` 섹션에 한국어로 기록 |
| `docs/troubleshooting.md` | **빌드·개발 환경 에러와 해결법**(Metro/Gradle/Xcode 등 환경 트러블슈팅 사례) — 일반 기능 작업은 여기 쓰지 않음 |
| `docs/blockmatch-plan.md` 등 plan 문서 | 해당 기능의 설계가 바뀌었을 때 |
| `docs/cafe-angelica-masterplan.md` | 브랜드/서비스 큰 방향이 바뀌었을 때 (드물게) |

## 코딩 컨벤션

- TypeScript strict 모드, 함수형 컴포넌트
- 임포트 경로는 `@/` alias 사용 (예: `@/src/components/...`, `@/constants/theme`)
- 색·간격·반경·타이포는 `constants/theme.ts`의 토큰을 참조 (하드코딩 금지)
- 게임 로직은 `src/lib/{game}/`에, 화면은 `app/(tabs)/{tab}/`에 분리
- Reanimated worklet 안에서는 `runOnJS`로 JS 콜백 호출

## 커밋 지침 — **매 커밋은 `/커밋` 슬래시 커맨드를 사용한다**

이 저장소는 `.claude/commands/커밋.md`에 커밋 파이프라인을 정의해 두었다.
사용자가 "커밋해줘" 또는 이와 유사한 요청을 하면 **반드시 `/커밋` 슬래시
커맨드를 호출해서 그 안의 5단계 파이프라인을 따른다.** 임시로 `git commit`을
직접 실행하지 말고, `/커밋` 명령이 정의한 분류·문서갱신·atomic commit 분리·
형식을 그대로 적용한다.

핵심 요약 (자세한 규칙은 `/커밋` 참조):

- **Conventional Commits** 형식 (`feat`, `fix`, `docs`, `build`, `chore` 등)
- 사용자 가시 변경은 `CHANGELOG.md`의 `[Unreleased]`에 한국어로 같이 기록
- 환경 에러 트러블슈팅은 `docs/troubleshooting.md`에 케이스 추가
- 아키텍처/기술 선택은 `docs/adr/NNN-*.md`로 ADR 작성
- 서로 다른 관심사는 atomic commit으로 분리
- 풋터에 `Co-Authored-By: Claude {모델명} <noreply@anthropic.com>` 포함
- `--no-verify`, `git add -A`, amend, force push는 명시 요청 시에만

---

## 자주 쓰는 명령

```bash
# 개발 서버
npx expo start --dev-client

# 안드로이드 로컬 빌드 (Java 17 필요)
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" npx expo run:android

# 린트
npm run lint

# 의존성 정합화 (SDK 호환성 체크)
npx expo install --check
```

자세한 빌드 환경 설정은 `docs/dev-setup.md` 참조.
