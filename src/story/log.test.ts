import { describe, expect, it } from 'vitest';
import { CHART_MARKS, DOCK_FEE_FLAG, FIRST_CRATE, debrisMark, firstCrateRecord, leftMuscatine } from './log';
import { markChart, type JourneyState } from './mechanics';

describe("Willie's log", () => {
  it('tells how the dock fee went as she leaves Muscatine', () => {
    const last = (flags: string[]) => leftMuscatine(flags, 9, 37).split('\n').join(' / ');
    expect(leftMuscatine([DOCK_FEE_FLAG.paid], 13, 37)).toBe('Captain paid the dock fee, $37.\n$13 left for the strongbox.');
    expect(last([DOCK_FEE_FLAG.paid])).toBe('Captain paid the dock fee, $37. / $9 left for the strongbox.');
    expect(last([DOCK_FEE_FLAG.dodged])).toBe('Captain played the harbour master for the docking fee. / Dodged the fee, $9 safe in the strongbox.');
    expect(last([DOCK_FEE_FLAG.snagged])).toBe('Captain played the harbour master for the docking fee. / Snagged the fee, and the ante. $9 left in the strongbox.');
    expect(leftMuscatine([DOCK_FEE_FLAG.snagged], 0, 37)).toBe('Captain played the harbour master for the docking fee.\nSnagged the fee, and the ante. Nothing left in the strongbox.');
  });

  it('writes up the first crate: the find and its worth, or what losing it must mean, the same for the same voyage', () => {
    expect(firstCrateRecord(0, true, 2)).toBe(`${FIRST_CRATE.found[0]}\nWorth $2 at the Mercantile.`);
    expect(FIRST_CRATE.lost).toContain(firstCrateRecord(7, false, 2));
    expect(firstCrateRecord(12345, true, 2)).toBe(firstCrateRecord(12345, true, 2));
  });

  it('marks the chart: a word or two, the first crate saying what was in it', () => {
    expect(FIRST_CRATE.marks).toHaveLength(FIRST_CRATE.found.length);
    for (let seed = 0; seed < FIRST_CRATE.found.length; seed++) expect(firstCrateRecord(seed, true, 2).startsWith(FIRST_CRATE.found[seed])).toBe(true);
    expect(debrisMark('crate', 'solved', false, 5)).toBe(FIRST_CRATE.marks[5]);
    expect(debrisMark('crate', 'failed', false, 5)).toBe(CHART_MARKS.lostFirst);
    expect(debrisMark('crate', 'solved', false)).toBe('Salvage');
    expect(debrisMark('deadhead', 'solved', false)).toBe('Deadheads');
    expect(debrisMark('sawyer', 'failed', true)).toBe('Hit a sawyer');
    for (const label of [...FIRST_CRATE.marks, ...Object.values(CHART_MARKS.hazard).flatMap((h) => [h.clear, h.struck])]) expect(label.split(' ').length).toBeLessThanOrEqual(4);
  });

  it('puts a mark where she is on the river, once', () => {
    const at = { river: { leg: 'up', t: 0.25 } } as JourneyState;
    const once = markChart(at, 'Deadheads');
    expect(once.marks).toEqual([{ leg: 'up', t: 0.25, label: 'Deadheads' }]);
    expect(markChart(once, 'Deadheads').marks).toHaveLength(1);
    expect(markChart({} as JourneyState, 'Aground').marks).toBeUndefined();
  });
});
