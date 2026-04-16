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
import { DRAG_LIFT_PX } from '@/src/components/blockmatch/DraggablePiece';
import { GameOverSheet } from '@/src/components/blockmatch/GameOverSheet';
import { PieceTray } from '@/src/components/blockmatch/PieceTray';
import { PieceShapeView, shapeBounds, shapeFor } from '@/src/components/blockmatch/PieceShape';
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

  const boardRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const [boardOrigin, setBoardOrigin] = useState<{ x: number; y: number } | null>(null);
  const [containerOffsetY, setContainerOffsetY] = useState(0);
  const [ghost, setGhost] = useState<GhostPlacement>(null);
  const [transition, setTransition] = useState<BoardTransition>('idle');

  // Finger position reported by DraggablePiece during an active drag.
  const [dragPos, setDragPos] = useState<{ absX: number; absY: number } | null>(null);

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
      containerRef.current?.measureInWindow((_, y) => {
        setContainerOffsetY(y);
      });
    });
  }, []);

  // Floating piece dimensions — board cellSize for visual consistency with ghost.
  const floatingShape = shapeFor(state.current);
  const { rows: floatingRows, cols: floatingCols } = shapeBounds(floatingShape);
  const floatingW = floatingCols * cellSize;
  const floatingH = floatingRows * cellSize;

  /**
   * Convert finger absolute coords → board grid position using the SAME formula
   * as the floating piece overlay, so ghost always matches what the user sees.
   *
   * Floating piece top-left (screen):
   *   left = absX - floatingW / 2
   *   top  = absY - floatingH - DRAG_LIFT_PX
   *
   * Convert to board grid:
   *   col = round((floatingLeft - boardOrigin.x) / cellSize)
   *   row = round((floatingTop  - boardOrigin.y) / cellSize)
   */
  const toGridPos = useCallback(
    (absX: number, absY: number) => {
      if (!boardOrigin) return null;
      const floatingLeft = absX - floatingW / 2;
      const floatingTop = absY - floatingH - DRAG_LIFT_PX;
      const col = Math.round((floatingLeft - boardOrigin.x) / cellSize);
      // containerOffsetY compensates for SafeAreaView starting below the nav header:
      // floating piece `top` style is SafeAreaView-local, but boardOrigin.y is screen-absolute.
      const row = Math.round((floatingTop + containerOffsetY - boardOrigin.y) / cellSize);
      return { row, col };
    },
    [boardOrigin, floatingW, floatingH, cellSize],
  );

  const handleDragMove = useCallback(
    (pos: { absX: number; absY: number } | null) => {
      setDragPos(pos);
      if (!pos || transition !== 'idle') {
        setGhost(null);
        return;
      }
      const target = toGridPos(pos.absX, pos.absY);
      if (!target) { setGhost(null); return; }
      setGhost({ piece: state.current, row: target.row, col: target.col });
    },
    [toGridPos, state.current, transition],
  );

  const handleDrop = useCallback(
    (pos: { absX: number; absY: number } | null) => {
      setGhost(null);
      if (transition !== 'idle') return;
      if (!pos) return;
      const target = toGridPos(pos.absX, pos.absY);
      if (!target) return;
      if (!canPlace(state.board, state.current, target.row, target.col)) return;
      dispatch({ type: 'place', row: target.row, col: target.col });
    },
    [dispatch, state.board, state.current, transition, toGridPos],
  );

  const handleRotate = useCallback(() => {
    if (transition !== 'idle') return;
    dispatch({ type: 'rotate' });
  }, [dispatch, transition]);

  const isNewHigh = state.isOver && state.score > 0 && state.score >= state.highScore;

  return (
    <SafeAreaView ref={containerRef as any} style={[styles.root, { backgroundColor: palette.background }]} edges={['top']}>
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
          enabled={transition === 'idle' && !state.isOver}
          onDrop={handleDrop}
          onRotate={handleRotate}
          onDragMove={handleDragMove}
        />
      </View>

      {/* Floating drag piece — rendered above everything, follows finger */}
      {dragPos && (
        <View
          pointerEvents="none"
          style={[
            styles.floatingPiece,
            {
              left: dragPos.absX - floatingW / 2,
              top: dragPos.absY - floatingH - DRAG_LIFT_PX,
            },
          ]}
        >
          <PieceShapeView piece={state.current} cellSize={cellSize} />
        </View>
      )}

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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  floatingPiece: {
    position: 'absolute',
    zIndex: 999,
  },
});
