/**
 * Steamboat to St. Louis: the voyage's days, as steps (src/engine/journey.ts
 * plays them; docs/story.md says why). So far the first stretch: Muscatine,
 * the harbour master and the Sandbar on day one, the Tri-Cities and the coal
 * yard on day two.
 */
import type { EncounterDef, Rival, Step, StoryDef } from '../engine';
import { DOCK_FEE, Rng, TROUBLE } from '../engine';
import { t } from '../i18n';
import type { SpeechLine } from '../ui/Speech.svelte';
import type { RoundScript, Talk, TalkContext } from './script';

/** The evening's game aboard: crew and lantern, for buttons. */
const deckGame: EncounterDef = { id: 'deck', stake: 'strength', rivals: 'crew', goal: { type: 'evening' }, hands: 3 };

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
      { who: 'lars', text: '♪ ♫ ♪' },
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

/** The deck game: someone says something on each Flop, and whoever takes on a trouble they can fix says so. */
function deckTalk({ hand, seed, fixed, day }: TalkContext): RoundScript {
  const quips = deckQuips(day);
  return {
    ...(hand === 1 ? { deal: [{ size: 'scene', who: 'gus', text: 'Anything of mine that’s broken, Captain, send it my way.' } as SpeechLine] } : {}),
    flop: [new Rng(seed).shuffle(quips)[hand % quips.length]],
    verdict: fixed.map(({ id, snag }) => ({ size: 'scene' as const, who: id, text: FIXING[id]?.(t(`joker.${snag}`), day) ?? 'Leave it with me, Captain.' })),
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
