/**
 * Nudges: small hand-made corrections to the channel line, where the chart's calculation put it
 * through an island or over a bar (docs/map.md, "How to nudge"). A nudge is a spot on the chart, a
 * push and a reach, all in the chart's global pixels: every point of a line within the reach of the
 * spot moves by the push, most at the spot and less towards the edge of the reach (a cosine falloff),
 * so the line bends there smoothly, and nothing beyond the reach moves at all.
 *
 * They're kept in the game (src/story/map/nudges.json), not with the tiles, so a re-export never
 * loses them, and every line over that water picks them up: up and down, and the whole river.
 */
import type { Pt, TravelSidecar } from './route';

export interface Nudge {
  /** The spot on the chart (map px). */
  at: Pt;
  /** How far, and which way, the line there moves (map px). */
  push: Pt;
  /** How far round the spot the line bends (map px). */
  reach: number;
}

/** How much of a nudge's push a point gets, at distance `d` from its spot: 1 there, easing to 0 at the reach. */
export function falloff(d: number, reach: number): number {
  if (!(reach > 0) || d >= reach) return 0;
  return 0.5 * (1 + Math.cos((Math.PI * d) / reach));
}

/** Where a point goes: every nudge's push on it, by how near its spot it is, added up. */
export function displace(p: Pt, nudges: readonly Nudge[]): Pt {
  let x = p[0], y = p[1];
  for (const n of nudges) {
    const w = falloff(Math.hypot(p[0] - n.at[0], p[1] - n.at[1]), n.reach);
    if (w) (x += w * n.push[0]), (y += w * n.push[1]);
  }
  return [x, y];
}

/** Does the segment a–b come within `r` of `c`? */
function near(a: Pt, b: Pt, c: Pt, r: number): boolean {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l2));
  return Math.hypot(a[0] + u * dx - c[0], a[1] + u * dy - c[1]) < r;
}

/** Points along a nudge's reach: this many to a reach, so the bend comes out a curve, not a kink. */
const FINENESS = 12;

/**
 * A line with the nudges applied. The chart's lines are sparse (a point every couple of hundred
 * pixels, some much further apart), so where a segment passes through a nudge's reach it's first cut
 * finer, then every point is moved. Lines nowhere near a nudge come back as they were (the same array).
 */
export function bend(line: readonly Pt[], nudges: readonly Nudge[]): Pt[] {
  const live = nudges.filter((n) => n.reach > 0 && (n.push[0] || n.push[1]));
  if (!live.length || line.length < 2) return line as Pt[];
  const touched = (a: Pt, b: Pt) => live.filter((n) => near(a, b, n.at, n.reach));
  if (!line.some((p, i) => i > 0 && touched(line[i - 1], p).length)) return line as Pt[];
  const out: Pt[] = [displace(line[0], live)];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const hit = touched(a, b);
    if (hit.length) {
      const step = Math.min(...hit.map((n) => n.reach)) / FINENESS;
      const pieces = Math.min(2000, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 1; k < pieces; k++) out.push(displace([a[0] + ((b[0] - a[0]) * k) / pieces, a[1] + ((b[1] - a[1]) * k) / pieces], live));
    }
    out.push(displace(b, live));
  }
  return out;
}

/** A leg with the nudges applied: its channel and its islands' passages (its stops go by `t`, and stay put). */
export function bendLeg(leg: TravelSidecar, nudges: readonly Nudge[]): TravelSidecar {
  if (!nudges.length) return leg;
  return {
    ...leg,
    path: { px: leg.path.px.map((line) => bend(line, nudges)) },
    islands: leg.islands?.map((island) => ({
      ...island,
      passages: island.passages.map((p) => ({ ...p, px: bend(p.px, nudges) })) as typeof island.passages,
    })),
  };
}

/** Nudges from a file (or a paste): only well-formed ones, rounded to a tenth of a pixel. */
export function parseNudges(data: unknown): Nudge[] {
  if (!Array.isArray(data)) return [];
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  const pt = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && num(v[0]) && num(v[1]);
  const r = (v: number) => Math.round(v * 10) / 10;
  return data
    .filter((n): n is Nudge => !!n && pt(n.at) && pt(n.push) && num(n.reach) && n.reach > 0)
    .map((n) => ({ at: [r(n.at[0]), r(n.at[1])], push: [r(n.push[0]), r(n.push[1])], reach: r(n.reach) }));
}

/** Nudges as the file keeps them: one to a line, so a diff shows which changed. */
export function formatNudges(nudges: readonly Nudge[]): string {
  const clean = parseNudges(nudges);
  return clean.length ? `[\n${clean.map((n) => '  ' + JSON.stringify(n)).join(',\n')}\n]\n` : '[]\n';
}
