/**
 * The syncopated event stream (docs/map.md): what happens next on a stretch of river, decided as she
 * goes rather than set by the second. A fixed beat (the island forks: they're on the map), a main
 * event that floats in a window, aiming for its middle (The Sandbar: never skipped), and fills
 * (debris, one item, settled with one hand of Snag) played only where there's room for them.
 *
 * Willie's log isn't here: he types in the header, through anything.
 *
 * All positions are the leg's `t` (0 to 1), upbound (`t` rising); times are seconds at her pace.
 * Pure: the same answer for the same question, so it can be tested, and tried on a whole stretch.
 */

/** An island fork ahead: its warning comes before `from`, and she's busy round it till `to`. */
export interface Fork {
  from: number;
  to: number;
}

export interface StreamRules {
  /** Seconds of warning before a fork (the call goes up). */
  warnSeconds: number;
  /** About how long a debris hand takes, in seconds (she crawls meanwhile). */
  debrisSeconds: number;
  /** How far ahead of her a piece of debris shows up, in seconds at her pace. */
  debrisLeadSeconds: number;
  /** Her pace while a hand's being played, as a share of her full pace. */
  crawl: number;
  /** Room to spare round anything, in seconds: tight, never rushed. */
  marginSeconds: number;
  /** Quiet between one fill and the next, in seconds: the gentle intermission. */
  restSeconds: number;
  /** Quiet after a hand before the main event, in seconds: it never comes straight on the heels of one. */
  mainRestSeconds: number;
}

export const STREAM_RULES: StreamRules = {
  warnSeconds: 12,
  debrisSeconds: 40,
  debrisLeadSeconds: 8,
  crawl: 0.15,
  marginSeconds: 6,
  restSeconds: 35,
  mainRestSeconds: 15,
};

/** Where she is, and what's ahead on the stretch. */
export interface StreamState {
  /** Where she is. */
  t: number;
  /** Where the stretch ends. */
  to: number;
  /** Her full pace: `t` a second. */
  pace: number;
  /** The forks still ahead or underway, in order. */
  forks: readonly Fork[];
  /** The stretch's main event, if it hasn't happened yet: where it may happen. */
  main?: { window: readonly [number, number] };
  /** Seconds since the last hand was settled, or she got under way (Infinity: none yet on this stretch). */
  sinceFill: number;
}

export type StreamCall =
  /** The main event, now. */
  | { kind: 'main' }
  /** Debris in the water ahead, at `at` (she'll reach it in `debrisLeadSeconds`). */
  | { kind: 'debris'; at: number }
  /** Nothing for now: ask again. */
  | { kind: 'river' };

/** The stretch of river a fork keeps busy: from its warning to where its passages rejoin. */
export function busy(fork: Fork, s: Pick<StreamState, 'pace'>, rules = STREAM_RULES): [number, number] {
  return [fork.from - rules.warnSeconds * s.pace, fork.to];
}

/** Whether `t` is in a fork's busy stretch. */
const inFork = (t: number, s: StreamState, rules: StreamRules) =>
  s.forks.some((f) => {
    const [a, b] = busy(f, s, rules);
    return t >= a && t <= b;
  });

/**
 * The next thing she must keep clear for (seconds at her pace): the next fork's warning, the main
 * event's window (while it's pending), or the stretch's end.
 */
export function roomAhead(s: StreamState, rules = STREAM_RULES): number {
  const ends = [s.to];
  for (const f of s.forks) {
    const [a] = busy(f, s, rules);
    if (a > s.t) ends.push(a);
  }
  if (s.main && aim(s.main.window) > s.t) ends.push(aim(s.main.window));
  return (Math.min(...ends) - s.t) / s.pace;
}

/** Where the main event aims for: the middle of its window. */
const aim = (w: readonly [number, number]) => (w[0] + w[1]) / 2;

/** What comes next, where she is now. */
export function nextOnRiver(s: StreamState, rules = STREAM_RULES): StreamCall {
  const forking = inFork(s.t, s, rules);
  // She comes up to a piece of debris at her pace, then crawls while the hand's played; with room to spare after.
  const needs = rules.debrisLeadSeconds + rules.debrisSeconds * rules.crawl + rules.marginSeconds;
  const fits = roomAhead(s, rules) >= needs;
  // The main event, aiming for its window's middle: there, or sooner in the window if no more fill would
  // fit before the middle; never inside a fork, nor straight after a hand (held till she's round it, and
  // had a breather, past the window's end if need be).
  const ready = !forking && s.sinceFill >= rules.mainRestSeconds;
  if (s.main && ready && s.t >= s.main.window[0] && (s.t >= aim(s.main.window) || !fits)) return { kind: 'main' };
  if (s.main && s.t >= aim(s.main.window)) return { kind: 'river' };
  // A fill: only out of a fork, after a rest, and with room for it before whatever's next.
  if (forking || s.sinceFill < rules.restSeconds) return { kind: 'river' };
  if (fits) return { kind: 'debris', at: s.t + rules.debrisLeadSeconds * s.pace };
  return { kind: 'river' };
}

/**
 * Her pace while a hand's being played, as a share of her full pace: a crawl, and to a stop when the
 * next thing to keep clear for is close (the player may have stepped away: nothing gets missed).
 */
export function paceDuringHand(s: StreamState, rules = STREAM_RULES): number {
  return roomAhead(s, rules) <= rules.marginSeconds ? 0 : rules.crawl;
}

/**
 * How far she may creep on during a hand, as the leg's `t` (seen from her deck, at her real pace: see
 * src/ui/map/creep.ts): never into the next thing to keep clear for (a fork's warning, the main event's
 * aim, the stretch's end), with the margin to spare. Where she's stopped is the hand's place in the
 * stream; this is the most she may drift on from it before the stretch carries on.
 */
export function creepRoom(s: StreamState, rules = STREAM_RULES): number {
  return Math.max(0, roomAhead(s, rules) - rules.marginSeconds) * s.pace;
}
