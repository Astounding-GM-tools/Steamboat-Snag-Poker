/**
 * Steamboat to St. Louis: the voyage's days, as steps (src/engine/journey.ts
 * plays them; docs/story.md says why). So far the first stretch: Muscatine,
 * the harbour master and the Sandbar on day one, the Tri-Cities and the coal
 * yard on day two.
 */
import type { EncounterDef, Step, StoryDef } from '../engine';
import { TROUBLE } from '../engine';

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
    title: 'Steamboat to St. Louis',
    lines: [
      { text: 'Muscatine, Iowa. Spring, 1904.' },
      { text: 'The ice is off the river, and the first boats of the year are stirring.' },
      { text: 'Steamboat Bill has landed a Big Snag: a horseless carriage, to be fetched from Dubuque and delivered to the World’s Fair in St. Louis by opening day.' },
    ],
  },
  {
    type: 'caption',
    lines: [
      { who: 'steamboatBill', text: 'Family calls, and family comes first. I’m needed ashore.' },
      { who: 'steamboatBill', text: 'You’re the captain now. Just stay away from those whiskey-swilling river gamblers and their Snag Poker!' },
      { who: 'willie', text: 'Aye aye, Captain!' },
    ],
  },
  { type: 'dawn' },
  {
    type: 'council',
    advice: [
      { who: 'gus', text: 'She’ll burn two loads to the Tri-Cities, Captain. More if we’re held up.' },
      { who: 'willie', text: 'Sand’s been shifting above town, they say. A spare pole wouldn’t hurt.' },
      { who: 'lars', text: 'Hm.' },
    ],
    trader: ['coal', 'food', 'sparePole', 'hammocks'],
    coal: 2,
  },
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

/** Father leaves the new captain this much, and the bunker as it is. */
export const RIVER_START = { purse: 40, coal: 2 };
