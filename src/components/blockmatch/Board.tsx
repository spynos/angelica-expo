import { forwardRef, memo, useEffect } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Palette, Radius } from '@/constants/theme';
import { BOARD_SIZE, type Cell } from '@/src/lib/blockmatch/types';

import { BlockmatchCell } from './Cell';

export type BoardTransition = 'idle' | 'clearing' | 'spawning';

const ROW_STAGGER_MS = 55;
const ROW_FADE_MS = 220;

export const Board = forwardRef<
  View,
  {
    board: Cell[];
    cellSize: number;
    transition: BoardTransition;
    onLayout?: (e: LayoutChangeEvent) => void;
  }
>(function Board({ board, cellSize, transition, onLayout }, ref) {
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
          cellSize={cellSize}
          transition={transition}
        />
      ))}
    </View>
  );
});

const BoardRow = memo(function BoardRow({
  rowIdx,
  cells,
  cellSize,
  transition,
}: {
  rowIdx: number;
  cells: Cell[];
  cellSize: number;
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
        <BlockmatchCell key={c} cell={cell} size={cellSize} />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  board: {
    // Locked to a warm light tone so the play surface stays consistent across
    // light/dark color schemes. The grid effect comes from the contrast between
    // this lighter board bg and the slightly darker `emptyTint` painted inside
    // each empty cell — no explicit grid lines needed.
    backgroundColor: Palette.boardWarm.background,
    borderRadius: Radius.md,
  },
  row: {
    flexDirection: 'row',
  },
});
