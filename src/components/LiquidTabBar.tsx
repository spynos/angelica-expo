import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ReactNode, useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const VISIBLE_ROUTES = ['cafe', 'puzzle'] as const;
type VisibleRoute = (typeof VISIBLE_ROUTES)[number];

const TAB_META: Record<VisibleRoute, { icon: Parameters<typeof IconSymbol>[0]['name'] }> = {
  cafe: { icon: 'book.fill' },
  puzzle: { icon: 'puzzlepiece.fill' },
};

const liquidGlassSupported = Platform.OS === 'ios' && isLiquidGlassAvailable();

function triggerHaptic() {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.selectionAsync().catch(() => {});
  }
}

type GlassPillProps = {
  style?: ViewStyle | ViewStyle[];
  children: ReactNode;
  interactive?: boolean;
};

function GlassPill({ style, children, interactive }: GlassPillProps) {
  const scheme = useColorScheme() ?? 'light';
  if (liquidGlassSupported) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={scheme === 'dark' ? 'dark' : 'light'}
        isInteractive={interactive}
        style={[styles.pillBase, style]}
      >
        {children}
      </GlassView>
    );
  }
  const fallbackBg =
    scheme === 'dark' ? 'rgba(40,37,31,0.55)' : 'rgba(255,255,255,0.55)';
  return (
    <BlurView
      intensity={60}
      tint={scheme === 'dark' ? 'dark' : 'light'}
      experimentalBlurMethod="dimezisBlurView"
      style={[styles.pillBase, { backgroundColor: fallbackBg }, style]}
    >
      {children}
    </BlurView>
  );
}

type GlassWrapperProps = {
  style?: ViewStyle;
  children: ReactNode;
};

function PillGroup({ style, children }: GlassWrapperProps) {
  if (liquidGlassSupported) {
    return (
      <GlassContainer spacing={12} style={style}>
        {children}
      </GlassContainer>
    );
  }
  return <View style={style}>{children}</View>;
}

const SEGMENT_WIDTH = 76;
const SEGMENT_MARGIN = 4;
const SEGMENT_SLOT = SEGMENT_WIDTH + SEGMENT_MARGIN * 2;

function AnimatedHighlight({ activeIndex }: { activeIndex: number }) {
  const translateX = useSharedValue(activeIndex < 0 ? 0 : activeIndex * SEGMENT_SLOT);

  useEffect(() => {
    if (activeIndex < 0) return;
    translateX.value = withSpring(activeIndex * SEGMENT_SLOT, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [activeIndex, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.highlight, animatedStyle, { backgroundColor: Palette.primary }]}
    />
  );
}

type SegmentButtonProps = {
  focused: boolean;
  label: string;
  icon: Parameters<typeof IconSymbol>[0]['name'];
  baseColor: string;
  onPress: () => void;
};

function SegmentButton({ focused, label, icon, baseColor, onPress }: SegmentButtonProps) {
  const press = useSharedValue(1);
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, focus]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
    opacity: 0.6 + focus.value * 0.4,
  }));

  return (
    <Animated.View style={[styles.segmentButton, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={focused ? { selected: true } : {}}
        onPressIn={() => {
          press.value = withSpring(0.88, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 12, stiffness: 320 });
        }}
        onPress={onPress}
        style={styles.segmentPressable}
        hitSlop={6}
      >
        <IconSymbol name={icon} size={26} color={focused ? '#FFFFFF' : baseColor} />
      </Pressable>
    </Animated.View>
  );
}

type ActionButtonProps = {
  label: string;
  icon: Parameters<typeof IconSymbol>[0]['name'];
  color: string;
  onPress: () => void;
};

function ActionButton({ label, icon, color, onPress }: ActionButtonProps) {
  const press = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  return (
    <Animated.View style={[styles.actionButton, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          press.value = withSpring(0.88, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 12, stiffness: 320 });
        }}
        onPress={onPress}
        style={styles.actionPressable}
        hitSlop={6}
      >
        <IconSymbol name={icon} size={28} color={color} />
      </Pressable>
    </Animated.View>
  );
}

export function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const visibleRoutes = useMemo(
    () =>
      state.routes
        .map((route, index) => ({ route, index }))
        .filter(({ route }) => (VISIBLE_ROUTES as readonly string[]).includes(route.name)),
    [state.routes],
  );

  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name as VisibleRoute | string | undefined;

  const focusedChildName = (() => {
    const nested = (activeRoute as { state?: { index: number; routes: { name: string }[] } })
      ?.state;
    if (!nested?.routes) return undefined;
    return nested.routes[nested.index]?.name;
  })();

  const contextual = useMemo(() => {
    if (activeRouteName === 'puzzle') {
      return {
        icon: 'trophy' as const,
        label: '기록 보기',
        onPress: () => router.push('/(tabs)/puzzle/history'),
      };
    }
    return {
      icon: 'pencil' as const,
      label: '시 쓰기',
      onPress: () => router.push('/(tabs)/cafe/write'),
    };
  }, [activeRouteName]);

  // Hide tab bar on routes outside the visible set (e.g. profile/settings push).
  if (!activeRouteName || !(VISIBLE_ROUTES as readonly string[]).includes(activeRouteName)) {
    return null;
  }

  // Hide tab bar on puzzle game screens so users can focus on play.
  const GAME_ROUTES = ['sudoku/[difficulty]', 'sudoku/complete', 'blockmatch', 'crossword', 'quiz'];
  if (focusedChildName && GAME_ROUTES.includes(focusedChildName)) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.base },
      ]}
    >
      <PillGroup style={styles.row}>
        <GlassPill style={styles.segmentPill} interactive>
          <AnimatedHighlight
            activeIndex={visibleRoutes.findIndex(({ index }) => index === state.index)}
          />
          {visibleRoutes.map(({ route, index }) => {
            const focused = state.index === index;
            const meta = TAB_META[route.name as VisibleRoute];
            const onPress = () => {
              triggerHaptic();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };
            return (
              <SegmentButton
                key={route.key}
                focused={focused}
                label={route.name === 'cafe' ? '문학카페' : '퍼즐게임'}
                icon={meta.icon}
                baseColor={palette.text}
                onPress={onPress}
              />
            );
          })}
        </GlassPill>

        <GlassPill style={styles.actionPill} interactive>
          <ActionButton
            label={contextual.label}
            icon={contextual.icon}
            color={palette.text}
            onPress={() => {
              triggerHaptic();
              contextual.onPress();
            }}
          />
        </GlassPill>
      </PillGroup>
    </View>
  );
}

const PILL_HEIGHT = 68;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  pillBase: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.modal,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    height: PILL_HEIGHT,
  },
  highlight: {
    position: 'absolute',
    left: Spacing.xs + SEGMENT_MARGIN,
    top: 6,
    width: SEGMENT_WIDTH,
    height: PILL_HEIGHT - 12,
    borderRadius: Radius.full,
  },
  segmentButton: {
    width: SEGMENT_WIDTH,
    height: PILL_HEIGHT - 12,
    borderRadius: Radius.full,
    marginHorizontal: SEGMENT_MARGIN,
  },
  segmentPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPill: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    borderRadius: Radius.full,
  },
  actionPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
