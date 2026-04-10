import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { SudokuDifficulty } from '@/src/types/db';

const LEVELS: { key: SudokuDifficulty; label: string; subtitle: string }[] = [
  { key: 'easy', label: '쉬움', subtitle: '편안한 한 잔' },
  { key: 'medium', label: '보통', subtitle: '집중의 시간' },
  { key: 'hard', label: '어려움', subtitle: '깊은 사색' },
];

export default function PuzzleHome() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.heading1, { color: palette.text }]}>퍼즐</Text>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, marginBottom: Spacing.xxl }]}>
          오늘의 스도쿠를 골라보세요.
        </Text>

        {LEVELS.map((lvl) => (
          <Pressable
            key={lvl.key}
            onPress={() => router.push(`/(tabs)/puzzle/sudoku/${lvl.key}` as any)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View>
              <Text style={[Typography.heading2, { color: palette.text }]}>{lvl.label}</Text>
              <Text style={[Typography.bodySm, { color: palette.textMuted }]}>{lvl.subtitle}</Text>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: Radius.full,
                backgroundColor: Palette.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[Typography.labelLg, { color: Palette.primaryPressed }]}>→</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
});
