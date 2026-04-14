import { create } from 'zustand';

import { initialState, reduce } from '@/src/lib/blockmatch/engine';
import type { Action, GameState, TurnSummary } from '@/src/lib/blockmatch/types';
import { markCompleted, recordPlay } from '@/src/lib/games/activity';
import { clearProgress, loadProgress, saveProgress } from '@/src/lib/games/progress';
import { storage } from '@/src/lib/storage';

const VARIANT = '_';
const HIGH_SCORE_KEY = 'blockmatch:highScore';
const PAYLOAD_VERSION = 1;

type Persisted = { version: number; state: GameState };

function readHighScore(): number {
  return storage.getNumber(HIGH_SCORE_KEY) ?? 0;
}

function writeHighScore(v: number) {
  storage.set(HIGH_SCORE_KEY, v);
}

type Store = {
  state: GameState;
  lastTurn: TurnSummary | null;
  hydrated: boolean;
  start: () => void;
  restart: () => void;
  dispatch: (action: Action) => void;
  finalize: () => void;
};

export const useBlockMatch = create<Store>((set, get) => ({
  state: initialState(undefined, 1, readHighScore()),
  lastTurn: null,
  hydrated: false,

  start: () => {
    if (get().hydrated) return;
    recordPlay('blockmatch');
    const high = readHighScore();
    const persisted = loadProgress<Persisted>('blockmatch', VARIANT);
    if (persisted && persisted.version === PAYLOAD_VERSION && !persisted.state.isOver) {
      set({ state: { ...persisted.state, highScore: high }, hydrated: true });
    } else {
      const fresh = initialState(undefined, 1, high);
      saveProgress('blockmatch', VARIANT, { version: PAYLOAD_VERSION, state: fresh });
      set({ state: fresh, hydrated: true });
    }
  },

  restart: () => {
    const high = readHighScore();
    const fresh = initialState(undefined, 1, high);
    saveProgress('blockmatch', VARIANT, { version: PAYLOAD_VERSION, state: fresh });
    recordPlay('blockmatch', { force: true });
    set({ state: fresh, lastTurn: null });
  },

  dispatch: (action) => {
    const { state } = get();
    const result = reduce(state, action);
    set({ state: result.state, lastTurn: result.turn ?? null });

    if (result.state.isOver) {
      const finalScore = result.state.score;
      const prevHigh = readHighScore();
      if (finalScore > prevHigh) writeHighScore(finalScore);
      markCompleted('blockmatch', { score: finalScore });
      clearProgress('blockmatch', VARIANT);
    } else if (result.turn || action.type === 'place' || action.type === 'rotate') {
      saveProgress('blockmatch', VARIANT, { version: PAYLOAD_VERSION, state: result.state });
    }
  },

  finalize: () => {
    set({ hydrated: false, lastTurn: null });
  },
}));
