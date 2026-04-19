import { Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';

import type { GhostEntity } from '../engine/types';

/**
 * Line-clear preview hint.
 *
 * Renders semi-transparent strips in the *current piece's color* over every
 * row/column that would be cleared if the player committed the ghost
 * placement. Tone follows the penta_block_blast valid-drop convention
 * (~30% alpha, docs/penta-block-blast-reference.md §3.4) but uses the piece
 * color so the player intuits which block is "powering" the clear.
 *
 * Implementation:
 *   - The path is derived on the UI thread from `ghost.anchor`, `ghost.valid`
 *     and the `boardBits` snapshot. No React re-renders during drag.
 *   - When the ghost is invalid or hidden the path is empty, so nothing draws.
 *
 * Z-order: place above settled blocks, below the ghost — the alpha tint then
 * reads on top of the cells that will explode.
 */

/** Stripe alpha (matches v1 GameSurface.drawClearHint). */
const HINT_OPACITY = 0.32;

export function ClearHintNode({
  ghost,
  boardBits,
  cellSize,
  boardCols,
  boardRows,
}: {
  ghost: GhostEntity;
  boardBits: SharedValue<number[]>;
  cellSize: number;
  boardCols: number;
  boardRows: number;
}) {
  const shape = ghost.shape;
  const hintColor = colorForPieceId(ghost.pieceId);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const a = ghost.anchor.value;
    if (a.row < 0 || !ghost.valid.value) return p;

    const bits = boardBits.value;
    const total = boardCols * boardRows;
    if (bits.length !== total) return p;

    // Simulated occupancy: existing cells + ghost shape stamped at anchor.
    const occ = new Array<number>(total);
    for (let i = 0; i < total; i++) occ[i] = bits[i];
    for (let i = 0; i < shape.length; i++) {
      const r = a.row + shape[i][0];
      const c = a.col + shape[i][1];
      if (r >= 0 && r < boardRows && c >= 0 && c < boardCols) {
        occ[r * boardCols + c] = 1;
      }
    }

    const boardW = boardCols * cellSize;
    const boardH = boardRows * cellSize;

    for (let r = 0; r < boardRows; r++) {
      let full = true;
      for (let c = 0; c < boardCols; c++) {
        if (!occ[r * boardCols + c]) {
          full = false;
          break;
        }
      }
      if (full) {
        p.addRect({ x: 0, y: r * cellSize, width: boardW, height: cellSize });
      }
    }
    for (let c = 0; c < boardCols; c++) {
      let full = true;
      for (let r = 0; r < boardRows; r++) {
        if (!occ[r * boardCols + c]) {
          full = false;
          break;
        }
      }
      if (full) {
        p.addRect({ x: c * cellSize, y: 0, width: cellSize, height: boardH });
      }
    }
    return p;
  });

  return <Path path={path} color={hintColor} opacity={HINT_OPACITY} />;
}
