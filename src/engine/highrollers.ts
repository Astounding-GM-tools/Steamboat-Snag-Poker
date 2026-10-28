/**
 * High Rollers: the League's final table. Four captains at one table, hands
 * until two are left standing; the bigger purse wins, the runner-up keeps
 * theirs too. Every function is pure: it clones the state it's given.
 */
import { chooseAction, type SeatView } from './ai';
import { isJoker, jokerCard, type JokerCard } from './cards';
import { HUMAN_ID, ROSTER, type AiId } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import type { Action } from './round';
import { Rng } from './rng';
import { createTableRound, inHand, resolveTableStreet, tableCanFold, tableComposing, type TableRound } from './table';

export interface HighRoller {
  id: string;
  /** null for you. */
  ai: AiId | null;
  money: number;
  jokers: JokerCard[];
  /** Out of money: off the table. */
  out: boolean;
  /** The hand they went out on (the order they left in), for the final placings. */
  outOn?: number;
}

export interface HighRollersState {
  config: RulesConfig;
  rngState: number;
  /** The hand being played (it sets the ante). */
  hand: number;
  players: HighRoller[];
  /** Who acts first: an index into the players still in, moving on each hand. */
  button: number;
  pool: JokerCard[];
  /** Players at this hand's table, in seat order (indices into `players`). */
  seated: number[];
  round: TableRound | null;
  /** 'hand' while it's played, 'handEnd' when it's done, 'over' when two are left. */
  phase: 'hand' | 'handEnd' | 'over';
}

const clone = <T>(x: T): T => structuredClone(x);

/** The table stops when this many are left. */
export const LAST_STANDING = 2;

export interface HighRollersSetup {
  /** The three rivals (ids from the roster); default: three sharps and middlings, drawn. */
  rivals?: string[];
  /** Everyone's purse at the start. */
  money?: number;
  /** The hand number the table starts at (sets the ante, as the crossing does in the League). */
  startHand?: number;
  /** Snags dealt out at the start, as if brought from the League: [yours, each rival's]. */
  snags?: [number, number];
}

/** A High Rollers table to try on its own (in the League it would start from the last four's purses). */
export function newHighRollers(seed: number, setup: HighRollersSetup = {}, config: RulesConfig = DEFAULT_CONFIG): HighRollersState {
  const rng = new Rng(seed >>> 0);
  const candidates = ROSTER.filter((c) => !c.follows && c.tier !== 'rascal');
  const rivals = setup.rivals ?? rng.shuffle(candidates).slice(0, 3).map((c) => c.id);
  const money = setup.money ?? 120;
  const pool = Array.from({ length: config.totalJokers }, (_, i) => jokerCard(i));
  const give = (n: number) => pool.splice(0, Math.min(n, pool.length));
  const [mine, theirs] = setup.snags ?? [1, 1];
  const players: HighRoller[] = [
    { id: HUMAN_ID, ai: null, money, jokers: give(mine), out: false },
    ...rivals.map((id) => ({ id, ai: ROSTER.find((c) => c.id === id)!.ai, money, jokers: give(theirs), out: false })),
  ];
  const state: HighRollersState = {
    config: clone(config),
    rngState: rng.state,
    hand: setup.startHand ?? 24,
    players,
    button: rng.int(players.length),
    pool,
    seated: [],
    round: null,
    phase: 'hand',
  };
  return deal(state);
}

/** Seats the players still in and deals the hand. */
function deal(state: HighRollersState): HighRollersState {
  const rng = new Rng(state.rngState);
  state.seated = state.players.map((_, i) => i).filter((i) => !state.players[i].out);
  state.button %= state.seated.length;
  state.round = createTableRound(
    state.hand,
    state.seated.map((i) => ({ id: state.players[i].id, jokers: state.players[i].jokers })),
    state.button,
    state.pool,
    state.config,
    rng,
  );
  state.phase = 'hand';
  state.rngState = rng.state;
  return state;
}

/** Your seat at this hand's table (always seated while you're in). */
export function mySeat(state: HighRollersState): number {
  return state.seated.findIndex((i) => state.players[i].id === HUMAN_ID);
}

/**
 * What an AI sees at a table: its own cards, the board, and the rest of the
 * table folded into one "opponent" (all their discards, the most snags any
 * of them holds), so the duel AIs can play here as they are.
 */
export function tableView(round: TableRound, seat: number): SeatView {
  const me = round.seats[seat];
  const others = inHand(round).filter((i) => i !== seat).map((i) => round.seats[i]);
  return {
    playStyle: 'draw',
    composing: tableComposing(round),
    street: round.street,
    hand: me.hand,
    jokers: me.jokers,
    slots: me.slots,
    community: round.community,
    communityJoker: null,
    opponentSlots: [],
    opponentHandSize: 3,
    opponentJokerCount: Math.max(0, ...others.map((s) => s.jokers.length)),
    discards: round.discards,
    opponentDiscarded: others.flatMap((s) => s.discarded),
    discardedCount: me.discarded.length,
    month: round.month,
    potMode: true,
    pot: round.bets.reduce((a, b) => a + b, 0),
    canFold: tableCanFold(round, seat),
    deckSnags: round.deck.filter(isJoker).length,
    deckSize: round.deck.length,
  };
}

/**
 * Your move for this street (null if you've folded or are out: the street is
 * played without you); the rivals answer, and it all resolves in seat order.
 */
export function playHighRollers(prev: HighRollersState, mine: Action | null): HighRollersState {
  if (prev.phase !== 'hand' || !prev.round) throw new Error('No hand in play');
  const state = clone(prev);
  const rng = new Rng(state.rngState);
  const round = state.round!;
  const me = mySeat(state);
  const actions = round.seats.map((s, seat): Action | null => {
    if (s.folded) return null;
    if (seat === me) return mine;
    const p = state.players[state.seated[seat]];
    return chooseAction(p.ai!, tableView(round, seat), state.config, rng);
  });
  resolveTableStreet(round, actions, state.config);
  if (round.result) settle(state);
  state.rngState = rng.state;
  return state;
}

function settle(state: HighRollersState) {
  const round = state.round!;
  const res = round.result!;
  round.seats.forEach((seat, k) => {
    const p = state.players[state.seated[k]];
    p.money += res.share[k] - round.bets[k] - res.forfeit[k];
    p.jokers = seat.jokers;
  });
  state.pool.push(...res.returnedToPool);
  for (const p of state.players) {
    // Out of money (a purse can go below nothing, as in the League: the debt isn't written off).
    if (!p.out && p.money <= 0) {
      p.out = true;
      p.outOn = state.hand;
    }
  }
  state.phase = state.players.filter((p) => !p.out).length <= LAST_STANDING ? 'over' : 'handEnd';
}

/** The next hand: the ante goes up, and the button moves on. */
export function nextHighRollersHand(prev: HighRollersState): HighRollersState {
  if (prev.phase !== 'handEnd') throw new Error('The hand is not over');
  const state = clone(prev);
  state.hand++;
  state.button++;
  return deal(state);
}

/**
 * The placings, best first: those still standing by purse (the winner, the
 * runner-up), then those who went out, the latest first.
 */
export function placings(state: HighRollersState): HighRoller[] {
  const standing = state.players.filter((p) => !p.out).sort((a, b) => b.money - a.money);
  const gone = state.players.filter((p) => p.out).sort((a, b) => (b.outOn ?? 0) - (a.outOn ?? 0));
  return [...standing, ...gone];
}
