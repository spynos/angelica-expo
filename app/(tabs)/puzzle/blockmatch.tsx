import { Pressable, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlockMatchGameV2 } from '@/src/components/blockmatch/v2/BlockMatchGameV2';
import { GameOverSheet } from '@/src/components/blockmatch/GameOverSheet';
import { useBlockMatch } from '@/src/store/blockmatch';

export default function BlockMatchScreen() {
  const palette = Colors[(useColorScheme() ?? 'light') as 'light' | 'dark'];
  const restart = useBlockMatch((s) => s.restart);
  const state = useBlockMatch((s) => s.state);

  const isNewHigh = state.isOver && state.score > 0 && state.score >= state.highScore;

  return (
    <>
      <Stack.Screen
        options={{
          title: `블록매치 · 스테이지 ${state.stage}`,
          headerRight: () => (
            <Pressable
              onPress={restart}
              hitSlop={Spacing.sm}
              style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
              accessibilityRole="button"
              accessibilityLabel="게임 다시하기"
            >
              <RotateCcw size={22} color={palette.text} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
      <BlockMatchGameV2 />
      <GameOverSheet
        visible={state.isOver}
        score={state.score}
        highScore={state.highScore}
        isNewHigh={isNewHigh}
        onRestart={restart}
        onClose={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  headerActionPressed: {
    opacity: 0.5,
  },
});
