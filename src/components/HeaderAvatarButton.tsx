import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth';

export function HeaderAvatarButton() {
  const scheme = useColorScheme() ?? 'light';
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
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      hitSlop={8}
    >
      <Text style={[Typography.labelLg, { color: palette.text }]}>{initial}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
