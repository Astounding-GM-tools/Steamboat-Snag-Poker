/**
 * Steamboat to St. Louis: the voyage's days, as steps (src/engine/journey.ts
 * plays them; docs/story.md says why). So far the first stretch: Muscatine,
 * the harbour master and the Sandbar on day one, the Tri-Cities and the coal
 * yard on day two.
 */
import type { EncounterDef, Step, StoryDef } from '../engine';
import { TROUBLE } from '../engine';
import type { Script } from './script';

/** The evening's game aboard: crew and lantern, for buttons. */
const deckGame: EncounterDef = { id: 'deck', stake: 'strength', rivals: 'crew', goal: { type: 'evening' }, hands: 3 };

const deckLines: Step = {
  type: 'encounter',
  encounter: deckGame,
  solved: [{ text: 'The lantern gutters. Lars is asleep at the table.' }],
};

const sandbar: EncounterDef = {
  id: 'sandbar',
  stake: 'strength',
  rivals: [{ id: 'sandbar', ai: 'stubborn', money: 12, jokers: [TROUBLE.brokenPole, TROUBLE.twistedShaft], obstacle: true }],
  goal: { type: 'clear' },
  hands: 6,
  // The river plays dear from the first hand: an ante of 2, then 3 (as if three hands were already past).
  rules: { jokerForfeit: 0, antePast: -3 },
};

const day1: Step[] = [
  {
    type: 'caption',
    lines: [{ text: 'Muscatine, on the Mississippi.' }, { text: 'The first day of spring, which is what they call the day the ice goes out.' }],
  },
  {
    type: 'encounter',
    // A few friendly hands on deck, for nothing: the talk is the point (RIVER_TALK.bill).
    encounter: { id: 'bill', stake: 'purse', rivals: [{ id: 'steamboatBill', ai: 'stubborn', money: 50 }], goal: { type: 'evening' }, hands: 3, rules: { pot: false } },
    solved: [],
  },
  { type: 'dawn' },
  {
    type: 'caption',
    lines: [
      { who: 'harbourMaster', text: 'Not so fast, Captain. Harbour dues.' },
      { who: 'harbourMaster', text: 'Or try your luck: beat me at Snag, just the once, and you sail free.' },
    ],
  },
  {
    type: 'encounter',
    encounter: { id: 'harbourMaster', stake: 'purse', rivals: [{ id: 'harbourMaster', ai: 'stubborn', money: 30 }], goal: { type: 'winPot' }, hands: 12 },
    solved: [{ who: 'harbourMaster', text: 'Hmph. Cleared. Mind the sand above town.' }],
    failed: [{ who: 'harbourMaster', text: 'Cleaned out at the harbour? Go on, then. And don’t come back broke.' }],
  },
  {
    type: 'caption',
    lines: [
      { text: 'Two hours above Muscatine…' },
      { who: 'willie', text: 'Sandbar, Captain! Dead ahead!' },
      { who: 'sandbar', text: 'Going somewhere?' },
    ],
  },
  {
    type: 'encounter',
    encounter: sandbar,
    solved: [{ text: 'The Best Intentions floats free. The sand drifts off downstream, to make a sandbar somewhere else.' }],
    failed: [{ text: 'Night falls with the Best Intentions still aground.' }],
    stuck: true,
    relent: [
      { text: 'A packet boat comes thrashing down the river, and her captain throws you a line.' },
      { who: 'willie', text: 'She’s off, Captain! We’re floating!' },
    ],
  },
  { type: 'travel', coal: 2, to: 'triCities' },
  {
    type: 'caption',
    lines: [
      { text: 'The Tri-Cities: Davenport, Rock Island, Moline. And since last year, Bettendorf. Or is it still three?' },
      { who: 'willie', text: 'They’re batty about betting here, Captain.' },
      { who: 'tripp', text: 'House rule: we play till somebody wins with three of a kind.' },
      { who: 'odds', text: 'In Bettendorf we hold out for four. Five to one it’s three tonight.' },
    ],
  },
  {
    type: 'encounter',
    encounter: {
      id: 'triCities',
      stake: 'purse',
      rivals: [
        { id: 'tripp', ai: 'careful', money: 30 },
        { id: 'odds', ai: 'loose', money: 30 },
      ],
      goal: { type: 'trips' },
      hands: 6,
    },
    solved: [{ who: 'tripp', text: 'That settles it. For tonight.' }],
  },
];

const day2: Step[] = [
  { type: 'dawn' },
  {
    type: 'caption',
    lines: [
      { text: 'The coal yard on the Rock Island levee. Not a shovel moving.' },
      { who: 'foreman', text: 'We’re out, Captain. On strike. Not a lump leaves this yard.' },
      { who: 'gus', text: 'We’ll not climb the rapids on what’s in the bunker.' },
    ],
  },
  {
    type: 'council',
    advice: [
      { who: 'willie', text: 'The foreman plays cards of an evening, Captain. A friendly game, for the strike fund.' },
      { who: 'gus', text: 'Strike fund’s thin, they say. Thin as gruel.' },
      { who: 'lars', text: 'Hm. Hm-hm.' },
    ],
    trader: ['food', 'sparePole', 'hammocks'],
    coal: 0,
    leave: 'To the coal yard',
  },
  {
    type: 'caption',
    lines: [
      { text: 'Evening, at the coal yard.' },
      { who: 'foreman', text: 'A friendly game, Captain? For the strike fund, mind. Times are hard.' },
    ],
  },
  {
    type: 'encounter',
    encounter: {
      id: 'foreman',
      stake: 'purse',
      rivals: [{ id: 'foreman', ai: 'careful', money: 25 }],
      goal: { type: 'lose', min: 12, max: 25 },
      hands: 10,
    },
    solved: [{ who: 'foreman', text: 'Hard luck, Captain. Take a few sacks for your boiler. No hard feelings.' }],
    failed: [{ who: 'foreman', text: 'You’ve a hard heart for a young fellow, Captain. Come back tomorrow.' }],
    effects: { coal: 4 },
    stuck: true,
    relent: [{ who: 'foreman', text: 'Ah, take the coal, Captain. You’ll lose it back to us some other night.' }],
  },
  { type: 'caption', lines: [{ text: 'Back aboard, after supper. The crew gather round the lantern.' }] },
  deckLines,
  {
    type: 'caption',
    title: 'To be continued',
    lines: [{ text: 'Next: the Rock Island Rapids, and Kitty Sawyer, the best pilot on the river.' }],
  },
];

export const RIVER: StoryDef = {
  days: [
    { day: 1, place: 'muscatine', steps: day1 },
    { day: 2, place: 'triCities', steps: day2 },
  ],
  stuckNight: [{ type: 'caption', lines: [{ text: 'Supper on deck, and the lantern lit.' }] }, deckLines],
};

/** Bill leaves the new captain this much, and the bunker as it is. */
export const RIVER_START = { purse: 40, coal: 2 };

const said = (text: string | string[]) => ({ size: 'scene' as const, who: 'steamboatBill', text });
const you = (text: string) => ({ size: 'scene' as const, who: 'you', text });

/**
 * What's said at the table, by encounter and hand. The talk goes in before the
 * deal and on the Flop: a hand folded early would never reach the later streets.
 */
export const RIVER_TALK: Record<string, Script> = {
  bill: {
    rounds: [
      {
        deal: [
          { ...said('I’ve landed a big job. A horseless carriage, up in Dubuque, bound for the World’s Fair in St. Louis. It has to be there the day the Fair opens.'), replies: [{ label: 'Good?' }] },
          you('That’s good news, isn’t it, Captain?'),
          { ...said('Good money. And the worst timing of my life.'), replies: [{ label: 'Why?' }] },
        ],
        flop: [
          { ...said('Because you’re the captain now.'), replies: [{ label: 'Me?' }] },
          you('Me? I’m only the first mate.'),
          { ...said('That’s what a first mate is for.'), replies: [{ label: 'Gus?' }] },
          you('Why not Mr. Klemm? No one knows the ship better.'),
          said('Gus only cares about his engine. He’d stay in port all day cleaning it if he could.'),
        ],
      },
      {
        flop: [
          { ...said('Any other bright ideas?'), replies: [{ label: 'Lars?' }] },
          you('Lars, then. He’s a grown man, and stronger than anyone.'),
          { ...said(['Lars doesn’t speak the language. We’re not even sure that’s his name.', 'And he’s a hopeless Snag player.']), replies: [{ label: 'Snag?' }] },
          you('What has Snag got to do with captaining?'),
          said(['Everything. Poker is what makes the river run.', 'Every decision on the river is made over a hand of cards. Just as we’re doing now.']),
        ],
      },
      {
        deal: [
          { ...said('Well?'), replies: [{ label: 'Willie?' }] },
          you('Willie, then. He’s a great player, and everyone likes him.'),
          said('Too young, and too eager. Maybe in a few seasons. For now, it’s your turn.'),
        ],
        flop: [
          { ...said('My wife’s taken ill. She needs me here, and so do the little ones.'), replies: [{ label: 'Bring them?' }] },
          you('Can’t they come with us, on the river?'),
          said(['The river’s no place for little’uns, and she needs the doctor’s care.', 'This is how it must be. I’ve made my decision.']),
        ],
        verdict: [said(['Here. It’s all I can spare.', 'Mind her well, Captain. And stay away from those whiskey-swilling gamblers on the grand steamers.'])],
      },
    ],
  },
};
