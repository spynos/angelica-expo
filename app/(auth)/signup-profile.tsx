import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { supabase } from '@/src/lib/supabase';

export default function SignupStep2() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const params = useLocalSearchParams<{ email: string; password: string }>();
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: params.email!,
      password: params.password!,
      options: {
        data: { nickname: nickname.trim() },
      },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <View style={styles.inner}>
        <Text style={[Typography.heading1, { color: palette.text }]}>닉네임 설정</Text>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, marginBottom: Spacing.xxl }]}>
          2 / 2 — 다른 사용자에게 보일 이름이에요.
        </Text>

        <TextField
          label="닉네임"
          autoCapitalize="none"
          value={nickname}
          onChangeText={setNickname}
          error={error}
          maxLength={20}
        />
        <View style={{ height: Spacing.lg }} />
        <Button label="가입 완료" loading={submitting} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, padding: Spacing.xxl, justifyContent: 'center' },
});
