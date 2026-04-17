import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HeaderBackButton } from '@/src/components/HeaderBackButton';

export default function PuzzleStack() {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[scheme];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerTitleStyle: { color: palette.text },
        contentStyle: { backgroundColor: palette.background },
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: () => <HeaderBackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="history"
        options={{ title: '기록', presentation: 'modal' }}
      />
      <Stack.Screen name="sudoku/[difficulty]" options={{ title: '스도쿠' }} />
      <Stack.Screen name="sudoku/complete" options={{ headerShown: false }} />
      <Stack.Screen name="blockmatch" options={{ title: '블록매치' }} />
      <Stack.Screen name="crossword" options={{ title: '십자말풀이' }} />
      <Stack.Screen name="quiz" options={{ title: '장학퀴즈' }} />
    </Stack>
  );
}
