/**
 * Sandy, the Sandbar, keeps bar. Met above Muscatine, and on the way back down.
 */
import { TROUBLE, morningLine, quipFor, roundLines, type EncounterDef, type RoundScript, type Routine, type TalkContext } from '../mechanics';
import { aside, say } from '../lines';
import { SANDBAR_HANDS, SANDBAR_MORNING_HANDS, SANDBAR_PILE } from '../numbers';
import type { SpeechLine } from '../../ui/Speech.svelte';

const bar = (text: string | string[]): SpeechLine => say('sandbar', text);
/** A one-liner, said aside; two parts are a setup and its punchline, a beat apart. */
const quip = (text: string | string[]): SpeechLine => ({ ...aside('sandbar', ''), text });


export const sandbar: EncounterDef = {
  id: 'sandbar',
  stake: 'strength',
  rivals: [{ id: 'sandbar', ai: 'stubborn', money: SANDBAR_PILE, jokers: [TROUBLE.onTheRocks, TROUBLE.brokenPaddle, TROUBLE.twistedCrankshaft], obstacle: true, steady: true }],
  goal: { type: 'clear' },
  hands: SANDBAR_HANDS,
  counted: true,
  rules: { jokerForfeit: 0, antePast: -3 },
};

export const SANDY: Routine = {
  who: 'sandbar',
  opening: ['Welcome to The Sandbar! I’ll be your bartender this evening.', 'Today’s specials are the Paddle Split, Crankshaft with a Twist, and Best Intentions, served on the Rocks.'],
  mornings: ['Welcome back, Captain, have a seat. It’s five o’clock somewhere, I’m sure.'],
  rounds: [
    { text: 'Another round, Captain?', answers: [{ label: 'Leave', comeback: 'You wish.' }, { label: 'Deal', comeback: 'Shore thing.' }] },
    { text: ['Pub quiz, Captain!', 'Name a man-made structure for retaining water.'], answers: [{ label: 'Well' }, { label: 'Dam' }] },
    { text: ['Pub quiz, Captain!', 'Name a common river sediment.'], answers: [{ label: 'Leaves' }, { label: 'Quartz' }] },
    {
      text: ['Pub quiz, Captain!', 'What do bankers raise along a river?'],
      answers: [{ label: 'Levy' }, { label: 'Levee' }, { label: 'I just want to leave. Please let me leave.' }],
    },
  ],
  quips: [
    ['Deuce drifts into a sandbar. Orders a beer.', 'Says: “Put it on my bill.”'],
    ['It wasn’t easy for me, growing up.', 'You see, my mother was a beach.'],
    'You are a very grounded person, Captain.',
    'You’ve got true grit, Captain.',
    ['What’s your poison, Captain? We’ve got a fine selection of silt.', 'Moonshine too, if you stick around.'],
    'That is a very fine sediment, Captain.',
    ['The nerve of some people!', 'Calling me shallow!'],
    'I aspire to be a Beach Club one day.',
    ['♪ Sand and deliver! ♪', '♪ Your money and your time! ♪'],
    ['I used to be a mountain, you know.', 'Erosion was a constant grind.'],
    ['Do you like the impression I made of your hull?', 'Wait until you see my work on the engine!'],
    ['Do you know what the best thing about sand is?', 'Sand gets everywhere.'],
    ['♪ Do you like Piña Coladas? ♪', '♪ And being stuck in the sand? ♪'],
  ],
  lastCall: 'Last call!',
  cleared: 'I’ll slink off downstream now. See you later, Captain... if you catch my drift!',
  beaten: 'I think you’ve had enough. You’re in no shape to navigate, better spend the night.',
};

export function sandbarTalk({ hand, pile, seed, attempt }: TalkContext): RoundScript {
  const hands = attempt > 1 ? SANDBAR_MORNING_HANDS : SANDBAR_HANDS;
  const first = attempt === 1;
  // A hand that opens the first day has his welcome after it; from then on, one a hand.
  const said = first && hand === 1 ? null : quipFor(SANDY, seed, attempt, first ? hand - 2 : hand - 1);
  const opening: RoundScript = first
    ? // Willie's and Gus's word on it came as she hit (the underway talk): here, the bar opens.
      { deal: [bar(SANDY.opening)] }
    : { deal: [morningLine(SANDY, attempt)] };
  const scene: RoundScript = hand === 1 ? opening : hand === 3 ? { deal: roundLines(SANDY, attempt - 1) } : hand === hands && SANDY.lastCall ? { deal: [bar(SANDY.lastCall)] } : {};
  const consolation = pile > 0 && said;
  return {
    ...scene,
    // Stood pat: it says so, twice in a day at most.
    ...(hand === 1 ? { pat: [quip(first ? 'Going to sand pat, Captain?' : 'Sand pat again? Don’t mind if you do.')] } : hand === 4 ? { pat: [quip(first ? 'Sand pat again? You’ll fit right in.' : 'You’re getting the hang of this. Do nothing.')] } : {}),
    verdict: [
      ...(hand === 1 && first
        ? [
            { size: 'scene' as const, who: 'gus', when: 'won' as const, text: 'That’s our own sweat won back, Captain, no more. What we lose, the river keeps.' },
            { ...bar('Your first one’s on the house. So’s your boat.'), when: 'lost' as const },
          ]
        : []),
      ...(consolation ? [{ ...quip(said), when: 'lost' as const }] : []),
      ...(SANDY.cleared ? [{ ...bar(SANDY.cleared), when: 'wonAll' as const }] : []),
      { size: 'scene', who: 'willie', when: 'wonAll', text: 'She’s off, Captain! We’re floating!' },
      ...(SANDY.beaten ? [{ ...bar(SANDY.beaten), when: 'lostAll' as const }] : []),
      { size: 'scene', who: 'gus', when: 'lostAll', text: 'That’s all they’ve got, Captain. There’s not another shove in them today.' },
      ...(hand === hands
        ? [
            // (Won or lost: not when she's cleared, nor beaten for the day, which say so themselves.)
            { size: 'scene' as const, who: 'willie', when: ['won', 'lost'] as const, text: 'That’s the light gone. She won’t move tonight.' },
          ]
        : []),
    ],
  };
}
