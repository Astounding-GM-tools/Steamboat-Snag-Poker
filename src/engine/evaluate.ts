import { isStd, suitValue, type Card, type StdCard } from './cards';

export const CATEGORIES = [
  'highCard',
  'pair',
  'twoPair',
  'threeOfAKind',
  'straight',
  'flush',
  'fullHouse',
  'fourOfAKind',
  'straightFlush',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface HandValue {
  category: Category;
  /** Index into CATEGORIES; higher is better. */
  categoryRank: number;
  /** Ranks to compare after the category (group ranks, then kickers). */
  ranks: number[];
  /** Suits of the real cards, highest card first; the final tie-breaker. */
  suits: number[];
  /** The real (non-Joker) cards, sorted highest first. */
  cards: StdCard[];
}

/**
 * Evaluates the cards in play (2 slots + community). Jokers and empty slots are
 * dead, so 0–5 real cards may remain. Straights and flushes need 5 real cards.
 */
export function evaluate(inPlay: readonly (Card | null)[]): HandValue {
  const cards = inPlay.filter(isStd).sort((a, b) => b.rank - a.rank || suitValue(b.suit) - suitValue(a.suit));
  if (cards.length > 5) throw new Error('At most 5 real cards can be in play');

  const counts = new Map<number, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const groupRanks = groups.map(([rank]) => rank);
  const shape = groups.map(([, n]) => n).join('');

  const isFlush = cards.length === 5 && cards.every((c) => c.suit === cards[0].suit);
  let straightHigh = 0;
  if (cards.length === 5 && groups.length === 5) {
    const r = cards.map((c) => c.rank);
    if (r[0] - r[4] === 4) straightHigh = r[0];
    else if (r.join() === '14,5,4,3,2') straightHigh = 5; // the wheel
  }

  let category: Category;
  let ranks = groupRanks;
  if (straightHigh && isFlush) {
    category = 'straightFlush';
    ranks = [straightHigh];
  } else if (shape.startsWith('4')) category = 'fourOfAKind';
  else if (shape === '32') category = 'fullHouse';
  else if (isFlush) category = 'flush';
  else if (straightHigh) {
    category = 'straight';
    ranks = [straightHigh];
  } else if (shape.startsWith('3')) category = 'threeOfAKind';
  else if (shape.startsWith('22')) category = 'twoPair';
  else if (shape.startsWith('2')) category = 'pair';
  else category = 'highCard';

  return {
    category,
    categoryRank: CATEGORIES.indexOf(category),
    ranks,
    suits: cards.map((c) => suitValue(c.suit)),
    cards,
  };
}

/** Positive if a beats b, negative if b beats a, 0 only for identical real cards. */
export function compareHands(a: HandValue, b: HandValue): number {
  if (a.categoryRank !== b.categoryRank) return a.categoryRank - b.categoryRank;
  for (let i = 0; i < Math.max(a.ranks.length, b.ranks.length); i++) {
    const d = (a.ranks[i] ?? 0) - (b.ranks[i] ?? 0);
    if (d) return d;
  }
  // Fewer real cards (more dead ones) loses once ranks are exhausted.
  if (a.cards.length !== b.cards.length) return a.cards.length - b.cards.length;
  for (let i = 0; i < a.suits.length; i++) {
    const d = a.suits[i] - b.suits[i];
    if (d) return d;
  }
  return 0;
}
