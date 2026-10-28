import { describe, expect, it } from 'vitest';
import { jokerCard } from './cards';
import { chooseAction } from './ai';
import { DEFAULT_CONFIG } from './config';
import { Rng } from './rng';
import { createTableRound, resolveTableStreet, tableFee, type TableRound } from './table';
import { mySeat, newHighRollers, nextHighRollersHand, placings, playHighRollers, tableView } from './highrollers';
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

describe('High Rollers', () => {
  it('plays hands until two captains are left, and no money is made or lost along the way', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      let g = newHighRollers(seed);
      const total = g.players.reduce((a, p) => a + p.money, 0);
      const rng = new Rng(seed * 7);
      for (let guard = 0; g.phase !== 'over' && guard < 400; guard++) {
        if (g.phase === 'handEnd') {
          g = nextHighRollersHand(g);
          continue;
        }
        const seat = mySeat(g);
        const mine = seat < 0 || g.round!.seats[seat].folded ? null : chooseAction('careful', tableView(g.round!, seat), g.config, rng);
        g = playHighRollers(g, mine);
      }
      expect(g.phase).toBe('over');
      expect(g.players.filter((p) => !p.out).length).toBeLessThanOrEqual(2);
      expect(g.players.reduce((a, p) => a + p.money, 0)).toBe(total);
      expect(placings(g)).toHaveLength(4);
    }
  });
});
