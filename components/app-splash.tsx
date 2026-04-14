import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { FontFamily, Palette } from '@/constants/theme';

export type AppSplashProps = {
  /** 0..1 progress value driving the bar width. */
  progress: number;
  /** Human-readable status shown under the logo. */
  message: string;
};

const BG = '#3E362B';
const BAR_TRACK = 'rgba(255, 255, 255, 0.12)';
const BAR_FILL = Palette.primary;
const TEXT = '#F0EDE6';
const TEXT_MUTED = 'rgba(240, 237, 230, 0.72)';

export function AppSplash({ progress, message }: AppSplashProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const widthValue = useSharedValue(clamped);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(shimmer);
    };
  }, [pulse, shimmer]);

  useEffect(() => {
    widthValue.value = withTiming(clamped, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, widthValue]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + pulse.value * 0.15,
    transform: [{ scale: 0.98 + pulse.value * 0.04 }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value * 100}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + shimmer.value * 0.4,
    transform: [{ translateX: -40 + shimmer.value * 120 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={styles.title}>Angelica</Text>

      <View style={styles.barTrack} accessibilityRole="progressbar">
        <Animated.View style={[styles.barFill, barStyle]} />
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>

      <Text style={styles.message} numberOfLines={1}>
        {message}
      </Text>
      <Text style={styles.percent}>{Math.round(clamped * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontFamily: FontFamily.serifBold,
    fontSize: 26,
    color: TEXT,
    marginBottom: 36,
    letterSpacing: 1,
  },
  barTrack: {
    width: '72%',
    maxWidth: 280,
    height: 6,
    borderRadius: 999,
    backgroundColor: BAR_TRACK,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: BAR_FILL,
    borderRadius: 999,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  message: {
    marginTop: 16,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  percent: {
    marginTop: 4,
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
});
