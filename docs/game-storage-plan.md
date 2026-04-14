# 게임 진행/기록 저장 통합 계획 v0.1

> 대상: 모든 퍼즐 게임 (현재 스도쿠 / 신규 블록매치 / 향후 십자말풀이·장학퀴즈)
> 목표: ① 게임이 추가돼도 깨지지 않는 저장 스키마 ② 최근 플레이 기반 동적 카드 정렬 ③ 향후 클라우드 동기화 여지 확보

---

## 1. 현재 상태 분석

### 1.1 로컬(MMKV) — `src/lib/storage.ts`
- MMKV 인스턴스 1개(`angelica-storage`).
- 스도쿠 진행 세션을 `sudoku:session:{difficulty}` 키로 저장 (`SudokuSession`).
- 게임 완료 시 `clearSession`으로 삭제 → **완료 기록은 어디에도 남지 않음**.
- "마지막에 어떤 게임을 했는지" 정보가 없음 (퍼즐 홈에서 정렬에 쓸 수 없음).
- 게임별 키 컨벤션이 자유 → 게임이 늘면 흩어진다.

### 1.2 원격(Supabase) — `src/types/db.ts`
- `puzzles`, `puzzle_records` 테이블이 정의돼 있으나 **스도쿠 전용 스키마**:
  - `puzzle_id`, `state: number[]`, `memo: Record<string, number[]>`, `error_count`, `hint_count`...
  - 블록매치(보드 100칸 + 장애물 + 점수 + 콤보)나 퀴즈에는 안 맞는다.
- 코드 어디에서도 supabase에 puzzle_records를 read/write 하지 않음 (현재 미사용).
- `app/(tabs)/puzzle/history.tsx`는 placeholder.

### 1.3 한 줄 요약
> 게임별로 진행 상태를 따로 들고 있을 뿐이고, **"누가 / 언제 / 어떤 게임을" 했는지 횡적으로 묶는 레이어가 없다.** 카드 동적 정렬을 하려면 이 레이어부터 만들어야 한다.

---

## 2. 설계 원칙

1. **게임-아그노스틱 코어 + 게임-스페시픽 페이로드.** 코어가 알아야 하는 건 `gameId`, `variant?`, `lastPlayedAt`, `bestScore?`, `hasInProgress` 정도. 보드 상태·메모·블록 큐 같은 건 페이로드(JSON)로 캡슐화.
2. **로컬 우선, 원격은 동기화.** MMKV가 single source of truth. 로그인 사용자에 한해 원격으로 mirror.
3. **게임마다 자기 모듈이 자기 직렬화를 책임진다.** 코어는 `unknown` JSON으로만 다룬다.
4. **마이그레이션 가능성.** 페이로드에 `version` 필드 필수. 깨지면 silently drop.
5. **지금 안 만들어도 되는 건 안 만든다.** Supabase 동기화·일반화는 인터페이스만 잡고 구현은 보류.

---

## 3. 통합 데이터 모델

### 3.1 GameId 카탈로그

```ts
// src/lib/games/registry.ts
export type GameId = 'sudoku' | 'blockmatch' | 'crossword' | 'quiz';

export type GameMeta = {
  id: GameId;
  title: string;
  description: string;
  icon: IconSymbolName;
  background: string;
  foreground: string;
  mutedForeground: string;
  route: (variant?: string) => string;
  comingSoon?: boolean;
};

export const GAMES: Record<GameId, GameMeta> = { ... };
export const GAME_ORDER: GameId[] = ['sudoku', 'crossword', 'blockmatch', 'quiz'];
```

> 퍼즐 홈/카드 디자인이 이 한 곳에서 흘러나온다. 새 게임을 카드에 노출하려면 여기에만 추가.

### 3.2 활동 기록 (Activity)

게임 횡단으로 **카드 정렬·"이어하기" 배지·최고점수**에만 쓰는 가벼운 메타.

```ts
// src/lib/games/activity.ts
export type GameActivity = {
  gameId: GameId;
  variant?: string;       // sudoku의 difficulty, blockmatch의 mode 등
  lastPlayedAt: number;   // epoch ms
  startedAt: number;      // 첫 플레이 시각
  playCount: number;
  hasInProgress: boolean; // 진행 중 세션 존재 여부
  bestScore?: number;     // 점수형 게임만
};

// 키: 'activity:{gameId}'  → 게임당 1 record
// 'activity:index'         → GameId[] (lastPlayedAt 내림차순 캐시)
```

API:
```ts
recordPlay(gameId, opts?): void           // 게임 진입/턴 진행 시 호출
markCompleted(gameId, opts?: { score? }): void
markInProgress(gameId, hasInProgress): void
getActivity(gameId): GameActivity | null
getRecentOrder(): GameId[]                // GAME_ORDER를 lastPlayedAt 기준 재정렬
```

### 3.3 진행 중 세션 (Progress)

게임-스페시픽 JSON. 코어는 키 컨벤션만 강제.

```ts
// src/lib/games/progress.ts
const KEY = (gameId: GameId, variant = '_') => `progress:${gameId}:${variant}`;

saveProgress<T>(gameId, variant, payload: T & { version: number }): void
loadProgress<T>(gameId, variant): T | null
clearProgress(gameId, variant): void
```

`progress.save`는 내부적으로 `markInProgress(gameId, true)`까지 호출.
`progress.clear`는 `markInProgress(gameId, false)`.

### 3.4 완료 기록 (History) — Phase 2

매 판 완료/실패 시 append-only 로그. **현재는 미구현, 인터페이스만 예약.**

```ts
type GameHistoryEntry = {
  id: string;             // uuid
  gameId: GameId;
  variant?: string;
  result: 'cleared' | 'failed';
  score?: number;
  durationSeconds: number;
  endedAt: number;
  payload?: unknown;      // 게임별 추가 정보 (옵션)
};
// 키: 'history:list' (size cap 200, 오버되면 오래된 것부터 drop)
//      또는 'history:{gameId}'로 분리
```

`app/(tabs)/puzzle/history.tsx`가 이걸 읽는다.

### 3.5 원격(Supabase) — Phase 3

기존 `puzzle_records`를 스도쿠 전용으로 두고, 일반화된 새 테이블을 추가:

```sql
create table game_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  game_id text not null,
  variant text,
  result text not null,             -- 'cleared' | 'failed'
  score integer,
  duration_seconds integer not null,
  payload jsonb,
  ended_at timestamptz not null,
  created_at timestamptz default now()
);
create index on game_records (user_id, ended_at desc);
```

진행 중 세션은 굳이 원격에 두지 않는다 (기기 간 동기화 요구가 생기면 그때 `game_sessions` 추가). 완료 기록만 sync.

마이그레이션 경로: 신규 `game_records.game_id = 'sudoku'` 데이터로 점진 이전, 기존 `puzzle_records`는 동결.

---

## 4. 마이그레이션 단계

### Phase 1 — 통합 코어 + 동적 정렬 (이번 PR)
1. `src/lib/games/registry.ts` 신규
2. `src/lib/games/activity.ts` 신규 (MMKV)
3. `src/lib/games/progress.ts` 신규 (얇은 wrapper)
4. **스도쿠 통합**: 기존 `loadSession/saveSession`을 `progress.*`로 wrap, 게임 진입 시 `recordPlay`, 완료 시 `markCompleted`.
   - 기존 키(`sudoku:session:{difficulty}`)는 그대로 두고 read fallback → 한 번 read하면 새 키로 migrate해서 쓰기. (사용자 진행 중 세션 손실 방지)
5. `app/(tabs)/puzzle/index.tsx` 카드를 `getRecentOrder()` 기반으로 정렬, "이어하기" 배지 노출.

### Phase 2 — 블록매치 통합 (블록매치 M2)
- 블록매치 페이로드 타입 정의 후 `progress.*`만 사용.
- 게임 오버 시 `markCompleted({ score })` 호출 → bestScore 갱신.
- 별도 키 정의 없음.

### Phase 3 — History 화면 + Supabase sync
- `history.ts` 추가 + history 화면 구현.
- 로그인 사용자에 한해 `game_records` 테이블에 mirror, 풀 동기화는 단방향(local → remote)부터.

---

## 5. 이번 PR 변경 범위 (Phase 1 구체화)

신규:
- `src/lib/games/registry.ts`
- `src/lib/games/activity.ts`
- `src/lib/games/progress.ts`

수정:
- `src/lib/storage.ts` — `SudokuSession` 타입은 유지, helper는 deprecated 마킹 후 progress wrapper로 위임.
- `app/(tabs)/puzzle/sudoku/[difficulty].tsx` — 진입/완료 hook에 activity 호출 1줄씩 추가.
- `app/(tabs)/puzzle/index.tsx` — 하드코딩 FEATURED 배열을 registry + activity 기반으로.

테스트:
- 수동: 스도쿠 두 난이도를 번갈아 풀고 퍼즐 홈에 돌아왔을 때 카드 순서가 갱신되는지.
- 수동: 진행 중인 게임이 있는 카드에 "이어하기" 라벨이 보이는지.

---

## 6. 비기능 고려

- **MMKV write 빈도**: 스도쿠는 1초마다 elapsed 기록 → activity까지 매번 쓰면 낭비. activity는 **세션 시작/완료/일정 throttle (5분)** 시점에만 갱신.
- **시간 소스**: 모두 `Date.now()`. 향후 timezone-aware 표시 필요해도 storage는 epoch ms 유지.
- **버전 필드**: 페이로드에 `version`. registry에도 `payloadVersion` 두면 migration 분기 용이 (Phase 2에서 도입).
- **삭제/리셋**: 사용자 로그아웃이나 "기록 초기화" 액션을 위해 `clearAllActivity()` / `clearAllProgress()` 노출.
