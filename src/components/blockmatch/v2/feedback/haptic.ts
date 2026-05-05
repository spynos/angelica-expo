import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback service.
 *
 * Wraps expo-haptics into the event-level API the blockmatch game needs.
 * Every call is gated by a single in-memory flag; wire that flag to
 * settings persistence when the app's settings layer is ready.
 *
 * Android notes: expo-haptics maps ImpactFeedbackStyle to the Android
 * haptic effect constants available from API 29+. Older devices fall back
 * to `vibrate`, which expo-haptics handles internally — no manual fallback
 * needed at this layer.
 */

let enabled = true;

// Throttle for `dragSnap` — the gesture worklet may emit a snap-anchor
// transition multiple times per frame as the finger crosses cell borders,
// and Light haptics queued back-to-back feel like a continuous buzz on iOS
// instead of discrete taps. 50ms gates the rate without blunting the
// per-cell tactile feedback users actually want.
const DRAG_SNAP_THROTTLE_MS = 50;
let lastDragSnapAt = 0;

export const HapticService = {
  setEnabled(v: boolean) {
    enabled = v;
  },

  isEnabled() {
    return enabled;
  },

  /** Tiny nudge — used for drag ghost snap transitions (throttled). */
  dragSnap() {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastDragSnapAt < DRAG_SNAP_THROTTLE_MS) return;
    lastDragSnapAt = now;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Piece selected / rotated. */
  selection() {
    if (!enabled) return;
    void Haptics.selectionAsync();
  },

  /** Successful placement. */
  place() {
    if (!enabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Line clear. */
  lineClear() {
    if (!enabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Combo level-up (2x, 3x, …). */
  combo() {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Obstacle destroyed — slightly richer than a plain line clear. */
  obstacleDestroyed() {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Stage cleared (rainbow stagger trigger). */
  stageClear() {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Game over. */
  gameOver() {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
