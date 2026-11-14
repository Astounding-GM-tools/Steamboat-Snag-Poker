import { describe, expect, it } from 'vitest';
import { STREAM_RULES, busy, nextOnRiver, paceDuringHand, roomAhead, type Fork, type StreamState } from './stream';
import { Rng } from '../../engine/rng';

const PACE = 1 / 320;
/** Chapter one's islands, Muscatine to the Tri-Cities. */
const FORKS: Fork[] = [
  { from: 0.3378, to: 0.3581 },
  { from: 0.3689, to: 0.3931 },
  { from: 0.4892, to: 0.5173 },
];
const STRETCH = { from: 0, to: 0.6429 };
/** The main event's window: 40 to 60 percent of the way. */
const WINDOW: [number, number] = [STRETCH.to * 0.4, STRETCH.to * 0.6];

const state = (t: number, over: Partial<StreamState> = {}): StreamState => ({
  t,
  to: STRETCH.to,
  pace: PACE,
  forks: FORKS.filter((f) => f.to >= t),
  main: { window: WINDOW },
  sinceFill: Infinity,
  ...over,
});

interface Run {
  hands: { start: number; end: number; seconds: number }[];
  main: number | null;
  seconds: number;
}

/** A whole stretch, played: she steams, the stream calls, each hand takes the player `handSeconds()`. */
function steam(handSeconds: () => number, forks = FORKS): Run {
  const run: Run = { hands: [], main: null, seconds: 0 };
  let t = STRETCH.from, sinceFill = Infinity, debrisAt: number | null = null, hand: { start: number; left: number; seconds: number } | null = null;
  let mainDone = false;
  const dt = 0.25;
  for (let step = 0; step < 200000 && t < STRETCH.to; step++) {
    run.seconds += dt;
    const s = state(t, { forks: forks.filter((f) => f.to >= t), main: mainDone ? undefined : { window: WINDOW }, sinceFill });
    if (hand) {
      t += paceDuringHand(s) * PACE * dt;
      hand.left -= dt;
      if (hand.left <= 0) {
        run.hands.push({ start: hand.start, end: t, seconds: hand.seconds });
        hand = null;
        sinceFill = 0;
      }
      continue;
    }
    if (debrisAt !== null) {
      t = Math.min(debrisAt, t + PACE * dt);
      if (t >= debrisAt) {
        const seconds = handSeconds();
        hand = { start: t, left: seconds, seconds };
        debrisAt = null;
      }
      continue;
    }
    sinceFill += dt;
    const call = nextOnRiver(s);
    if (call.kind === 'main' && !mainDone) {
      run.main = t;
      mainDone = true;
    } else if (call.kind === 'debris') debrisAt = call.at;
    t += PACE * dt;
  }
  return run;
}

const zones = (forks = FORKS) => forks.map((f) => busy(f, { pace: PACE }));
const overlaps = (a: number, b: number, [c, d]: [number, number]) => a <= d && b >= c;

describe('the syncopated event stream', () => {
  it('keeps clear of a fork: no debris while one is called or being rounded', () => {
    const [a] = busy(FORKS[0], { pace: PACE });
    expect(nextOnRiver(state(a + 0.001, { main: undefined })).kind).toBe('river');
    expect(nextOnRiver(state(FORKS[0].to - 0.001, { main: undefined })).kind).toBe('river');
  });

  it('puts debris only where there is room for it before the next fork', () => {
    const [a] = busy(FORKS[0], { pace: PACE });
    // Just short of the warning: no room for a hand.
    expect(nextOnRiver(state(a - 5 * PACE, { main: undefined })).kind).toBe('river');
    // Well before it: a piece of debris, ahead of her.
    const call = nextOnRiver(state(0.05, { main: undefined }));
    expect(call.kind).toBe('debris');
    if (call.kind === 'debris') expect(call.at).toBeCloseTo(0.05 + STREAM_RULES.debrisLeadSeconds * PACE);
  });

  it('rests between fills', () => {
    expect(nextOnRiver(state(0.05, { main: undefined, sinceFill: 3 })).kind).toBe('river');
    expect(nextOnRiver(state(0.05, { main: undefined, sinceFill: STREAM_RULES.restSeconds })).kind).toBe('debris');
  });

  it('holds the main event for its window, aiming for the middle, and keeps the river clear for it', () => {
    const mid = (WINDOW[0] + WINDOW[1]) / 2;
    expect(nextOnRiver(state(WINDOW[0] - 0.001)).kind).not.toBe('main');
    // In the window with room for one more fill before the middle: the fill first.
    expect(nextOnRiver(state(WINDOW[0] + 0.001, { forks: [] })).kind).toBe('debris');
    // No room left before the middle: the main event, a little early.
    expect(nextOnRiver(state(mid - 10 * PACE, { forks: [] })).kind).toBe('main');
    expect(roomAhead(state(mid - 10 * PACE, { forks: [] }))).toBeCloseTo(10);
  });

  it('never brings the main event straight after a hand: a breather first', () => {
    const mid = (WINDOW[0] + WINDOW[1]) / 2;
    expect(nextOnRiver(state(mid, { forks: [], sinceFill: 2 })).kind).toBe('river');
    expect(nextOnRiver(state(mid, { forks: [], sinceFill: STREAM_RULES.mainRestSeconds })).kind).toBe('main');
  });

  it('crawls during a hand, and stops short of what she must keep clear for', () => {
    expect(paceDuringHand(state(0.05, { main: undefined }))).toBe(STREAM_RULES.crawl);
    const [a] = busy(FORKS[0], { pace: PACE });
    expect(paceDuringHand(state(a - 2 * PACE, { main: undefined }))).toBe(0);
  });

  it('plays whole stretches without anything colliding, however long the hands take', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const rng = new Rng(seed);
      // Mostly quick hands, now and then a player gone for minutes.
      const run = steam(() => (rng.int(10) === 0 ? 120 + rng.int(300) : 10 + rng.int(60)));
      // The main event happens, once, in its window or (held by a fork) just past it, never in a fork.
      expect(run.main, `seed ${seed}`).not.toBeNull();
      expect(run.main!).toBeGreaterThanOrEqual(WINDOW[0]);
      for (const z of zones()) expect(run.main! > z[0] && run.main! < z[1], `seed ${seed}: main in a fork`).toBe(false);
      // Never straight after a hand.
      for (const h of run.hands) expect(run.main! > h.end && run.main! < h.end + STREAM_RULES.mainRestSeconds * PACE * 0.99, `seed ${seed}: main on a hand's heels`).toBe(false);
      // No hand ever runs into a fork's busy stretch.
      for (const h of run.hands) for (const z of zones()) expect(overlaps(h.start, h.end, z), `seed ${seed}: hand ${h.start}-${h.end} in a fork`).toBe(false);
      // Something happens: a stretch this long has room for a few.
      expect(run.hands.length, `seed ${seed}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('never gives a quick player less debris than a leisurely one', () => {
    // (With the long rest between fills, the room between the islands is what limits it, mostly.)
    const quick = steam(() => 12);
    const slow = steam(() => 75);
    expect(quick.hands.length).toBeGreaterThanOrEqual(slow.hands.length);
  });
});
