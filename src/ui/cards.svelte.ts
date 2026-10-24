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

/**
 * Card display settings shared by every card on screen, the card held up for
 * a closer look, and a side's discards laid out for inspection.
 */
export const cardPrefs = $state<{ face: CardFace; zoomed: Card | null; discards: { title: string; cards: Card[] } | null }>({
  face: readFace(),
  zoomed: null,
  discards: null,
});

export function setCardFace(face: CardFace) {
  cardPrefs.face = face;
  try {
    localStorage.setItem(FACE_KEY, face);
  } catch {
    /* storage unavailable */
  }
}
