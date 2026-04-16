import { memo } from 'react';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import type { ActivePiece } from '@/src/lib/blockmatch/types';

import { PieceShapeView } from './PieceShape';

/**
 * Ghost (snap preview) overlay rendered above the Board.
 *
 * Position and visibility are driven entirely by shared values, so dragging
 * the piece across the board snaps the ghost to each grid cell **without
 * triggering any React re-render**. This was the bottleneck that caused
 * floating-piece jank inside the snap region — every cell crossing used to
 * call `setGhost`, which re-rendered Board, recomputed row masks, and
 * reconciled the piece-footprint cells; the resulting shadow-tree commit
 * stalled the UI thread for 1–3 ms and made the floating Reanimated style
 * miss frames.
 *
 * Translation is in cell units multiplied by JS-side `cellSize` — `cellSize`
 * doesn't change during a drag, so closure capture is stable.
 */
export const GhostOverlay = memo(function GhostOverlay({
  piece,
  cellSize,
  color,
  ghostRow,
  ghostCol,
  ghostOpacity,
}: {
  piece: ActivePiece;
  cellSize: number;
  /** Highlight color for the current piece (driven by JS — changes only on piece swap). */
  color: string;
  ghostRow: SharedValue<number>;
  ghostCol: SharedValue<number>;
  /** 0 = hidden (off-board / invalid placement / not dragging), 1 = visible. */
  ghostOpacity: SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [
      { translateX: ghostCol.value * cellSize },
      { translateY: ghostRow.value * cellSize },
    ],
    opacity: ghostOpacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={animStyle}>
      <PieceShapeView piece={piece} cellSize={cellSize} color={color} opacity={0.45} />
    </Animated.View>
  );
});
