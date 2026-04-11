import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ReactNode, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
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
};

function GlassPill({ style, children }: GlassPillProps) {
  const scheme = useColorScheme() ?? 'light';
  if (liquidGlassSupported) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={scheme === 'dark' ? 'dark' : 'light'}
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

  const contextual = useMemo(() => {
    if (activeRouteName === 'puzzle') {
      return {
        icon: 'list.bullet' as const,
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

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.base },
      ]}
    >
      <PillGroup style={styles.row}>
        <GlassPill style={styles.segmentPill}>
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
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={route.name === 'cafe' ? '문학카페' : '퍼즐게임'}
                accessibilityState={focused ? { selected: true } : {}}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.segmentButton,
                  focused && {
                    backgroundColor: Palette.primary,
                  },
                  pressed && { opacity: 0.85 },
                ]}
                hitSlop={6}
              >
                <IconSymbol
                  name={meta.icon}
                  size={22}
                  color={focused ? '#FFFFFF' : palette.text}
                />
              </Pressable>
            );
          })}
        </GlassPill>

        <GlassPill style={styles.actionPill}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={contextual.label}
            onPress={() => {
              triggerHaptic();
              contextual.onPress();
            }}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={6}
          >
            <IconSymbol name={contextual.icon} size={24} color={palette.text} />
          </Pressable>
        </GlassPill>
      </PillGroup>
    </View>
  );
}

const PILL_HEIGHT = 56;

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
  segmentButton: {
    width: 64,
    height: PILL_HEIGHT - 12,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
