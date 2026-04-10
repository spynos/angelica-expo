# Angelica — Progress Note

최종 업데이트: 2026-04-11

마스터플랜: [cafe-angelica-masterplan.md](./cafe-angelica-masterplan.md)

---

## 🏁 현재 상태

**Sprint S1~S4 (MVP 코어) 구현 완료**. iPhone 16 Pro 실기기에서 Metro 붙여 Hot Reload 개발 중. EAS preview 빌드도 성공 이력 있음.

- Bundle ID: `com.angelica.cafe` (iOS/Android 동일)
- Supabase Project: `guheyzqxpxqtqdgamuev`
- Expo EAS Project ID: `290ea9dd-d5d5-4700-b1fe-85290cf94993`
- 타입체크 통과 (`npx tsc --noEmit` clean)

---

## ✅ 완료된 작업

### 인프라 / 기반
- Supabase 클라이언트 ([src/lib/supabase.ts](../src/lib/supabase.ts)) — **publishable key** 방식 (`sb_publishable_*`)
- `.env` — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (gitignore 처리)
- DB 스키마 7테이블 + RLS + 트리거 ([supabase/schema.sql](../supabase/schema.sql)) — Dashboard SQL Editor로 적용 완료
  - users, poems, likes, bookmarks, puzzles, puzzle_records, push_tokens
  - `handle_new_auth_user` 트리거로 auth signup 시 `public.users` 자동 생성 (닉네임 충돌 시 suffix)
- 연결 검증 스크립트: [scripts/test-supabase.mjs](../scripts/test-supabase.mjs), [scripts/test-feed.mjs](../scripts/test-feed.mjs)

### 테마 / 폰트
- [constants/theme.ts](../constants/theme.ts) — Palette/Colors(light+dark)/Spacing/Radius/Shadow/Typography 토큰, `ThemePalette` 타입 export
- 폰트: Gowun Batang (명조), Asta Sans (고딕) — `@expo-google-fonts/*`로 로드

### 인증 (S1)
- Zustand 세션 store + `useAuthBootstrap` ([src/store/auth.ts](../src/store/auth.ts))
- 이메일/비밀번호 — [app/(auth)/](../app/(auth)/) login, signup, signup-profile, reset-password
- Apple Sign-In (iOS) + Google OAuth (web flow) — [src/lib/social-auth.ts](../src/lib/social-auth.ts)
- Root layout에서 splash hide gating + auth-gated tabs

### 문학카페 (S2)
- [src/lib/poems.ts](../src/lib/poems.ts) — fetchFeed, fetchPoem, createPoem, updatePoem, deletePoem, toggleLike, toggleBookmark
- [src/components/PoemCard.tsx](../src/components/PoemCard.tsx)
- [app/(tabs)/cafe/](../app/(tabs)/cafe/) — index(피드 + FAB), write(에디터: 제목/본문/서체3/배경4/공개범위), [id](상세 + 좋아요/북마크/삭제)
- Feed 로딩은 `userIdRef`로 stale closure 회피 (무한로딩 버그 수정)

### 퍼즐 / 스도쿠 (S3)
- [src/lib/sudoku.ts](../src/lib/sudoku.ts) — 백트래킹 생성기 + `findConflicts` + `isSolved` (⚠️ unique solution 검증은 없음)
- [src/lib/storage.ts](../src/lib/storage.ts) — MMKV 기반 세션 저장 (`createMMKV` 사용, `react-native-mmkv@4` API)
- [src/components/SudokuBoard.tsx](../src/components/SudokuBoard.tsx) — 셀 하이라이트(행/열/박스/동일값), 메모 9분할 렌더
- [app/(tabs)/puzzle/](../app/(tabs)/puzzle/) — index(난이도), sudoku/[difficulty](보드/메모/힌트3/실행취소/타이머/자동저장), sudoku/complete

### 알림 / 설정 (S4)
- [src/lib/push.ts](../src/lib/push.ts) — expo-notifications 권한 요청, Expo push token 발급, `push_tokens` upsert
- [app/(tabs)/settings.tsx](../app/(tabs)/settings.tsx) — 알림 ON/OFF, preferred_hour 6개 프리셋
- [app/(tabs)/profile.tsx](../app/(tabs)/profile.tsx) — 프로필 표시 + 설정 진입 + 로그아웃

### 네이티브 / 빌드
- `app.json`에 `usesAppleSignIn: true`, `expo-apple-authentication`/`expo-web-browser` 플러그인, `ITSAppUsesNonExemptEncryption: false`
- `expo-dev-client` 설치 → Xcode workspace로 iPhone 실기기 빌드 성공
- 로컬 개발: Metro를 LAN 호스트로 띄워(`REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.90`) iPhone에서 Hot Reload
- EAS preview 빌드 성공: https://expo.dev/accounts/spynos/projects/angelica/builds/3d6a3e4c-47b2-43c8-ba5a-49cf64a3bd35

---

## 🔐 외부 설정 상태

| 항목 | 상태 |
|------|------|
| Supabase DB 스키마 적용 | ✅ |
| Supabase Apple Provider | ⚠️ 초기 상태 (활성화 필요) |
| Supabase Google Provider | 🟡 설정 중 (Client ID/Secret 입력 + Redirect URLs) |
| Supabase Redirect URLs `angelica://auth-callback` | ⚠️ 확인 필요 |
| Apple Developer — Sign in with Apple capability, Services ID, Key | ⚠️ 미설정 |
| Google Cloud — OAuth Web Client + consent screen | 🟡 사용자 작업 중 |
| EAS iOS credentials (`com.angelica.cafe`) | ✅ 생성됨 |
| EAS 등록 디바이스 (iPhone 16 Pro) | ✅ |

---

## 🐞 알려진 이슈 / 제한

1. **스도쿠 생성기** — 유일해 보장 없음. 클라이언트 생성 방식이라 유저마다 다른 퍼즐을 받음. 마스터플랜의 "매일 같은 퍼즐" 요구 미달.
2. **시 수정 화면** (`/cafe/edit/[id]`) 미구현 — 현재는 삭제만 가능
3. **프로필 편집** (닉네임/bio/avatar) 미구현
4. **Expo CLI 54.0.23 + Xcode 26 devicectl 호환 버그** — `npx expo run:ios`가 시뮬레이터를 physical device로 오인. 우회로 Xcode workspace를 직접 빌드 (`xcodebuild -workspace ... -sdk iphonesimulator` 또는 GUI) 사용.
5. **이미지 첨부, 팔로우, 댓글, 데일리 프롬프트, 고전시 아카이브** — 모두 v2 범위라 미구현
6. **온보딩 화면** (4개 슬라이드) 미구현

---

## 🗺 다음에 할 일 (우선순위 순)

### ① 소셜 로그인 마무리
- [ ] Google OAuth 엔드투엔드 테스트 (앱에서 탭 → 브라우저 → callback → 세션)
- [ ] Apple Developer에서 Services ID + Key 생성 → Supabase Apple Provider에 JWT secret 입력 → 앱 테스트
- [ ] Supabase Redirect URLs에 `angelica://auth-callback` 등록 확인
- [ ] 필요 시 `@react-native-google-signin/google-signin`으로 네이티브 Google 로그인 전환 (UX 개선)

### ② 데일리 스도쿠 서버화
- [ ] Edge Function `generate-sudoku` 작성 (Deno) — 난이도 3개 × 1개씩 매일 생성
- [ ] `puzzles` 테이블에 insert, uniqueness 검증 포함
- [ ] pg_cron으로 매일 KST 23:00 (UTC 14:00) 스케줄
- [ ] 앱에서 `puzzles` 테이블을 읽도록 `src/lib/sudoku.ts` 교체 (로컬 생성은 fallback으로 유지)
- [ ] `puzzle_records` upsert로 서버 동기화 (MMKV는 오프라인 캐시 역할)

### ③ 시 편집 / 프로필 편집
- [ ] `app/(tabs)/cafe/edit/[id].tsx` — write 화면 재사용
- [ ] `app/(tabs)/profile/edit.tsx` — 닉네임/bio 수정, `public.users` update
- [ ] 아바타 업로드 (Supabase Storage) — v2로 미뤄도 됨

### ④ 푸시 알림 발송 파이프라인
- [ ] Edge Function `send-push` — 매시간 pg_cron 트리거, preferred_hour 매칭되는 토큰 찾아 Expo Push API 호출
- [ ] 실기기에서 종단간 테스트 (시뮬레이터는 `Device.isDevice === false`라 불가)

### ⑤ UX / 폴리싱
- [ ] 온보딩 4-슬라이드 화면
- [ ] 홈 화면 콘텐츠 강화 (오늘의 프롬프트 placeholder, 최근 본 시 등)
- [ ] 빈 피드 상태 일러스트
- [ ] 스도쿠 완성 시 축하 애니메이션 (reanimated)
- [ ] 다크모드 전 화면 순회 점검

### ⑥ 출시 준비
- [ ] App Store 메타데이터 (아이콘, 스크린샷, 설명, 키워드)
- [ ] 개인정보처리방침 / 이용약관 페이지 (필수 — Apple Sign-In 쓰면 특히)
- [ ] EAS `production` 프로필로 빌드 → TestFlight 업로드
- [ ] 베타 테스트 (S4 스프린트 목표)

---

## 🧰 자주 쓰는 명령

```bash
# Metro (LAN 모드, iPhone 실기기용)
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.90 npx expo start --dev-client --host lan

# 시뮬레이터 직접 빌드 (Expo CLI 버그 우회)
cd ios && xcodebuild -workspace angelica.xcworkspace -scheme angelica \
  -configuration Debug -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath build

# 시뮬레이터에 설치 + 실행
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/angelica.app
xcrun simctl launch booted com.angelica.cafe

# 실기기 빌드
open ios/angelica.xcworkspace  # Xcode에서 Run (⌘R)

# EAS preview 빌드
npx eas-cli build --platform ios --profile preview

# 타입체크
npx tsc --noEmit

# Supabase 연결 검증
node scripts/test-supabase.mjs
node scripts/test-feed.mjs
```

---

## 📂 주요 디렉토리 맵

```
app/
  (auth)/           # login, signup(x2), reset-password
  (tabs)/
    _layout.tsx     # auth gate + 4 tabs
    index.tsx       # 홈
    cafe/           # 피드/작성/상세
    puzzle/         # 난이도/스도쿠/완성
    profile.tsx
    settings.tsx    # href: null (탭바 숨김)
  _layout.tsx       # 폰트 로드 + splash gating

src/
  lib/              # supabase, poems, sudoku, storage(MMKV), push, social-auth
  store/auth.ts     # Zustand
  components/       # PoemCard, SudokuBoard, ui/(Button,TextField)
  types/db.ts

constants/theme.ts  # Palette/Colors/Spacing/Radius/Shadow/Typography/FontFamily
supabase/schema.sql # 7 tables + RLS + triggers (단일 파일)
scripts/            # test-supabase, test-feed
```
