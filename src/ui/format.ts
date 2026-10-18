import { isJoker, rankLabel, type Card, type JokerCard } from '../engine';
import { t } from '../i18n';

/** Black-and-white film: red suits are drawn as outlines. */
export const SUIT_GLYPH = { c: '♣', d: '♢', h: '♡', s: '♠' } as const;

export function cardLabel(card: Card): string {
  if (isJoker(card)) return t(`joker.${card.index}`);
  const rank = card.rank === 10 ? '10' : rankLabel(card.rank);
  return rank + SUIT_GLYPH[card.suit];
}

export function name(id: string): string {
  return t(`character.${id}.name`);
}

/** "the Egg Crisis", "the Egg Crisis and the Sandbar", "A, B and C". */
export function jokerList(jokers: JokerCard[]): string {
  const names = jokers.map((j) => t(`joker.${j.index}`));
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')}${t('list.and')}${names.at(-1)}`;
}

/** "the Ace of Spades" — for spoken intertitles. */
export function longCardName(card: Card): string {
  if (isJoker(card)) return t(`joker.${card.index}`);
  return t('card.long', { rank: t(`rank.title.${card.rank}`), suit: t(`suit.${card.suit}`) });
}
