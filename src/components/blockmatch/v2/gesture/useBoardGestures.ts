import { useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  makeMutable,
  runOnJS,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { shapeOf } from '@/src/lib/blockmatch/board';
import { getPiece } from '@/src/lib/blockmatch/pieces';
import type { GameState, Offset } from '@/src/lib/blockmatch/types';

import { DUR_SPAWN, FINGER_Y_OFFSET_PX } from '../engine/constants';
import { PHASE, type Phase } from '../engine/phases';
import type {
  CellPos,
  DragPieceEntity,
  GhostEntity,
} from '../engine/types';
import { boardToBits } from './boardBits';
import { fingerToAnchorPx } from './dragGeometry';
import { ghostSnap } from './ghostSnap';

/**
 * Gesture + ghost/drag lifecycle hook.
 *
 * Builds the Pan/Tap race gesture for the board, maintains the ghost and
 * drag-piece entities, and bridges gesture events into Zustand via
 * `runOnJS`. The caller provides:
 *
 *   - `boardOrigin`: SharedValues with the screen-space origin of the
 *     board canvas (set from an onLayout handler). The worklet translates
 *     absolute finger coordinates into board-local px via these.
 *   - `trayRect`: SharedValue with the tray's screen rect. Drags that
 *     start outside this rect are ignored.
 *
 * The returned object exposes:
 *   - `gesture`: Gesture to pass to a `<GestureDetector>`.
 *   - `ghost`: GhostEntity — hand this to the board Canvas so GhostNode
 *     can render it inside the same Skia surface as the board.
 *   - `drag`: DragPieceEntity — hand this to a DragPieceOverlay sibling.
 *
 * The entities are recreated whenever the *current piece* changes
 * (defId or rotationIdx), so their shape fields stay consistent with
 * what the game state expects. React sees new entity identities and
 * remounts the visual nodes; SharedValue motion is fresh each piece.
 */

export type TrayRect = { x: number; y: number; width: number; height: number };

export function useBoardGestures(params: {
  state: GameState;
  cellSize: number;
  boardCols: number;
  boardRows: number;
  boardOriginX: SharedValue<number>;
  boardOriginY: SharedValue<number>;
  trayRect: SharedValue<TrayRect>;
  onPlace: (row: number, col: number) => void;
  onRotate: () => void;
  /** Fires once each time the drag activates from the tray. */
  onDragStart?: () => void;
  /**
   * Fires when the ghost transitions to a *new valid* snap anchor. Throttling
   * is the consumer's responsibility (see HapticService.dragSnap).
   */
  onSnap?: () => void;
  inputEnabled: boolean;
}) {
  const {
    state,
    cellSize,
    boardCols,
    boardRows,
    boardOriginX,
    boardOriginY,
    trayRect,
    onPlace,
    onRotate,
    onDragStart,
    onSnap,
    inputEnabled,
  } = params;

  // -----------------------------------------------------------------
  // Shape SharedValues — worklet-readable shape for the current piece.
  // -----------------------------------------------------------------

  const currentShape = useSharedValue<readonly Offset[]>([]);
  const currentShapeDims = useSharedValue({ w: 0, h: 0 });

  useEffect(() => {
    const s = shapeOf(state.current);
    currentShape.value = [...s];
    let minR = Infinity,
      minC = Infinity,
      maxR = -Infinity,
      maxC = -Infinity;
    for (const [r, c] of s) {
      if (r < minR) minR = r;
      if (c < minC) minC = c;
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    }
    currentShapeDims.value = {
      w: maxC - minC + 1,
      h: maxR - minR + 1,
    };
  }, [state.current, currentShape, currentShapeDims]);

  // -----------------------------------------------------------------
  // Board bits — 0/1/2 per cell, re-snapshotted on every state change.
  // -----------------------------------------------------------------

  const boardBits = useSharedValue<number[]>([]);
  useEffect(() => {
    boardBits.value = boardToBits(state.board);
  }, [state.board, boardBits]);

  // -----------------------------------------------------------------
  // Ghost & Drag entities — recreated per piece so `shape` stays
  // current. Using refs + a bump counter forces component remount.
  // -----------------------------------------------------------------

  const pieceKey = `${state.current.defId}:${state.current.rotationIdx}`;
  const entitiesRef = useRef<{
    ghost: GhostEntity;
    drag: DragPieceEntity;
    key: string;
  } | null>(null);

  const entities = useMemo(() => {
    const s = shapeOf(state.current);
    const def = getPiece(state.current.defId);
    const shape0 = def.rotations[0];

    let minR = Infinity,
      minC = Infinity,
      maxR = -Infinity,
      maxC = -Infinity;
    for (const [r, c] of s) {
      if (r < minR) minR = r;
      if (c < minC) minC = c;
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    }
    const w = maxC - minC + 1;
    const h = maxR - minR + 1;

    const ghost: GhostEntity = {
      id: `ghost-${pieceKey}`,
      kind: 'ghost',
      pieceId: state.current.defId,
      shape: s,
      anchor: makeMutable<CellPos>({ row: -1, col: -1 }),
      valid: makeMutable(false),
      landed: makeMutable(false),
      clearingOpacity: makeMutable(1),
      phase: makeMutable<Phase>(PHASE.IDLE),
      transform: {
        x: makeMutable(0),
        y: makeMutable(0),
        scale: makeMutable(1),
        opacity: makeMutable(0),
        rotation: makeMutable(0),
      },
      createdAt: 0,
    };

    const drag: DragPieceEntity = {
      id: `drag-${pieceKey}`,
      kind: 'dragPiece',
      pieceId: state.current.defId,
      shape: s,
      shape0,
      cellsW: w,
      cellsH: h,
      phase: makeMutable<Phase>(PHASE.IDLE),
      transform: {
        x: makeMutable(-9999),
        y: makeMutable(-9999),
        scale: makeMutable(1),
        opacity: makeMutable(0),
        rotation: makeMutable(0),
      },
      createdAt: 0,
    };

    entitiesRef.current = { ghost, drag, key: pieceKey };
    return { ghost, drag };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceKey]);

  // -----------------------------------------------------------------
  // Worklet-side references to the entities' SharedValues.
  // Worklets can't close over refs, so we hoist the SVs out.
  // -----------------------------------------------------------------

  const ghostAnchorSV = entities.ghost.anchor;
  const ghostValidSV = entities.ghost.valid;
  const ghostLandedSV = entities.ghost.landed;
  const ghostClearingOpacitySV = entities.ghost.clearingOpacity;
  const ghostOpacitySV = entities.ghost.transform.opacity;

  const dragXSV = entities.drag.transform.x;
  const dragYSV = entities.drag.transform.y;
  const dragOpacitySV = entities.drag.transform.opacity;
  const dragScaleSV = entities.drag.transform.scale;

  // Tracks the logical drag state for the worklet side.
  const isDragging = useSharedValue(false);
  const didExceedTap = useSharedValue(false);
  // Set to true in onEnd for a valid drop so onFinalize doesn't prematurely
  // clear isDragging before the new piece arrives in React state.
  const wasValidDrop = useSharedValue(false);

  // -----------------------------------------------------------------
  // Pan — continuous drag. Activates on first movement.
  // -----------------------------------------------------------------

  const pan = Gesture.Pan()
    // 10px movement threshold so a plain tap can be recognised as
    // "rotate" by the competing Tap gesture. penta uses a first-delta
    // activation; we pick a small pixel threshold to match RN gesture
    // handler semantics without feeling laggy on pickup.
    .minDistance(10)
    .maxPointers(1)
    .onBegin((e) => {
      'worklet';
      if (!inputEnabled) return;
      const tr = trayRect.value;
      // Only arm a drag if the touch started inside the tray. Outside-tray
      // touches don't pick up a piece.
      if (
        e.absoluteX < tr.x ||
        e.absoluteX > tr.x + tr.width ||
        e.absoluteY < tr.y ||
        e.absoluteY > tr.y + tr.height
      ) {
        didExceedTap.value = true; // mark so tap doesn't fire outside
        return;
      }
      didExceedTap.value = false;
      // Reset clearing opacity so a fresh drag isn't stuck at 0 from a prior clear.
      ghostClearingOpacitySV.value = 1;
      // Pre-position the drag piece at the finger (invisible) so the first
      // frame after activation isn't jumpy.
      const dims = currentShapeDims.value;
      const shapePxW = dims.w * cellSize;
      const shapePxH = dims.h * cellSize;
      dragXSV.value = e.absoluteX - shapePxW / 2;
      dragYSV.value = e.absoluteY - shapePxH - FINGER_Y_OFFSET_PX;
    })
    .onStart(() => {
      'worklet';
      if (!inputEnabled) return;
      if (didExceedTap.value) return; // started outside tray
      isDragging.value = true;
      dragOpacitySV.value = withTiming(1, { duration: 120 });
      dragScaleSV.value = 1;
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      'worklet';
      if (!isDragging.value) return;

      // Position the piece using penta drag geometry (bottom-center + 40px).
      const dims = currentShapeDims.value;
      const { anchorX: pieceAnchorScreenX, anchorY: pieceAnchorScreenY } =
        fingerToAnchorPx(
          e.absoluteX,
          e.absoluteY,
          dims.w,
          dims.h,
          cellSize,
          /* minimapMode */ false,
        );
      dragXSV.value = pieceAnchorScreenX;
      dragYSV.value = pieceAnchorScreenY;

      // Translate to board-local for snap.
      const boardLocalAnchorX = pieceAnchorScreenX - boardOriginX.value;
      const boardLocalAnchorY = pieceAnchorScreenY - boardOriginY.value;

      // Clear snap when the piece anchor leaves the board area.
      // If already snapped, allow a 1.5-cell buffer before releasing
      // (consistent with KEEP_THRESHOLD_SQ); if not snapped, release immediately.
      const keepMarginPx = ghostValidSV.value ? 1.5 * cellSize : 0;
      if (
        boardLocalAnchorX < -keepMarginPx ||
        boardLocalAnchorY < -keepMarginPx ||
        boardLocalAnchorX > boardCols * cellSize + keepMarginPx ||
        boardLocalAnchorY > boardRows * cellSize + keepMarginPx
      ) {
        ghostOpacitySV.value = 0;
        ghostAnchorSV.value = { row: -1, col: -1 };
        ghostValidSV.value = false;
        return;
      }

      const prevAnchor = ghostAnchorSV.value;
      const prevValid = ghostValidSV.value;

      const result = ghostSnap(
        boardLocalAnchorX,
        boardLocalAnchorY,
        cellSize,
        currentShape.value,
        boardBits.value,
        boardCols,
        boardRows,
        prevAnchor,
        prevValid,
      );

      ghostAnchorSV.value = result.anchor;
      ghostValidSV.value = result.valid;
      // Fade ghost in/out by result.show. Worklet-side `withTiming` ok.
      ghostOpacitySV.value = result.show ? 1 : 0;

      // Fire onSnap when the ghost newly arrives at a valid cell — either
      // becoming valid for the first time, or moving to a different valid
      // cell. Invalid→invalid and stationary frames are skipped so the
      // haptic feels per-cell rather than continuous.
      if (
        onSnap &&
        result.valid &&
        (!prevValid ||
          result.anchor.row !== prevAnchor.row ||
          result.anchor.col !== prevAnchor.col)
      ) {
        runOnJS(onSnap)();
      }
    })
    .onEnd(() => {
      'worklet';
      if (!isDragging.value) return;

      const anchor = ghostAnchorSV.value;
      const valid = ghostValidSV.value;

      if (valid && anchor.row >= 0 && anchor.col >= 0) {
        // Valid drop: hide the drag piece immediately, but KEEP the ghost at
        // the landing position. The ghost acts as a 1-frame visual bridge
        // until JS spawns the real board-block entities and the new-piece
        // React re-render remounts GhostNode with anchor (-1,-1).
        // Both the ghost disappearing and the board blocks appearing land in
        // the same Skia commit, eliminating the blank-frame blink.
        wasValidDrop.value = true;
        dragOpacitySV.value = 0;
        // Switch ghost to solid-block look so the bridge frame looks like
        // the real block that's about to replace it.
        ghostLandedSV.value = true;
        runOnJS(onPlace)(anchor.row, anchor.col);
      } else {
        // Invalid release — clear ghost and drag piece immediately.
        isDragging.value = false;
        ghostOpacitySV.value = 0;
        ghostAnchorSV.value = { row: -1, col: -1 };
        ghostValidSV.value = false;
        dragOpacitySV.value = 0;
      }
    })
    .onFinalize(() => {
      'worklet';
      if (wasValidDrop.value) {
        // Valid drop — let PieceTrayV2 reset isDragging once the new piece lands.
        wasValidDrop.value = false;
        return;
      }
      // Belt-and-suspenders: cancelled gesture — reset everything.
      if (isDragging.value) {
        isDragging.value = false;
        ghostOpacitySV.value = 0;
        ghostAnchorSV.value = { row: -1, col: -1 };
        ghostValidSV.value = false;
        dragOpacitySV.value = 0;
      }
    });

  // -----------------------------------------------------------------
  // Tap — rotate. Fires only if the user released without moving.
  // Race with Pan: Pan wins if any movement occurs.
  // -----------------------------------------------------------------

  const tap = Gesture.Tap()
    .maxDuration(400)
    .onEnd((e, success) => {
      'worklet';
      if (!success || !inputEnabled) return;
      // Only rotate if the tap landed inside the tray.
      const tr = trayRect.value;
      if (
        e.absoluteX < tr.x ||
        e.absoluteX > tr.x + tr.width ||
        e.absoluteY < tr.y ||
        e.absoluteY > tr.y + tr.height
      ) {
        return;
      }
      runOnJS(onRotate)();
    });

  const gesture = Gesture.Race(pan, tap);

  return {
    gesture,
    ghost: entities.ghost,
    drag: entities.drag,
    /** True while a piece is in the player's hand. Consumers (tray) can
     * hide the source slot while the piece is being dragged. */
    isDragging,
    /** Worklet-shareable board occupancy. Exposed so the board canvas can
     * render the line-clear hint without rebuilding the snapshot. */
    boardBits,
  };
}
