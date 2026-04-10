import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';
import { useAuthStore } from '@/src/store/auth';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.content}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[Typography.heading1, { color: palette.text }]}>
            {profile?.nickname?.[0] ?? '시'}
          </Text>
        </View>
        <Text style={[Typography.heading1, { color: palette.text, marginTop: Spacing.base }]}>
          {profile?.nickname ?? '시인'}
        </Text>
        <Text
          style={[Typography.bodySm, { color: palette.textMuted, marginBottom: Spacing.xxl }]}
        >
          {user?.email}
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[Typography.bodyMd, { color: palette.text }]}>설정</Text>
          <Text style={[Typography.bodyMd, { color: palette.textMuted }]}>›</Text>
        </Pressable>

        <View style={{ height: Spacing.xl }} />
        <Button label="로그아웃" variant="secondary" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.xxl, alignItems: 'stretch' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
