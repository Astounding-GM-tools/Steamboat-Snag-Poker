/**
 * The whole game: the Captain, the league of opponents, the Joker pool and the
 * month-by-month flow. Every exported function is pure: it clones the state it
 * receives and returns a new one.
 */
import { chooseAction, viewFor } from './ai';
import { jokerCard, type Card, type JokerCard } from './cards';
import { HUMAN_ID, LEGACY_AI, ROSTER, type AiId, type CharacterDef } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { createRound, resolveStreet, type Action, type RoundResult, type RoundState } from './round';
import { Rng } from './rng';

export interface Player {
  id: string;
  /** null for the human Captain. */
  ai: AiId | null;
  money: number;
  jokers: JokerCard[];
  status: 'waiting' | 'active' | 'eliminated';
  /** For a waiting captain: joins once this captain is busted ('*' = anyone). */
  joinsAfter?: string;
}

export interface DuelSummary {
  players: [string, string];
  result: RoundResult;
}

export interface MonthReport {
  month: number;
  duel: DuelSummary;
  offscreen: DuelSummary[];
  /** Money before → after for every player who took part this month. */
  money: Record<string, { before: number; after: number; drained: number }>;
  eliminated: string[];
  joined: string[];
}

/** One of the Captain's showdowns, kept so a player can check what happened. */
export interface ShowdownRecord {
  month: number;
  opponentId: string;
  board: Card[];
  /** Cards each side played (Captain first), Jokers included. */
  played: [Card[], Card[]];
  /** Each side's final hand. */
  hands: RoundResult['hands'];
  winner: 0 | 1 | null;
  gain: number;
  dumped: JokerCard[];
  communityTaken: JokerCard[];
}

/** How many recent showdowns the hand log keeps. */
export const LOG_SIZE = 10;

export type Phase = 'duel' | 'monthEnd' | 'gameOver' | 'victory';

export interface GameState {
  config: RulesConfig;
  rngState: number;
  month: number;
  players: Player[];
  /** Unowned Jokers. */
  pool: JokerCard[];
  phase: Phase;
  opponentId: string | null;
  lastOpponentId: string | null;
  round: RoundState | null;
  report: MonthReport | null;
  /** The Captain's most recent showdowns, newest first. */
  log: ShowdownRecord[];
}

const clone = <T>(x: T): T => structuredClone(x);

/**
 * Brings a saved game up to date with the current rules format: rule settings
 * added since it was saved get their defaults, and any Money that is not
 * a number (from such a missing setting) is reset to that player's start.
 */
export function migrateGame(saved: GameState, roster: CharacterDef[] = ROSTER): GameState {
  const state = clone(saved);
  state.config = { ...DEFAULT_CONFIG, ...state.config, winGain: { ...DEFAULT_CONFIG.winGain, ...state.config.winGain } };
  state.log ??= [];
  if (state.report && !state.report.money) {
    state.report.money = (state.report as MonthReport & { popularity?: MonthReport['money'] }).popularity ?? {};
  }
  for (const p of state.players) {
    if (p.ai && LEGACY_AI[p.ai] && !ROSTER.some((c) => c.ai === p.ai)) p.ai = LEGACY_AI[p.ai];
    // Before the river tournament, money was called popularity.
    const legacy = (p as Player & { popularity?: number }).popularity;
    if (p.money === undefined && legacy !== undefined) p.money = legacy;
    if (!Number.isFinite(p.money)) {
      p.money = roster.find((c) => c.id === p.id)?.startMoney ?? state.config.startMoney;
    }
  }
  return state;
}

export function newGame(seed: number, config: RulesConfig = DEFAULT_CONFIG, roster: CharacterDef[] = ROSTER): GameState {
  const players: Player[] = [
    { id: HUMAN_ID, ai: null, money: config.startMoney, jokers: [], status: 'active' },
    ...roster.map((c): Player => ({
      id: c.id,
      ai: c.ai,
      money: c.startMoney,
      jokers: [],
      status: c.joins === 'start' ? 'active' : 'waiting',
      ...(c.joins === 'start' ? {} : { joinsAfter: c.joins === 'firstElimination' ? '*' : c.joins.after }),
    })),
  ];
  const state: GameState = {
    config: clone(config),
    rngState: seed >>> 0,
    month: 1,
    players,
    pool: Array.from({ length: config.totalJokers }, (_, i) => jokerCard(i)),
    phase: 'duel',
    opponentId: null,
    lastOpponentId: null,
    round: null,
    report: null,
    log: [],
  };
  return startMonthMut(state);
}

export function player(state: GameState, id: string): Player {
  const p = state.players.find((p) => p.id === id);
  if (!p) throw new Error(`No player ${id}`);
  return p;
}

export function activeOpponents(state: GameState): Player[] {
  return state.players.filter((p) => p.id !== HUMAN_ID && p.status === 'active');
}

/**
 * Matchmaking: random active opponent, avoiding a repeat when possible.
 * Kept in one place so weighted/"temperature" matchmaking can replace it.
 */
export function pickOpponent(state: GameState, rng: Rng): Player {
  const candidates = activeOpponents(state);
  const fresh = candidates.filter((p) => p.id !== state.lastOpponentId);
  return rng.pick(fresh.length ? fresh : candidates);
}

function startMonthMut(state: GameState): GameState {
  const rng = new Rng(state.rngState);
  const opponent = pickOpponent(state, rng);
  state.opponentId = opponent.id;
  const human = player(state, HUMAN_ID);
  state.round = createRound(state.month, [human, opponent], state.pool, state.config, rng);
  state.phase = 'duel';
  state.report = null;
  state.rngState = rng.state;
  return state;
}

/** The Captain's secret action for the current street; the opponent answers. */
export function submitAction(prev: GameState, action: Action): GameState {
  if (prev.phase !== 'duel' || !prev.round) throw new Error('Not in a duel');
  const state = clone(prev);
  const rng = new Rng(state.rngState);
  const round = state.round!;
  const opponent = player(state, state.opponentId!);
  const reply = chooseAction(opponent.ai!, viewFor(round, 1), state.config, rng);
  resolveStreet(round, [action, reply], state.config);
  if (round.result) finishMonth(state, rng);
  state.rngState = rng.state;
  return state;
}

/** Plays a full AI-vs-AI round. Mutates the pool. */
function simulateDuel(state: GameState, a: Player, b: Player, rng: Rng): RoundState {
  const round = createRound(state.month, [a, b], state.pool, state.config, rng);
  while (!round.result) {
    resolveStreet(
      round,
      [chooseAction(a.ai!, viewFor(round, 0), state.config, rng), chooseAction(b.ai!, viewFor(round, 1), state.config, rng)],
      state.config,
    );
  }
  return round;
}

function finishMonth(state: GameState, rng: Rng) {
  const cfg = state.config;
  const before: Record<string, number> = {};

  const settle = (round: RoundState): DuelSummary => {
    const res = round.result!;
    round.seats.forEach((seat, i) => {
      const p = player(state, seat.playerId);
      before[p.id] ??= p.money;
      p.jokers = seat.jokers;
      if (res.winner === i) p.money += res.gain;
      else if (res.winner !== null) p.money = Math.max(0, p.money - Math.round(res.gain * (cfg.loserPays ?? 0)));
    });
    state.pool.push(...res.returnedToPool);
    return { players: [round.seats[0].playerId, round.seats[1].playerId], result: res };
  };

  const duel = settle(state.round!);
  const finished = state.round!;
  const record: ShowdownRecord = {
    month: state.month,
    opponentId: state.opponentId!,
    board: finished.community.slice(),
    played: [
      finished.seats[0].slots.filter((c): c is Card => c !== null),
      finished.seats[1].slots.filter((c): c is Card => c !== null),
    ],
    hands: duel.result.hands,
    winner: duel.result.winner,
    gain: duel.result.gain,
    dumped: duel.result.dumped,
    communityTaken: duel.result.communityTaken,
  };
  state.log = [record, ...(state.log ?? [])].slice(0, LOG_SIZE);

  // Meanwhile, on the river: everyone else not in the Captain's duel pairs up.
  const others = rng.shuffle(activeOpponents(state).filter((p) => p.id !== state.opponentId));
  const offscreen: DuelSummary[] = [];
  for (let i = 0; i + 1 < others.length; i += 2) {
    offscreen.push(settle(simulateDuel(state, others[i], others[i + 1], rng)));
  }

  // Joker drain hits every player still on the river.
  const money: MonthReport['money'] = {};
  const eliminated: string[] = [];
  for (const p of state.players) {
    if (p.status !== 'active') continue;
    before[p.id] ??= p.money;
    const drained = p.jokers.length * cfg.drainPerJoker;
    p.money = Math.max(0, p.money - drained);
    money[p.id] = { before: before[p.id], after: p.money, drained };
    if (p.money <= 0) {
      p.status = 'eliminated';
      eliminated.push(p.id);
      if (p.id !== HUMAN_ID) {
        state.pool.push(...p.jokers);
        p.jokers = [];
      }
    }
  }

  const joined: string[] = [];
  const busted = (id: string) => state.players.some((q) => q.id === id && q.status === 'eliminated');
  for (const p of state.players) {
    if (p.status !== 'waiting') continue;
    const after = p.joinsAfter ?? '*';
    const due = after === '*' ? eliminated.some((id) => id !== HUMAN_ID) : busted(after);
    if (due) {
      p.status = 'active';
      joined.push(p.id);
    }
  }

  state.report = { month: state.month, duel, offscreen, money, eliminated, joined };
  state.lastOpponentId = state.opponentId;

  if (player(state, HUMAN_ID).status === 'eliminated') state.phase = 'gameOver';
  else if (activeOpponents(state).length === 0) state.phase = 'victory';
  else state.phase = 'monthEnd';
}

export function nextMonth(prev: GameState): GameState {
  if (prev.phase !== 'monthEnd') throw new Error('Month is not over');
  const state = clone(prev);
  state.month++;
  return startMonthMut(state);
}
