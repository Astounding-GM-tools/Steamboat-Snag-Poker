/**
 * The Best Intentions, her crew and what can be bought for her: the numbers
 * the story reads (see docs/story.md, "Stats: the boat and the crew"). Data,
 * one table each, read generically; the starting guesses all live here, to be
 * tuned by play.
 */
import type { AiId } from './characters';
import { TROUBLE } from './snags';

export interface CrewDef {
  id: string;
  /** Buttons of strength made each morning. */
  strength: number;
  /** Paid each morning, from the purse. */
  wage: number;
  /** How they play at the deck game. */
  ai: AiId;
  /** Hired for a day (a second fireman, a pilot), not one of the boat's own. */
  temporary?: boolean;
}

export const CREW: Record<string, CrewDef> = {
  gus: { id: 'gus', strength: 6, wage: 3, ai: 'careful' },
  lars: { id: 'lars', strength: 8, wage: 2, ai: 'stubborn' },
  willie: { id: 'willie', strength: 4, wage: 1, ai: 'loose' },
  fireman: { id: 'fireman', strength: 7, wage: 4, ai: 'defeatist', temporary: true },
};

/** Who's aboard when the voyage begins. */
export const STARTING_CREW = ['gus', 'lars', 'willie'];

export interface BoatStats {
  /** Loads of coal she carries at most. */
  bunker: number;
  /** Strength added every morning (hammocks, a better stove). */
  comfort: number;
}

export const BOAT: BoatStats = { bunker: 6, comfort: 0 };

/** What an item does once bought. */
export interface ItemEffect {
  /** Loads of coal (not more than the bunker holds). */
  coal?: number;
  /** Strength every morning from now on. */
  comfort?: number;
  /** Strength tomorrow morning only. */
  tomorrow?: number;
  /** A trouble you never get (its snag index): a spare. */
  spare?: number;
  /** Hire this crew member for the day. */
  hire?: string;
}

export interface ItemDef {
  id: string;
  price: number;
  effect: ItemEffect;
  /** Bought once and kept (an upgrade); otherwise supplies, bought as often as you like. */
  once?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  coal: { id: 'coal', price: 5, effect: { coal: 1 } },
  /** Sold, not bought: coal's short while the strike's on. */
  sellCoal: { id: 'sellCoal', price: -8, effect: { coal: -1 } },
  food: { id: 'food', price: 4, effect: { tomorrow: 4 } },
  hammocks: { id: 'hammocks', price: 12, effect: { comfort: 3 }, once: true },
  sparePole: { id: 'sparePole', price: 6, effect: { spare: TROUBLE.brokenPole }, once: true },
  fireman: { id: 'fireman', price: 4, effect: { hire: 'fireman' } },
};
