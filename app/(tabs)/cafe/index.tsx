import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { Colors, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PoemCard } from '@/src/components/PoemCard';
import { fetchFeed } from '@/src/lib/poems';
import { useAuthStore } from '@/src/store/auth';
import type { PoemWithAuthor } from '@/src/types/db';

export default function CafeFeed() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [poems, setPoems] = useState<PoemWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await fetchFeed(userId);
      setPoems(rows);
    } catch (e: any) {
      setError(e?.message ?? '피드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[Typography.heading1, { color: palette.text }]}>문학카페</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.tint} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={poems}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PoemCard poem={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={palette.tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[Typography.bodyMd, { color: palette.textMuted }]}>
                {error ?? '아직 시가 없습니다. 첫 시를 남겨보세요.'}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        accessibilityLabel="시 쓰기"
        onPress={() => router.push('/(tabs)/cafe/write')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: pressed ? Palette.primaryPressed : Palette.primary },
        ]}
      >
        <IconSymbol name="plus" color="#fff" size={28} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.base, paddingBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.xxl, paddingBottom: 120 },
  center: { padding: Spacing.xxl, alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: Spacing.xxl,
    bottom: Spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
});
