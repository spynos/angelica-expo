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
  restoreKey,
  onDrop,
  onTap,
  onDragMove,
  onDragEnd,
}: {
  piece: ActivePiece;
  cellSize: number;
  enabled: boolean;
  /** Shared values written on the UI thread — drive the floating piece without JS re-renders. */
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  /**
   * Incremented by parent after each drag ends (via runOnJS). Causes this
   * useEffect to re-run on the JS thread — after React has re-rendered with
   * the potentially new piece — so fade-in never reveals the old piece.
   */
  restoreKey: number;
  /** Called with raw finger coords on pan end. Parent computes grid position. */
  onDrop: (pos: { absX: number; absY: number } | null) => void;
  onTap: () => void;
  /** Called via runOnJS on every pan update (for ghost) and null on release. */
  onDragMove: (pos: { absX: number; absY: number } | null) => void;
  /** Called via runOnJS when the gesture finalizes (drop or cancel). */
  onDragEnd: () => void;
}) {
  const opacity = useSharedValue(1);

  // Fade-in after each drag end (restoreKey) or when a new piece arrives (defId).
  // Both changes arrive on the JS thread, so React has already re-rendered with
  // the correct piece before the animation starts — no old-piece flash.
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220 });
  }, [piece.defId, restoreKey, opacity]);

  // Keep shapeFor call so the component re-renders on rotation.
  shapeFor(piece);

  const pan = Gesture.Pan()
    .minDistance(2)
    .enabled(enabled)
    .onBegin((e) => {
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      isDragging.value = true;
      opacity.value = withTiming(0, { duration: 80 });
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
      // Do NOT restore opacity here — that would briefly show the old piece
      // before React re-renders. Instead, signal the JS thread via onDragEnd
      // so the useEffect above runs after the new piece is already rendered.
      runOnJS(onDragMove)(null);
      runOnJS(onDragEnd)();
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
