import { describe, expect, it } from 'vitest';
import { DOCK_FEE_FLAG, leavingMuscatine } from './log';

describe("Willie's log", () => {
  it('ends his leaving Muscatine with how the dock fee went', () => {
    const last = (flags: string[]) => leavingMuscatine(flags, 9, 37, 2, 6).split('\n').slice(-2).join(' / ');
    expect(last([DOCK_FEE_FLAG.paid])).toBe('Docking fee: $37. / $9 left for the river.');
    expect(last([DOCK_FEE_FLAG.dodged])).toBe("The Captain played the harbour master for the docking fee. / Dodged the fee: $37 saved for coal. We'll need it.");
    expect(last([DOCK_FEE_FLAG.snagged])).toBe('The Captain played the harbour master for the docking fee. / Snagged the fee, and the ante. $9 left for expenses.');
  });
});
