/**
 * The coal depot at Rock Island: friendly, on strike, and the union's chest on
 * the table.
 */
import { PAMPHLETS, Rng, STRIKE_BUTTON, type RoundScript, type Step, type Talk, type TalkContext } from '../../mechanics';
import { t } from '../../../i18n';
import type { SpeechLine } from '../../../ui/Speech.svelte';
import { say, you } from '../../lines';
import { DEPOT_COAL, DEPOT_HANDS, DEPOT_LOSS, DEPOT_PURSE } from '../../numbers';

/** The coal depot at Rock Island: friendly, and on strike. */
export const depot: Step[] = [
  {
    type: 'encounter',
    // Only talk (RIVER_TALK.depotTalk): nothing's staked or dealt until it's agreed.
    encounter: { id: 'depotTalk', stake: 'purse', rivals: [{ id: 'foreman', ai: 'careful', money: 25 }], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
    solved: [],
    choices: { leave: { end: true }, snag: {} },
  },
  {
    type: 'encounter',
    encounter: {
      id: 'depot',
      stake: 'purse',
      rivals: [
        { id: 'foreman', ai: 'careful', money: DEPOT_PURSE, jokers: [PAMPHLETS], obliging: true },
        { id: 'rourke', ai: 'loose', money: DEPOT_PURSE, jokers: [STRIKE_BUTTON], obliging: true },
      ],
      goal: { type: 'lose', min: DEPOT_LOSS, max: 25 },
      hands: DEPOT_HANDS,
    },
    solved: [],
    failed: [],
    effects: { coal: DEPOT_COAL },
  },
  { type: 'slot' },
];

/** What the strike chest hears, hand by hand. Nobody says what it's for. */
const CHEST_UP = ['More for the strike chest! That should last us another day or two.', 'That’s the week’s bread and beans. Much obliged, Captain.', 'The union thanks you, Captain.'];
const CHEST_DOWN = ['Plenty more where that came from. Union sends it up by the sack.', 'Take it, take it. It’s only the strike chest.', 'Easy come, Captain. Tuesday’s post brings more.'];
const RIVER_LIFE: SpeechLine[] = [
  { size: 'aside', who: 'foreman', text: 'You load sixteen tons, and what do you get?' },
  // The joke is the captain's answer.
  { size: 'aside', who: 'rourke', text: 'How do I look, Captain?', replies: [{ label: 'Good' }, { label: 'Striking' }] },
  { size: 'aside', who: 'foreman', text: 'Bill still cheat at patience?' },
  { size: 'aside', who: 'rourke', text: 'Coal’s dear upriver, I hear.' },
];
const FOLDED = 'Folding, Cap’n? You wouldn’t be… letting us win, now would you?';

/** A friendly game with the strike chest on the table. The foreman never says what he wants, and the coal turns up all the same. */
function depotTalk({ hand, lost, foldedOut, fixed, met, seed }: TalkContext): RoundScript {
  const paid = lost >= DEPOT_LOSS;
  const chat = new Rng(seed).shuffle(RIVER_LIFE)[hand % RIVER_LIFE.length];
  const sorted = fixed.map(({ id, snag }): SpeechLine => ({ size: 'scene', who: id, text: `I’ll sort out ${t(`joker.${snag}`)}, Captain. Got nothing better to do.` }));
  return {
    ...(hand % 2 === 0 ? { flop: [chat] } : {}),
    verdict: [
      ...sorted,
      ...(paid
        ? [say('foreman', 'Funny thing, Captain. Some sacks have fallen off the heap, down by your boat. Nobody’s counted those.')]
        : hand === DEPOT_HANDS
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

export const depotTalks: Record<string, Talk> = {
  depotTalk: (({ met }: TalkContext): RoundScript => ({
    deal: met
      ? [
          {
            ...say('foreman', 'Welcome back, Captain. Strike’s still on. Fancy a game to pass the time?'),
            replies: [
              { label: 'Leave', effect: 'leave', end: true },
              { label: 'Snag?', effect: 'snag', end: true },
            ],
          },
        ]
      : [
          { ...say('foreman', 'Been a while! Ain’t seen the Best Intentions since last summer. Where’s Bill?'), replies: [{ label: 'Family' }] },
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
};
