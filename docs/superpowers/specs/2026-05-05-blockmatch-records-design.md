# 블록매치 점수 기록 시스템 — 설계 (2026-05-05)

> 대상: `app/(tabs)/puzzle/history.tsx`, `src/lib/blockmatch/*`, `src/store/blockmatch.ts`
> 관련 문서: `docs/blockmatch-plan.md`, `docs/game-storage-plan.md`, ADR-003

---

## 1. 목적

블록매치 한 판이 끝날 때마다 결과를 로컬에 누적하고, `/puzzle/history` 화면에서 최근 10판을 확인할 수 있게 한다.
사용자가 게임 도중 앱을 종료해도 다시 들어오면 그 자리에서 그대로 이어 플레이할 수 있어야 한다 (부담 0).

비목표:
- 점수 **공식 변경**. 현재 `src/lib/blockmatch/score.ts`를 그대로 사용한다.
- 점수순 정렬, 기록 삭제 UI, 다른 게임(스도쿠 등) 기록, 서버 동기화, 시드 기반 리플레이.

---

## 2. 핵심 결정

| 항목 | 결정 |
|------|------|
| 점수 공식 | 현행 유지 (라인 100/250/450/700, 장애물 +50, 콤보 ×(1+0.2·n)) |
| 기록 보관량 | **최근 10판** rolling window (FIFO) |
| 기록 트리거 | 자연 게임오버(`isOver=true`)일 때만 1건 추가 |
| 수동 restart | 진행 중 판은 폐기, 기록에 남기지 **않음** |
| 진행 중 세션 자동저장 | 현재 `saveProgress` 흐름 유지 (착수마다 디스크 반영) |
| 누적 통계 위치 | `GameState` 안에 필드 추가, 엔진에서 갱신 |
| 표시 화면 | `puzzle/history.tsx` (블록매치 섹션 신설) |
| 게임오버 시트 | 기존 그대로 + 작은 "내 기록 보기 →" 링크 추가 |
| 기록 삭제 UI | 없음 (10판 자연 회전) |

---

## 3. 데이터 모델

### 3.1 기록 한 건

```ts
// src/lib/blockmatch/types.ts
export type BlockMatchRecord = {
  id: string;                  // uuid v4
  score: number;               // 최종 점수
  stage: number;               // 종료 시점 스테이지
  endedAt: number;             // epoch ms
  playtimeSec: number;         // startedAt → endedAt 경과 초
  peakCombo: number;           // 한 판 내 도달한 최대 콤보
  obstaclesDestroyed: number;  // 한 판 누적 장애물 처치 수
  linesCleared: number;        // 한 판 누적 라인 수
};
```

### 3.2 영속 페이로드

```ts
export type BlockMatchRecordsPersist = {
  version: 1;
  records: BlockMatchRecord[]; // 최신순(맨 앞이 가장 최근), 최대 10건
};
```

- MMKV 키: `blockmatch:records`
- 직렬화: `JSON.stringify` (스도쿠 세션과 동일 패턴)
- `version` 불일치 시 빈 array로 fallback (마이그레이션은 추후 필요해질 때).

### 3.3 `GameState` 변경

`src/lib/blockmatch/types.ts`의 `GameState`에 4개 필드 추가:

```ts
type GameState = {
  // ... 기존 필드 유지
  startedAt: number;             // 새 게임 시작 epoch ms
  peakCombo: number;             // max(combo) 누적
  obstaclesDestroyedTotal: number;
  linesClearedTotal: number;
};
```

진행 중 세션 영속화(`saveProgress`)에 자연스럽게 따라가므로, 앱을 죽였다 켜도 통계가 유지된다.

---

## 4. 영속화 모듈 (`src/lib/blockmatch/records.ts`, 신설)

```ts
import { storage } from '@/src/lib/storage';

const KEY = 'blockmatch:records';
const MAX = 10;
const VERSION = 1;

export function loadRecords(): BlockMatchRecord[] {
  const raw = storage.getString(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BlockMatchRecordsPersist;
    if (parsed.version !== VERSION) return [];
    return parsed.records ?? [];
  } catch {
    return [];
  }
}

export function appendRecord(record: BlockMatchRecord): BlockMatchRecord[] {
  const next = [record, ...loadRecords()].slice(0, MAX);
  storage.set(KEY, JSON.stringify({ version: VERSION, records: next }));
  return next;
}

// 테스트/디버그용. UI 노출 없음.
export function clearAllRecords(): void {
  storage.remove(KEY);
}
```

순수 함수 단위 테스트 대상:
- `appendRecord`가 unshift 동작하고 11번째에서 가장 오래된 것을 자르는지.
- `version` 불일치 시 `loadRecords`가 빈 array를 반환하는지.

---

## 5. 엔진 변경 (`src/lib/blockmatch/engine.ts`)

### 5.1 `initialState`

새 필드 초기화:

```ts
return {
  // ... 기존
  startedAt: Date.now(),
  peakCombo: 0,
  obstaclesDestroyedTotal: 0,
  linesClearedTotal: 0,
};
```

`restart` 액션은 기존대로 `initialState(...)`로 갈음하므로 자동으로 새 `startedAt`이 부여된다.

### 5.2 `reduce('place')`

`turn` 계산 직후 누적:

```ts
const newPeakCombo = Math.max(state.peakCombo, newCombo);
const newObstaclesTotal = state.obstaclesDestroyedTotal + cleared.obstaclesDestroyed;
const newLinesTotal = state.linesClearedTotal + linesCleared;
```

리턴 state에 위 3개를 갈아끼움.

### 5.3 게임오버 시 기록 생성은 store에서

엔진은 순수 함수를 유지한다. 기록 append는 IO 부수효과가 있으므로 store에서 처리한다 (§6 참조).

---

## 6. Store 변경 (`src/store/blockmatch.ts`)

`dispatch`의 게임오버 분기에 한 줄 추가:

```ts
if (result.state.isOver) {
  const finalScore = result.state.score;
  const prevHigh = readHighScore();
  if (finalScore > prevHigh) writeHighScore(finalScore);

  // ▼ 신규
  const now = Date.now();
  const record: BlockMatchRecord = {
    id: makeId(),                       // 단순 random short id; 충돌 무시 가능
    score: finalScore,
    stage: result.state.stage,
    endedAt: now,
    playtimeSec: Math.max(0, Math.round((now - result.state.startedAt) / 1000)),
    peakCombo: result.state.peakCombo,
    obstaclesDestroyed: result.state.obstaclesDestroyedTotal,
    linesCleared: result.state.linesClearedTotal,
  };
  appendRecord(record);
  set({ lastFinishedRecordId: record.id });
  // ▲ 신규

  markCompleted('blockmatch', { score: finalScore });
  clearProgress('blockmatch', VARIANT);
}
```

Store 타입에 `lastFinishedRecordId: string | null` 추가 (게임오버 직후 history.tsx 진입 시 강조용). `restart` 액션에서 `null`로 리셋 — 새 판이 시작되면 이전 강조 id는 의미가 없다.

`makeId` 구현 노트: React Native 환경에서 `crypto.randomUUID`가 항상 보장되지 않으므로, `Date.now() + Math.random` 기반 14자리 short id로 충분하다. 충돌 우려는 10건 cap에서 무시 가능.

---

## 7. UI

### 7.1 `app/(tabs)/puzzle/history.tsx` (placeholder 교체)

레이아웃:

```
[Header: "기록"]
[Section header: "블록매치"]
  ─ records.length === 0 ─
    [Empty state]
       "아직 완료한 판이 없어요"
       "한 판 시작해볼까요?"
       [블록매치 시작하기 →] (router.push('/puzzle/blockmatch'))

  ─ records.length > 0 ─
    [Card 1]  ← 방금 끝난 판이면 강조
    [Card 2]
    ...
    [Card N (최대 10)]
```

카드 한 행:

```
[ 점수 (큰 글씨) ]   [stage 3]   [3분 전 ▸ ]
콤보 ×4 · 라인 18 · 장애물 6 · 02:14
```

- 점수: `Typography.heading2` 정도, `score.toLocaleString()`.
- 스테이지: 작은 pill 뱃지.
- 종료 시각: 상대시간 포맷 (`방금 / N분 전 / N시간 전 / 어제 / YYYY-MM-DD`). 헬퍼 `formatRelativeTime(ms)`를 같은 파일에 둔다 (작아서 외부 모듈로 뺄 필요 없음).
- 보조 줄: muted 색, 작게.
- 강조: route param `highlight=<id>`가 카드 id와 일치하면 테두리(`palette.tint`)와 "방금" 뱃지. 강조는 한 번만 시각화하고 페이지 떠날 때까지 유지.

데이터 로드: 화면 마운트 시 `loadRecords()` 1회. focus시 재로드(`useFocusEffect` + `useState`)해서, 게임오버 후 navigate 해와도 최신 상태 반영.

다른 게임(스도쿠 등) 섹션은 이번 스펙에서 다루지 않는다. 화면은 블록매치 섹션 하나로 끝낸다.

### 7.2 `src/components/blockmatch/GameOverSheet.tsx`

기존 점수/최고점수 표시는 그대로 두고, 시트 하단(닫기 버튼들 위)에 작은 텍스트 링크 한 줄 추가:

```
내 기록 보기 →
```

탭하면:

```ts
const id = useBlockMatch.getState().lastFinishedRecordId;
router.push({
  pathname: '/puzzle/history',
  params: id ? { highlight: id } : {},
});
```

(`router.dismiss` 또는 시트 닫는 처리 같이 필요한 경우 동일 흐름.)

---

## 8. 작업 순서 (구현 시점에 plan 문서가 깐다)

1. `types.ts` — `BlockMatchRecord`, `BlockMatchRecordsPersist`, `GameState` 4필드 추가.
2. `records.ts` 신설 — `loadRecords` / `appendRecord` / `clearAllRecords`.
3. `engine.ts` — `initialState` 초기화, `reduce('place')` 누적 갱신.
4. `store/blockmatch.ts` — `lastFinishedRecordId` 추가, 게임오버 시 `appendRecord` 호출.
5. `GameOverSheet.tsx` — "내 기록 보기 →" 링크.
6. `history.tsx` — 블록매치 섹션 구현 (카드 / 빈 상태 / 강조 / 상대시간 헬퍼).
7. 단위 테스트 — `records.ts`, `engine.reduce` 누적 갱신.
8. 수동 QA — 게임 한 판 → 게임오버 → 링크 → 강조 확인 / 11판째에서 가장 오래된 것 떨어지는지 / 진행 중 앱 종료 후 복귀 시 통계 유지.
9. `CHANGELOG.md` `[Unreleased]` 한국어 항목 추가.

---

## 9. 영향 / 리스크

- **`GameState` 형 변경**: 기존 `lastSession` 영속 데이터(`game-storage-plan.md`의 `progress` 키 구조)를 가진 사용자가 업데이트 후 로드하면 새 4필드가 `undefined`. `loadProgress`에서 `version` 체크가 이미 있으므로 (`PAYLOAD_VERSION = 1`), **`PAYLOAD_VERSION`을 2로 올려서** 구버전 진행 중 세션은 폐기되도록 한다. 사용자 영향: 진행 중인 한 판이 사라지지만, 기록 자체는 별도 키라 영향 없음. 베타 단계에서 수용 가능한 수준.
- **시간 측정**: `playtimeSec`는 `Date.now()` 기반. 사용자가 시계를 조작하면 음수가 나올 수 있어 `Math.max(0, …)`로 가드.
- **MMKV 용량**: 한 record가 ~150 bytes 이하 × 10 = 1.5 KB. 무시 가능.

---

## 10. 명시적 비목표 (YAGNI)

- 점수 공식 수정, 점수순 정렬 토글, 기록 삭제 UI, 통계 화면(평균/총합), 다른 게임 기록 섹션, Supabase 동기화, 시드 기반 리플레이 카드.

이 항목들은 별도 스펙으로 분리한다.
