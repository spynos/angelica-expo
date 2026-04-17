import Constants, { ExecutionEnvironment } from 'expo-constants';

import type { SudokuDifficulty } from '@/src/types/db';

// ---------------------------------------------------------------------------
// Expo Go detection
// ---------------------------------------------------------------------------

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ---------------------------------------------------------------------------
// Synchronous key-value storage interface
// ---------------------------------------------------------------------------

interface SyncStorage {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  set(key: string, value: string | number | boolean): void;
  remove(key: string): void;
}

// ---------------------------------------------------------------------------
// AsyncStorage-backed synchronous cache (for Expo Go)
//
// Reads are served from an in-memory Map that is hydrated once at startup.
// Writes are applied to the Map immediately (synchronous) and flushed to
// AsyncStorage in the background.
// ---------------------------------------------------------------------------

function createAsyncStorageAdapter(): SyncStorage {
  // Lazy-require so the native MMKV binary is never touched in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default as typeof import('@react-native-async-storage/async-storage').default;

  const PREFIX = '@angelica:';
  const cache = new Map<string, string>();
  let hydrated = false;

  // Fire-and-forget hydration — fills the cache from disk.
  AsyncStorage.getAllKeys()
    .then((keys) => {
      const ours = (keys ?? []).filter((k) => k.startsWith(PREFIX));
      if (ours.length === 0) {
        hydrated = true;
        return;
      }
      return AsyncStorage.multiGet(ours).then((pairs) => {
        for (const [k, v] of pairs ?? []) {
          if (v != null) cache.set(k.slice(PREFIX.length), v);
        }
        hydrated = true;
      });
    })
    .catch(() => {
      hydrated = true;
    });

  return {
    getString(key) {
      return cache.get(key);
    },
    getNumber(key) {
      const v = cache.get(key);
      if (v == null) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    },
    set(key, value) {
      cache.set(key, String(value));
      AsyncStorage.setItem(PREFIX + key, String(value)).catch(() => {});
    },
    remove(key) {
      cache.delete(key);
      AsyncStorage.removeItem(PREFIX + key).catch(() => {});
    },
  };
}

// ---------------------------------------------------------------------------
// MMKV (dev-client / production builds)
// ---------------------------------------------------------------------------

function createMMKVStorage(): SyncStorage {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  return createMMKV({ id: 'angelica-storage' });
}

// ---------------------------------------------------------------------------
// Exported singleton
// ---------------------------------------------------------------------------

export const storage: SyncStorage = isExpoGo
  ? createAsyncStorageAdapter()
  : createMMKVStorage();

// ---------------------------------------------------------------------------
// Sudoku session helpers
// ---------------------------------------------------------------------------

// Lazily import to avoid a require cycle (activity.ts imports `storage`).
function markSudokuInProgress(variant: SudokuDifficulty, hasInProgress: boolean) {
  const { markInProgress } = require('./games/activity') as typeof import('./games/activity');
  markInProgress('sudoku', hasInProgress, variant);
}

export type SudokuSession = {
  difficulty: SudokuDifficulty;
  puzzle: number[];
  solution: number[];
  state: number[];
  memo: Record<number, number[]>;
  hintsLeft: number;
  errorCount: number;
  elapsedSeconds: number;
  startedAt: number;
  completedAt: number | null;
};

const KEY_SESSION = (difficulty: SudokuDifficulty) => `sudoku:session:${difficulty}`;

export function loadSession(difficulty: SudokuDifficulty): SudokuSession | null {
  const raw = storage.getString(KEY_SESSION(difficulty));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SudokuSession;
  } catch {
    return null;
  }
}

export function saveSession(session: SudokuSession) {
  storage.set(KEY_SESSION(session.difficulty), JSON.stringify(session));
  markSudokuInProgress(session.difficulty, !session.completedAt);
}

export function clearSession(difficulty: SudokuDifficulty) {
  storage.remove(KEY_SESSION(difficulty));
  markSudokuInProgress(difficulty, false);
}
