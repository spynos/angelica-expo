import { useMemo } from 'react';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { bevelColorsForPieceId } from '@/src/lib/blockmatch/colors';
import { getPiece } from '@/src/lib/blockmatch/pieces';
import type { Offset } from '@/src/lib/blockmatch/types';

import { DEFAULT_BEVEL_FRACTION } from '../engine/constants';
import { BeveledBlockShape } from '../canvas/drawers';

/**
 * Renders a piece shape inside a fixed-size square container.
 *
 * Rotation model — rigid orbit + upright bevel:
 *
 *   1. Outer `<Group transform>` rotates all cells around the container
 *      center so the piece turns as one solid unit (no "blocks rearranging").
 *
 *   2. Each cell has an inner counter-rotation that undoes the outer angle
 *      around the cell's own center. Result: cells orbit the pivot like a
 *      rigid body, but every bevel face stays upright (top bright / bottom
 *      dark) regardless of rotationIdx — matching penta's visual behaviour.
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
   * animation — avoids the JS→UI SharedValue propagation delay that would
   * otherwise flash the piece at a stale rotation for one frame when defId
   * changes. Exactly one of `turns` / `staticTurns` should be provided. */
  staticTurns?: number;
}) {
  const { shape0, colors } = useMemo(() => {
    const def = getPiece(defId);
    return {
      shape0: def.rotations[0],
      colors: bevelColorsForPieceId(defId),
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
  const half = (cellSize - 2) / 2;

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
  const counterTransformSV = useDerivedValue(() => {
    const t = turns ? turns.value : 0;
    return [
      { translateX: half },
      { translateY: half },
      { rotate: -t * 2 * Math.PI },
      { translateX: -half },
      { translateY: -half },
    ];
  });

  // Static path: plain JS transforms. Computed inline so defId and rotation
  // are guaranteed to land in the same commit — no JS→UI propagation delay.
  const outerTransformStatic = [
    { translateX: centerPx },
    { translateY: centerPx },
    { rotate: staticT * 2 * Math.PI },
    { translateX: -centerPx },
    { translateY: -centerPx },
  ];
  const counterTransformStatic = [
    { translateX: half },
    { translateY: half },
    { rotate: -staticT * 2 * Math.PI },
    { translateX: -half },
    { translateY: -half },
  ];

  const outerTransform = isStatic ? outerTransformStatic : outerTransformSV;
  const counterTransform = isStatic ? counterTransformStatic : counterTransformSV;

  return (
    <Canvas style={{ width: containerPx, height: containerPx }}>
      <Group transform={outerTransform}>
        {shape0.map(([r, c]: Offset, i: number) => (
          <Group
            key={i}
            transform={[
              { translateX: (offsetX + c) * cellSize + 1 },
              { translateY: (offsetY + r) * cellSize + 1 },
            ]}
          >
            <Group transform={counterTransform}>
              <BeveledBlockShape
                size={cellSize - 2}
                colors={colors}
                bevelFraction={DEFAULT_BEVEL_FRACTION}
              />
            </Group>
          </Group>
        ))}
      </Group>
    </Canvas>
  );
}
