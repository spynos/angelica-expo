import { Canvas } from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { GameState } from '@/src/lib/blockmatch/types';
import { BOARD_SIZE } from '@/src/lib/blockmatch/types';

import type { EntityManager } from '../engine/entityManager';
import type { GhostEntity } from '../engine/types';
import { useEntities } from '../engine/useEntities';
import { ClearHintNode } from './ClearHintNode';
import { BoardBackground } from './drawers';
import { EntityNode } from './EntityNode';
import { GhostNode } from './GhostNode';

/**
 * Root Skia surface for the board.
 *
 * Hosts:
 *   1. BoardBackground (static — fill + grid)
 *   2. One EntityNode per live entity (blocks + obstacles today; ghost &
 *      drag piece land here in the gesture task)
 *
 * The canvas is sized precisely to the board (cols * cell, rows * cell) so
 * layout is predictable. Overflow (drag piece in the tray, rainbow stagger)
 * is handled by sibling overlays drawn on top.
 */

export function BoardCanvasV2({
  state,
  cellSize,
  ghost,
  boardBits,
  onManager,
}: {
  state: GameState;
  cellSize: number;
  ghost?: GhostEntity;
  /** Worklet-shareable board occupancy used by the line-clear hint. */
  boardBits?: SharedValue<number[]>;
  onManager?: (manager: EntityManager) => void;
}) {
  const { entities, manager } = useEntities(state);

  const onManagerRef = useRef(onManager);
  onManagerRef.current = onManager;
  useEffect(() => {
    onManagerRef.current?.(manager);
  }, [manager]);

  // Shared icon beacon pulse for pulsing obstacle types (basic/horiz/vert/
  // composite). Matches penta SpecialBlock: 1000ms period, easeInOutSine,
  // full 0↔1 alpha (controller repeats with reverse=true, half-period
  // 500ms). Armor bolts and cracks don't subscribe to this.
  const obstaclePulse = useSharedValue(1);
  useEffect(() => {
    obstaclePulse.value = withRepeat(
      withTiming(0, { duration: 500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(obstaclePulse);
    };
  }, [obstaclePulse]);

  const boardW = BOARD_SIZE * cellSize;
  const boardH = BOARD_SIZE * cellSize;

  return (
    <View style={[styles.wrap, { width: boardW, height: boardH }]}>
      <Canvas style={{ width: boardW, height: boardH }}>
        <BoardBackground
          boardCols={BOARD_SIZE}
          boardRows={BOARD_SIZE}
          cellSize={cellSize}
        />
        {entities.map((e) => (
          <EntityNode
            key={e.id}
            entity={e}
            cellSize={cellSize}
            obstaclePulse={obstaclePulse}
          />
        ))}
        {ghost && boardBits ? (
          <ClearHintNode
            ghost={ghost}
            boardBits={boardBits}
            cellSize={cellSize}
            boardCols={BOARD_SIZE}
            boardRows={BOARD_SIZE}
          />
        ) : null}
        {ghost ? <GhostNode key={ghost.id} entity={ghost} cellSize={cellSize} /> : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 2,
  },
});
