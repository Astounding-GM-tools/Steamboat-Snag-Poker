import type { Category } from './evaluate';

export type DealMode = 'drip' | 'draft' | 'holdem';
export type JokerMode = 'slot' | 'shuffled';

export interface RulesConfig {
  months: number;
  dealMode: DealMode;
  jokerMode: JokerMode;
  totalJokers: number;
  /** Slot mode: chance per round (from month 2) of a community Joker. */
  communityJokerChance: number;
  /** Shuffled mode: one more unowned Joker goes into the deck every N months. */
  shuffledJokerEveryMonths: number;
  /** Popularity lost per owned Joker at the end of every round. */
  drainPerJoker: number;
  startPopularity: number;
  maxPopularity: number;
  winGain: Record<Category, number>;
}

export const DEFAULT_CONFIG: RulesConfig = {
  months: 48,
  dealMode: 'draft',
  jokerMode: 'slot',
  totalJokers: 10,
  communityJokerChance: 0.5,
  shuffledJokerEveryMonths: 2,
  drainPerJoker: 4,
  startPopularity: 50,
  maxPopularity: 100,
  winGain: {
    highCard: 1,
    pair: 3,
    twoPair: 5,
    threeOfAKind: 7,
    straight: 9,
    flush: 11,
    fullHouse: 13,
    fourOfAKind: 16,
    straightFlush: 20,
  },
};

/** Cards dealt to each player on each street (index 0 = Flop). */
export const DEAL_SCHEDULE: Record<DealMode, [number, number, number]> = {
  drip: [1, 1, 1],
  draft: [3, 1, 1],
  holdem: [5, 0, 0],
};
