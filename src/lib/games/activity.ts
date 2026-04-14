import { storage } from '@/src/lib/storage';

import { GAME_ORDER, type GameId } from './registry';

export type GameActivity = {
  gameId: GameId;
  variant?: string;
  lastPlayedAt: number;
  startedAt: number;
  playCount: number;
  hasInProgress: boolean;
  bestScore?: number;
};

const KEY = (gameId: GameId) => `activity:${gameId}`;
const THROTTLE_MS = 5 * 60 * 1000;

function read(gameId: GameId): GameActivity | null {
  const raw = storage.getString(KEY(gameId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameActivity;
  } catch {
    return null;
  }
}

function write(activity: GameActivity) {
  storage.set(KEY(activity.gameId), JSON.stringify(activity));
}

export function getActivity(gameId: GameId): GameActivity | null {
  return read(gameId);
}

export function recordPlay(
  gameId: GameId,
  opts: { variant?: string; force?: boolean } = {},
): void {
  const now = Date.now();
  const prev = read(gameId);
  if (
    !opts.force &&
    prev &&
    now - prev.lastPlayedAt < THROTTLE_MS &&
    prev.variant === opts.variant
  ) {
    return;
  }
  write({
    gameId,
    variant: opts.variant ?? prev?.variant,
    lastPlayedAt: now,
    startedAt: prev?.startedAt ?? now,
    playCount: (prev?.playCount ?? 0) + (prev ? 0 : 1),
    hasInProgress: prev?.hasInProgress ?? false,
    bestScore: prev?.bestScore,
  });
}

export function markInProgress(gameId: GameId, hasInProgress: boolean, variant?: string) {
  const prev = read(gameId);
  const now = Date.now();
  write({
    gameId,
    variant: variant ?? prev?.variant,
    lastPlayedAt: prev?.lastPlayedAt ?? now,
    startedAt: prev?.startedAt ?? now,
    playCount: prev?.playCount ?? 1,
    hasInProgress,
    bestScore: prev?.bestScore,
  });
}

export function markCompleted(
  gameId: GameId,
  opts: { variant?: string; score?: number } = {},
) {
  const prev = read(gameId);
  const now = Date.now();
  const bestScore =
    opts.score == null
      ? prev?.bestScore
      : Math.max(prev?.bestScore ?? -Infinity, opts.score);
  write({
    gameId,
    variant: opts.variant ?? prev?.variant,
    lastPlayedAt: now,
    startedAt: prev?.startedAt ?? now,
    playCount: (prev?.playCount ?? 0) + 1,
    hasInProgress: false,
    bestScore: Number.isFinite(bestScore as number) ? (bestScore as number) : undefined,
  });
}

export function getAllActivities(): Record<GameId, GameActivity | null> {
  const out = {} as Record<GameId, GameActivity | null>;
  for (const id of GAME_ORDER) out[id] = read(id);
  return out;
}

export function getRecentOrder(): GameId[] {
  const activities = getAllActivities();
  const played = GAME_ORDER.filter((id) => activities[id]?.lastPlayedAt);
  const unplayed = GAME_ORDER.filter((id) => !activities[id]?.lastPlayedAt);
  played.sort((a, b) => (activities[b]!.lastPlayedAt - activities[a]!.lastPlayedAt));
  return [...played, ...unplayed];
}

export function clearAllActivity() {
  for (const id of GAME_ORDER) storage.remove(KEY(id));
}
