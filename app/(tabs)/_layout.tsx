import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { LiquidTabBar } from '@/src/components/LiquidTabBar';
import { useAuthStore } from '@/src/store/auth';

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      initialRouteName="cafe"
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="cafe" options={{ title: '문학카페' }} />
      <Tabs.Screen name="puzzle" options={{ title: '퍼즐게임' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: '프로필' }} />
    </Tabs>
  );
}
