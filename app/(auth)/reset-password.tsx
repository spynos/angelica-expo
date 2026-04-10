import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { supabase } from '@/src/lib/supabase';

export default function ResetPasswordScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email) return;
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setSubmitting(false);
    if (error) {
      Alert.alert('전송 실패', error.message);
      return;
    }
    Alert.alert('이메일 전송됨', '받은 편지함을 확인해 주세요.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <View style={styles.inner}>
        <Text style={[Typography.heading1, { color: palette.text }]}>비밀번호 재설정</Text>
        <Text style={[Typography.bodyMd, { color: palette.textMuted, marginBottom: Spacing.xxl }]}>
          가입한 이메일로 재설정 링크를 보내 드려요.
        </Text>
        <TextField
          label="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={{ height: Spacing.lg }} />
        <Button label="재설정 메일 보내기" loading={submitting} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, padding: Spacing.xxl, justifyContent: 'center' },
});
