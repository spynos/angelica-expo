import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HeaderAvatarButton } from '@/src/components/HeaderAvatarButton';
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
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchFeed(userIdRef.current);
      setPoems(rows);
      setLoading(false);
      setRefreshing(false);
    } catch (e: any) {
      console.warn('[cafe] feed load failed:', e);
      setError(e?.message ?? '피드를 불러오지 못했습니다.');
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        <Text style={[Typography.display, { color: palette.text }]}>문학카페</Text>
        <HeaderAvatarButton />
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

    </SafeAreaView>
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
    paddingBottom: Spacing.lg,
  },
  list: { paddingHorizontal: Spacing.xxl, paddingBottom: 140 },
  center: { padding: Spacing.xxl, alignItems: 'center' },
});
