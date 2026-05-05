import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect } from 'expo-router';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PoemCard } from '@/src/components/PoemCard';
import { fetchFeed } from '@/src/lib/poems';
import { useAuthStore } from '@/src/store/auth';
import type { PoemWithAuthor } from '@/src/types/db';

export default function CafeFeed() {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[scheme];
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [poems, setPoems] = useState<PoemWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Guard against overlapping loads and stale responses writing to state
  // after the component has unmounted or a newer request has started.
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const reqId = ++requestIdRef.current;
    if (!isRefresh) setLoading((prev) => (poems.length === 0 ? true : prev));
    setError(null);
    try {
      const rows = await fetchFeed(userIdRef.current);
      if (!mountedRef.current || reqId !== requestIdRef.current) return;
      setPoems(rows);
    } catch (e: any) {
      console.warn('[cafe] feed load failed:', e);
      if (!mountedRef.current || reqId !== requestIdRef.current) return;
      setError(e?.message ?? '피드를 불러오지 못했습니다.');
    } finally {
      if (mountedRef.current && reqId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      inFlightRef.current = false;
    }
  }, [poems.length]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load({ isRefresh: true });
  }, [load]);

  const onRetry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[Typography.display, { color: palette.text }]}>포스트</Text>
      </View>
      {loading && poems.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.tint} />
          <Text style={[Typography.bodySm, { color: palette.textMuted, marginTop: Spacing.md }]}>
            글을 불러오는 중…
          </Text>
        </View>
      ) : error && poems.length === 0 ? (
        <View style={styles.center}>
          <Text
            style={[Typography.bodyMd, { color: palette.textMuted, textAlign: 'center' }]}
          >
            {error}
          </Text>
          <Pressable
            onPress={onRetry}
            style={[styles.retry, { borderColor: palette.border }]}
          >
            <Text style={[Typography.labelLg, { color: palette.tint }]}>다시 시도</Text>
          </Pressable>
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
              onRefresh={onRefresh}
              tintColor={palette.tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[Typography.bodyMd, { color: palette.textMuted }]}>
                아직 시가 없습니다. 첫 시를 남겨보세요.
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
  center: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  retry: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
