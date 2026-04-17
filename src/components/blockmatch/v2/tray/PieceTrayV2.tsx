import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Palette, Radius } from '@/constants/theme';
import type { GameState } from '@/src/lib/blockmatch/types';
import { DUR_SPAWN } from '../engine/constants';
import { PiecePreview } from './PiecePreview';

/**
 * Current + next×2 preview tray.
 *
 * `turns` is owned by BlockMatchGameV2 and shared with DragPieceOverlay so
 * bevel direction is identical in the tray slot and while the piece is held.
 * Both components render rotations[0] + an outer rigid rotation; this keeps
 * bevel faces stable (bottom always dark) regardless of rotationIdx.
 */

export function PieceTrayV2({
  state,
  currentCellSize,
  nextCellSize,
  isDragging,
  turns,
}: {
  state: GameState;
  currentCellSize: number;
  nextCellSize: number;
  /** True while the current piece is being dragged — the slot is hidden
   * so the player sees the piece only in hand, not duplicated. */
  isDragging?: SharedValue<boolean>;
  /** Rotation in turns for the current piece slot. Owned by the parent and
   * shared with DragPieceOverlay so bevel direction stays consistent. */
  turns: SharedValue<number>;
}) {
  const current = state.current;
  const [next1, next2] = state.next;

  // Fade-in opacity for the spawned piece. Starts at 1 for the initial
  // piece (no fade on first mount), then animates 0 → 1 per piece advance.
  const spawnOpacity = useSharedValue(1);
  // Track rngState (not defId) so we detect every piece advance, including
  // when the next piece happens to share the same defId as the current one.
  const prevRngStateRef = useRef(state.rngState);

  useEffect(() => {
    if (state.rngState !== prevRngStateRef.current) {
      prevRngStateRef.current = state.rngState;
      // The PiecePreview below is keyed by rngState, so React unmounts the
      // old Skia canvas and mounts a fresh one. The slot stays hidden via
      // isDragging=true while the new canvas mounts, then fades in.
      const _dragging = isDragging;
      const _opacity = spawnOpacity;
      _opacity.value = 0;
      const timer = setTimeout(() => {
        if (_dragging) _dragging.value = false;
        _opacity.value = withTiming(1, { duration: DUR_SPAWN });
      }, 32);
      return () => clearTimeout(timer);
    }
  }, [state.rngState, spawnOpacity, isDragging]);

  // Only opacity lives on the RN wrapper now. Rotation is applied
  // entirely inside PiecePreview's Skia scene so the whole piece
  // rotates as one solid unit instead of drifting between view-tree
  // and canvas-tree transforms.
  const currentStyle = useAnimatedStyle(() => {
    const dragging = isDragging ? isDragging.value : false;
    return { opacity: dragging ? 0 : spawnOpacity.value };
  });

  return (
    <View style={styles.tray}>
      <View style={styles.currentBox}>
        <View style={styles.pieceBg} />
        <Animated.View style={currentStyle}>
          {/* Key by rngState: React unmounts the old Skia canvas and mounts
              a fresh one when the piece advances. This guarantees no stale
              scene graph from the previous piece can leak through. */}
          <PiecePreview
            key={state.rngState}
            defId={current.defId}
            cellSize={currentCellSize}
            turns={turns}
          />
        </Animated.View>
      </View>

      <View style={styles.nextBox}>
        <View style={styles.pieceBg} />
        <PiecePreview
          defId={next1.defId}
          cellSize={nextCellSize}
          staticTurns={next1.rotationIdx * 0.25}
        />
        <PiecePreview
          defId={next2.defId}
          cellSize={nextCellSize}
          staticTurns={next2.rotationIdx * 0.25}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  nextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  pieceBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.boardWarm.emptyTint,
    borderRadius: Radius.md,
  },
});
