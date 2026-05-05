import { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlockMatchGameV2 } from '@/src/components/blockmatch/v2/BlockMatchGameV2';
import { SoundService } from '@/src/components/blockmatch/v2/feedback/sound';
import { GameOverSheet } from '@/src/components/blockmatch/GameOverSheet';
import { useBlockMatch } from '@/src/store/blockmatch';

export default function BlockMatchScreen() {
  const palette = Colors[(useColorScheme() ?? 'light') as 'light' | 'dark'];
  const restart = useBlockMatch((s) => s.restart);
  const state = useBlockMatch((s) => s.state);

  // Audible click on header restart + game-over restart so the user hears
  // confirmation of the action before the new-game start jingle fires from
  // BlockMatchGameV2.
  const handleRestart = useCallback(() => {
    SoundService.playClick();
    restart();
  }, [restart]);

  const isNewHigh = state.isOver && state.score > 0 && state.score >= state.highScore;

  return (
    <>
      <Stack.Screen
        options={{
          title: `블록매치 · 스테이지 ${state.stage}`,
          headerRight: () => (
            <Pressable
              onPress={handleRestart}
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
        onRestart={handleRestart}
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
