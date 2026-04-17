import type { Offset } from '@/src/lib/blockmatch/types';

import { KEEP_THRESHOLD_SQ, SHOW_THRESHOLD_SQ } from '../engine/constants';
import type { CellPos } from '../engine/types';

/**
 * Ghost snap — the single most feel-sensitive function in the game.
 *
 * Snap model:
 *   1. Candidate = Math.round(rawCx/Y): the nearest grid-aligned anchor.
 *      Distance is measured from rawCx to round(rawCx), so max = 0.5 cells
 *      in any axis.
 *   2. SHOW gate (SHOW_THRESHOLD_SQ = 0.25 = 0.5²): snap fires when the
 *      piece anchor is within 0.5 cells of the candidate. The snap zone is
 *      a circle of radius 0.5 cells; the four cell-corner zones fall through
 *      to the KEEP gate.
 *   3. KEEP gate (KEEP_THRESHOLD_SQ = 2.25 = 1.5²): once a valid snap
 *      exists, the ghost holds that anchor until the finger moves more than
 *      1.5 cells away *from the previous snap position* (not from the new
 *      candidate). This is the key fix vs. the old implementation, which
 *      measured distance to the current candidate (making KEEP a dead path).
 *
 * KEEP also fires when the finger is within 0.5 cells but the candidate
 * placement is invalid — so the ghost never jumps to an occupied cell;
 * it holds the last valid anchor instead.
 */

export type SnapResult = {
  anchor: CellPos;
  valid: boolean;
  show: boolean;
  distSq: number;
};

export function ghostSnap(
  anchorPxX: number,
  anchorPxY: number,
  cellSize: number,
  shape: readonly Offset[],
  boardBits: readonly number[],
  boardCols: number,
  boardRows: number,
  prevAnchor: CellPos,
  prevValid: boolean,
): SnapResult {
  'worklet';

  const rawCx = anchorPxX / cellSize;
  const rawCy = anchorPxY / cellSize;

  // Nearest grid-aligned snap candidate.
  const anchorCol = Math.round(rawCx);
  const anchorRow = Math.round(rawCy);

  // Distance² from current position to nearest candidate (max 0.5 per axis).
  const dx = rawCx - anchorCol;
  const dy = rawCy - anchorRow;
  const distSq = dx * dx + dy * dy;

  // Distance² from current position to the *previous* valid snap anchor.
  // KEEP is always measured here — not against the new candidate.
  const hasPrev = prevValid && prevAnchor.row >= 0;
  let distSqToPrev = 9999;
  if (hasPrev) {
    const dpx = rawCx - prevAnchor.col;
    const dpy = rawCy - prevAnchor.row;
    distSqToPrev = dpx * dpx + dpy * dpy;
  }

  // SHOW gate: within 0.5-cell snap radius?
  if (distSq > SHOW_THRESHOLD_SQ) {
    // Outside snap circle. Hold previous valid snap up to 1.5 cells.
    if (hasPrev && distSqToPrev < KEEP_THRESHOLD_SQ) {
      return { anchor: prevAnchor, valid: true, show: true, distSq };
    }
    return { anchor: { row: -1, col: -1 }, valid: false, show: false, distSq };
  }

  // Candidate is within snap radius. Clamp to board bounds before placement check.
  const col = Math.max(0, Math.min(boardCols - 1, anchorCol));
  const row = Math.max(0, Math.min(boardRows - 1, anchorRow));

  // Placement check: every cell of the shape must be in-bounds and empty.
  let placeable = true;
  for (let i = 0; i < shape.length; i++) {
    const r = row + shape[i][0];
    const c = col + shape[i][1];
    if (r < 0 || r >= boardRows || c < 0 || c >= boardCols) {
      placeable = false;
      break;
    }
    if (boardBits[r * boardCols + c] !== 0) {
      placeable = false;
      break;
    }
  }

  // Within snap radius but invalid placement → KEEP previous valid snap.
  // The ghost never "moves" to an occupied position.
  if (!placeable && hasPrev && distSqToPrev < KEEP_THRESHOLD_SQ) {
    return { anchor: prevAnchor, valid: true, show: true, distSq };
  }

  // Invalid placement with no valid KEEP target — hide the ghost entirely
  // rather than showing a semi-transparent block over occupied cells.
  if (!placeable) {
    return { anchor: { row: -1, col: -1 }, valid: false, show: false, distSq };
  }

  return {
    anchor: { row, col },
    valid: true,
    show: true,
    distSq,
  };
}
