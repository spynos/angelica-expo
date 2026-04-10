import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';

import { Colors, FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';
import { createPoem } from '@/src/lib/poems';
import { useAuthStore } from '@/src/store/auth';
import type { PoemBgColor, PoemFont, PoemVisibility } from '@/src/types/db';

const FONTS: { key: PoemFont; label: string; family: string }[] = [
  { key: 'serif', label: '명조', family: FontFamily.serif },
  { key: 'sans', label: '고딕', family: FontFamily.sans },
  { key: 'cursive', label: '필기', family: FontFamily.serif },
];

const BG_COLORS: PoemBgColor[] = ['#FFFFFF', '#FAF7F2', '#F5E6D8', '#EDE8F5'];

const MAX_BODY = 1000;

export default function WritePoemScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [font, setFont] = useState<PoemFont>('serif');
  const [bgColor, setBgColor] = useState<PoemBgColor>('#FAF7F2');
  const [visibility, setVisibility] = useState<PoemVisibility>('public');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!userId) {
      Alert.alert('로그인이 필요합니다.');
      return;
    }
    if (body.trim().length === 0) {
      Alert.alert('시 본문을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await createPoem(userId, {
        title: title.trim() || null,
        body: body.trim(),
        font,
        bg_color: bgColor,
        visibility,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('등록 실패', e?.message ?? '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={submit} disabled={submitting}>
              <Text style={[Typography.labelLg, { color: palette.tint, marginRight: Spacing.base }]}>
                {submitting ? '저장 중…' : '저장'}
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.canvas,
            { backgroundColor: bgColor, borderColor: palette.border },
          ]}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목 (선택)"
            placeholderTextColor="#9C9890"
            style={{
              fontFamily: FontFamily.serifBold,
              fontSize: 20,
              color: '#3D3B38',
              marginBottom: Spacing.md,
            }}
            maxLength={60}
          />
          <TextInput
            value={body}
            onChangeText={(t) => setBody(t.slice(0, MAX_BODY))}
            placeholder="당신의 시를 적어 보세요…"
            placeholderTextColor="#9C9890"
            multiline
            textAlignVertical="top"
            style={{
              fontFamily: FONTS.find((f) => f.key === font)!.family,
              fontSize: 18,
              lineHeight: 32,
              color: '#3D3B38',
              minHeight: 240,
            }}
          />
          <Text
            style={[
              Typography.labelSm,
              { color: '#6B6860', textAlign: 'right', marginTop: Spacing.sm },
            ]}
          >
            {body.length} / {MAX_BODY}
          </Text>
        </View>

        <Text style={[Typography.labelLg, styles.sectionLabel, { color: palette.textMuted }]}>
          서체
        </Text>
        <View style={styles.row}>
          {FONTS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFont(f.key)}
              style={[
                styles.chip,
                {
                  borderColor: font === f.key ? palette.tint : palette.border,
                  backgroundColor: font === f.key ? palette.tint : palette.surface,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: f.family,
                  fontSize: 14,
                  color: font === f.key ? '#fff' : palette.text,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[Typography.labelLg, styles.sectionLabel, { color: palette.textMuted }]}>
          배경
        </Text>
        <View style={styles.row}>
          {BG_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setBgColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c, borderColor: bgColor === c ? palette.tint : palette.border },
              ]}
            />
          ))}
        </View>

        <Text style={[Typography.labelLg, styles.sectionLabel, { color: palette.textMuted }]}>
          공개 범위
        </Text>
        <View style={styles.row}>
          {(['public', 'private'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setVisibility(v)}
              style={[
                styles.chip,
                {
                  borderColor: visibility === v ? palette.tint : palette.border,
                  backgroundColor: visibility === v ? palette.tint : palette.surface,
                },
              ]}
            >
              <Text
                style={[
                  Typography.labelLg,
                  { color: visibility === v ? '#fff' : palette.text },
                ]}
              >
                {v === 'public' ? '전체 공개' : '나만 보기'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
        <Button label="시 등록" loading={submitting} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.xxl, paddingBottom: Spacing.xxl * 2 },
  canvas: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionLabel: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
});
