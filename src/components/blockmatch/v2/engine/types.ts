import type { SharedValue } from 'react-native-reanimated';

import type { ObstacleId, Offset } from '@/src/lib/blockmatch/types';

import type { Phase } from './phases';

/**
 * Entity model for the blockmatch board.
 *
 * An entity is a live object whose visual state (position, scale, opacity)
 * lives in SharedValues so it can animate on the UI thread without triggering
 * React re-renders. React is only involved in lifecycle: creating and
 * destroying entities. Inside the lifetime, all motion is driven by worklets
 * and Reanimated timing primitives.
 *
 * Why this matters: the naive approach (React state → <Cell /> components) is
 * what makes block-puzzle games flicker at placement and clear moments —
 * mount/unmount of cell Views happens across frame boundaries. With the
 * entity model, the Skia Canvas draws every entity every frame from its
 * SharedValue state, and React's reconciliation never interrupts motion.
 */

/** Unique, never-reused entity identifier. */
export type EntityId = string;

/** What an entity is visually. Determines which drawer paints it. */
export type EntityKind =
  | 'block' // a settled piece cell on the board
  | 'obstacle' // a stage-seeded obstacle
  | 'dragPiece' // the piece the finger is dragging
  | 'ghost' // snap preview on the board
  | 'fx'; // line-clear burst, combo badge, etc.

/**
 * Cell-space position.
 *
 * For board entities (block / obstacle) this is the (row, col) they occupy.
 * For dragPiece, `row` and `col` are fractional during motion and driven by
 * the gesture worklet via the `x` / `y` pixel SharedValues below; the cell
 * coordinates on the entity are the *anchor* the piece will commit to.
 */
export type CellPos = { row: number; col: number };

/**
 * Animated visual fields. All SharedValues so they can be driven either by
 * Reanimated timings (spawn, clear, bump) or the gesture worklet (drag).
 *
 * `x` / `y` are *pixel offsets within the board canvas*, not absolute screen
 * coordinates. They are maintained so entities that need to translate (drag
 * piece, placement settle) can do so without fighting the layout coordinate
 * of their anchor cell.
 */
export type EntityTransform = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  rotation: SharedValue<number>; // radians, 0 = upright
};

/** Common fields every entity carries. */
export type EntityBase = {
  id: EntityId;
  kind: EntityKind;
  phase: SharedValue<Phase>;
  transform: EntityTransform;
  /** Monotonic creation tick — used for diagnostics and stable ordering. */
  createdAt: number;
};

/**
 * A settled piece cell. One entity per cell of the placed piece. Placing a
 * tetromino therefore creates 4 block entities with the same `pieceId`.
 *
 * Keeping one entity per cell (rather than one per piece) makes line-clear
 * staggering trivial: each cell animates independently, and only the cells
 * in cleared rows/cols transition to CLEARING.
 */
export type BlockEntity = EntityBase & {
  kind: 'block';
  pieceId: string; // for color lookup via colors.ts
  anchor: CellPos; // (row, col) on the board
};

/** A stage-seeded obstacle. */
export type ObstacleEntity = EntityBase & {
  kind: 'obstacle';
  obstacleId: ObstacleId;
  /** Current HP as a SharedValue so the drawer can cross-fade armor↔cracked. */
  hp: SharedValue<number>;
  anchor: CellPos;
};

/**
 * The piece the finger is currently holding. There is at most one at a time.
 *
 * `shape` is the post-rotation cell offsets (rotations[rotationIdx]), used
 * by the gesture worklet for ghost snap collision. `shape0` is always
 * rotations[0] and is used for visual rendering — the DragPieceOverlay
 * applies a Skia outer rotation to match the tray's PiecePreview, keeping
 * bevel direction consistent between tray and dragged piece.
 */
export type DragPieceEntity = EntityBase & {
  kind: 'dragPiece';
  pieceId: string;
  /** rotations[rotationIdx] — used by ghostSnap for collision. */
  shape: readonly Offset[];
  /** rotations[0] — used for visual rendering with outer rotation transform. */
  shape0: readonly Offset[];
  /** Bbox width/height in cells of the current rotation (for drag geometry). */
  cellsW: number;
  cellsH: number;
};

/** The snap preview on the board. One at a time. */
export type GhostEntity = EntityBase & {
  kind: 'ghost';
  pieceId: string;
  shape: readonly Offset[];
  /** Anchor cell the preview would commit to; (-1,-1) when invalid/hidden. */
  anchor: SharedValue<CellPos>;
  /** Whether the current snap is valid for placement. */
  valid: SharedValue<boolean>;
  /** Set to true on valid drop so GhostNode switches to solid-block look. */
  landed: SharedValue<boolean>;
  /**
   * Multiplied into the ghost opacity while `landed` is true. Starts at 1;
   * animated to 0 when the landed piece's row is part of a line clear so the
   * ghost fades in sync with the board entities instead of blinking out.
   */
  clearingOpacity: SharedValue<number>;
};

/** One-shot visual effect. Fades itself out and self-despawns. */
export type FxEntity = EntityBase & {
  kind: 'fx';
  fxKind: 'lineFlash' | 'comboBadge' | 'obstacleBurst';
  /** Origin in pixel space (x,y already live on transform). */
  payload?: Record<string, number | string>;
};

export type Entity =
  | BlockEntity
  | ObstacleEntity
  | DragPieceEntity
  | GhostEntity
  | FxEntity;

/** Board + pixel conversion context passed to drawers. */
export type BoardGeometry = {
  cellSize: number;
  boardCols: number;
  boardRows: number;
  /** Pixel position of the board's (0,0) cell within the canvas. */
  originX: number;
  originY: number;
};
