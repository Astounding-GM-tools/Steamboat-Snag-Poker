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

export function jokerList(jokers: JokerCard[]): string {
  return jokers.map((j) => t(`joker.${j.index}`)).join(' & ');
}
