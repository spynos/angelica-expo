import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

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

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthBootstrap } from '@/src/store/auth';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    GowunBatang_400Regular,
    GowunBatang_700Bold,
    AstaSans_400Regular,
    AstaSans_500Medium,
    AstaSans_700Bold,
  });
  const authReady = useAuthBootstrap();

  useEffect(() => {
    if (fontsLoaded && authReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authReady]);

  if (!fontsLoaded || !authReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
