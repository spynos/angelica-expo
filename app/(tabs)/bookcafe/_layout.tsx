import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HeaderBackButton } from '@/src/components/HeaderBackButton';

export default function BookcafeStack() {
  const scheme = useColorScheme() ?? 'light';
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
    </Stack>
  );
}
