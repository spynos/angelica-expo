import { useMemo } from 'react';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import { getPiece } from '@/src/lib/blockmatch/pieces';
import type { Offset } from '@/src/lib/blockmatch/types';

import { FlatBlockShape } from '../canvas/drawers';

/**
 * Renders a piece shape inside a fixed-size square container.
 *
 * Flat-paint era: with no bevel orientation to preserve, the entire piece
 * rotates as one rigid body around the container center. No per-cell
 * counter-rotation is needed.
 */

export function PiecePreview({
  defId,
  cellSize,
  slotCells = 5,
  turns,
  staticTurns,
}: {
  defId: string;
  cellSize: number;
  slotCells?: number;
  /** Animated rotation (used by the current slot, which animates via withTiming). */
  turns?: SharedValue<number>;
  /** Static rotation in turns (0..1). Use for preview slots that snap with no
   *  animation — avoids the JS→UI SharedValue propagation delay that would
   *  otherwise flash the piece at a stale rotation for one frame when defId
   *  changes. Exactly one of `turns` / `staticTurns` should be provided. */
  staticTurns?: number;
}) {
  const { shape0, fill } = useMemo(() => {
    const def = getPiece(defId);
    return {
      shape0: def.rotations[0],
      fill: colorForPieceId(defId),
    };
  }, [defId]);

  const containerCells = slotCells;
  const containerPx = containerCells * cellSize;

  const { offsetX, offsetY } = useMemo(() => {
    const rs = shape0.map(([r]) => r);
    const cs = shape0.map(([, c]) => c);
    const minR = Math.min(...rs);
    const minC = Math.min(...cs);
    const w = Math.max(...cs) - minC + 1;
    const h = Math.max(...rs) - minR + 1;
    return {
      offsetX: (containerCells - w) / 2 - minC,
      offsetY: (containerCells - h) / 2 - minR,
    };
  }, [shape0, containerCells]);

  const centerPx = containerPx / 2;

  const isStatic = turns === undefined;
  const staticT = staticTurns ?? 0;

  // Animated path: UI-thread derived values (used by the current slot).
  const outerTransformSV = useDerivedValue(() => {
    const t = turns ? turns.value : 0;
    return [
      { translateX: centerPx },
      { translateY: centerPx },
      { rotate: t * 2 * Math.PI },
      { translateX: -centerPx },
      { translateY: -centerPx },
    ];
  });

  // Static path: plain JS transforms. Computed inline so defId and rotation
  // are guaranteed to land in the same commit.
  const outerTransformStatic = [
    { translateX: centerPx },
    { translateY: centerPx },
    { rotate: staticT * 2 * Math.PI },
    { translateX: -centerPx },
    { translateY: -centerPx },
  ];

  const outerTransform = isStatic ? outerTransformStatic : outerTransformSV;

  return (
    <Canvas style={{ width: containerPx, height: containerPx }}>
      <Group transform={outerTransform}>
        {shape0.map(([r, c]: Offset, i: number) => (
          <Group
            key={i}
            transform={[
              { translateX: (offsetX + c) * cellSize },
              { translateY: (offsetY + r) * cellSize },
            ]}
          >
            <FlatBlockShape size={cellSize} fill={fill} />
          </Group>
        ))}
      </Group>
    </Canvas>
  );
}
