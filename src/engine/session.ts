/**
 * A table of people and AIs, ready to be played over anything: one device
 * passed round (pass-and-play), or later a server holding the session while
 * each person moves from their own. Every seat moves at once, in secret: a
 * person's move is collected (`submit`), and when the last one owed is in,
 * the AIs choose theirs and the street resolves. Hand after hand, until one
 * captain is left with money. Plain, serializable data, and every function
 * pure (it clones what it's given), so whoever holds the session can store
 * it, send it, or show each person only their own seat.
 */
import { chooseAction, viewFor } from './ai';
import { jokerCard, type JokerCard } from './cards';
import type { AiId } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { Rng } from './rng';
import { createRound, isLegal, movers, resolveStreet, type Action, type RoundState } from './round';

export interface SessionSeat {
  /** A captain's id (a person may play any captain). */
  id: string;
  /** null for a person; otherwise the AI that plays the seat. */
  ai: AiId | null;
  money: number;
  jokers: JokerCard[];
  /** Out of money: off the table. */
  out: boolean;
}

export interface TableSession {
  config: RulesConfig;
  rngState: number;
  /** The hand being played (it sets the ante). */
  hand: number;
  seats: SessionSeat[];
  /** Who acts first: it moves on each hand, like a dealer's button. */
  button: number;
  pool: JokerCard[];
  /** Seats at this hand's table, in order (indices into `seats`): those still in money. */
  seated: number[];
  round: RoundState | null;
  /** This street's moves collected so far, by seat at this hand's table (people's; the AIs move as it resolves). */
  pending: (Action | null)[];
  /** 'hand' while it's played, 'handEnd' when it's done, 'over' when one captain is left with money. */
  phase: 'hand' | 'handEnd' | 'over';
}

const clone = <T>(x: T): T => structuredClone(x);

export interface SessionPlayer {
  id: string;
  ai?: AiId | null;
  money?: number;
}

/** A new table: the players in their seats, everyone with the same purse unless given one, and the first hand dealt. */
export function newSession(seed: number, players: SessionPlayer[], config: RulesConfig = DEFAULT_CONFIG, startHand = 1): TableSession {
  if (players.length < 2) throw new Error('A table needs two at least');
  const rng = new Rng(seed >>> 0);
  const session: TableSession = {
    config: clone(config),
    rngState: rng.state,
    hand: startHand,
    seats: players.map((p) => ({ id: p.id, ai: p.ai ?? null, money: p.money ?? config.startMoney, jokers: [], out: false })),
    button: rng.int(players.length),
    pool: Array.from({ length: config.totalJokers }, (_, i) => jokerCard(i)),
    seated: [],
    round: null,
    pending: [],
    phase: 'hand',
  };
  return deal(session);
}

function deal(session: TableSession): TableSession {
  const rng = new Rng(session.rngState);
  session.seated = session.seats.map((_, i) => i).filter((i) => !session.seats[i].out);
  session.button %= session.seated.length;
  session.round = createRound(
    session.hand,
    session.seated.map((i) => session.seats[i]),
    session.pool,
    session.config,
    rng,
    { first: session.button },
  );
  session.pending = session.seated.map(() => null);
  session.phase = 'hand';
  session.rngState = rng.state;
  return session;
}

/** A person's seat at this hand's table (-1: out of money, or not at the table). */
export function seatOf(session: TableSession, index: number): number {
  return session.seated.indexOf(index);
}

/** The people (by seat at this hand's table) whose move this street is still owed. */
export function waitingFor(session: TableSession): number[] {
  if (session.phase !== 'hand' || !session.round || session.round.result) return [];
  return movers(session.round).filter((s) => session.seats[session.seated[s]].ai === null && !session.pending[s]);
}

/**
 * A person's move for this street (by seat at this hand's table). Kept until
 * the last person owed has moved; then the AIs move, and the street resolves
 * (and the hand, if it's over: money settled, the broke off the table).
 */
export function submit(prev: TableSession, seat: number, action: Action): TableSession {
  if (!waitingFor(prev).includes(seat)) throw new Error(`Seat ${seat} has no move owed`);
  if (!isLegal(prev.round!, seat, action)) throw new Error(`Illegal move for seat ${seat}: ${JSON.stringify(action)}`);
  const session = clone(prev);
  session.pending[seat] = action;
  if (waitingFor(session).length) return session;
  const rng = new Rng(session.rngState);
  const round = session.round!;
  const moving = movers(round);
  const actions = round.seats.map((_, s): Action | null => {
    if (!moving.includes(s)) return null;
    const ai = session.seats[session.seated[s]].ai;
    return ai === null ? session.pending[s] : chooseAction(ai, viewFor(round, s, session.config), session.config, rng);
  });
  resolveStreet(round, actions, session.config);
  session.pending = session.seated.map(() => null);
  if (round.result) settle(session);
  session.rngState = rng.state;
  return session;
}

function settle(session: TableSession) {
  const round = session.round!;
  const res = round.result!;
  round.seats.forEach((seat, k) => {
    const p = session.seats[session.seated[k]];
    p.money += res.share[k] - round.bets[k] - res.forfeit[k];
    p.jokers = seat.jokers;
  });
  session.pool.push(...res.returnedToPool);
  for (const p of session.seats) if (!p.out && p.money <= 0) p.out = true;
  session.phase = session.seats.filter((p) => !p.out).length <= 1 ? 'over' : 'handEnd';
}

/** The next hand: the ante goes up, and the button moves on. */
export function nextSessionHand(prev: TableSession): TableSession {
  if (prev.phase !== 'handEnd') throw new Error('The hand is not over');
  const session = clone(prev);
  session.hand++;
  session.button++;
  return deal(session);
}
