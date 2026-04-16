import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  AstaSans_400Regular,
  AstaSans_500Medium,
  AstaSans_700Bold,
} from '@expo-google-fonts/asta-sans';
import {
  GowunBatang_400Regular,
  GowunBatang_700Bold,
  useFonts,
} from '@expo-google-fonts/gowun-batang';

import { AppSplash } from '@/components/app-splash';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthBootstrap, type AuthBootstrapStatus } from '@/src/store/auth';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS === 'android') {
  NavigationBar.setVisibilityAsync('hidden');
  NavigationBar.setBehaviorAsync('overlay-swipe');
}

export const unstable_settings = {
  anchor: '(tabs)',
};

const STATUS_MESSAGE: Record<AuthBootstrapStatus, string> = {
  idle: '앱을 준비하고 있어요',
  session: '세션을 확인하는 중…',
  profile: '프로필을 불러오는 중…',
  done: '거의 다 됐어요',
  timeout: '네트워크 응답이 느려요. 계속 진행합니다…',
  error: '초기화 중 문제가 발생했어요',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    GowunBatang_400Regular,
    GowunBatang_700Bold,
    AstaSans_400Regular,
    AstaSans_500Medium,
    AstaSans_700Bold,
  });
  const { ready: authReady, status: authStatus } = useAuthBootstrap();

  // Treat font errors as "loaded" so a CDN failure can't pin the splash forever.
  const fontsSettled = fontsLoaded || Boolean(fontError);
  const appReady = fontsSettled && authReady;

  // Hide the native splash as soon as we can render anything. From that point
  // on the in-app <AppSplash /> takes over and shows progress.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const { progress, message } = useMemo(() => {
    let p = 0.08;
    if (fontsSettled) p += 0.32;
    if (authStatus === 'session') p = Math.max(p, 0.45);
    if (authStatus === 'profile') p = Math.max(p, 0.7);
    if (authStatus === 'done' || authStatus === 'timeout' || authStatus === 'error') p = 0.95;
    if (appReady) p = 1;

    let m = STATUS_MESSAGE[authStatus];
    if (!fontsSettled) m = '폰트를 불러오는 중…';
    return { progress: p, message: m };
  }, [fontsSettled, authStatus, appReady]);

  if (!appReady) {
    return <AppSplash progress={progress} message={message} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar hidden />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
