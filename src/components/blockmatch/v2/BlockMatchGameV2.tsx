import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { shapeOf } from '@/src/lib/blockmatch/board';
import { BOARD_SIZE, type PieceShape } from '@/src/lib/blockmatch/types';
import { useBlockMatch } from '@/src/store/blockmatch';

import { BoardCanvasV2 } from './canvas/BoardCanvasV2';
import type { EntityManager } from './engine/entityManager';
import { DragPieceOverlay } from './canvas/DragPieceOverlay';
import { DUR_CURTAIN_CLOSE, DUR_CURTAIN_HOLD, DUR_CURTAIN_OPEN, DUR_LINE_CLEAR, DUR_LINE_CLEAR_POPUP, DUR_ROTATE } from './engine/constants';
import { HapticService } from './feedback/haptic';
import { SoundService } from './feedback/sound';
import { useBoardGestures, type TrayRect } from './gesture/useBoardGestures';
import { LineClearPopup } from './overlays/LineClearPopup';
import { StageCurtain } from './overlays/StageCurtain';
import { ScorePanelV2 } from './ScorePanelV2';
import { PieceTrayV2, TRAY_BOX_PADDING } from './tray/PieceTrayV2';

/**
 * Top-level integration component for the v2 blockmatch game.
 *
 * Owns:
 *   - Zustand subscription + stage transition timing
 *   - Responsive cell sizing
 *   - onLayout plumbing that feeds board / tray screen-space rects into
 *     the gesture worklet
 *   - Feedback (haptic + sound) on turn events
 *
 * Renders (top → bottom in the tree):
 *   - ScorePanelV2
 *   - Board Canvas (beveled blocks, obstacles, ghost)
 *   - Piece tray (current + next×2)
 *   - DragPieceOverlay (absolute, above everything)
 *   - ComboBadge + RainbowStagger overlays
 */

const CLEAR_PHASE_MS = DUR_CURTAIN_CLOSE;  // panels slide to center
const BANNER_PHASE_MS = DUR_CURTAIN_HOLD;  // text hold, commitStage fires here
const SPAWN_PHASE_MS = DUR_CURTAIN_OPEN;   // panels slide back out

type ScreenTransition = 'idle' | 'clearing' | 'banner' | 'spawning';

export function BlockMatchGameV2() {
  const palette = Colors[(useColorScheme() ?? 'light') as 'light' | 'dark'];
  const start = useBlockMatch((s) => s.start);
  const finalize = useBlockMatch((s) => s.finalize);
  const dispatch = useBlockMatch((s) => s.dispatch);
  const state = useBlockMatch((s) => s.state);
  const lastTurn = useBlockMatch((s) => s.lastTurn);

  useEffect(() => {
    start();
    return () => finalize();
  }, [start, finalize]);

  // --- Stage transition (clearing → banner → spawning → idle) ---------
  const [transition, setTransition] = useState<ScreenTransition>('idle');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [bannerStage, setBannerStage] = useState(1);

  useEffect(() => {
    if (!lastTurn?.stageCleared) return;
    setBannerStage(state.stage); // capture before commitStage increments it

    // When lines were cleared this turn, wait for the LineClearPopup animation
    // to finish before starting the curtain so the transition feels unhurried.
    const preDelay = lastTurn.linesCleared > 0 ? DUR_LINE_CLEAR_POPUP : 0;

    const t0 = setTimeout(() => {
      setTransition('clearing');
      const t1 = setTimeout(() => {
        setTransition('banner');
        const t2 = setTimeout(() => {
          dispatch({ type: 'commitStage' });
          setTransition('spawning');
          const t3 = setTimeout(() => {
            setTransition('idle');
          }, SPAWN_PHASE_MS);
          timersRef.current.push(t3);
        }, BANNER_PHASE_MS);
        timersRef.current.push(t2);
      }, CLEAR_PHASE_MS);
      timersRef.current.push(t1);
    }, preDelay);
    timersRef.current.push(t0);
  }, [lastTurn, dispatch, state.stage]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, []);

  // --- Turn-level feedback -------------------------------------------
  useEffect(() => {
    if (!lastTurn) return;
    if (lastTurn.scoreGained > 0) {
      HapticService.place();
      SoundService.playSnap();
    }
    if (lastTurn.linesCleared > 0) {
      HapticService.lineClear();
      SoundService.playLineClear(lastTurn.linesCleared);
    }
    if (lastTurn.obstaclesDestroyed > 0) {
      HapticService.obstacleDestroyed();
    }
    if (lastTurn.stageCleared) {
      HapticService.stageClear();
    }
  }, [lastTurn]);

  useEffect(() => {
    if (state.isOver) HapticService.gameOver();
  }, [state.isOver]);

  useEffect(() => {
    if (state.combo > 1) {
      HapticService.combo();
      SoundService.playCombo(state.combo);
    }
  }, [state.combo]);

  // --- Layout ---------------------------------------------------------
  // Strategy: the tray area is sized *first* and the block sizes inside
  // adapt to it. This keeps the board position locked — when a smaller
  // piece or a narrower rotation appears, nothing shifts around.
  const screen = Dimensions.get('window');
  const cellSize = useMemo(() => {
    const side = Math.min(screen.width - 24, screen.height * 0.5);
    return Math.floor(side / BOARD_SIZE);
  }, [screen.width, screen.height]);

  // Fixed-height pointer/tray region. Screen-relative so small phones
  // still get a usable tray; capped so large screens don't over-scale.
  const trayHeight = Math.min(220, Math.max(160, screen.height * 0.24));
  const TRAY_V_PADDING = 24;
  const NEXT_INNER_GAP_PX = 8; // matches PieceTrayV2 nextBox gap
  // Each chip card has TRAY_BOX_PADDING of internal padding on all sides, so
  // the piece canvas must shrink to leave room for that padding inside both
  // the tray-height budget and the board-width budget.
  const BOX_PAD_H = 2 * TRAY_BOX_PADDING;
  // Height-first cell sizing: current slot is a 5×5 square filling the tray
  // height minus the box's own vertical padding; each next slot is ~half as tall.
  const trayCellByHeight = Math.floor(
    (trayHeight - TRAY_V_PADDING - BOX_PAD_H) / 5,
  );
  const trayNextCellByHeight = Math.floor(
    (trayHeight - TRAY_V_PADDING - BOX_PAD_H) / 2 / 5,
  );
  // Width cap: current (5 cells + box padding) + next-pair (10 cells + inner
  // gap + box padding) must fit inside the board width so the tray's outer
  // edges line up with the board.
  const boardW = BOARD_SIZE * cellSize;
  const naturalTrayWidth =
    5 * trayCellByHeight +
    10 * trayNextCellByHeight +
    NEXT_INNER_GAP_PX +
    2 * BOX_PAD_H;
  const trayScale =
    naturalTrayWidth > boardW ? boardW / naturalTrayWidth : 1;
  const trayCellSize = Math.floor(trayCellByHeight * trayScale);
  const trayNextCellSize = Math.floor(trayNextCellByHeight * trayScale);

  // --- Current-piece rotation animation ---------------------------------
  // `turns` is shared with PieceTrayV2 (for the preview slot) and
  // DragPieceOverlay (so bevel direction is consistent at pickup).
  const turns = useSharedValue(state.current.rotationIdx * 0.25);
  const prevRotRef = useRef({ defId: state.current.defId, idx: state.current.rotationIdx });
  useEffect(() => {
    const { defId, rotationIdx } = state.current;
    if (defId !== prevRotRef.current.defId) {
      turns.value = rotationIdx * 0.25;
      prevRotRef.current = { defId, idx: rotationIdx };
      return;
    }
    if (rotationIdx !== prevRotRef.current.idx) {
      turns.value = withTiming(rotationIdx * 0.25, {
        duration: DUR_ROTATE,
        easing: Easing.out(Easing.cubic),
      });
      prevRotRef.current.idx = rotationIdx;
    }
  }, [state.current.defId, state.current.rotationIdx, turns]);

  const boardOriginX = useSharedValue(0);
  const boardOriginY = useSharedValue(0);
  const trayRect = useSharedValue<TrayRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const boardRef = useRef<View>(null);
  const trayRef = useRef<View>(null);

  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y) => {
      boardOriginX.value = x;
      boardOriginY.value = y;
    });
  }, [boardOriginX, boardOriginY]);

  const measureTray = useCallback(() => {
    trayRef.current?.measureInWindow((x, y, w, h) => {
      trayRect.value = { x, y, width: w, height: h };
    });
  }, [trayRect]);

  const onBoardLayout = useCallback((_e: LayoutChangeEvent) => measureBoard(), [measureBoard]);
  const onTrayLayout = useCallback((_e: LayoutChangeEvent) => measureTray(), [measureTray]);

  // --- Dispatch wrappers ---------------------------------------------
  const managerRef = useRef<EntityManager | null>(null);
  const lastPlacedCentroidColRef = useRef<number | null>(null);

  const handleOnManager = useCallback((m: EntityManager) => {
    managerRef.current = m;
  }, []);

  const handlePlace = useCallback(
    (row: number, col: number) => {
      if (transition !== 'idle') return;
      const shape: PieceShape = shapeOf(state.current);
      // Compute piece centroid column for popup positioning
      const centroidDc = shape.reduce((sum, [, dc]) => sum + dc, 0) / shape.length;
      lastPlacedCentroidColRef.current = col + centroidDc;
      managerRef.current?.optimisticPlace(row, col, state.current.defId, shape);
      dispatch({ type: 'place', row, col });
    },
    [dispatch, state.current, transition],
  );
  const handleRotate = useCallback(() => {
    if (transition !== 'idle') return;
    HapticService.selection();
    SoundService.playRotate();
    dispatch({ type: 'rotate' });
  }, [dispatch, transition]);

  const inputEnabled = transition === 'idle' && !state.isOver;

  // --- Gestures & entities -------------------------------------------
  const { gesture, ghost, drag, isDragging, boardBits } = useBoardGestures({
    state,
    cellSize,
    boardCols: BOARD_SIZE,
    boardRows: BOARD_SIZE,
    boardOriginX,
    boardOriginY,
    trayRect,
    onPlace: handlePlace,
    onRotate: handleRotate,
    inputEnabled,
  });

  // Fade the landed ghost in sync with the line-clear entity animation so it
  // doesn't blink out separately after the board blocks have already cleared.
  useEffect(() => {
    if (lastTurn && lastTurn.linesCleared > 0) {
      ghost.clearingOpacity.value = withTiming(0, { duration: DUR_LINE_CLEAR });
    }
  }, [lastTurn, ghost]);

  const boardH = BOARD_SIZE * cellSize;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: palette.background }]}
      edges={['top']}
    >
      <ScorePanelV2
        score={state.score}
        highScore={state.highScore}
        stage={state.stage}
        combo={state.combo}
      />

      <GestureDetector gesture={gesture}>
        <View style={styles.playArea}>
          <View
            ref={boardRef}
            onLayout={onBoardLayout}
            style={[styles.boardWrap, { width: boardW, height: boardH }]}
            collapsable={false}
          >
            <BoardCanvasV2
              state={state}
              cellSize={cellSize}
              ghost={ghost}
              boardBits={boardBits}
              onManager={handleOnManager}
            />
            <StageCurtain
              phase={transition}
              clearedStage={bannerStage}
              boardWidth={boardW}
              boardHeight={boardH}
            />
            <LineClearPopup
              lastTurn={lastTurn}
              combo={state.combo}
              placedCentroidCol={lastPlacedCentroidColRef.current}
              cellSize={cellSize}
              boardWidth={boardW}
              boardHeight={boardH}
            />
          </View>

          <View
            ref={trayRef}
            onLayout={onTrayLayout}
            style={[styles.trayWrap, { width: boardW, height: trayHeight }]}
            collapsable={false}
          >
            <PieceTrayV2
              state={state}
              currentCellSize={trayCellSize}
              nextCellSize={trayNextCellSize}
              isDragging={isDragging}
              turns={turns}
            />
          </View>
        </View>
      </GestureDetector>

      <DragPieceOverlay entity={drag} cellSize={cellSize} turns={turns} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  playArea: {
    flex: 1,
    alignItems: 'center',
    // Uniform vertical rhythm: score↔board gap comes from the score panel's
    // own paddingBottom (Spacing.md); board↔tray gap matches it via `gap`.
    gap: Spacing.md,
  },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trayWrap: {
    alignSelf: 'center',
  },
});
