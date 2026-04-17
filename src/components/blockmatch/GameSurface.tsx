import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { Palette, Radius, Spacing } from '@/constants/theme';
import { BOARD_SIZE, type GameState } from '@/src/lib/blockmatch/types';
import {
  useGameSharedValues,
  type GameSharedValues,
} from '@/src/lib/blockmatch/useGameSharedValues';

import { GestureOverlay, type GestureCallbacks } from './GestureOverlay';
import {
  DEFAULT_BEVEL_FRACTION,
  GHOST_BEVEL_FRACTION,
  drawBoardCell,
  drawClearHint,
  drawPieceShape,
  type PieceVisual,
} from './skia-drawers';

/**
 * Single-Canvas Skia renderer for the blockmatch play surface. This replaces
 * the previous declarative component tree (Board + PieceTray + GhostOverlay +
 * floating Animated.View) with one `<Canvas>` whose contents are generated
 * entirely on the UI thread by Reanimated `useDerivedValue` worklets —
 * React is no longer in the visual update path.
 *
 * Why: every multi-component declarative Skia update crossed a React commit /
 * reconciliation boundary, producing 1–2 frame lag that read as flicker
 * (drag start, placement, preview swap, etc.). A single Picture swap per
 * derived layer eliminates every such boundary and matches the rendering
 * model of the Flutter reference `penta_block_blast` (CustomPaint).
 *
 * Layout: coordinates are all canvas-local. The canvas height is computed
 * once per screen size so the recording rect and on-screen view agree.
 */

export type GameSurfaceProps = {
  state: GameState;
  /** Called after a successful drop with the grid coords the piece landed at. */
  onPlace: (row: number, col: number) => void;
  /** Called on a rotation tap of the current piece. */
  onRotate: () => void;
  /** canPlace(state.board, state.current, row, col) — lifted from the screen so
   *  the gesture layer can query it without reaching into the store. */
  canPlaceAt: (row: number, col: number) => boolean;
  /** True while a stage-clear / spawn animation is blocking input. */
  inputEnabled: boolean;
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export type GameLayout = ReturnType<typeof computeLayout>;

function computeLayout(screenWidth: number) {
  const horizontalPadding = Spacing.base;
  const cellSize = Math.floor((screenWidth - horizontalPadding * 2) / BOARD_SIZE);
  const boardSize = cellSize * BOARD_SIZE;
  const boardLeft = Math.round((screenWidth - boardSize) / 2);
  const boardTop = Spacing.sm;

  const traySlotGap = Spacing.sm;
  const trayPadding = Spacing.base;

  const previewSlotSize = Math.min(96, Math.max(60, Math.round(screenWidth * 0.2)));
  const availableForCurrent =
    screenWidth - horizontalPadding * 2 - previewSlotSize * 2 - traySlotGap - Spacing.base;
  const currentSlotSize = Math.max(120, Math.min(availableForCurrent, 220));

  const currentCellMax = Math.max(14, cellSize - 2);
  const previewCellMax = Math.max(10, Math.round(currentCellMax * 0.65));

  const trayTop = boardTop + boardSize + trayPadding;
  const currentSlotLeft = horizontalPadding;
  const currentSlotTop = trayTop;

  const previewsLeft = currentSlotLeft + currentSlotSize + Spacing.base;
  const preview0Left = previewsLeft;
  const preview1Left = preview0Left + previewSlotSize + traySlotGap;
  const previewsTop = trayTop + (currentSlotSize - previewSlotSize) / 2;

  const canvasHeight = trayTop + Math.max(currentSlotSize, previewSlotSize) + trayPadding;

  return {
    screenWidth,
    cellSize,
    boardSize,
    boardLeft,
    boardTop,
    currentSlotSize,
    currentSlotLeft,
    currentSlotTop,
    previewSlotSize,
    preview0Left,
    preview1Left,
    previewsTop,
    currentCellMax,
    previewCellMax,
    canvasWidth: screenWidth,
    canvasHeight,
    currentSlotPadding: Spacing.sm,
    previewSlotPadding: 4,
  };
}

// ---------------------------------------------------------------------------
// Static background Picture (computed once per layout)
// ---------------------------------------------------------------------------

function makeStaticPicture(layout: GameLayout): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording({
    x: 0,
    y: 0,
    width: layout.canvasWidth,
    height: layout.canvasHeight,
  });

  // Board bg with rounded corners
  const boardPaint = Skia.Paint();
  boardPaint.setAntiAlias(true);
  boardPaint.setColor(Skia.Color(Palette.boardWarm.background));
  canvas.drawRRect(
    Skia.RRectXY(
      {
        x: layout.boardLeft,
        y: layout.boardTop,
        width: layout.boardSize,
        height: layout.boardSize,
      },
      Radius.md,
      Radius.md,
    ),
    boardPaint,
  );

  // Tray slot backgrounds — rgba(0,0,0,0.04) with rounded corners.
  const slotPaint = Skia.Paint();
  slotPaint.setAntiAlias(true);
  slotPaint.setColor(Skia.Color('rgba(0,0,0,0.04)'));
  canvas.drawRRect(
    Skia.RRectXY(
      {
        x: layout.currentSlotLeft,
        y: layout.currentSlotTop,
        width: layout.currentSlotSize,
        height: layout.currentSlotSize,
      },
      Radius.lg,
      Radius.lg,
    ),
    slotPaint,
  );
  canvas.drawRRect(
    Skia.RRectXY(
      {
        x: layout.preview0Left,
        y: layout.previewsTop,
        width: layout.previewSlotSize,
        height: layout.previewSlotSize,
      },
      Radius.md,
      Radius.md,
    ),
    slotPaint,
  );
  canvas.drawRRect(
    Skia.RRectXY(
      {
        x: layout.preview1Left,
        y: layout.previewsTop,
        width: layout.previewSlotSize,
        height: layout.previewSlotSize,
      },
      Radius.md,
      Radius.md,
    ),
    slotPaint,
  );

  return recorder.finishRecordingAsPicture();
}

// ---------------------------------------------------------------------------
// GameSurface component
// ---------------------------------------------------------------------------

export function GameSurface({
  state,
  onPlace,
  onRotate,
  canPlaceAt,
  inputEnabled,
}: GameSurfaceProps) {
  const { width: screenWidth } = useWindowDimensions();
  const layout = useMemo(() => computeLayout(screenWidth), [screenWidth]);
  const sv = useGameSharedValues(state);

  // Canvas screen-space origin — gesture handler translates finger screen
  // coords into canvas-local for the floating piece & ghost math.
  const canvasOrigin = useSharedValue({ x: 0, y: 0 });
  const canvasRef = useRef<View>(null);
  const measureCanvas = useCallback(() => {
    canvasRef.current?.measureInWindow((x, y) => {
      canvasOrigin.value = { x, y };
    });
  }, [canvasOrigin]);
  const onCanvasLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      // Defer one frame so the native view has settled before measuring.
      requestAnimationFrame(measureCanvas);
    },
    [measureCanvas],
  );

  // ------------------------------------------------------------
  // Derived pictures — worklet-driven, React-free visual updates
  // ------------------------------------------------------------

  const staticPic = useMemo(() => makeStaticPicture(layout), [layout]);

  // Helper that opens a PictureRecorder with the canvas bounds. Kept as a
  // worklet-inline factory to avoid cross-worklet boundaries.
  const beginRecord = () => {
    'worklet';
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording({
      x: 0,
      y: 0,
      width: layout.canvasWidth,
      height: layout.canvasHeight,
    });
    return { recorder, canvas };
  };

  const boardPic = useDerivedValue<SkPicture>(() => {
    const { recorder, canvas } = beginRecord();
    const cells = sv.boardSV.value;
    for (let i = 0; i < cells.length; i++) {
      const r = Math.floor(i / BOARD_SIZE);
      const c = i % BOARD_SIZE;
      drawBoardCell(
        canvas,
        cells[i],
        layout.boardLeft + c * layout.cellSize,
        layout.boardTop + r * layout.cellSize,
        layout.cellSize,
        Palette.boardWarm.emptyTint,
      );
    }
    return recorder.finishRecordingAsPicture();
  });

  const clearHintPic = useDerivedValue<SkPicture>(() => {
    const { recorder, canvas } = beginRecord();
    const ghost = sv.ghostSV.value;
    if (!ghost.visible) return recorder.finishRecordingAsPicture();

    drawClearHint(
      canvas,
      sv.boardSV.value,
      ghost.piece.shape,
      ghost.row,
      ghost.col,
      BOARD_SIZE,
      layout.boardLeft,
      layout.boardTop,
      layout.boardSize,
      layout.cellSize,
      ghost.piece.colors.base,
    );

    return recorder.finishRecordingAsPicture();
  });

  const ghostPic = useDerivedValue<SkPicture>(() => {
    const { recorder, canvas } = beginRecord();
    const ghost = sv.ghostSV.value;
    // Visibility is encoded by whether we draw anything into the recorded
    // picture — an empty picture paints nothing, so we don't need a
    // conditional wrapper in JSX.
    if (ghost.visible) {
      drawPieceShape(
        canvas,
        ghost.piece.shape,
        layout.boardLeft + ghost.col * layout.cellSize,
        layout.boardTop + ghost.row * layout.cellSize,
        layout.cellSize,
        ghost.piece.colors,
        0.45,
        GHOST_BEVEL_FRACTION,
      );
    }
    return recorder.finishRecordingAsPicture();
  });

  const trayPic = useDerivedValue<SkPicture>(() => {
    const { recorder, canvas } = beginRecord();

    // Current piece — hidden while dragging so it doesn't double with the
    // floating overlay. `isDragging` is a UI-thread flag so the check is free.
    if (!sv.isDragging.value) {
      const curr = sv.currentSV.value;
      const cellSize = fitCellSize(
        curr.cols,
        curr.rows,
        layout.currentSlotSize,
        layout.currentSlotPadding,
        layout.currentCellMax,
      );
      const pieceW = curr.cols * cellSize;
      const pieceH = curr.rows * cellSize;
      const px = layout.currentSlotLeft + (layout.currentSlotSize - pieceW) / 2;
      const py = layout.currentSlotTop + (layout.currentSlotSize - pieceH) / 2;
      drawPieceShape(canvas, curr.shape, px, py, cellSize, curr.colors, 1, DEFAULT_BEVEL_FRACTION);
    }

    // Preview slots — opacity 0.65 to read as queued / waiting.
    const next = sv.nextSV.value;
    drawPreview(
      canvas,
      next[0],
      layout.preview0Left,
      layout.previewsTop,
      layout.previewSlotSize,
      layout.previewSlotPadding,
      layout.previewCellMax,
    );
    drawPreview(
      canvas,
      next[1],
      layout.preview1Left,
      layout.previewsTop,
      layout.previewSlotSize,
      layout.previewSlotPadding,
      layout.previewCellMax,
    );

    return recorder.finishRecordingAsPicture();
  });

  const floatingPic = useDerivedValue<SkPicture>(() => {
    const { recorder, canvas } = beginRecord();
    const f = sv.floatingSV.value;
    if (!f.visible || !f.piece) return recorder.finishRecordingAsPicture();
    const pos = sv.floatingPos.value;
    const origin = canvasOrigin.value;

    const p = f.piece;
    const cellSize = layout.cellSize;
    const pieceW = p.cols * cellSize;
    const pieceH = p.rows * cellSize;

    // Convert finger screen coords → canvas-local, then anchor the piece so
    // its horizontal center aligns with the finger and its bottom sits
    // `DRAG_LIFT_PX` above it (matches the previous DraggablePiece formula).
    const localX = pos.absX - origin.x - pieceW / 2;
    const localY = pos.absY - origin.y - pieceH - DRAG_LIFT_PX;
    drawPieceShape(canvas, p.shape, localX, localY, cellSize, p.colors, 1, DEFAULT_BEVEL_FRACTION);
    return recorder.finishRecordingAsPicture();
  });

  // ------------------------------------------------------------
  // Gesture callbacks bundled for GestureOverlay
  // ------------------------------------------------------------

  const gestureCallbacks = useMemo<GestureCallbacks>(
    () => ({
      onPlace,
      onRotate,
      canPlaceAt,
    }),
    [onPlace, onRotate, canPlaceAt],
  );

  return (
    <View
      ref={canvasRef}
      onLayout={onCanvasLayout}
      collapsable={false}
      style={[styles.surface, { height: layout.canvasHeight }]}
    >
      <Canvas style={{ width: layout.canvasWidth, height: layout.canvasHeight }}>
        <Picture picture={staticPic} />
        <Picture picture={boardPic} />
        <Picture picture={clearHintPic} />
        <Picture picture={ghostPic} />
        <Picture picture={trayPic} />
        <Picture picture={floatingPic} />
      </Canvas>
      <GestureOverlay
        layout={layout}
        sv={sv}
        canvasOrigin={canvasOrigin}
        callbacks={gestureCallbacks}
        enabled={inputEnabled}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pixels the floating drag piece rises above the finger. Matches the previous
 * `DRAG_LIFT_PX` constant in DraggablePiece.tsx so the grip feel is unchanged.
 */
export const DRAG_LIFT_PX = 180;

function fitCellSize(
  cols: number,
  rows: number,
  slotSide: number,
  padding: number,
  maxCell: number,
) {
  'worklet';
  const byW = (slotSide - padding * 2) / cols;
  const byH = (slotSide - padding * 2) / rows;
  return Math.max(8, Math.floor(Math.min(byW, byH, maxCell)));
}

// Alias for the opaque canvas handle returned by PictureRecorder.beginRecording.
type RecordingCanvas = ReturnType<ReturnType<typeof Skia.PictureRecorder>['beginRecording']>;

function drawPreview(
  canvas: RecordingCanvas,
  piece: PieceVisual,
  slotLeft: number,
  slotTop: number,
  slotSize: number,
  padding: number,
  maxCell: number,
) {
  'worklet';
  const cellSize = fitCellSize(piece.cols, piece.rows, slotSize, padding, maxCell);
  const pieceW = piece.cols * cellSize;
  const pieceH = piece.rows * cellSize;
  const px = slotLeft + (slotSize - pieceW) / 2;
  const py = slotTop + (slotSize - pieceH) / 2;
  drawPieceShape(canvas, piece.shape, px, py, cellSize, piece.colors, 0.65, DEFAULT_BEVEL_FRACTION);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  surface: {
    width: '100%',
  },
});

// Re-export for screen component
export type { GameSharedValues };
