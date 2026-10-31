import { describe, expect, it } from 'vitest';
import { jokerCard } from './cards';
import { chooseAction } from './ai';
import { DEFAULT_CONFIG } from './config';
import { Rng } from './rng';
import { baseAnte } from './pot';
import { createTableRound, resolveTableStreet, tableAnswering, tableFee, type TableRound } from './table';
import { highRollersResult, mySeat, newHighRollers, nextHighRollersHand, placings, playHighRollers, tableView } from './highrollers';
import type { Action } from './round';

const config = DEFAULT_CONFIG;
const stand: Action = { type: 'draw', cardIds: [] };
const players = (n: number, jokers: number[] = []) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, jokers: Array.from({ length: jokers[i] ?? 0 }, (_, k) => jokerCard(i * 3 + k)) }));
const ids = (round: TableRound) => round.seats.map((s) => s.hand.map((c) => c.id).sort());

// The Flop, then three rounds of hole cards from the first seat (here seat 1), then the rest.
const order = ['As', 'Kd', '2c', /* hole cards, seats 1 2 3 0 */ 'Qh', 'Jh', 'Th', '9h', 'Qs', 'Js', 'Ts', '9s', 'Qc', 'Jc', 'Tc', '9c', /* draws and streets */ '8h', '8s', '7c', '6d'];

describe('a hand at a table of four', () => {
  it('deals the Flop, then three cards each round the table from the first seat; everyone antes', () => {
    const round = createTableRound(1, players(4), 1, [], config, new Rng(1), order);
    expect(round.community.map((c) => c.id)).toEqual(['As', 'Kd', '2c']);
    expect(ids(round)).toEqual([
      ['9c', '9h', '9s'],
      ['Qc', 'Qh', 'Qs'],
      ['Jc', 'Jh', 'Js'],
      ['Tc', 'Th', 'Ts'],
    ]);
    expect(round.bets).toEqual([1, 1, 1, 1]);
  });

  it('swaps draw their replacements in seat order: who acts first gets the first cards', () => {
    const round = createTableRound(1, players(4), 1, [], config, new Rng(1), order);
    // Seats 0 and 2 each swap one card; seat 2 acts before seat 0 (order 1 2 3 0), so it gets the 8h.
    resolveTableStreet(round, [{ type: 'draw', cardIds: ['9h'] }, stand, { type: 'draw', cardIds: ['Jh'] }, stand], config);
    expect(round.seats[2].hand.map((c) => c.id)).toContain('8h');
    expect(round.seats[0].hand.map((c) => c.id)).toContain('8s');
    expect(round.community.at(-1)!.id).toBe('7c'); // then the Turn
    // The fee to see the Turn, plus a swap.
    expect(round.bets[2]).toBe(1 + tableFee(config, 1, 1) + 1);
  });

  it('folded seats stay out of the hand; the last one in takes the pot', () => {
    const round = createTableRound(3, players(4), 0, [], config, new Rng(1), order);
    resolveTableStreet(round, [{ type: 'fold' }, stand, { type: 'fold' }, stand], config);
    expect(round.seats.map((s) => s.folded)).toEqual([true, false, true, false]);
    expect(round.result).toBeNull();
    resolveTableStreet(round, [null, { type: 'fold' }, null, stand], config);
    const res = round.result!;
    expect(res.byFolds).toBe(true);
    expect(res.winners).toEqual([3]);
    expect(res.share[3]).toBe(res.pot);
  });

  it('at the showdown the best hand takes the pot, and the snags go to the weakest hand still in', () => {
    // Three of a kind in every hand (queens, jacks, tens, nines); a board that never pairs (7c, then 6d).
    const unpaired = [...order.slice(0, 15), '7c', '6d'];
    const round = createTableRound(1, players(4, [0, 1, 0, 1]), 1, [], config, new Rng(1), unpaired);
    resolveTableStreet(round, [stand, stand, stand, stand], config);
    resolveTableStreet(round, [stand, stand, stand, stand], config);
    // The River: the queens play a snag with their trips; the tens play theirs too; the nines are weakest.
    resolveTableStreet(
      round,
      [
        { type: 'compose', cardIds: ['9h', '9s', '9c'], jokers: 0 },
        { type: 'compose', cardIds: ['Qh', 'Qs', 'Qc'], jokers: 1 },
        { type: 'compose', cardIds: ['Jh', 'Js', 'Jc'], jokers: 0 },
        { type: 'compose', cardIds: ['Th', 'Ts', 'Tc'], jokers: 1 },
      ],
      config,
    );
    const res = round.result!;
    expect(res.winners).toEqual([1]);
    expect(res.weakest).toBe(0);
    expect(res.dumped.map((j) => j.id)).toEqual([jokerCard(3).id]); // the winner's snag
    expect(round.seats[0].jokers.map((j) => j.id)).toEqual([jokerCard(3).id]);
    expect(round.seats[3].jokers).toHaveLength(1); // a loser keeps its own…
    expect(res.forfeit[3]).toBe(config.jokerForfeit); // …and pays for it
    expect(res.share[1]).toBe(res.pot + config.jokerForfeit);
  });
});

describe('the River raise', () => {
  const unpaired = [...order.slice(0, 15), '7c', '6d'];
  const trips = (seat: number, raise = false) => {
    const ranks = ['9', 'Q', 'J', 'T'][seat];
    return { type: 'compose' as const, cardIds: [`${ranks}h`, `${ranks}s`, `${ranks}c`], jokers: 0, raise };
  };
  /** To the River, everyone standing pat. */
  const toRiver = (stakes = 1) => {
    const round = createTableRound(1, players(4), 1, [], config, new Rng(1), unpaired, { raising: true, stakes });
    resolveTableStreet(round, [stand, stand, stand, stand], config);
    resolveTableStreet(round, [stand, stand, stand, stand], config);
    return round;
  };

  it('a raise is answered before the showdown: the rest match it or fold', () => {
    const round = toRiver();
    const before = [...round.bets];
    resolveTableStreet(round, [trips(0), trips(1, true), trips(2), trips(3)], config);
    expect(round.result).toBeNull();
    expect(round.street).toBe(3);
    expect(round.bets[1]).toBe(before[1] + round.raise);
    expect([0, 1, 2, 3].map((i) => tableAnswering(round, i))).toEqual([true, false, true, true]);
    resolveTableStreet(round, [{ type: 'match' }, null, { type: 'fold' }, { type: 'match' }], config);
    const res = round.result!;
    expect(round.seats[2].folded).toBe(true);
    expect(round.bets[0]).toBe(before[0] + round.raise);
    expect(round.bets[2]).toBe(before[2]);
    expect(res.winners).toEqual([1]); // the queens
    expect(res.pot).toBe(before.reduce((a, b) => a + b, 0) + 3 * round.raise);
  });

  it('raises made at the same moment do not stack: each raiser is in once, and the rest owe one raise', () => {
    const round = toRiver();
    const before = [...round.bets];
    resolveTableStreet(round, [trips(0, true), trips(1, true), trips(2), trips(3)], config);
    expect([0, 1, 2, 3].map((i) => tableAnswering(round, i))).toEqual([false, false, true, true]);
    resolveTableStreet(round, [null, null, { type: 'match' }, { type: 'match' }], config);
    expect(round.bets.map((b, i) => b - before[i])).toEqual([round.raise, round.raise, round.raise, round.raise]);
  });

  it('when everyone else folds to a raise, the raiser takes the pot unseen', () => {
    const round = toRiver();
    resolveTableStreet(round, [trips(0, true), trips(1), trips(2), trips(3)], config);
    resolveTableStreet(round, [null, { type: 'fold' }, { type: 'fold' }, { type: 'fold' }], config);
    expect(round.result!.byFolds).toBe(true);
    expect(round.result!.winners).toEqual([0]); // the nines, never shown
  });

  it('with no raise, the River goes straight to the showdown', () => {
    const round = toRiver();
    resolveTableStreet(round, [trips(0), trips(1), trips(2), trips(3)], config);
    expect(round.result!.winners).toEqual([1]);
  });

  it('the stakes multiply the ante, the fees and the raise, not the snags\' upkeep', () => {
    const plain = createTableRound(30, players(4, [1]), 0, [], config, new Rng(1), undefined, { raising: true });
    const doubled = createTableRound(30, players(4, [1]), 0, [], config, new Rng(1), undefined, { raising: true, stakes: 2 });
    const ante = baseAnte(config, 30);
    expect(doubled.bets[1] - plain.bets[1]).toBe(ante); // no snags: twice the ante
    expect(doubled.bets[0] - plain.bets[0]).toBe(ante); // a snag's upkeep isn't doubled
    expect(doubled.raise).toBe(2 * plain.raise);
    expect(tableFee(config, 30, 2, 2)).toBe(2 * tableFee(config, 30, 2));
  });
});

describe('High Rollers', () => {
  /** Plays a table through, you as a careful captain (who never raises, and matches a raise). */
  const playThrough = (seed: number) => {
    let g = newHighRollers(seed);
    const rng = new Rng(seed * 7);
    const total = g.players.reduce((a, p) => a + p.money, 0);
    let firstOut = -1;
    let hands = 0;
    for (let guard = 0; g.phase !== 'over' && guard < 600; guard++) {
      if (g.phase === 'handEnd') {
        g = nextHighRollersHand(g);
        continue;
      }
      const round = g.round!;
      const seat = mySeat(g);
      const out = seat < 0 || round.seats[seat].folded || (round.street === 3 && !tableAnswering(round, seat));
      const mine = out ? null : round.street === 3 ? ({ type: 'match' } as const) : chooseAction('careful', tableView(round, seat), g.config, rng);
      g = playHighRollers(g, mine);
      if (g.round!.result) {
        hands++;
        if (firstOut < 0 && g.players.some((p) => p.out)) firstOut = hands;
      }
    }
    return { g, total, firstOut, hands };
  };

  it('plays until the first captain is broke, then The Last Hand, and no money is made or lost along the way', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { g, total, firstOut, hands } = playThrough(seed);
      expect(g.phase).toBe('over');
      expect(g.lastHand).toBe(true);
      // The Last Hand is the one after the first knockout (unless that left one captain alone).
      if (g.players.filter((p) => !p.out).length > 0 && firstOut < hands) expect(hands).toBe(firstOut + 1);
      expect(g.players.reduce((a, p) => a + p.money, 0)).toBe(total);
      expect(placings(g)).toHaveLength(4);
    }
  });

  it('places those standing by purse, then the broke, latest out first; your score is what you walk away with', () => {
    const { g } = playThrough(3);
    const order = placings(g);
    const standing = order.filter((p) => !p.out);
    expect(standing.map((p) => p.money)).toEqual([...standing.map((p) => p.money)].sort((a, b) => b - a));
    expect(order.slice(standing.length).every((p) => p.out)).toBe(true);
    const res = highRollersResult(g);
    const you = g.players.find((p) => p.ai === null)!;
    expect(res.placings[res.place].id).toBe(you.id);
    expect(res.score).toBe(you.out ? 0 : you.money);
  });

  it('The Last Hand plays for double stakes', () => {
    let { g } = { g: newHighRollers(2) };
    g.lastHand = true;
    g.phase = 'handEnd';
    g = nextHighRollersHand(g);
    expect(g.round!.stakes).toBe(2);
    expect(g.round!.raise).toBe(2 * baseAnte(g.config, g.hand));
  });
});
