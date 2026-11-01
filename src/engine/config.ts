export type Schedule = [number, number, number];

export interface RulesConfig {
  /** Display name of the preset this config came from (informational). */
  preset: string;
  /** Community cards revealed on Flop, Turn, River. */
  communitySchedule: Schedule;
  /** Cards dealt to each player on Flop, Turn, River (the hole cards come with the Flop). */
  dealSchedule: Schedule;
  /** Snags in the game; unowned ones are shuffled into the deck. */
  totalJokers: number;
  /** One more unowned snag goes into the deck every N crossings. */
  shuffledJokerEveryMonths: number;
  /** Snag upkeep: added to the ante for every snag carried (or, sitting a crossing out, paid at its end). */
  drainPerJoker: number;
  /** Dollars the loser pays the winner for every snag they put in their losing hand. */
  jokerForfeit: number;
  /** Play for a pot (antes, street fees, discard fees); without one (a lesson), no money changes hands. */
  pot: boolean;
  /** The ante is ceil(crossing / anteEvery). */
  anteEvery: number;
  /** Crossings played before the pot came in (a lesson's), not counted towards the ante. */
  antePast?: number;
  /** The Turn and River fees are floor(ante / divisor). */
  streetFeeDivisors: [number, number];
  startMoney: number;
}

/** Named rule sets for play-testing and simulation. */
export const PRESETS: Record<string, RulesConfig> = {
  /**
   * Snag Poker, the game: three cards, discard any on the Flop and Turn,
   * compose your hand on the River, play for the pot. Free snags are
   * shuffled into the deck after the Flop.
   */
  draw: {
    preset: 'draw',
    communitySchedule: [3, 1, 1],
    dealSchedule: [3, 0, 0],
    totalJokers: 10,
    shuffledJokerEveryMonths: 2,
    drainPerJoker: 4,
    jokerForfeit: 5,
    pot: true,
    anteEvery: 3,
    streetFeeDivisors: [3, 2],
    startMoney: 50,
  },
};
/** Kansas Draw: the same game with a plain deck, no snags at all. */
PRESETS.kansasDraw = { ...PRESETS.draw, preset: 'kansasDraw', totalJokers: 0 };

export const DEFAULT_CONFIG: RulesConfig = PRESETS.draw;
