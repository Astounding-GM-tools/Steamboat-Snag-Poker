import { describe, expect, it } from 'vitest';
import { BAYS, MODULES, canBuild, occupancy, type Built, type ModuleId } from './boat';

describe('the Best Intentions', () => {
  const everything = Object.fromEntries(Object.keys(MODULES).map((id) => [id, true])) as Built;

  it('fits every module at once, no two in one bay', () => {
    const decks = occupancy(everything);
    for (const bays of Object.values(decks)) expect(bays.length).toBeLessThanOrEqual(BAYS);
  });

  it('builds nothing before what it stands on', () => {
    expect(canBuild('bandstand', {})).toBe(false);
    expect(canBuild('bandstand', { saloon: true })).toBe(true);
    for (const id of Object.keys(MODULES) as ModuleId[]) expect(canBuild(id, everything)).toBe(true);
  });
});
