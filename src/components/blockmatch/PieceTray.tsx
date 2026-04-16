import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import type { ActivePiece } from '@/src/lib/blockmatch/types';

import { DraggablePiece } from './DraggablePiece';
import { PieceShapeView, shapeBounds, shapeFor } from './PieceShape';

const CURRENT_SLOT_PADDING = Spacing.sm;
const PREVIEW_SLOT_PADDING = 4;
const MIN_CELL_SIZE = 8;

/**
 * Compute the largest cell size that fits a piece (by its bounding box)
 * inside a slot, respecting slot padding and an upper bound.
 */
function fitCellSize(
  piece: ActivePiece,
  slotW: number,
  slotH: number,
  padding: number,
  maxCell: number,
) {
  const { rows, cols } = shapeBounds(shapeFor(piece));
  const byW = (slotW - padding * 2) / cols;
  const byH = (slotH - padding * 2) / rows;
  return Math.max(MIN_CELL_SIZE, Math.floor(Math.min(byW, byH, maxCell)));
}

export function PieceTray({
  current,
  next,
  currentSlotWidth,
  currentSlotHeight,
  previewSlotSize,
  maxCellSize,
  maxPreviewCellSize,
  enabled,
  dragX,
  dragY,
  isDragging,
  restoreKey,
  onDrop,
  onRotate,
  onDragMove,
  onDragEnd,
}: {
  current: ActivePiece;
  next: [ActivePiece, ActivePiece];
  currentSlotWidth: number;
  currentSlotHeight: number;
  previewSlotSize: number;
  maxCellSize: number;
  maxPreviewCellSize: number;
  enabled: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  restoreKey: number;
  onDrop: (pos: { absX: number; absY: number } | null) => void;
  onRotate: () => void;
  onDragMove: (pos: { absX: number; absY: number } | null) => void;
  onDragEnd: () => void;
}) {
  const currentCell = fitCellSize(
    current,
    currentSlotWidth,
    currentSlotHeight,
    CURRENT_SLOT_PADDING,
    maxCellSize,
  );

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.currentSlot,
          { width: currentSlotWidth, height: currentSlotHeight },
        ]}
      >
        <DraggablePiece
          piece={current}
          cellSize={currentCell}
          enabled={enabled}
          dragX={dragX}
          dragY={dragY}
          isDragging={isDragging}
          restoreKey={restoreKey}
          onDrop={onDrop}
          onTap={onRotate}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      </View>
      <View style={styles.previews}>
        <PreviewSlot piece={next[0]} slotSize={previewSlotSize} maxCell={maxPreviewCellSize} />
        <PreviewSlot piece={next[1]} slotSize={previewSlotSize} maxCell={maxPreviewCellSize} />
      </View>
    </View>
  );
}

function PreviewSlot({
  piece,
  slotSize,
  maxCell,
}: {
  piece: ActivePiece;
  slotSize: number;
  maxCell: number;
}) {
  const cellSize = fitCellSize(piece, slotSize, slotSize, PREVIEW_SLOT_PADDING, maxCell);
  return (
    <View style={[styles.previewSlot, { width: slotSize, height: slotSize }]}>
      <PieceShapeView piece={piece} cellSize={cellSize} opacity={0.65} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  currentSlot: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: CURRENT_SLOT_PADDING,
  },
  previews: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewSlot: {
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: PREVIEW_SLOT_PADDING,
  },
});
