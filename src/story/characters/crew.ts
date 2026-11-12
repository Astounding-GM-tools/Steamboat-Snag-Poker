/**
 * The crew of the Best Intentions: the deck game round the lantern, Lars's
 * songs, and what they have to say about the boat.
 */
import { Rng, snagDef, type EncounterDef, type RoundScript, type Step, type StoryLine, type TalkContext } from '../mechanics';
import { t } from '../../i18n';
import type { SpeechLine } from '../../ui/Speech.svelte';
import { aside, called, capital, say, you } from '../lines';
import { A_WEEK } from '../numbers';

/** The evening's game aboard: crew and lantern, for buttons. */
export const deckGame: EncounterDef = { id: 'deck', stake: 'strength', rivals: 'crew', goal: { type: 'evening' }, hands: 3, rules: { drainPerJoker: 0, jokerForfeit: 0 } };

export const deckLines: Step = {
  type: 'encounter',
  encounter: deckGame,
  solved: [],
  // How an evening ends: one a day, in turn.
  closers: [
    [{ text: 'The wick burns low and gutters.' }],
    [{ text: 'Kerosene is in short supply.' }],
    [{ text: 'The moon is out and very pretty. After cards, you watch it for a while as Lars sings.' }],
    [{ text: 'The river speaks to you, of faraway places it has visited and soon will visit again.' }],
    [{ text: 'The lantern goes out. You hear a frog complaining about the weather.' }],
    [{ text: 'It’s a rainy night, and the roof has a leak. Should fix that in the morning.' }],
  ],
};

/** Stranded, or anchored: supper, and the lantern lit. */
export const stuckNight: Step[] = [{ type: 'caption', lines: [{ text: 'Supper on deck, and the lantern lit.' }] }, deckLines];

/** What Gus has been saying all along, and Willie's apologies. */
export const NAGS = [
  { who: 'gus', text: 'An engine overhaul would double what I can give you on the rapids, Captain.' },
  { who: 'willie', text: 'Beans again, Captain. I’m sorry. I’m no real cook, and there’s no stove.' },
  { who: 'gus', text: 'One fireman won’t get us up the rapids, Captain.' },
  { who: 'gus', text: 'A real cook in a real galley would double our strength, Captain. No offence to the boy’s beans.' },
  { who: 'gus', text: 'We should upgrade the boiler before even thinking about those rapids, Captain.' },
];

/**
 * Lars sings: the language is beyond him, and his own is half a tune anyway,
 * so he speaks in musical notes. After a week or so he has a word or two.
 */
const larsSays = (day: number, tune: string, word: string) => (day > A_WEEK ? word : tune);

/** Round the lantern, after supper. */
const deckQuips = (day: number) => [
  aside('gus', 'Old Hildegard doesn’t care for sand, Captain. Not one bit.'),
  aside('willie', 'Beans again tomorrow, Captain! Cold beans.'),
  aside('lars', larsSays(day, '♪ ♪ ♫', 'Sjekk.')),
  aside('gus', 'She’s a good boat. Don’t tell her I said so.'),
  aside('willie', 'I think he liked us, Captain. Sandy.'),
  aside('willie', 'The Mathilda Belle tried the rapids without a pilot, Captain. Came back down by evening, all washed up, cargo lost.'),
  aside('willie', 'So did the Thierry Belle. She’s back in the queue at Davenport.'),
  aside('gus', 'Too early on the thaw to go up. Everyone says so. I say so.'),
  aside('lars', larsSays(day, '♫ ♪ ♫ ♪', 'Fåld.')),
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

/** The deck game: someone says something on each Flop, and whatever you lay down, they sort out among themselves. */
export function deckTalk({ hand, seed, fixed, day }: TalkContext): RoundScript {
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

/** The evening Willie comes back from ashore: the pilot, the first time. */
export const deckIntelTalk = (context: TalkContext): RoundScript => ({
    ...deckTalk(context),
    // The news about Ellie the first night; after that, the same town, the same work going.
    ...(context.hand === 1 && context.met
      ? {
          deal: [
            say('willie', ['Same town, same talk, Captain.', 'There’s work ashore, though: a timber raft to herd off the bridge piers, cattle to ferry across, and the mail to Moline.']),
            say('gus', 'Anything broken, Captain, lay it on the table. We’ll see to it.'),
          ],
        }
      : {}),
    ...(context.hand === 1 && !context.met
      ? {
          deal: [
            { ...say('willie', 'I asked around, Captain. There’s one pilot for the rapids this early: Ellie Sawyer, out of Cordova. One boat a day.'), replies: [{ label: 'One?' }] },
            you('One boat? With half the river lined up at Davenport?'),
            say('willie', 'They play for it, Captain. Snag, of course. Five dollars in the morning, and the winners sit down with her at noon.'),
            say('gus', 'Anything broken, Captain, lay it on the table. We’ll see to it.'),
          ],
        }
      : {}),
  });
