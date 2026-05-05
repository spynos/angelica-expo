import { Canvas, Group, Shadow } from '@shopify/react-native-skia';
import { useCallback, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import type { Offset } from '@/src/lib/blockmatch/types';

import type { DragPieceEntity } from '../engine/types';
import { FlatBlockShape } from './drawers';

/**
 * Full-screen, pointer-transparent overlay that draws the piece being
 * dragged.
 *
 * Flat-paint era: cells are single-fill rounded rects with a slight drop
 * shadow on the outer group so the piece reads as "lifted" off the board.
 *
 * Rotation:
 *   - `entity.shape0` is the canonical (unrotated) shape.
 *   - The outer Group rotates `turns * 2π` around the shape0 visual center.
 *   - With bevels gone there's no per-cell counter-rotation — the entire
 *     piece rotates as one rigid body.
 */

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function DragPieceOverlay({
  entity,
  cellSize,
  turns,
}: {
  entity: DragPieceEntity | null;
  cellSize: number;
  turns: SharedValue<number>;
}) {
  const viewRef = useRef<View>(null);
  const overlayOriginX = useSharedValue(0);
  const overlayOriginY = useSharedValue(0);

  const onLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      viewRef.current?.measureInWindow((x, y) => {
        overlayOriginX.value = x;
        overlayOriginY.value = y;
      });
    },
    [overlayOriginX, overlayOriginY],
  );

  if (!entity) return null;

  return (
    <View
      ref={viewRef}
      onLayout={onLayout}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      collapsable={false}
    >
      <Canvas style={{ flex: 1 }}>
        <DraggingPiece
          entity={entity}
          cellSize={cellSize}
          overlayOriginX={overlayOriginX}
          overlayOriginY={overlayOriginY}
          turns={turns}
        />
      </Canvas>
    </View>
  );
}

function DraggingPiece({
  entity,
  cellSize,
  overlayOriginX,
  overlayOriginY,
  turns,
}: {
  entity: DragPieceEntity;
  cellSize: number;
  overlayOriginX: SharedValue<number>;
  overlayOriginY: SharedValue<number>;
  turns: SharedValue<number>;
}) {
  const fill = colorForPieceId(entity.pieceId);

  // shape0 bbox center — pivot for outer rotation.
  const { shape0CenterX, shape0CenterY } = useMemo(() => {
    const rs = entity.shape0.map(([r]) => r);
    const cs = entity.shape0.map(([, c]) => c);
    const minR = Math.min(...rs);
    const minC = Math.min(...cs);
    const w = Math.max(...cs) - minC + 1;
    const h = Math.max(...rs) - minR + 1;
    return {
      shape0CenterX: (minC + w / 2) * cellSize,
      shape0CenterY: (minR + h / 2) * cellSize,
    };
  }, [entity.shape0, cellSize]);

  const outerTransform = useDerivedValue(() => {
    const visCenterX = entity.transform.x.value + entity.cellsW * cellSize * 0.5;
    const visCenterY = entity.transform.y.value + entity.cellsH * cellSize * 0.5;
    const cx = visCenterX - overlayOriginX.value;
    const cy = visCenterY - overlayOriginY.value;
    return [
      { translateX: cx },
      { translateY: cy },
      { rotate: turns.value * 2 * Math.PI },
      { translateX: -shape0CenterX },
      { translateY: -shape0CenterY },
    ];
  });

  return (
    <Group transform={outerTransform} opacity={entity.transform.opacity}>
      {entity.shape0.map(([r, c]: Offset, i: number) => (
        <Group
          key={i}
          transform={[{ translateX: c * cellSize }, { translateY: r * cellSize }]}
        >
          <FlatBlockShape size={cellSize} fill={fill}>
            {/* Slight drop shadow — reads as "lifted off the board". Applied
                per-cell rather than to the outer group so the shadow follows
                the rounded silhouette of each tile. */}
            <Shadow dx={0} dy={2} blur={6} color="#0000001F" />
          </FlatBlockShape>
        </Group>
      ))}
    </Group>
  );
}

export const SCREEN_BOUNDS = { width: SCREEN_W, height: SCREEN_H };
