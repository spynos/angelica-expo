import { createMMKV } from 'react-native-mmkv';

import type { SudokuDifficulty } from '@/src/types/db';

export const storage = createMMKV({ id: 'angelica-storage' });

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
}

export function clearSession(difficulty: SudokuDifficulty) {
  storage.remove(KEY_SESSION(difficulty));
}
