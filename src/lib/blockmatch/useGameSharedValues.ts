import { useRef } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { bevelColorsForPieceId } from './colors';
import { getPiece } from './pieces';
import type { ActivePiece, Cell, GameState } from './types';
import type { BoardCellVisual, PieceVisual } from '@/src/components/blockmatch/skia-drawers';

/**
 * One-way mirror from the Zustand game state into Reanimated shared values so
 * the Skia renderer (GameSurface + imperative drawers) can consume everything
 * from worklets without going through React reconciliation.
 *
 * The renderer reads ONLY these shared values. React re-renders of the screen
 * component do not produce any visible change on the Canvas — only shared
 * value writes do.
 */

// ---------------------------------------------------------------------------
// Shared value bundle
// ---------------------------------------------------------------------------

export type FloatingState = {
  /** True while the drag is in flight AND the overlay should paint. */
  visible: boolean;
  /** Piece being dragged (pre-resolved visual). Null when not dragging. */
  piece: PieceVisual | null;
};

export type GhostState = {
  visible: boolean;
  row: number;
  col: number;
  /** The current piece's visual — ghost is just this piece at translucency. */
  piece: PieceVisual;
};

export type FloatingPos = {
  /** Finger absolute screen coordinate (pass through from Gesture `absoluteX`). */
  absX: number;
  absY: number;
};

export type GameSharedValues = {
  boardSV: SharedValue<BoardCellVisual[]>;
  currentSV: SharedValue<PieceVisual>;
  nextSV: SharedValue<[PieceVisual, PieceVisual]>;
  floatingSV: SharedValue<FloatingState>;
  floatingPos: SharedValue<FloatingPos>;
  ghostSV: SharedValue<GhostState>;
  isDragging: SharedValue<boolean>;
};

// ---------------------------------------------------------------------------
// State → visual conversion
// ---------------------------------------------------------------------------

export function pieceVisualFrom(piece: ActivePiece): PieceVisual {
  const def = getPiece(piece.defId);
  const shape = def.rotations[piece.rotationIdx % def.rotations.length];
  let maxR = 0;
  let maxC = 0;
  for (let i = 0; i < shape.length; i++) {
    const [r, c] = shape[i];
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  return {
    shape,
    colors: bevelColorsForPieceId(piece.defId),
    rows: maxR + 1,
    cols: maxC + 1,
  };
}

function cellVisualFrom(cell: Cell): BoardCellVisual {
  if (cell.kind === 'block') {
    return { kind: 'block', colors: bevelColorsForPieceId(cell.pieceId) };
  }
  if (cell.kind === 'obstacle') {
    return { kind: 'obstacle', obstacleId: cell.obstacle.id, hp: cell.obstacle.hp };
  }
  return { kind: 'empty' };
}

function boardVisualFrom(board: Cell[]): BoardCellVisual[] {
  const out = new Array<BoardCellVisual>(board.length);
  for (let i = 0; i < board.length; i++) out[i] = cellVisualFrom(board[i]);
  return out;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameSharedValues(state: GameState): GameSharedValues {
  // Initial values are computed synchronously from the passed state so the
  // first render of the Canvas already has correct visuals. All subsequent
  // updates flow through the useEffect below.
  const initialCurrent = pieceVisualFrom(state.current);

  const boardSV = useSharedValue<BoardCellVisual[]>(boardVisualFrom(state.board));
  const currentSV = useSharedValue<PieceVisual>(initialCurrent);
  const nextSV = useSharedValue<[PieceVisual, PieceVisual]>([
    pieceVisualFrom(state.next[0]),
    pieceVisualFrom(state.next[1]),
  ]);
  const floatingSV = useSharedValue<FloatingState>({ visible: false, piece: null });
  const floatingPos = useSharedValue<FloatingPos>({ absX: 0, absY: 0 });
  const ghostSV = useSharedValue<GhostState>({
    visible: false,
    row: 0,
    col: 0,
    piece: initialCurrent,
  });
  const isDragging = useSharedValue(false);

  // Mirror game state into shared values DURING render so the Skia Canvas and
  // the gesture layer always agree on the current piece. The previous useEffect
  // approach caused a 1-frame lag: after a state change (e.g. hydration in
  // start(), or piece placement) the React closure saw the new piece while SVs
  // still held the old one — making the tray show one shape and the floating
  // drag preview show another.
  //
  // Writing to Reanimated SVs is an external-store side-effect (like updating a
  // ref), NOT a React state mutation, so it is safe to do during render.  The
  // ref guard ensures we only write when state actually changes.
  const prevStateRef = useRef(state);
  if (state !== prevStateRef.current) {
    prevStateRef.current = state;
    boardSV.value = boardVisualFrom(state.board);
    const curr = pieceVisualFrom(state.current);
    currentSV.value = curr;
    nextSV.value = [pieceVisualFrom(state.next[0]), pieceVisualFrom(state.next[1])];
    // Ghost piece always tracks the current piece — keep it in sync so a
    // rotate-then-drag cycle paints the right shape without a stutter.
    ghostSV.value = { ...ghostSV.value, piece: curr };
  }

  return {
    boardSV,
    currentSV,
    nextSV,
    floatingSV,
    floatingPos,
    ghostSV,
    isDragging,
  };
}
