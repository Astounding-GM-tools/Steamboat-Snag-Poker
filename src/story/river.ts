/**
 * Steamboat to St. Louis: the voyage's days, as steps (src/engine/journey.ts
 * plays them; docs/story.md says why). So far the first stretch: Muscatine,
 * the harbour master and the Sandbar on day one, the Tri-Cities and the coal
 * yard on day two, the rapids and LeClaire on day three.
 */
import type { EncounterDef, Rival, Step, StoryDef } from '../engine';
import { DOCK_FEE, Rng, TROUBLE, snagDef } from '../engine';
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
const FOREMAN_HANDS = 10;
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
    relent: [
      { text: 'Towards noon a packet boat comes thrashing down the river, and her captain throws you a line.' },
      { who: 'willie', text: 'She’s off, Captain! We’re floating!' },
    ],
  },
  { type: 'travel', coal: 2, to: 'triCities' },
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
      hands: TRI_CITIES_HANDS,
    },
    solved: [],
  },
];

const day2: Step[] = [
  { type: 'dawn' },
  {
    type: 'encounter',
    // Only talk (RIVER_TALK.yard): the coal yard in the morning.
    encounter: { id: 'yard', stake: 'purse', rivals: [{ id: 'foreman', ai: 'careful', money: 25 }], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
    solved: [],
    choices: { on: {} },
  },
  {
    type: 'council',
    advice: [
      { who: 'willie', text: 'The foreman plays cards of an evening, Captain. A friendly game, for the strike fund.' },
      { who: 'gus', text: 'Strike fund’s thin, they say. Thin as gruel.' },
      { who: 'lars', text: '♪ ♫ ♪' },
    ],
    trader: ['food', 'sparePole', 'hammocks'],
    coal: 0,
    leave: 'To the coal yard',
  },
  {
    type: 'encounter',
    encounter: {
      id: 'foreman',
      stake: 'purse',
      rivals: [{ id: 'foreman', ai: 'careful', money: 25 }],
      goal: { type: 'lose', min: FOREMAN_LOSS, max: 25 },
      hands: FOREMAN_HANDS,
    },
    solved: [],
    failed: [],
    effects: { coal: 4 },
    stuck: true,
    relent: [{ who: 'foreman', text: 'Ah, take the coal, Captain. You’ll lose it back to us some other night.' }],
  },
  { type: 'caption', lines: [{ text: 'Back aboard, after supper.' }] },
  deckLines,
];

const WAITING_HANDS = 5;
const RAPIDS_HANDS = 8;
const SALOON_HANDS = 5;
const LOAN = 50;

const day3: Step[] = [
  { type: 'dawn' },
  {
    type: 'council',
    advice: [
      { who: 'gus', text: 'Three loads for the climb, Captain, and I’d not argue with four.' },
      { who: 'lars', text: '♫ ♫ ♪ ♫' },
      { who: 'willie', text: 'A second shovel wouldn’t hurt, Captain. Lars says so. I think.' },
    ],
    trader: ['coal', 'food', 'fireman', 'sparePole'],
    coal: 3,
  },
  {
    type: 'encounter',
    encounter: {
      id: 'waiting',
      stake: 'purse',
      rivals: [
        { id: 'oilskins', ai: 'swashbuckler', money: 40 },
        { id: 'konrad', ai: 'bully', money: 30 },
        { id: 'walrus', ai: 'shark', money: 30 },
      ],
      goal: { type: 'ahead', host: 'oilskins' },
      hands: WAITING_HANDS,
    },
    solved: [],
    failed: [{ who: 'kitty', text: 'Not today, Captain. Tomorrow’s another boat.' }],
    stuck: true,
    relent: [{ who: 'kitty', text: 'Nobody else waiting this morning, Captain. Get your hat.' }],
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
    relent: [{ who: 'kitty', text: 'There’s a chute by the Illinois bank, if you don’t mind losing some paint.' }],
  },
  { type: 'travel', coal: 3, to: 'leClaire' },
  {
    type: 'encounter',
    encounter: {
      id: 'saloon',
      stake: 'purse',
      rivals: [
        { id: 'kitty', ai: 'swashbuckler', money: 40 },
        { id: 'finlay', ai: 'loose', money: 40 },
        { id: 'gaylord', ai: 'gambler', money: 40 },
      ],
      goal: { type: 'evening' },
      hands: SALOON_HANDS,
    },
    solved: [],
  },
  {
    type: 'encounter',
    // Only talk (RIVER_TALK.loan): Gaylord's offer, whatever the night brought.
    encounter: { id: 'loan', stake: 'purse', rivals: [{ id: 'gaylord', ai: 'gambler', money: 40 }], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
    solved: [],
    choices: {
      take: { effects: { purse: LOAN, flag: 'owesGaylord' } },
      decline: {},
    },
  },
  { type: 'caption', title: 'To be continued', lines: [] },
];

export const RIVER: StoryDef = {
  days: [
    { day: 1, place: 'muscatine', steps: day1 },
    { day: 2, place: 'triCities', steps: day2 },
    { day: 3, place: 'triCities', steps: day3 },
  ],
  stuckNight: [{ type: 'caption', lines: [{ text: 'Supper on deck, and the lantern lit.' }] }, deckLines],
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
];

/**
 * A day against the Sandbar: `opening`, hand by hand, then a quip every other
 * hand (shuffled by the day, so none comes twice), and however the day ends,
 * on whichever hand it comes.
 */
function sandbarTalk(hands: number, opening: RoundScript[]): Talk {
  const dusk: SpeechLine[] = [bar('Last call, Captain.'), { size: 'scene', who: 'willie', text: 'That’s the light gone. She won’t move tonight.' }];
  return ({ hand, pile, seed }: TalkContext): RoundScript => {
    const scene = opening[hand - 1] ?? {};
    const said = new Rng(seed).shuffle(QUIPS)[hand % QUIPS.length];
    const talkOnFlop = hand % 2 === 0 && !scene.flop;
    const talkAfter = hand % 2 === 1 && hand > 1 && hand < hands && pile > 0;
    return {
      ...scene,
      ...(talkOnFlop ? { flop: [quip(said)] } : {}),
      // Stood pat: it says so, twice in a day at most.
      ...(hand === 1 ? { pat: [quip('Going to sand pat, Captain?')] } : hand === 4 ? { pat: [quip('Sand pat again? You’ll fit right in.')] } : {}),
      verdict: [
        ...(scene.verdict ?? []),
        ...(talkAfter ? [{ ...quip(said), when: 'won' as const }, { ...quip(said), when: 'lost' as const }] : []),
        { ...bar('I’ll drift off downstream now… Catch you later, Captain!'), when: 'wonAll' },
        { size: 'scene', who: 'willie', when: 'wonAll', text: 'She’s off, Captain! We’re floating!' },
        { ...bar('You’ve had enough. Pity you can’t leave.'), when: 'lostAll' },
        { size: 'scene', who: 'gus', when: 'lostAll', text: 'That’s all they have, Captain. There’s not another shove in them today.' },
        ...(hand === hands ? dusk.flatMap((l) => [{ ...l, when: 'won' as const }, { ...l, when: 'lost' as const }]) : []),
      ],
    };
  };
}

const called = (id: string) => t(`character.${id}.called`);
const say = (who: string, text: string | string[]): SpeechLine => ({ size: 'scene', who, text });

/** Odds will lay you odds on anything. */
const ODDS = ['Two to one you swap.', 'Evens the River’s red.', 'Eleven to four on rain.', 'Six to four the cat jumps left.', 'Five to one that boat of yours floats.'];

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
          ],
        }
      : { flop: [{ size: 'aside', who: 'odds', text: new Rng(seed).shuffle(ODDS)[hand % ODDS.length] }] }),
    verdict: trips || hand === TRI_CITIES_HANDS ? [say('tripp', 'That settles it. For tonight.')] : [],
  };
}

/** The foreman never says what he wants. The lads' mood says it for him. */
function foremanTalk({ hand, lost, foldedOut }: TalkContext): RoundScript {
  const paid = lost >= FOREMAN_LOSS;
  return {
    ...(hand === 1 ? { deal: [say('foreman', 'A friendly game, Captain? For the strike fund, mind. Times are hard.')] } : {}),
    verdict: paid
      ? [say('foreman', 'Hard luck, Captain. Take a few sacks for your boiler. No hard feelings.')]
      : hand === FOREMAN_HANDS
        ? [say('foreman', 'You’ve a hard heart for a young fellow, Captain. Come back tomorrow.')]
        : foldedOut
          ? [{ size: 'aside', who: 'foreman', text: 'Folding again, Cap’n? You wouldn’t be… letting us win?' }]
          : [
              { size: 'aside', who: 'foreman', when: 'won', text: 'That’s the strike fund’s supper you’re taking, Captain.' },
              { size: 'aside', who: 'foreman', when: 'lost', text: 'The lads appreciate it, Captain. Hard luck.' },
            ],
  };
}

/** The climb: Kitty at the wheel, and the river doing its best. */
const RAPIDS_LINES = ['Mind the step.', 'Rock Island. The clue’s in the name.', 'Fourteen miles of this. Thirteen, if you’re quick.', 'I take a little off every boat. It’s nothing personal.'];
function rapidsTalk({ hand, seed }: TalkContext): RoundScript {
  const dark = say('kitty', 'Too dark for the ledges. We’ll lie up here.');
  return {
    ...(hand === 1
      ? {
          deal: [say('kitty', 'Mr. Klemm, every pound of steam you have. Captain, do as I say and nothing else.')],
          flop: [say('gus', 'She’ll burn coal like a furnace, Captain. And it’s all on the crew.')],
        }
      : hand % 2 === 0
        ? { flop: [{ size: 'aside', who: 'rapids', text: new Rng(seed).shuffle(RAPIDS_LINES)[hand % RAPIDS_LINES.length] }] }
        : {}),
    verdict: [
      { ...say('kitty', 'That’s the top. You can breathe, Captain.'), when: 'wonAll' },
      { ...say('gus', 'She has nothing left, Captain. We’ll lie up at the ledge tonight.'), when: 'lostAll' },
      ...(hand === RAPIDS_HANDS ? [{ ...dark, when: 'won' as const }, { ...dark, when: 'lost' as const }] : []),
    ],
  };
}

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
  sandbar: sandbarTalk(SANDBAR_HANDS, [
    {
      deal: [bar('Going somewhere?'), bar('Welcome to the sandbar. Call me Sandy. Today’s specials are the Broken Paddle and the Twisted Axle. You must try them.')],
      flop: [
        { size: 'scene', who: 'willie', text: 'Aground, Captain! Stuck fast!' },
        { size: 'scene', who: 'gus', text: ['Steam won’t shift her. It’s poles and backs now.', 'Those buttons are the crew, Captain: all the strength they have in them today.'] },
      ],
      verdict: [
        { size: 'scene', who: 'gus', when: 'won', text: 'That’s our own sweat back, no more. But the sand’s gone with the current.' },
        { ...bar('I’ll start you a tab.'), when: 'lost' },
      ],
    },
    {},
    { deal: [{ ...bar('Let’s see if you can muddle through another round.'), replies: [{ label: 'Deal' }] }, bar('Shore thing!')] },
  ]),
  deck: deckTalk,
  triCities: triCitiesTalk,
  yard: {
    rounds: [
      {
        deal: [
          say('foreman', 'We’re out, Captain. On strike. Not a lump leaves this yard.'),
          { ...say('gus', 'We’ll not climb the rapids on what’s in the bunker.'), replies: [{ label: 'Right', effect: 'on', end: true }] },
        ],
      },
    ],
  },
  foreman: foremanTalk,
  waiting: {
    rounds: [
      {
        deal: [
          say('konrad', 'Back of the line, boy. One boat goes up the rapids today, and it goes on the cards.'),
          { ...say('walrus', 'Five hands. Whoever’s ahead goes up.'), replies: [{ label: 'Her?' }] },
          you('And the lady?'),
          say('walrus', 'Nobody’s asked her. Nobody’s dared.'),
        ],
      },
      { flop: [{ size: 'aside', who: 'konrad', text: 'Twenty years on this river. Never needed a pilot.' }] },
      { flop: [{ size: 'aside', who: 'walrus', text: 'Pass the oysters.' }] },
      {},
      {
        verdict: [
          say('oilskins', ['Is that the time?', 'Kitty Sawyer. I’m the pilot. I take the winner up, or if I’ve won it myself, the runner-up.']),
        ],
      },
    ],
  },
  'waiting:2': { rounds: [{ deal: [say('oilskins', 'Back again, Captain? Five hands.')] }] },
  rapids: rapidsTalk,
  saloon: {
    rounds: [
      {
        deal: [
          say('finlay', 'Sit down, sit down! Finlay. You never saw me, if a small Scotswoman asks.'),
          say('gaylord', 'Gaylord Montague. A pleasure, Captain. I understand you came up the hard way.'),
          say('kitty', 'He came up my way.'),
        ],
      },
      { flop: [{ size: 'aside', who: 'finlay', text: 'Another round for the table! Who’s paying? Not me.' }] },
      { flop: [{ size: 'aside', who: 'gaylord', text: 'I play best with the odds against me. Tonight they’re delighted.' }] },
      { flop: [{ size: 'aside', who: 'kitty', text: 'Mind the ledges. That’s all I’ve got to say about anything.' }] },
    ],
  },
  loan: {
    rounds: [
      {
        deal: [
          {
            ...say('gaylord', ['Fearless and audacious. I see myself in you, Captain.', `A word of advice: money is safest in someone else’s pocket. ${LOAN} dollars now. A hundred, when we next meet.`]),
            replies: [
              { label: 'No, thanks', effect: 'decline', end: true },
              { label: 'Done', effect: 'take', end: true },
            ],
          },
        ],
      },
    ],
  },
  'sandbar:2': sandbarTalk(8, [{ deal: [bar('Well, it’s past noon somewhere. Can I get you the usual, Captain?')] }]),
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
