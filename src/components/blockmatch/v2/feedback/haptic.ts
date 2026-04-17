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

export const HapticService = {
  setEnabled(v: boolean) {
    enabled = v;
  },

  isEnabled() {
    return enabled;
  },

  /** Tiny nudge — used for drag ghost snap transitions. */
  dragSnap() {
    if (!enabled) return;
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
