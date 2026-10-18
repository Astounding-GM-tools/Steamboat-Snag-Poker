/**
 * Spoken descriptions of hands for the showdown intertitles:
 * "Four of a Kind, sevens" — and a nickname when the hand has one.
 */
import type { HandValue, StdCard } from '../engine';
import { t } from '../i18n';

function groups(hand: HandValue): number[][] {
  const counts = new Map<number, number>();
  for (const c of hand.cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
}

const plural = (rank: number) => t(`rank.plural.${rank}`);
const single = (rank: number) => t(`rank.name.${rank}`);

/** e.g. "Two Pair, aces and eights" / "a Flush, king high". */
export function describeHand(hand: HandValue): string {
  const g = groups(hand);
  const cat = t(`hand.${hand.category}`);
  if (!hand.cards.length) return t('hand.nothing');
  const high = hand.cards[0].rank;
  switch (hand.category) {
    case 'highCard':
      return t('describe.high', { hand: cat, rank: single(high) });
    case 'pair':
    case 'threeOfAKind':
    case 'fourOfAKind':
      return t('describe.of', { hand: cat, rank: plural(g[0][0]) });
    case 'twoPair':
      return t('describe.twoPair', { hand: cat, a: plural(g[0][0]), b: plural(g[1][0]) });
    case 'fullHouse':
      return t('describe.full', { hand: cat, a: plural(g[0][0]), b: plural(g[1][0]) });
    case 'straight':
    case 'flush':
    case 'straightFlush': {
      const top = hand.category !== 'flush' && high === 14 && hand.cards[1].rank === 5 ? 5 : high;
      return t('describe.high', { hand: cat, rank: single(top) });
    }
  }
}

/** A traditional (or house) nickname, if the hand has one. */
export function nickname(hand: HandValue): string | null {
  const g = groups(hand);
  const r = hand.cards.map((c) => c.rank);
  switch (hand.category) {
    case 'straightFlush':
      return r[0] === 14 && r[1] === 13 ? t('nick.royal') : null;
    case 'fullHouse':
      return g[0][0] === 3 ? t('nick.waiter', { rank: plural(g[1][0]) }) : t('nick.fullBoat');
    case 'twoPair':
      return g[0][0] === 14 && g[1][0] === 8 ? t('nick.deadMan') : null;
    case 'straight':
      if (r[0] === 14 && r[1] === 5) return t('nick.wheel');
      if (r[0] === 14) return t('nick.broadway');
      return null;
    case 'pair':
    case 'threeOfAKind':
    case 'fourOfAKind': {
      const key = `nick.rank.${g[0][0]}`;
      const nick = t(key);
      return nick === key ? null : nick;
    }
    default:
      return null;
  }
}

/** The cards that make the hand what it is (the pair, the trips…), without kickers. */
export function keyCards(hand: HandValue): StdCard[] {
  const g = groups(hand);
  switch (hand.category) {
    case 'highCard':
      return hand.cards.slice(0, 1);
    case 'pair':
    case 'threeOfAKind':
    case 'fourOfAKind':
      return hand.cards.filter((c) => c.rank === g[0][0]);
    case 'twoPair':
      return hand.cards.filter((c) => c.rank === g[0][0] || c.rank === g[1][0]);
    default:
      return hand.cards;
  }
}
