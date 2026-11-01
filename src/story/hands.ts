import { PRESETS, ROSTER, newGame, type Action, type ArrangedHand, type GameState, type RulesConfig } from '../engine';
import type { Script } from './script';

/**
 * Morag's lesson on the hands: one round, the deck openly rigged, her cards
 * face up, climbing the ladder street by street. The Flop shows the weak
 * hands (high card, a pair, her two pair); she rifles the deck for cards that
 * suit you, and herself; the Turn pairs the board and shows the middling ones
 * (your flush over her straight, her three twos); you give up the flush to
 * hunt the house; the River shows the big ones (your full house and four of a
 * kind over her full house). See docs/tutorial.md.
 *
 *   The Flop 2♥ 3♣ 4♥. You A♥ 7♠ 4♣; Morag 2♠ 4♦ K♣.
 *   Swaps: you 7♠ 4♣ for 9♥ 6♥; she 4♦ K♣ for 5♠ 6♣.
 *   The Turn 2♦. You swap 9♥ 6♥ for 3♦ 3♠.
 *   The River 3♥. You lay 3♦ 3♠ (four threes); she lays 2♠ (twos full of threes).
 */
export const HANDS = 'hands';

/** No pot, no snags: only the hands. */
const config: RulesConfig = {
  ...PRESETS.kansasDraw,
  preset: HANDS,
  pot: false,
  totalJokers: 0,
  drainPerJoker: 0,
};

const STAND_PAT: Action = { type: 'draw', cardIds: [] };

/** The rigged deal, in the order the cards come off the deck: the Flop, the hole cards (you first), the Flop's swaps (yours, then hers), the Turn, your Turn swap, the River. */
export const handsDeal: ArrangedHand = {
  deck: ['2h', '3c', '4h', 'Ah', '2s', '7s', '4d', '4c', 'Kc', '9h', '6h', '5s', '6c', '2d', '3d', '3s', '3h'],
  opponent: [{ type: 'draw', cardIds: ['4d', 'Kc'] }, STAND_PAT, { type: 'compose', cardIds: ['2s'], jokers: 0 }],
};

const M = 'morag';

/** Placeholder lines (to be written together): enough for her to play open. */
export const handsScript: Script = {
  rounds: [
    {
      flop: [{ size: 'scene', who: M, text: 'I play open: see my cards.', show: true }],
    },
  ],
};

export function newHandsLesson(seed: number): GameState {
  const morag = ROSTER.find((c) => c.id === 'morag')!;
  return newGame(seed, config, [{ def: morag, joins: 'start' }], { story: HANDS, arranged: [handsDeal] });
}
