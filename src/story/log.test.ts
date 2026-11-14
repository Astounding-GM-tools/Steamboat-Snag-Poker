import { describe, expect, it } from 'vitest';
import { DOCK_FEE_FLAG, leftMuscatine } from './log';

describe("Willie's log", () => {
  it('tells how the dock fee went as she leaves Muscatine, then the coal', () => {
    const last = (flags: string[]) => leftMuscatine(flags, 9, 37, 2, 6).split('\n').slice(0, 2).join(' / ');
    expect(leftMuscatine([DOCK_FEE_FLAG.paid], 13, 37, 2, 6)).toBe('Captain paid the dock fee. $37.\n$13 left for the river.\nCoal at 2/6.\nNeed to bunker up before we reach the rapids.');
    expect(last([DOCK_FEE_FLAG.paid])).toBe('Captain paid the dock fee. $37. / $9 left for the river.');
    expect(last([DOCK_FEE_FLAG.dodged])).toBe("The Captain played the harbour master for the docking fee. / Dodged the fee: $37 saved for coal. We'll need it.");
    expect(last([DOCK_FEE_FLAG.snagged])).toBe('The Captain played the harbour master for the docking fee. / Snagged the fee, and the ante. $9 left for expenses.');
  });
});
