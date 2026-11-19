/**
 * The First Mate's Log: the records Willie types as things happen (docs/log.md). Terse, a
 * line each, in his voice: a first mate who takes the job very seriously. Musings, the
 * longer entries, come later.
 */

/** What's written when an encounter is over, by its id and how it went. (Not Bill's: Willie tells that himself, on the walk to the harbour master's. Nor the dock fee: he tells it as she leaves Muscatine.) */
export const ENCOUNTER_RECORDS: Record<string, { solved?: string; failed?: string }> = {
  // (Stuck there: written on a moment on the map before the night, AGROUND_NIGHT.)
  sandbar: { solved: 'Off The Sandbar at last. All hands sore.' },
  deck: { solved: 'Cards on deck by lantern light. Repairs seen to.' },
  deckIntel: { solved: 'Anchored downstream of the dock. Went ashore for news.' },
  depot: { solved: 'Cards with the strikers at the coal depot.' },
  triCities: { solved: 'An evening at the Bettendorf saloon.' },
};

/** Getting under way: from a landing, and again after a stop on the river. */
export const castOffRecord = (place: string, bound: string) => `Cast off from ${place}, ${bound}.`;
export const UNDER_WAY_AGAIN = 'Under way again.';

/** How the dock fee went at Muscatine: paid outright, played for and dodged, or played for and snagged (flags). */
export const DOCK_FEE_FLAG = { paid: 'dockFee:paid', dodged: 'dockFee:dodged', snagged: 'dockFee:snagged' } as const;

/** River miles from Muscatine up to Dubuque (455 to 580). */
const MUSCATINE_TO_DUBUQUE = 125;

/**
 * Leaving Muscatine, Willie's first entries, timed to the departure: as she backs out, the day; as the
 * wheel turns ahead, the run; under way, how the dock fee went and the coal.
 */
export const LEAVING_MUSCATINE = {
  /** The opening shot, one sentence typed as the view pans and zooms in to her: the day, and what it means on the river. */
  opening: 'The first day of spring is what some folks call the day the ice lets go of the river.',
};

/** Casting off from Muscatine, as the view comes back to her from the harbour master's: how the dock fee went (paid, played for and dodged, or snagged: flags). */
export function leftMuscatine(flags: readonly string[], purse: number, fee: number): string {
  const lines: string[] = [];
  if (flags.includes(DOCK_FEE_FLAG.dodged)) lines.push('Captain played the harbour master for the docking fee.', `Dodged the fee, $${purse} safe in the strongbox.`);
  else if (flags.includes(DOCK_FEE_FLAG.snagged)) lines.push('Captain played the harbour master for the docking fee.', `Snagged the fee, and the ante. ${(purse > 0) ? `$${purse}` : "Nothing" } left in the strongbox.`);
  else lines.push(`Captain paid the dock fee, $${fee}.`, `$${purse} left for the strongbox.`);
  return lines.join('\n');
}

/**
 * The first crate out of Muscatine, and Willie on it: won, what was in it (a find from the small
 * tier in docs/drafts-2026-11-17.md, "What's in the crates"); lost, far too much read into it.
 * Drafts, for review. Picked by the voyage's seed, so a reload writes the same.
 */
export const FIRST_CRATE = {
  found: [
    'Fished a crate of clothes-pegs out of the river.',
    'A gross of corncob pipes. Gus grabbed a handful.',
    'Two dozen horseshoes. I hope they bring luck.',
    'A crate of bicycle bells.',
    'Seed packets, dry in their tins. Labels sloughed off.',
    'Fished out a crate of doorknobs. Now all we need is some doors.',
    'A crate of horehound candy, a little stuck together. Taste still sweet.',
  ],
  /** Scrawled on the chart where each was found (the same order as `found`). */
  marks: ['Peg salvage', 'Pipe salvage', 'Horseshoe salvage', 'Bell salvage', 'Seed salvage', 'Doorknob salvage', 'Candy salvage'],
  lost: [
    'Lost the first salvage crate. We’ll never know what’s in it.',
    'Had to let go of the first salvage. River wouldn’t let go.',
    'The river kept our first salvage. I hope it is not a sign.',
  ],
};

/** After the first crate (whatever came of it), Willie on the run ahead: what he hopes of it. */
export const SMOOTH_RUN = [`Cargo run on Dubuque, ${MUSCATINE_TO_DUBUQUE} miles up.`, 'I hope this will be a smooth run.', 'Pick up some prime salvage', 'Make good money on the haul', 'And not leave it all at tables along the way'].join('\n');

/** What Willie writes after the first crate: the find and its worth, or what losing it must mean. */
export function firstCrateRecord(seed: number, won: boolean, worth: number): string {
  const list = won ? FIRST_CRATE.found : FIRST_CRATE.lost;
  const line = list[(seed >>> 0) % list.length];
  return won ? `${line}\nWorth $${worth} at the Mercantile.` : line;
}

/**
 * X marks the spot: what Willie scrawls on the chart where something happened on the river, after the
 * fact (a word or two, in pencil): where the deadheads lie, where she ran aground, where salvage turned up.
 */
export const CHART_MARKS = {
  salvage: 'Salvage',
  soggy: 'Soggy cotton',
  lostFirst: 'Lost a crate',
  aground: 'Aground',
  hazard: {
    sawyer: { clear: 'Sawyers', struck: 'Hit a sawyer' },
    deadhead: { clear: 'Deadheads', struck: 'Hit a deadhead' },
    driftPile: { clear: 'Drift piles', struck: 'Hit a drift pile' },
  } as Record<string, { clear: string; struck: string }>,
};

/** The chart's mark for a piece of debris, by its id and how it went (`struck`: it left her with a snag). The first crate out of Muscatine says what was in it. */
export function debrisMark(id: string, outcome: 'solved' | 'failed', struck: boolean, firstOf?: number): string | undefined {
  if (id === 'crate') {
    if (firstOf !== undefined) return outcome === 'solved' ? FIRST_CRATE.marks[(firstOf >>> 0) % FIRST_CRATE.marks.length] : CHART_MARKS.lostFirst;
    return outcome === 'solved' ? CHART_MARKS.salvage : CHART_MARKS.soggy;
  }
  const h = CHART_MARKS.hazard[id];
  return h && (struck ? h.struck : h.clear);
}

/** The chart's mark for an encounter on the river (not debris), by its id: only The Sandbar has one. */
export const ENCOUNTER_MARKS: Record<string, string> = { sandbar: CHART_MARKS.aground };

/** What's written when an answer at the table ends it, by the answer's effect. (The Sandbar's is written on a shot: STRUCK_SANDBAR.) */
export const CHOICE_RECORDS: Record<string, string> = {};

/** Struck The Sandbar: Willie writes it on a moment on the map, before its table comes up. */
export const STRUCK_SANDBAR = 'Stuck on a sandbar a few miles west of Tri-Cities.';
/** Stuck on it for the night: written on a moment on the map, before the deck game. */
export const AGROUND_NIGHT = 'Aground. We stay the night on the river.';

/** Round an island: which way she went. */
export const islandRecord = (name: string | null, way: 'port' | 'starboard') => `Kept to ${way} of ${name ?? 'the island'}.`;

/** At a trader's: bought (or sold) what, for how much. */
export const tradeRecord = (name: string, price: number) => (price < 0 ? `Sold ${name.toLowerCase()}, $${-price}.` : `Bought ${name.toLowerCase()}, $${price}.`);
