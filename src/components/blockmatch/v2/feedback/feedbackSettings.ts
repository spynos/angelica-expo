import { storage } from '@/src/lib/storage';

import { HapticService } from './haptic';
import { SoundService } from './sound';

/**
 * Sound + haptic on/off persistence.
 *
 * Stored in MMKV under a single JSON key so a future settings UI can
 * read/write both flags atomically. Both default to `true` so a fresh
 * install hears + feels everything; the settings screen will let users
 * mute either independently.
 */

const KEY = 'blockmatch.feedback';

export type FeedbackSettings = {
  sound: boolean;
  haptic: boolean;
};

const DEFAULTS: FeedbackSettings = { sound: true, haptic: true };

export function loadFeedbackSettings(): FeedbackSettings {
  const raw = storage.getString(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<FeedbackSettings>;
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULTS.sound,
      haptic: typeof parsed.haptic === 'boolean' ? parsed.haptic : DEFAULTS.haptic,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveFeedbackSettings(s: FeedbackSettings): void {
  storage.set(KEY, JSON.stringify(s));
  applyFeedbackSettings(s);
}

export function applyFeedbackSettings(s: FeedbackSettings): void {
  SoundService.setEnabled(s.sound);
  HapticService.setEnabled(s.haptic);
}

/** Boot-time: read from MMKV and push into the services. Synchronous. */
export function applyFeedbackSettingsAtBoot(): void {
  applyFeedbackSettings(loadFeedbackSettings());
}
