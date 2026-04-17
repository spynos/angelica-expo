import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FontFamily } from '@/constants/theme';

export function StageClearBanner({
  active,
  stage,
  boardWidth,
  boardHeight,
}: {
  active: boolean;
  stage: number;
  boardWidth: number;
  boardHeight: number;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.75);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: 280 });
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    }
  }, [active, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrap, { width: boardWidth, height: boardHeight }, animStyle]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Text style={styles.label}>STAGE</Text>
        <Text style={styles.number}>{stage}</Text>
        <Text style={styles.clear}>CLEAR!</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  content: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 6,
  },
  number: {
    fontFamily: FontFamily.serifBold,
    fontSize: 80,
    lineHeight: 88,
    color: '#FFFFFF',
  },
  clear: {
    fontFamily: FontFamily.sansBold,
    fontSize: 28,
    color: '#FFD84D',
    letterSpacing: 4,
  },
});
