import { describe, expect, it } from 'vitest';
import { anteFor, handsOf, nextMonth, streetFee, submitAction } from '../engine';
import { OATH, RESPECT, giveButtons, newTutorial, rematch, skipToButtons, skipToHands } from './tutorial';

describe('the tutorial', () => {
  it('round one plays as scripted: Ducks full of Ladies beat aces and deuces', () => {
    let g = newTutorial(1);
    const ids = () => g.round!.seats.map((s) => s.hand.map((c) => c.id).sort());
    expect(g.round!.potMode).toBe(false);
    expect(g.round!.community.map((c) => c.id)).toEqual(['As', '2c', 'Qs']);
    expect(ids()).toEqual([['Jc', 'Kd', 'Qh'], ['5h', '9s', 'Ac']]);

    g = submitAction(g, { type: 'draw', cardIds: [] }); // keep them
    expect(g.round!.community.at(-1)!.id).toBe('2d'); // the deuces pair at The Turn

    g = submitAction(g, { type: 'draw', cardIds: ['Jc', 'Kd'] }); // the jack and the king
    expect(ids()[0]).toEqual(['2h', '8d', 'Qh']);
    expect(g.round!.community.at(-1)!.id).toBe('6c');

    g = submitAction(g, { type: 'compose', cardIds: ['Qh', '2h'], jokers: 0 });
    const res = g.round!.result!;
    expect(res.winners).toEqual([0]);
    expect(res.hands.map((h) => h!.category)).toEqual(['fullHouse', 'twoPair']);
  });

  it('round two: a pair of jacks folds to her flush, and nothing changes hands', () => {
    let g = newTutorial(1);
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'draw', cardIds: ['Jc', 'Kd'] });
    g = submitAction(g, { type: 'compose', cardIds: ['Qh', '2h'], jokers: 0 });
    const purses = g.players.map((p) => p.money);
    g = nextMonth(g);
    const r = () => g.round!;
    expect(r().seats.map((s) => s.hand.map((c) => c.id).sort())).toEqual([['3c', 'Jd', 'Js'], ['5c', 'Qh', 'Th']]);
    expect(r().community.map((c) => c.id)).toEqual(['Ah', 'Kh', '9h']);

    g = submitAction(g, { type: 'draw', cardIds: [] }); // check
    expect(r().community.at(-1)!.id).toBe('4h');
    expect(r().seats[1].discarded).toEqual([]); // she stood pat

    g = submitAction(g, { type: 'fold' });
    expect(r().seats[0].folded).toBe(true);
    expect(handsOf(r())[1].category).toBe('flush'); // what she shows after your fold
    expect(g.players.map((p) => p.money)).toEqual(purses);
  });

  it('round three, the hands: her open deal climbs the ladder, and your four threes beat her full house', () => {
    let g = skipToHands(1);
    expect(g.month).toBe(3);
    expect(g.round!.potMode).toBe(false);
    const ids = (seat: number) => g.round!.seats[seat].hand.map((c) => c.id).sort();
    expect(g.round!.community.map((c) => c.id)).toEqual(['2h', '3c', '4h']);
    expect(ids(0)).toEqual(['4c', '7s', 'Ah']);
    g = submitAction(g, { type: 'draw', cardIds: ['7s', '4c'] });
    expect(ids(0)).toEqual(['5h', '6h', 'Ah']);
    expect(ids(1)).toEqual(['2s', '5s', '6c']);
    expect(g.round!.community.at(-1)!.id).toBe('2d');
    g = submitAction(g, { type: 'draw', cardIds: ['5h', '6h'] });
    expect(ids(0)).toEqual(['3d', '3s', 'Ah']);
    expect(g.round!.community.at(-1)!.id).toBe('3h');
    g = submitAction(g, { type: 'compose', cardIds: ['3d', '3s'], jokers: 0 });
    const res = g.round!.result!;
    expect(res.winners).toEqual([0]);
    expect(res.hands.map((h) => h!.category)).toEqual(['fourOfAKind', 'fullHouse']);
  });

  it('after the lesson on the hands, the same first hand for buttons', () => {
    let g = skipToHands(1);
    g = submitAction(g, { type: 'draw', cardIds: ['7s', '4c'] });
    g = submitAction(g, { type: 'draw', cardIds: ['5h', '6h'] });
    g = submitAction(g, { type: 'compose', cardIds: ['3d', '3s'], jokers: 0 });
    g = nextMonth(giveButtons(g));
    const skipped = skipToButtons(1);
    expect(g.month).toBe(skipped.month);
    expect(g.round!.seats[0].hand.map((c) => c.id).sort()).toEqual(['8d', '8s', 'Kc']);
    expect(g.round!.bets).toEqual(skipped.round!.bets);
  });

  it('the buttons: from round four a shuffled game for a pot, with a snag each', () => {
    const g = skipToButtons(1);
    expect(g.month).toBe(4); // round three, the lesson on the hands, passed by
    expect(g.round!.potMode).toBe(true);
    expect(g.players.map((p) => p.jokers.map((j) => j.index))).toEqual([[RESPECT], [OATH]]);
    expect(anteFor(g.config, 4, 1)).toBe(4); // the ante, 3 (the lesson doesn't count), and a button of upkeep
    expect([streetFee(g.config, 4, 1), streetFee(g.config, 4, 2)]).toEqual([1, 1]);
    expect(g.round!.bets).toEqual([4, 4]);
  });

  it('round four: three eights with Respect riding beat her two pair, and she takes your Respect', () => {
    let g = skipToButtons(1);
    const ids = (seat: number) => g.round!.seats[seat].hand.map((c) => c.id).sort();
    expect(ids(0)).toEqual(['8d', '8s', 'Kc']);
    g = submitAction(g, { type: 'draw', cardIds: [] }); // call
    g = submitAction(g, { type: 'draw', cardIds: [] }); // and again
    expect(g.round!.community.map((c) => c.id)).toEqual(['8h', 'Ad', '4c', '4s', 'Jh']);
    g = submitAction(g, { type: 'compose', cardIds: ['8s', '8d'], jokers: 1 });
    const res = g.round!.result!;
    expect(res.winners).toEqual([0]);
    expect(res.hands.map((h) => h!.category)).toEqual(['threeOfAKind', 'twoPair']);
    expect(g.players.map((p) => p.jokers.map((j) => j.index).sort())).toEqual([[], [OATH, RESPECT].sort()]);
  });

  it('round four: the full house wins too, but keeps your Respect', () => {
    let g = skipToButtons(1);
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'compose', cardIds: ['8s', '8d'], jokers: 0 });
    expect(g.round!.result!.hands[0]!.category).toBe('fullHouse');
    expect(g.round!.result!.winners).toEqual([0]);
    expect(g.players.map((p) => p.jokers.map((j) => j.index))).toEqual([[RESPECT], [OATH]]);
  });

  it('when she goes broke she keeps the snags: they outlive the game', () => {
    let g = skipToButtons(1);
    g.players[1].money = 5; // not enough for the ante and two calls
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'compose', cardIds: ['8s', '8d'], jokers: 1 });
    expect(g.phase).toBe('victory');
    expect(g.players[1].jokers.map((j) => j.index).sort()).toEqual([OATH, RESPECT].sort());
  });

  it('a rematch after the end: a fresh knockout, 20 buttons each, the snags back where they started', () => {
    let g = skipToButtons(1);
    g.players[1].money = 5;
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'draw', cardIds: [] });
    g = submitAction(g, { type: 'compose', cardIds: ['8s', '8d'], jokers: 1 });
    expect(g.phase).toBe('victory');
    g = rematch(g);
    expect(g.phase).toBe('duel');
    expect(g.month).toBe(5);
    expect(g.round!.potMode).toBe(true);
    expect(g.players.map((p) => [p.status, p.jokers.map((j) => j.index)])).toEqual([
      ['active', [RESPECT]],
      ['active', [OATH]],
    ]);
    expect(g.players.map((p) => p.money)).toEqual([20, 20]);
  });

  it('is the same deal whatever the seed', () => {
    const deal = (seed: number) => newTutorial(seed).round!.seats.map((s) => s.hand.map((c) => c.id));
    expect(deal(2)).toEqual(deal(99));
  });
});
