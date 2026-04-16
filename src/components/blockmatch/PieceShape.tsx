import { memo } from 'react';
import { View } from 'react-native';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import { getPiece } from '@/src/lib/blockmatch/pieces';
import type { ActivePiece, PieceShape as Shape } from '@/src/lib/blockmatch/types';

import { BeveledBlock } from './BeveledBlock';

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
  bevelFraction,
}: {
  piece: ActivePiece;
  cellSize: number;
  /** Override the per-piece palette color. Falls back to `colorForPieceId`. */
  color?: string;
  opacity?: number;
  /** Pass-through to BeveledBlock — ghost preview uses 0.20, default 0.18. */
  bevelFraction?: number;
}) {
  const shape = shapeFor(piece);
  const { rows, cols } = shapeBounds(shape);
  const resolvedColor = color ?? colorForPieceId(piece.defId);
  const blockSize = cellSize - 2;
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
          style={{
            position: 'absolute',
            top: r * cellSize + 1,
            left: c * cellSize + 1,
          }}
        >
          <BeveledBlock size={blockSize} color={resolvedColor} bevelFraction={bevelFraction} />
        </View>
      ))}
    </View>
  );
});
