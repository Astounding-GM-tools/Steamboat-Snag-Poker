import { describe, expect, it } from 'vitest';
import { legalActions } from './round';
import { Rng } from './rng';
import { newSession, nextSessionHand, submit, waitingFor, type TableSession } from './session';

const players = [
  { id: 'captain' },
  { id: 'kitty' },
  { id: 'walrus', ai: 'shark' as const },
];

/** Every person owed a move makes a random legal one, until the hand is over. */
function playHand(s: TableSession, rng: Rng): TableSession {
  while (s.phase === 'hand') {
    const owed = waitingFor(s);
    if (!owed.length) throw new Error('Nobody to move, and the hand not over');
    s = submit(s, owed[0], rng.pick(legalActions(s.round!, owed[0])));
  }
  return s;
}

describe('a table session of people and AIs', () => {
  it('collects every person\'s move before the street resolves; the AIs move as it does', () => {
    let s = newSession(5, players);
    expect(waitingFor(s).sort()).toEqual([0, 1].map((i) => s.seated.indexOf(i)).sort());
    const first = waitingFor(s)[0];
    s = submit(s, first, { type: 'draw', cardIds: [] });
    // Still waiting for the other person: nothing has resolved.
    expect(s.round!.history).toHaveLength(0);
    expect(waitingFor(s)).toHaveLength(1);
    s = submit(s, waitingFor(s)[0], { type: 'draw', cardIds: [] });
    expect(s.round!.history).toHaveLength(1);
    // Every seat moved, the AI's included.
    expect(s.round!.history[0].actions.every((a) => a !== null)).toBe(true);
  });

  it('refuses a move from a seat that owes none, or an illegal one', () => {
    const s = newSession(5, players);
    const ai = s.seated.indexOf(2);
    expect(() => submit(s, ai, { type: 'draw', cardIds: [] })).toThrow();
    expect(() => submit(s, waitingFor(s)[0], { type: 'compose', cardIds: [], jokers: 0 })).toThrow();
  });

  it('plays hand after hand, no money made or lost, until one captain is left with money', () => {
    let s = newSession(9, players, undefined, 20);
    const rng = new Rng(4);
    const total = s.seats.reduce((a, p) => a + p.money, 0);
    for (let guard = 0; s.phase !== 'over' && guard < 200; guard++) {
      s = playHand(s, rng);
      expect(s.seats.reduce((a, p) => a + p.money, 0)).toBe(total);
      if (s.phase === 'handEnd') s = nextSessionHand(s);
    }
    expect(s.phase).toBe('over');
    expect(s.seats.filter((p) => !p.out)).toHaveLength(1);
  });

  it('is plain data: a session survives a trip through JSON', () => {
    const s = newSession(5, players);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
