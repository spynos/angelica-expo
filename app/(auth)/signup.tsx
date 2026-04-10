import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';

export default function SignupStep1() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function next() {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일을 입력해 주세요.');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('비밀번호는 8자 이상, 영문과 숫자를 모두 포함해야 합니다.');
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    router.push({ pathname: '/(auth)/signup-profile', params: { email, password } });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <View style={styles.inner}>
        <Text style={[Typography.heading1, { color: palette.text }]}>회원가입</Text>
        <Text
          style={[Typography.bodyMd, { color: palette.textMuted, marginBottom: Spacing.xxl }]}
        >
          1 / 2 — 계정 정보
        </Text>

        <TextField
          label="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <View style={{ height: Spacing.md }} />
        <TextField
          label="비밀번호 (8자 이상, 영문+숫자)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={{ height: Spacing.md }} />
        <TextField
          label="비밀번호 확인"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          error={error}
        />
        <View style={{ height: Spacing.lg }} />
        <Button label="다음" onPress={next} />

        <View style={styles.row}>
          <Text style={[Typography.bodySm, { color: palette.textMuted }]}>이미 계정이 있나요?</Text>
          <Link href="/(auth)/login" style={[Typography.labelLg, { color: palette.tint }]}>
            로그인
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, padding: Spacing.xxl, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, justifyContent: 'center' },
});
