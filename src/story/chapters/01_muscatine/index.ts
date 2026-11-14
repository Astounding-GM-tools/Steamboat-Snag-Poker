/**
 * Muscatine: Bill's handover, the Dock Fee, and not a single sn— on the way
 * up to the Tri-Cities.
 */
import { DOCK_FEE, type Rival, type Step, type Talk } from '../../mechanics';
import { sandbar, sandbarTalk } from '../../characters/sandy';
import { say, you } from '../../lines';
import { DOCK_FEE_AMOUNT, HARBOUR_HANDS, HARBOUR_MASTER_PURSE } from '../../numbers';

/** The river map's leg (public/maptiles/river-1904/chapter-1/travel), and where on it things happen: Muscatine is 0, LeClaire 1. */
const CHAPTER_1 = 'chapter-1';
/** Where the dev jumps put her for The Sandbar (in play the event stream picks the spot, in the middle of the way to the Tri-Cities). */
export const SANDBAR_AT = 0.3;
/** The Tri-Cities landing, as the map's sidecar has it. */
const TRI_CITIES_AT = 0.6429;

/** Willie's second musing, a little way out of Muscatine: the chain of command, and Bill's missus. */
const NEW_FIRST_MATE = [
  'Captain Bill stayed behind, to care for Missus Bill, who is poorly.',
  'So we have a new captain, and I am the First Mate now.',
  'Gus says that means to write everything down, and to do any job that someone else hasn’t already done.',
  '',
  'I hope Bill’s missus will be all right.',
  'She’s always been kind to me.',
  'She’ll need medicine.',
  'I hope we’ll make good money on the run.',
  'Find prime salvage along the way.',
  'And not leave it all at the table.',
].join('\n');

const harbourMaster: Rival = { id: 'harbourMaster', ai: 'stubborn', money: HARBOUR_MASTER_PURSE };

export const muscatine: Step[] = [
  {
    type: 'caption',
    lines: [{ text: 'Muscatine, on the Mississippi.' }, { text: 'The first day of spring, which is what some folks call the day the ice goes out.' }],
  },
  {
    type: 'encounter',
    // A few friendly hands on deck, for nothing: the talk is the point (RIVER_TALK.bill).
    encounter: { id: 'bill', stake: 'purse', rivals: [{ id: 'steamboatBill', ai: 'stubborn', money: 50 }], goal: { type: 'evening' }, hands: 3, rules: { pot: false } },
    solved: [],
    effects: { snag: DOCK_FEE },
  },
  { type: 'dawn' },
  {
    type: 'scene',
    steps: [
      {
        type: 'encounter',
        // Only talk (RIVER_TALK.harbourTalk): nothing's staked or dealt until it's agreed.
        encounter: { id: 'harbourTalk', stake: 'purse', rivals: [harbourMaster], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
        solved: [],
        choices: {
          pay: { effects: { settle: { snag: DOCK_FEE, amount: DOCK_FEE_AMOUNT } }, end: true },
          snag: {},
        },
      },
      {
        type: 'encounter',
        encounter: { id: 'harbourMaster', stake: 'purse', rivals: [harbourMaster], goal: { type: 'evening' }, hands: HARBOUR_HANDS },
        solved: [],
        // Whoever holds the bill after five hands settles it.
        effects: { settle: { snag: DOCK_FEE, amount: DOCK_FEE_AMOUNT } },
      },
    ],
  },
  // The felt lifts: the map beneath it, and the Best Intentions steaming up from Muscatine to the Tri-Cities.
  {
    type: 'steam',
    leg: CHAPTER_1,
    to: TRI_CITIES_AT,
    // Made fast bow-first at the Muscatine levee, below the town and above the bridge, on the 1890 chart.
    landing: [2708, 13058],
    // Willie's log, not the crew's chatter: a musing a little way out, then the river and the islands.
    musings: [{ at: 0.3, text: NEW_FIRST_MATE }],
    // The Sandbar, somewhere around the middle (sandbars shift from season to season): the event stream picks the moment.
    main: {
      window: [0.4, 0.6],
      steps: [
        {
          type: 'encounter',
          // Under way, Willie talking (RIVER_TALK.underway), and then not.
          encounter: { id: 'underway', stake: 'purse', rivals: [{ id: 'willie', ai: 'loose', money: 50 }], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
          solved: [],
          choices: { aground: {} },
        },
        {
          type: 'encounter',
          encounter: sandbar,
          solved: [],
          failed: [],
          stuck: true,
        },
      ],
    },
  },
  { type: 'travel', coal: 2, to: 'triCities' },
  { type: 'nightfall' },
  { type: 'hub', hub: 'triCities' },
];

const said = (text: string | string[]) => say('steamboatBill', text);
const master = (text: string) => say('harbourMaster', text);

export const muscatineTalk: Record<string, Talk> = {
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
          you('Why not Mr. Klemm? No one knows the boat better.'),
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
        verdict: [
          said(['Here. The dock fee for the winter, and fifty dollars. Enough to settle it, with a little over for food and coal. Past that, you’ll find your own cargo.', 'Mind her well, Captain. And stay away from those whiskey-swilling gamblers on the grand steamers.']),
        ],
      },
    ],
  },
  harbourTalk: {
    rounds: [
      {
        deal: [
          {
            ...master('Here to pay your dock fee, I suppose? Thirty-seven dollars. A good deal of money.'),
            replies: [
              { label: 'Pay', effect: 'pay', end: true },
              { label: 'Snag', go: 'snag' },
            ],
          },
          {
            ...master('Hrmpf. The River Code: can’t refuse that. But only five rounds, and whoever holds the bill after that settles it. Agreed?'),
            id: 'snag',
            branch: true,
            replies: [
              { label: 'Pay', effect: 'pay', end: true },
              { label: 'Deal', effect: 'snag', end: true },
            ],
          },
        ],
      },
    ],
  },
  underway: {
    rounds: [
      {
        deal: [
          {
            size: 'scene',
            who: 'willie',
            text: ['First boat up the river this year, Captain, and not a soul ahead of us!', 'Clear water to the Tri-Cities, Mr. Klemm says, and not a single sn—'],
            replies: [{ label: 'Single what?' }],
          },
          // She's hit it: Willie first, then Gus; then the sandbar's table comes up.
          { size: 'scene', who: 'willie', mood: 'nervous', jolt: true, text: ['Snag! We are aground, Captain!', 'Stuck fast!'] },
          {
            size: 'scene',
            who: 'gus',
            mood: 'nervous',
            text: ['We have run aground on a sandbar, Captain. The engine alone can’t shift us, we need shovels and poles.', 'Pray that our strength outlasts the work, or we will spend the night right here.'],
            replies: [{ label: 'Next', effect: 'aground', end: true }],
          },
        ],
      },
    ],
  },
  sandbar: sandbarTalk,
  harbourMaster: {
    rounds: [
      {},
      {},
      {},
      {},
      {
        verdict: [
          { ...master('Thirty-seven dollars, Captain. Pleasure doing business.'), holding: [{ snag: DOCK_FEE, by: 'you' }] },
          { ...master('Hrmpf. Mine to settle, then. Off with you.'), holding: [{ snag: DOCK_FEE, by: 'them' }] },
        ],
      },
    ],
  },
};
