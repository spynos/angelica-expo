import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// TODO: list puzzle_records for the current user once the data layer is ready.
export default function PuzzleHistoryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.center}>
        <Text style={[Typography.heading1, { color: palette.text, marginBottom: Spacing.sm }]}>
          기록
        </Text>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, textAlign: 'center' }]}>
          준비 중입니다.{'\n'}곧 풀이 기록을 확인할 수 있어요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
});
