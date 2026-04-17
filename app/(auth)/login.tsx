import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { isExpoGo } from '@/src/lib/storage';
import { supabase } from '@/src/lib/supabase';
import { signInWithApple, signInWithGoogle } from '@/src/lib/social-auth';

// Native Apple button — unavailable in Expo Go.
let AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
if (!isExpoGo) {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch {
    // native module unavailable
  }
}

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin() {
    setError(null);
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace('/(tabs)');
  }

  async function handleApple() {
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple 로그인 실패', e?.message ?? '잠시 후 다시 시도해 주세요.');
      }
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Google 로그인 실패', e?.message ?? '잠시 후 다시 시도해 주세요.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <View style={styles.inner}>
        <Text style={[Typography.display, { color: palette.text }]}>안젤리카</Text>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, marginBottom: Spacing.xxl }]}>
          조용한 휴식 공간에 오신 것을 환영해요.
        </Text>

        <TextField
          label="이메일"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={{ height: Spacing.md }} />
        <TextField
          label="비밀번호"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          error={error}
        />

        <View style={{ height: Spacing.lg }} />
        <Button label="로그인" loading={submitting} onPress={handleEmailLogin} />

        <View style={styles.row}>
          <Link href="/(auth)/signup" style={[Typography.labelLg, { color: palette.tint }]}>
            회원가입
          </Link>
          <Link
            href="/(auth)/reset-password"
            style={[Typography.labelLg, { color: palette.textMuted }]}
          >
            비밀번호 찾기
          </Link>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
          <Text style={[Typography.labelSm, { color: palette.textMuted, marginHorizontal: Spacing.md }]}>
            또는
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
        </View>

        {Platform.OS === 'ios' ? (
          AppleAuthentication ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={
                scheme === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={10}
              style={styles.appleButton}
              onPress={handleApple}
            />
          ) : (
            <Button label="Apple로 계속하기" variant="secondary" onPress={handleApple} />
          )
        ) : null}
        <View style={{ height: Spacing.md }} />
        <Button label="Google로 계속하기" variant="secondary" onPress={handleGoogle} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, padding: Spacing.xxl, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1 },
  appleButton: { height: 48 },
});
