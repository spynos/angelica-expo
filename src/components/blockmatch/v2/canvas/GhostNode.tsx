import { useMemo } from 'react';
import {
  Blur,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import {
  bevelColorsForPieceId,
  colorForPieceId,
} from '@/src/lib/blockmatch/colors';
import type { Offset } from '@/src/lib/blockmatch/types';

import { DEFAULT_BEVEL_FRACTION, GHOST_BEVEL_FRACTION } from '../engine/constants';
import type { GhostEntity } from '../engine/types';
import { BeveledBlockShape } from './drawers';

/**
 * Ghost snap preview.
 *
 * Renders the dragging piece at the current snap anchor with a soft outer
 * glow and a full-opacity outline (penta's 2-layer glow + main stroke).
 * Visibility is SharedValue-driven: when `anchor` is (-1, -1) the entire
 * group fades to 0 opacity.
 *
 * The outline path is a union of all cell edges in the shape. It's cheap
 * to precompute at the JS layer since shape + cellSize are both stable
 * per drag session.
 */

export function GhostNode({
  entity,
  cellSize,
}: {
  entity: GhostEntity;
  cellSize: number;
}) {
  const shape = entity.shape;
  const colors = bevelColorsForPieceId(entity.pieceId);
  const glowColor = colorForPieceId(entity.pieceId);

  // Outline path (combined cell perimeters). One SkPath per draw; cached.
  const outlinePath = useMemo(() => {
    const p = Skia.Path.Make();
    for (const [r, c] of shape) {
      p.addRect({
        x: c * cellSize,
        y: r * cellSize,
        width: cellSize,
        height: cellSize,
      });
    }
    return p;
  }, [shape, cellSize]);

  // Transform: translate to anchor cell. Invisible when anchor.row < 0.
  const transform = useDerivedValue(() => {
    const a = entity.anchor.value;
    if (a.row < 0) return [{ translateX: 0 }, { translateY: 0 }];
    return [
      { translateX: a.col * cellSize },
      { translateY: a.row * cellSize },
    ];
  });

  const opacity = useDerivedValue(() => {
    const a = entity.anchor.value;
    if (a.row < 0) return 0;
    if (entity.landed.value) return entity.clearingOpacity.value;
    return entity.valid.value ? entity.transform.opacity.value : 0.35;
  });

  const ghostLayerOpacity = useDerivedValue(() => (entity.landed.value ? 0 : 1));
  const solidLayerOpacity = useDerivedValue(() => (entity.landed.value ? 1 : 0));

  return (
    <Group transform={transform} opacity={opacity}>
      {/* Ghost look: glow + outline + tinted fills */}
      <Group opacity={ghostLayerOpacity}>
        <Path path={outlinePath} color={glowColor} style="stroke" strokeWidth={2} opacity={0.4}>
          <Blur blur={6} />
        </Path>
        <Path path={outlinePath} color={glowColor} style="stroke" strokeWidth={1.5} />
        {shape.map(([r, c]: Offset, i: number) => (
          <Group
            key={i}
            transform={[{ translateX: c * cellSize }, { translateY: r * cellSize }]}
            opacity={0.4}
          >
            <BeveledBlockShape
              size={cellSize}
              colors={colors}
              bevelFraction={GHOST_BEVEL_FRACTION}
            />
          </Group>
        ))}
      </Group>
      {/* Solid look: matches settled BlockEntityNode appearance */}
      <Group opacity={solidLayerOpacity}>
        {shape.map(([r, c]: Offset, i: number) => (
          <Group
            key={i}
            transform={[{ translateX: c * cellSize }, { translateY: r * cellSize }]}
          >
            <BeveledBlockShape
              size={cellSize}
              colors={colors}
              bevelFraction={DEFAULT_BEVEL_FRACTION}
            />
          </Group>
        ))}
      </Group>
    </Group>
  );
}
