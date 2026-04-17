import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ComingSoonGame({ title, tagline }: { title: string; tagline: string }) {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[scheme];

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <View style={styles.center}>
        <Text style={[Typography.heading1, { color: palette.text, marginBottom: Spacing.sm }]}>
          {title}
        </Text>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, textAlign: 'center' }]}>
          {tagline}
        </Text>
      </View>
    </View>
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
