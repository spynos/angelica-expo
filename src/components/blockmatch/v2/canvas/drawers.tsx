import { useMemo } from 'react';
import {
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  vec,
} from '@shopify/react-native-skia';

import type { BevelColors } from '@/src/lib/blockmatch/colors';
import type { ObstacleId } from '@/src/lib/blockmatch/types';

import {
  BOARD_BG_COLOR,
  BOARD_GRID_COLOR,
  DEFAULT_BEVEL_FRACTION,
  EMPTY_CELL_TINT,
} from '../engine/constants';

/**
 * Static visual primitives for the board canvas.
 *
 * These components emit declarative Skia elements sized for a single cell.
 * They own no SharedValues and no animation; motion is applied by a parent
 * `<Group transform opacity>` on the EntityNode. Keeping the shape itself
 * static lets the same sub-tree be mounted/unmounted by React with zero
 * animation impact on already-running entities.
 */

// ---------------------------------------------------------------------------
// Beveled block shape — 4 trapezoid faces + inner highlight gradient.
// Matches penta_block_blast's BeveledBlock (see docs/penta-block-blast-reference.md §4.1).
// ---------------------------------------------------------------------------

const HIGHLIGHT_COLORS = ['#FFF6DFB0', '#FFF6DF74', '#FFF6DF23'];
const HIGHLIGHT_STOPS = [0.37, 0.688, 1];

export function BeveledBlockShape({
  size,
  colors,
  bevelFraction,
}: {
  size: number;
  colors: BevelColors;
  bevelFraction: number;
}) {
  const { b, inner, paths } = useMemo(() => {
    const bv = Math.min(size * bevelFraction, size / 2);
    const i = size - 2 * bv;
    return {
      b: bv,
      inner: i,
      paths: {
        top: `M0 0 L${size} 0 L${size - bv} ${bv} L${bv} ${bv} Z`,
        left: `M0 0 L${bv} ${bv} L${bv} ${size - bv} L0 ${size} Z`,
        right: `M${size} 0 L${size} ${size} L${size - bv} ${size - bv} L${size - bv} ${bv} Z`,
        bottom: `M0 ${size} L${size} ${size} L${size - bv} ${size - bv} L${bv} ${size - bv} Z`,
        highlight: `M0 0 L${size} 0 L${size - bv} ${bv} L${size - bv} ${size / 2} L${bv} ${size / 2} L${bv} ${bv} Z`,
      },
    };
  }, [size, bevelFraction]);

  return (
    <Group>
      <Rect x={0} y={0} width={size} height={size} color={colors.base} />
      <Path path={paths.top} color={colors.top} />
      <Path path={paths.left} color={colors.left} />
      <Path path={paths.right} color={colors.right} />
      <Path path={paths.bottom} color={colors.bottom} />
      <Rect x={b} y={b} width={inner} height={inner} color={colors.base} />
      <Path path={paths.highlight}>
        <LinearGradient
          start={vec(size * 0.481, 0)}
          end={vec(size * 0.517, size * 0.777)}
          colors={HIGHLIGHT_COLORS}
          positions={HIGHLIGHT_STOPS}
        />
      </Path>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Obstacle shapes (5 kinds).
// angelica-specific palette: obstacles are a greyscale family separate from
// the coloured player blocks. See Part A.3 of the planning discussion.
// ---------------------------------------------------------------------------

const OBS_BOLT = '#404040';
const OBS_CRACK = '#202020';
const OBS_ACCENT = '#E1FF00';
const OBS_GENERIC_DOT = '#FF0000';

// Bevel color sets for each obstacle state (grey palette, face shifts ±15/6/30).
const OBS_BEVEL_BASIC: BevelColors = {
  base: '#C5C5C5',
  top: '#EBEBEB',
  left: '#D4D4D4',
  right: '#9F9F9F',
  bottom: '#797979',
};
const OBS_BEVEL_FRESH: BevelColors = {
  base: '#A0A0A0',
  top: '#C6C6C6',
  left: '#B0B0B0',
  right: '#7A7A7A',
  bottom: '#535353',
};
const OBS_BEVEL_CRACKED: BevelColors = {
  base: '#808080',
  top: '#A6A6A6',
  left: '#8F8F8F',
  right: '#5A5A5A',
  bottom: '#333333',
};

function ArrowsHoriz({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const arm = size * 0.18;
  const bar = size * 0.08;
  const offset = size * 0.22;
  // Two opposing arrows + center bar. Single filled path each to keep
  // element count low; penta renders these as blinking yellow icons.
  const left = `M${cx - offset} ${cy} L${cx - offset + arm} ${cy - arm} L${cx - offset + arm} ${cy - bar} L${cx} ${cy - bar} L${cx} ${cy + bar} L${cx - offset + arm} ${cy + bar} L${cx - offset + arm} ${cy + arm} Z`;
  const right = `M${cx + offset} ${cy} L${cx + offset - arm} ${cy - arm} L${cx + offset - arm} ${cy - bar} L${cx} ${cy - bar} L${cx} ${cy + bar} L${cx + offset - arm} ${cy + bar} L${cx + offset - arm} ${cy + arm} Z`;
  return (
    <Group>
      <Path path={left} color={OBS_ACCENT} />
      <Path path={right} color={OBS_ACCENT} />
    </Group>
  );
}

function ArrowsVert({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const arm = size * 0.18;
  const bar = size * 0.08;
  const offset = size * 0.22;
  const up = `M${cx} ${cy - offset} L${cx - arm} ${cy - offset + arm} L${cx - bar} ${cy - offset + arm} L${cx - bar} ${cy} L${cx + bar} ${cy} L${cx + bar} ${cy - offset + arm} L${cx + arm} ${cy - offset + arm} Z`;
  const dn = `M${cx} ${cy + offset} L${cx - arm} ${cy + offset - arm} L${cx - bar} ${cy + offset - arm} L${cx - bar} ${cy} L${cx + bar} ${cy} L${cx + bar} ${cy + offset - arm} L${cx + arm} ${cy + offset - arm} Z`;
  return (
    <Group>
      <Path path={up} color={OBS_ACCENT} />
      <Path path={dn} color={OBS_ACCENT} />
    </Group>
  );
}

function ArmorBolts({ size }: { size: number }) {
  const r = size * 0.06;
  const inset = size * 0.18;
  return (
    <Group>
      <Circle cx={inset} cy={inset} r={r} color={OBS_BOLT} />
      <Circle cx={size - inset} cy={inset} r={r} color={OBS_BOLT} />
      <Circle cx={inset} cy={size - inset} r={r} color={OBS_BOLT} />
      <Circle cx={size - inset} cy={size - inset} r={r} color={OBS_BOLT} />
    </Group>
  );
}

function CrackPattern({ size }: { size: number }) {
  // Jagged crack path — single stroke so the grey body reads through.
  const w = size * 0.06;
  const p = `M${size * 0.2} ${size * 0.3} L${size * 0.45} ${size * 0.48} L${size * 0.3} ${size * 0.6} L${size * 0.7} ${size * 0.75}`;
  return <Path path={p} color={OBS_CRACK} style="stroke" strokeWidth={w} />;
}

function CompositeBadge({ size }: { size: number }) {
  // h/v needs — draw both horiz and vert arrow markers but smaller and at
  // opposite corners. The engine tracks needs.h / needs.v separately so we
  // can later dim whichever has already been satisfied.
  const sz = size * 0.7;
  const off = (size - sz) / 2;
  return (
    <Group transform={[{ translateX: off }, { translateY: off }]}>
      <ArrowsHoriz size={sz} />
      <ArrowsVert size={sz} />
    </Group>
  );
}

export function ObstacleShape({
  size,
  obstacleId,
  hp,
}: {
  size: number;
  obstacleId: ObstacleId;
  hp: number;
}) {
  if (obstacleId === 'durable2') {
    const cracked = hp <= 1;
    return (
      <Group>
        <BeveledBlockShape
          size={size}
          colors={cracked ? OBS_BEVEL_CRACKED : OBS_BEVEL_FRESH}
          bevelFraction={DEFAULT_BEVEL_FRACTION}
        />
        {cracked ? <CrackPattern size={size} /> : <ArmorBolts size={size} />}
      </Group>
    );
  }

  let badge: React.ReactNode = null;
  if (obstacleId === 'basic') {
    badge = (
      <Circle cx={size / 2} cy={size / 2} r={size * 0.08} color={OBS_GENERIC_DOT} />
    );
  } else if (obstacleId === 'horiz') {
    badge = <ArrowsHoriz size={size} />;
  } else if (obstacleId === 'vert') {
    badge = <ArrowsVert size={size} />;
  } else if (obstacleId === 'composite') {
    badge = <CompositeBadge size={size} />;
  }

  return (
    <Group>
      <BeveledBlockShape
        size={size}
        colors={OBS_BEVEL_BASIC}
        bevelFraction={DEFAULT_BEVEL_FRACTION}
      />
      {badge}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Board background — solid fill + full grid.
// Matches penta: antiAlias off, 1 physical-pixel grid, pixel-center snap.
// ---------------------------------------------------------------------------

export function BoardBackground({
  boardCols,
  boardRows,
  cellSize,
}: {
  boardCols: number;
  boardRows: number;
  cellSize: number;
}) {
  const boardW = boardCols * cellSize;
  const boardH = boardRows * cellSize;

  // Build a single SVG path for all grid lines; one draw call. Pixel center
  // snap (+0.5) prevents the half-pixel shimmer described in penta reference.
  const gridPath = useMemo(() => {
    const parts: string[] = [];
    for (let c = 0; c <= boardCols; c++) {
      const x = Math.round(c * cellSize);
      parts.push(`M${x} 0 L${x} ${boardH}`);
    }
    for (let r = 0; r <= boardRows; r++) {
      const y = Math.round(r * cellSize);
      parts.push(`M0 ${y} L${boardW} ${y}`);
    }
    return parts.join(' ');
  }, [boardCols, boardRows, cellSize, boardW, boardH]);

  // Faint tint on every empty cell to emphasise the well. Optional; comment
  // out if it muddies the feel.
  const tintPaths = useMemo(() => {
    // Single path with many squares is lighter than one Rect per cell when
    // the board is mostly empty.
    const parts: string[] = [];
    for (let r = 0; r < boardRows; r++) {
      for (let c = 0; c < boardCols; c++) {
        const x = c * cellSize + 1;
        const y = r * cellSize + 1;
        const s = cellSize - 2;
        parts.push(`M${x} ${y} h${s} v${s} h-${s} Z`);
      }
    }
    return parts.join(' ');
  }, [boardCols, boardRows, cellSize]);

  return (
    <Group>
      <Rect x={0} y={0} width={boardW} height={boardH} color={BOARD_BG_COLOR} />
      <Path path={tintPaths} color={EMPTY_CELL_TINT} />
      <Path path={gridPath} color={BOARD_GRID_COLOR} style="stroke" strokeWidth={0.5} />
    </Group>
  );
}
