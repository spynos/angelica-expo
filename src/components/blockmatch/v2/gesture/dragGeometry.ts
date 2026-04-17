import { FINGER_Y_OFFSET_PX } from '../engine/constants';

/**
 * Finger-to-piece offset math.
 *
 * Normal mode: the piece's bottom-center sits FINGER_Y_OFFSET_PX (180px)
 * *above* the finger, so the hand doesn't occlude the drop preview. This
 * is penta's signature drag feel.
 *
 * Minimap mode: once the finger enters a designated rect above the tray,
 * the offset is removed and the piece is centered on the finger. This
 * gives precise 1:1 positioning for deliberate corner placement.
 */

/** Returns the pixel position of the piece's top-left cell anchor. */
export function fingerToAnchorPx(
  fingerX: number,
  fingerY: number,
  shapeCellsW: number,
  shapeCellsH: number,
  cellSize: number,
  minimapMode: boolean,
): { anchorX: number; anchorY: number } {
  'worklet';
  const shapePxW = shapeCellsW * cellSize;
  const shapePxH = shapeCellsH * cellSize;

  if (minimapMode) {
    return {
      anchorX: fingerX - shapePxW / 2,
      anchorY: fingerY - shapePxH / 2,
    };
  }

  return {
    anchorX: fingerX - shapePxW / 2,
    anchorY: fingerY - shapePxH - FINGER_Y_OFFSET_PX,
  };
}
