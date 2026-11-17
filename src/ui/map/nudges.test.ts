import { describe, expect, it } from 'vitest';
import { bend, displace, falloff, formatNudges, parseNudges, type Nudge } from './nudges';
import { route, type Pt } from './route';

/** A straight line along y = 0, a point every 100 px from 0 to 2000. */
const straight: Pt[] = Array.from({ length: 21 }, (_, i) => [i * 100, 0] as Pt);
const lift: Nudge = { at: [1000, 0], push: [0, 50], reach: 300 };

describe('falloff', () => {
  it('is whole at the spot, half halfway, nothing at the reach and beyond', () => {
    expect(falloff(0, 300)).toBe(1);
    expect(falloff(150, 300)).toBeCloseTo(0.5);
    expect(falloff(300, 300)).toBe(0);
    expect(falloff(1000, 300)).toBe(0);
    expect(falloff(0, 0)).toBe(0);
  });
});

describe('displace', () => {
  it('moves a point at the spot by the whole push, and leaves one beyond the reach be', () => {
    expect(displace([1000, 0], [lift])).toEqual([1000, 50]);
    expect(displace([1300, 0], [lift])).toEqual([1300, 0]);
    expect(displace([0, 0], [lift])).toEqual([0, 0]);
  });
  it('adds nudges together', () => {
    expect(displace([1000, 0], [lift, { at: [1000, 0], push: [10, 0], reach: 100 }])).toEqual([1010, 50]);
  });
});

describe('bend', () => {
  it('leaves a line with no nudges near it as it was', () => {
    expect(bend(straight, [])).toBe(straight);
    expect(bend(straight, [{ at: [1000, 5000], push: [0, 50], reach: 300 }])).toBe(straight);
    expect(bend(straight, [{ at: [1000, 0], push: [0, 0], reach: 300 }])).toBe(straight);
  });
  it('bends the line smoothly within the reach, and nowhere else', () => {
    const out = bend(straight, [lift]);
    // Cut finer through the reach.
    expect(out.length).toBeGreaterThan(straight.length);
    for (const [x, y] of out) {
      if (Math.abs(x - 1000) >= 300) expect(y).toBe(0);
      else expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThanOrEqual(50);
    }
    expect(out).toContainEqual([1000, 50]);
    // Every point beyond the reach is one of the line's own, unmoved.
    const outside = out.filter(([x]) => Math.abs(x - 1000) >= 300);
    expect(outside).toEqual(straight.filter(([x]) => Math.abs(x - 1000) >= 300));
    // Smooth: no step between neighbours bigger than a little of the push.
    for (let i = 1; i < out.length; i++) expect(Math.abs(out[i][1] - out[i - 1][1])).toBeLessThan(10);
  });
  it('bends a long segment that passes through a reach without a point in it', () => {
    const long: Pt[] = [[0, 0], [5000, 0]];
    const out = bend(long, [{ at: [2500, 0], push: [0, 40], reach: 200 }]);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([5000, 0]);
    expect(Math.max(...out.map(([, y]) => y))).toBeCloseTo(40, 0);
  });
});

describe('a nudged route', () => {
  it('keeps its stops where they were, by t', () => {
    const stops = [
      { name: 'A', role: 'start', t: 0, px: [0, 0] as Pt },
      { name: 'B', role: 'stop', t: 0.5, px: [1000, 0] as Pt },
      { name: 'C', role: 'end', t: 1, px: [2000, 0] as Pt },
    ];
    const r = route(bend(straight, [{ at: [500, 0], push: [0, 60], reach: 250 }]), stops);
    expect(r.at(0).p).toEqual([0, 0]);
    expect(r.at(0.5).p[0]).toBeCloseTo(1000);
    expect(r.at(1).p).toEqual([2000, 0]);
    // Halfway to B, she's up on the bend.
    expect(r.at(0.25).p[1]).toBeGreaterThan(40);
  });
});

describe('the file', () => {
  it('round-trips, dropping what is not a nudge', () => {
    const text = formatNudges([lift, { at: [1.234, 2], push: [3, 4], reach: 10 }]);
    expect(parseNudges(JSON.parse(text))).toEqual([lift, { at: [1.2, 2], push: [3, 4], reach: 10 }]);
    expect(parseNudges([{ at: [1, 2] }, null, 'x', { at: [1, 2], push: [0, 1], reach: -1 }])).toEqual([]);
    expect(parseNudges({})).toEqual([]);
    expect(formatNudges([])).toBe('[]\n');
  });
});
