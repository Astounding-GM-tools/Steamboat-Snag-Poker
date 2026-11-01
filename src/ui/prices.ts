/**
 * Prices on the table, shared by the tables: a sum in words (dollars, or in
 * Morag's lessons, buttons), and the label on the white button for the move
 * you're about to make, with what it costs.
 */
import { t } from '../i18n';
import { dollars } from './format';

export type Currency = 'buttons' | undefined;

/** A sum in words: dollars, or in the lessons, buttons. */
export const moneyText = (n: number, currency: Currency) => (currency === 'buttons' ? t(n === 1 ? 'money.button' : 'money.buttons', { n }) : dollars(n));

/** On the buttons there's only room for a sign and the figure: $3, or ⚇3 (a button, two holes). */
export const priceText = (n: number, currency: Currency) => (currency === 'buttons' ? `⚇${n}` : dollars(n));

export interface Move {
  /** Making your hand on the River. */
  composing: boolean;
  /** Facing a raise: match it. */
  answering?: boolean;
  /** Cards tapped to swap. */
  swaps: number;
  /** What the move costs, and what you have left to put in (a price beyond it is everything: all in). */
  cost: number;
  left: number;
  currency?: Currency;
}

/** The white button: Play hand, Match, Swap or Call with its price, All in (with nothing left, you just stay in: Check). */
export function moveLabel({ composing, answering = false, swaps, cost, left, currency }: Move): string {
  const price = (n: number) => priceText(n, currency);
  if (cost > left) return left > 0 ? t('draw.allIn', { amount: price(left) }) : t('draw.check');
  if (answering) return t('hr.match', { amount: price(cost) });
  if (composing) return t('draw.play');
  const label = swaps ? t('draw.discard', { n: swaps }) : cost ? t('draw.call') : t('draw.check');
  return cost ? `${label} · ${price(cost)}` : label;
}
