/**
 * The river map: one chart for the whole river (docs/map.md, "One river, one chart"), and the legs
 * drawn on it. The chart is one tile grid (`tiles.json`: UTM 15N, 2 m a pixel, every pixel global);
 * a leg is data on it (its channel, stops and islands, in the grid's pixels), fetched once each.
 * Served apart from the game (public/maptiles in development; VITE_MAP_ROOT elsewhere): without
 * them, null, and the river stays the felt.
 */
import type { TileSet, TravelSidecar } from './route';

export const MAP_ROOT = (import.meta.env.VITE_MAP_ROOT as string | undefined) ?? '/maptiles/mrc-1894/';

const json = <T>(path: string): Promise<T | null> =>
  fetch(`${MAP_ROOT}${path}`)
    .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
    .catch(() => null);

/** The chart's tile grid, fetched once. */
let grid: Promise<TileSet | null> | null = null;
const loadGrid = () => (grid ??= json<TileSet>('tiles.json'));

const sidecars = new Map<string, Promise<TravelSidecar | null>>();

/** A leg, with the chart's grid it's drawn on. */
export function loadLeg(id: string): Promise<TravelSidecar | null> {
  let p = sidecars.get(id);
  if (!p) {
    p = Promise.all([json<Omit<TravelSidecar, 'tiles' | 'asset' | 'leg'>>(`legs/${id}.json`), loadGrid()]).then(([leg, tiles]) =>
      leg && tiles ? { ...leg, leg: id, tiles, asset: { size_px: tiles.size_px } } : null,
    );
    sidecars.set(id, p);
  }
  return p;
}
