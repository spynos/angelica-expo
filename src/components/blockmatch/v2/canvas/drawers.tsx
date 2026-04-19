import { useMemo } from 'react';
import {
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import type { BevelColors } from '@/src/lib/blockmatch/colors';
import type { ObstacleId } from '@/src/lib/blockmatch/types';

import {
  BOARD_BG_COLOR,
  BOARD_GRID_COLOR,
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
//
// Faithful port of penta_block_blast's SpecialBlock (see the Flutter source
// at lib/game/components/special_block.dart). Every constant, path, and
// shading alpha below is copied 1:1 from the reference implementation so the
// obstacles here match the penta reference game exactly.
//
// Key design points:
//   1. Obstacles share the 4-face extruded frustum geometry of player blocks,
//      which is why they read as cohesive with the board's bevel language.
//   2. What sets them apart is the bevel INSET — directional/armor/cracked
//      use a shallow 9% rim, while `generic/basic` uses a steep 44% inset
//      that produces a tiny-apex pyramid. The sharp silhouette difference is
//      what makes obstacles pop against player pieces.
//   3. Shading is semi-transparent offWhite/black overlays (α 0.57/0.37/
//      0.10/0.22) on top of a grey base — softer "metallic" read than the
//      hue-preserving HSL shifts used on coloured player blocks.
//   4. Directional icons and the generic red dot pulse on a 1000ms
//      easeInOutSine 0↔1 sinusoid driven at the canvas level. Armor bolts
//      and cracks stay solid.
// ---------------------------------------------------------------------------

// Penta's bevel inset fractions. `_specialCenterInset = 4` and
// `_centerInset = 19` from SpecialBlockGeometry, both divided by the
// baseSize of 43.
const PENTA_INSET_DIRECTIONAL = 4 / 43;
const PENTA_INSET_GENERIC = 19 / 43;

// Bevel overlay colors — alpha hex suffixes computed from penta's paint
// opacities: 0.57→0x91, 0.37→0x5E, 0.10→0x1A, 0.22→0x38. offWhite is
// AppPalette.offWhite = #FFF6DF.
const OBS_BEVEL_TOP = '#FFF6DF91';
const OBS_BEVEL_LEFT = '#FFF6DF5E';
const OBS_BEVEL_RIGHT = '#0000001A';
const OBS_BEVEL_BOTTOM = '#00000038';

// Base body colors (penta special_block.dart line 264-266).
const OBS_BODY_STANDARD = '#C5C5C5';
const OBS_BODY_CRACKED = '#808080';

// Armor plate (penta: armor uses #A0A0A0 fill, #606060 stroke, #404040 bolts).
const OBS_ARMOR_FILL = '#A0A0A0';
const OBS_ARMOR_STROKE = '#606060';
const OBS_BOLT = '#404040';

// Crack / icon / dot colors (penta: #202020 cracks, #E1FF00 arrows, #FF0000 dot).
const OBS_CRACK = '#202020';
const OBS_ACCENT = '#E1FF00';
const OBS_GENERIC_DOT = '#FF0000';

// Penta authors all icon geometry against a 43×43 baseSize; these helpers
// scale those literal coords into whatever cell size we're drawing at.
function pentaPath(size: number, points: readonly (readonly [number, number])[]): string {
  const s = size / 43;
  return (
    points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x * s} ${y * s}`)
      .join(' ') + ' Z'
  );
}

// Path coordinates lifted verbatim from penta's SpecialBlockGeometry.
// (baseSize 43, so e.g. 21.505 ≈ center.)
const V_TOP_ARROW = [
  [21.505, 6.505],
  [15.7315, 16.505],
  [27.2785, 16.505],
] as const;
const V_BOT_ARROW = [
  [21.505, 37.505],
  [27.2785, 27.505],
  [15.7315, 27.505],
] as const;
const V_BAR = [
  [20.505, 15.505],
  [22.505, 15.505],
  [22.505, 28.505],
  [20.505, 28.505],
] as const;
const H_LEFT_ARROW = [
  [6, 22],
  [16, 27.7735],
  [16, 16.2265],
] as const;
const H_RIGHT_ARROW = [
  [37, 22],
  [27, 16.2265],
  [27, 27.7735],
] as const;
const H_BAR = [
  [15, 21],
  [28, 21],
  [28, 23],
  [15, 23],
] as const;

/**
 * Extruded frustum body — the common substrate for every obstacle type.
 *
 * Steps per penta's _SpecialBlockPainter.paint():
 *   1. Fill the full rect with `body` grey.
 *   2. Overlay the 4 trapezoid faces with penta's offWhite/black α-overlays
 *      so lighting matches the reference game exactly.
 *
 * The `inset` parameter selects either the shallow 9% bevel (directional /
 * armor / cracked) or the steep 44% pyramid (generic).
 */
function SpecialFrustum({
  size,
  body,
  inset,
}: {
  size: number;
  body: string;
  inset: number;
}) {
  const paths = useMemo(() => {
    const b = size * inset;
    return {
      top: `M0 0 L${size} 0 L${size - b} ${b} L${b} ${b} Z`,
      left: `M0 0 L${b} ${b} L${b} ${size - b} L0 ${size} Z`,
      right: `M${size} 0 L${size} ${size} L${size - b} ${size - b} L${size - b} ${b} Z`,
      bottom: `M0 ${size} L${size} ${size} L${size - b} ${size - b} L${b} ${size - b} Z`,
    };
  }, [size, inset]);

  return (
    <Group>
      <Rect x={0} y={0} width={size} height={size} color={body} />
      <Path path={paths.top} color={OBS_BEVEL_TOP} />
      <Path path={paths.left} color={OBS_BEVEL_LEFT} />
      <Path path={paths.right} color={OBS_BEVEL_RIGHT} />
      <Path path={paths.bottom} color={OBS_BEVEL_BOTTOM} />
    </Group>
  );
}

function ArrowsHoriz({ size }: { size: number }) {
  return (
    <Group>
      <Path path={pentaPath(size, H_LEFT_ARROW)} color={OBS_ACCENT} />
      <Path path={pentaPath(size, H_RIGHT_ARROW)} color={OBS_ACCENT} />
      <Path path={pentaPath(size, H_BAR)} color={OBS_ACCENT} />
    </Group>
  );
}

function ArrowsVert({ size }: { size: number }) {
  return (
    <Group>
      <Path path={pentaPath(size, V_TOP_ARROW)} color={OBS_ACCENT} />
      <Path path={pentaPath(size, V_BOT_ARROW)} color={OBS_ACCENT} />
      <Path path={pentaPath(size, V_BAR)} color={OBS_ACCENT} />
    </Group>
  );
}

/**
 * Armor plate + 4 corner bolts — penta's "armor" (durable fresh) treatment.
 * Plate: 15% inset rounded rect, 10% radius, #A0A0A0 fill + #606060 5%
 * stroke. Bolts: 4 circles radius 4% at 22% inset, #404040.
 */
function ArmorPlate({ size }: { size: number }) {
  const inset = size * 0.15;
  const plate = size - 2 * inset;
  const r = size * 0.1;
  const stroke = size * 0.05;
  const boltInset = size * 0.22;
  const rBolt = size * 0.04;
  const bolts: [number, number][] = [
    [boltInset, boltInset],
    [size - boltInset, boltInset],
    [boltInset, size - boltInset],
    [size - boltInset, size - boltInset],
  ];
  return (
    <Group>
      <RoundedRect
        x={inset}
        y={inset}
        width={plate}
        height={plate}
        r={r}
        color={OBS_ARMOR_FILL}
      />
      <RoundedRect
        x={inset}
        y={inset}
        width={plate}
        height={plate}
        r={r}
        color={OBS_ARMOR_STROKE}
        style="stroke"
        strokeWidth={stroke}
      />
      {bolts.map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={rBolt} color={OBS_BOLT} />
      ))}
    </Group>
  );
}

/**
 * Multi-branch crack pattern — penta's exact coords from
 * SpecialBlockGeometry.crackedPattern(). 6% stroke width, round cap/join.
 */
function CrackPattern({ size }: { size: number }) {
  const w = size * 0.06;
  const main = `M${size * 0.2} ${size * 0.1} L${size * 0.4} ${size * 0.4} L${size * 0.3} ${size * 0.6} L${size * 0.6} ${size * 0.8}`;
  const branchA = `M${size * 0.4} ${size * 0.4} L${size * 0.7} ${size * 0.3} L${size * 0.85} ${size * 0.5}`;
  const branchB = `M${size * 0.6} ${size * 0.8} L${size * 0.5} ${size * 0.95}`;
  return (
    <Path
      path={`${main} ${branchA} ${branchB}`}
      color={OBS_CRACK}
      style="stroke"
      strokeWidth={w}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}

/**
 * Tiny red central square for `basic` (penta's generic). centerInset 19,
 * centerSize 5 at baseSize 43 — sits at the tip of the 44%-inset pyramid.
 */
function GenericDot({ size }: { size: number }) {
  const s = size / 43;
  const inset = 19 * s;
  const dotSize = 5 * s;
  return (
    <Rect x={inset} y={inset} width={dotSize} height={dotSize} color={OBS_GENERIC_DOT} />
  );
}

export function ObstacleShape({
  size,
  obstacleId,
  hp,
  pulseOpacity,
}: {
  size: number;
  obstacleId: ObstacleId;
  hp: number;
  /**
   * 0–1 sinusoid (penta's full beacon pulse) driven at the canvas level.
   * Applied only to the icon layer of basic/horiz/vert/composite. Armor
   * bolts and cracks stay solid since structural damage shouldn't breathe.
   */
  pulseOpacity?: SharedValue<number>;
}) {
  if (obstacleId === 'durable2') {
    const cracked = hp <= 1;
    return (
      <Group>
        <SpecialFrustum
          size={size}
          body={cracked ? OBS_BODY_CRACKED : OBS_BODY_STANDARD}
          inset={PENTA_INSET_DIRECTIONAL}
        />
        {cracked ? <CrackPattern size={size} /> : <ArmorPlate size={size} />}
      </Group>
    );
  }

  const isGeneric = obstacleId === 'basic';
  const inset = isGeneric ? PENTA_INSET_GENERIC : PENTA_INSET_DIRECTIONAL;

  let icon: React.ReactNode = null;
  if (obstacleId === 'basic') {
    icon = <GenericDot size={size} />;
  } else if (obstacleId === 'horiz') {
    icon = <ArrowsHoriz size={size} />;
  } else if (obstacleId === 'vert') {
    icon = <ArrowsVert size={size} />;
  } else if (obstacleId === 'composite') {
    // angelica-only type. Both arrow sets share the frame — penta doesn't
    // render this combination so we overlay the two icons at full size.
    icon = (
      <Group>
        <ArrowsHoriz size={size} />
        <ArrowsVert size={size} />
      </Group>
    );
  }

  return (
    <Group>
      <SpecialFrustum size={size} body={OBS_BODY_STANDARD} inset={inset} />
      {icon ? <Group opacity={pulseOpacity}>{icon}</Group> : null}
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
