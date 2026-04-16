import { forwardRef, memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { canPlace } from '@/src/lib/blockmatch/board';
import { highlightColorForPieceId } from '@/src/lib/blockmatch/colors';
import { BOARD_SIZE, type ActivePiece, type Cell } from '@/src/lib/blockmatch/types';

import { BlockmatchCell } from './Cell';
import { shapeFor } from './PieceShape';

export type GhostPlacement = {
  piece: ActivePiece;
  row: number;
  col: number;
} | null;

export type BoardTransition = 'idle' | 'clearing' | 'spawning';

const ROW_STAGGER_MS = 55;
const ROW_FADE_MS = 220;

export const Board = forwardRef<
  View,
  {
    board: Cell[];
    cellSize: number;
    ghost: GhostPlacement;
    transition: BoardTransition;
    onLayout?: (e: LayoutChangeEvent) => void;
  }
>(function Board({ board, cellSize, ghost, transition, onLayout }, ref) {
  // Per-row ghost bitmask: bit c is set when column c is a ghost cell in that row.
  // Numbers are primitive — BoardRow.memo can compare by value.
  const rowGhostMasks = useMemo(() => {
    const masks = new Array<number>(BOARD_SIZE).fill(0);
    if (ghost && transition === 'idle') {
      for (const [dr, dc] of shapeFor(ghost.piece)) {
        const r = ghost.row + dr;
        const c = ghost.col + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          masks[r] |= (1 << c);
        }
      }
    }
    return masks;
  }, [ghost, transition]);

  // Ghost color is the piece's own highlight tint when placement is valid; when
  // invalid (or no ghost), we pass undefined so cells skip the ghost overlay and
  // render their underlying state.
  const ghostColor = useMemo(() => {
    if (!ghost || transition !== 'idle') return undefined;
    if (!canPlace(board, ghost.piece, ghost.row, ghost.col)) return undefined;
    return highlightColorForPieceId(ghost.piece.defId);
  }, [ghost, transition, board]);

  // Pre-slice board rows so BoardRow receives a stable array reference that only
  // changes when the board state itself changes (not on every drag frame).
  const boardRows = useMemo(
    () => Array.from({ length: BOARD_SIZE }, (_, r) => board.slice(r * BOARD_SIZE, (r + 1) * BOARD_SIZE)),
    [board],
  );

  return (
    <View
      ref={ref as any}
      onLayout={onLayout}
      collapsable={false}
      style={[
        styles.board,
        {
          width: cellSize * BOARD_SIZE,
          height: cellSize * BOARD_SIZE,
        },
      ]}
    >
      {boardRows.map((cells, r) => (
        <BoardRow
          key={r}
          rowIdx={r}
          cells={cells}
          baseIdx={r * BOARD_SIZE}
          cellSize={cellSize}
          ghostMask={rowGhostMasks[r]}
          ghostColor={ghostColor}
          transition={transition}
        />
      ))}
    </View>
  );
});

const BoardRow = memo(function BoardRow({
  rowIdx,
  cells,
  baseIdx,
  cellSize,
  ghostMask,
  ghostColor,
  transition,
}: {
  rowIdx: number;
  cells: Cell[];
  baseIdx: number;
  cellSize: number;
  ghostMask: number;
  ghostColor: string | undefined;
  transition: BoardTransition;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (transition === 'clearing') {
      opacity.value = 1;
      opacity.value = withDelay(
        (BOARD_SIZE - 1 - rowIdx) * ROW_STAGGER_MS,
        withTiming(0, { duration: ROW_FADE_MS }),
      );
    } else if (transition === 'spawning') {
      opacity.value = 0;
      opacity.value = withDelay(
        rowIdx * ROW_STAGGER_MS,
        withTiming(1, { duration: ROW_FADE_MS }),
      );
    } else {
      opacity.value = withTiming(1, { duration: 80 });
    }
  }, [transition, rowIdx, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.row, animStyle]}>
      {cells.map((cell, c) => (
        <BlockmatchCell
          key={c}
          cell={cell}
          size={cellSize}
          ghost={!!(ghostMask & (1 << c))}
          ghostColor={ghostColor}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.md,
  },
  row: {
    flexDirection: 'row',
  },
});
