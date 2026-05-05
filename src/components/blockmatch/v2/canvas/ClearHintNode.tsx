import { LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';

import type { GhostEntity } from '../engine/types';

/**
 * Line-clear preview hint.
 *
 * The cleared row/column area is filled with the *current piece's color*,
 * but instead of a flat tint or a hard outline, the alpha is modulated by
 * a diagonal `LinearGradient` whose origin slides continuously. With
 * `mode="repeat"` the gradient tiles across the canvas, so the painted
 * regions (cleared rows/cols) show a moving wave of brightness — calmer
 * than a stroke, more attention-grabbing than a static fill.
 *
 * Wave geometry:
 *   - WAVE_LEN = cellSize × 5 (one band ≈ five tiles wide).
 *   - The gradient is anchored on a 45° axis so both row strips
 *     (horizontal) and column strips (vertical) read the same flowing
 *     motion.
 *   - WAVE_DUR_MS = 1300 ms per cycle, linear easing — keeps the rhythm
 *     steady so the eye reads it as continuous water-like flow rather
 *     than a heartbeat.
 *
 * Path + wave are both derived on the UI thread (no React re-render
 * during drag).
 *
 * Z-order: above settled blocks, below the ghost.
 */

const WAVE_DUR_MS = 1300;
/** Bright band alpha (hex suffix). Kept moderate so the dragged piece on
 *  top remains the visually dominant element. */
const WAVE_PEAK = 'A6'; // ≈ 0.65
/** Dim valley alpha (hex suffix). */
const WAVE_TROUGH = '2E'; // ≈ 0.18

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
  const fillColor = colorForPieceId(ghost.pieceId);
  const waveLen = cellSize * 5;

  const wavePos = useSharedValue(0);
  useEffect(() => {
    wavePos.value = withRepeat(
      withTiming(waveLen, { duration: WAVE_DUR_MS, easing: Easing.linear }),
      -1,
      false, // hard-snap back to 0 each cycle — invisible because gradient repeats
    );
    return () => {
      cancelAnimation(wavePos);
    };
  }, [wavePos, waveLen]);

  const gradStart = useDerivedValue(() => vec(wavePos.value, wavePos.value));
  const gradEnd = useDerivedValue(() =>
    vec(wavePos.value + waveLen, wavePos.value + waveLen),
  );

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const a = ghost.anchor.value;
    if (a.row < 0 || !ghost.valid.value) return p;

    const bits = boardBits.value;
    const total = boardCols * boardRows;
    if (bits.length !== total) return p;

    // Two parallel grids:
    //   occ      — board occupancy after the ghost lands (used to detect
    //              full rows/cols).
    //   pieceSet — the cells the dragged piece itself occupies. These are
    //              skipped when stamping the hint so the wave has cell-shaped
    //              holes where the piece sits, letting the dragged block
    //              read clearly on top instead of being camouflaged by a
    //              same-colored tint underneath.
    const occ = new Array<number>(total);
    for (let i = 0; i < total; i++) occ[i] = bits[i];
    const pieceSet = new Array<number>(total).fill(0);
    for (let i = 0; i < shape.length; i++) {
      const r = a.row + shape[i][0];
      const c = a.col + shape[i][1];
      if (r >= 0 && r < boardRows && c >= 0 && c < boardCols) {
        const idx = r * boardCols + c;
        occ[idx] = 1;
        pieceSet[idx] = 1;
      }
    }

    for (let r = 0; r < boardRows; r++) {
      let full = true;
      for (let c = 0; c < boardCols; c++) {
        if (!occ[r * boardCols + c]) {
          full = false;
          break;
        }
      }
      if (!full) continue;
      // Stamp this row cell-by-cell, skipping cells the piece will sit in.
      for (let c = 0; c < boardCols; c++) {
        if (pieceSet[r * boardCols + c]) continue;
        p.addRect({
          x: c * cellSize,
          y: r * cellSize,
          width: cellSize,
          height: cellSize,
        });
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
      if (!full) continue;
      for (let r = 0; r < boardRows; r++) {
        if (pieceSet[r * boardCols + c]) continue;
        p.addRect({
          x: c * cellSize,
          y: r * cellSize,
          width: cellSize,
          height: cellSize,
        });
      }
    }
    return p;
  });

  return (
    <Path path={path}>
      <LinearGradient
        start={gradStart}
        end={gradEnd}
        colors={[
          `${fillColor}${WAVE_TROUGH}`,
          `${fillColor}${WAVE_PEAK}`,
          `${fillColor}${WAVE_TROUGH}`,
        ]}
        positions={[0, 0.5, 1]}
        mode="repeat"
      />
    </Path>
  );
}
