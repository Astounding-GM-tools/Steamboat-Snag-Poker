import { cardPrefs, type CardFace } from './cards.svelte';

/**
 * The player's settings, remembered on this device: the sound of coins, and
 * how card faces read (kept in cardPrefs, where the cards look).
 */
export const settings = $state({ sound: true });

const KEY = 'wwr.settings';

try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { sound?: boolean; face?: CardFace };
  if (typeof saved.sound === 'boolean') settings.sound = saved.sound;
  if (saved.face === 'value' || saved.face === 'pair') cardPrefs.face = saved.face;
} catch {
  /* no storage: the defaults */
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ sound: settings.sound, face: cardPrefs.face }));
  } catch {
    /* no storage */
  }
}

/** Value big in the middle, or value and suit side by side (for spotting flushes): one tap on the board switches every card. */
export function switchFaces() {
  cardPrefs.face = cardPrefs.face === 'value' ? 'pair' : 'value';
  saveSettings();
}
