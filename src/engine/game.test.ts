import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { HUMAN_ID } from './characters';
import { activeOpponents, newGame, nextMonth, player, submitAction, type GameState } from './game';
import { legalActions } from './round';
import { Rng } from './rng';

function jokerCount(s: GameState) {
  const owned = s.players.reduce((n, p) => n + p.jokers.length, 0);
  return owned + s.pool.length + (s.round && !s.round.result && s.round.communityJoker ? 1 : 0);
}

/** Plays the Captain with random legal moves until the game ends. */
function playOut(seed: number, config: RulesConfig = DEFAULT_CONFIG) {
  let s = newGame(seed, config);
  const rng = new Rng(seed ^ 0xabc);
  while (s.phase === 'duel' || s.phase === 'monthEnd') {
    if (s.phase === 'monthEnd') {
      expect(jokerCount(s)).toBe(config.totalJokers);
      s = nextMonth(s);
    } else {
      s = submitAction(s, rng.pick(legalActions(s.round!, 0)));
    }
  }
  return s;
}

describe('game', () => {
  it('is deterministic for a seed', () => {
    const a = newGame(42);
    const b = newGame(42);
    expect(a).toEqual(b);
  });

  it('does not mutate the previous state', () => {
    const s = newGame(1);
    const snapshot = structuredClone(s);
    submitAction(s, { type: 'pass' });
    expect(s).toEqual(snapshot);
  });

  it('never has a community Joker in month 1', () => {
    for (let seed = 0; seed < 50; seed++) expect(newGame(seed).round!.communityJoker).toBeNull();
  });

  for (const dealMode of ['drip', 'draft', 'holdem'] as const) {
    for (const jokerMode of ['slot', 'shuffled'] as const) {
      it(`plays complete games (${dealMode}/${jokerMode}) and conserves Jokers`, () => {
        const config = { ...DEFAULT_CONFIG, dealMode, jokerMode };
        for (let seed = 1; seed <= 3; seed++) {
          const end = playOut(seed, config);
          expect(['gameOver', 'victory']).toContain(end.phase);
          if (end.phase === 'gameOver') expect(player(end, HUMAN_ID).popularity).toBe(0);
          else expect(end.month === config.months || activeOpponents(end).length === 0).toBe(true);
        }
      });
    }
  }
});
