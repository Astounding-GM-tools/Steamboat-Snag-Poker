import { describe, expect, it } from 'vitest';
import { anteFor, nextMonth, streetFee, submitAction } from '../engine';
import { OATH, RESPECT, newTutorial, skipToButtons } from './tutorial';

describe('the tutorial', () => {
  it('round one plays as scripted: Ducks full of Ladies beat three aces', () => {
    let g = newTutorial(1);
    const ids = () => g.round!.seats.map((s) => s.hand.map((c) => c.id).sort());
    expect(g.round!.potMode).toBe(false);
    expect(g.round!.community.map((c) => c.id)).toEqual(['As', '7h', '2c']);
    expect(ids()).toEqual([['Ah', 'Kh', 'Qh'], ['9s', 'Ac', 'Ad']]);

    g = submitAction(g, { type: 'draw', cardIds: [] }); // keep them
    expect(g.round!.community.at(-1)!.id).toBe('Qs');

    g = submitAction(g, { type: 'draw', cardIds: ['Ah', 'Kh'] }); // the ace and the king
    expect(ids()[0]).toEqual(['2d', '2h', 'Qh']);
    expect(g.round!.community.at(-1)!.id).toBe('5d');

    g = submitAction(g, { type: 'compose', cardIds: ['Qh', '2d', '2h'], jokers: 0 });
    const res = g.round!.result!;
    expect(res.winner).toBe(0);
    expect(res.hands[0].category).toBe('fullHouse');
    expect(res.hands[1].category).toBe('threeOfAKind');
  });

  it('round two: a pair of jacks folds to her flush, and nothing changes hands', () => {
    let g = newTutorial(1);
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'draw', cardIds: ['Ah', 'Kh'] });
    g = submitAction(g, { type: 'compose', cardIds: ['Qh', '2d', '2h'], jokers: 0 });
    const purses = g.players.map((p) => p.money);
    g = nextMonth(g);
    const r = () => g.round!;
    expect(r().seats.map((s) => s.hand.map((c) => c.id).sort())).toEqual([['3c', 'Jd', 'Js'], ['5c', 'Qh', 'Th']]);
    expect(r().community.map((c) => c.id)).toEqual(['Ah', 'Kh', '9h']);

    g = submitAction(g, { type: 'draw', cardIds: [] }); // check
    expect(r().community.at(-1)!.id).toBe('4h');
    expect(r().seats[1].discarded).toEqual([]); // she stood pat

    g = submitAction(g, { type: 'fold' });
    expect(r().result!.folded).toBe(0);
    expect(r().result!.hands[1].category).toBe('flush');
    expect(g.players.map((p) => p.money)).toEqual(purses);
  });

  it('the buttons: from round three a shuffled game for a pot, with a snag each', () => {
    const g = skipToButtons(1);
    expect(g.month).toBe(3);
    expect(g.round!.potMode).toBe(true);
    expect(g.players.map((p) => p.jokers.map((j) => j.index))).toEqual([[RESPECT], [OATH]]);
    expect(anteFor(g.config, 3, 1)).toBe(4); // the ante, 3, and a button of upkeep
    expect([streetFee(g.config, 3, 1), streetFee(g.config, 3, 2)]).toEqual([1, 1]);
    expect(g.round!.bets).toEqual([4, 4]);
  });

  it('round three: three eights with Respect riding beat her two pair, and she takes your Respect', () => {
    let g = skipToButtons(1);
    const ids = (seat: number) => g.round!.seats[seat].hand.map((c) => c.id).sort();
    expect(ids(0)).toEqual(['8d', '8s', 'Kc']);
    g = submitAction(g, { type: 'draw', cardIds: [] }); // call
    g = submitAction(g, { type: 'draw', cardIds: [] }); // and again
    expect(g.round!.community.map((c) => c.id)).toEqual(['8h', 'Ad', '4c', '4s', 'Jh']);
    g = submitAction(g, { type: 'compose', cardIds: ['8s', '8d'], jokers: 1 });
    const res = g.round!.result!;
    expect(res.winner).toBe(0);
    expect(res.hands.map((h) => h.category)).toEqual(['threeOfAKind', 'twoPair']);
    expect(g.players.map((p) => p.jokers.map((j) => j.index).sort())).toEqual([[], [OATH, RESPECT].sort()]);
  });

  it('round three: the full house wins too, but keeps your Respect', () => {
    let g = skipToButtons(1);
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'compose', cardIds: ['8s', '8d'], jokers: 0 });
    expect(g.round!.result!.hands[0].category).toBe('fullHouse');
    expect(g.round!.result!.winner).toBe(0);
    expect(g.players.map((p) => p.jokers.map((j) => j.index))).toEqual([[RESPECT], [OATH]]);
  });

  it('is the same deal whatever the seed', () => {
    const deal = (seed: number) => newTutorial(seed).round!.seats.map((s) => s.hand.map((c) => c.id));
    expect(deal(2)).toEqual(deal(99));
  });
});
