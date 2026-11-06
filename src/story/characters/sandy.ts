/**
 * Sandy, the Sandbar, keeps bar. Met above Muscatine, and on the way back down.
 */
import { Rng, TROUBLE, type EncounterDef, type RoundScript, type TalkContext } from '../mechanics';
import { aside, say } from '../lines';
import { SANDBAR_HANDS, SANDBAR_MORNING_HANDS, SANDBAR_PILE } from '../numbers';
import type { SpeechLine } from '../../ui/Speech.svelte';

const bar = (text: string | string[]): SpeechLine => say('sandbar', text);
const quip = (text: string): SpeechLine => aside('sandbar', text);

export const sandbar: EncounterDef = {
  id: 'sandbar',
  stake: 'strength',
  rivals: [{ id: 'sandbar', ai: 'stubborn', money: SANDBAR_PILE, jokers: [TROUBLE.brokenPole, TROUBLE.brokenPaddle, TROUBLE.twistedAxle], obstacle: true }],
  goal: { type: 'clear' },
  hands: SANDBAR_HANDS,
  // The river plays dear from the first hand: an ante of 2, then 3 (as if three hands were already past).
  rules: { jokerForfeit: 0, antePast: -3 },
};

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
export function sandbarTalk({ hand, pile, seed, attempt }: TalkContext): RoundScript {
  const hands = attempt > 1 ? SANDBAR_MORNING_HANDS : SANDBAR_HANDS;
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
