import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ScorePanel({
  score,
  highScore,
  combo,
}: {
  score: number;
  highScore: number;
  combo: number;
}) {
  const palette = Colors[(useColorScheme() ?? 'light') as 'light' | 'dark'];
  return (
    <View style={styles.row}>
      <Stat label="점수" value={String(score)} palette={palette.text} muted={palette.textMuted} large />
      <Stat label="콤보" value={combo > 0 ? `x${combo}` : '–'} palette={palette.text} muted={palette.textMuted} />
      <Stat label="최고" value={String(highScore)} palette={palette.text} muted={palette.textMuted} />
    </View>
  );
}

function Stat({
  label,
  value,
  palette,
  muted,
  large,
}: {
  label: string;
  value: string;
  palette: string;
  muted: string;
  large?: boolean;
}) {
  return (
    <View style={styles.cell}>
      <Text style={[Typography.labelSm, { color: muted }]}>{label}</Text>
      <Text style={[large ? Typography.heading1 : Typography.heading2, { color: palette }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  cell: { alignItems: 'center' },
});
