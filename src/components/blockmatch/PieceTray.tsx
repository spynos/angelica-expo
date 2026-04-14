import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { ActivePiece } from '@/src/lib/blockmatch/types';

import { DraggablePiece, type BoardOrigin } from './DraggablePiece';
import { PieceShapeView } from './PieceShape';

export function PieceTray({
  current,
  next,
  cellSize,
  previewSize,
  boardOrigin,
  enabled,
  onHover,
  onDrop,
  onRotate,
}: {
  current: ActivePiece;
  next: [ActivePiece, ActivePiece];
  cellSize: number;
  previewSize: number;
  boardOrigin: BoardOrigin | null;
  enabled: boolean;
  onHover: (target: { row: number; col: number } | null) => void;
  onDrop: (target: { row: number; col: number } | null) => void;
  onRotate: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.currentSlot}>
        <DraggablePiece
          piece={current}
          cellSize={cellSize}
          boardOrigin={boardOrigin}
          enabled={enabled}
          onHover={onHover}
          onDrop={onDrop}
          onTap={onRotate}
        />
      </View>
      <View style={styles.previews}>
        <PreviewSlot piece={next[0]} cellSize={previewSize} />
        <PreviewSlot piece={next[1]} cellSize={previewSize} />
      </View>
    </View>
  );
}

function PreviewSlot({ piece, cellSize }: { piece: ActivePiece; cellSize: number }) {
  return (
    <View style={styles.previewSlot}>
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
    flex: 1,
    minHeight: 120,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  previews: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewSlot: {
    width: 76,
    height: 76,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
