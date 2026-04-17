import { useEffect, useState } from 'react';
import { Group } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { bevelColorsForPieceId } from '@/src/lib/blockmatch/colors';

import { DEFAULT_BEVEL_FRACTION } from '../engine/constants';
import type { BlockEntity, Entity, ObstacleEntity } from '../engine/types';
import { BeveledBlockShape, ObstacleShape } from './drawers';

/**
 * One Skia node per live entity.
 *
 * The transform and opacity are bound to the entity's SharedValues so that
 * motion (spawn fade-in, clear fade-out, drag, settle bump) runs entirely on
 * the UI thread. React only participates in mount/unmount — no per-frame
 * re-render happens while an entity is moving.
 *
 * Scale is applied around the cell center so spawn/clear animations feel
 * centered, not anchored to the top-left corner.
 */

type Props = {
  entity: Entity;
  cellSize: number;
};

export function EntityNode({ entity, cellSize }: Props) {
  if (entity.kind === 'block') {
    return <BlockEntityNode entity={entity} cellSize={cellSize} />;
  }
  if (entity.kind === 'obstacle') {
    return <ObstacleEntityNode entity={entity} cellSize={cellSize} />;
  }
  // dragPiece / ghost / fx are drawn by dedicated overlays in their own tasks.
  return null;
}

// ---------------------------------------------------------------------------

function BlockEntityNode({
  entity,
  cellSize,
}: {
  entity: BlockEntity;
  cellSize: number;
}) {
  const colors = bevelColorsForPieceId(entity.pieceId);

  const transform = useDerivedValue(() => {
    const cx = entity.anchor.col * cellSize + cellSize / 2;
    const cy = entity.anchor.row * cellSize + cellSize / 2;
    const s = entity.transform.scale.value;
    return [
      { translateX: cx + entity.transform.x.value },
      { translateY: cy + entity.transform.y.value },
      { scale: s },
      { rotate: entity.transform.rotation.value },
      { translateX: -cellSize / 2 },
      { translateY: -cellSize / 2 },
    ];
  });

  return (
    <Group transform={transform} opacity={entity.transform.opacity}>
      <BeveledBlockShape
        size={cellSize}
        colors={colors}
        bevelFraction={DEFAULT_BEVEL_FRACTION}
      />
    </Group>
  );
}

// ---------------------------------------------------------------------------

function ObstacleEntityNode({
  entity,
  cellSize,
}: {
  entity: ObstacleEntity;
  cellSize: number;
}) {
  // HP drives the shape variant (durable2 armor→cracked), which isn't a
  // SharedValue-friendly thing to swap between. Mirror it into React state
  // so the shape re-renders on damage. The opacity/transform are still
  // SharedValue-bound so motion stays on the UI thread.
  const [hp, setHp] = useState(entity.hp.value);
  useEffect(() => {
    // Poll the SharedValue on each React render cycle; since hp only changes
    // on `place` dispatches (not per-frame), this is cheap. Alternative would
    // be to trigger manager.invalidate on hp change — kept simple for now.
    if (entity.hp.value !== hp) setHp(entity.hp.value);
  });

  const transform = useDerivedValue(() => {
    const cx = entity.anchor.col * cellSize + cellSize / 2;
    const cy = entity.anchor.row * cellSize + cellSize / 2;
    return [
      { translateX: cx + entity.transform.x.value },
      { translateY: cy + entity.transform.y.value },
      { scale: entity.transform.scale.value },
      { rotate: entity.transform.rotation.value },
      { translateX: -cellSize / 2 },
      { translateY: -cellSize / 2 },
    ];
  });

  return (
    <Group transform={transform} opacity={entity.transform.opacity}>
      <ObstacleShape
        size={cellSize}
        obstacleId={entity.obstacleId}
        hp={hp}
      />
    </Group>
  );
}
