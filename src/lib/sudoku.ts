// Lightweight sudoku generator/solver. 9x9 grids stored as flat number[] of length 81 (0 = empty).
// Algorithm: build a fully solved board via randomized backtracking, then dig holes
// based on difficulty. We don't enforce uniqueness here for the MVP — generation is
// fast enough that we can swap in a stricter generator later if needed.

import type { SudokuDifficulty } from '@/src/types/db';

export const N = 9;
export const SIZE = N * N;

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isValid(grid: number[], idx: number, val: number): boolean {
  const r = Math.floor(idx / N);
  const c = idx % N;
  for (let i = 0; i < N; i++) {
    if (grid[r * N + i] === val) return false;
    if (grid[i * N + c] === val) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[(br + i) * N + (bc + j)] === val) return false;
    }
  }
  return true;
}

function solve(grid: number[]): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[i] === 0) {
      for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (isValid(grid, i, v)) {
          grid[i] = v;
          if (solve(grid)) return true;
          grid[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function generateSolved(): number[] {
  const grid = new Array<number>(SIZE).fill(0);
  solve(grid);
  return grid;
}

const HOLES_BY_DIFFICULTY: Record<SudokuDifficulty, number> = {
  easy: 36,
  medium: 46,
  hard: 54,
};

export function generatePuzzle(difficulty: SudokuDifficulty): {
  grid: number[];
  solution: number[];
} {
  const solution = generateSolved();
  const grid = solution.slice();
  const holes = HOLES_BY_DIFFICULTY[difficulty];
  const order = shuffled(Array.from({ length: SIZE }, (_, i) => i));
  for (let k = 0; k < holes; k++) {
    grid[order[k]] = 0;
  }
  return { grid, solution };
}

export function findConflicts(grid: number[]): Set<number> {
  const conflicts = new Set<number>();
  // rows / cols / boxes
  for (let i = 0; i < N; i++) {
    const rowSeen = new Map<number, number>();
    const colSeen = new Map<number, number>();
    for (let j = 0; j < N; j++) {
      const rIdx = i * N + j;
      const cIdx = j * N + i;
      const rv = grid[rIdx];
      const cv = grid[cIdx];
      if (rv) {
        if (rowSeen.has(rv)) {
          conflicts.add(rIdx);
          conflicts.add(rowSeen.get(rv)!);
        } else rowSeen.set(rv, rIdx);
      }
      if (cv) {
        if (colSeen.has(cv)) {
          conflicts.add(cIdx);
          conflicts.add(colSeen.get(cv)!);
        } else colSeen.set(cv, cIdx);
      }
    }
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map<number, number>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const idx = (br * 3 + i) * N + (bc * 3 + j);
          const v = grid[idx];
          if (v) {
            if (seen.has(v)) {
              conflicts.add(idx);
              conflicts.add(seen.get(v)!);
            } else seen.set(v, idx);
          }
        }
      }
    }
  }
  return conflicts;
}

export function isSolved(grid: number[], solution: number[]): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[i] !== solution[i]) return false;
  }
  return true;
}
