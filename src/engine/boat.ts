/**
 * The Best Intentions, her crew and what can be bought for her: the numbers
 * the story reads (see docs/story.md, "Stats: the boat and the crew"). Data,
 * one table each, read generically; the starting guesses all live here, to be
 * tuned by play.
 */
import type { AiId } from './characters';
import { TROUBLE } from './snags';

/** Everything on the boat is rated 0, 1 or 2: none, some, the best. */
export type Rating = 0 | 1 | 2;

export interface CrewDef {
  id: string;
  /** Strength: buttons made each morning. Cook: what supper does for everyone else. Know: the river (no effect yet). */
  skills: { strength: Rating; cook: Rating; know: Rating };
  /** Paid each morning; a hire, for each two days. */
  wage: number;
  /** How they play at the deck game. */
  ai: AiId;
  /** Hired by the day (a second fireman, a cook), not one of the boat's own. */
  temporary?: boolean;
}

export const CREW: Record<string, CrewDef> = {
  gus: { id: 'gus', skills: { strength: 1, cook: 0, know: 2 }, wage: 3, ai: 'careful' },
  lars: { id: 'lars', skills: { strength: 2, cook: 0, know: 0 }, wage: 2, ai: 'stubborn' },
  willie: { id: 'willie', skills: { strength: 1, cook: 1, know: 1 }, wage: 1, ai: 'loose' },
  fireman: { id: 'fireman', skills: { strength: 2, cook: 0, know: 0 }, wage: 4, ai: 'defeatist', temporary: true },
  pfund: { id: 'pfund', skills: { strength: 0, cook: 2, know: 1 }, wage: 6, ai: 'careful', temporary: true },
};

/** Who's aboard when the voyage begins. */
export const STARTING_CREW = ['gus', 'lars', 'willie'];

/** The vessel's own features, rated like the crew. */
export interface BoatParts {
  engine: Rating;
  kitchen: Rating;
  rooms: Rating;
  rudder: Rating;
  paddles: Rating;
}

export const BOAT = {
  /** Loads of coal she carries at most. */
  bunker: 6,
  /** Strength added every morning (hammocks). */
  comfort: 0,
  parts: { engine: 1, kitchen: 0, rooms: 0, rudder: 1, paddles: 1 } as BoatParts,
};

/** A hire lasts the day they sign on and the next. */
export const HIRE_DAYS = 2;

/** The buttons someone makes each morning. */
export const crewButtons = (id: string) => 2 + 3 * (CREW[id]?.skills.strength ?? 0);

/** Eating well: a proper cook, with a kitchen to work in, puts this on everyone else. */
const FED_WELL = 2;

/** What the crew make between them each morning. */
export function shipStrength(crew: string[], parts: BoatParts): number {
  const cook = crew.find((id) => CREW[id]?.skills.cook === 2);
  const fed = cook && parts.kitchen >= 1 ? FED_WELL * (crew.length - 1) : 0;
  return crew.reduce((a, id) => a + crewButtons(id), 0) + fed;
}

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
  /** Hire this crew member. */
  hire?: string;
  /** A part of the boat raised to this tier. */
  part?: { name: keyof BoatParts; tier: Rating };
  /** Only with a part of the boat at this tier. */
  needs?: { name: keyof BoatParts; tier: Rating };
}

export interface ItemDef {
  id: string;
  price: number;
  effect: ItemEffect;
  /** Bought once and kept (an upgrade); otherwise supplies, bought as often as you like. */
  once?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  /** Black-market prices, while the strike's on. */
  coal: { id: 'coal', price: 10, effect: { coal: 1 } },
  sellCoal: { id: 'sellCoal', price: -8, effect: { coal: -1 } },
  food: { id: 'food', price: 4, effect: { tomorrow: 4 } },
  hammocks: { id: 'hammocks', price: 12, effect: { comfort: 3 }, once: true },
  sparePole: { id: 'sparePole', price: 6, effect: { spare: TROUBLE.brokenPole }, once: true },
  fireman: { id: 'fireman', price: 4, effect: { hire: 'fireman' } },
  stove: { id: 'stove', price: 15, effect: { part: { name: 'kitchen', tier: 1 } }, once: true },
  cook: { id: 'cook', price: 6, effect: { hire: 'pfund', needs: { name: 'kitchen', tier: 1 } } },
};
