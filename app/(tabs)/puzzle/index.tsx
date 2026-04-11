import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HeaderAvatarButton } from '@/src/components/HeaderAvatarButton';

type GameId = 'sudoku' | 'blockmatch' | 'crossword' | 'quiz';

type GameMeta = {
  id: GameId;
  title: string;
  subtitle: string;
  icon: Parameters<typeof IconSymbol>[0]['name'];
  onPress: () => void;
  comingSoon?: boolean;
};

const GAMES: GameMeta[] = [
  {
    id: 'sudoku',
    title: '스도쿠',
    subtitle: '숫자로 채우는 고요',
    icon: 'square.grid.3x3.fill',
    onPress: () => router.push('/(tabs)/puzzle/sudoku/easy' as any),
  },
  {
    id: 'blockmatch',
    title: '블록매치',
    subtitle: '색과 모양의 리듬',
    icon: 'puzzlepiece.fill',
    onPress: () => router.push('/(tabs)/puzzle/blockmatch' as any),
    comingSoon: true,
  },
  {
    id: 'crossword',
    title: '십자말풀이',
    subtitle: '언어의 결을 따라',
    icon: 'pencil',
    onPress: () => router.push('/(tabs)/puzzle/crossword' as any),
    comingSoon: true,
  },
  {
    id: 'quiz',
    title: '장학퀴즈',
    subtitle: '한 문제, 한 숨',
    icon: 'lightbulb',
    onPress: () => router.push('/(tabs)/puzzle/quiz' as any),
    comingSoon: true,
  },
];

export default function PuzzleHome() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[Typography.display, { color: palette.text }]}>퍼즐게임</Text>
        <HeaderAvatarButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, marginBottom: Spacing.xxl }]}>
          오늘의 퍼즐을 골라보세요.
        </Text>

        <View style={styles.grid}>
          {GAMES.map((game) => (
            <Pressable
              key={game.id}
              onPress={game.onPress}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: Palette.primarySoft },
                ]}
              >
                <IconSymbol name={game.icon} size={28} color={Palette.primaryPressed} />
              </View>
              <Text
                style={[
                  Typography.heading2,
                  { color: palette.text, marginTop: Spacing.base },
                ]}
              >
                {game.title}
              </Text>
              <Text
                style={[
                  Typography.bodySm,
                  { color: palette.textMuted, marginTop: Spacing.xs },
                ]}
              >
                {game.subtitle}
              </Text>
              {game.comingSoon ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: palette.background, borderColor: palette.border },
                  ]}
                >
                  <Text style={[Typography.labelSm, { color: palette.textMuted }]}>
                    준비 중
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_GAP = Spacing.md;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  content: { paddingHorizontal: Spacing.xxl, paddingBottom: 140 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: CARD_GAP,
  },
  card: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minHeight: 160,
    ...Shadow.sm,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
});
