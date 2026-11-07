/**
 * A table of people and AIs, ready to be played over anything: one device
 * passed round (pass-and-play), or later a server holding the session while
 * each person moves from their own. Every seat moves at once, in secret: a
 * person's move is collected (`submit`), and when the last one owed is in,
 * the AIs choose theirs and the street resolves. Hand after hand, until one
 * captain is left with money. Plain, serializable data, and every function
 * pure (it clones what it's given), so whoever holds the session can store
 * it, send it, or show each person only their own seat.
 *
 * The story seats three kinds of seat beside the usual (all generic: what a
 * snag or a crew member is comes from snags.ts and boat.ts):
 * - **an obstacle** (the Sandbar): its purse is the obstacle. Against it,
 *   nobody else takes more from a pot than they put in: win, and you get your
 *   own back while its share drifts away; lose, and it gains what you lost.
 *   A `steady` obstacle gains nothing: what you lose goes down the river.
 * - **cover**: the hands in which a seat's losses are given back (the
 *   volunteers among its snags).
 * - **fixes**: snags a seat absorbs when they come to it (a crew member who
 *   fixes them): taken, and gone.
 * - **unhands**: at a friendly table, the snags this seat plays leave it win
 *   or lose: someone else at the table takes them.
 */
import { chooseAction, viewFor } from './ai';
import { isJoker, jokerCard, type JokerCard } from './cards';
import type { AiId } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { Rng } from './rng';
import { createRound, isLegal, movers, resolveStreet, rideOn, type Action, type RoundState } from './round';

export interface SessionSeat {
  /** A captain's id (a person may play any captain). */
  id: string;
  /** null for a person; otherwise the AI that plays the seat. */
  ai: AiId | null;
  money: number;
  jokers: JokerCard[];
  /** Out of money: off the table. */
  out: boolean;
  /** An obstacle, not a player: see above. */
  obstacle?: boolean;
  steady?: boolean;
  /** Hands (1, 2, 3…) in which this seat's losses are given back. */
  cover?: number[];
  /** Snag indices this seat fixes: absorbed when they come to it. */
  fixes?: number[];
  /** The snags it plays go, win or lose: see above. */
  unhands?: boolean;
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
  /** What the last hand's end did beyond the pot: losses given back (seats at its table), snags absorbed. */
  settled?: { covered: number[]; absorbed: { seat: number; snag: number }[] };
}

const clone = <T>(x: T): T => structuredClone(x);

export interface SessionPlayer {
  id: string;
  ai?: AiId | null;
  money?: number;
  /** Snags they sit down with. */
  jokers?: JokerCard[];
  obstacle?: boolean;
  steady?: boolean;
  cover?: number[];
  fixes?: number[];
  unhands?: boolean;
}

/** A new table: the players in their seats, everyone with the same purse unless given one, and the first hand dealt. */
export function newSession(seed: number, players: SessionPlayer[], config: RulesConfig = DEFAULT_CONFIG, startHand = 1): TableSession {
  if (players.length < 2) throw new Error('A table needs two at least');
  const rng = new Rng(seed >>> 0);
  const session: TableSession = {
    config: clone(config),
    rngState: rng.state,
    hand: startHand,
    seats: players.map((p) => ({
      id: p.id,
      ai: p.ai ?? null,
      money: p.money ?? config.startMoney,
      jokers: p.jokers?.slice() ?? [],
      out: false,
      ...(p.obstacle ? { obstacle: true } : {}),
      ...(p.steady ? { steady: true } : {}),
      ...(p.cover ? { cover: p.cover } : {}),
      ...(p.fixes ? { fixes: p.fixes } : {}),
      ...(p.unhands ? { unhands: true } : {}),
    })),
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
  if (action.type === 'ride') {
    const session = clone(prev);
    rideOn(session.round!, session.config);
    return session;
  }
  if (!waitingFor(prev).includes(seat)) throw new Error(`Seat ${seat} has no move owed`);
  if (!isLegal(prev.round!, seat, action)) throw new Error(`Illegal move for seat ${seat}: ${JSON.stringify(action)}`);
  const session = clone(prev);
  session.pending[seat] = action;
  if (waitingFor(session).length) return session;
  return resolve(session);
}

/** Nobody's move is owed (no person in the hand: they folded, or are out of money): the AIs play the street. */
export function playOn(prev: TableSession): TableSession {
  if (prev.phase !== 'hand' || waitingFor(prev).length) throw new Error('Not the AIs\' street to play');
  const session = clone(prev);
  if (session.round?.result?.rides) {
    rideOn(session.round, session.config);
    return session;
  }
  return resolve(session);
}

/** The street resolves: the people's moves as collected, the AIs' chosen now. */
function resolve(session: TableSession): TableSession {
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
  if (round.result && !round.result.rides) settle(session);
  session.rngState = rng.state;
  return session;
}

function settle(session: TableSession) {
  const round = session.round!;
  const res = round.result!;
  const at = (k: number) => session.seats[session.seated[k]];
  const covered: number[] = [];
  const absorbed: { seat: number; snag: number }[] = [];
  const obstacle = round.seats.findIndex((_, k) => at(k).obstacle);
  if (obstacle >= 0) {
    // Against an obstacle nobody comes out ahead: a pot won gives back only what you put in.
    round.seats.forEach((_, k) => {
      if (k === obstacle) return;
      res.share[k] = Math.min(res.share[k], round.bets[k] + res.forfeit[k]);
      // A loss in a covered hand is given back, and the obstacle gains nothing by it.
      const lost = round.bets[k] + res.forfeit[k] - res.share[k];
      if (lost > 0 && at(k).cover?.includes(session.hand)) {
        res.share[k] += lost;
        res.share[obstacle] = Math.max(0, res.share[obstacle] - lost);
        covered.push(k);
      }
    });
    if (at(obstacle).steady) res.share[obstacle] = Math.min(res.share[obstacle], round.bets[obstacle]);
  }
  round.seats.forEach((seat, k) => {
    const p = at(k);
    p.money += res.share[k] - round.bets[k] - res.forfeit[k];
    const fixes = p.fixes ?? [];
    for (const j of seat.jokers) if (fixes.includes(j.index)) absorbed.push({ seat: k, snag: j.index });
    p.jokers = seat.jokers.filter((j) => !fixes.includes(j.index));
    if (p.unhands) {
      // Whatever it played and still has, whoever's turn it is takes.
      const played = seat.played.filter(isJoker).map((j) => j.id);
      const others = round.seats.map((_, s) => s).filter((s) => s !== k);
      for (const j of p.jokers.filter((x) => played.includes(x.id))) absorbed.push({ seat: others[session.hand % others.length], snag: j.index });
      p.jokers = p.jokers.filter((x) => !played.includes(x.id));
    }
  });
  session.settled = { covered, absorbed };
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
