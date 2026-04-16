import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
import { BOARD_SIZE, type ActivePiece } from '@/src/lib/blockmatch/types';
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

  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = Spacing.base;
  const cellSize = Math.floor((screenWidth - horizontalPadding * 2) / BOARD_SIZE);

  // Responsive tray layout: preview slots are sized proportional to screen width
  // (clamped for small/large devices), and the current-piece slot is a square
  // whose side fills the remaining horizontal space (capped on large screens).
  // Keeping the slot square ensures a piece's cell size stays constant across
  // rotations — a 1×5 line looks the same before and after a 90° turn.
  // Individual cell sizes are computed inside PieceTray from each piece's
  // bounding box so pieces always fit their slot.
  const previewSlotSize = Math.min(96, Math.max(60, Math.round(screenWidth * 0.2)));
  const trayAvailWidth = screenWidth - horizontalPadding * 2;
  const availableForCurrent =
    trayAvailWidth - previewSlotSize * 2 - Spacing.sm - Spacing.base;
  const currentSlotSize = Math.max(120, Math.min(availableForCurrent, 220));
  const maxTrayCellSize = Math.max(14, cellSize - 2);
  const maxPreviewCellSize = Math.max(10, Math.round(maxTrayCellSize * 0.65));

  const boardRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const [boardOrigin, setBoardOrigin] = useState<{ x: number; y: number } | null>(null);
  const [containerOffsetY, setContainerOffsetY] = useState(0);
  const [ghost, setGhost] = useState<GhostPlacement>(null);
  const [transition, setTransition] = useState<BoardTransition>('idle');
  const [dragEndKey, setDragEndKey] = useState(0);

  // Shared values for floating piece — updated on UI thread, no React re-renders.
  const dragAbsX = useSharedValue(0);
  const dragAbsY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  // Opacity is animated separately from the isDragging flag so we can fade the
  // overlay out over 120 ms after release. That fade masks the 1–2 frame gap
  // between the JS-thread board update (ghost → placed block) and the UI
  // thread catching up, which otherwise read as a "blink" on the board.
  const floatingOpacity = useSharedValue(0);

  // Snapshot of the piece that was just dropped. While fading out, the overlay
  // renders this snapshot instead of `state.current` — because `dispatch('place')`
  // advances `state.current` to the next queued piece, and without the snapshot
  // the fading overlay would briefly flash the *next* piece at the drop
  // position before vanishing. Cleared on the next drag start via the
  // useAnimatedReaction below so subsequent drags pick up the new tray piece.
  const [floatingSnapshot, setFloatingSnapshot] = useState<ActivePiece | null>(null);
  const floatingPiece = floatingSnapshot ?? state.current;

  // Floating piece dimensions — board cellSize for visual consistency with ghost.
  const floatingShape = shapeFor(floatingPiece);
  const { rows: floatingRows, cols: floatingCols } = shapeBounds(floatingShape);
  const floatingW = floatingCols * cellSize;
  const floatingH = floatingRows * cellSize;

  // Drive floatingOpacity off isDragging: instant fade-in on drag start (after
  // a one-frame delay so React can commit the snapshot clear), timed fade-out
  // on release. The 50 ms fade-in from 0→1 gives the JS thread a frame to
  // apply `setFloatingSnapshot(null)` before the overlay becomes visible —
  // otherwise the stale last-dropped snapshot would flash for a frame on the
  // next drag's onStart.
  useAnimatedReaction(
    () => isDragging.value,
    (dragging, prev) => {
      if (dragging === prev) return;
      if (dragging) {
        runOnJS(setFloatingSnapshot)(null);
        floatingOpacity.value = 0;
        floatingOpacity.value = withTiming(1, { duration: 50 });
      } else {
        floatingOpacity.value = withTiming(0, { duration: 120 });
      }
    },
    [],
  );

  // Animated style for the floating overlay — runs on UI thread, zero JS re-renders.
  const floatingAnimStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    zIndex: 999,
    left: dragAbsX.value - floatingW / 2,
    top: dragAbsY.value - floatingH - DRAG_LIFT_PX,
    opacity: floatingOpacity.value,
  }));

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
    [boardOrigin, floatingW, floatingH, cellSize, containerOffsetY],
  );

  // Track last ghost grid position — skip setGhost when finger is within the same cell.
  const lastGhostPosRef = useRef<{ row: number; col: number } | null>(null);

  const handleDragMove = useCallback(
    (pos: { absX: number; absY: number } | null) => {
      if (!pos || transition !== 'idle') {
        lastGhostPosRef.current = null;
        setGhost(null);
        return;
      }
      const target = toGridPos(pos.absX, pos.absY);
      if (!target) { setGhost(null); return; }

      // Only re-render when the finger crosses a cell boundary.
      const last = lastGhostPosRef.current;
      if (last?.row === target.row && last?.col === target.col) return;
      lastGhostPosRef.current = target;

      setGhost({ piece: state.current, row: target.row, col: target.col });
    },
    [toGridPos, state.current, transition],
  );

  const handleDrop = useCallback(
    (pos: { absX: number; absY: number } | null) => {
      setGhost(null);
      lastGhostPosRef.current = null;
      if (transition !== 'idle') return;
      if (!pos) return;
      const target = toGridPos(pos.absX, pos.absY);
      if (!target) return;
      if (!canPlace(state.board, state.current, target.row, target.col)) return;
      // Lock the floating overlay to the piece we're about to dispatch —
      // otherwise, once `state.current` advances to the next queued piece,
      // the still-fading overlay would briefly render the next piece at the
      // drop position. The snapshot is cleared on the next drag start via
      // the useAnimatedReaction on isDragging.
      setFloatingSnapshot(state.current);
      dispatch({ type: 'place', row: target.row, col: target.col });
    },
    [dispatch, state.board, state.current, transition, toGridPos],
  );

  const handleDragEnd = useCallback(() => {
    setDragEndKey((k) => k + 1);
  }, []);

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
          currentSlotSize={currentSlotSize}
          previewSlotSize={previewSlotSize}
          maxCellSize={maxTrayCellSize}
          maxPreviewCellSize={maxPreviewCellSize}
          enabled={transition === 'idle' && !state.isOver}
          dragX={dragAbsX}
          dragY={dragAbsY}
          isDragging={isDragging}
          restoreKey={dragEndKey}
          onDrop={handleDrop}
          onRotate={handleRotate}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      </View>

      {/* Floating drag piece — Animated.View driven by shared values, no JS re-renders.
          `floatingPiece` prefers the snapshot during drop-fade so the next piece
          (which dispatch() advances `state.current` to) doesn't flash here. */}
      <Animated.View pointerEvents="none" style={floatingAnimStyle}>
        <PieceShapeView piece={floatingPiece} cellSize={cellSize} />
      </Animated.View>

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
});
