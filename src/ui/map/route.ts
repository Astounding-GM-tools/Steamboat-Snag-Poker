/**
 * A leg of the voyage on a map: the channel's polyline (in the map's own pixels) and the
 * stops along it, each at a `t` from 0 (the leg's start) to 1 (its end). The polyline can
 * run either way (the sidecars' run downstream); a `t` is placed by arc length between the
 * two stops around it, so every stop lands exactly where the sidecar puts it.
 */

export type Pt = readonly [number, number];

export interface Stop {
  name: string;
  role: string;
  t: number;
  px: Pt;
  hub?: string;
}

/** One way round an island: `side` is the bank it keeps to, looking downstream (left: Illinois, right: Iowa), whichever way she's heading. */
export interface Passage {
  side: 'left' | 'right';
  name: string | null;
  kind: 'main' | 'chute';
  depth_ft: number;
  width_m: number;
  /** From the fork to where it rejoins, going upstream (`t` rising). */
  px: Pt[];
}

/** An island the channel splits around: between `from_t` and `to_t`, two passages, `[left, right]`. */
export interface Island {
  id: string;
  name: string | null;
  from_t: number;
  to_t: number;
  passages: [Passage, Passage];
}

/** A travel sidecar (`travel.json`), as much of it as the map uses. */
export interface TravelSidecar {
  leg: string;
  asset: { size_px: [number, number] };
  path: { px: Pt[][] };
  stops: Stop[];
  tiles: TileSet;
  /** By river mile, Muscatine's end first (see the sidecar's `islands_convention`). */
  islands?: Island[];
}

/** An island's key in the voyage's records: the leg and where the fork is. */
export const islandKey = (leg: string, island: Island) => `${leg}:${island.from_t}`;

/**
 * Port and starboard round an island, heading the way she is. Upbound (t rising) the
 * starboard hand faces the Illinois bank: `[starboard, port] = passages`; downbound the other
 * way round.
 */
export function sides(island: Island, upbound: boolean): { port: Passage; starboard: Passage } {
  const [left, right] = island.passages;
  return upbound ? { starboard: left, port: right } : { port: left, starboard: right };
}

/** A polyline measured: the point at fraction `u` of its length, and the stretch between two fractions. */
function measured(line: readonly Pt[]) {
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const total = cum[cum.length - 1] || 1;
  const at = (u: number): Pt => {
    const s = Math.max(0, Math.min(1, u)) * total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const k = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [line[i - 1][0] + k * (line[i][0] - line[i - 1][0]), line[i - 1][1] + k * (line[i][1] - line[i - 1][1])];
  };
  const between = (a: number, b: number): Pt[] => {
    const pts: Pt[] = [at(a)];
    for (let i = 0; i < cum.length; i++) if (cum[i] / total > a && cum[i] / total < b) pts.push(line[i]);
    pts.push(at(b));
    return pts;
  };
  return { at, between };
}

/**
 * The leg with its islands: round each, she takes the passage chosen (`lanes`, by `islandKey`), or
 * the main channel if none was. Her spot and heading at `t`, and the water she's come through.
 */
export function course(leg: Route, legId: string, islands: readonly Island[], lanes: Readonly<Record<string, 'left' | 'right'>>): Route {
  const ways = islands.map((island) => {
    const side = lanes[islandKey(legId, island)] ?? island.passages.find((p) => p.kind === 'main')!.side;
    return { island, way: measured(island.passages.find((p) => p.side === side)!.px) };
  });
  const on = (t: number) => ways.find(({ island }) => t > island.from_t && t < island.to_t);
  const u = (island: Island, t: number) => (t - island.from_t) / (island.to_t - island.from_t);
  return {
    ...leg,
    at(t) {
      const w = on(t);
      if (!w) return leg.at(t);
      const p = w.way.at(u(w.island, t));
      const fwd = leg.at(t).heading;
      const a = w.way.at(u(w.island, t) - 0.02), b = w.way.at(u(w.island, t) + 0.02);
      const heading = Math.hypot(b[0] - a[0], b[1] - a[1]) > 1 ? Math.atan2(b[1] - a[1], b[0] - a[0]) : fwd;
      // The passage runs upstream; heading down it, she faces the other way.
      const down = Math.cos(heading - fwd) < 0;
      return { p, heading: down ? heading + Math.PI : heading };
    },
    line(from, to) {
      const lo = Math.min(from, to), hi = Math.max(from, to);
      const pts: Pt[] = [];
      let t = lo;
      for (const { island, way } of ways) {
        if (island.to_t <= t || island.from_t >= hi) continue;
        if (island.from_t > t) pts.push(...leg.line(t, island.from_t));
        const a = Math.max(t, island.from_t), b = Math.min(hi, island.to_t);
        pts.push(...way.between(u(island, a), u(island, b)));
        t = b;
      }
      if (t < hi) pts.push(...leg.line(t, hi));
      return from <= to ? pts : pts.reverse();
    },
  };
}

export interface TileSet {
  url: string;
  tile_size: number;
  min_zoom: number;
  max_zoom: number;
  size_px: [number, number];
}

export interface Route {
  /** The point at `t`, and the way the boat faces there (radians, screen coordinates). */
  at(t: number): { p: Pt; heading: number };
  /** The channel travelled from `from` to `to`, as points for an SVG polyline. */
  line(from: number, to: number): Pt[];
  stops: Stop[];
  /** The leg's length in map pixels. */
  length: number;
}

export function route(line: readonly Pt[], stops: readonly Stop[]): Route {
  const cum = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));

  /** The arc length along `line` nearest to `p`. */
  const project = (p: Pt) => {
    let best = Infinity, s = 0;
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], dx = line[i][0] - ax, dy = line[i][1] - ay;
      const l2 = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2));
      const d = Math.hypot(p[0] - ax - u * dx, p[1] - ay - u * dy);
      if (d < best) (best = d), (s = cum[i - 1] + u * Math.sqrt(l2));
    }
    return s;
  };

  const sorted = [...stops].sort((a, b) => a.t - b.t);
  const knots = sorted.map((s) => ({ t: s.t, s: project(s.px) }));

  /** `t` to arc length, piecewise between the stops. */
  const arc = (t: number) => {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < knots.length; i++) {
      const a = knots[i - 1], b = knots[i];
      if (t <= b.t || i === knots.length - 1) return a.s + ((t - a.t) / (b.t - a.t || 1)) * (b.s - a.s);
    }
    return knots[0].s;
  };

  /** The segment holding arc length `s`, and how far along it. */
  const seg = (s: number) => {
    s = Math.max(0, Math.min(cum[cum.length - 1], s));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return { i, u };
  };
  const point = (s: number): Pt => {
    const { i, u } = seg(s);
    return [line[i - 1][0] + u * (line[i][0] - line[i - 1][0]), line[i - 1][1] + u * (line[i][1] - line[i - 1][1])];
  };

  const forward = knots[knots.length - 1].s >= knots[0].s;

  return {
    stops: sorted,
    length: Math.abs(knots[knots.length - 1].s - knots[0].s),
    at(t) {
      const s = arc(t);
      const p = point(s);
      // Her heading from the channel a good way ahead and behind (a boat's length or so): a bend, not a vertex.
      const ahead = point(s + (forward ? 150 : -150)), behind = point(s - (forward ? 150 : -150));
      return { p, heading: Math.atan2(ahead[1] - behind[1], ahead[0] - behind[0]) };
    },
    line(from, to) {
      const a = arc(from), b = arc(to);
      const lo = Math.min(a, b), hi = Math.max(a, b);
      const pts: Pt[] = [point(lo)];
      for (let i = 0; i < cum.length; i++) if (cum[i] > lo && cum[i] < hi) pts.push(line[i]);
      pts.push(point(hi));
      return a <= b ? pts : pts.reverse();
    },
  };
}
