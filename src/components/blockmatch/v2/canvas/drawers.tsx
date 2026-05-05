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

/** Off-white marker color used for arrows / cross / dots. */
const OBS_MARKER = '#FAF7F2D9'; // cream @ 85% — cohesive with board bg
/** Composite "light off" — barely visible against the charcoal fill. */
const OBS_MARKER_OFF = '#FAF7F226';

/**
 * Build a left-right / up-down arrow as a Skia Path.
 * - One straight line through the center
 * - Chevron heads at each end pointing outward
 * `axis` chooses horizontal (←—→) vs vertical (↑—↓).
 */
function makeArrowPath(size: number, axis: 'h' | 'v') {
  const inset = CELL_INSET_PX;
  const span = size - 2 * inset;
  const c = size / 2;
  // Endpoint offset from edge — leave a little padding so the chevron tip
  // doesn't touch the rounded-rect border.
  const endPad = span * 0.18;
  const a = inset + endPad; // start coord along axis
  const b = inset + span - endPad; // end coord along axis
  // Chevron geometry: how far the head extends back from the tip,
  // and how far it spreads perpendicular to the axis.
  const chev = span * 0.16;

  const p = Skia.Path.Make();
  if (axis === 'h') {
    p.moveTo(a, c);
    p.lineTo(b, c);
    // Left head
    p.moveTo(a + chev, c - chev);
    p.lineTo(a, c);
    p.lineTo(a + chev, c + chev);
    // Right head
    p.moveTo(b - chev, c - chev);
    p.lineTo(b, c);
    p.lineTo(b - chev, c + chev);
  } else {
    p.moveTo(c, a);
    p.lineTo(c, b);
    // Top head
    p.moveTo(c - chev, a + chev);
    p.lineTo(c, a);
    p.lineTo(c + chev, a + chev);
    // Bottom head
    p.moveTo(c - chev, b - chev);
    p.lineTo(c, b);
    p.lineTo(c + chev, b - chev);
  }
  return p;
}

/** Single horizontal arrow (←—→) centered in the tile. */
function HorizMarker({ size }: { size: number }) {
  const path = useMemo(() => makeArrowPath(size, 'h'), [size]);
  const stroke = Math.max(2, size * 0.07);
  return (
    <Path
      path={path}
      color={OBS_MARKER}
      style="stroke"
      strokeWidth={stroke}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}

/** Single vertical arrow (↑—↓) centered in the tile. */
function VertMarker({ size }: { size: number }) {
  const path = useMemo(() => makeArrowPath(size, 'v'), [size]);
  const stroke = Math.max(2, size * 0.07);
  return (
    <Path
      path={path}
      color={OBS_MARKER}
      style="stroke"
      strokeWidth={stroke}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}

/** Stacked dots — readable "hits remaining". hp=2 → two dots, hp=1 → one centered dot. */
function Durable2Marker({ size, hp }: { size: number; hp: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.07;
  const gap = size * 0.13;
  if (hp >= 2) {
    return (
      <Group>
        <RoundedRect
          x={cx - r}
          y={cy - gap - r}
          width={r * 2}
          height={r * 2}
          r={r}
          color={OBS_MARKER}
        />
        <RoundedRect
          x={cx - r}
          y={cy + gap - r}
          width={r * 2}
          height={r * 2}
          r={r}
          color={OBS_MARKER}
        />
      </Group>
    );
  }
  return (
    <RoundedRect
      x={cx - r}
      y={cy - r}
      width={r * 2}
      height={r * 2}
      r={r}
      color={OBS_MARKER}
    />
  );
}

/**
 * Cross (┼) — composite "needs both H and V" hint.
 *
 * Each arm is a "light": lit (cream) while that direction is still required,
 * dimmed (near-invisible) once the player has cleared a line in that
 * direction. needsH / needsV drive the lit state directly.
 */
function CompositeMarker({
  size,
  needsH,
  needsV,
}: {
  size: number;
  needsH: number;
  needsV: number;
}) {
  const hPath = useMemo(() => makeArrowPath(size, 'h'), [size]);
  const vPath = useMemo(() => makeArrowPath(size, 'v'), [size]);
  const stroke = Math.max(2, size * 0.07);
  return (
    <Group>
      <Path
        path={hPath}
        color={needsH > 0 ? OBS_MARKER : OBS_MARKER_OFF}
        style="stroke"
        strokeWidth={stroke}
        strokeCap="round"
        strokeJoin="round"
      />
      <Path
        path={vPath}
        color={needsV > 0 ? OBS_MARKER : OBS_MARKER_OFF}
        style="stroke"
        strokeWidth={stroke}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

export function ObstacleShape({
  size,
  obstacleId,
  hp,
  needsH,
  needsV,
}: {
  size: number;
  obstacleId: ObstacleId;
  hp: number;
  needsH: number;
  needsV: number;
}) {
  const fill = OBS_FILL[obstacleId];

  let marker: React.ReactNode = null;
  if (obstacleId === 'horiz') marker = <HorizMarker size={size} />;
  else if (obstacleId === 'vert') marker = <VertMarker size={size} />;
  else if (obstacleId === 'durable2') marker = <Durable2Marker size={size} hp={hp} />;
  else if (obstacleId === 'composite')
    marker = <CompositeMarker size={size} needsH={needsH} needsV={needsV} />;
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
