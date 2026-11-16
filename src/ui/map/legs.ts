/**
 * The river map: one chart for the whole river (docs/map.md, "One river, one chart"), and the legs
 * drawn on it. The chart is one tile grid (`tiles.json`: UTM 15N, 2 m a pixel, every pixel global);
 * a leg is data on it (its channel, stops and islands, in the grid's pixels), fetched once each.
 * Served apart from the game (public/maptiles in development; VITE_MAP_ROOT elsewhere): without
 * them, null, and the river stays the felt.
 */
import type { Pt, TileSet, TravelSidecar } from './route';

export const MAP_ROOT = (import.meta.env.VITE_MAP_ROOT as string | undefined) ?? '/maptiles/mrc-1894/';

const json = <T>(path: string): Promise<T | null> =>
  fetch(`${MAP_ROOT}${path}`)
    .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
    .catch(() => null);

/** The chart's tile grid, fetched once. */
let grid: Promise<TileSet | null> | null = null;
const loadGrid = () => (grid ??= json<TileSet>('tiles.json'));

const sidecars = new Map<string, Promise<TravelSidecar | null>>();

/**
 * Development: the whole river as one leg, Dubuque down to St. Louis (the voyage's route, no islands),
 * for looking the chart over end to end.
 */
export const WHOLE_RIVER = 'whole-river';

/** The voyage's route as a leg: its channel, from its first point (Dubuque) to its last (St. Louis). */
async function wholeRiver(): Promise<Omit<TravelSidecar, 'tiles' | 'asset' | 'leg'> | null> {
  // (The route's channel is one line of points; a leg's is a list of lines.)
  const r = await json<{ path: { px: Pt[] | Pt[][] } }>('route.json');
  const px = r?.path.px;
  const line = (px && typeof px[0]?.[0] === 'number' ? px : px?.[0]) as Pt[] | undefined;
  if (!line?.length) return null;
  return {
    path: { px: [line] },
    stops: [
      { name: 'Dubuque, Iowa', role: 'start', t: 0, px: line[0] },
      { name: 'Saint Louis, Missouri', role: 'end', t: 1, px: line[line.length - 1] },
    ],
  } as Omit<TravelSidecar, 'tiles' | 'asset' | 'leg'>;
}

/** A leg, with the chart's grid it's drawn on. */
export function loadLeg(id: string): Promise<TravelSidecar | null> {
  let p = sidecars.get(id);
  if (!p) {
    const leg = id === WHOLE_RIVER ? wholeRiver() : json<Omit<TravelSidecar, 'tiles' | 'asset' | 'leg'>>(`legs/${id}.json`);
    p = Promise.all([leg, loadGrid()]).then(([leg, tiles]) => (leg && tiles ? { ...leg, leg: id, tiles, asset: { size_px: tiles.size_px } } : null));
    sidecars.set(id, p);
  }
  return p;
}
