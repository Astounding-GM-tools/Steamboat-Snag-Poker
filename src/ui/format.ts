import { isJoker, rankLabel, type Card, type JokerCard } from '../engine';
import { t } from '../i18n';

/** Black-and-white film: red suits are drawn as outlines. */
export const SUIT_GLYPH = { c: '♣', d: '♢', h: '♡', s: '♠' } as const;

/** How many Joker names the language file has; more Jokers than that reuse names. */
const JOKER_NAMES = 12;

export function jokerName(index: number): string {
  return t(`joker.${index % JOKER_NAMES}`);
}

export function cardLabel(card: Card): string {
  if (isJoker(card)) return jokerName(card.index);
  const rank = card.rank === 10 ? '10' : rankLabel(card.rank);
  return rank + SUIT_GLYPH[card.suit];
}

/** Money on the river: "$53". */
export function dollars(n: number): string {
  return `$${n}`;
}

/** The bookmaker's ladder of traditional fractional odds, shortest first. */
const ODDS_LADDER: [number, number][] = [
  [1, 10], [1, 5], [2, 7], [1, 3], [2, 5], [1, 2], [4, 7], [4, 6], [8, 11], [4, 5], [10, 11], [1, 1],
  [6, 5], [5, 4], [11, 8], [6, 4], [13, 8], [7, 4], [2, 1], [9, 4], [5, 2], [3, 1], [7, 2], [4, 1],
  [9, 2], [5, 1], [6, 1], [7, 1], [8, 1], [10, 1], [12, 1], [16, 1], [20, 1], [25, 1], [33, 1],
  [50, 1], [100, 1],
];

/**
 * A chance as a bookmaker would call it: 0.56 → "5 to 4 on" (odds-on: stake 5
 * to win 4), 0.5 → "Evens", 0.13 → "7 to 1" (odds against).
 */
export function bookmakerOdds(p: number): string {
  if (p <= 0) return t('odds.off');
  const against = (1 - p) / p;
  const [a, b] = ODDS_LADDER.reduce((best, o) =>
    Math.abs(Math.log(o[0] / o[1]) - Math.log(against || 0.01)) <
    Math.abs(Math.log(best[0] / best[1]) - Math.log(against || 0.01))
      ? o
      : best,
  );
  if (a === b) return t('odds.evens');
  return a < b ? t('odds.on', { a: b, b: a }) : t('odds.against', { a, b });
}

export function name(id: string): string {
  return t(`character.${id}.name`);
}

/** "the Egg Crisis", "the Egg Crisis and the Sandbar", "A, B and C". */
export function jokerList(jokers: JokerCard[]): string {
  const names = jokers.map((j) => jokerName(j.index));
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')}${t('list.and')}${names.at(-1)}`;
}

/** "the Ace of Spades" — for spoken intertitles. */
export function longCardName(card: Card): string {
  if (isJoker(card)) return jokerName(card.index);
  return t('card.long', { rank: t(`rank.title.${card.rank}`), suit: t(`suit.${card.suit}`) });
}
