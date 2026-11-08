/**
 * Sandy, the Sandbar, keeps bar. Met above Muscatine, and on the way back down.
 */
import { TROUBLE, morningLine, quipFor, roundLines, type EncounterDef, type RoundScript, type Routine, type TalkContext } from '../mechanics';
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
 * comedian's: a joke is excellent, or it's out. Jokes still in the workshop
 * are in docs/story.md (Sandy's routine).
 */
export const SANDY: Routine = {
  who: 'sandbar',
  opening: 'Welcome to the sandbar, I’ll be your waiter this evening. Today’s specials are the Broken Paddle and the Twisted Axle.',
  mornings: ['Welcome back, Captain, have a seat. It’s five o’clock somewhere, I’m sure.'],
  rounds: [
    { text: 'Another round, Captain?', answers: [{ label: 'Leave', comeback: 'You wish.' }, { label: 'Deal', comeback: 'Shore thing.' }] },
    { text: ['Pub quiz, Captain!', 'Name a structure for retaining water.'], answers: [{ label: 'Well' }, { label: 'Dam' }] },
  ],
  quips: [
    'A deuce drifts into a sandbar, says: “Put it on my bill.”',
    'It wasn’t always easy for me, growing up. You see, my mother was a beach.',
    'You are a very grounded person, Captain.',
    'I’ll put it on your tab.',
    'What’s your poison, Captain? We’ve got silt, and we’ve got grit. Moonshine too, if you stick around.',
  ],
  lastCall: 'Last call!',
  cleared: 'I’ll drift off downstream now… Catch you later, Captain!',
  beaten: 'I think you’ve had enough, Captain. You’re in no shape to drive: you’d better stay the night.',
};

/**
 * A day against Sandy: his opening or his morning; a round before the third
 * hand; last call at the start of the last round; and however the day ends, on
 * whichever hand. His one-liners come when a hand goes his way (you lost it, or
 * folded): a small consolation, while they last.
 */
export function sandbarTalk({ hand, pile, seed, attempt }: TalkContext): RoundScript {
  const hands = attempt > 1 ? SANDBAR_MORNING_HANDS : SANDBAR_HANDS;
  const first = attempt === 1;
  // A hand that opens the first day has his welcome after it; from then on, one a hand.
  const said = first && hand === 1 ? null : quipFor(SANDY, seed, attempt, first ? hand - 2 : hand - 1);
  const opening: RoundScript = first
    ? {
        deal: [bar(SANDY.opening)],
        flop: [
          { size: 'scene', who: 'willie', text: 'Aground, Captain! Stuck fast!' },
          { size: 'scene', who: 'gus', text: ['Steam won’t shift her. It’s poles and backs now.', 'Those buttons are the crew, Captain: all the strength they have in them today.'] },
        ],
      }
    : { deal: [morningLine(SANDY, attempt)] };
  const scene: RoundScript = hand === 1 ? opening : hand === 3 ? { deal: roundLines(SANDY, attempt - 1) } : hand === hands && SANDY.lastCall ? { deal: [bar(SANDY.lastCall)] } : {};
  const consolation = pile > 0 && said;
  return {
    ...scene,
    // Stood pat: it says so, twice in a day at most.
    ...(hand === 1 ? { pat: [quip(first ? 'Going to sand pat, Captain?' : 'Sand pat again? You’ll fit right in.')] } : hand === 4 ? { pat: [quip(first ? 'Sand pat again? You’ll fit right in.' : 'You’re getting the hang of this. Do nothing. Nothing moves here.')] } : {}),
    verdict: [
      ...(hand === 1 && first
        ? [
            { size: 'scene' as const, who: 'gus', when: 'won' as const, text: 'That’s our own sweat back, no more. But the sand’s gone with the current.' },
            { ...bar('Your first one’s on the house. So’s your boat.'), when: 'lost' as const },
          ]
        : []),
      ...(consolation ? [{ ...quip(said), when: 'lost' as const }] : []),
      ...(SANDY.cleared ? [{ ...bar(SANDY.cleared), when: 'wonAll' as const }] : []),
      { size: 'scene', who: 'willie', when: 'wonAll', text: 'She’s off, Captain! We’re floating!' },
      ...(SANDY.beaten ? [{ ...bar(SANDY.beaten), when: 'lostAll' as const }] : []),
      { size: 'scene', who: 'gus', when: 'lostAll', text: 'That’s all they have, Captain. There’s not another shove in them today.' },
      ...(hand === hands
        ? [
            { size: 'scene' as const, who: 'willie', when: 'won' as const, text: 'That’s the light gone. She won’t move tonight.' },
            { size: 'scene' as const, who: 'willie', when: 'lost' as const, text: 'That’s the light gone. She won’t move tonight.' },
          ]
        : []),
    ],
  };
}
