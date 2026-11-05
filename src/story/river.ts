/**
 * Steamboat to St. Louis: the voyage's days, as steps (src/engine/journey.ts
 * plays them; docs/story.md says why). So far the first stretch: Muscatine,
 * the harbour master and the Sandbar on day one, the Tri-Cities and the coal
 * yard, the queue for the pilot at Davenport (the Tri-Cities are a hub: a list
 * of things to do, morning and evening), up the rapids to LeClaire.
 */
import type { EncounterDef, Hub, HubOption, Rival, Slot, Step, StoryDef } from '../engine';
import { DOCK_FEE, PAMPHLETS, Rng, STRIKE_BUTTON, TROUBLE, snagDef } from '../engine';
import { t } from '../i18n';
import type { SpeechLine } from '../ui/Speech.svelte';
import type { RoundScript, Talk, TalkContext } from './script';

/** The evening's game aboard: crew and lantern, for buttons. */
const deckGame: EncounterDef = { id: 'deck', stake: 'strength', rivals: 'crew', goal: { type: 'evening' }, hands: 3, rules: { drainPerJoker: 0, jokerForfeit: 0 } };

const deckLines: Step = {
  type: 'encounter',
  encounter: deckGame,
  solved: [],
  // How an evening ends: one a day, in turn.
  closers: [
    [{ text: 'The wick burns low and gutters.' }],
    [{ text: 'The kerosene is in short supply.' }],
    [{ text: 'The moon is out and very pretty tonight. After cards, you watch it for a while as Lars sings.' }],
    [{ text: 'The river speaks to you, of faraway places it has visited and soon will visit again.' }],
    [{ text: 'The lantern goes out. You hear a frog complaining about the weather.' }],
    [{ text: 'It’s a rainy night, and the roof has a leak. Should fix that in the morning.' }],
  ],
};

/** Big enough, and late enough in the day, that the boat usually spends the night on it. */
const SANDBAR_PILE = 20;
const SANDBAR_HANDS = 4;
const sandbar: EncounterDef = {
  id: 'sandbar',
  stake: 'strength',
  rivals: [{ id: 'sandbar', ai: 'stubborn', money: SANDBAR_PILE, jokers: [TROUBLE.brokenPole, TROUBLE.brokenPaddle, TROUBLE.twistedAxle], obstacle: true }],
  goal: { type: 'clear' },
  hands: SANDBAR_HANDS,
  // The river plays dear from the first hand: an ante of 2, then 3 (as if three hands were already past).
  rules: { jokerForfeit: 0, antePast: -3 },
};

/** The winter's mooring, and what Bill leaves you to pay it with. */
const DOCK_FEE_AMOUNT = 37;
const harbourMaster: Rival = { id: 'harbourMaster', ai: 'stubborn', money: 40 };

const TRI_CITIES_HANDS = 6;
const FOREMAN_HANDS = 8;
/** Lost at showdowns: what the strike fund needs before the coal turns up. */
const FOREMAN_LOSS = 12;

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
    effects: { snag: DOCK_FEE },
  },
  { type: 'dawn' },
  {
    type: 'encounter',
    // Only talk (RIVER_TALK.harbourTalk): nothing's staked or dealt until it's agreed.
    encounter: { id: 'harbourTalk', stake: 'purse', rivals: [harbourMaster], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
    solved: [],
    choices: {
      pay: { effects: { settle: { snag: DOCK_FEE, amount: DOCK_FEE_AMOUNT } }, skip: 1 },
      snag: {},
    },
  },
  {
    type: 'encounter',
    encounter: { id: 'harbourMaster', stake: 'purse', rivals: [harbourMaster], goal: { type: 'evening' }, hands: 5 },
    solved: [],
    // Whoever holds the bill after five hands settles it.
    effects: { settle: { snag: DOCK_FEE, amount: DOCK_FEE_AMOUNT } },
  },
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
    jolt: true,
    solved: [],
    failed: [],
    stuck: true,
  },
  { type: 'travel', coal: 2, to: 'triCities' },
  { type: 'nightfall' },
  { type: 'hub', hub: 'triCities' },
];

const ENTRANTS = [
  { id: 'konrad', ai: 'bully' as const },
  { id: 'maxMoritz', ai: 'griefer' as const },
  { id: 'ignatz', ai: 'anarchist' as const },
  { id: 'nemo', ai: 'dreamer' as const },
  { id: 'walrus', ai: 'shark' as const },
  { id: 'lenny', ai: 'defeatist' as const },
  { id: 'eliza', ai: 'predator' as const },
];
const MORNING_ENTRY = 5;
const NOON_ENTRY = 10;
/** A table goes on till one has it all; this is only so it can't go on for ever. */
const TOURNAMENT_HANDS = 40;
const RAPIDS_HANDS = 8;

const DOCKING_FEE = 3;
const DAYTIME: Slot[] = ['morning', 'afternoon'];
const CLIMB_COAL = 6;

/** The Pilot Tournament, at Davenport. Lost at either table, the day's done. */
const tournament: Step[] = [
  { type: 'draw', entrants: ENTRANTS, tableSize: 3, finalists: 2 },
  {
    type: 'encounter',
    encounter: {
      id: 'morning',
      stake: 'purse',
      rivals: [],
      joined: 'mates',
      entry: MORNING_ENTRY,
      goal: { type: 'lastStanding' },
      hands: TOURNAMENT_HANDS,
      rules: { drainPerJoker: 0, jokerForfeit: 0 },
    },
    solved: [],
    failed: [],
    failSkip: 4,
  },
  {
    type: 'encounter',
    encounter: {
      id: 'noon',
      stake: 'purse',
      rivals: [{ id: 'ellie', ai: 'swashbuckler', money: NOON_ENTRY }],
      joined: 'finalists',
      entry: NOON_ENTRY,
      goal: { type: 'lastStanding', host: 'ellie' },
      hands: TOURNAMENT_HANDS,
      rules: { drainPerJoker: 0, jokerForfeit: 0 },
    },
    solved: [{ who: 'ellie', text: 'That’s you, Captain. Get your hat.' }],
    failed: [{ who: 'ellie', text: 'Not today, Captain. Same time tomorrow.' }],
    failSkip: 3,
  },
  {
    type: 'encounter',
    encounter: {
      id: 'rapids',
      stake: 'strength',
      rivals: [{ id: 'rapids', ai: 'careful', money: 14, jokers: [TROUBLE.bustedBoiler, TROUBLE.fatigue], obstacle: true }],
      goal: { type: 'clear' },
      hands: RAPIDS_HANDS,
      rules: { jokerForfeit: 0 },
    },
    jolt: true,
    solved: [],
    failed: [],
    stuck: true,
  },
  { type: 'travel', coal: 3, to: 'leClaire' },
  { type: 'leave' },
  { type: 'nightfall' },
];

/** The coal depot at Rock Island: friendly, and on strike. */
const depot: Step[] = [
  {
    type: 'encounter',
    // Only talk (RIVER_TALK.depotTalk): nothing's staked or dealt until it's agreed.
    encounter: { id: 'depotTalk', stake: 'purse', rivals: [{ id: 'foreman', ai: 'careful', money: 25 }], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
    solved: [],
    choices: { leave: { skip: 2 }, snag: {} },
  },
  {
    type: 'encounter',
    encounter: {
      id: 'depot',
      stake: 'purse',
      rivals: [
        { id: 'foreman', ai: 'careful', money: 30, jokers: [PAMPHLETS], obliging: true },
        { id: 'rourke', ai: 'loose', money: 30, jokers: [STRIKE_BUTTON], obliging: true },
      ],
      goal: { type: 'lose', min: FOREMAN_LOSS, max: 25 },
      hands: FOREMAN_HANDS,
    },
    solved: [],
    failed: [],
    effects: { coal: 6 },
  },
  { type: 'slot' },
];

/** A job: it fills the slot, burns its coal and pays. */
const job = (id: string, text: string, pays: number, flag?: string): HubOption => ({
  id: `job:${id}`,
  times: DAYTIME,
  coal: 1,
  ...(flag ? { flag } : {}),
  steps: [{ type: 'caption', lines: [{ text }], effects: { purse: pays, coal: -1, ...(flag ? { clear: flag } : {}) } }, { type: 'slot' }],
});

const triCities: Hub = {
  advice: (state) => {
    if (state.submenu === 'jobs') return { who: 'willie', text: 'At these coal prices the mail doesn’t pay, Captain. It doesn’t pay at all.' };
    const troubled = state.snags.find((j) => snagDef(j.index).kind === 'trouble');
    if (troubled && state.time === 'evening') return { who: 'gus', text: `${capital(t(`joker.${troubled.index}`))} wants seeing to, Captain. A night at anchor would do it.` };
    if (state.purse < MORNING_ENTRY) return { who: 'willie', text: 'We’re near broke, Captain. I could wade ashore and ask around.' };
    if (state.flags.includes('met:deckIntel') && state.coal < CLIMB_COAL) return { who: 'gus', text: 'She’ll want a full bunker for the rapids, Captain.' };
    if (state.time === 'evening') return { who: 'willie', text: 'They’re batty about betting in Bettendorf, Captain. Everyone knows that, up and down the river.' };
    return null;
  },
  options: [
    {
      id: 'anchor',
      times: ['evening'],
      steps: [
        { type: 'caption', lines: [{ text: 'You anchor downstream of the dock, where it’s free. Willie wades ashore, looking for work and gossip.' }], effects: { flag: 'jobFound' } },
        { ...deckLines, encounter: { ...deckGame, id: 'deckIntel' } } as Step,
        { type: 'dawn' },
      ],
    },
    {
      id: 'mercantile',
      times: DAYTIME,
      cost: DOCKING_FEE,
      steps: [
        {
          type: 'council',
          title: 'hub.mercantile.name',
          advice: [{ who: 'gus', text: 'A second shovel wouldn’t hurt for the climb, if it comes to that.' }],
          trader: ['coal', 'sellCoal', 'food', 'hammocks', 'stove', 'fireman', 'cook'],
          coal: 0,
          leave: 'Done',
        },
        { type: 'slot' },
      ],
    },
    { id: 'depot', times: DAYTIME, steps: depot },
    {
      id: 'bettendorf',
      times: ['evening'],
      steps: [
        {
          type: 'encounter',
          encounter: {
            id: 'triCities',
            stake: 'purse',
            rivals: [
              { id: 'tripp', ai: 'careful', money: 30 },
              { id: 'odds', ai: 'loose', money: 30 },
              { id: 'finlay', ai: 'loose', money: 30 },
            ],
            goal: { type: 'trips' },
            hands: TRI_CITIES_HANDS,
          },
          solved: [],
        },
        { type: 'caption', lines: [{ text: 'The crew stayed aboard, playing among themselves and listening to Lars sing.' }] },
        { type: 'dawn' },
      ],
    },
    { id: 'tournament', times: ['morning'], flag: 'met:deckIntel', coal: CLIMB_COAL, steps: tournament },
    {
      id: 'jobs',
      times: DAYTIME,
      steps: [],
      menu: [
        job('timber', 'You herd timber off the bridge piers all day. It’s bigger than the boat.', 10, 'jobFound'),
        job('cattle', 'You ferry a herd of cattle across the river, and spend the evening cleaning up the manure.', 14, 'jobFound'),
        job('mail', 'You run the mail to Moline and back, and Gus counts every shovel.', 9),
      ],
    },
  ],
};

const day2: Step[] = [{ type: 'caption', title: 'To be continued', lines: [] }];

export const RIVER: StoryDef = {
  days: [
    { day: 1, place: 'muscatine', steps: day1 },
    { day: 2, place: 'leClaire', steps: day2 },
  ],
  stuckNight: [{ type: 'caption', lines: [{ text: 'Supper on deck, and the lantern lit.' }] }, deckLines],
  hubs: { triCities },
};

/** Bill leaves the new captain the dock fee and a little over for food and coal, and the bunker as it is. */
export const RIVER_START = { purse: 50, coal: 2 };

const said = (text: string | string[]) => ({ size: 'scene' as const, who: 'steamboatBill', text });
const master = (text: string) => ({ size: 'scene' as const, who: 'harbourMaster', text });
const you = (text: string) => ({ size: 'scene' as const, who: 'you', text });

const bar = (text: string | string[]): SpeechLine => ({ size: 'scene', who: 'sandbar', text });
const quip = (text: string): SpeechLine => ({ size: 'aside', who: 'sandbar', text });

/** Sandy keeps bar, and nothing gets him down: wash him away and he'll only drift off somewhere else. */
const QUIPS = [
  'Hoho! There’s more where that came from!',
  'Stay a while… stay forever!',
  'You’re in deep now. Well. Shallow.',
  'All the time in the world, Captain. I’m what they measure it in.',
  'A steam freighter drifts into a sandbar… stop me if you’ve heard it.',
  'You’re right, I AM a son of a beach!',
  'First one’s on the river.',
  'Can you dig your way out of this?',
  'I was a mountain once. I can wait.',
  'Come out to the river, they said. It’ll be fun, they said.',
  'I can’t sand it any more!',
  'I’ll start you a tab.',
  'Happy hour’s every hour. Slow hour, too.',
  'What’s your poison? We’ve got silt, grit and more silt.',
  'I’d offer you a stool, but you’re sitting on me.',
  'You’re shoaling a lot of promise, Captain.',
  'Nothing personal. It’s just bedrock.',
  'I’m a very grounded person.',
  'Some say I’m shallow. They’re right.',
  'Don’t look so down. That’s my job.',
  'Lovely hull. Mind if I keep it?',
  'I hear the Fair’s very nice. Tell me all about it, some year.',
  'I’ve got grit, Captain. You’ve got to admire that.',
  'Silt you down, make yourself at home.',
  'Every grain a regular.',
  'You can’t rush a good sediment.',
  'It’s a fine bank. Very low interest.',
  'I never forget a face. I do wear them down.',
  'Tell your engineer I said hello. I’m in his boiler.',
  'That’s a shore thing, that is.',
  'I’ll have you know I’m a pillar of the riverbed.',
  'Bar’s open. Bar’s always open. That’s rather the trouble.',
];

/** Each new morning on the bar opens differently. */
const MORNINGS = [
  'Well, it’s past noon somewhere. Can I get you the usual, Captain?',
  'Back at the bar? Regulars drink free. It’s nothing, but it’s free.',
  'Another morning! I’m naming a stool after you.',
  'Your table’s still here. So am I.',
  'Sleep well? You look well rested. You look stuck.',
  'They’re starting to talk, Captain. You, me, every morning.',
];

/** Before the third hand: a dare, with Deal on the button. */
const DARES = ['Let’s see if you can muddle through another round.', 'Care to dredge up another hand?', 'Fancy your chances? I fancy your boat.', 'One more for the road. There isn’t one.'];

/**
 * A day against Sandy: the opening, then a quip every other hand, drawn from
 * one shuffle of the voyage so none comes round again until they all have, and
 * however the day ends, on whichever hand it comes.
 */
function sandbarTalk({ hand, pile, seed, attempt }: TalkContext): RoundScript {
  const hands = attempt > 1 ? 8 : SANDBAR_HANDS;
  const first = attempt === 1;
  const quips = new Rng(seed).shuffle(QUIPS);
  const said = quips[((attempt - 1) * 8 + hand) % quips.length];
  const dusk: SpeechLine[] = [bar('Last call, Captain.'), { size: 'scene', who: 'willie', text: 'That’s the light gone. She won’t move tonight.' }];
  const opening: RoundScript = first
    ? {
        deal: [bar('Going somewhere?'), bar('Welcome to the sandbar. Call me Sandy. Today’s specials are the Broken Paddle and the Twisted Axle. You must try them.')],
        flop: [
          { size: 'scene', who: 'willie', text: 'Aground, Captain! Stuck fast!' },
          { size: 'scene', who: 'gus', text: ['Steam won’t shift her. It’s poles and backs now.', 'Those buttons are the crew, Captain: all the strength they have in them today.'] },
        ],
      }
    : { deal: [bar(MORNINGS[(attempt - 2) % MORNINGS.length])] };
  const scene: RoundScript = hand === 1 ? opening : hand === 3 ? { deal: [{ ...bar(DARES[(attempt - 1) % DARES.length]), replies: [{ label: 'Deal' }] }, bar('Shore thing!')] } : {};
  const talkOnFlop = hand % 2 === 0;
  const talkAfter = hand % 2 === 1 && hand > 1 && hand < hands && pile > 0;
  return {
    ...scene,
    ...(talkOnFlop ? { flop: [quip(said)] } : {}),
    // Stood pat: it says so, twice in a day at most.
    ...(hand === 1 ? { pat: [quip(first ? 'Going to sand pat, Captain?' : 'Sand pat again? You’ll fit right in.')] } : hand === 4 ? { pat: [quip(first ? 'Sand pat again? You’ll fit right in.' : 'You’re getting the hang of this. Do nothing. Nothing moves here.')] } : {}),
    verdict: [
      ...(hand === 1 && first
        ? [
            { size: 'scene' as const, who: 'gus', when: 'won' as const, text: 'That’s our own sweat back, no more. But the sand’s gone with the current.' },
            { ...bar('Your first one’s on the house. So’s your boat.'), when: 'lost' as const },
          ]
        : []),
      ...(talkAfter ? [{ ...quip(said), when: 'won' as const }, { ...quip(said), when: 'lost' as const }] : []),
      { ...bar('I’ll drift off downstream now… Catch you later, Captain!'), when: 'wonAll' },
      { size: 'scene', who: 'willie', when: 'wonAll', text: 'She’s off, Captain! We’re floating!' },
      { ...bar('You’ve had enough. Pity you can’t leave.'), when: 'lostAll' },
      { size: 'scene', who: 'gus', when: 'lostAll', text: 'That’s all they have, Captain. There’s not another shove in them today.' },
      ...(hand === hands ? dusk.flatMap((l) => [{ ...l, when: 'won' as const }, { ...l, when: 'lost' as const }]) : []),
    ],
  };
}

/** The queue at Davenport. */
function morningTalk({ met }: TalkContext): RoundScript {
  return met ? {} : { deal: [say('willie', 'Five dollars in, Captain. Last one with money goes to the saloon at noon.')] };
}

function noonTalk({ met }: TalkContext): RoundScript {
  return {
    deal: met
      ? [say('ellie', 'Back again, Captain? One boat. Same as yesterday.')]
      : [say('ellie', ['Ellie Sawyer, out of Cordova. I take one boat up the rapids today.', 'Whoever wins this table. Or if I win it myself, the runner-up.']), say('willie', 'They say you’re crazy, taking boats up on the thaw.'), say('ellie', 'I prefer adventurous.')],
  };
}

const say = (who: string, text: string | string[]): SpeechLine => ({ size: 'scene', who, text });

/** Odds will lay you odds on anything. */
const ODDS = ['Two to one you swap.', 'Evens the River’s red.', 'Eleven to four on rain.', 'Six to four the cat jumps left.', 'Five to one that boat of yours floats.', 'I’ve got a dollar on Finlay. Don’t tell Finlay.'];

/** The Tri-Cities: how many cities there are is a matter of opinion, and so is what settles a game. */
function triCitiesTalk({ hand, seed, trips }: TalkContext): RoundScript {
  return {
    ...(hand === 1
      ? {
          deal: [
            say('willie', 'They’re batty about betting here, Captain.'),
            { ...say('tripp', 'House rule: we play till somebody wins with three of a kind. Three cities, three of a kind.'), replies: [{ label: 'Three?' }] },
            you('I counted four on the way in.'),
            say('odds', 'Bettendorf! We hold out for four of a kind. Five to one it’s three tonight.'),
            say('tripp', 'Bettendorf is a wagon factory.'),
            say('finlay', 'Sit down, sit down! Finlay. You never saw me, if a small Scotswoman asks.'),
          ],
        }
      : { flop: [{ size: 'aside', who: 'odds', text: new Rng(seed).shuffle(ODDS)[hand % ODDS.length] }] }),
    verdict: trips || hand === TRI_CITIES_HANDS ? [say('tripp', 'That settles it. For tonight.')] : [],
  };
}

/** What the strike chest hears, hand by hand. Nobody says what it's for. */
const CHEST_UP = ['More for the strike chest! That should last us another day or two.', 'That’s the week’s bread, that is. Much obliged, Captain.', 'The chest thanks you, Captain.', 'Don’t tell the union. It’d only want a receipt.'];
const CHEST_DOWN = ['Plenty more where that came from. The union sends it up by the sack.', 'Take it, take it. It’s only the strike chest.', 'Easy come, Captain. Tuesday’s post brings more.'];
const RIVER_LIFE = [
  { who: 'foreman', text: 'Twenty years I’ve shovelled that heap. Never played so many cards.' },
  { who: 'rourke', text: 'I’ve picketed that gate since Monday. Very peaceful gate.' },
  { who: 'foreman', text: 'Bill still cheat at patience?' },
  { who: 'rourke', text: 'Coal’s dear upriver, I hear. Dearer, if there isn’t any.' },
];
const FOLDED = 'Folding again, Cap’n? You wouldn’t be… letting us win?';

/** A friendly game with the strike chest on the table. The foreman never says what he wants, and the coal turns up all the same. */
function depotTalk({ hand, lost, foldedOut, fixed, met, seed }: TalkContext): RoundScript {
  const paid = lost >= FOREMAN_LOSS;
  const chat = new Rng(seed).shuffle(RIVER_LIFE)[hand % RIVER_LIFE.length];
  const sorted = fixed.map(({ id, snag }): SpeechLine => ({ size: 'scene', who: id, text: `I’ll sort out ${t(`joker.${snag}`)}, Captain. Got nothing better to do.` }));
  return {
    ...(hand % 2 === 0 ? { flop: [{ size: 'aside' as const, ...chat }] } : {}),
    verdict: [
      ...sorted,
      ...(paid
        ? [say('foreman', 'Funny thing, Captain. Some sacks have fallen off the heap, down by your boat. Nobody’s counted those.')]
        : hand === FOREMAN_HANDS
          ? [say('foreman', met ? 'Good game, Captain. Any time. We’re not going anywhere.' : 'Good game, Captain. Come by any time. We’re not going anywhere.')]
          : foldedOut
            ? [{ size: 'aside' as const, who: 'foreman', text: FOLDED }]
            : [
                { size: 'aside' as const, who: 'rourke', when: 'lost' as const, text: new Rng(seed + hand).pick(CHEST_UP) },
                { size: 'aside' as const, who: 'foreman', when: 'won' as const, text: new Rng(seed + hand).pick(CHEST_DOWN) },
              ]),
    ],
  };
}

/** The climb: Kitty at the wheel, and the river doing its best. */
const RAPIDS_LINES = ['Mind the step.', 'Rock Island. The clue’s in the name.', 'Fourteen miles of this. Thirteen, if you’re quick.', 'I take a little off every boat. It’s nothing personal.'];
function rapidsTalk({ hand, seed }: TalkContext): RoundScript {
  const dark = say('ellie', 'Too dark for the ledges. We’ll lie up here.');
  return {
    ...(hand === 1
      ? {
          deal: [say('ellie', 'Mr. Klemm, every pound of steam you have. Captain, do as I say and nothing else.')],
          flop: [say('gus', 'She’ll burn coal like a furnace, Captain. And it’s all on the crew.')],
        }
      : hand % 2 === 0
        ? { flop: [{ size: 'aside', who: 'rapids', text: new Rng(seed).shuffle(RAPIDS_LINES)[hand % RAPIDS_LINES.length] }] }
        : {}),
    verdict: [
      { ...say('ellie', 'That’s the top. You can breathe, Captain.'), when: 'wonAll' },
      { ...say('gus', 'She has nothing left, Captain. We’ll lie up at the ledge tonight.'), when: 'lostAll' },
      ...(hand === RAPIDS_HANDS ? [{ ...dark, when: 'won' as const }, { ...dark, when: 'lost' as const }] : []),
    ],
  };
}

const called = (id: string) => t(`character.${id}.called`);
const crew = (who: string, text: string): SpeechLine => ({ size: 'aside', who, text });

/**
 * Lars sings: the language is beyond him, and his own is half a tune anyway,
 * so he speaks in musical notes. After a week or so he has a word or two.
 */
const A_WEEK = 7;
const larsSays = (day: number, tune: string, word: string) => (day > A_WEEK ? word : tune);

/** Round the lantern, after supper. */
const deckQuips = (day: number) => [
  crew('willie', 'Real son of a beach, that sandbar.'),
  crew('gus', 'Old Hildegard doesn’t care for sand, Captain. Not one bit.'),
  crew('willie', 'Beans again tomorrow, Captain! Good beans.'),
  crew('lars', larsSays(day, '♪ ♪ ♫', 'Sjekk.')),
  crew('gus', 'She’s a good boat. Don’t tell her I said so.'),
  crew('willie', 'I think he liked us, Captain. Sandy.'),
  crew('lars', larsSays(day, '♫ ♪ ♫ ♪', 'Fåld.')),
];

/** How each hand aboard takes on what they fix. */
const FIXING: Record<string, (snag: string, day: number) => string> = {
  gus: (snag) => `I think I can fix ${snag}, Captain.`,
  lars: (_, day) => larsSays(day, '♪ ♫ ♫ ♪', 'Ja. Fiks.'),
  willie: () => 'Leave that one with me, Captain!',
};

/** And how they hand on what's better fixed by someone else. */
const PASSING: Record<string, (snag: string, fixer: string, day: number) => string> = {
  gus: (snag, fixer) => `${snag}? Not my trade. ${fixer}?`,
  lars: (_, __, day) => larsSays(day, '♪ ♪ ?', 'Nei.'),
  willie: (snag, fixer) => `${snag}? That’s one for ${fixer}, Captain.`,
  fireman: (_, fixer) => `Union says that’s ${fixer}’s job.`,
};
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);

/** The deck game: someone says something on each Flop, and whatever you lay down, they sort out among themselves. */
function deckTalk({ hand, seed, fixed, day }: TalkContext): RoundScript {
  const quips = deckQuips(day);
  return {
    ...(hand === 1 ? { deal: [{ size: 'scene', who: 'gus', text: 'Anything broken, Captain, lay it on the table. We’ll see to it.' } as SpeechLine] } : {}),
    flop: [new Rng(seed).shuffle(quips)[hand % quips.length]],
    verdict: fixed.flatMap(({ id, snag }): SpeechLine[] => {
      const name = t(`joker.${snag}`);
      const fixer = snagDef(snag).fixer ?? id;
      const fixing: SpeechLine = { size: 'scene', who: fixer, text: FIXING[fixer]?.(name, day) ?? 'Leave it with me, Captain.' };
      if (fixer === id) return [fixing];
      return [{ size: 'scene', who: id, text: PASSING[id]?.(capital(name), called(fixer), day) ?? 'Not mine, Captain.' }, fixing];
    }),
  };
}

/**
 * What's said at the table, by encounter and hand. The talk goes in before the
 * deal and on the Flop: a hand folded early would never reach the later streets.
 */
export const RIVER_TALK: Record<string, Talk> = {
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
            ...master('Hrmpf. River code, can’t refuse that. But only five rounds, and whoever holds the bill after that settles it. Agreed?'),
            id: 'snag',
            branch: true,
            replies: [
              { label: 'No. I pay', effect: 'pay', end: true },
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
            replies: [{ label: 'Single what?', effect: 'aground', end: true }],
          },
        ],
      },
    ],
  },
  sandbar: sandbarTalk,
  deck: deckTalk,
  triCities: triCitiesTalk,
  depotTalk: (({ met }: TalkContext): RoundScript => ({
    deal: met
      ? [
          {
            ...say('foreman', 'Back again, Captain? Still no coal. Still on strike. Still got cards.'),
            replies: [
              { label: 'Leave', effect: 'leave', end: true },
              { label: 'Snag?', effect: 'snag', end: true },
            ],
          },
        ]
      : [
          { ...say('foreman', 'Been a while! Ain’t seen The Best Intentions since last summer. Where’s Bill?'), replies: [{ label: 'Family' }] },
          you('Family business.'),
          {
            ...say('foreman', 'Left you in charge, did he? Wise man. Alas, ain’t got no coal to sell you. Strike’s on, see.'),
            replies: [
              { label: 'Leave', effect: 'leave', end: true },
              { label: 'Snag?', go: 'friendly' },
            ],
          },
          {
            ...say('foreman', 'Can’t say no to a friendly game to pass the time, right, fellas? Nothing much else to do around here, with this striking business.'),
            id: 'friendly',
            branch: true,
            replies: [{ label: 'Deal', effect: 'snag', end: true }],
          },
        ],
  })) as Talk,
  depot: depotTalk,
  morning: morningTalk,
  noon: noonTalk,
  rapids: rapidsTalk,
  deckIntel: (context: TalkContext): RoundScript => ({
    ...deckTalk(context),
    ...(context.hand === 1
      ? {
          deal: [
            { ...say('willie', 'I asked around, Captain. There’s one pilot for the rapids this early: Ellie Sawyer, out of Cordova. One boat a day.'), replies: [{ label: 'One?' }] },
            you('One boat? With all that lot lined up at Davenport?'),
            say('willie', 'They play for it, Captain. Snag, of course. Five dollars in the morning, and the winners sit down with her at noon.'),
            say('gus', 'Anything broken, Captain, lay it on the table. We’ll see to it.'),
          ],
        }
      : {}),
  }),
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
