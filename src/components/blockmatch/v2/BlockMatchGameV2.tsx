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

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { shapeOf } from '@/src/lib/blockmatch/board';
import { BOARD_SIZE } from '@/src/lib/blockmatch/types';
import { useBlockMatch } from '@/src/store/blockmatch';

import { BoardCanvasV2 } from './canvas/BoardCanvasV2';
import type { EntityManager } from './engine/entityManager';
import { DragPieceOverlay } from './canvas/DragPieceOverlay';
import { DUR_LINE_CLEAR, DUR_RAINBOW_STAGGER_TOTAL, DUR_ROTATE } from './engine/constants';
import { HapticService } from './feedback/haptic';
import { SoundService } from './feedback/sound';
import { useBoardGestures, type TrayRect } from './gesture/useBoardGestures';
import { ComboBadgeV2 } from './overlays/ComboBadgeV2';
import { RainbowStaggerV2 } from './overlays/RainbowStaggerV2';
import { StageClearBanner } from './overlays/StageClearBanner';
import { ScorePanelV2 } from './ScorePanelV2';
import { PieceTrayV2 } from './tray/PieceTrayV2';

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

const CLEAR_PHASE_MS = DUR_RAINBOW_STAGGER_TOTAL; // 1200ms — matches rainbow total
const BANNER_PHASE_MS = 900;
const SPAWN_PHASE_MS = 800;

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
  const [rainbowActive, setRainbowActive] = useState(false);
  const [bannerStage, setBannerStage] = useState(1);

  useEffect(() => {
    if (!lastTurn?.stageCleared) return;
    setBannerStage(state.stage); // capture before commitStage increments it
    setTransition('clearing');
    setRainbowActive(true);
    const t1 = setTimeout(() => {
      setRainbowActive(false);
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
  // Current piece slot is a 5×5-cell square filling the tray's usable height.
  const trayCellSize = Math.floor((trayHeight - TRAY_V_PADDING) / 5);
  // Next pieces stack 2 in the same usable height, so each is ~half as tall.
  const NEXT_GAP_PX = 6;
  const trayNextCellSize = Math.floor(
    ((trayHeight - TRAY_V_PADDING - NEXT_GAP_PX) / 2) / 5,
  );

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
  const handleOnManager = useCallback((m: EntityManager) => {
    managerRef.current = m;
  }, []);

  const handlePlace = useCallback(
    (row: number, col: number) => {
      if (transition !== 'idle') return;
      // Optimistically spawn board blocks immediately so they appear at the
      // same frame the drag piece disappears, eliminating the blink gap.
      managerRef.current?.optimisticPlace(row, col, state.current.defId, shapeOf(state.current));
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
  const { gesture, ghost, drag, isDragging } = useBoardGestures({
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

  const boardW = BOARD_SIZE * cellSize;
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
            <BoardCanvasV2 state={state} cellSize={cellSize} ghost={ghost} onManager={handleOnManager} />
            <RainbowStaggerV2
              active={rainbowActive}
              boardWidth={boardW}
              boardHeight={boardH}
            />
            <StageClearBanner
              active={transition === 'banner'}
              stage={bannerStage}
              boardWidth={boardW}
              boardHeight={boardH}
            />
          </View>

          <View
            ref={trayRef}
            onLayout={onTrayLayout}
            style={[styles.trayWrap, { height: trayHeight }]}
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
      <ComboBadgeV2 combo={state.combo} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trayWrap: {
    width: '100%',
  },
});
