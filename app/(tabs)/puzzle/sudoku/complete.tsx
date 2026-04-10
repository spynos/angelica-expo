import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, type ThemePalette, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';

export default function CompleteScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { elapsed, errors, difficulty } = useLocalSearchParams<{
    elapsed: string;
    errors: string;
    difficulty: string;
  }>();

  const seconds = Number(elapsed) || 0;
  const minutes = Math.floor(seconds / 60);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <Text style={[Typography.display, { color: palette.text }]}>완성!</Text>
      <Text style={[Typography.bodyMd, { color: palette.textMuted, marginTop: Spacing.md }]}>
        조용한 한 잔의 시간이었어요.
      </Text>

      <View style={[styles.stats, { borderColor: palette.border }]}>
        <Stat label="시간" value={`${minutes}분 ${seconds % 60}초`} palette={palette} />
        <Stat label="오류" value={`${errors ?? 0}회`} palette={palette} />
        <Stat label="난이도" value={String(difficulty)} palette={palette} />
      </View>

      <View style={{ height: Spacing.xl }} />
      <Button label="다시 도전" onPress={() => router.replace('/(tabs)/puzzle')} />
      <View style={{ height: Spacing.md }} />
      <Button
        label="홈으로"
        variant="secondary"
        onPress={() => router.replace('/(tabs)')}
      />
    </View>
  );
}

function Stat({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ThemePalette;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[Typography.labelSm, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[Typography.heading2, { color: palette.text, marginTop: Spacing.xs }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  stats: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
});
