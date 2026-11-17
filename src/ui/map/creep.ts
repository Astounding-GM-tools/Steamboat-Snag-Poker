/**
 * A hand on the river, at her real pace (docs/map.md, "Ideas waiting"). When a hand comes up she
 * doesn't stop dead: she slows to a real boat's pace, the boat fades, and the chart itself creeps by
 * under the table, as if seen from her deck. The longer the hand, the slower she goes and the closer
 * the view comes (towards the chart's full detail), each approaching its mark ever more gently and
 * never passing it. Debris hands are one round: they barely start on it. The Sandbar, several.
 *
 * Pure: seconds into the hand in, map pixels and zoom out.
 */

/** A real sternwheeler's pace, in map px a second: about 3.5 m/s, on a chart of 2 m a pixel. */
export const REAL_PACE_PX = 1.75;

/**
 * How far she's crept, in map px, `seconds` into the hand: at her real pace to begin with, her way
 * falling off by a factor of e every `tail` seconds, so she comes ever more slowly towards
 * `REAL_PACE_PX * tail` (the pan forward threshold), and never past it.
 */
export function crept(seconds: number, tail: number, pace = REAL_PACE_PX): number {
  if (!(seconds > 0) || !(tail > 0)) return 0;
  return pace * tail * (1 - Math.exp(-seconds / tail));
}

/** Her pace `seconds` into the hand (map px a second): what `crept` is the sum of. */
export function creepPace(seconds: number, tail: number, pace = REAL_PACE_PX): number {
  if (!(tail > 0)) return 0;
  return pace * Math.exp(-Math.max(0, seconds) / tail);
}

/**
 * The view's height (log2 of the scale) `seconds` into the hand: from `from` (the table's height)
 * closing in on `to` (the chart's full detail, 0), a share `1/e` of what's left every `tail` seconds.
 * Never past `to`: the tiles go no sharper than that.
 */
export function creepZoom(seconds: number, from: number, to: number, tail: number): number {
  if (!(seconds > 0) || !(tail > 0) || to <= from) return from;
  return from + (to - from) * (1 - Math.exp(-seconds / tail));
}
