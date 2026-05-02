import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { BottomNavBar } from '@/src/components/BottomNavBar';
import { useAuthStore } from '@/src/store/auth';

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      initialRouteName="cafe"
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="cafe" options={{ title: '포스트' }} />
      <Tabs.Screen name="puzzle" options={{ title: '퍼즐' }} />
      <Tabs.Screen name="bookcafe" options={{ title: '북카페' }} />
      <Tabs.Screen name="profile" options={{ title: '계정' }} />
    </Tabs>
  );
}
