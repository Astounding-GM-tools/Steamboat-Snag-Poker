/**
 * The Best Intentions, her crew and what can be bought for her: the numbers
 * the story reads (see docs/story.md, "Stats: the boat and the crew"). Data,
 * one table each, read generically; the starting guesses all live here, to be
 * tuned by play.
 */
import type { AiId } from '../../engine/characters';
import { TROUBLE } from './snags';

/** Everything on the boat is rated 0, 1 or 2: none, some, the best. */
export type Rating = 0 | 1 | 2;

/** Where a hand can stand. The bridge is the Captain's, and needs nobody else. */
export const STATIONS = ['furnace', 'engine', 'galley', 'deck'] as const;
export type Station = (typeof STATIONS)[number];

export interface CrewDef {
  id: string;
  /** How good they are at each station. */
  ratings: Record<Station, Rating>;
  /** Where they go unless told otherwise. */
  home: Station;
  /** Paid each morning; a hire, for each two days. */
  wage: number;
  /** How they play at the deck game. */
  ai: AiId;
  /** Hired by the day (a second fireman, a cook), not one of the boat's own. */
  temporary?: boolean;
}

export const CREW: Record<string, CrewDef> = {
  gus: { id: 'gus', ratings: { furnace: 1, engine: 2, galley: 0, deck: 1 }, home: 'engine', wage: 3, ai: 'careful' },
  lars: { id: 'lars', ratings: { furnace: 2, engine: 0, galley: 0, deck: 1 }, home: 'furnace', wage: 2, ai: 'stubborn' },
  willie: { id: 'willie', ratings: { furnace: 1, engine: 1, galley: 1, deck: 2 }, home: 'galley', wage: 1, ai: 'loose' },
  fireman: { id: 'fireman', ratings: { furnace: 2, engine: 0, galley: 0, deck: 1 }, home: 'furnace', wage: 4, ai: 'defeatist', temporary: true },
  pfund: { id: 'pfund', ratings: { furnace: 0, engine: 0, galley: 2, deck: 1 }, home: 'galley', wage: 6, ai: 'careful', temporary: true },
};

/** Who's aboard when the voyage begins. */
export const STARTING_CREW = ['gus', 'lars', 'willie'];

/** Who gives up their chair at the deck game to a hire: the first hire takes the first. */
export const GIVE_UP_CHAIR = ['lars', 'willie'];

/** The vessel's own features, rated like the crew. */
export interface BoatParts {
  boiler: Rating;
  engine: Rating;
  kitchen: Rating;
  rooms: Rating;
  rudder: Rating;
  paddles: Rating;
}

/** What each station works. */
export const STATION_PART: Record<Station, keyof BoatParts> = { furnace: 'boiler', engine: 'engine', galley: 'kitchen', deck: 'rooms' };

export const BOAT = {
  /** Loads of coal she carries at most. */
  bunker: 6,
  /** Strength added every morning (hammocks). */
  comfort: 0,
  parts: { boiler: 1, engine: 1, kitchen: 0, rooms: 0, rudder: 1, paddles: 1 } as BoatParts,
};

/** A hire lasts the day they sign on and the next. */
export const HIRE_DAYS = 2;

/** What a hand makes just by being aboard, and what a point of asset × rating adds at the furnace or the engine. */
const ABOARD = 2;
const WORKING = 3;

/** Who stands where: each hand's station. */
export type Stations = Record<string, Station>;

/** What the hand at this station adds to the crew's strength each morning (the galley's is for each of the others). */
export function stationOutput(id: string, station: Station, parts: BoatParts): number {
  const rate = (CREW[id]?.ratings[station] ?? 0) * parts[STATION_PART[station]];
  return station === 'furnace' || station === 'engine' ? rate * WORKING : station === 'galley' ? rate : 0;
}

/** What the crew make between them each morning: the furnace and the engine add up; the galley feeds everyone else, as well as its best cook. */
export function shipStrength(crew: string[], stations: Stations, parts: BoatParts): number {
  const working = crew.filter((id) => stations[id] === 'furnace' || stations[id] === 'engine');
  const fed = Math.max(0, ...crew.filter((id) => stations[id] === 'galley').map((id) => stationOutput(id, 'galley', parts)));
  return crew.length * ABOARD + working.reduce((a, id) => a + stationOutput(id, stations[id], parts), 0) + fed * (crew.length - 1);
}

/** What an item does once bought. */
export interface ItemEffect {
  /** Loads of coal (not more than the bunker holds). */
  coal?: number;
  /** Crates of salvage (picked up on the river): sold off, a crate at a time. */
  salvage?: number;
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
  sellSalvage: { id: 'sellSalvage', price: -2, effect: { salvage: -1 } },
  food: { id: 'food', price: 4, effect: { tomorrow: 4 } },
  hammocks: { id: 'hammocks', price: 12, effect: { comfort: 3 }, once: true },
  sparePole: { id: 'sparePole', price: 6, effect: { spare: TROUBLE.brokenPole }, once: true },
  fireman: { id: 'fireman', price: 4, effect: { hire: 'fireman' } },
  boilerOverhaul: { id: 'boilerOverhaul', price: 40, effect: { part: { name: 'boiler', tier: 2 } }, once: true },
  engineOverhaul: { id: 'engineOverhaul', price: 60, effect: { part: { name: 'engine', tier: 2 } }, once: true },
  stove: { id: 'stove', price: 15, effect: { part: { name: 'kitchen', tier: 1 } }, once: true },
  cook: { id: 'cook', price: 6, effect: { hire: 'pfund', needs: { name: 'kitchen', tier: 1 } } },
};
