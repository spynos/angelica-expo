import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import { getPiece } from '@/src/lib/blockmatch/pieces';
import type { ActivePiece, PieceShape as Shape } from '@/src/lib/blockmatch/types';

export function shapeFor(piece: ActivePiece): Shape {
  const def = getPiece(piece.defId);
  return def.rotations[piece.rotationIdx % def.rotations.length];
}

export function shapeBounds(shape: Shape): { rows: number; cols: number } {
  const maxR = Math.max(...shape.map(([r]) => r));
  const maxC = Math.max(...shape.map(([, c]) => c));
  return { rows: maxR + 1, cols: maxC + 1 };
}

// memo so parent re-renders during a drag (e.g. score updates) don't
// reconcile the floating piece or ghost overlay views.
export const PieceShapeView = memo(function PieceShapeView({
  piece,
  cellSize,
  color,
  opacity = 1,
}: {
  piece: ActivePiece;
  cellSize: number;
  /** Override the per-piece palette color. Falls back to `colorForPieceId`. */
  color?: string;
  opacity?: number;
}) {
  const shape = shapeFor(piece);
  const { rows, cols } = shapeBounds(shape);
  const resolvedColor = color ?? colorForPieceId(piece.defId);
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
              backgroundColor: resolvedColor,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
    borderRadius: Radius.sm,
  },
});
