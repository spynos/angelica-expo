import { getPiece } from './pieces';
import {
  BOARD_CELLS,
  BOARD_SIZE,
  type ActivePiece,
  type Cell,
  type PieceShape,
} from './types';

export function makeEmptyBoard(): Cell[] {
  return new Array(BOARD_CELLS).fill(0).map(() => ({ kind: 'empty' as const }));
}

export function idx(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function shapeOf(piece: ActivePiece): PieceShape {
  const def = getPiece(piece.defId);
  return def.rotations[piece.rotationIdx % def.rotations.length];
}

export function canPlace(board: Cell[], piece: ActivePiece, row: number, col: number): boolean {
  const shape = shapeOf(piece);
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[idx(r, c)].kind !== 'empty') return false;
  }
  return true;
}

export function applyPlace(
  board: Cell[],
  piece: ActivePiece,
  row: number,
  col: number,
): Cell[] {
  const next = board.slice();
  for (const [dr, dc] of shapeOf(piece)) {
    next[idx(row + dr, col + dc)] = { kind: 'block', pieceId: piece.defId };
  }
  return next;
}

export function canPlaceAnywhere(board: Cell[], piece: ActivePiece): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (canPlace(board, piece, r, c)) return true;
    }
  }
  return false;
}
