import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function BookcafeHome() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[Typography.display, { color: palette.text }]}>북카페</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.placeholder,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[Typography.heading2, { color: palette.text, textAlign: 'center' }]}>
            준비 중이에요
          </Text>
          <Text
            style={[
              Typography.bodyMd,
              {
                color: palette.textMuted,
                textAlign: 'center',
                marginTop: Spacing.md,
              },
            ]}
          >
            출판물 단위로 정성껏 묶은 콘텐츠를{'\n'}곧 만나보실 수 있어요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl * 2,
  },
  placeholder: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xxl * 1.5,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
