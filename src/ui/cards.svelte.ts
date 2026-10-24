import type { Card } from '../engine';

/** How a card face reads: the value big in the middle, or value and suit side by side. */
export type CardFace = 'value' | 'pair';

const FACE_KEY = 'wwr.cardFace';

function readFace(): CardFace {
  try {
    return localStorage.getItem(FACE_KEY) === 'pair' ? 'pair' : 'value';
  } catch {
    return 'value';
  }
}

/** Card display settings shared by every card on screen, and the card held up for a closer look. */
export const cardPrefs = $state<{ face: CardFace; zoomed: Card | null }>({ face: readFace(), zoomed: null });

export function setCardFace(face: CardFace) {
  cardPrefs.face = face;
  try {
    localStorage.setItem(FACE_KEY, face);
  } catch {
    /* storage unavailable */
  }
}
