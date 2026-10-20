import { describe, expect, it } from 'vitest';
import { evaluate, parseCard } from '../engine';
import { describeHand, tiebreak } from './handNames';

const hand = (codes: string) => evaluate(codes.split(' ').map(parseCard));

describe('tiebreak', () => {
  it('names the kicker when two pair meets two pair (the Steamboat Bill hand)', () => {
    const bill = hand('As Ad Kh Kd 8h');
    const you = hand('As Ad Kh Kd 6s');
    expect(describeHand(bill)).toBe(describeHand(you));
    expect(tiebreak(bill, you)).toEqual({ kind: 'kicker', winner: 'Eight', loser: 'Six', loserDead: false });
  });

  it('flags a dead card (a snag) that lost the kicker battle', () => {
    const ignatz = evaluate([parseCard('Ks'), parseCard('Kd'), parseCard('9c'), parseCard('4h'), parseCard('3s')]);
    const you = evaluate([parseCard('Ks'), parseCard('Kd'), parseCard('9c'), parseCard('4h'), null]);
    expect(tiebreak(ignatz, you)).toEqual({ kind: 'kicker', winner: 'Three', loser: 'snag', loserDead: true });
  });

  it('uses "next card" for flushes', () => {
    expect(tiebreak(hand('Ks Qs 9s 7s 4s'), hand('Kh Jh 9h 7h 4h'))?.kind).toBe('next');
  });

  it('falls back to suits when every rank matches', () => {
    expect(tiebreak(hand('As 9d 7c 5h 3c'), hand('Ah 9c 7d 5s 3d'))).toEqual({ kind: 'suit', winner: '♠', loser: '♡' });
  });

  it('says nothing when the hands already have different names', () => {
    expect(tiebreak(hand('As Ad Kh Kd 6s'), hand('As Ad Qh Qd 6s'))).toBeNull();
  });
});
