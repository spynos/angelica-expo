import { useEffect, useRef, useSyncExternalStore } from 'react';

import type { GameState } from '@/src/lib/blockmatch/types';

import { EntityManager } from './entityManager';
import type { Entity } from './types';

/**
 * React entry point to the entity layer.
 *
 * Returns:
 *  - `entities`: current entity snapshot (stable reference while no
 *    add/remove — safe to use as a dependency).
 *  - `manager`: the raw EntityManager, passed down so gesture layers can
 *    manipulate drag/ghost entities directly without round-tripping
 *    through React state.
 *
 * The manager lives for the component's lifetime; switching between
 * stages or restarting the game is handled by the `state` effect which
 * re-syncs on every Zustand state change.
 */
export function useEntities(state: GameState): {
  entities: Entity[];
  manager: EntityManager;
} {
  const managerRef = useRef<EntityManager | null>(null);
  if (managerRef.current === null) {
    managerRef.current = new EntityManager();
    managerRef.current.seedInitialStage(state);
  }
  const manager = managerRef.current;

  const entities = useSyncExternalStore(
    (cb) => manager.subscribe(cb),
    () => manager.snapshot(),
    () => manager.snapshot(),
  );

  // Track stage/seed to detect hard resets (restart / commitStage).
  const lastSeedRef = useRef<string>(state.seed);
  const lastStageRef = useRef<number>(state.stage);

  useEffect(() => {
    if (state.seed !== lastSeedRef.current) {
      // Restart — reseed the stage from scratch.
      manager.seedInitialStage(state);
      lastSeedRef.current = state.seed;
      lastStageRef.current = state.stage;
      return;
    }
    if (state.stage !== lastStageRef.current) {
      // Stage commit — fresh board, fresh entities.
      manager.seedInitialStage(state);
      lastStageRef.current = state.stage;
      return;
    }
    // Incremental update inside the same stage (place / clear lines).
    manager.syncFromState(state);
  }, [state, manager]);

  return { entities, manager };
}
