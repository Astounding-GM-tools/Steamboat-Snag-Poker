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

/** Willie's first musing: leaving Muscatine, the river ahead, and how the dock fee went. */
export function leavingMuscatine(flags: readonly string[], purse: number, fee: number, coal: number, bunker: number): string {
  const lines = [
    // (Where she is and which way she's bound is in the heading above it.)
    'The first day of spring.',
    'Cargo waiting at Dubuque.',
    '',
    `${MUSCATINE_TO_DUBUQUE} miles of river to get there.`,
    `Strong current, four miles an hour. Coal at ${coal}/${bunker}.`,
    'Bunker at Rock Island.',
    '',
  ];
  if (flags.includes(DOCK_FEE_FLAG.dodged)) lines.push('The Captain played the harbour master for the docking fee.', `Dodged the fee: $${fee} saved for coal. We'll need it.`);
  else if (flags.includes(DOCK_FEE_FLAG.snagged)) lines.push('The Captain played the harbour master for the docking fee.', `Snagged the fee, and the ante. $${purse} left for expenses.`);
  else lines.push(`Captain paid the dock fee. $${fee}.`, `$${purse} left for the river.`);
  return lines.join('\n');
}

/** What's written when an answer at the table ends it, by the answer's effect. */
export const CHOICE_RECORDS: Record<string, string> = {
  aground: 'Struck a sandbar, a few miles below the Tri-Cities.',
};

/** Round an island: which way she went, and what came aboard. */
export function islandRecord(name: string | null, way: 'port' | 'starboard', crates: number, found?: string): string {
  const isle = name ?? 'the island';
  if (!crates) return `Kept to ${way} of ${isle}.`;
  return `Salvage to ${way} of ${isle}: ${crates === 1 ? 'a crate' : `${crates} crates`} aboard${found ? `, ${found}` : ''}.`;
}

/** At a trader's: bought (or sold) what, for how much. */
export const tradeRecord = (name: string, price: number) => (price < 0 ? `Sold ${name.toLowerCase()}, $${-price}.` : `Bought ${name.toLowerCase()}, $${price}.`);
