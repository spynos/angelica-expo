/**
 * Tuning constants for the blockmatch v2 renderer.
 *
 * Sourced from `docs/penta-block-blast-reference.md` §8. These five in
 * particular (SHOW_THRESHOLD_SQ, KEEP_THRESHOLD_SQ, FINGER_Y_OFFSET_PX, and
 * the bevel lightness shifts) are the highest-sensitivity feel parameters —
 * changing any of them noticeably alters the game's perceived quality.
 */

// ---------------------------------------------------------------------------
// Ghost snap (worklet-shared)
// ---------------------------------------------------------------------------

/**
 * Distance² (in cell units) at which a ghost first snaps.
 * 0.5² = 0.25: the piece anchor must be within 0.5 cells of a grid position.
 * Uses Math.round() as candidate, so max distSq to nearest candidate is 0.5;
 * values > 0.25 (i.e. corners of the cell) fall through to the KEEP gate.
 */
export const SHOW_THRESHOLD_SQ = 0.25;

/**
 * Distance² (in cell units) from the *previous valid snap anchor* below
 * which the ghost is held in place. 1.5² = 2.25: once validly snapped, the
 * ghost stays until the finger moves more than 1.5 cells away from it.
 */
export const KEEP_THRESHOLD_SQ = 2.25;

// ---------------------------------------------------------------------------
// Drag geometry (worklet-shared)
// ---------------------------------------------------------------------------

/** Finger sits this many pixels below the dragged piece's bottom-center. */
export const FINGER_Y_OFFSET_PX = 100;

// ---------------------------------------------------------------------------
// Bevel (shared between color.ts pre-compute and the drawer)
// ---------------------------------------------------------------------------

/** Bevel inset as a fraction of cell size for settled blocks. */
export const DEFAULT_BEVEL_FRACTION = 0.18;

/** Ghost uses a slightly wider bevel for a softer, lifted look. */
export const GHOST_BEVEL_FRACTION = 0.2;

// ---------------------------------------------------------------------------
// Board surface
// ---------------------------------------------------------------------------

/** Warm espresso board (30% lighter). */
export const BOARD_BG_COLOR = '#69635F';

/** Light grey grid line. */
export const BOARD_GRID_COLOR = '#B0A8A0';

/** Slightly lighter empty cell tint. */
export const EMPTY_CELL_TINT = '#6F6763';

/** Valid drop target highlight (lime) at 30% alpha. */
export const VALID_TARGET_COLOR = '#E1FF004C';

/** Invalid drop target highlight (grey) at 30% alpha. */
export const INVALID_TARGET_COLOR = '#8080804C';

// ---------------------------------------------------------------------------
// Animation durations (ms)
// ---------------------------------------------------------------------------

export const DUR_ROTATE = 200;
/**
 * Per-cell fade-out duration during line clear. Ghost fade also uses this
 * (BlockMatchGameV2) so they despawn in sync.
 */
export const DUR_LINE_CLEAR = 280;
/** Stagger delay per row during line clear — produces a top-to-bottom wave. */
export const STAGGER_LINE_CLEAR_MS = 45;
/** Small per-cell random jitter on top of row stagger, in ms. */
export const JITTER_LINE_CLEAR_MS = 15;
export const DUR_COMBO_POP = 800;
export const DUR_SPAWN = 200;
/** Total duration of the LineClearPopup animation (punch-in + settle + hold + fade-out). */
export const DUR_LINE_CLEAR_POPUP = 1200;

// ---------------------------------------------------------------------------
// Stage curtain transition
// ---------------------------------------------------------------------------

/** Both panels slide to center (closing). */
export const DUR_CURTAIN_CLOSE = 600;
/** Text hold before curtain opens. */
export const DUR_CURTAIN_HOLD = 600;
/** Both panels slide back out (opening). */
export const DUR_CURTAIN_OPEN = 600;

// ---------------------------------------------------------------------------
// Audio throttle
// ---------------------------------------------------------------------------

export const SFX_CLICK_THROTTLE_MS = 80;

// ---------------------------------------------------------------------------
// Minimap mode
// ---------------------------------------------------------------------------

export const MINIMAP_SIZE_PX = 300;
export const MINIMAP_ASPECT_RATIO = 0.9;
export const MINIMAP_HEIGHT_PX = MINIMAP_SIZE_PX / MINIMAP_ASPECT_RATIO;
export const MINIMAP_FINGER_Y_OFFSET = 30;
