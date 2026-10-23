import { describe, expect, it } from 'vitest';
import { bookmakerOdds } from './format';

describe('bookmakerOdds', () => {
  it('chalks up a chance as traditional fractional odds', () => {
    expect(bookmakerOdds(0.5)).toBe('Evens');
    expect(bookmakerOdds(0.56)).toBe('4/5');
    expect(bookmakerOdds(0.13)).toBe('7/1');
    expect(bookmakerOdds(0.75)).toBe('1/3');
    expect(bookmakerOdds(0.001)).toBe('100/1');
    expect(bookmakerOdds(0)).toBe('Off');
  });
});
