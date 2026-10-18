import type { Category } from './evaluate';

export type JokerMode = 'slot' | 'shuffled';
export type Schedule = [number, number, number];

export interface RulesConfig {
  /** Display name of the preset this config came from (informational). */
  preset: string;
  months: number;
  /** Community cards revealed on Flop, Turn, River. */
  communitySchedule: Schedule;
  /** Cards dealt to each player on Flop, Turn, River. */
  dealSchedule: Schedule;
  /** Number of play slots per player. */
  slotCount: number;
  /**
   * How many of your own slot cards the 5-card hand must use (Jokers and empty
   * slots count, as dead cards). The rest comes from the community cards.
   * Texas: 0–slots, Omaha: exactly 2.
   */
  ownCards: { min: number; max: number };
  /** 'slot': a separate fourth community slot holds the prize Joker; 'shuffled': Jokers are shuffled into the deck. */
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

const BASE_GAIN: Record<Category, number> = {
  highCard: 1,
  pair: 3,
  twoPair: 5,
  threeOfAKind: 7,
  straight: 9,
  flush: 11,
  fullHouse: 13,
  fourOfAKind: 16,
  straightFlush: 20,
};

/** "Kansas": full Hold'em board, three slots, Omaha's use-exactly-two rule. */
const KANSAS: RulesConfig = {
  preset: 'kansas',
  months: 48,
  communitySchedule: [3, 1, 1],
  dealSchedule: [3, 1, 1],
  slotCount: 3,
  ownCards: { min: 2, max: 2 },
  jokerMode: 'shuffled',
  totalJokers: 10,
  communityJokerChance: 0.5,
  shuffledJokerEveryMonths: 2,
  drainPerJoker: 4,
  startPopularity: 50,
  maxPopularity: 100,
  winGain: BASE_GAIN,
};

/** Named rule sets for play-testing and simulation. */
export const PRESETS: Record<string, RulesConfig> = {
  kansas: KANSAS,
  texas: { ...KANSAS, preset: 'texas', ownCards: { min: 0, max: 3 } },
  middle: { ...KANSAS, preset: 'middle', ownCards: { min: 1, max: 2 } },
  threePlusThree: {
    ...KANSAS,
    preset: 'threePlusThree',
    communitySchedule: [1, 1, 1],
    ownCards: { min: 2, max: 3 },
  },
  classic: {
    ...KANSAS,
    preset: 'classic',
    communitySchedule: [1, 1, 1],
    slotCount: 2,
    ownCards: { min: 2, max: 2 },
    jokerMode: 'slot',
  },
};

export const DEFAULT_CONFIG: RulesConfig = PRESETS.kansas;
