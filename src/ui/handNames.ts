/**
 * Spoken descriptions of hands for the showdown intertitles:
 * "Four of a Kind, sevens" — and a nickname when the hand has one.
 */
import type { HandValue } from '../engine';
import { SUIT_GLYPH } from './format';
import { t } from '../i18n';

function groups(hand: HandValue): number[][] {
  const counts = new Map<number, number>();
  for (const c of hand.cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (rank: number) => cap(t(`rank.plural.${rank}`));
const single = (rank: number) => cap(t(`rank.name.${rank}`));

/** e.g. "a Pair of Aces", "Two Pair, Aces and Eights", "a Flush, King high". */
export function describeHand(hand: HandValue): string {
  const g = groups(hand);
  if (!hand.cards.length) return t('hand.nothing');
  const high = hand.cards[0].rank;
  switch (hand.category) {
    case 'highCard':
      return t('describe.highCard', { rank: single(high) });
    case 'pair':
      return t('describe.pair', { rank: plural(g[0][0]) });
    case 'threeOfAKind':
      return t('describe.trips', { rank: plural(g[0][0]) });
    case 'fourOfAKind':
      return t('describe.quads', { rank: plural(g[0][0]) });
    case 'twoPair':
      return t('describe.twoPair', { a: plural(g[0][0]), b: plural(g[1][0]) });
    case 'fullHouse':
      return t('describe.full', { a: plural(g[0][0]), b: plural(g[1][0]) });
    case 'straight':
    case 'flush':
    case 'straightFlush': {
      const top = hand.category !== 'flush' && high === 14 && hand.cards[1].rank === 5 ? 5 : high;
      return t('describe.high', { hand: t(`hand.${hand.category}`), rank: single(top) });
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
    case 'fullHouse': {
      // Threes are "trays": a Jack carrying a tray is the Waiter; a King, the Butler.
      const ranks = new Set([g[0][0], g[1][0]]);
      if (ranks.has(3) && ranks.has(11)) return t('nick.waiter');
      if (ranks.has(3) && ranks.has(13)) return t('nick.butler');
      return t('nick.fullBoat');
    }
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


export interface Tiebreak {
  kind: 'kicker' | 'next' | 'suit';
  /** What the winner had at the deciding spot, e.g. "Eight" or "♠". */
  winner: string;
  loser: string;
}

/** Ranks in the order poker compares them: groups by size, then by rank. */
function rankOrder(hand: HandValue): number[] {
  if (hand.category === 'straight' || hand.category === 'straightFlush') {
    const r = hand.cards.map((c) => c.rank);
    return [r[0] === 14 && r[1] === 5 ? 5 : r[0]];
  }
  return groups(hand).map(([rank]) => rank);
}

/**
 * When two hands share a name ("Two Pair, Aces and Kings"), says what decided
 * it: a kicker, the next highest card, or in the last resort a suit.
 */
export function tiebreak(win: HandValue, lose: HandValue): Tiebreak | null {
  if (win.category !== lose.category || describeHand(win) !== describeHand(lose)) return null;
  const a = rankOrder(win);
  const b = rankOrder(lose);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      const grouped = ['pair', 'twoPair', 'threeOfAKind', 'fourOfAKind'].includes(win.category);
      return { kind: grouped ? 'kicker' : 'next', winner: a[i] ? single(a[i]) : '—', loser: b[i] ? single(b[i]) : t('show.nothing') };
    }
  }
  for (let i = 0; i < Math.min(win.cards.length, lose.cards.length); i++) {
    if (win.cards[i].suit !== lose.cards[i].suit) {
      return { kind: 'suit', winner: SUIT_GLYPH[win.cards[i].suit], loser: SUIT_GLYPH[lose.cards[i].suit] };
    }
  }
  return null;
}
