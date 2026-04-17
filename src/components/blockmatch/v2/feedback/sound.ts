/**
 * Sound effect service (stub).
 *
 * Event-level SFX API matching penta's SoundManager. The implementation is
 * a no-op today because the app hasn't picked an audio backend yet
 * (expo-audio isn't in package.json; expo-av has been deprecated). When we
 * install a backend, replace the stubs with real `play(file)` calls — the
 * call-site layer above doesn't need to change.
 *
 * Throttling is implemented here so that a click-storm (e.g., rapidly
 * tapping rotate) doesn't queue up dozens of overlapping plays. The 80ms
 * click throttle matches penta's SoundManager behavior.
 */

import { SFX_CLICK_THROTTLE_MS } from '../engine/constants';

let enabled = true;
let lastClickAt = 0;

// Random choice helper used by line-clear variants.
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Asset file names — keep even when playback is stubbed so that switching
// backends doesn't require renaming call sites.
const SFX = {
  gameStart: 'game_start',
  selectBlock: 'select_block',
  holdBlock: 'hold_block',
  snap: 'snap_block',
  openSettings: 'open_settings',
  click: 'click',
  warn: 'warn',
  lineClear: ['clear_line_a', 'clear_line_b', 'clear_line_c', 'clear_line_d', 'clear_line_e'] as const,
  multiLineClear: ['clear_line_multiple_a', 'clear_line_multiple_b', 'clear_line_multiple_c'] as const,
  combo: ['', 'good', 'great', 'excellent', 'amazing'] as const,
};

// Stub: logs in dev, does nothing in prod. Swap once we commit to a backend.
function play(_file: string) {
  if (!enabled) return;
  // if (__DEV__) console.log('[sfx]', _file);
}

export const SoundService = {
  setEnabled(v: boolean) {
    enabled = v;
  },

  isEnabled() {
    return enabled;
  },

  playGameStart() {
    play(SFX.gameStart);
  },

  playSelect() {
    play(SFX.selectBlock);
  },

  playRotate() {
    play(SFX.selectBlock);
  },

  playHold() {
    play(SFX.holdBlock);
  },

  playSnap() {
    play(SFX.snap);
  },

  playLineClear(lineCount: number) {
    if (lineCount <= 1) play(pick(SFX.lineClear));
    else play(pick(SFX.multiLineClear));
  },

  playCombo(combo: number) {
    if (combo < 2) return;
    const tier = Math.min(combo, SFX.combo.length - 1);
    const key = SFX.combo[tier];
    if (key) play(key);
  },

  playOpenSettings() {
    play(SFX.openSettings);
  },

  /** Throttled click sound (menu taps). */
  playClick() {
    const now = Date.now();
    if (now - lastClickAt < SFX_CLICK_THROTTLE_MS) return;
    lastClickAt = now;
    play(SFX.click);
  },
};
