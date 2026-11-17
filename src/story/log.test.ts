import { describe, expect, it } from 'vitest';
import { DOCK_FEE_FLAG, FIRST_CRATE, firstCrateRecord, leftMuscatine } from './log';

describe("Willie's log", () => {
  it('tells how the dock fee went as she leaves Muscatine', () => {
    const last = (flags: string[]) => leftMuscatine(flags, 9, 37).split('\n').join(' / ');
    expect(leftMuscatine([DOCK_FEE_FLAG.paid], 13, 37)).toBe('Captain paid the dock fee. $37.\n$13 left for the river.');
    expect(last([DOCK_FEE_FLAG.paid])).toBe('Captain paid the dock fee. $37. / $9 left for the river.');
    expect(last([DOCK_FEE_FLAG.dodged])).toBe("The Captain played the harbour master for the docking fee. / Dodged the fee: $37 saved for coal. We'll need it.");
    expect(last([DOCK_FEE_FLAG.snagged])).toBe('The Captain played the harbour master for the docking fee. / Snagged the fee, and the ante. $9 left for expenses.');
  });

  it('writes up the first crate: the find and its worth, or what losing it must mean, the same for the same voyage', () => {
    expect(firstCrateRecord(0, true, 2)).toBe(`${FIRST_CRATE.found[0]}\nWorth $2 at the Mercantile.`);
    expect(FIRST_CRATE.lost).toContain(firstCrateRecord(7, false, 2));
    expect(firstCrateRecord(12345, true, 2)).toBe(firstCrateRecord(12345, true, 2));
  });
});
