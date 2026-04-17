import { BOARD_SIZE } from '@/src/lib/blockmatch/types';
import type { Cell } from '@/src/lib/blockmatch/types';

/**
 * JS → worklet board snapshot.
 *
 * Turns the Zustand `Cell[]` (tagged-union objects) into a plain `number[]`
 * that's trivially worklet-shareable and tight to index. A snapshot is
 * taken once at drag start — the board doesn't change mid-drag, so the
 * snap worklet reads this array every frame without re-polling React.
 *
 * Encoding:
 *   0 — empty
 *   1 — block (player piece cell)
 *   2 — obstacle (any HP; placement check treats all HP the same)
 */

export function boardToBits(board: Cell[]): number[] {
  const bits = new Array<number>(BOARD_SIZE * BOARD_SIZE);
  for (let i = 0; i < board.length; i++) {
    const cell = board[i];
    if (cell.kind === 'empty') bits[i] = 0;
    else if (cell.kind === 'block') bits[i] = 1;
    else bits[i] = 2;
  }
  return bits;
}
