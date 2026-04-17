import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, type SharedValue } from 'react-native-reanimated';

import { BOARD_SIZE } from '@/src/lib/blockmatch/types';

import type { GameLayout } from './GameSurface';
import { DRAG_LIFT_PX } from './GameSurface';
import type { GameSharedValues } from '@/src/lib/blockmatch/useGameSharedValues';

/**
 * Invisible RN View overlay that sits above the GameSurface Canvas and hosts
 * the gesture handlers. The Skia Canvas itself is a single native view so it
 * can't dispatch per-region gestures — we hit-test by layering a transparent
 * View at each interactive slot coordinate.
 *
 * The gesture handlers write directly into shared values (isDragging,
 * floatingSV, floatingPos, ghostSV) on the UI thread so the Skia renderer
 * picks up changes within the same frame. React state is untouched during
 * drag, eliminating the render-cycle lag that caused earlier flickers.
 */

export type GestureCallbacks = {
  /** Called via `runOnJS` after a successful drop. */
  onPlace: (row: number, col: number) => void;
  /** Called via `runOnJS` on a rotation tap. */
  onRotate: () => void;
  /** Pure JS predicate — `canPlace(board, current, row, col)`. */
  canPlaceAt: (row: number, col: number) => boolean;
};

export type GestureOverlayProps = {
  layout: GameLayout;
  sv: GameSharedValues;
  /** Canvas top-left in screen coordinates. Set by GameSurface via onLayout. */
  canvasOrigin: SharedValue<{ x: number; y: number }>;
  callbacks: GestureCallbacks;
  /** When false (e.g. stage transition in progress) gestures are inert. */
  enabled: boolean;
};

// Same values we used in the previous DraggablePiece — kept for parity.
const GHOST_GRACE_MS = 200;
const GHOST_STICKY_CELLS = 1.5;

export function GestureOverlay({
  layout,
  sv,
  canvasOrigin,
  callbacks,
  enabled,
}: GestureOverlayProps) {
  // Refs keep the latest closures available inside runOnJS callbacks without
  // recreating the gesture on every render.
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const lastGhostPosRef = useRef<{ row: number; col: number } | null>(null);
  const lastValidGhostRef = useRef<{ row: number; col: number } | null>(null);
  const dragStartedAtRef = useRef<number | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- JS-thread helpers (called via runOnJS) -------------------------------

  const seedFloatingOnStart = useCallback(() => {
    // Read from the same shared value the tray draws from so the floating
    // piece is guaranteed to match the visual the user just saw.
    const piece = sv.currentSV.value;
    sv.floatingSV.value = { visible: true, piece };
    // Reset ghost anchors for this new drag session.
    lastGhostPosRef.current = null;
    lastValidGhostRef.current = null;
    dragStartedAtRef.current = Date.now();
    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    graceTimerRef.current = setTimeout(() => {
      graceTimerRef.current = null;
      if (!sv.isDragging.value) return;
      const pos = sv.floatingPos.value;
      evaluateGhost(pos.absX, pos.absY);
    }, GHOST_GRACE_MS);
  }, [sv]);

  const evaluateGhost = useCallback(
    (absX: number, absY: number) => {
      const piece = sv.floatingSV.value.piece;
      if (!piece) return;
      const origin = canvasOrigin.value;
      const cellSize = layout.cellSize;
      const pieceW = piece.cols * cellSize;
      const pieceH = piece.rows * cellSize;
      // Same math as the floating piece's draw in GameSurface so ghost lines up.
      const floatingLeft = absX - origin.x - pieceW / 2;
      const floatingTop = absY - origin.y - pieceH - DRAG_LIFT_PX;
      const col = Math.round((floatingLeft - layout.boardLeft) / cellSize);
      const row = Math.round((floatingTop - layout.boardTop) / cellSize);

      // Out-of-bounds: hide ghost (respecting hysteresis below).
      const inBounds =
        row >= 0 && col >= 0 && row < 10 && col < 10;

      const last = lastGhostPosRef.current;
      if (last?.row === row && last?.col === col) return;
      lastGhostPosRef.current = { row, col };

      if (inBounds && callbacksRef.current.canPlaceAt(row, col)) {
        sv.ghostSV.value = { ...sv.ghostSV.value, visible: true, row, col };
        lastValidGhostRef.current = { row, col };
        return;
      }

      // Asymmetric hysteresis — keep ghost pinned to the last valid cell while
      // the finger's continuous grid position is within GHOST_STICKY_CELLS.
      const sticky = lastValidGhostRef.current;
      if (sticky) {
        const contCol = (floatingLeft - layout.boardLeft) / cellSize;
        const contRow = (floatingTop - layout.boardTop) / cellSize;
        const drift = Math.max(
          Math.abs(contRow - sticky.row),
          Math.abs(contCol - sticky.col),
        );
        if (drift < GHOST_STICKY_CELLS) return;
      }
      sv.ghostSV.value = { ...sv.ghostSV.value, visible: false };
      lastValidGhostRef.current = null;
    },
    [sv, canvasOrigin, layout],
  );

  const handleDrop = useCallback((row: number, col: number) => {
    if (!callbacksRef.current.canPlaceAt(row, col)) return;
    callbacksRef.current.onPlace(row, col);
  }, []);

  const finalizeDrag = useCallback(() => {
    sv.ghostSV.value = { ...sv.ghostSV.value, visible: false };
    lastGhostPosRef.current = null;
    lastValidGhostRef.current = null;
    dragStartedAtRef.current = null;
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, [sv]);

  // --- Gesture definitions --------------------------------------------------

  const pan = Gesture.Pan()
    .enabled(enabled)
    .minDistance(20)
    .onBegin((e) => {
      // Pre-seed position so the floating piece is ready if the gesture activates.
      sv.floatingPos.value = { absX: e.absoluteX, absY: e.absoluteY };
    })
    .onStart(() => {
      sv.isDragging.value = true;
      runOnJS(seedFloatingOnStart)();
    })
    .onUpdate((e) => {
      sv.floatingPos.value = { absX: e.absoluteX, absY: e.absoluteY };
      runOnJS(evaluateGhost)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      // Compute drop grid position on the UI thread while floatingSV.piece
      // is still set — onFinalize clears it, and the subsequent runOnJS
      // would read null if we deferred the calculation to the JS thread.
      const piece = sv.floatingSV.value.piece;
      if (!piece) return;
      const origin = canvasOrigin.value;
      const cellSize = layout.cellSize;
      const pieceW = piece.cols * cellSize;
      const pieceH = piece.rows * cellSize;
      const floatingLeft = e.absoluteX - origin.x - pieceW / 2;
      const floatingTop = e.absoluteY - origin.y - pieceH - DRAG_LIFT_PX;
      const col = Math.round((floatingLeft - layout.boardLeft) / cellSize);
      const row = Math.round((floatingTop - layout.boardTop) / cellSize);
      if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return;
      runOnJS(handleDrop)(row, col);
    })
    .onFinalize(() => {
      sv.isDragging.value = false;
      sv.floatingSV.value = { visible: false, piece: null };
      runOnJS(finalizeDrag)();
    });

  const tap = Gesture.Tap()
    .enabled(enabled)
    .maxDuration(200)
    .onEnd(() => {
      runOnJS(callbacksRef.current.onRotate)();
    });

  const composed = Gesture.Exclusive(pan, tap);

  return (
    <GestureDetector gesture={composed}>
      <View
        style={[
          styles.hitArea,
          {
            left: layout.currentSlotLeft,
            top: layout.currentSlotTop,
            width: layout.currentSlotSize,
            height: layout.currentSlotSize,
          },
        ]}
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
