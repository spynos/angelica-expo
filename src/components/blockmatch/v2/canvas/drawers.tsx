import { useMemo } from 'react';
import { Group, Path, Rect, RoundedRect, Skia } from '@shopify/react-native-skia';

import type { ObstacleId } from '@/src/lib/blockmatch/types';

import {
  BOARD_BG_COLOR,
  BOARD_GRID_COLOR,
  CELL_INSET_PX,
  CELL_RADIUS_RATIO,
  EMPTY_CELL_STROKE_PX,
} from '../engine/constants';

/**
 * Static visual primitives for the board canvas (flat-paint era — ADR 003).
 *
 * The board is rendered as a grid of rounded "tiles" sitting on a cream
 * background with visible inter-cell gutters. There is no bevel, no
 * highlight gradient, and no per-face shading — every block is a single
 * fill color and every obstacle is a single fill plus a flat marker.
 */

// ---------------------------------------------------------------------------
// FlatBlockShape — single rounded rect, single fill.
// Sits inside one logical cell (size × size); the rounded rect is inset
// by CELL_INSET_PX so adjacent tiles read as separated.
// ---------------------------------------------------------------------------

export function FlatBlockShape({
  size,
  fill,
  inset = CELL_INSET_PX,
  radius = size * CELL_RADIUS_RATIO,
  children,
}: {
  size: number;
  fill: string;
  inset?: number;
  radius?: number;
  /** Optional Skia paint children (e.g. <Shadow/>) forwarded to the rect. */
  children?: React.ReactNode;
}) {
  const dim = Math.max(0, size - 2 * inset);
  return (
    <RoundedRect x={inset} y={inset} width={dim} height={dim} r={radius} color={fill}>
      {children}
    </RoundedRect>
  );
}

// ---------------------------------------------------------------------------
// Obstacle palette (flat era).
// Each type still gets a distinct hue + flat marker so players can read
// behaviour at a glance, but no extruded geometry, no offwhite/black bevel
// overlays, no pulsing icon — the look is intentionally calm.
// ---------------------------------------------------------------------------

const OBS_FILL: Record<ObstacleId, string> = {
  basic: '#5A554D', // charcoal
  horiz: '#C8773A', // mustard orange
  vert: '#7A6BA3', // dusty purple
  durable2: '#8E6A3A', // bronze
  composite: '#5A554D', // charcoal — type signaled by cross marker
};

/** Off-white marker color used for stripes / cross / dots. */
const OBS_MARKER = '#FAF7F2D9'; // cream @ 85% — cohesive with board bg
const OBS_MARKER_DIM = '#FAF7F299';

/** Two horizontal stripes centered in the tile. */
function HorizMarker({ size }: { size: number }) {
  const inset = CELL_INSET_PX;
  const w = size - 2 * inset;
  const stripeH = Math.max(2, size * 0.07);
  const cy = size / 2;
  const gap = size * 0.13;
  const y1 = cy - gap - stripeH / 2;
  const y2 = cy + gap - stripeH / 2;
  const x = inset + w * 0.18;
  const stripeW = w * 0.64;
  return (
    <Group>
      <RoundedRect x={x} y={y1} width={stripeW} height={stripeH} r={stripeH / 2} color={OBS_MARKER} />
      <RoundedRect x={x} y={y2} width={stripeW} height={stripeH} r={stripeH / 2} color={OBS_MARKER} />
    </Group>
  );
}

/** Two vertical stripes centered in the tile. */
function VertMarker({ size }: { size: number }) {
  const inset = CELL_INSET_PX;
  const h = size - 2 * inset;
  const stripeW = Math.max(2, size * 0.07);
  const cx = size / 2;
  const gap = size * 0.13;
  const x1 = cx - gap - stripeW / 2;
  const x2 = cx + gap - stripeW / 2;
  const y = inset + h * 0.18;
  const stripeH = h * 0.64;
  return (
    <Group>
      <RoundedRect x={x1} y={y} width={stripeW} height={stripeH} r={stripeW / 2} color={OBS_MARKER} />
      <RoundedRect x={x2} y={y} width={stripeW} height={stripeH} r={stripeW / 2} color={OBS_MARKER} />
    </Group>
  );
}

/** Two stacked dots — readable "2 hits remaining". When hp=1 only one dot. */
function Durable2Marker({ size, hp }: { size: number; hp: number }) {
  const cx = size / 2;
  const r = size * 0.07;
  const gap = size * 0.13;
  return (
    <Group>
      <RoundedRect
        x={cx - r}
        y={cx - gap - r}
        width={r * 2}
        height={r * 2}
        r={r}
        color={OBS_MARKER}
      />
      <RoundedRect
        x={cx - r}
        y={cx + gap - r}
        width={r * 2}
        height={r * 2}
        r={r}
        color={hp >= 2 ? OBS_MARKER : OBS_MARKER_DIM}
      />
    </Group>
  );
}

/** Cross (┼) — composite "needs both H and V" hint. */
function CompositeMarker({ size }: { size: number }) {
  const inset = CELL_INSET_PX;
  const w = size - 2 * inset;
  const stroke = Math.max(2, size * 0.07);
  const cx = size / 2;
  const cy = size / 2;
  const armLen = w * 0.56;
  return (
    <Group>
      <RoundedRect
        x={cx - armLen / 2}
        y={cy - stroke / 2}
        width={armLen}
        height={stroke}
        r={stroke / 2}
        color={OBS_MARKER}
      />
      <RoundedRect
        x={cx - stroke / 2}
        y={cy - armLen / 2}
        width={stroke}
        height={armLen}
        r={stroke / 2}
        color={OBS_MARKER}
      />
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
  const fill = OBS_FILL[obstacleId];

  let marker: React.ReactNode = null;
  if (obstacleId === 'horiz') marker = <HorizMarker size={size} />;
  else if (obstacleId === 'vert') marker = <VertMarker size={size} />;
  else if (obstacleId === 'durable2') marker = <Durable2Marker size={size} hp={hp} />;
  else if (obstacleId === 'composite') marker = <CompositeMarker size={size} />;
  // basic: no marker — just the charcoal tile.

  return (
    <Group>
      <FlatBlockShape size={size} fill={fill} />
      {marker}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Board background — solid cream + hairline empty-cell outlines.
// One precomputed Path holds the union of all empty-cell rounded-rect outlines
// so the entire grid is a single stroke draw call.
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

  const outlinePath = useMemo(() => {
    const inset = CELL_INSET_PX;
    const radius = cellSize * CELL_RADIUS_RATIO;
    const dim = cellSize - 2 * inset;
    const p = Skia.Path.Make();
    for (let r = 0; r < boardRows; r++) {
      for (let c = 0; c < boardCols; c++) {
        const x = c * cellSize + inset;
        const y = r * cellSize + inset;
        p.addRRect({
          rect: { x, y, width: dim, height: dim },
          rx: radius,
          ry: radius,
        });
      }
    }
    return p;
  }, [boardCols, boardRows, cellSize]);

  return (
    <Group>
      <Rect x={0} y={0} width={boardW} height={boardH} color={BOARD_BG_COLOR} />
      <Path
        path={outlinePath}
        color={BOARD_GRID_COLOR}
        style="stroke"
        strokeWidth={EMPTY_CELL_STROKE_PX}
      />
    </Group>
  );
}
