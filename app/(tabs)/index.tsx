import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const profile = useAuthStore((s) => s.profile);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.bodySm, { color: palette.textMuted }]}>안녕하세요</Text>
        <Text style={[Typography.display, { color: palette.text }]}>
          {profile?.nickname ?? '시인'}님
        </Text>
        <Text
          style={[
            Typography.bodyMd,
            { color: palette.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.xxl },
          ]}
        >
          오늘의 한 잔, 어떻게 시작해 볼까요?
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/cafe')}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.tag, { backgroundColor: Palette.primarySoft }]}>
            <Text style={[Typography.labelSm, { color: Palette.primaryPressed }]}>문학카페</Text>
          </View>
          <Text style={[Typography.heading2, { color: palette.text, marginTop: Spacing.md }]}>
            오늘의 한 줄을 남겨보세요
          </Text>
          <Text style={[Typography.bodySm, { color: palette.textMuted, marginTop: Spacing.xs }]}>
            짧은 문장도 시가 됩니다.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/puzzle')}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
              marginTop: Spacing.base,
            },
          ]}
        >
          <View style={[styles.tag, { backgroundColor: '#E0EFEA' }]}>
            <Text style={[Typography.labelSm, { color: Palette.puzzle }]}>퍼즐</Text>
          </View>
          <Text style={[Typography.heading2, { color: palette.text, marginTop: Spacing.md }]}>
            오늘의 스도쿠
          </Text>
          <Text style={[Typography.bodySm, { color: palette.textMuted, marginTop: Spacing.xs }]}>
            잠깐의 집중, 충분한 휴식.
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.xxl, paddingBottom: Spacing.xxl * 2 },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
});
