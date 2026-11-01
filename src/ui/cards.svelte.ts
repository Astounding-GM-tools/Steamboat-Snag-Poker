import type { Card, Category } from '../engine';

/** How a card face reads: the value big in the middle, or value and suit side by side. */
export type CardFace = 'value' | 'pair';

/**
 * Card display settings shared by every card on screen, the card held up for
 * a closer look, and a side's discards laid out for inspection.
 */
export const cardPrefs = $state<{
  face: CardFace;
  zoomed: Card | null;
  discards: { title: string; rows: { label: string; cards: Card[] }[] } | null;
  /** The hands, best first, held up for reference (tap a hand's name): the one to highlight, or 'all'. */
  ladder: Category | 'all' | null;
}>({
  face: 'value',
  zoomed: null,
  discards: null,
  ladder: null,
});
