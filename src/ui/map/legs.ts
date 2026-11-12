/**
 * The river map's legs, fetched once each: the sidecar of a leg (its channel, stops and
 * islands). The tiles and sidecars are served apart from the game (public/maptiles in
 * development; VITE_MAP_ROOT elsewhere): without them, null, and the river stays the felt.
 */
import type { TravelSidecar } from './route';

export const MAP_ROOT = (import.meta.env.VITE_MAP_ROOT as string | undefined) ?? '/maptiles/river-1904/';

const sidecars = new Map<string, Promise<TravelSidecar | null>>();

export function loadLeg(id: string): Promise<TravelSidecar | null> {
  let p = sidecars.get(id);
  if (!p) {
    p = fetch(`${MAP_ROOT}${id}/travel/travel.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    sidecars.set(id, p);
  }
  return p;
}
