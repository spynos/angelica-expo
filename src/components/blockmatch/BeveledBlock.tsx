import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { Radius } from '@/constants/theme';
import { shiftLightness } from '@/src/lib/blockmatch/colors';

/**
 * 3D beveled block, ported from `penta_block_blast`'s `beveled_block.dart`
 * (`/Users/blue/Documents/GitHub/penta_block_blast/lib/game/components/beveled_block.dart`).
 *
 * Composition (painted in order, all inside one `<Svg>`):
 *   1. base color fill across the full square (prevents seams between faces).
 *   2. four trapezoid "faces" around the edges, each tinted by HSL lightness
 *      shift to suggest a light source from the top-left:
 *        top    L+15  ← brightest
 *        left   L+6
 *        right  L−15
 *        bottom L−30  ← darkest, gives the block its weight
 *   3. center rect filled with the original base color.
 *   4. soft top-left highlight gradient (off-white) layered over the top
 *      trapezoid + upper half of the center, sold as a subtle sheen.
 *
 * The bevel itself is NOT rounded — only the outer `<View>` clips to
 * `Radius.sm` so the block has a hint of softness in the corners. This matches
 * penta's `ClipRRect(borderRadius: 2)` while reusing our token.
 *
 * Opacity is applied to the wrapping `<View>` (not per-fill) so the entire
 * beveled stack — including the highlight gradient — fades together. Ghost
 * preview consumers pass `opacity={0.45}` and `bevelFraction={0.20}`.
 */
export type BeveledBlockProps = {
  size: number;
  color: string;
  opacity?: number;
  bevelFraction?: number;
};

const HIGHLIGHT_COLOR = '#FFF6DF';
// Stop alphas come from penta: base 0.69 with a 0.658 / 0.2 falloff at the
// trailing stops. We bake those constants here rather than recomputing each
// render — the gradient never changes per-piece.
const HI_ALPHA_0 = 0.69;
const HI_ALPHA_1 = 0.69 * 0.658;
const HI_ALPHA_2 = 0.69 * 0.2;

export const BeveledBlock = memo(function BeveledBlock({
  size,
  color,
  opacity = 1,
  bevelFraction = 0.18,
}: BeveledBlockProps) {
  if (size <= 0) return null;
  const s = size;
  // Clamp bevel so it can't cross the centerline on tiny cells (e.g. 8px
  // preview slots) — otherwise the trapezoids would invert and paint negatives.
  const b = Math.min(s * bevelFraction, s / 2);
  const inner = s - 2 * b;
  const midY = s / 2;

  const top = `0,0 ${s},0 ${s - b},${b} ${b},${b}`;
  const left = `0,0 ${b},${b} ${b},${s - b} 0,${s}`;
  const right = `${s},0 ${s},${s} ${s - b},${s - b} ${s - b},${b}`;
  const bottom = `0,${s} ${s},${s} ${s - b},${s - b} ${b},${s - b}`;
  // Highlight area = top trapezoid ∪ upper half of center rect.
  const highlight = `0,0 ${s},0 ${s - b},${b} ${s - b},${midY} ${b},${midY} ${b},${b}`;

  return (
    <View
      style={{
        width: s,
        height: s,
        borderRadius: Radius.sm,
        overflow: 'hidden',
        opacity,
      }}
    >
      <Svg width={s} height={s}>
        <Defs>
          {/* Vertical-ish gradient with a slight rightward drift, normalized
              over the highlight polygon's bounding box. Coords are penta's
              SVG-pixel→Rect-normalized transform applied to objectBoundingBox. */}
          <LinearGradient id="bevelHi" x1="0.481" y1="0" x2="0.517" y2="0.777">
            <Stop offset="0.370" stopColor={HIGHLIGHT_COLOR} stopOpacity={HI_ALPHA_0} />
            <Stop offset="0.688" stopColor={HIGHLIGHT_COLOR} stopOpacity={HI_ALPHA_1} />
            <Stop offset="1" stopColor={HIGHLIGHT_COLOR} stopOpacity={HI_ALPHA_2} />
          </LinearGradient>
        </Defs>
        <Rect width={s} height={s} fill={color} />
        <Polygon points={top} fill={shiftLightness(color, 15)} />
        <Polygon points={left} fill={shiftLightness(color, 6)} />
        <Polygon points={right} fill={shiftLightness(color, -15)} />
        <Polygon points={bottom} fill={shiftLightness(color, -30)} />
        <Rect x={b} y={b} width={inner} height={inner} fill={color} />
        <Polygon points={highlight} fill="url(#bevelHi)" />
      </Svg>
    </View>
  );
});
