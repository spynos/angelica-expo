import { storage } from '@/src/lib/storage';

import { markInProgress } from './activity';
import type { GameId } from './registry';

const KEY = (gameId: GameId, variant: string) => `progress:${gameId}:${variant}`;

export type ProgressPayload<T> = T & { version: number };

export function saveProgress<T>(
  gameId: GameId,
  variant: string,
  payload: ProgressPayload<T>,
): void {
  storage.set(KEY(gameId, variant), JSON.stringify(payload));
  markInProgress(gameId, true, variant);
}

export function loadProgress<T>(
  gameId: GameId,
  variant: string,
): ProgressPayload<T> | null {
  const raw = storage.getString(KEY(gameId, variant));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProgressPayload<T>;
  } catch {
    return null;
  }
}

export function clearProgress(gameId: GameId, variant: string): void {
  storage.remove(KEY(gameId, variant));
  markInProgress(gameId, false, variant);
}
