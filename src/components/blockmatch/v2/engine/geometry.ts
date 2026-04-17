import type { BoardGeometry, CellPos } from './types';

/**
 * Cell ↔ pixel conversion utilities.
 *
 * All functions are worklet-safe: pure math on primitive inputs, no closures
 * over React state or module-level mutable data. They can be called both
 * from React components and from `'worklet'` gesture callbacks.
 */

/** Pixel x of the left edge of a cell column. */
export function cellToPxX(col: number, g: BoardGeometry): number {
  'worklet';
  return g.originX + col * g.cellSize;
}

/** Pixel y of the top edge of a cell row. */
export function cellToPxY(row: number, g: BoardGeometry): number {
  'worklet';
  return g.originY + row * g.cellSize;
}

/**
 * Continuous (fractional) cell coordinate from pixel. Returns floats —
 * callers decide whether to floor for a discrete cell index or keep the
 * fractional form for snap-distance calculations.
 */
export function pxToCellX(x: number, g: BoardGeometry): number {
  'worklet';
  return (x - g.originX) / g.cellSize;
}

export function pxToCellY(y: number, g: BoardGeometry): number {
  'worklet';
  return (y - g.originY) / g.cellSize;
}

/** True if a cell position is inside the board. */
export function isInsideBoard(pos: CellPos, g: BoardGeometry): boolean {
  'worklet';
  return (
    pos.row >= 0 && pos.row < g.boardRows && pos.col >= 0 && pos.col < g.boardCols
  );
}

/** Clamp a cell coordinate to the board. */
export function clampCell(pos: CellPos, g: BoardGeometry): CellPos {
  'worklet';
  const row = Math.max(0, Math.min(g.boardRows - 1, pos.row));
  const col = Math.max(0, Math.min(g.boardCols - 1, pos.col));
  return { row, col };
}

/** Flat array index for a cell, matching src/lib/blockmatch/board.ts::idx. */
export function cellIndex(row: number, col: number, g: BoardGeometry): number {
  'worklet';
  return row * g.boardCols + col;
}
