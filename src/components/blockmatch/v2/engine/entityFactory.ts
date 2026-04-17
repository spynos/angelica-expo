import { makeMutable } from 'react-native-reanimated';

import type { ObstacleId, Offset } from '@/src/lib/blockmatch/types';

import { PHASE, type Phase } from './phases';
import type {
  BlockEntity,
  CellPos,
  DragPieceEntity,
  EntityId,
  EntityTransform,
  FxEntity,
  GhostEntity,
  ObstacleEntity,
} from './types';

/**
 * Entity factories.
 *
 * We call `makeMutable` directly (instead of `useSharedValue`) so entities can
 * be created from outside React — specifically inside the EntityManager's
 * plain JS sync logic. React components never "own" an entity; they only
 * subscribe to the entity array to know which SkiaGroups to render.
 *
 * Every id is monotonic and never reused — this is what lets a single Skia
 * scene keep rendering an entity through lifecycle transitions without React
 * swapping it out under the hood.
 */

let _idCounter = 0;
let _tickCounter = 0;

export function nextEntityId(prefix: string): EntityId {
  _idCounter += 1;
  return `${prefix}-${_idCounter}`;
}

function nextTick(): number {
  _tickCounter += 1;
  return _tickCounter;
}

function makeTransform(init: {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  rotation?: number;
}): EntityTransform {
  return {
    x: makeMutable(init.x ?? 0),
    y: makeMutable(init.y ?? 0),
    scale: makeMutable(init.scale ?? 1),
    opacity: makeMutable(init.opacity ?? 1),
    rotation: makeMutable(init.rotation ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Block (settled cell on the board)
// ---------------------------------------------------------------------------

export function createBlockEntity(params: {
  pieceId: string;
  anchor: CellPos;
  initialPhase?: Phase;
  initialOpacity?: number;
  initialScale?: number;
}): BlockEntity {
  return {
    id: nextEntityId('block'),
    kind: 'block',
    pieceId: params.pieceId,
    anchor: params.anchor,
    phase: makeMutable<Phase>(params.initialPhase ?? PHASE.SPAWNING),
    transform: makeTransform({
      opacity: params.initialOpacity ?? 0,
      scale: params.initialScale ?? 0.85,
    }),
    createdAt: nextTick(),
  };
}

// ---------------------------------------------------------------------------
// Obstacle (stage-seeded)
// ---------------------------------------------------------------------------

export function createObstacleEntity(params: {
  obstacleId: ObstacleId;
  anchor: CellPos;
  hp: number;
  initialPhase?: Phase;
}): ObstacleEntity {
  return {
    id: nextEntityId('obs'),
    kind: 'obstacle',
    obstacleId: params.obstacleId,
    anchor: params.anchor,
    hp: makeMutable(params.hp),
    phase: makeMutable<Phase>(params.initialPhase ?? PHASE.IDLE),
    transform: makeTransform({}),
    createdAt: nextTick(),
  };
}

// ---------------------------------------------------------------------------
// Drag piece (follows finger)
// ---------------------------------------------------------------------------

export function createDragPieceEntity(params: {
  pieceId: string;
  shape: readonly Offset[];
  shape0: readonly Offset[];
  cellsW: number;
  cellsH: number;
  initialX: number;
  initialY: number;
}): DragPieceEntity {
  return {
    id: nextEntityId('drag'),
    kind: 'dragPiece',
    pieceId: params.pieceId,
    shape: params.shape,
    shape0: params.shape0,
    cellsW: params.cellsW,
    cellsH: params.cellsH,
    phase: makeMutable<Phase>(PHASE.DRAGGING),
    transform: makeTransform({
      x: params.initialX,
      y: params.initialY,
    }),
    createdAt: nextTick(),
  };
}

// ---------------------------------------------------------------------------
// Ghost (snap preview)
// ---------------------------------------------------------------------------

export function createGhostEntity(params: {
  pieceId: string;
  shape: readonly Offset[];
}): GhostEntity {
  return {
    id: nextEntityId('ghost'),
    kind: 'ghost',
    pieceId: params.pieceId,
    shape: params.shape,
    anchor: makeMutable<CellPos>({ row: -1, col: -1 }),
    valid: makeMutable(false),
    landed: makeMutable(false),
    clearingOpacity: makeMutable(1),
    phase: makeMutable<Phase>(PHASE.IDLE),
    transform: makeTransform({ opacity: 0 }),
    createdAt: nextTick(),
  };
}

// ---------------------------------------------------------------------------
// FX (one-shot visual)
// ---------------------------------------------------------------------------

export function createFxEntity(params: {
  fxKind: FxEntity['fxKind'];
  x: number;
  y: number;
  payload?: FxEntity['payload'];
}): FxEntity {
  return {
    id: nextEntityId('fx'),
    kind: 'fx',
    fxKind: params.fxKind,
    payload: params.payload,
    phase: makeMutable<Phase>(PHASE.SPAWNING),
    transform: makeTransform({
      x: params.x,
      y: params.y,
      opacity: 0,
    }),
    createdAt: nextTick(),
  };
}
