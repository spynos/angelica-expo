import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { ActivePiece } from '@/src/lib/blockmatch/types';

import { PieceShapeView, shapeFor } from './PieceShape';

/**
 * Pixels the floating drag piece rises above the finger.
 * Exported so blockmatch.tsx can position the overlay and compute ghost grid coords.
 */
export const DRAG_LIFT_PX = 180;

export function DraggablePiece({
  piece,
  cellSize,
  enabled,
  dragX,
  dragY,
  isDragging,
  onDrop,
  onTap,
  onDragMove,
}: {
  piece: ActivePiece;
  cellSize: number;
  enabled: boolean;
  /** Shared values written on the UI thread — drive the floating piece without JS re-renders. */
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  /** Called with raw finger coords on pan end. Parent computes grid position. */
  onDrop: (pos: { absX: number; absY: number } | null) => void;
  onTap: () => void;
  /** Called via runOnJS on every pan update (for ghost) and null on release. */
  onDragMove: (pos: { absX: number; absY: number } | null) => void;
}) {
  const opacity = useSharedValue(1);

  // Fade-in whenever a new piece arrives.
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220 });
  }, [piece.defId, opacity]);

  // Keep shapeFor call so the component re-renders on rotation.
  shapeFor(piece);

  const pan = Gesture.Pan()
    .minDistance(2)
    .enabled(enabled)
    .onBegin((e) => {
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      isDragging.value = true;
      opacity.value = withTiming(0.15, { duration: 80 });
    })
    .onUpdate((e) => {
      // Update position on UI thread — no runOnJS, no React re-render for position.
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      // Ghost grid computation still needs JS thread.
      runOnJS(onDragMove)({ absX: e.absoluteX, absY: e.absoluteY });
    })
    .onEnd((e) => {
      runOnJS(onDrop)({ absX: e.absoluteX, absY: e.absoluteY });
    })
    .onFinalize(() => {
      isDragging.value = false;
      opacity.value = withTiming(1, { duration: 150 });
      runOnJS(onDragMove)(null);
    });

  const tap = Gesture.Tap()
    .maxDuration(200)
    .enabled(enabled)
    .onEnd(() => runOnJS(onTap)());

  const composed = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animStyle]}>
        <PieceShapeView piece={piece} cellSize={cellSize} />
      </Animated.View>
    </GestureDetector>
  );
}
