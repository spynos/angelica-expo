/**
 * Per-piece block color palette.
 *
 * Design:
 * - Each piece *size* (1..5) has a base hue so the player can tell "this is a
 *   tromino / tetromino / …" at a glance. Hues are spaced ≥60° apart on the
 *   wheel and deliberately avoid the obstacle palette (orange ~25°, violet
 *   ~255°) to prevent misreads.
 * - Within a size, every shape gets a subtly different color — lightness
 *   drifts ±L_SPREAD and hue drifts ±H_SPREAD around the base so shapes are
 *   distinguishable without breaking the "same tone family" impression.
 * - Saturation is capped around 22–42% so long play sessions don't fatigue
 *   the eyes.
 */
import { piecesBySize } from './pieces';

type HSL = { h: number; s: number; l: number };

const BASE: Record<1 | 2 | 3 | 4 | 5, HSL> = {
  1: { h: 10, s: 78, l: 68 }, // coral peach — monomino
  2: { h: 42, s: 80, l: 60 }, // honey gold — domino
  3: { h: 148, s: 52, l: 56 }, // fresh mint — trominoes
  4: { h: 188, s: 62, l: 52 }, // bright aqua — tetrominoes
  5: { h: 278, s: 55, l: 64 }, // light lilac — pentominoes (278° sits clear of violet obstacle at ~258°)
};

// Per-size variation widths. Sizes with only one shape stay at the base.
const L_SPREADS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 0,
  3: 8,
  4: 10,
  5: 11,
};
const H_SPREADS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 0,
  3: 8,
  4: 10,
  5: 10,
};

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = s / 100;
  const ll = l / 100;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + hh / 30) % 12;
    const c = ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function variationFor(size: 1 | 2 | 3 | 4 | 5, index: number, count: number): HSL {
  const base = BASE[size];
  if (count <= 1) return base;
  const t = index / (count - 1); // 0..1 across the shape list
  const lDelta = (t - 0.5) * 2 * L_SPREADS[size];
  const hDelta = (t - 0.5) * 2 * H_SPREADS[size];
  return {
    h: base.h + hDelta,
    s: base.s,
    l: base.l + lDelta,
  };
}

const COLOR_BY_ID = new Map<string, string>();
const HIGHLIGHT_BY_ID = new Map<string, string>();

for (const size of [1, 2, 3, 4, 5] as const) {
  const pieces = piecesBySize(size);
  pieces.forEach((p, i) => {
    const hsl = variationFor(size, i, pieces.length);
    COLOR_BY_ID.set(p.id, hslToHex(hsl.h, hsl.s, hsl.l));
    // Ghost highlight: +10% lightness, same hue/sat — reads as a lifted preview.
    HIGHLIGHT_BY_ID.set(p.id, hslToHex(hsl.h, hsl.s, Math.min(88, hsl.l + 10)));
  });
}

/** Fallback color if an unknown piece id slips through — matches legacy teal. */
export const DEFAULT_BLOCK_COLOR = '#2E7D6B';

export function colorForPieceId(pieceId: string): string {
  return COLOR_BY_ID.get(pieceId) ?? DEFAULT_BLOCK_COLOR;
}

export function highlightColorForPieceId(pieceId: string): string {
  return HIGHLIGHT_BY_ID.get(pieceId) ?? DEFAULT_BLOCK_COLOR;
}
