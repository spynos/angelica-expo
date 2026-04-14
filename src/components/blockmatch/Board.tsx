import { forwardRef, useEffect } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { canPlace, idx } from '@/src/lib/blockmatch/board';
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
  const ghostCells = new Set<number>();
  let ghostInvalid = false;
  if (ghost && transition === 'idle') {
    if (!canPlace(board, ghost.piece, ghost.row, ghost.col)) ghostInvalid = true;
    for (const [dr, dc] of shapeFor(ghost.piece)) {
      const r = ghost.row + dr;
      const c = ghost.col + dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        ghostCells.add(idx(r, c));
      }
    }
  }

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
      {Array.from({ length: BOARD_SIZE }, (_, r) => (
        <BoardRow
          key={r}
          rowIdx={r}
          cells={board.slice(r * BOARD_SIZE, (r + 1) * BOARD_SIZE)}
          baseIdx={r * BOARD_SIZE}
          cellSize={cellSize}
          ghostCells={ghostCells}
          ghostInvalid={ghostInvalid}
          transition={transition}
        />
      ))}
    </View>
  );
});

function BoardRow({
  rowIdx,
  cells,
  baseIdx,
  cellSize,
  ghostCells,
  ghostInvalid,
  transition,
}: {
  rowIdx: number;
  cells: Cell[];
  baseIdx: number;
  cellSize: number;
  ghostCells: Set<number>;
  ghostInvalid: boolean;
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
          ghost={ghostCells.has(baseIdx + c)}
          invalidGhost={ghostInvalid}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.md,
  },
  row: {
    flexDirection: 'row',
  },
});
