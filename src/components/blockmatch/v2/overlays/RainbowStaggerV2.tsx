import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BOARD_SIZE } from '@/src/lib/blockmatch/types';

import {
  DUR_RAINBOW_ROW,
  STAGGER_RAINBOW_ROW,
} from '../engine/constants';

/**
 * Stage-clear rainbow sweep.
 *
 * Fires once when `active` turns true. Paints a 7-row colored block over
 * the board area, each row fading in bottom-to-top with a ~66.7ms stagger
 * and a 480ms per-row fill. Total wall clock ~1200ms before `onDone`
 * fires; the caller typically uses that as its cue to dispatch
 * `commitStage`.
 *
 * The rainbow itself is built from discrete row strips (cheaper than a
 * canvas gradient and lets each row scale-pop independently, matching
 * penta's easeOutBack flavor).
 */

const COLORS = [
  '#FF4D4D',
  '#FF9A3C',
  '#FFE23C',
  '#5EE75E',
  '#4FC9FF',
  '#6F8DFF',
  '#A06FFF',
];

export function RainbowStaggerV2({
  active,
  boardWidth,
  boardHeight,
  onDone,
}: {
  active: boolean;
  boardWidth: number;
  boardHeight: number;
  onDone?: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    // Single shared progress SV drives cross-row staggering; each row
    // reads its own window from this value.
    progress.value = 0;
    progress.value = withTiming(1, {
      duration:
        STAGGER_RAINBOW_ROW * (BOARD_SIZE - 1) + DUR_RAINBOW_ROW,
      easing: Easing.linear,
    });
    if (onDone) {
      const totalMs =
        STAGGER_RAINBOW_ROW * (BOARD_SIZE - 1) + DUR_RAINBOW_ROW;
      const id = setTimeout(onDone, totalMs);
      return () => clearTimeout(id);
    }
  }, [active, progress, onDone]);

  if (!active) return null;

  const rowHeight = boardHeight / BOARD_SIZE;

  return (
    <View
      style={[
        styles.wrap,
        { width: boardWidth, height: boardHeight },
      ]}
      pointerEvents="none"
    >
      {Array.from({ length: BOARD_SIZE }).map((_, i) => {
        const rowFromBottom = BOARD_SIZE - 1 - i;
        return (
          <RainbowRow
            key={i}
            rowIdx={rowFromBottom}
            width={boardWidth}
            height={rowHeight}
            top={i * rowHeight}
            color={COLORS[i % COLORS.length]}
          />
        );
      })}
    </View>
  );
}

function RainbowRow({
  rowIdx,
  width,
  height,
  top,
  color,
}: {
  rowIdx: number;
  width: number;
  height: number;
  top: number;
  color: string;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const delay = rowIdx * STAGGER_RAINBOW_ROW;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: DUR_RAINBOW_ROW, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: DUR_RAINBOW_ROW,
        easing: Easing.out(Easing.back(1.4)),
      }),
    );
  }, [rowIdx, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', top, left: 0, width, height, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
