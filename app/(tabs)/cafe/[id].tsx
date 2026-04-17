import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Colors, FontFamily, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  deletePoem,
  fetchPoem,
  toggleBookmark,
  toggleLike,
} from '@/src/lib/poems';
import { useAuthStore } from '@/src/store/auth';
import type { PoemWithAuthor } from '@/src/types/db';

const FONT_FAMILY_MAP = {
  serif: FontFamily.serif,
  sans: FontFamily.sans,
  cursive: FontFamily.serif,
} as const;

export default function PoemDetailScreen() {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [poem, setPoem] = useState<PoemWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPoem(id, userId);
      setPoem(data);
    } catch (e: any) {
      console.warn('[cafe] poem load failed:', e);
      setError(e?.message ?? '시를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onLike() {
    if (!poem || !userId) return;
    const next = !poem.liked_by_me;
    setPoem({
      ...poem,
      liked_by_me: next,
      like_count: poem.like_count + (next ? 1 : -1),
    });
    try {
      await toggleLike(poem.id, userId, !next);
    } catch (e: any) {
      setPoem(poem);
      Alert.alert('실패', e?.message ?? '잠시 후 다시 시도해 주세요.');
    }
  }

  async function onBookmark() {
    if (!poem || !userId) return;
    const next = !poem.bookmarked_by_me;
    setPoem({ ...poem, bookmarked_by_me: next });
    try {
      await toggleBookmark(poem.id, userId, !next);
    } catch (e: any) {
      setPoem(poem);
      Alert.alert('실패', e?.message ?? '잠시 후 다시 시도해 주세요.');
    }
  }

  async function onDelete() {
    if (!poem) return;
    Alert.alert('삭제하시겠어요?', '삭제한 시는 복구할 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePoem(poem.id);
            router.back();
          } catch (e: any) {
            Alert.alert('삭제 실패', e?.message ?? '');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
        <Text style={[Typography.bodySm, { color: palette.textMuted, marginTop: Spacing.md }]}>
          글을 불러오는 중…
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text
          style={[Typography.bodyMd, { color: palette.textMuted, textAlign: 'center' }]}
        >
          {error}
        </Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={[Typography.labelLg, { color: palette.tint }]}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }
  if (!poem) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[Typography.bodyMd, { color: palette.textMuted }]}>시를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const isOwner = userId && poem.user_id === userId;

  return (
    <ScrollView
      style={{ backgroundColor: poem.bg_color }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          headerRight: () =>
            isOwner ? (
              <Pressable onPress={onDelete}>
                <Text
                  style={[Typography.labelLg, { color: '#C0392B', marginRight: Spacing.base }]}
                >
                  삭제
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      {poem.title ? (
        <Text
          style={{
            fontFamily: FontFamily.serifBold,
            fontSize: 26,
            color: '#3D3B38',
            marginBottom: Spacing.lg,
          }}
        >
          {poem.title}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: FONT_FAMILY_MAP[poem.font],
          fontSize: 19,
          lineHeight: 34,
          color: '#3D3B38',
        }}
      >
        {poem.body}
      </Text>

      <Text
        style={[Typography.labelSm, { color: '#6B6860', marginTop: Spacing.xxl }]}
      >
        — {poem.author?.nickname ?? '익명'}
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.action}>
          <IconSymbol
            name={poem.liked_by_me ? 'heart.fill' : 'heart'}
            color={poem.liked_by_me ? '#C0392B' : '#6B6860'}
            size={24}
          />
          <Text style={[Typography.labelLg, { color: '#3D3B38' }]}>{poem.like_count}</Text>
        </Pressable>
        <Pressable onPress={onBookmark} style={styles.action}>
          <IconSymbol
            name={poem.bookmarked_by_me ? 'bookmark.fill' : 'bookmark'}
            color={poem.bookmarked_by_me ? '#C8773A' : '#6B6860'}
            size={24}
          />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xxl, paddingBottom: Spacing.xxl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  retry: {
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8D4CC',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#D8D4CC',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
