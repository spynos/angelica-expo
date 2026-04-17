import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Entity-minded score panel.
 *
 * Each numeric readout is a small live object with its own bump
 * animation. Score bumps up on gain; stage bumps sideways on commit;
 * combo shifts hue as it climbs. The panel never re-lays-out — all
 * animation is transform + color, so it can't shove the game board
 * around mid-combo.
 */

function comboColorFor(combo: number): string {
  if (combo <= 1) return '#FFFFFF';
  if (combo === 2) return '#FFE23C';
  if (combo === 3) return '#FFB23C';
  if (combo === 4) return '#FF7A3C';
  return '#FF4D4D';
}

export function ScorePanelV2({
  score,
  highScore,
  stage,
  combo,
}: {
  score: number;
  highScore: number;
  stage: number;
  combo: number;
}) {
  const palette = Colors[(useColorScheme() ?? 'light') as 'light' | 'dark'];

  // --- Score bump ------------------------------------------------------
  const scoreScale = useSharedValue(1);
  const scoreShift = useSharedValue(0);
  const prevScore = useRef(score);
  useEffect(() => {
    if (score > prevScore.current) {
      scoreScale.value = withSequence(
        withTiming(1.18, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
      scoreShift.value = withSequence(
        withTiming(-2, { duration: 120 }),
        withTiming(0, { duration: 180 }),
      );
    }
    prevScore.current = score;
  }, [score, scoreScale, scoreShift]);
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }, { translateY: scoreShift.value }],
  }));

  // --- Stage bump (on commit) -----------------------------------------
  const stageScale = useSharedValue(1);
  const prevStage = useRef(stage);
  useEffect(() => {
    if (stage !== prevStage.current) {
      stageScale.value = withSequence(
        withTiming(1.3, { duration: 180 }),
        withTiming(1, { duration: 220 }),
      );
    }
    prevStage.current = stage;
  }, [stage, stageScale]);
  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stageScale.value }],
  }));

  // --- Combo pop -------------------------------------------------------
  const comboScale = useSharedValue(1);
  const prevCombo = useRef(combo);
  useEffect(() => {
    if (combo > prevCombo.current) {
      comboScale.value = withSequence(
        withTiming(1.35, { duration: 140 }),
        withTiming(1, { duration: 200 }),
      );
    }
    prevCombo.current = combo;
  }, [combo, comboScale]);
  const comboStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.cell}>
        <Text style={[styles.label, { color: palette.icon }]}>스테이지</Text>
        <Animated.Text style={[styles.stageValue, { color: palette.text }, stageStyle]}>
          {stage}
        </Animated.Text>
      </View>

      <View style={[styles.cell, styles.cellCenter]}>
        <Text style={[styles.label, { color: palette.icon }]}>점수</Text>
        <Animated.Text style={[styles.scoreValue, { color: palette.text }, scoreStyle]}>
          {score.toLocaleString()}
        </Animated.Text>
        <Text style={[styles.highScore, { color: palette.icon }]}>
          최고 {highScore.toLocaleString()}
        </Text>
      </View>

      <View style={styles.cell}>
        <Text style={[styles.label, { color: palette.icon }]}>콤보</Text>
        <Animated.Text
          style={[styles.comboValue, { color: comboColorFor(combo) }, comboStyle]}
        >
          ×{combo}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cell: {
    alignItems: 'center',
    minWidth: 70,
  },
  cellCenter: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  stageValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  highScore: {
    fontSize: 11,
    marginTop: 2,
  },
  comboValue: {
    fontSize: 24,
    fontWeight: '900',
  },
});
