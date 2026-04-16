import { useEffect, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { ActivePiece } from '@/src/lib/blockmatch/types';

import { PieceShapeView } from './PieceShape';

/**
 * Pixels the floating drag piece rises above the finger.
 * Exported so blockmatch.tsx can position the overlay and compute ghost grid coords.
 */
export const DRAG_LIFT_PX = 180;

const ROTATION_SPRING = { damping: 12, stiffness: 200, mass: 0.6 };

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
  const rotation = useSharedValue(0);

  /**
   * `basePiece` is a snapshot of the active piece at the moment it arrived in
   * the tray (its initial `rotationIdx`). On every tap, we spring `rotation`
   * to `(piece.rotationIdx - basePiece.rotationIdx) * 90°` instead of swapping
   * the rendered shape. Since `pureRotations` builds `rotations[i+1]` as
   * `rotations[i]` rotated 90° CW, drawing `basePiece` rotated by N×90° is
   * pixel-identical to drawing `rotations[i+N]` at 0°.
   *
   * This eliminates the per-tap unmount/mount of the inner view that
   * previously caused flicker on rapid taps — the new mount's `entering`
   * `initialValues` weren't always applied before paint when a fresh tap
   * arrived mid-animation, leaving a one-frame flash. With a single mount
   * driven by a shared value, rapid taps just retarget the same spring.
   */
  const [basePiece, setBasePiece] = useState(piece);

  // Fade-in after each drag end (restoreKey) or when a new piece arrives (defId).
  // Both changes arrive on the JS thread, so React has already re-rendered with
  // the correct piece before the animation starts — no old-piece flash.
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220 });
  }, [piece.defId, restoreKey, opacity]);

  // Sync rotation with piece.rotationIdx, snapping when a new piece arrives.
  useEffect(() => {
    if (piece.defId !== basePiece.defId) {
      // New piece arrived (post-placement). Reset base + rotation, no animation.
      setBasePiece(piece);
      rotation.value = 0;
      return;
    }
    const delta = piece.rotationIdx - basePiece.rotationIdx;
    if (delta !== 0) {
      // withSpring on the same shared value cancels any in-flight spring and
      // retargets from the current angle — rapid taps continue smoothly.
      rotation.value = withSpring(delta * 90, ROTATION_SPRING);
    }
  }, [piece, basePiece, rotation]);

  // Tracks whether the pan gesture actually activated (onStart fired).
  // Used in onFinalize to skip the drag-end callback for plain taps —
  // otherwise every rotate tap would retrigger the fade-in animation.
  const didDragStart = useSharedValue(false);

  const pan = Gesture.Pan()
    .minDistance(20)
    .enabled(enabled)
    .onBegin((e) => {
      // Pre-set position so the floating piece is ready if the gesture activates,
      // but do NOT show it yet — onStart fires only after minDistance is met.
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      didDragStart.value = false;
    })
    .onStart(() => {
      didDragStart.value = true;
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
      runOnJS(onDragMove)(null);
      // Only signal drag-end when a real drag occurred — taps must not
      // trigger the fade-in animation (which causes a rotation flicker).
      if (didDragStart.value) {
        runOnJS(onDragEnd)();
      }
    });

  const tap = Gesture.Tap()
    .maxDuration(200)
    .enabled(enabled)
    .onEnd(() => runOnJS(onTap)());

  const composed = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Outer wrapper fills the parent slot so the entire tray area is a hit
  // target for tap/drag gestures — not just the visual piece shape. The
  // inner wrapper renders the snapshot `basePiece` rotated by `rotation`,
  // which spring-animates to match piece.rotationIdx without re-mounting.
  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
          animStyle,
        ]}
      >
        <Animated.View style={rotationStyle}>
          <PieceShapeView piece={basePiece} cellSize={cellSize} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
