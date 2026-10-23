import { describe, expect, it } from 'vitest';
import { bookmakerOdds } from './format';

describe('bookmakerOdds', () => {
  it('calls a chance as a bookmaker would', () => {
    expect(bookmakerOdds(0.5)).toBe('Evens');
    expect(bookmakerOdds(0.56)).toBe('5 to 4 on');
    expect(bookmakerOdds(0.13)).toBe('7 to 1');
    expect(bookmakerOdds(0.75)).toBe('3 to 1 on');
    expect(bookmakerOdds(0.001)).toBe('100 to 1');
    expect(bookmakerOdds(0)).toBe('Off');
  });
});
