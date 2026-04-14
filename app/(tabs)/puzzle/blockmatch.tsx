import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Board,
  type BoardTransition,
  type GhostPlacement,
} from '@/src/components/blockmatch/Board';
import { GameOverSheet } from '@/src/components/blockmatch/GameOverSheet';
import { PieceTray } from '@/src/components/blockmatch/PieceTray';
import { ScorePanel } from '@/src/components/blockmatch/ScorePanel';
import { canPlace } from '@/src/lib/blockmatch/board';
import { BOARD_SIZE } from '@/src/lib/blockmatch/types';
import { useBlockMatch } from '@/src/store/blockmatch';

const CLEAR_PHASE_MS = 800;
const SPAWN_PHASE_MS = 800;

export default function BlockMatchScreen() {
  const palette = Colors[useColorScheme() ?? 'light'];
  const start = useBlockMatch((s) => s.start);
  const finalize = useBlockMatch((s) => s.finalize);
  const dispatch = useBlockMatch((s) => s.dispatch);
  const restart = useBlockMatch((s) => s.restart);
  const state = useBlockMatch((s) => s.state);
  const lastTurn = useBlockMatch((s) => s.lastTurn);

  useEffect(() => {
    start();
    return () => finalize();
  }, [start, finalize]);

  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = Spacing.base;
  const cellSize = Math.floor((screenWidth - horizontalPadding * 2) / BOARD_SIZE);
  const trayCellSize = Math.min(28, cellSize - 2);
  const previewCellSize = 14;

  const boardRef = useRef<View>(null);
  const [boardOrigin, setBoardOrigin] = useState<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<GhostPlacement>(null);
  const [transition, setTransition] = useState<BoardTransition>('idle');

  // Stage transition orchestration: when a turn report arrives with stageCleared,
  // run a clear-phase animation, dispatch commitStage to swap the board, then
  // run the spawn-phase animation.
  useEffect(() => {
    if (!lastTurn?.stageCleared) return;
    setTransition('clearing');
    const t1 = setTimeout(() => {
      dispatch({ type: 'commitStage' });
      setTransition('spawning');
      const t2 = setTimeout(() => setTransition('idle'), SPAWN_PHASE_MS);
      timersRef.current.push(t2);
    }, CLEAR_PHASE_MS);
    timersRef.current.push(t1);
  }, [lastTurn, dispatch]);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, []);

  const measureBoard = useCallback(() => {
    requestAnimationFrame(() => {
      boardRef.current?.measureInWindow((x, y) => {
        setBoardOrigin({ x, y });
      });
    });
  }, []);

  const handleHover = useCallback(
    (target: { row: number; col: number } | null) => {
      if (transition !== 'idle') return;
      if (!target) {
        setGhost(null);
        return;
      }
      setGhost({ piece: state.current, row: target.row, col: target.col });
    },
    [state.current, transition],
  );

  const handleDrop = useCallback(
    (target: { row: number; col: number } | null) => {
      setGhost(null);
      if (transition !== 'idle') return;
      if (!target) return;
      if (!canPlace(state.board, state.current, target.row, target.col)) return;
      dispatch({ type: 'place', row: target.row, col: target.col });
    },
    [dispatch, state.board, state.current, transition],
  );

  const handleRotate = useCallback(() => {
    if (transition !== 'idle') return;
    dispatch({ type: 'rotate' });
  }, [dispatch, transition]);

  const isNewHigh = state.isOver && state.score > 0 && state.score >= state.highScore;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
      <Stack.Screen options={{ title: `블록매치 · 스테이지 ${state.stage}` }} />
      <ScorePanel score={state.score} highScore={state.highScore} combo={state.combo} />

      <View style={styles.boardWrap} onLayout={measureBoard}>
        <Board
          ref={boardRef}
          board={state.board}
          cellSize={cellSize}
          ghost={ghost}
          transition={transition}
          onLayout={measureBoard}
        />
      </View>

      <View style={styles.trayWrap}>
        <PieceTray
          current={state.current}
          next={state.next}
          cellSize={trayCellSize}
          previewSize={previewCellSize}
          boardOrigin={boardOrigin}
          enabled={transition === 'idle' && !state.isOver}
          onHover={handleHover}
          onDrop={handleDrop}
          onRotate={handleRotate}
        />
      </View>

      <GameOverSheet
        visible={state.isOver}
        score={state.score}
        highScore={state.highScore}
        isNewHigh={isNewHigh}
        onRestart={restart}
        onClose={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },
  trayWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.base,
  },
});
