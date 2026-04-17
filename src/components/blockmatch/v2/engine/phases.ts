/**
 * Entity lifecycle phases.
 *
 * Each live object (block, obstacle, drag piece, ghost, fx burst) flows
 * through this state machine. Phase transitions are always driven by the
 * EntityManager or gesture worklet — never by React re-rendering — so visual
 * updates never skip a frame when React reconciles.
 *
 * Critical rule: the React component for an entity stays mounted through
 * `clearing` / `dying` phases and is only unmounted after `despawned`. This
 * guarantees that fading-out content never gets ripped out mid-animation
 * (which is what causes visible flicker under a naive state→view mapping).
 */

export const PHASE = {
  /** Fresh entity, fading + scaling in. */
  SPAWNING: 'spawning',
  /** Settled, no active animation. */
  IDLE: 'idle',
  /** Piece picked up, moving with the finger. (dragPiece kind only) */
  DRAGGING: 'dragging',
  /** Piece just released on a valid cell — transitioning to board blocks. */
  PLACING: 'placing',
  /** Included in a cleared line, fading out. */
  CLEARING: 'clearing',
  /** Obstacle took damage but not destroyed — brief shake/flash. */
  DAMAGED: 'damaged',
  /** Animation finished, waiting for React to unmount on next tick. */
  DESPAWNED: 'despawned',
} as const;

export type Phase = (typeof PHASE)[keyof typeof PHASE];

/** Duration (ms) each phase animates before auto-advancing to the next. */
export const PHASE_DURATION: Partial<Record<Phase, number>> = {
  [PHASE.SPAWNING]: 200,
  [PHASE.PLACING]: 0, // instant — penta spec has no settle animation
  [PHASE.CLEARING]: 300,
  [PHASE.DAMAGED]: 200,
};

/** Delay per row index when staggering a clear — penta uses ~50ms. */
export const CLEAR_ROW_STAGGER_MS = 50;
