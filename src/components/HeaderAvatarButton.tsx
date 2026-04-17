import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Palette, Radius, Shadow, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth';

export function HeaderAvatarButton() {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[scheme];
  const profile = useAuthStore((s) => s.profile);
  const initial = profile?.nickname?.[0] ?? '시';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="프로필"
      onPress={() => router.push('/(tabs)/profile')}
      style={({ pressed }) => [
        styles.avatar,
        {
          backgroundColor: Palette.primarySoft,
          borderColor: Palette.primary,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
      hitSlop={10}
    >
      <Text
        style={[
          Typography.labelLg,
          { color: Palette.primaryPressed, fontSize: 16 },
        ]}
      >
        {initial}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
});
