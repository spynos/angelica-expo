import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import type { Cell as CellType, ObstacleId } from '@/src/lib/blockmatch/types';

export const PLAYER_BLOCK_COLOR = '#2E7D6B';
export const PLAYER_BLOCK_HIGHLIGHT = '#3E9F87';

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
  ghost,
  invalidGhost,
}: {
  cell: CellType;
  size: number;
  ghost?: boolean;
  invalidGhost?: boolean;
}) {
  const dim = size - 2;
  let backgroundColor: string | undefined;
  let opacity = 1;
  let label: string | undefined;

  if (cell.kind === 'block') {
    backgroundColor = PLAYER_BLOCK_COLOR;
  } else if (cell.kind === 'obstacle') {
    backgroundColor = OBSTACLE_COLOR[cell.obstacle.id];
    if (cell.obstacle.id === 'durable2' && cell.obstacle.hp > 0) {
      label = String(cell.obstacle.hp);
    }
  }

  if (ghost && !invalidGhost) {
    backgroundColor = PLAYER_BLOCK_HIGHLIGHT;
    opacity = 0.45;
  }

  const isHoriz = cell.kind === 'obstacle' && cell.obstacle.id === 'horiz';
  const isVert = cell.kind === 'obstacle' && cell.obstacle.id === 'vert';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.inner,
          {
            width: dim,
            height: dim,
            backgroundColor: backgroundColor ?? 'transparent',
            borderColor: backgroundColor ? 'transparent' : '#E2DDD3',
            borderWidth: backgroundColor ? 0 : 1,
            opacity,
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
