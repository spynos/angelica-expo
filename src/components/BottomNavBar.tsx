import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TabKey = 'cafe' | 'puzzle' | 'bookcafe' | 'profile';

const TAB_META: Record<TabKey, { label: string; icon: IconSymbolName }> = {
  cafe: { label: '포스트', icon: 'book.fill' },
  puzzle: { label: '퍼즐', icon: 'puzzlepiece.fill' },
  bookcafe: { label: '북카페', icon: 'book' },
  profile: { label: '계정', icon: 'person.fill' },
};

const SLOTS: (TabKey | 'create')[] = ['cafe', 'puzzle', 'create', 'bookcafe', 'profile'];

const GAME_ROUTES = ['sudoku/[difficulty]', 'sudoku/complete', 'blockmatch', 'crossword', 'quiz'];

const BAR_HEIGHT = 56;

function triggerHaptic() {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.selectionAsync().catch(() => {});
  }
}

export function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const activeRoute = state.routes[state.index];

  const focusedChildName = (() => {
    const nested = (activeRoute as { state?: { index: number; routes: { name: string }[] } })
      ?.state;
    if (!nested?.routes) return undefined;
    return nested.routes[nested.index]?.name;
  })();

  if (focusedChildName && GAME_ROUTES.includes(focusedChildName)) {
    return null;
  }

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom,
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
      ]}
    >
      {SLOTS.map((slot) => {
        if (slot === 'create') {
          return (
            <CreateButton
              key="create"
              activeColor={palette.text}
              onPress={() => {
                triggerHaptic();
                router.push('/(tabs)/cafe/write');
              }}
            />
          );
        }
        const route = state.routes.find((r) => r.name === slot);
        if (!route) return null;
        const focused = activeRoute?.name === slot;
        const meta = TAB_META[slot];
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
          <TabButton
            key={slot}
            label={meta.label}
            icon={meta.icon}
            focused={focused}
            activeColor={palette.text}
            inactiveColor={palette.tabIconDefault}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabButton({
  label,
  icon,
  focused,
  activeColor,
  inactiveColor,
  onPress,
}: {
  label: string;
  icon: IconSymbolName;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  const color = focused ? activeColor : inactiveColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={focused ? { selected: true } : {}}
      onPress={onPress}
      style={styles.slot}
      android_ripple={{ borderless: true, color: 'rgba(0,0,0,0.08)' }}
    >
      <IconSymbol name={icon} size={24} color={color} strokeWidth={focused ? 2.4 : 1.8} />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color, fontFamily: focused ? FontFamily.sansBold : FontFamily.sansMedium },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CreateButton({
  activeColor,
  onPress,
}: {
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="포스트 작성"
      onPress={onPress}
      style={styles.slot}
      android_ripple={{ borderless: true, color: 'rgba(0,0,0,0.08)' }}
    >
      <IconSymbol name="plus" size={28} color={activeColor} strokeWidth={2.4} />
      <Text
        numberOfLines={1}
        style={[styles.label, { color: activeColor, fontFamily: FontFamily.sansMedium }]}
      >
        작성
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
});
