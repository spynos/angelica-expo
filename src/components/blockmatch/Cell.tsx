import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette, Radius } from '@/constants/theme';
import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import type { Cell as CellType, ObstacleId } from '@/src/lib/blockmatch/types';

import { BeveledBlock } from './BeveledBlock';

const OBSTACLE_COLOR: Record<ObstacleId, string> = {
  basic: '#5A554D',
  horiz: '#C8773A',
  vert: '#5C4A8F',
  durable2: '#A05E28',
  composite: '#3D3B38',
};

export const BlockmatchCell = memo(function BlockmatchCell({
  cell,
  size,
}: {
  cell: CellType;
  size: number;
}) {
  const dim = size - 2;

  if (cell.kind === 'block') {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <BeveledBlock size={dim} color={colorForPieceId(cell.pieceId)} />
      </View>
    );
  }

  if (cell.kind === 'obstacle') {
    const backgroundColor = OBSTACLE_COLOR[cell.obstacle.id];
    const isHoriz = cell.obstacle.id === 'horiz';
    const isVert = cell.obstacle.id === 'vert';
    const label = cell.obstacle.id === 'durable2' && cell.obstacle.hp > 0 ? String(cell.obstacle.hp) : undefined;

    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <View
          style={[
            styles.inner,
            {
              width: dim,
              height: dim,
              backgroundColor,
            },
          ]}
        >
          {isHoriz ? <View style={styles.horizStripe} /> : null}
          {isVert ? <View style={styles.vertStripe} /> : null}
          {label ? (
            <View style={styles.labelWrap}>
              <Stripes label={label} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // empty cell — solid darker tint reads as a grid square against the board bg.
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.inner,
          { width: dim, height: dim, backgroundColor: Palette.boardWarm.emptyTint },
        ]}
      />
    </View>
  );
});

function Stripes({ label }: { label: string }) {
  return (
    <View style={styles.labelInner}>
      {/* simple text via View+font omitted to avoid Text import here */}
      <View style={styles.dot} />
      {label === '2' ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  inner: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizStripe: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: '45%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  vertStripe: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: '45%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  labelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  labelInner: { flexDirection: 'row', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
});
