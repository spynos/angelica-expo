import {
  Skia,
  type SkCanvas,
  TileMode,
} from '@shopify/react-native-skia';

import type { BevelColors } from '@/src/lib/blockmatch/colors';
import type { ObstacleId, PieceShape } from '@/src/lib/blockmatch/types';

/**
 * Imperative Skia drawing primitives for the blockmatch game. All functions
 * are `'worklet'` and write directly into a caller-provided `SkCanvas` —
 * typically one opened by `Skia.PictureRecorder().beginRecording()` inside a
 * Reanimated `useDerivedValue` (see GameSurface.tsx).
 *
 * This file is the single place that encodes the beveled-block paint algorithm.
 * It mirrors the Flutter `beveled_block.dart` reference (penta_block_blast)
 * and replaces the previous declarative `<Path>`/`<Rect>` component tree so
 * that visual updates are produced by a worklet recomputing one Picture,
 * bypassing React reconciliation entirely.
 */

// ---------------------------------------------------------------------------
// Types shared with the React / shared-value layer
// ---------------------------------------------------------------------------

/** Visual description of one board cell, pre-resolved for the renderer. */
export type BoardCellVisual =
  | { kind: 'empty' }
  | { kind: 'block'; colors: BevelColors }
  | { kind: 'obstacle'; obstacleId: ObstacleId; hp: number };

/** Visual description of a piece (tray / ghost / floating). */
export type PieceVisual = {
  shape: PieceShape;
  colors: BevelColors;
  cols: number;
  rows: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_BEVEL_FRACTION = 0.18;
/** Ghost uses a slightly wider bevel for a softer look; matches penta. */
export const GHOST_BEVEL_FRACTION = 0.2;

const HIGHLIGHT_HEX_0 = '#FFF6DFB0'; // α ≈ 0.690
const HIGHLIGHT_HEX_1 = '#FFF6DF74'; // α ≈ 0.455 (= 0.69 × 0.658)
const HIGHLIGHT_HEX_2 = '#FFF6DF23'; // α ≈ 0.137 (= 0.69 × 0.200)

const STRIPE_COLOR = 'rgba(255,255,255,0.6)';
const DOT_COLOR = 'rgba(255,255,255,0.85)';

// Obstacle palette. Kept as constants (not SV-synced) because it never changes.
const OBSTACLE_COLOR: Record<ObstacleId, string> = {
  basic: '#5A554D',
  horiz: '#C8773A',
  vert: '#5C4A8F',
  durable2: '#A05E28',
  composite: '#3D3B38',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a filled paint for a color. Worklet-safe; allocates a fresh paint
 * per call. Caller is responsible for not mutating the returned object after
 * passing it to `drawPath` / `drawRect`.
 */
function fillPaint(color: string, alpha: number = 1) {
  'worklet';
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  if (alpha < 1) paint.setAlphaf(alpha);
  return paint;
}

/**
 * Top-left highlight gradient paint. The gradient runs from (start) to (end)
 * in the same coordinate space the caller will draw the highlight polygon in
 * — so the caller must pass the block's absolute `x` / `y` / `s`.
 */
function highlightPaint(x: number, y: number, s: number, alpha: number) {
  'worklet';
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  const shader = Skia.Shader.MakeLinearGradient(
    { x: x + s * 0.481, y: y },
    { x: x + s * 0.517, y: y + s * 0.777 },
    [
      Skia.Color(HIGHLIGHT_HEX_0),
      Skia.Color(HIGHLIGHT_HEX_1),
      Skia.Color(HIGHLIGHT_HEX_2),
    ],
    [0.37, 0.688, 1],
    TileMode.Clamp,
  );
  paint.setShader(shader);
  if (alpha < 1) paint.setAlphaf(alpha);
  return paint;
}

/** Build a closed polygon path from a list of (x, y) points. */
function polygonPath(points: readonly [number, number][]) {
  'worklet';
  const path = Skia.Path.Make();
  for (let i = 0; i < points.length; i++) {
    const [px, py] = points[i];
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();
  return path;
}

// ---------------------------------------------------------------------------
// Block drawers
// ---------------------------------------------------------------------------

/**
 * Paint one beveled block into the canvas. Matches the penta reference:
 *   1. fill the full square with the base color (prevents seams)
 *   2. draw 4 trapezoid faces (top / left / right / bottom)
 *   3. fill a center rect with the base color
 *   4. overlay the top-left highlight gradient across top trapezoid + upper
 *      half of center
 */
export function drawBeveledBlock(
  canvas: SkCanvas,
  x: number,
  y: number,
  size: number,
  colors: BevelColors,
  opacity: number,
  bevelFraction: number,
) {
  'worklet';
  if (size <= 0) return;
  const s = size;
  const b = Math.min(s * bevelFraction, s / 2);
  const inner = s - 2 * b;
  const midY = s / 2;

  // 1. base fill (full square)
  canvas.drawRect(
    { x: x, y: y, width: s, height: s },
    fillPaint(colors.base, opacity),
  );

  // 2. four trapezoid faces
  canvas.drawPath(
    polygonPath([
      [x, y],
      [x + s, y],
      [x + s - b, y + b],
      [x + b, y + b],
    ]),
    fillPaint(colors.top, opacity),
  );
  canvas.drawPath(
    polygonPath([
      [x, y],
      [x + b, y + b],
      [x + b, y + s - b],
      [x, y + s],
    ]),
    fillPaint(colors.left, opacity),
  );
  canvas.drawPath(
    polygonPath([
      [x + s, y],
      [x + s, y + s],
      [x + s - b, y + s - b],
      [x + s - b, y + b],
    ]),
    fillPaint(colors.right, opacity),
  );
  canvas.drawPath(
    polygonPath([
      [x, y + s],
      [x + s, y + s],
      [x + s - b, y + s - b],
      [x + b, y + s - b],
    ]),
    fillPaint(colors.bottom, opacity),
  );

  // 3. center rect
  canvas.drawRect(
    { x: x + b, y: y + b, width: inner, height: inner },
    fillPaint(colors.base, opacity),
  );

  // 4. top-left highlight (top trapezoid ∪ upper half of center)
  canvas.drawPath(
    polygonPath([
      [x, y],
      [x + s, y],
      [x + s - b, y + b],
      [x + s - b, y + midY],
      [x + b, y + midY],
      [x + b, y + b],
    ]),
    highlightPaint(x, y, s, opacity),
  );
}

/**
 * Paint all blocks of a piece at (offsetX, offsetY). Reproduces the 1 px
 * padding the previous PieceShapeView applied (each block is `cellSize − 2`
 * inside a `cellSize × cellSize` layout slot, offset by 1 px on top/left).
 */
export function drawPieceShape(
  canvas: SkCanvas,
  shape: PieceShape,
  offsetX: number,
  offsetY: number,
  cellSize: number,
  colors: BevelColors,
  opacity: number,
  bevelFraction: number,
) {
  'worklet';
  const blockSize = cellSize - 2;
  for (let i = 0; i < shape.length; i++) {
    const [r, c] = shape[i];
    drawBeveledBlock(
      canvas,
      offsetX + c * cellSize + 1,
      offsetY + r * cellSize + 1,
      blockSize,
      colors,
      opacity,
      bevelFraction,
    );
  }
}

// ---------------------------------------------------------------------------
// Board cell drawer (empty / block / obstacle)
// ---------------------------------------------------------------------------

/**
 * Paint one board cell. `size` is the outer cell dimension; the visible
 * content sits inside a 1 px inset (matches previous BlockmatchCell layout).
 */
export function drawBoardCell(
  canvas: SkCanvas,
  cell: BoardCellVisual,
  x: number,
  y: number,
  size: number,
  emptyTint: string,
) {
  'worklet';
  const inset = 1;
  const dim = size - 2;
  const innerX = x + inset;
  const innerY = y + inset;

  if (cell.kind === 'block') {
    drawBeveledBlock(canvas, innerX, innerY, dim, cell.colors, 1, DEFAULT_BEVEL_FRACTION);
    return;
  }

  if (cell.kind === 'obstacle') {
    const color = OBSTACLE_COLOR[cell.obstacleId];
    canvas.save();
    // Clip to rounded rect so stripe / dot overlays don't escape the cell
    // shape (previously handled by the wrapping View's border radius).
    const rrect = Skia.RRectXY(
      { x: innerX, y: innerY, width: dim, height: dim },
      6,
      6,
    );
    canvas.clipRRect(rrect, 0 /* ClipOp.Intersect */, true);
    canvas.drawRect(
      { x: innerX, y: innerY, width: dim, height: dim },
      fillPaint(color, 1),
    );
    if (cell.obstacleId === 'horiz') {
      canvas.drawRect(
        { x: innerX + 2, y: innerY + dim * 0.45 - 1, width: dim - 4, height: 2 },
        fillPaint(STRIPE_COLOR, 1),
      );
    } else if (cell.obstacleId === 'vert') {
      canvas.drawRect(
        { x: innerX + dim * 0.45 - 1, y: innerY + 2, width: 2, height: dim - 4 },
        fillPaint(STRIPE_COLOR, 1),
      );
    } else if (cell.obstacleId === 'durable2' && cell.hp > 0) {
      const cx = innerX + dim / 2;
      const cy = innerY + dim / 2;
      const r = 2;
      const dotPaint = fillPaint(DOT_COLOR, 1);
      if (cell.hp <= 1) {
        canvas.drawCircle(cx, cy, r, dotPaint);
      } else {
        canvas.drawCircle(cx - 3, cy, r, dotPaint);
        canvas.drawCircle(cx + 3, cy, r, dotPaint);
      }
    }
    canvas.restore();
    return;
  }

  // empty — slightly darker tint makes the grid read against the board bg.
  canvas.drawRect(
    { x: innerX, y: innerY, width: dim, height: dim },
    fillPaint(emptyTint, 1),
  );
}

// ---------------------------------------------------------------------------
// Clear hint drawers (drag preview — highlights rows/cols that would clear)
// ---------------------------------------------------------------------------

/**
 * Given the current board state and the ghost snap position, returns which
 * rows and columns would be cleared if the piece were placed there.
 * Worklet-safe; no imports beyond captured closure values.
 */
/**
 * Simulate placing `shape` at (anchorRow, anchorCol) on the board and draw
 * semi-transparent strips over every row/column that would be cleared.
 * Detection and drawing are merged to avoid returning arrays from a worklet.
 */
export function drawClearHint(
  canvas: SkCanvas,
  cells: readonly BoardCellVisual[],
  shape: PieceShape,
  anchorRow: number,
  anchorCol: number,
  boardSize: number,
  boardLeft: number,
  boardTop: number,
  boardPixels: number,
  cellSize: number,
  color: string,
) {
  'worklet';
  // Build flat occupancy grid without array methods
  const total = boardSize * boardSize;
  const occ: number[] = [];
  for (let i = 0; i < total; i++) occ[i] = cells[i].kind !== 'empty' ? 1 : 0;

  // Simulate piece placement
  for (let i = 0; i < shape.length; i++) {
    const r = anchorRow + shape[i][0];
    const c = anchorCol + shape[i][1];
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) occ[r * boardSize + c] = 1;
  }

  const paint = Skia.Paint();
  paint.setAntiAlias(false);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(0.32);

  for (let r = 0; r < boardSize; r++) {
    let full = true;
    for (let c = 0; c < boardSize; c++) {
      if (!occ[r * boardSize + c]) { full = false; break; }
    }
    if (full) {
      canvas.drawRect(
        { x: boardLeft, y: boardTop + r * cellSize, width: boardPixels, height: cellSize },
        paint,
      );
    }
  }

  for (let c = 0; c < boardSize; c++) {
    let full = true;
    for (let r = 0; r < boardSize; r++) {
      if (!occ[r * boardSize + c]) { full = false; break; }
    }
    if (full) {
      canvas.drawRect(
        { x: boardLeft + c * cellSize, y: boardTop, width: cellSize, height: boardPixels },
        paint,
      );
    }
  }
}
