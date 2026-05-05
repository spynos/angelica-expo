import { useMemo } from 'react';
import { Blur, Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import type { Offset } from '@/src/lib/blockmatch/types';

import { CELL_INSET_PX, CELL_RADIUS_RATIO } from '../engine/constants';
import type { GhostEntity } from '../engine/types';
import { FlatBlockShape } from './drawers';

/**
 * Ghost snap preview (flat-paint era).
 *
 * The two visual states:
 *   - "ghost": low-opacity tile fills + a soft outer glow that traces the
 *     piece's outline. Shown while the snap anchor is valid and the piece
 *     hasn't landed yet.
 *   - "solid": full-opacity tiles, identical to the settled BlockEntityNode.
 *     Shown the moment the gesture commits.
 *
 * Rotation: with bevels gone the cells have no orientation, so a single
 * outer rotate would be enough — but the GhostEntity stores `shape` as
 * already-rotated offsets, so we just render each cell at its offset.
 * No counter-rotation needed.
 */

export function GhostNode({
  entity,
  cellSize,
}: {
  entity: GhostEntity;
  cellSize: number;
}) {
  const shape = entity.shape;
  const fill = colorForPieceId(entity.pieceId);

  // Outline path: rounded-rect perimeter for each cell, unioned. Used for the
  // soft outer glow. Cached per (shape, cellSize).
  const outlinePath = useMemo(() => {
    const inset = CELL_INSET_PX;
    const radius = cellSize * CELL_RADIUS_RATIO;
    const dim = cellSize - 2 * inset;
    const p = Skia.Path.Make();
    for (const [r, c] of shape) {
      p.addRRect({
        rect: {
          x: c * cellSize + inset,
          y: r * cellSize + inset,
          width: dim,
          height: dim,
        },
        rx: radius,
        ry: radius,
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
      {/* Ghost look: soft glow + dimmed tile fills */}
      <Group opacity={ghostLayerOpacity}>
        <Path path={outlinePath} color={fill} style="stroke" strokeWidth={2} opacity={0.4}>
          <Blur blur={6} />
        </Path>
        {shape.map(([r, c]: Offset, i: number) => (
          <Group
            key={i}
            transform={[{ translateX: c * cellSize }, { translateY: r * cellSize }]}
            opacity={0.45}
          >
            <FlatBlockShape size={cellSize} fill={fill} />
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
            <FlatBlockShape size={cellSize} fill={fill} />
          </Group>
        ))}
      </Group>
    </Group>
  );
}
