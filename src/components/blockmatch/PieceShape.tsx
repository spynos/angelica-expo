import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { getPiece } from '@/src/lib/blockmatch/pieces';
import type { ActivePiece, PieceShape as Shape } from '@/src/lib/blockmatch/types';

import { PLAYER_BLOCK_COLOR } from './Cell';

export function shapeFor(piece: ActivePiece): Shape {
  const def = getPiece(piece.defId);
  return def.rotations[piece.rotationIdx % def.rotations.length];
}

export function shapeBounds(shape: Shape): { rows: number; cols: number } {
  const maxR = Math.max(...shape.map(([r]) => r));
  const maxC = Math.max(...shape.map(([, c]) => c));
  return { rows: maxR + 1, cols: maxC + 1 };
}

export function PieceShapeView({
  piece,
  cellSize,
  color = PLAYER_BLOCK_COLOR,
  opacity = 1,
}: {
  piece: ActivePiece;
  cellSize: number;
  color?: string;
  opacity?: number;
}) {
  const shape = shapeFor(piece);
  const { rows, cols } = shapeBounds(shape);
  return (
    <View
      style={{
        width: cols * cellSize,
        height: rows * cellSize,
        opacity,
      }}
    >
      {shape.map(([r, c], i) => (
        <View
          key={i}
          style={[
            styles.cell,
            {
              width: cellSize - 2,
              height: cellSize - 2,
              top: r * cellSize + 1,
              left: c * cellSize + 1,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
    borderRadius: Radius.sm,
  },
});
