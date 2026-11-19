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
  { who: 'gus', text: 'A boiler overhaul would get us the steam for the rapids, Captain.' },
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
  aside('gus', 'The engine does not care much for sand, Captain. Needs an overhaul.'),
  aside('willie', 'Cold beans for supper, Captain! Woulda been warm beans, if’n we had a stove.'),
  aside('lars', larsSays(day, '♪ ♪ ♫', 'Sjekk.')),
  aside('gus', 'She’s a good boat, the Best Intentions.'),
  aside('willie', 'I think he liked us, Captain. That Sandy.'),
  aside('willie', 'The Mathilda tried the rapids without a pilot, Captain. Came back down by evening, all washed up, cargo lost.'),
  aside('willie', 'They say the Thierry Belle is queued up at Davenport.'),
  aside('gus', 'Too early on the thaw to go up. Current’s too strong for our boiler.'),
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

/**
 * What Willie heard ashore, the nights after the first: whatever's true just now, one a night in
 * turn. Each is a hint for a captain going round in circles (docs/playtest-2026-11-17.md: the ones who
 * do odd jobs all week and leave the money at Bettendorf). Drafts, for review.
 */
export const GOSSIP: { when: (j: TalkContext['journey']) => boolean; text: string }[] = [
  {
    // Coal's dear: sell it. The strikers' heap is the cheap end of that.
    when: (j) => !j.upgrades.includes('boilerOverhaul'),
    text: 'Coal’s fetching eight dollars a load at the Mercantile, Captain, and they’re still buying. Funny, how the strikers’ heap keeps losing sacks.',
  },
  {
    // The depot: what the foreman never says.
    when: (j) => j.coal < 6,
    text: 'Rourke says the strike chest is running low. Any captain who loses a dozen dollars at their table is a friend of the union, he says. He winked, Captain. Twice.',
  },
  {
    when: (j) => j.purse < 15 && j.flags.includes('met:triCities'),
    text: 'They say the house always wins in Bettendorf, Captain. I think they mean Odds.',
  },
  {
    // The Games: what the playtest found works at a crowded table.
    when: (j) => j.flags.includes('met:morning'),
    text: 'The captains who win at Davenport hardly swap a card when the table’s full, Captain. They just sit there looking stubborn, and let the others throw their money about.',
  },
  {
    when: () => true,
    text: 'Every boat that tries the rapids and doesn’t make it comes down lighter, Captain. Folks camp below the Moline chain and fish out whatever floats by.',
  },
  {
    when: (j) => !j.upgrades.includes('boilerOverhaul') && j.mornings >= 5,
    text: 'The Mercantile has a boiler overhaul for forty dollars, Captain. Gus has been to look at it three times. He thinks I didn’t notice.',
  },
];

/** Tonight's gossip: the true ones in turn, by the day. */
export function gossip({ journey, day }: TalkContext): string {
  const now = GOSSIP.filter((g) => g.when(journey));
  return now[day % now.length].text;
}

/** The evening Willie comes back from ashore: the pilot, the first time. */
export const deckIntelTalk = (context: TalkContext): RoundScript => ({
    ...deckTalk(context),
    // The news about Ellie the first night; after that, the same town, the same work going.
    ...(context.hand === 1 && context.met
      ? {
          deal: [
            say('willie', gossip(context)),
            say('willie', 'There’s work ashore, too: a timber raft to herd off the bridge piers, cattle to ferry across, the mail to Moline, and salvage below the rapids, for anyone with a boat hook.'),
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
