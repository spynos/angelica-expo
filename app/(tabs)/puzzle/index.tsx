import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HeaderAvatarButton } from '@/src/components/HeaderAvatarButton';
import { getAllActivities, getRecentOrder, type GameActivity } from '@/src/lib/games/activity';
import { GAMES, type GameId, type GameMeta } from '@/src/lib/games/registry';

function greetingForHour(hour: number) {
  if (hour < 5) return '늦은 밤이에요.';
  if (hour < 12) return '좋은 아침이에요.';
  if (hour < 18) return '좋은 오후예요.';
  return '좋은 저녁이에요.';
}

function formatToday(date: Date) {
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}요일`;
}

export default function PuzzleHome() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [order, setOrder] = useState<GameId[]>(() => getRecentOrder());
  const [activities, setActivities] = useState<Record<GameId, GameActivity | null>>(() =>
    getAllActivities(),
  );

  useFocusEffect(
    useCallback(() => {
      setOrder(getRecentOrder());
      setActivities(getAllActivities());
    }, []),
  );

  const { greeting, today } = useMemo(() => {
    const now = new Date();
    return { greeting: greetingForHour(now.getHours()), today: formatToday(now) };
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[Typography.display, { color: palette.text }]}>퍼즐</Text>
        <HeaderAvatarButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingBlock}>
          <Text style={[Typography.heading2, { color: palette.text, textAlign: 'center' }]}>
            {greeting}
          </Text>
          <Text
            style={[
              Typography.bodyMd,
              { color: palette.textMuted, textAlign: 'center', marginTop: Spacing.xs },
            ]}
          >
            편안한 퍼즐 한 판 어떠세요?
          </Text>
        </View>

        {order.length > 0 ? (
          <FeaturedCard
            game={GAMES[order[0]]}
            activity={activities[order[0]]}
            today={today}
          />
        ) : null}

        <View style={styles.actionRow}>
          <ActionCard
            label="기록"
            icon="list.bullet"
            onPress={() => router.push('/(tabs)/puzzle/history' as any)}
          />
          <ActionCard
            label="아카이브"
            icon="book.fill"
            onPress={() => router.push('/(tabs)/puzzle/history' as any)}
          />
        </View>

        {order.slice(1).map((id) => (
          <FeaturedCard
            key={id}
            game={GAMES[id]}
            activity={activities[id]}
            today={today}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeaturedCard({
  game,
  activity,
  today,
}: {
  game: GameMeta;
  activity: GameActivity | null;
  today: string;
}) {
  const showResume = activity?.hasInProgress && !game.comingSoon;
  const byline = showResume
    ? '이어하기'
    : activity?.bestScore != null
      ? `최고 ${activity.bestScore}점`
      : game.defaultByline;

  return (
    <Pressable
      onPress={game.open}
      style={({ pressed }) => [
        styles.featured,
        {
          backgroundColor: game.background,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.featuredBody}>
        <Text style={[Typography.heading1, { color: game.foreground }]}>{game.title}</Text>
        <Text
          style={[
            Typography.bodySm,
            { color: game.mutedForeground, marginTop: Spacing.xs, maxWidth: '90%' },
          ]}
        >
          {game.description}
        </Text>
        <View style={styles.featuredFooter}>
          <Text style={[Typography.labelLg, { color: game.foreground }]}>{today}</Text>
          <Text style={[Typography.labelSm, { color: game.mutedForeground }]}>{byline}</Text>
        </View>
      </View>
      <View style={styles.featuredIconWrap}>
        <IconSymbol name={game.icon} size={72} color={game.foreground} />
        {game.comingSoon ? (
          <View style={[styles.badge, { borderColor: game.foreground }]}>
            <Text style={[Typography.labelSm, { color: game.foreground }]}>준비 중</Text>
          </View>
        ) : showResume ? (
          <View style={[styles.badge, { borderColor: game.foreground, backgroundColor: game.foreground }]}>
            <Text style={[Typography.labelSm, { color: game.background }]}>이어하기</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function ActionCard({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: Parameters<typeof IconSymbol>[0]['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: '#A8C4F0',
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[Typography.heading2, { color: '#1F2A44' }]}>{label}</Text>
      <IconSymbol name={icon} size={22} color="#1F2A44" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 140,
    gap: Spacing.base,
  },
  greetingBlock: {
    paddingVertical: Spacing.lg,
  },
  featured: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    minHeight: 150,
    alignItems: 'stretch',
    ...Shadow.sm,
  },
  featuredBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredFooter: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredIconWrap: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    minHeight: 60,
    ...Shadow.sm,
  },
});
