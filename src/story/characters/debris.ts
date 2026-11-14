/**
 * Debris on the river (docs/map.md, "The syncopated event stream"): what's in the water, met one item
 * at a time and settled with one hand of Snag. A crate is salvage, worth its ante at the Mercantile if
 * the hand is won, soggy cotton if it isn't; anything else is trouble looking for a hull, carrying one
 * snag it means to leave her with. Round an island there's always something in each passage, and no
 * telling which from the wheelhouse: a coin flip, played for either way.
 *
 * Every piece is drawn from the voyage's seed and where it lies, so a reload finds the same thing there.
 */
import { DEBRIS_TROUBLES, type EncounterDef, type JourneyState, type RoundScript, type Step, type TalkContext } from '../mechanics';
import { say } from '../lines';
import { Rng } from '../../engine/rng';
import { t } from '../../i18n';

/** What's in the water: salvage, or trouble with a snag to give. */
export type Debris = { kind: 'crate' } | { kind: 'obstacle'; id: Hazard; snag: number };

/** The river's hazards, as the pilots called them. */
export const HAZARDS = ['sawyer', 'deadhead', 'driftPile'] as const;
export type Hazard = (typeof HAZARDS)[number];

/** A crate's ante on the first of a leg, and a dollar more for every crate met on it since. */
export const CRATE_ANTE = 2;
/** What a piece of debris has to play with: enough to see the hand through, never enough to matter. */
const DEBRIS_PILE = 30;

const hash = (seed: number, key: string) => {
  let h = seed >>> 0;
  for (const ch of key) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h;
};

/** What lies at `key` (a spot on the river, or a passage round an island), on this voyage: a coin flip. */
export function debrisAt(seed: number, key: string): Debris {
  const rng = new Rng(hash(seed, key));
  if (rng.int(2)) return { kind: 'crate' };
  return { kind: 'obstacle', id: HAZARDS[rng.int(HAZARDS.length)], snag: DEBRIS_TROUBLES[rng.int(DEBRIS_TROUBLES.length)] };
}

/** The next crate's ante on this leg: a dollar more for every one met on it so far. */
export const crateAnteFor = (state: JourneyState, leg: string) => CRATE_ANTE + (state.cratesMet?.leg === leg ? state.cratesMet.n : 0);

/** One hand, from the first: an ante of `ante` (the ante is ceil((hand − antePast) / 3)). */
const oneHand = (ante: number) => ({ jokerForfeit: 0, antePast: 1 - 3 * ante });

/** The crate's ante, read back from its table's rules. */
export const crateAnte = (def: EncounterDef) => Math.ceil((1 - (def.rules?.antePast ?? 0)) / 3);

/**
 * The encounter for a piece of debris: one hand for the crew's strength against something that can only
 * be worn down (what they lose goes down the river). Won, a crate is salvage worth its ante; an obstacle
 * that wins with its snag played leaves her with it (the loser takes every snag the winner played).
 */
export function debrisStep(debris: Debris, ante: number): Extract<Step, { type: 'encounter' }> {
  const id = debris.kind === 'crate' ? 'crate' : debris.id;
  return {
    type: 'encounter',
    encounter: {
      id,
      stake: 'strength',
      rivals: [{ id, ai: debris.kind === 'crate' ? 'loose' : 'stubborn', money: DEBRIS_PILE, jokers: debris.kind === 'obstacle' ? [debris.snag] : [], obstacle: true, steady: true }],
      goal: { type: 'winPot' },
      hands: 1,
      rules: oneHand(debris.kind === 'crate' ? ante : CRATE_ANTE),
    },
    solved: [],
    failed: [],
    ...(debris.kind === 'crate' ? { effects: { salvage: ante } } : {}),
  };
}

// Said in a caption: neither of them is at the table (an aside needs its speaker's chair).
const willie = (text: string | string[]) => say('willie', text);
const gus = (text: string | string[]) => say('gus', text);

/** What's said over a crate: Willie spots it; won, what it's worth; lost, what it was. */
function crateTalk({ journey }: TalkContext): RoundScript {
  const def = journey.encounter?.def;
  const worth = def ? crateAnte(def) : CRATE_ANTE;
  return {
    deal: [willie('Crate in the water, Captain! Let’s fish it out.')],
    verdict: [
      { ...willie(`Salvaged goods, worth $${worth} at the Mercantile.`), when: 'won' },
      { ...gus('It’s just soggy cotton, boys.'), when: 'lost' },
    ],
  };
}

/** How each hazard is called from the bow. */
const SIGHTED: Record<Hazard, string> = {
  sawyer: 'Sawyer off the bow, Captain! She’ll need watching.',
  deadhead: 'Deadhead, Captain! Just under the water, there.',
  driftPile: 'Drift pile, dead ahead! Mind the wheel, Captain.',
};

/** What's said over an obstacle: called from the bow; then clear of it, or what it did to her. */
const hazardTalk = (id: Hazard) =>
  function ({ journey }: TalkContext): RoundScript {
    const left = journey.encounter?.session.seats[0].jokers ?? [];
    const struck = left.at(-1);
    return {
      deal: [willie(SIGHTED[id])],
      verdict: [struck ? gus(`That’s ${t(`joker.${struck.index}`)}, Captain. We’ll live.`) : willie('Clear of it, Captain! Not a scratch.')],
    };
  };

/** The table talk for debris, by encounter id. */
export const debrisTalk = {
  crate: crateTalk,
  ...Object.fromEntries(HAZARDS.map((h) => [h, hazardTalk(h)])),
};

/** How the log has it, after the hand. */
export function debrisRecord(id: string, outcome: 'solved' | 'failed', worth: number, struck?: number): string {
  if (id === 'crate') return outcome === 'solved' ? `Salvaged goods, worth $${worth} at the Mercantile.` : 'Fished out a crate. Soggy cotton.';
  const what = t(`character.${id}.called`);
  return struck !== undefined ? `Struck a ${what.toLowerCase()}: ${t(`joker.${struck}`)}.` : `Steered clear of a ${what.toLowerCase()}.`;
}
