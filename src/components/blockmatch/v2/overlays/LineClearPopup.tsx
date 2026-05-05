import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { TurnSummary } from '@/src/lib/blockmatch/types';

// Timing (ms)
const IN_POP_MS = 200;   // punch up to peak scale
const IN_SETTLE_MS = 130; // settle back to 1.0
const HOLD_MS = 550;
const OUT_MS = 320;
// Total: 200 + 130 + 550 + 320 = 1200ms
const TOTAL_MS = IN_POP_MS + IN_SETTLE_MS + HOLD_MS + OUT_MS;
const FLOAT_PX = 72;

const PRAISE = ['GOOD!', 'GREAT!', 'EXCELLENT!', 'AMAZING!'] as const;
// Warm, muted tier colors aligned with the cafe palette (cream board, gold
// accents). Progression: dusty gold → amber → terracotta → deep rust —
// keeps the "ascending heat" reading without the neon arcade feel.
const COLORS = ['#C9A14A', '#C8853A', '#B85F2E', '#9B4624'] as const;

function tierIndex(lines: number, combo: number): number {
  const v = lines >= 2 ? lines : combo;
  return Math.min(3, Math.max(0, v - 1));
}

interface Props {
  lastTurn: TurnSummary | null;
  combo: number;
  /** centroid column of the placed piece (fractional grid unit) */
  placedCentroidCol: number | null;
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
}

interface Display {
  praise: string;
  color: string;
  combo: number;
  centerX: number;
  topY: number;
}

export function LineClearPopup({
  lastTurn,
  combo,
  placedCentroidCol,
  cellSize,
  boardWidth,
  boardHeight,
}: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const floatY = useSharedValue(0);

  const [display, setDisplay] = useState<Display | null>(null);

  useEffect(() => {
    if (!lastTurn || lastTurn.linesCleared <= 0) return;

    const tier = tierIndex(lastTurn.linesCleared, combo);

    // Y: centroid of cleared rows (pixel)
    const avgRow =
      lastTurn.rowsCleared.length > 0
        ? lastTurn.rowsCleared.reduce((a, b) => a + b, 0) / lastTurn.rowsCleared.length
        : boardHeight / cellSize / 2;
    const rawY = (avgRow + 0.5) * cellSize;
    const topY = Math.max(50, Math.min(boardHeight - 110, rawY));

    // X: piece centroid col → pixel, clamped so the (POPUP_HALF_W) wide
    // popup never crosses the board edge.
    const rawX =
      placedCentroidCol !== null
        ? (placedCentroidCol + 0.5) * cellSize
        : boardWidth / 2;
    const centerX = Math.max(POPUP_HALF_W, Math.min(boardWidth - POPUP_HALF_W, rawX));

    setDisplay({ praise: PRAISE[tier], color: COLORS[tier], combo, centerX, topY });

    // Reset
    scale.value = 0;
    opacity.value = 0;
    floatY.value = 0;

    // Scale: punch in → settle → hold → shrink out
    scale.value = withSequence(
      withTiming(1.28, { duration: IN_POP_MS, easing: Easing.out(Easing.quad) }),
      withTiming(1.0, { duration: IN_SETTLE_MS, easing: Easing.inOut(Easing.cubic) }),
      withTiming(1.0, { duration: HOLD_MS }),
      withTiming(0.75, { duration: OUT_MS, easing: Easing.in(Easing.cubic) }),
    );

    // Opacity: fast in → hold → fade out
    opacity.value = withSequence(
      withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: IN_POP_MS + IN_SETTLE_MS + HOLD_MS - 170 }),
      withTiming(0, { duration: OUT_MS }),
    );

    // Float up over entire duration
    floatY.value = withTiming(-FLOAT_PX, {
      duration: TOTAL_MS,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTurn]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  if (!display) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: display.centerX - POPUP_HALF_W,
          top: display.topY,
          width: POPUP_HALF_W * 2,
          alignItems: 'center',
        }}
      >
        <Animated.View style={animStyle}>
          <Text
            style={[styles.praise, { color: display.color }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {display.praise}
          </Text>
          {display.combo >= 2 && (
            <Text style={[styles.comboNum, { color: display.color }]} numberOfLines={1}>
              {display.combo}x
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

// Half-width of the popup container. Must be wide enough that the longest
// PRAISE token ("EXCELLENT!") at fontSize 38 + letterSpacing 3 fits on a
// single line. Empirically ~280px total → 140 half-width.
const POPUP_HALF_W = 140;

const SHADOW = StyleSheet.create({
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowRadius: 3,
    textShadowOffset: { width: 2, height: 3 },
  },
}).text;

const styles = StyleSheet.create({
  praise: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    ...SHADOW,
  },
  comboNum: {
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 56,
    textAlign: 'center',
    marginTop: -6,
    ...SHADOW,
  },
});
