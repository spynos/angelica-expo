import { useState } from 'react';
import { Group } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction, useDerivedValue } from 'react-native-reanimated';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';

import type { BlockEntity, Entity, ObstacleEntity } from '../engine/types';
import { FlatBlockShape, ObstacleShape } from './drawers';

/**
 * One Skia node per live entity.
 *
 * The transform and opacity are bound to the entity's SharedValues so that
 * motion (spawn fade-in, clear fade-out, drag, settle bump) runs entirely on
 * the UI thread. React only participates in mount/unmount.
 *
 * Scale rotates around the cell center so spawn/clear animations feel
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
  const fill = colorForPieceId(entity.pieceId);

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
      <FlatBlockShape size={cellSize} fill={fill} />
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
  // HP drives the durable2 marker variant; needsH/needsV drive the composite
  // cross-arm lights. Mirror SharedValue → React state via animated reactions
  // so the marker re-renders the moment the engine writes a new value.
  // Opacity/transform stay SharedValue-bound.
  const [hp, setHp] = useState(entity.hp.value);
  const [needsH, setNeedsH] = useState(entity.needsH.value);
  const [needsV, setNeedsV] = useState(entity.needsV.value);
  useAnimatedReaction(
    () => entity.hp.value,
    (next, prev) => {
      if (next !== prev) runOnJS(setHp)(next);
    },
  );
  useAnimatedReaction(
    () => entity.needsH.value,
    (next, prev) => {
      if (next !== prev) runOnJS(setNeedsH)(next);
    },
  );
  useAnimatedReaction(
    () => entity.needsV.value,
    (next, prev) => {
      if (next !== prev) runOnJS(setNeedsV)(next);
    },
  );

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
        needsH={needsH}
        needsV={needsV}
      />
    </Group>
  );
}
