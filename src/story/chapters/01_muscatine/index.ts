/**
 * Muscatine: Bill's handover, the Dock Fee, and not a single sn— on the way
 * up to the Tri-Cities.
 */
import { DOCK_FEE, type Rival, type Step, type Talk } from '../../mechanics';
import { sandbar, sandbarTalk } from '../../characters/sandy';
import { say, you } from '../../lines';
import { DOCK_FEE_AMOUNT, HARBOUR_HANDS, HARBOUR_MASTER_PURSE } from '../../numbers';
import { LEAVING_MUSCATINE } from '../../log';

/** The river map's leg (public/maptiles/river-1904/chapter-1/travel), and where on it things happen: Muscatine is 0, LeClaire 1. */
/** Chapter one's leg on the chart: Muscatine up to the rapids and LeClaire. */
const CHAPTER_1 = 'chapter-1-upbound';
/** Where the dev jumps put her for The Sandbar (in play the event stream picks the spot, in the middle of the way to the Tri-Cities). */
export const SANDBAR_AT = 0.3;
/** The Tri-Cities landing, as the map's sidecar has it. */
const TRI_CITIES_AT = 0.6429;

/** Willie, as the Captain walks over to the harbour master's: the chain of command, and what he hopes of the run. */
const NEW_FIRST_MATE = [
  'First Mate made Captain, and I am the new First Mate now.',
  'Gus, the engineer, says being First Mate means being the Captain’s eyes and ears, and to write down everything I need to remember and that the Captain should know about.',
].join('\n');

const harbourMaster: Rival = { id: 'harbourMaster', ai: 'stubborn', money: HARBOUR_MASTER_PURSE };

/** The harbour master's office, on Front Street up from the levee (on the Commission's chart, global pixels). */
const HARBOUR_OFFICE: [number, number] = [26420, 76300];

/**
 * One morning at Muscatine, all of it on the chart: the view comes in to her at the levee as Willie
 * types the day; Bill's hands aboard; the Captain's walk to the harbour master's (the view pans into town,
 * Willie writing who's captain now); the dock fee played for there; then back to her, and she casts off.
 */
export const muscatine: Step[] = [
  { type: 'dawn' },
  { type: 'shot', opening: true, log: { text: LEAVING_MUSCATINE.opening }, seconds: 16, wait: true },
  {
    type: 'encounter',
    // A few friendly hands on deck, for nothing: the talk is the point (RIVER_TALK.bill).
      encounter: {
          id: 'bill', stake: 'purse', rivals: [{ id: 'steamboatBill', ai: 'stubborn', money: 50 }], goal: {
              type: 'evening'
          }, hands: 3, rules: { pot: false }
      },
    solved: [],
    effects: { snag: DOCK_FEE },
  },
  // Over to the harbour master's office: Willie on the new captain as the view walks into town (he types on through the game there).
  // (It waits for him: the harbour master's table would hide what he's writing.)
  { type: 'shot', look: HARBOUR_OFFICE, log: { text: NEW_FIRST_MATE }, seconds: 12, wait: true },
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
        // (Counted: whoever holds the bill after the last hand pays it.)
        encounter: { id: 'harbourMaster', stake: 'purse', rivals: [harbourMaster], goal: { type: 'evening' }, hands: HARBOUR_HANDS, counted: true },
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
    // Made fast bow-first at the Muscatine levee, below the town and the bridge, where the river opens out, on the Commission's chart (global pixels).
    landing: [26639, 76467],
    // Out of Muscatine, a crate first, always: the new Captain's first salvage (then the river's own coin flips).
    fills: ['crate'],
    // Past The Sandbar, a crate in the starboard passage round each island (Horse Island), there to be spotted.
    laneCrates: { side: 'starboard', afterMain: true },
    // The Sandbar, around two thirds of the way (sandbars shift from season to season), after Willie's had his say: the event stream picks the moment.
    main: {
      window: [0.55, 0.75],
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
        // Good news or bad? Either way it comes to the same thing: you're the captain now.
        deal: [
          {
            ...said(['Landed a big job.', 'Horseless carriage, up in Dubuque, bound for the World’s Fair in St. Louis.']),
            replies: [
              { label: 'Bad', go: 'bad' },
              { label: 'Good', go: 'good' },
            ],
          },
          { ...you('This is good news, isn’t it, Captain?'), id: 'good', branch: true, next: 'timing' },
          { ...said('Good money. And the worst timing of my life.'), id: 'timing', branch: true, replies: [{ label: 'Why?', go: 'why' }] },
          { ...said('Because you’re the captain now.'), id: 'why', branch: true, replies: [{ label: 'Me?', end: true }] },
          { ...you('You say that like it’s bad news, Captain?'), id: 'bad', branch: true, next: 'making' },
          { ...said(['It is good news. It’s just the timing that’s bad.', 'Because I can’t come with. I’m making you the captain.']), id: 'making', branch: true, replies: [{ label: 'Me?', end: true }] },
        ],
        flop: [
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
          said(['The river’s no place for little ones, and she needs the doctor’s care.', 'This is how it must be. I’ve made my decision.']),
        ],
        verdict: [
          said(['Here. The dock fee bill for the winter, and fifty dollars. Enough to settle it, with a little over for food and coal. Past that, you’ll find your own cargo.', 'Mind her well, Captain. And stay away from those whiskey-swilling gamblers on the grand steamers.']),
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
            text: ['It’s a fine day on river, Captain!', 'Clear water up to the Tri-Cities, Mr. Klemm says, and not a single sn—'],
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
