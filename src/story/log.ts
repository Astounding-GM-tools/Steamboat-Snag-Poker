/**
 * The First Mate's Log: the records Willie types as things happen (docs/log.md). Terse, a
 * line each, in his voice: a first mate who takes the job very seriously. Musings, the
 * longer entries, come later.
 */

/** What's written when an encounter is over, by its id and how it went. (The dock fee isn't here: Willie tells it as she leaves Muscatine.) */
export const ENCOUNTER_RECORDS: Record<string, { solved?: string; failed?: string }> = {
  bill: { solved: 'Took command of the Best Intentions from Captain Bill, at Muscatine.' },
  sandbar: { solved: 'Off The Sandbar at last. All hands sore.', failed: 'Aground on The Sandbar. We stay the night.' },
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
  /** The opening shot, as the view comes in to her: the day, a pause, and what it means on the river. */
  opening: ['The first day of spring,', 'which is what some folks call the day the ice goes out.'].join('\n'),
  turning: [`Cargo run for Dubuque, ${MUSCATINE_TO_DUBUQUE} miles upriver.`, 'Strong spring-thaw current, four miles an hour.'].join('\n'),
};

/** Casting off from Muscatine, as the view comes back to her from the harbour master's: how the dock fee went (paid, played for and dodged, or snagged: flags). */
export function leftMuscatine(flags: readonly string[], purse: number, fee: number): string {
  const lines: string[] = [];
  if (flags.includes(DOCK_FEE_FLAG.dodged)) lines.push('The Captain played the harbour master for the docking fee.', `Dodged the fee: $${fee} saved for coal. We'll need it.`);
  else if (flags.includes(DOCK_FEE_FLAG.snagged)) lines.push('The Captain played the harbour master for the docking fee.', `Snagged the fee, and the ante. $${purse} left for expenses.`);
  else lines.push(`Captain paid the dock fee. $${fee}.`, `$${purse} left for the river.`);
  return lines.join('\n');
}

/**
 * The first crate out of Muscatine, and Willie on it: won, what was in it (a find from the small
 * tier in docs/drafts-2026-11-17.md, "What's in the crates"); lost, far too much read into it.
 * Drafts, for review. Picked by the voyage's seed, so a reload writes the same.
 */
export const FIRST_CRATE = {
  found: [
    'Fished out a crate of clothes-pegs.',
    'A gross of corncob pipes. Gus took the best.',
    'A crate of hymnals. Lars approves.',
    'Two dozen horseshoes. Luck, by the pound.',
    'A crate of bicycle bells, ringing.',
    'Seed packets, dry in their tins.',
    'A crate of sheet music. Lars hums along.',
    'Fished out a crate of doorknobs. No doors.',
    'A crate of horehound candy, a little stuck together.',
  ],
  lost: [
    'Lost the first crate of the voyage. Gus says it means nothing. Gus would.',
    'First crate: soggy cotton. Captain Bill never lost a first crate. I asked.',
    'The river kept the first one. Testing us, I think.',
  ],
};

/** What Willie writes after the first crate: the find and its worth, or what losing it must mean. */
export function firstCrateRecord(seed: number, won: boolean, worth: number): string {
  const list = won ? FIRST_CRATE.found : FIRST_CRATE.lost;
  const line = list[(seed >>> 0) % list.length];
  return won ? `${line}\nWorth $${worth} at the Mercantile.` : line;
}

/** What's written when an answer at the table ends it, by the answer's effect. */
export const CHOICE_RECORDS: Record<string, string> = {
  aground: 'Struck a sandbar, a few miles below the Tri-Cities.',
};

/** Round an island: which way she went. */
export const islandRecord = (name: string | null, way: 'port' | 'starboard') => `Kept to ${way} of ${name ?? 'the island'}.`;

/** At a trader's: bought (or sold) what, for how much. */
export const tradeRecord = (name: string, price: number) => (price < 0 ? `Sold ${name.toLowerCase()}, $${-price}.` : `Bought ${name.toLowerCase()}, $${price}.`);
