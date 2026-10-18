/**
 * The whole game: the Captain, the league of opponents, the Joker pool and the
 * month-by-month flow. Every exported function is pure: it clones the state it
 * receives and returns a new one.
 */
import { chooseAction, viewFor } from './ai';
import { jokerCard, type JokerCard } from './cards';
import { HUMAN_ID, ROSTER, type AiId, type CharacterDef } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { createRound, resolveStreet, type Action, type RoundResult, type RoundState } from './round';
import { Rng } from './rng';

export interface Player {
  id: string;
  /** null for the human Captain. */
  ai: AiId | null;
  popularity: number;
  jokers: JokerCard[];
  status: 'waiting' | 'active' | 'eliminated';
}

export interface DuelSummary {
  players: [string, string];
  result: RoundResult;
}

export interface MonthReport {
  month: number;
  duel: DuelSummary;
  offscreen: DuelSummary[];
  /** Popularity before → after for every player who took part this month. */
  popularity: Record<string, { before: number; after: number; drained: number }>;
  eliminated: string[];
  joined: string[];
}

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
}

const clone = <T>(x: T): T => structuredClone(x);

export function newGame(seed: number, config: RulesConfig = DEFAULT_CONFIG, roster: CharacterDef[] = ROSTER): GameState {
  const players: Player[] = [
    { id: HUMAN_ID, ai: null, popularity: config.startPopularity, jokers: [], status: 'active' },
    ...roster.map((c): Player => ({
      id: c.id,
      ai: c.ai,
      popularity: c.startPopularity,
      jokers: [],
      status: c.joins === 'start' ? 'active' : 'waiting',
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
      before[p.id] ??= p.popularity;
      p.jokers = seat.jokers;
      if (res.winner === i) p.popularity = Math.min(cfg.maxPopularity, p.popularity + res.gain);
      else if (res.winner !== null) p.popularity = Math.max(0, p.popularity - Math.round(res.gain * cfg.loserPays));
    });
    state.pool.push(...res.returnedToPool);
    return { players: [round.seats[0].playerId, round.seats[1].playerId], result: res };
  };

  const duel = settle(state.round!);

  // Meanwhile, on the river: everyone else not in the Captain's duel pairs up.
  const others = rng.shuffle(activeOpponents(state).filter((p) => p.id !== state.opponentId));
  const offscreen: DuelSummary[] = [];
  for (let i = 0; i + 1 < others.length; i += 2) {
    offscreen.push(settle(simulateDuel(state, others[i], others[i + 1], rng)));
  }

  // Joker drain hits every player still on the river.
  const popularity: MonthReport['popularity'] = {};
  const eliminated: string[] = [];
  for (const p of state.players) {
    if (p.status !== 'active') continue;
    before[p.id] ??= p.popularity;
    const drained = p.jokers.length * cfg.drainPerJoker;
    p.popularity = Math.max(0, p.popularity - drained);
    popularity[p.id] = { before: before[p.id], after: p.popularity, drained };
    if (p.popularity <= 0) {
      p.status = 'eliminated';
      eliminated.push(p.id);
      if (p.id !== HUMAN_ID) {
        state.pool.push(...p.jokers);
        p.jokers = [];
      }
    }
  }

  const joined: string[] = [];
  if (eliminated.some((id) => id !== HUMAN_ID)) {
    for (const p of state.players) {
      if (p.status === 'waiting') {
        p.status = 'active';
        joined.push(p.id);
      }
    }
  }

  state.report = { month: state.month, duel, offscreen, popularity, eliminated, joined };
  state.lastOpponentId = state.opponentId;

  if (player(state, HUMAN_ID).status === 'eliminated') state.phase = 'gameOver';
  else if (state.month >= cfg.months || activeOpponents(state).length === 0) state.phase = 'victory';
  else state.phase = 'monthEnd';
}

export function nextMonth(prev: GameState): GameState {
  if (prev.phase !== 'monthEnd') throw new Error('Month is not over');
  const state = clone(prev);
  state.month++;
  return startMonthMut(state);
}
