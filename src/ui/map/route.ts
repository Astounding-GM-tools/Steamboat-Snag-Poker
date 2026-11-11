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

/** A travel sidecar (`travel.json`), as much of it as the map uses. */
export interface TravelSidecar {
  leg: string;
  asset: { size_px: [number, number] };
  path: { px: Pt[][] };
  stops: Stop[];
  tiles: TileSet;
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
      const ahead = point(s + (forward ? 40 : -40)), behind = point(s - (forward ? 40 : -40));
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
