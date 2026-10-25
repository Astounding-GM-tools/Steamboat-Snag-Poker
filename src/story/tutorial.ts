import { HUMAN_ID, PRESETS, ROSTER, jokerCard, newGame, nextMonth, submitAction, type Action, type ArrangedHand, type GameState, type RulesConfig } from '../engine';
import type { SpeechLine } from '../ui/Speech.svelte';
import type { Script } from './script';

/**
 * Morag's lessons: the deckhand meets Morag MacTavish and learns Snag Poker
 * from the one person on the river who disapproves of it. The script and its
 * reasoning are in docs/tutorial.md; this is the playable copy.
 */
export const TUTORIAL = 'tutorial';

/** Snag Poker without the pot or the snags: those come later in the lessons. */
const config: RulesConfig = {
  ...PRESETS.kansasDraw,
  preset: TUTORIAL,
  pot: false,
  totalJokers: 0,
};

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

/**
 * Round three, room for a snag: the first hand for buttons, both snags in
 * play. You: 8♠ 8♦ K♣ and Grudging Respect; Morag: A♣ K♦ 6♥ and the Solemn
 * Oath. The Flop 8♥ A♦ 4♣, the Turn 4♠, the River J♥. You call twice (no
 * swaps: the deck is arranged). On the River your eights make a full house,
 * which has no room for a snag; three eights with Respect riding still beat
 * her two pair (aces and fours, the Oath riding), and hand her your Respect.
 */
const roundThree: ArrangedHand = {
  deck: ['8h', 'Ad', '4c', '8s', 'Ac', '8d', 'Kd', 'Kc', '6h', '4s', 'Jh'],
  opponent: [STAND_PAT, STAND_PAT, { type: 'compose', cardIds: ['Ac'], jokers: 1 }],
};

/** The snags the lessons hand out: yours to pawn off on her, hers to pawn off on you. */
export const RESPECT = 12;
export const OATH = 13;

/**
 * The buttons come out: from the next round it's a real game, shuffled, for a
 * pot, a knockout until one side has all the buttons. 20 each; the ante is the
 * round number (3, then 4…), a button to see the Turn and one for the River;
 * each snag adds a button of upkeep to the ante, and a lost snag costs 2.
 */
export function giveButtons(prev: GameState): GameState {
  const state = structuredClone(prev);
  state.config = {
    ...state.config,
    pot: true,
    anteEvery: 1,
    drainPerJoker: 1,
    jokerForfeit: 2,
  };
  state.currency = 'buttons';
  for (const p of state.players) {
    p.money = 20;
    p.jokers = [jokerCard(p.id === HUMAN_ID ? RESPECT : OATH)];
  }
  return state;
}

/** The two arranged rounds played as the script asks, and on to the first hand for buttons (tests, and trying it out). */
export function skipToButtons(seed: number): GameState {
  let g = newTutorial(seed);
  g = submitAction(g, STAND_PAT);
  g = submitAction(g, { type: 'draw', cardIds: ['Ah', 'Kh'] });
  g = submitAction(g, { type: 'compose', cardIds: ['Qh', '2d', '2h'], jokers: 0 });
  g = nextMonth(g);
  g = submitAction(g, STAND_PAT);
  g = submitAction(g, { type: 'fold' });
  return nextMonth(giveButtons(g));
}

/** Another knockout after the last: 20 buttons each again, Respect back with you and the Oath with her. */
export function rematch(prev: GameState): GameState {
  const state = giveButtons(prev);
  for (const p of state.players) p.status = 'active';
  state.phase = 'monthEnd';
  return nextMonth(state);
}

export function newTutorial(seed: number): GameState {
  const morag = ROSTER.find((c) => c.id === 'morag')!;
  return newGame(seed, config, [{ def: morag, joins: 'start' }], {
    story: TUTORIAL,
    arranged: [roundOne, roundTwo, roundThree],
  });
}

const M = 'morag';

/**
 * The knockout ends when one side is unbuttoned: her last word reads both the
 * buttons (who won) and the snags (what it meant: they outlive the game). If
 * you are left holding her Oath, she has you swear it, whichever you press.
 */
const AFTER: SpeechLine[] = [
  {
    when: 'wonAll',
    holding: [{ snag: RESPECT, by: 'them' }],
    size: 'scene',
    who: M,
    text: ['Cleaned out by a deckhand.', 'And I do hold a grudging respect for you, it seems. Well done.'],
    replies: [{ label: 'Again?', go: 'rematch' }, { label: 'Thanks, ma’am' }],
  },
  {
    when: 'wonAll',
    holding: [{ snag: RESPECT, by: 'you' }],
    size: 'scene',
    who: M,
    text: ['Cleaned out by a deckhand.', 'Yet your snag remains with you.'],
    replies: [{ label: 'Again?', go: 'rematch' }, { label: 'Thanks, ma’am' }],
  },
  {
    when: 'lostAll',
    holding: [{ snag: RESPECT, by: 'them' }],
    size: 'scene',
    who: M,
    text: ['You are out of buttons.', 'But I do find myself holding a grudging respect for you.'],
    replies: [{ label: 'Again?', go: 'rematch' }, { label: 'Thanks, ma’am' }],
  },
  {
    // Not yet written: the plain loss, Respect still yours.
    when: 'lostAll',
    holding: [{ snag: RESPECT, by: 'you' }],
    size: 'scene',
    who: M,
    text: ['You are out of buttons.', 'And your snag remains with you.'],
    replies: [{ label: 'Again?', go: 'rematch' }, { label: 'Thanks, ma’am' }],
  },
  {
    holding: [{ snag: OATH, by: 'you' }],
    size: 'scene',
    who: M,
    text: ['Now you know what Snag Poker is.', 'Do you swear never to play this game for money?'],
    replies: [{ label: 'I swear' }, { label: 'Yes. I do.' }],
  },
  {
    // A rematch for buttons: no money, so her oath is safe. Draft.
    id: 'rematch',
    branch: true,
    size: 'scene',
    who: M,
    text: ['Buttons are not money, child.', 'My oath is quite safe. Deal.'],
    replies: [{ label: 'Deal', effect: 'rematch', end: true }],
  },
];

export const tutorialScript: Script = {
  rounds: [
    {
      deal: [
        {
          size: 'scene',
          who: M,
          text: ['You, there!', 'Have you seen my lout of a husband?'],
          replies: [{ label: 'Lout?' }, { label: 'Who?' }],
        },
        {
          size: 'scene',
          who: M,
          // Non-breaking hyphens: good‑for‑nothing stays in one piece.
          text: ['Finlay MacTavish by name, good‑for‑nothing by nature.', 'Always sneaking off to play Snag Poker.'],
          replies: [{ label: 'Snag?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'A vile game, fit for drunkards and liars. You don’t know it?',
          replies: [{ label: 'No, ma’am' }],
        },
      ],
      flop: [
        {
          size: 'aside',
          who: M,
          text: 'Three cards each, and three in the middle. This is the Flop.',
          replies: [{ label: 'Flop?' }],
        },
        {
          size: 'aside',
          who: M,
          text: 'Yes, the Flop. Swap what you don’t want. Those are good: keep them.',
          require: [],
        },
      ],
      turn: [
        {
          size: 'aside',
          who: M,
          text: 'A fourth card. This is the Turn.',
          replies: [{ label: 'Turn?' }],
        },
        {
          size: 'aside',
          who: M,
          text: 'Last chance to swap. That ace and that king are no use to you now.',
          replies: [{ label: 'Both?' }],
          // Tap them straight away and you may swap at once: no need to ask.
          require: ['A', 'K'],
        },
        {
          size: 'aside',
          who: M,
          text: 'Between the two of us, I hold two aces. Find something better.',
          require: ['A', 'K'],
        },
      ],
      river: [
        { size: 'aside', who: 'you', text: 'Twos! You tricked me!' },
        {
          size: 'aside',
          who: M,
          text: 'Look again. Your ducks have a friend.',
          replies: [{ label: 'Ducks?' }],
        },
        {
          size: 'aside',
          who: M,
          text: 'Later, child. This is the River: pick cards to go with the ones in the middle.',
          replies: [{ label: 'Five?' }],
        },
        {
          size: 'aside',
          who: M,
          text: 'Five make a hand. Tap all three of yours.',
          require: ['Q', '2', '2'],
        },
      ],
      verdict: [
        {
          size: 'scene',
          who: M,
          text: 'There you go: the mighty aces brought low by a pair of ducks.',
          replies: [{ label: 'Ducks??' }],
        },
        {
          size: 'scene',
          who: M,
          text: [
            'Deuces, child. Ducks, because they look like ducks, see? Aces are bullets, and so on.',
            'Knowing how ducks beat bullets is the same as knowing when to fold and when to call.',
          ],
          replies: [{ label: 'Call?' }, { label: 'Fold?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'I forgot to show you. Here, look.',
          replies: [{ label: 'Next' }],
        },
      ],
    },
    {
      flop: [
        {
          size: 'aside',
          who: M,
          text: 'Want to trade in any card, or check up on what comes next?',
          require: [],
        },
      ],
      turn: [
        {
          size: 'aside',
          who: M,
          text: 'When there’s no cost to stay in the game, that is a Check.',
        },
        {
          size: 'aside',
          who: M,
          text: 'Four hearts in the middle, and I’ve not traded a card. Well?',
          replies: [{ label: 'Fold?' }],
        },
        { size: 'aside', who: M, text: 'Fold.', require: 'fold' },
      ],
      verdict: [
        {
          size: 'scene',
          who: M,
          text: 'Wise. My queen of hearts made the best flush this board allows.',
          show: true,
          replies: [{ label: 'Best?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'Nothing on this table could beat it. And that’s how you dodge snags: you win, or you fold wisely.',
          replies: [{ label: 'Snag?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'Ah yes, snags. We’d need some stakes for that. Here, have some buttons, so we have something for the pot.',
          replies: [{ label: 'Buttons?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'You should NEVER play for money!',
          replies: [{ label: 'Yes, ma’am', effect: 'buttons', end: true }],
        },
      ],
    },
    // Round three, for buttons with both snags in play, is still arranged: the snag lesson. From round four, the knockout.
    {
      // Drafts: the snag explanation is still to be written properly.
      deal: [
        {
          size: 'scene',
          who: M,
          text: 'Here: Grudging Respect, for you. Pawn it off on me, if you can.',
          replies: [{ label: 'Snag?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'A snag is a burden. Win with it in your hand, and the loser takes it. Lose with it, and it costs you.',
          replies: [{ label: 'And yours?' }],
        },
        {
          size: 'scene',
          who: M,
          text: 'A Solemn Oath, never to play Snag Poker for money. You’ll be holding that soon enough.',
          replies: [{ label: 'We’ll see' }],
        },
      ],
      flop: [
        {
          size: 'scene',
          who: M,
          text: 'Now it costs a button to see the next card. You can fold, or pay to stay in the game: that’s a call.',
          replies: [{ label: 'Call?' }],
        },
        { size: 'aside', who: M, text: 'Yes. Call.', require: [] },
      ],
      turn: [{ size: 'aside', who: M, text: 'And again, to see the River.', require: [] }],
      // No word on the River: the callout shows the full house turn into three of a kind as the snag goes in. Drafts from here on.
      verdict: [
        {
          when: 'dumped',
          size: 'scene',
          who: M,
          text: ['Hmph. Grudging Respect, landed on me.', 'I suppose you’ve earned it.'],
          replies: [{ label: 'Next' }],
        },
        {
          when: 'kept',
          size: 'scene',
          who: M,
          text: ['A full house: a fine hand, with no room for a snag.', 'The pot is yours. So is your Respect, still.'],
          replies: [{ label: 'Next' }],
        },
        {
          when: 'lost',
          size: 'scene',
          who: M,
          text: ['And now you carry my Oath.', 'Mind your cards, child.'],
          replies: [{ label: 'Next' }],
        },
        // Someone may go broke on this very hand.
        ...AFTER,
      ],
    },
  ],
  later: { verdict: AFTER },
};
