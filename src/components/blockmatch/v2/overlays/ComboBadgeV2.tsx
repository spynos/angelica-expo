import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { DUR_COMBO_POP } from '../engine/constants';

/**
 * Combo pop badge.
 *
 * Appears briefly in screen-center when the player chains multi-line
 * clears. Visibility is driven by the `comboValue` prop — a change
 * from N to N+1 triggers the pop; value 0 keeps the badge hidden.
 *
 * Penta timing: 800ms total. Scale easeOut(1→1.3) then easeIn(1.3→1);
 * opacity linear 0→1 (first 200ms) then 1→0 (last 400ms).
 */

const TIER_LABELS = ['', 'GOOD!', 'GREAT!', 'EXCELLENT!', 'AMAZING!'];
const TIER_COLORS = ['', '#FFE23C', '#FFB23C', '#FF7A3C', '#FF4D4D'];

function labelFor(combo: number): string {
  if (combo <= 0) return '';
  if (combo >= 4) return TIER_LABELS[4];
  return TIER_LABELS[combo];
}
function colorFor(combo: number): string {
  if (combo <= 0) return '#FFF';
  if (combo >= 4) return TIER_COLORS[4];
  return TIER_COLORS[combo];
}

export function ComboBadgeV2({ combo }: { combo: number }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (combo <= 1) return; // single line: no badge
    scale.value = 0.4;
    opacity.value = 0;

    scale.value = withSequence(
      withTiming(1.3, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 140, easing: Easing.inOut(Easing.cubic) }),
      withDelay(
        DUR_COMBO_POP - 300,
        withTiming(1.15, { duration: 200, easing: Easing.in(Easing.cubic) }),
      ),
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 160, easing: Easing.linear }),
      withDelay(
        DUR_COMBO_POP - 400,
        withTiming(0, { duration: 200, easing: Easing.linear }),
      ),
    );
  }, [combo, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (combo <= 1) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.badge, style]}>
        <Text style={[styles.label, { color: colorFor(combo) }]}>
          {labelFor(combo)}
        </Text>
        <Text style={[styles.multiplier, { color: colorFor(combo) }]}>
          {combo}x
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(20, 10, 4, 0.85)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  label: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  multiplier: {
    fontSize: 36,
    fontWeight: '900',
    marginTop: 2,
  },
});
