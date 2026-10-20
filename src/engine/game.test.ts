import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, PRESETS, type RulesConfig } from './config';
import { HUMAN_ID } from './characters';
import { LOG_SIZE, activeOpponents, migrateGame, newGame, nextMonth, player, submitAction, type GameState } from './game';
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
    submitAction(s, legalActions(s.round!, 0)[0]);
    expect(s).toEqual(snapshot);
  });

  it('never has a community Joker in month 1', () => {
    for (let seed = 0; seed < 50; seed++) expect(newGame(seed).round!.communityJoker).toBeNull();
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

  it('only allows passing when nothing else is possible', () => {
    const s = newGame(5);
    expect(legalActions(s.round!, 0).some((a) => a.type === 'pass')).toBe(false);
  });

  it('migrates saves from before a rule setting existed', () => {
    const old = newGame(3);
    delete (old.config as Partial<RulesConfig>).loserPays;
    old.players[1].money = NaN;
    const fixed = migrateGame(old);
    expect(fixed.config.loserPays).toBe(DEFAULT_CONFIG.loserPays);
    expect(Number.isFinite(fixed.players[1].money)).toBe(true);
  });

  it('keeps a log of the Captain\'s recent showdowns', () => {
    let s = newGame(11);
    const rng = new Rng(2);
    for (let i = 0; i < 40 && (s.phase === 'duel' || s.phase === 'monthEnd'); i++) {
      s = s.phase === 'monthEnd' ? nextMonth(s) : submitAction(s, rng.pick(legalActions(s.round!, 0)));
    }
    expect(s.log.length).toBeGreaterThan(0);
    expect(s.log.length).toBeLessThanOrEqual(LOG_SIZE);
    const last = s.log[0];
    // A fold can end a crossing before the whole board is out.
    expect(last.board.length).toBeGreaterThanOrEqual(3);
    expect(last.hands).toHaveLength(2);
  });

  it('Maggie comes down to the river once Jiggs is busted', () => {
    let s = newGame(21);
    expect(player(s, 'maggie').status).toBe('waiting');
    const jiggs = s.players.find((p) => p.id === 'jiggs')!;
    jiggs.status = 'eliminated';
    jiggs.money = 0;
    const rng = new Rng(4);
    while (s.phase === 'duel') s = submitAction(s, rng.pick(legalActions(s.round!, 0)));
    expect(player(s, 'maggie').status).toBe('active');
    expect(s.report!.joined).toContain('maggie');
  });

  it('with an odd number of captains, the poorest rival sits the crossing out', () => {
    let s = newGame(31);
    // Nine captains start (you + 8): odd, so someone sits out.
    const poorest = [...activeOpponents(s)].sort((a, b) => a.money - b.money || a.id.localeCompare(b.id))[0];
    expect(s.sitterId).toBe(poorest.id);
    expect(s.opponentId).not.toBe(poorest.id);
    const rng = new Rng(9);
    while (s.phase === 'duel') s = submitAction(s, rng.pick(legalActions(s.round!, 0)));
    expect(s.report!.sittingOut).toBe(poorest.id);
    const played = s.report!.offscreen.flatMap((d) => d.players);
    expect(played).not.toContain(poorest.id);
  });
});
