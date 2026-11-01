import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, PRESETS, type RulesConfig } from './config';
import { HUMAN_ID, ROSTER, drawLineUp } from './characters';
import { FINALE_STAKE, activeOpponents, finaleSetup, finishFinale, newGame, nextMonth, player, submitAction, type GameState } from './game';
import { chooseAction, viewFor } from './ai';
import { newHighRollers } from './highrollers';
import { legalActions } from './round';
import { Rng } from './rng';

function jokerCount(s: GameState) {
  const owned = s.players.reduce((n, p) => n + p.jokers.length, 0);
  return owned + s.pool.length;
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
    submitAction(s, legalActions(s.round!, 0)[0]);
    expect(s).toEqual(snapshot);
  });

  for (const [presetName, config] of Object.entries(PRESETS)) {
    it(`plays complete games (${presetName}) and conserves Jokers`, () => {
      for (let seed = 1; seed <= 3; seed++) {
        const end = playOut(seed, config);
        expect(['gameOver', 'victory']).toContain(end.phase);
        if (end.phase === 'gameOver') expect(player(end, HUMAN_ID).money).toBeLessThanOrEqual(0);
        else expect(activeOpponents(end).length).toBe(0);
      }
    });
  }

  it('Morag comes down to the river once Finlay is busted', () => {
    const def = (id: string) => ROSTER.find((c) => c.id === id)!;
    const lineUp = [
      { def: def('finlay'), joins: 'start' },
      { def: def('nemo'), joins: 'start' },
      { def: def('lenny'), joins: 'start' },
      { def: def('morag'), joins: 'finlay' },
    ];
    let s = newGame(21, DEFAULT_CONFIG, lineUp);
    expect(player(s, 'morag').status).toBe('waiting');
    const finlay = s.players.find((p) => p.id === 'finlay')!;
    finlay.status = 'eliminated';
    finlay.money = 0;
    const rng = new Rng(4);
    while (s.phase === 'duel') s = submitAction(s, rng.pick(legalActions(s.round!, 0)));
    expect(player(s, 'morag').status).toBe('active');
    expect(s.report!.joined).toContain('morag');
  });

  it('draws a mixed line-up: rascals, middling captains, a sharp, and one sharp arriving later', () => {
    for (let seed = 0; seed < 20; seed++) {
      const lineUp = drawLineUp(ROSTER, (n) => new Rng(seed * 7 + n).int(n));
      const starters = lineUp.filter((e) => e.joins === 'start');
      expect(starters.filter((e) => e.def.tier === 'rascal')).toHaveLength(3);
      expect(starters.filter((e) => e.def.tier === 'middle')).toHaveLength(3);
      expect(starters.filter((e) => e.def.tier === 'sharp')).toHaveLength(1);
      expect(lineUp.filter((e) => e.joins === '*')).toHaveLength(1);
      expect(lineUp.some((e) => e.def.id === 'morag')).toBe(lineUp.some((e) => e.def.id === 'finlay'));
      expect(new Set(lineUp.map((e) => e.def.id)).size).toBe(lineUp.length);
    }
  });

  it('with an odd number of captains, a random rival sits the round out and pays snag upkeep', () => {
    const def = (id: string) => ROSTER.find((c) => c.id === id)!;
    const lineUp = ['konrad', 'nemo', 'lenny', 'walrus'].map((id) => ({ def: def(id), joins: 'start' }));
    let s = newGame(31, DEFAULT_CONFIG, lineUp);
    // Five captains (you + 4): odd, so a rival (never you) sits out.
    const sitter = s.sitterId!;
    expect(activeOpponents(s).map((p) => p.id)).toContain(sitter);
    expect(s.opponentId).not.toBe(sitter);
    // Give the sitter two snags from the pool: they pay upkeep for them, and no ante.
    const p = player(s, sitter);
    p.jokers.push(...s.pool.splice(0, 2));
    const before = p.money;
    const rng = new Rng(9);
    while (s.phase === 'duel') s = submitAction(s, rng.pick(legalActions(s.round!, 0)));
    expect(s.report!.sittingOut).toBe(sitter);
    expect(player(s, sitter).money).toBe(before - 2 * DEFAULT_CONFIG.drainPerJoker);
    expect(s.report!.money[sitter].drained).toBe(2 * DEFAULT_CONFIG.drainPerJoker);
    // Next round someone else sits out.
    s = nextMonth(s);
    expect(s.sitterId).not.toBe(sitter);
  });

});

describe('the League finale', () => {
  /** A League down to its last four: you and three rivals, played through the first crossing. */
  const toMonthEnd = () => {
    let s = newGame(11, PRESETS.draw, ['gaylord', 'eliza', 'finlay'].map((id) => ({ def: ROSTER.find((c) => c.id === id)!, joins: 'start' as const })));
    const rng = new Rng(2);
    while (s.phase === 'duel') s = submitAction(s, chooseAction('careful', viewFor(s.round!, 0, s.config), s.config, rng));
    return s;
  };

  it('with four captains left, the month ends and then the League goes to the final table', () => {
    const s = toMonthEnd();
    expect(s.phase).toBe('monthEnd'); // (seeded: you survive the first crossing)
    expect(s.finaleNext).toBe(true);
    const f = nextMonth(s);
    expect(f.phase).toBe('finale');
    expect(f.round).toBeNull();
  });

  it('the final table seats the four with their purses plus the stake, their very snags, and the hand to come', () => {
    const s = toMonthEnd();
    const f = nextMonth(s);
    const setup = finaleSetup(f);
    const you = player(f, HUMAN_ID);
    expect(setup.rivals).toHaveLength(3);
    expect((setup.money as number[])[0]).toBe(you.money + FINALE_STAKE);
    expect(setup.jokers![0].map((j) => j.id)).toEqual(you.jokers.map((j) => j.id));
    expect(setup.startHand).toBe(f.month + 1);
    const table = newHighRollers(setup.seed, setup);
    expect(table.players.map((p) => p.id)).toEqual([HUMAN_ID, ...setup.rivals!]);
    expect(table.players[0].jokers.map((j) => j.id)).toEqual(you.jokers.map((j) => j.id));
  });

  it('after the final table the voyage is finished, with your place and score', () => {
    const s = toMonthEnd();
    const done = finishFinale(nextMonth(s), { placings: [], place: 1, score: 212 });
    expect(done.phase).toBe('finished');
    expect(done.finale).toEqual({ place: 1, score: 212 });
  });

  it('a story never goes to a final table', () => {
    let s = newGame(11, PRESETS.draw, ['gaylord', 'eliza', 'finlay'].map((id) => ({ def: ROSTER.find((c) => c.id === id)!, joins: 'start' as const })), { story: 'test' });
    const rng = new Rng(2);
    while (s.phase === 'duel') s = submitAction(s, chooseAction('careful', viewFor(s.round!, 0, s.config), s.config, rng));
    expect(s.finaleNext).toBeFalsy();
  });
});
