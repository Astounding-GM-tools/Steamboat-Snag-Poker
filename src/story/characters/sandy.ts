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

/**
 * Sandy keeps bar, and nothing gets him down. His routine, honed like a
 * comedian's: only the jokes that land. Puns still in the workshop are in
 * docs/story.md (Sandy's routine), until they're good enough to come out here.
 */
const QUIPS = [
  'You’re in deep now. Well. Shallow.',
  'All the time in the world, Captain. I’m what they measure it in.',
  'A deuce drifts into a sandbar, says: “Put it on my bill.”',
  'It wasn’t always easy for me, growing up. You see, my mother was a beach.',
  'I was a mountain once. I can wait.',
  'I’d offer you a stool, but you’re sitting on me.',
  'What’s your poison? We’ve got silt, grit and more silt.',
  'Lovely hull. Mind if I keep it?',
  'I hear the Fair’s very nice. Tell me all about it, some year.',
  'I never forget a face. I do wear them down.',
  'Tell your engineer I said hello. I’m in his boiler.',
  'Bar’s open. Bar’s always open. That’s rather the trouble.',
  'I want to be a Beach Club when I grow up.',
];

/** Each new morning on the bar opens differently. */
const MORNINGS = [
  'Welcome back, Captain, have a seat. It’s five o’clock somewhere, I’m sure.',
  'Back at the bar? Regulars drink free. It’s nothing, but it’s free.',
  'Sleep well? You look well rested. You look stuck.',
  'They’re starting to talk, Captain. You, me, every morning.',
];

/** Before the third hand on the first day, and every so often after: the joke is on the buttons. */
const QUIZ = ['Welcome to the Sandbar Pub Quiz!', 'First question: what do you call a manmade structure for retaining water?'];

/** Before the third hand, the other days: another round? Deal, or try to leave. */
const DARES = ['Another round, Captain?', 'Fancy your chances? I fancy your boat.', 'One more for the road. There isn’t one.'];

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
        deal: [bar('Welcome to the sandbar, I’ll be your waiter this evening. Today’s specials are the Broken Paddle and the Twisted Axle.')],
        flop: [
          { size: 'scene', who: 'willie', text: 'Aground, Captain! Stuck fast!' },
          { size: 'scene', who: 'gus', text: ['Steam won’t shift her. It’s poles and backs now.', 'Those buttons are the crew, Captain: all the strength they have in them today.'] },
        ],
      }
    : { deal: [bar(MORNINGS[(attempt - 2) % MORNINGS.length])] };
  const scene: RoundScript = hand === 1 ? opening : hand === 3 ? { deal: attempt % DARES.length === 1 ? [{ ...bar(QUIZ), replies: [{ label: 'Well' }, { label: 'Dam' }] }] : [
              { ...bar(DARES[(attempt - 1) % DARES.length]), replies: [{ label: 'Leave', go: 'leave' }, { label: 'Deal', go: 'deal' }] },
              { ...bar('Shore thing.'), id: 'deal', branch: true },
              { ...bar('You wish.'), id: 'leave', branch: true },
            ] } : {};
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
