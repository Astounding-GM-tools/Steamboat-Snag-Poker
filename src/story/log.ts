/**
 * The First Mate's Log: the records Willie types as things happen (docs/log.md). Terse, a
 * line each, in his voice: a first mate who takes the job very seriously. Musings, the
 * longer entries, come later.
 */

/** What's written when an encounter is over, by its id and how it went. */
export const ENCOUNTER_RECORDS: Record<string, { solved?: string; failed?: string }> = {
  bill: { solved: 'Took command of the Best Intentions from Captain Bill, at Muscatine.' },
  harbourMaster: { solved: 'Dock fee settled with the harbour master.', failed: 'Dock fee settled with the harbour master. Dear.' },
  sandbar: { solved: 'Off The Sandbar at last. All hands sore.', failed: 'Aground on The Sandbar. We stay the night.' },
  deck: { solved: 'Cards on deck by lantern light. Repairs seen to.' },
  deckIntel: { solved: 'Anchored downstream of the dock. Went ashore for news.' },
  depot: { solved: 'Cards with the strikers at the coal depot.' },
  triCities: { solved: 'An evening at the Bettendorf saloon.' },
};

/** Getting under way: from a landing, and again after a stop on the river. */
export const castOffRecord = (place: string, bound: string) => `Cast off from ${place}, ${bound}.`;
export const UNDER_WAY_AGAIN = 'Under way again.';

/** What's written when an answer at the table ends it, by the answer's effect. */
export const CHOICE_RECORDS: Record<string, string> = {
  pay: 'Paid the harbour master the dock fee, cash.',
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
