import { Easing, withTiming } from 'react-native-reanimated';

import { BOARD_SIZE } from '@/src/lib/blockmatch/types';
import type { Cell, GameState, Offset, TurnSummary } from '@/src/lib/blockmatch/types';

import {
  DUR_LINE_CLEAR,
  DUR_SPAWN,
  JITTER_LINE_CLEAR_MS,
  STAGGER_LINE_CLEAR_MS,
} from './constants';
import { createBlockEntity, createObstacleEntity } from './entityFactory';
import { PHASE } from './phases';
import type { BlockEntity, Entity, EntityId, ObstacleEntity } from './types';

/**
 * EntityManager: single source of truth for on-screen entities.
 *
 * Owns the entity lifecycle independent of React. The game state
 * (Zustand) drives `syncFromState`, which diffs old→new and issues the
 * minimal set of entity creations / phase transitions to reach the new
 * state. React components subscribe to the manager to get re-rendered
 * when the entity array identity changes (add/remove); ongoing motion
 * inside an entity does not trigger React at all.
 *
 * Key invariants:
 *   1. Block entities map 1:1 to filled board cells. Adding a piece
 *      of N cells creates N BlockEntities. Clearing a line despawns
 *      exactly the entities anchored in that row/col.
 *   2. Obstacle entities persist as long as `hp > 0`. HP changes
 *      update the SharedValue; destruction transitions to CLEARING.
 *   3. Entity ids are monotonic (see entityFactory) and are never
 *      reused — this is what enables smooth visual transitions.
 */

type Listener = () => void;

function cellIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export class EntityManager {
  private entities: Map<EntityId, Entity> = new Map();
  private blockByCell: Map<number, BlockEntity> = new Map();
  private obstacleByCell: Map<number, ObstacleEntity> = new Map();
  private listeners: Set<Listener> = new Set();

  /** Cache the last-seen board so diffs are incremental. */
  private lastBoard: Cell[] | null = null;

  /**
   * Current snapshot as a stable array reference. Re-generated only when
   * the entity set changes (add/remove) — ongoing SharedValue motion
   * does not invalidate this reference.
   */
  private cachedSnapshot: Entity[] = [];
  private snapshotDirty = true;

  // --- Public API ------------------------------------------------------

  snapshot(): Entity[] {
    if (this.snapshotDirty) {
      this.cachedSnapshot = Array.from(this.entities.values()).sort(
        (a, b) => a.createdAt - b.createdAt,
      );
      this.snapshotDirty = false;
    }
    return this.cachedSnapshot;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Optimistically spawn the cells of a just-dropped piece before the
   * Zustand dispatch + React re-render cycle completes.
   *
   * Also updates `lastBoard` so the subsequent `syncFromState` call sees
   * those cells as already-block and skips re-spawning them.
   */
  optimisticPlace(row: number, col: number, pieceId: string, shape: readonly Offset[]): void {
    const newLastBoard = this.lastBoard ? (this.lastBoard.slice() as Cell[]) : null;
    for (const [dr, dc] of shape) {
      const r = row + dr;
      const c = col + dc;
      const i = cellIndex(r, c);
      if (!this.blockByCell.has(i)) {
        this.spawnBlock(r, c, pieceId);
        if (newLastBoard) {
          newLastBoard[i] = { kind: 'block', pieceId };
        }
      }
    }
    if (newLastBoard) {
      this.lastBoard = newLastBoard;
    }
  }

  /** Reset all entities (used on restart). */
  reset(): void {
    this.entities.clear();
    this.blockByCell.clear();
    this.obstacleByCell.clear();
    this.lastBoard = null;
    this.invalidate();
  }

  /**
   * Reconcile the current entity set against a freshly reduced game state.
   *
   * For the initial sync (lastBoard null) we spawn all occupied cells
   * immediately in IDLE phase — the stage start should feel solid, not
   * animated. Subsequent syncs animate additions and removals.
   *
   * Cells transitioning to empty are staggered along their own line axis:
   * cells in a cleared row cascade left→right by column index, and cells
   * in a cleared column cascade top→bottom by row index. Cells at the
   * intersection of a cleared row and column take the smaller of the two
   * candidate delays so they animate at the earliest cascade arrival.
   *
   * `turn` is the `TurnSummary` returned by the just-applied reducer
   * action. Without it (initial sync, restart) the toClear set is empty
   * anyway, but we fall back to delay 0 defensively.
   */
  syncFromState(state: GameState, turn?: TurnSummary | null): void {
    const board = state.board;
    const isInitial = this.lastBoard === null;

    const toClear: Array<{ i: number; prevKind: 'block' | 'obstacle' }> = [];

    for (let i = 0; i < board.length; i++) {
      const prev = this.lastBoard ? this.lastBoard[i] : null;
      const curr = board[i];

      if (curr.kind === 'empty' && (prev?.kind === 'block' || prev?.kind === 'obstacle')) {
        toClear.push({ i, prevKind: prev.kind });
      } else {
        this.reconcileCell(i, prev, curr, isInitial);
      }
    }

    if (toClear.length > 0) {
      const clearedRows = new Set(turn?.rowsCleared ?? []);
      const clearedCols = new Set(turn?.colsCleared ?? []);

      for (const { i, prevKind } of toClear) {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        let delay = Number.POSITIVE_INFINITY;
        if (clearedRows.has(row)) delay = Math.min(delay, col * STAGGER_LINE_CLEAR_MS);
        if (clearedCols.has(col)) delay = Math.min(delay, row * STAGGER_LINE_CLEAR_MS);
        if (!Number.isFinite(delay)) delay = 0;

        if (prevKind === 'block') this.clearBlock(i, delay);
        else this.clearObstacle(i, delay);
      }
    }

    this.lastBoard = board;
  }

  /**
   * Spawn every occupied cell in the initial stage board.
   *
   * Called once per stage start — entities animate in via the SPAWNING
   * phase. Use this instead of syncFromState when entering a brand-new
   * stage to get the "dealing cards" animation; use syncFromState for
   * incremental updates after `place` actions.
   */
  seedInitialStage(state: GameState): void {
    this.reset();
    const board = state.board;
    for (let i = 0; i < board.length; i++) {
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;
      const cell = board[i];
      if (cell.kind === 'block') {
        this.spawnBlock(row, col, cell.pieceId);
      } else if (cell.kind === 'obstacle') {
        this.spawnObstacle(
          row,
          col,
          cell.obstacle.id,
          cell.obstacle.hp,
          cell.obstacle.needs.h,
          cell.obstacle.needs.v,
          true,
        );
      }
    }
    this.lastBoard = board;
  }

  /**
   * Force re-emit (e.g., after manual phase advances).
   *
   * Coalesced via rAF: a mass line-clear produces dozens of spawn/despawn
   * events across ~300ms. Without batching, each would fire its listeners
   * synchronously, causing React to schedule one re-render per event — which
   * shows up as dropped frames on the drag gesture if the player is already
   * moving the next piece. rAF collapses all invalidates in a frame into one
   * listener broadcast.
   */
  invalidate(): void {
    this.snapshotDirty = true;
    if (this._invalidateScheduled) return;
    this._invalidateScheduled = true;
    requestAnimationFrame(() => {
      this._invalidateScheduled = false;
      for (const l of this.listeners) l();
    });
  }
  private _invalidateScheduled = false;

  // --- Internal --------------------------------------------------------

  private reconcileCell(
    i: number,
    prev: Cell | null,
    curr: Cell,
    isInitial: boolean,
  ): void {
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;

    const prevKind = prev?.kind ?? 'empty';

    if (prevKind === curr.kind) {
      // Same kind — handle internal changes.
      if (curr.kind === 'obstacle' && prev?.kind === 'obstacle') {
        const entity = this.obstacleByCell.get(i);
        if (entity) {
          if (entity.hp.value !== curr.obstacle.hp) {
            entity.hp.value = curr.obstacle.hp;
            // Leaves entity in IDLE; damaged flash is handled by Task #6.
          }
          if (entity.needsH.value !== curr.obstacle.needs.h) {
            entity.needsH.value = curr.obstacle.needs.h;
          }
          if (entity.needsV.value !== curr.obstacle.needs.v) {
            entity.needsV.value = curr.obstacle.needs.v;
          }
        }
      }
      return;
    }

    // Kind transition — handle each case.

    // Something → empty : despawn whatever was there.
    if (curr.kind === 'empty') {
      if (prevKind === 'block') this.clearBlock(i);
      else if (prevKind === 'obstacle') this.clearObstacle(i);
      return;
    }

    // Empty → block : spawn a block entity.
    // Always instant (no animation) — player-dropped pieces should appear
    // exactly where placed with no fade or scale effect.
    if (prevKind === 'empty' && curr.kind === 'block') {
      this.spawnBlock(row, col, curr.pieceId);
      return;
    }

    // Empty → obstacle : spawn an obstacle (only happens on stage commit).
    if (prevKind === 'empty' && curr.kind === 'obstacle') {
      this.spawnObstacle(
        row,
        col,
        curr.obstacle.id,
        curr.obstacle.hp,
        curr.obstacle.needs.h,
        curr.obstacle.needs.v,
        !isInitial,
      );
      return;
    }

    // Block ↔ obstacle transitions are game-illegal; log once and ignore.
    if (__DEV__) {
      console.warn(
        `[EntityManager] unexpected cell transition at (${row},${col}): ${prevKind}→${curr.kind}`,
      );
    }
  }

  private spawnBlock(row: number, col: number, pieceId: string): void {
    const entity = createBlockEntity({
      pieceId,
      anchor: { row, col },
      initialPhase: PHASE.IDLE,
      initialOpacity: 1,
      initialScale: 1,
    });
    this.entities.set(entity.id, entity);
    this.blockByCell.set(cellIndex(row, col), entity);
    this.invalidate();
  }

  private clearBlock(i: number, delay = 0): void {
    const entity = this.blockByCell.get(i);
    if (!entity) return;
    entity.phase.value = PHASE.CLEARING;
    // Small per-cell jitter keeps the wave from looking mechanical without
    // breaking the top-to-bottom row sweep.
    const jitter = Math.random() * JITTER_LINE_CLEAR_MS;
    const totalDelay = delay + jitter;

    setTimeout(() => {
      entity.transform.scale.value = withTiming(0.6, {
        duration: DUR_LINE_CLEAR,
        easing: Easing.out(Easing.cubic),
      });
      entity.transform.opacity.value = withTiming(0, {
        duration: DUR_LINE_CLEAR,
        easing: Easing.out(Easing.quad),
      });
    }, totalDelay);

    setTimeout(() => {
      this.entities.delete(entity.id);
      // Identity check: if a new block was placed on this cell while we were
      // fading, blockByCell now points at THAT entity — don't clobber its
      // reference or the next clearBlock will silently no-op on it.
      if (this.blockByCell.get(i) === entity) {
        this.blockByCell.delete(i);
      }
      entity.phase.value = PHASE.DESPAWNED;
      this.invalidate();
    }, totalDelay + DUR_LINE_CLEAR);
  }

  private spawnObstacle(
    row: number,
    col: number,
    obstacleId: ObstacleEntity['obstacleId'],
    hp: number,
    needsH: number,
    needsV: number,
    animated: boolean,
  ): void {
    const entity = createObstacleEntity({
      obstacleId,
      anchor: { row, col },
      hp,
      needsH,
      needsV,
      initialPhase: PHASE.IDLE,
    });
    if (animated) {
      entity.transform.opacity.value = 0;
      entity.transform.opacity.value = withTiming(1, { duration: DUR_SPAWN });
    }
    this.entities.set(entity.id, entity);
    this.obstacleByCell.set(cellIndex(row, col), entity);
    this.invalidate();
  }

  private clearObstacle(i: number, delay = 0): void {
    const entity = this.obstacleByCell.get(i);
    if (!entity) return;
    entity.phase.value = PHASE.CLEARING;
    const jitter = Math.random() * JITTER_LINE_CLEAR_MS;
    const totalDelay = delay + jitter;

    setTimeout(() => {
      entity.transform.scale.value = withTiming(0.5, {
        duration: DUR_LINE_CLEAR,
        easing: Easing.out(Easing.cubic),
      });
      entity.transform.opacity.value = withTiming(0, {
        duration: DUR_LINE_CLEAR,
        easing: Easing.out(Easing.quad),
      });
    }, totalDelay);

    setTimeout(() => {
      this.entities.delete(entity.id);
      if (this.obstacleByCell.get(i) === entity) {
        this.obstacleByCell.delete(i);
      }
      entity.phase.value = PHASE.DESPAWNED;
      this.invalidate();
    }, totalDelay + DUR_LINE_CLEAR);
  }
}
