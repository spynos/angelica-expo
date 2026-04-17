import { Canvas, Group } from '@shopify/react-native-skia';
import { useCallback, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { bevelColorsForPieceId } from '@/src/lib/blockmatch/colors';
import type { Offset } from '@/src/lib/blockmatch/types';

import { DEFAULT_BEVEL_FRACTION } from '../engine/constants';
import type { DragPieceEntity } from '../engine/types';
import { BeveledBlockShape } from './drawers';

/**
 * Full-screen, pointer-transparent overlay that draws the piece being
 * dragged.
 *
 * Rotation model — mirrors PiecePreview exactly:
 *
 *   - Cells come from `entity.shape0` (rotations[0], canonical unrotated).
 *   - A single outer `<Group transform>` applies `turns * 2π` rotation around
 *     the shape's visual center, so the entire piece — bevels and all —
 *     rotates as one rigid body.
 *   - `turns` is the same SharedValue that drives PieceTrayV2's current
 *     slot, so bevel orientation is pixel-identical at pickup and during drag.
 *
 * Positioning model:
 *
 *   - `entity.transform.x/y` holds the top-left of the current rotation's
 *     bounding box in window-absolute coords. We derive the visual center
 *     from that (+ cellsW/2 * cellSize, + cellsH/2 * cellSize) and rotate
 *     shape0 around that center so the piece stays anchored under the finger.
 *   - The overlay is mounted inside SafeAreaView so its local origin is not
 *     (0,0) in the window. We subtract overlayOriginX/Y via measureInWindow.
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
  const colors = bevelColorsForPieceId(entity.pieceId);

  // shape0 bbox — used to find the rotation pivot (center of shape0).
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

  // Counter-rotation per cell: undo the outer angle around each cell's own
  // center so bevel faces stay upright (top bright / bottom dark).
  const half = (cellSize - 2) / 2;
  const counterTransform = useDerivedValue(() => {
    return [
      { translateX: half },
      { translateY: half },
      { rotate: -turns.value * 2 * Math.PI },
      { translateX: -half },
      { translateY: -half },
    ];
  });

  return (
    <Group transform={outerTransform} opacity={entity.transform.opacity}>
      {entity.shape0.map(([r, c]: Offset, i: number) => (
        <Group
          key={i}
          transform={[{ translateX: c * cellSize + 1 }, { translateY: r * cellSize + 1 }]}
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
  );
}

export const SCREEN_BOUNDS = { width: SCREEN_W, height: SCREEN_H };
