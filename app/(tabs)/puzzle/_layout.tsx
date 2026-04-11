import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PuzzleStack() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerTitleStyle: { color: palette.text },
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ title: '기록' }} />
      <Stack.Screen name="sudoku/[difficulty]" options={{ title: '스도쿠' }} />
      <Stack.Screen name="sudoku/complete" options={{ headerShown: false }} />
    </Stack>
  );
}
