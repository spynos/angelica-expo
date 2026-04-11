# 웹 개발 핸드오프 문서

모바일 앱(Expo)과 별도로 제작되는 **콘텐츠 제작자용 웹 페이지**(Next.js 예정)가 기존 모바일 앱과 공유해야 하는 정보를 정리한 문서입니다. 모바일 앱 리포(`angelica-expo`)는 참고용이며, 웹 앱은 독립 리포로 개발됩니다.

---

## 1. 인프라 공유

### Supabase 프로젝트

- **공유 대상**: 동일한 Supabase 프로젝트 하나를 모바일/웹이 같이 사용합니다. 별도 프로젝트를 만들지 않습니다.
- **환경변수**
  - `SUPABASE_URL` (= 모바일의 `EXPO_PUBLIC_SUPABASE_URL`)
  - `SUPABASE_ANON_KEY` (publishable key, = 모바일의 `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
  - `SUPABASE_SERVICE_ROLE_KEY` — **웹 서버(Route Handler / Server Action)에서만 사용**. 절대 클라이언트 번들에 노출 금지.
- 실제 값은 별도 채널로 전달합니다(문서에 커밋 금지).

### Supabase 클라이언트 구성 차이

모바일은 `AsyncStorage` 기반 세션을 쓰지만, 웹은 쿠키 기반이어야 SSR이 작동합니다.

- **웹에서 사용할 패키지**: `@supabase/ssr` (Next.js App Router 공식 권장)
- `createServerClient` / `createBrowserClient`를 분리해서 사용
- `detectSessionInUrl: true` (OAuth 콜백 처리)
- 모바일 구현 참고: [src/lib/supabase.ts](src/lib/supabase.ts)

---

## 2. 데이터베이스 스키마

### 주요 테이블

현재 모바일 앱이 사용하는 테이블 목록입니다. 전체 정의는 Supabase 대시보드에서 확인하세요.

| 테이블 | 용도 | 비고 |
|---|---|---|
| `users` | 사용자 프로필 | `auth.users`와 1:1. `nickname`, `bio`, `avatar_url` 보유 |
| `poems` | 콘텐츠(시/글) 본문 | `visibility: 'public' | 'private'`, `tags: text[]` |
| `likes` | 좋아요 | `(poem_id, user_id)` 복합 키 |
| `bookmarks` | 북마크 | `(poem_id, user_id)` 복합 키 |
| `puzzles` | 일일 스도쿠 퍼즐 | 웹 제작자 페이지와 무관할 수 있음 |
| `puzzle_records` | 사용자별 퍼즐 진행 상태 | 웹 제작자 페이지와 무관할 수 있음 |

### 타입 정의

모바일에서 사용하는 TypeScript 타입은 [src/types/db.ts](src/types/db.ts)에 있습니다. 복사해서 웹 리포에 둬도 되고, **권장은 Supabase CLI로 자동 생성**하는 방식입니다.

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
```

초기엔 수동 복사, 스키마 변경이 잦아지면 CI에서 자동 생성으로 전환하세요.

### 핵심 타입 요약

```ts
type PoemVisibility = 'public' | 'private';
type PoemFont = 'serif' | 'sans' | 'cursive';
type PoemBgColor = '#FFFFFF' | '#FAF7F2' | '#F5E6D8' | '#EDE8F5';

type Poem = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  font: PoemFont;
  bg_color: PoemBgColor;
  visibility: PoemVisibility;
  tags: string[];
  created_at: string;
  updated_at: string;
};
```

전체는 [src/types/db.ts](src/types/db.ts) 참고.

---

## 3. RLS(Row Level Security) 정책

현재 RLS는 **일반 사용자**(모바일 앱 이용자) 기준으로 작성되어 있습니다. 제작자 페이지에서 필요한 권한은 별도로 추가해야 합니다.

### 기존 정책 (모바일 기준)

- `poems`: 본인 글만 insert/update/delete, public 글은 모두 읽기 가능
- `likes`, `bookmarks`: 본인 것만 조작

### 웹(제작자) 페이지에서 필요한 확장

- **제작자 역할 구분 방법 결정 필요**
  - 옵션 A: `users` 테이블에 `role: 'user' | 'creator'` 컬럼 추가
  - 옵션 B: `auth.users.app_metadata.role = 'creator'` (Supabase Auth 메타데이터)
  - → **옵션 B 권장** (DB 스키마 변경 없고, JWT에 자동 포함)
- **제작자가 자기 콘텐츠만 관리**할 수 있는 RLS 정책 추가 필요
- **초안/발행 상태**가 필요하면 `poems.status` 컬럼 추가 논의 필요 (현재는 `visibility`만 있음)

RLS 정책 변경은 모바일 앱 동작에 영향을 주므로 **반드시 사전 협의** 후 마이그레이션을 적용하세요.

---

## 4. 인증

### 모바일 앱의 현재 로그인 수단

- Apple Sign-In (`expo-apple-authentication`)
- Google OAuth (`expo-auth-session`)
- 구현: [src/lib/social-auth.ts](src/lib/social-auth.ts)

### 웹에서 유의할 점

- **동일한 Supabase Auth 사용자 풀**을 공유합니다. 모바일에서 가입한 사용자가 웹에서 로그인해도 동일 계정.
- **OAuth 리다이렉트 URL**: 웹 도메인(예: `https://creators.angelica.app/auth/callback`)을 Supabase 대시보드 → Authentication → URL Configuration에 추가해야 합니다.
- **제작자 전용 접근 제어**: 로그인만으로는 부족. 일반 사용자도 로그인할 수 있으므로, `middleware.ts`에서 `role === 'creator'` 체크 후 비제작자는 차단하세요.

---

## 5. Storage (이미지/미디어)

- Supabase Storage 버킷을 사용합니다. 현재 모바일에서 사용 중인 버킷 이름과 정책은 Supabase 대시보드에서 확인 가능.
- 제작자 페이지는 이미지 업로드 빈도가 높으므로, 업로드 경로 컨벤션(`creator-uploads/<user_id>/<uuid>.jpg` 등)을 **웹 구현 시작 전에 합의**하세요.
- 대용량/리사이징이 필요하면 Supabase Storage의 image transformation 옵션 또는 외부 이미지 CDN(Cloudflare Images 등) 검토.

---

## 6. 비즈니스 로직 참고

웹에서 같은 콘텐츠를 다루므로, 모바일의 데이터 접근 로직을 **읽어보고 참고**하면 RLS와 쿼리 패턴을 이해하기 쉽습니다. 단, 그대로 import할 수는 없습니다(모바일 전용 SDK 사용 중).

- 콘텐츠 CRUD + 좋아요/북마크: [src/lib/poems.ts](src/lib/poems.ts)
- 인증/세션 관리: [src/store/auth.ts](src/store/auth.ts)
- 소셜 로그인: [src/lib/social-auth.ts](src/lib/social-auth.ts)

---

## 7. 디자인 참고 (공유 아님)

- 디자인 토큰은 [constants/theme.ts](constants/theme.ts)에 있으나, **웹은 별도 디자인 시스템**을 구축하는 것을 권장합니다(제작자 도구는 데스크톱 UX가 전혀 달라야 함).
- 브랜드 컬러/폰트만 참고용으로 공유하고, 컴포넌트는 shadcn/ui + Tailwind로 새로 구축하세요.
- 로고/파비콘: [assets/images/](assets/images/)

---

## 8. 변경 시 협의가 필요한 사항

아래 변경은 모바일 앱과 웹 앱 양쪽 모두에 영향을 주므로, **반드시 사전 공유**가 필요합니다.

- Supabase 테이블 스키마 변경 (컬럼 추가/삭제/타입 변경)
- RLS 정책 수정
- Storage 버킷 경로/정책 변경
- Auth 제공자 추가/변경
- 공통 enum 값 변경 (`PoemVisibility`, `PoemFont` 등)

협업 채널(Slack/Notion 등)을 먼저 정하고, 스키마 마이그레이션은 반드시 PR 리뷰를 거치도록 하세요.

---

## 9. 오픈 이슈 / 결정 필요 사항

웹 개발 착수 전에 결정해야 할 것들:

- [ ] 제작자 역할(`role`) 저장 위치: `users` 테이블 vs `auth.users.app_metadata`
- [ ] `poems.status` (draft/published/archived) 컬럼 추가 여부
- [ ] 제작자 가입 플로우: 자체 가입 vs 관리자 승인제
- [ ] Storage 업로드 경로 컨벤션
- [ ] 타입 공유 방식: 수동 복사 vs `supabase gen types` 자동화
- [ ] 웹 도메인 확정 (OAuth 리다이렉트 등록에 필요)
