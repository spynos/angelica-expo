import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Game-feel HUD: three beveled chip cards (stage / score / combo) that
 * share the warm board palette so the panel reads as part of the play
 * world rather than a status bar. Each chip owns its own micro-anim:
 *
 *   - stage   bumps on commit.
 *   - score   bumps on gain, with a "+Δ" floater drifting up; trophy +
 *             best score lives on a meta row.
 *   - combo   bumps and shifts hue as the streak climbs; chip outline
 *             pulses at combo ≥ 3.
 *
 * The wrap layout never resizes — only transforms / colors animate —
 * so the board below can't shift mid-combo.
 */

function comboColorFor(combo: number): string {
  if (combo <= 1) return '#9C9890';
  if (combo === 2) return '#E8B23C';
  if (combo === 3) return '#E8893C';
  if (combo === 4) return '#D85A3C';
  return '#C0392B';
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
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[scheme];
  const isDark = scheme === 'dark';

  const chipBg = isDark ? '#2C2925' : '#FFF8EE';
  const chipBorder = isDark ? '#3D3A34' : '#E8DFCB';

  // --- Score bump + delta floater -----------------------------------
  const scoreScale = useSharedValue(1);
  const scoreShift = useSharedValue(0);
  const floaterOpacity = useSharedValue(0);
  const floaterShift = useSharedValue(0);
  const [floaterValue, setFloaterValue] = useState(0);
  const prevScore = useRef(score);
  useEffect(() => {
    const delta = score - prevScore.current;
    if (delta > 0) {
      scoreScale.value = withSequence(
        withTiming(1.18, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
      scoreShift.value = withSequence(
        withTiming(-2, { duration: 120 }),
        withTiming(0, { duration: 180 }),
      );
      setFloaterValue(delta);
      floaterOpacity.value = 0;
      floaterShift.value = 0;
      floaterOpacity.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withDelay(360, withTiming(0, { duration: 320 })),
      );
      floaterShift.value = withTiming(-22, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
    prevScore.current = score;
  }, [score, scoreScale, scoreShift, floaterOpacity, floaterShift]);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }, { translateY: scoreShift.value }],
  }));
  const floaterStyle = useAnimatedStyle(() => ({
    opacity: floaterOpacity.value,
    transform: [{ translateY: floaterShift.value }],
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

  // --- Combo pop + glow ring -----------------------------------------
  const comboScale = useSharedValue(1);
  const comboGlow = useSharedValue(0);
  const prevCombo = useRef(combo);
  useEffect(() => {
    if (combo > prevCombo.current) {
      comboScale.value = withSequence(
        withTiming(1.35, { duration: 140 }),
        withTiming(1, { duration: 200 }),
      );
    }
    cancelAnimation(comboGlow);
    if (combo >= 3) {
      comboGlow.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 480, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.35, { duration: 480, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      comboGlow.value = withTiming(0, { duration: 200 });
    }
    prevCombo.current = combo;
  }, [combo, comboScale, comboGlow]);
  const comboStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
  }));
  const comboGlowStyle = useAnimatedStyle(() => ({
    opacity: comboGlow.value,
  }));

  return (
    <View style={styles.wrap}>
      {/* Stage chip */}
      <View
        style={[
          styles.chip,
          { backgroundColor: chipBg, borderColor: chipBorder },
        ]}
      >
        <Text style={[styles.label, { color: palette.icon }]}>스테이지</Text>
        <Animated.Text
          style={[styles.stageValue, { color: palette.text }, stageStyle]}
        >
          {stage}
        </Animated.Text>
      </View>

      {/* Score chip */}
      <View
        style={[
          styles.chip,
          styles.chipCenter,
          { backgroundColor: chipBg, borderColor: chipBorder },
        ]}
      >
        <Text style={[styles.label, { color: palette.icon }]}>점수</Text>
        <Animated.Text
          style={[styles.scoreValue, { color: palette.text }, scoreStyle]}
        >
          {score.toLocaleString()}
        </Animated.Text>
        <Animated.Text
          pointerEvents="none"
          style={[styles.floater, floaterStyle]}
        >
          +{floaterValue}
        </Animated.Text>
        <View style={styles.metaRow}>
          <Ionicons name="trophy" size={11} color="#C8773A" />
          <Text style={[styles.meta, { color: palette.icon }]}>
            {highScore.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Combo chip */}
      <View
        style={[
          styles.chip,
          { backgroundColor: chipBg, borderColor: chipBorder },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            { borderColor: comboColorFor(combo) },
            comboGlowStyle,
          ]}
        />
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
    alignItems: 'stretch',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    minWidth: 80,
    paddingHorizontal: Spacing.sm,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadow.sm,
  },
  chipCenter: {
    flex: 1.4,
  },
  glowRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: Radius.lg + 2,
    borderWidth: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  stageValue: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  floater: {
    position: 'absolute',
    right: 10,
    top: 26,
    fontSize: 13,
    fontWeight: '900',
    color: '#2E7D6B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  meta: {
    fontSize: 10,
    fontWeight: '700',
  },
  comboValue: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
});
