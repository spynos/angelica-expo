import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerPushToken, setNotificationPreferences } from '@/src/lib/push';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/auth';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [hour, setHour] = useState<number>(8);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('push_tokens')
        .select('token, notifications_enabled, preferred_hour')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (data) {
        setToken(data.token);
        setPushEnabled(data.notifications_enabled);
        if (data.preferred_hour != null) setHour(data.preferred_hour);
      }
    })();
  }, [userId]);

  async function togglePush(value: boolean) {
    if (!userId) return;
    if (value && !token) {
      const newToken = await registerPushToken(userId);
      if (!newToken) {
        Alert.alert('알림을 활성화할 수 없습니다.', '권한을 확인해 주세요.');
        return;
      }
      setToken(newToken);
      await setNotificationPreferences(newToken, true, hour);
      setPushEnabled(true);
      return;
    }
    if (token) {
      await setNotificationPreferences(token, value, hour);
      setPushEnabled(value);
    }
  }

  async function changeHour(next: number) {
    setHour(next);
    if (token && pushEnabled) {
      await setNotificationPreferences(token, true, next);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <Stack.Screen options={{ title: '설정' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.labelLg, { color: palette.textMuted, marginBottom: Spacing.sm }]}>
          알림
        </Text>
        <View
          style={[
            styles.row,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[Typography.bodyMd, { color: palette.text }]}>데일리 퍼즐 알림</Text>
          <Switch value={pushEnabled} onValueChange={togglePush} />
        </View>

        {pushEnabled ? (
          <>
            <Text
              style={[
                Typography.labelSm,
                { color: palette.textMuted, marginTop: Spacing.lg, marginBottom: Spacing.sm },
              ]}
            >
              알림 시각
            </Text>
            <View style={styles.hours}>
              {[7, 8, 9, 12, 18, 21].map((h) => (
                <Pressable
                  key={h}
                  onPress={() => changeHour(h)}
                  style={[
                    styles.hour,
                    {
                      backgroundColor: hour === h ? palette.tint : palette.surface,
                      borderColor: hour === h ? palette.tint : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.labelLg,
                      { color: hour === h ? '#fff' : palette.text },
                    ]}
                  >
                    {h}:00
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.xxl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hour: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
