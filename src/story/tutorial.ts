import { PRESETS, ROSTER, newGame, type Action, type ArrangedHand, type GameState, type RulesConfig } from '../engine';
import type { Script } from './script';

/**
 * Morag's lessons: the deckhand meets Morag MacTavish and learns Snag Poker
 * from the one person on the river who disapproves of it. The script and its
 * reasoning are in docs/tutorial.md; this is the playable copy.
 */
export const TUTORIAL = 'tutorial';

/** Snag Poker without the pot or the snags: those come later in the lessons. */
const config: RulesConfig = { ...PRESETS.kansasDraw, preset: TUTORIAL, pot: false, totalJokers: 0 };

const STAND_PAT: Action = { type: 'draw', cardIds: [] };

/**
 * Round one, Ducks full of Ladies. You: Q♥ K♥ A♥; Morag: A♣ A♦ 9♠; the Flop
 * A♠ 7♥ 2♣. You keep, the Turn brings Q♠, you swap the ace and the king for
 * two deuces, the River is 5♦. Your deuces full of queens beat her three aces;
 * the board never pairs, so she can't make a full house of her own.
 */
const roundOne: ArrangedHand = {
  deck: ['As', '7h', '2c', 'Qh', 'Ac', 'Kh', 'Ad', 'Ah', '9s', 'Qs', '2d', '2h', '5d'],
  opponent: [STAND_PAT, STAND_PAT, { type: 'compose', cardIds: ['Ac', 'Ad'], jokers: 0 }],
};

/**
 * Round two, the wise fold. You: J♠ J♦ 3♣, a pair; Morag: Q♥ 10♥ 5♣, a flush
 * on the Flop (A♥ K♥ 9♥), the best there is. She stands pat twice; the Turn
 * brings a fourth heart, you have none, and her untouched hand says the rest.
 * (The J♥ would have made her a royal flush.)
 */
const roundTwo: ArrangedHand = {
  deck: ['Ah', 'Kh', '9h', 'Js', 'Qh', 'Jd', 'Th', '3c', '5c', '4h'],
  opponent: [STAND_PAT, STAND_PAT],
};

export function newTutorial(seed: number): GameState {
  const morag = ROSTER.find((c) => c.id === 'morag')!;
  return newGame(seed, config, [{ def: morag, joins: 'start' }], { story: TUTORIAL, arranged: [roundOne, roundTwo] });
}

const M = 'morag';

export const tutorialScript: Script = [
  {
    deal: [
      { size: 'scene', who: M, text: 'You, there! Have you seen my lout of a husband?', replies: [{ label: 'Lout?' }, { label: 'Who?' }] },
      {
        size: 'scene',
        who: M,
        text: 'Finlay MacTavish by name, good-for-nothing by nature. Always sneaking off to play Snag Poker.',
        replies: [{ label: 'Snag?' }],
      },
      { size: 'scene', who: M, text: 'A vile game, fit for drunkards and liars. You don’t know it?', replies: [{ label: 'No, ma’am' }] },
    ],
    flop: [
      { size: 'aside', who: M, text: 'Three cards each, and three in the middle. This is the Flop.', replies: [{ label: 'Flop?' }] },
      { size: 'aside', who: M, text: 'Yes, the Flop. Swap what you don’t want. Those are good: keep them.', require: [] },
    ],
    turn: [
      { size: 'aside', who: M, text: 'A fourth card. This is the Turn.', replies: [{ label: 'Turn?' }] },
      { size: 'aside', who: M, text: 'Last chance to swap. That ace and that king are no use to you now.', replies: [{ label: 'Both?' }] },
      { size: 'aside', who: M, text: 'Between the two of us, I hold two aces. Find something better.', require: ['A', 'K'] },
    ],
    river: [
      { size: 'aside', who: 'you', text: 'Twos! You tricked me!' },
      { size: 'aside', who: M, text: 'Look again. Your ducks have a friend.', replies: [{ label: 'Ducks?' }] },
      { size: 'aside', who: M, text: 'Hush. Play your hand.' },
      { size: 'aside', who: M, text: 'The River. Pick cards to go with the ones in the middle.', replies: [{ label: 'Five?' }] },
      { size: 'aside', who: M, text: 'Five make a hand. Tap all three of yours.', require: ['Q', '2', '2'] },
    ],
    verdict: [
      { size: 'scene', who: M, text: 'There you go: the mighty aces brought low by a pair of ducks.', replies: [{ label: 'Ducks?' }] },
      {
        size: 'scene',
        who: M,
        text: 'Deuces, child. Ducks, on the river. Aces are bullets, and so on. Knowing how ducks beat bullets is the same as knowing when to fold and when to call.',
        replies: [{ label: 'Call?' }, { label: 'Fold?' }],
      },
      { size: 'scene', who: M, text: 'I forgot to show you. Here, look.', replies: [{ label: 'Next', effect: 'next', end: true }] },
    ],
  },
  {
    flop: [{ size: 'aside', who: M, text: 'Want to trade in any card, or check up on what comes next?', require: [] }],
    turn: [
      { size: 'aside', who: M, text: 'When there’s no cost to stay in the game, that is a Check.' },
      { size: 'aside', who: M, text: 'Four hearts in the middle, and I’ve not traded a card. Well?', replies: [{ label: 'Fold?' }] },
      { size: 'aside', who: M, text: 'Fold.', require: 'fold' },
    ],
    verdict: [
      { size: 'scene', who: M, text: 'Wise. My queen of hearts made the best flush there is.', replies: [{ label: 'Best?' }] },
      {
        size: 'scene',
        who: M,
        text: 'Nothing on this table could beat it. And that’s how you dodge snags: you win, or you fold wisely.',
        replies: [{ label: 'Snag?' }],
      },
      // The pickle isn't written yet: for now the lesson ends with the buttons.
      {
        size: 'scene',
        who: M,
        text: 'Ah yes, snags. We’d need some stakes for that. Here, have some buttons, so we have something for the pot.',
        replies: [{ label: 'Next', effect: 'end', end: true }],
      },
    ],
  },
];
