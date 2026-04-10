import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Colors, FontFamily, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PoemWithAuthor } from '@/src/types/db';

const FONT_FAMILY_MAP = {
  serif: FontFamily.serif,
  sans: FontFamily.sans,
  cursive: FontFamily.serif,
} as const;

export function PoemCard({ poem }: { poem: PoemWithAuthor }) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/cafe/${poem.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: poem.bg_color,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {poem.title ? (
        <Text
          style={[
            { fontFamily: FontFamily.serifBold, fontSize: 18, color: '#3D3B38' },
            { marginBottom: Spacing.sm },
          ]}
          numberOfLines={1}
        >
          {poem.title}
        </Text>
      ) : null}
      <Text
        numberOfLines={6}
        style={{
          fontFamily: FONT_FAMILY_MAP[poem.font],
          fontSize: 16,
          lineHeight: 28,
          color: '#3D3B38',
        }}
      >
        {poem.body}
      </Text>
      <View style={styles.footer}>
        <Text style={[Typography.labelSm, { color: '#6B6860' }]}>
          {poem.author?.nickname ?? '익명'}
        </Text>
        <Text style={[Typography.labelSm, { color: '#6B6860' }]}>
          ♡ {poem.like_count}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.base,
    ...Shadow.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.base,
  },
});
