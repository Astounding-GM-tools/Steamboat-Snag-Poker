import { describe, expect, it } from 'vitest';
import { REAL_PACE_PX, creepPace, creepZoom, crept } from './creep';

describe('a hand on the river, at her real pace', () => {
  it('starts at a real boat’s pace, under 2 map px a second', () => {
    expect(REAL_PACE_PX).toBeLessThan(2);
    expect(creepPace(0, 90)).toBe(REAL_PACE_PX);
    expect(crept(1, 90)).toBeCloseTo(REAL_PACE_PX, 1);
  });
  it('slows the longer the hand, coming ever more gently to its threshold and never past it', () => {
    const threshold = REAL_PACE_PX * 90;
    let last = 0;
    for (const s of [10, 40, 120, 300, 900, 3600, 1e6]) {
      const d = crept(s, 90);
      expect(d).toBeGreaterThanOrEqual(last);
      expect(d).toBeLessThanOrEqual(threshold);
      last = d;
    }
    expect(creepPace(300, 90)).toBeLessThan(creepPace(40, 90));
    expect(crept(1e6, 90)).toBeCloseTo(threshold);
  });
  it('is still before the hand, and with no tail at all', () => {
    expect(crept(0, 90)).toBe(0);
    expect(crept(-5, 90)).toBe(0);
    expect(crept(60, 0)).toBe(0);
  });
  it('closes in on the chart’s full detail, never past it; a single round barely starts on it', () => {
    expect(creepZoom(0, -1.4, 0, 240)).toBe(-1.4);
    const oneRound = creepZoom(40, -1.4, 0, 240);
    expect(oneRound).toBeGreaterThan(-1.4);
    expect(oneRound).toBeLessThan(-1.1);
    let last = -1.4;
    for (const s of [60, 240, 600, 3600, 1e6]) {
      const z = creepZoom(s, -1.4, 0, 240);
      expect(z).toBeGreaterThan(last);
      expect(z).toBeLessThanOrEqual(0);
      last = z;
    }
  });
  it('never draws back: a mark below where it is leaves the view as it is', () => {
    expect(creepZoom(100, -0.5, -1.4, 240)).toBe(-0.5);
  });
});
