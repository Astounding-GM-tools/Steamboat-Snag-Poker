/**
 * The *Best Intentions* as data: one hull, three decks, ten bays, and the modules that
 * fill them as she is built out. Both views draw from this, so an upgrade bought in
 * the story shows on the title vignette and on the river map alike. See docs/boat.md.
 *
 * Coordinates are the side view's, in boat units: x runs from the stern (0) to the
 * bow (about 214), y is up from the waterline (negative, as in SVG). The top view
 * uses the same x and adds the beam across.
 */

/** Where each deck's floor is, and the roofs above them (side view, y up is negative). */
export const LEVEL = {
  water: 0,
  /** The main deck: engine, boilers, freight, the galley, Patty. */
  main: -8,
  /** The boiler deck: the cabin, its guards and the promenade aft. */
  boiler: -24,
  /** The hurricane deck: the cabin's roof, the bandstand. */
  hurricane: -38,
  /** The texas: officers' cabins on the roof, and the pilothouse on top of it. */
  texas: -47,
  pilot: -60,
} as const;

/** The bays: ten slots per deck, numbered from aft. */
export const BAY = 16;
export const BAY0 = 20;
export const BAYS = 10;
export const bayX = (i: number) => BAY0 + i * BAY;
/** The span [from, to) of bays a..b inclusive, in boat units. */
export const span = ([a, b]: readonly [number, number]) => [bayX(a), bayX(b + 1)] as const;

export type Deck = 'main' | 'boiler' | 'roof';

/** Parts she always has: Bill's bare freighter. */
export const FIXED = {
  engineRoom: { deck: 'main', bays: [0, 1] },
  boilers: { deck: 'main', bays: [5, 7] },
  office: { deck: 'boiler', bays: [5, 6] },
  /** The roof over the office and the forward porch, which the chimneys come through. */
  porchRoof: { deck: 'roof', bays: [5, 7] },
  texas: { deck: 'roof', bays: [5, 6] },
} as const satisfies Record<string, { deck: Deck; bays: readonly [number, number] }>;

/** The two chimneys (centres, boat units), hinged at the hurricane deck for the Eads Bridge. */
export const CHIMNEYS = [138, 146] as const;
export const CHIMNEY_TOP = -98;
export const HINGE = -40;
/** How far back a chimney folds when it is all the way down (degrees). */
export const FOLD = 80;
/** The promenade: open deck aft of the cabin, over the wheel's end. The card table's place. */
export const PROMENADE = [0, BAY0] as const;
/** Where the boiler deck ends forward; beyond it the foredeck is open to the sky. */
export const BOILER_DECK_END = 170;
/** Patty's place on the foredeck, and the landing stage's mast. */
export const FOREDECK = [172, 194] as const;
export const STAGE_MAST = 197;
export const BOW = 214;

export type ModuleId = 'galley' | 'saloon' | 'berths' | 'bandstand' | 'engine' | 'patty';

export interface Module {
  id: ModuleId;
  /** What the story calls it. */
  name: string;
  deck: Deck;
  /** Bays it fills; none for a module that changes a part (the engine) or has its own slot (Patty). */
  bays?: readonly [number, number];
  /** What must be built first (a bandstand stands on the saloon's roof). */
  needs?: readonly ModuleId[];
}

export const MODULES: Record<ModuleId, Module> = {
  galley: { id: 'galley', name: 'Galley', deck: 'main', bays: [2, 3] },
  saloon: { id: 'saloon', name: 'Dining saloon', deck: 'boiler', bays: [0, 2] },
  berths: { id: 'berths', name: 'Staterooms', deck: 'boiler', bays: [3, 4] },
  bandstand: { id: 'bandstand', name: 'Bandstand', deck: 'roof', bays: [0, 2], needs: ['saloon'] },
  engine: { id: 'engine', name: 'Bigger engine', deck: 'main' },
  patty: { id: 'patty', name: 'Pretty Patty', deck: 'main' },
};

export type Built = Partial<Record<ModuleId, boolean>>;

/** Whether a module can be built now: what it needs is built. */
export const canBuild = (id: ModuleId, built: Built) => (MODULES[id].needs ?? []).every((n) => built[n]);

/** The bays each deck has filled, by what: fixed parts and built modules. Overlaps are a bug. */
export function occupancy(built: Built): Record<Deck, (string | undefined)[]> {
  const decks: Record<Deck, (string | undefined)[]> = { main: [], boiler: [], roof: [] };
  const put = (who: string, deck: Deck, [a, b]: readonly [number, number]) => {
    for (let i = a; i <= b; i++) {
      if (decks[deck][i]) throw new Error(`${who} and ${decks[deck][i]} both want ${deck} bay ${i}`);
      decks[deck][i] = who;
    }
  };
  for (const [who, part] of Object.entries(FIXED)) if (who !== 'porchRoof' && who !== 'texas') put(who, part.deck, part.bays);
  for (const m of Object.values(MODULES)) if (built[m.id] && m.bays) put(m.id, m.deck, m.bays);
  return decks;
}

/** The wheel: bigger with the bigger engine, its bottom always just under the water. */
export const wheel = (built: Built) => {
  const r = built.engine ? 16 : 13;
  return { r, cx: -3 - r, cy: 3 - r, period: built.engine ? 2.6 : 3.6 };
};

/**
 * Stations: where a figure stands or sits, in side-view units (feet at y). A figure's
 * place is named, so the story can say "the cook is at the galley door" and both views
 * agree. `side` is how far out from the centreline (top view), as a fraction of the beam.
 */
export interface Station {
  x: number;
  y: number;
  /** For a walker: how far forward the beat runs. */
  walk?: number;
}

export function stations(built: Built): Record<string, Station | undefined> {
  return {
    stoker: { x: 154, y: LEVEL.main },
    deckhand: { x: 24, y: LEVEL.main, walk: 100 },
    fisher: { x: 92, y: LEVEL.boiler },
    pilot: { x: 116, y: LEVEL.texas },
    cards: { x: 9, y: LEVEL.boiler },
    cook: built.galley ? { x: 66, y: LEVEL.main } : undefined,
    stroller: built.berths ? { x: 58, y: LEVEL.boiler, walk: 44 } : undefined,
    band: built.bandstand ? { x: 44, y: LEVEL.hurricane } : undefined,
  };
}
