import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ActivePiece } from '@/src/lib/blockmatch/types';

import { PieceShapeView, shapeFor } from './PieceShape';

const VISUAL_OFFSET_PX = 16;
const TARGET_LIFT_CELLS = 2.5;

export type BoardOrigin = { x: number; y: number };

export function DraggablePiece({
  piece,
  cellSize,
  boardOrigin,
  enabled,
  onHover,
  onDrop,
  onTap,
}: {
  piece: ActivePiece;
  cellSize: number;
  boardOrigin: BoardOrigin | null;
  enabled: boolean;
  onHover: (target: { row: number; col: number } | null) => void;
  onDrop: (target: { row: number; col: number } | null) => void;
  onTap: () => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Fade-in whenever a new piece arrives. Reset translation immediately so the
  // previous piece's spring-back can't carry over and bounce the new arrival.
  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220 });
  }, [piece.defId, opacity, tx, ty]);

  const targetOffsetPx = VISUAL_OFFSET_PX + TARGET_LIFT_CELLS * cellSize;

  const reportHover = (absX: number, absY: number) => {
    if (!boardOrigin) return onHover(null);
    const localX = absX - boardOrigin.x;
    const localY = absY - boardOrigin.y - targetOffsetPx;
    const col = Math.floor(localX / cellSize);
    const row = Math.floor(localY / cellSize);
    const shape = shapeFor(piece);
    const maxR = Math.max(...shape.map(([r]) => r));
    const maxC = Math.max(...shape.map(([, c]) => c));
    if (row < -maxR - 2 || col < -maxC - 2 || row > 11 || col > 11) {
      onHover(null);
    } else {
      onHover({ row, col });
    }
  };

  const reportDrop = (absX: number, absY: number) => {
    if (!boardOrigin) return onDrop(null);
    const localX = absX - boardOrigin.x;
    const localY = absY - boardOrigin.y - targetOffsetPx;
    const col = Math.floor(localX / cellSize);
    const row = Math.floor(localY / cellSize);
    onDrop({ row, col });
  };

  const pan = Gesture.Pan()
    .minDistance(2)
    .enabled(enabled)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY - VISUAL_OFFSET_PX;
      runOnJS(reportHover)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(reportDrop)(e.absoluteX, e.absoluteY);
      tx.value = withTiming(0, { duration: 140 });
      ty.value = withTiming(0, { duration: 140 });
    })
    .onFinalize(() => {
      runOnJS(onHover)(null);
    });

  const tap = Gesture.Tap()
    .maxDuration(200)
    .enabled(enabled)
    .onEnd(() => runOnJS(onTap)());

  const composed = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animStyle]}>
        <PieceShapeView piece={piece} cellSize={cellSize} />
      </Animated.View>
    </GestureDetector>
  );
}
