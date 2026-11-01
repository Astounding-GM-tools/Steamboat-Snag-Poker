/**
 * The whole game: the Captain, the league of opponents, the Joker pool and the
 * month-by-month flow. Every exported function is pure: it clones the state it
 * receives and returns a new one.
 */
import { chooseAction, viewFor } from './ai';
import { jokerCard, type JokerCard } from './cards';
import { HUMAN_ID, ROSTER, drawLineUp, type AiId, type LineUpEntry } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { createRound, isLegal, movers, resolveStreet, type Action, type ArrangedHand, type RoundResult, type RoundState } from './round';
import { Rng } from './rng';
import type { HighRollersResult, HighRollersSetup, HighRollersState } from './highrollers';

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
  /** The captains at the table, by seat (you first in yours). */
  players: string[];
  result: RoundResult;
}

export interface MonthReport {
  month: number;
  duel: DuelSummary;
  /** Money before → after for every player who took part this month. */
  money: Record<string, { before: number; after: number; drained: number }>;
  eliminated: string[];
  joined: string[];
  /** The captain who sat this crossing out (the poorest, when the count is odd). */
  sittingOut?: string | null;
}

/**
 * 'duel' and 'monthEnd' through the League; 'finale' at the High Rollers
 * table, once four captains are left; 'finished' after it (placed, with a
 * score). 'gameOver' when you go broke on the way; 'victory' when you're the
 * last afloat (a story, where there's no finale).
 */
export type Phase = 'duel' | 'monthEnd' | 'finale' | 'finished' | 'gameOver' | 'victory';

/** The League goes to the High Rollers table when this many captains are left afloat (you among them). */
export const FINALISTS = 4;
/** The League's stake: what it adds to each finalist's purse at the final table. */
export const FINALE_STAKE = 60;

export interface GameState {
  config: RulesConfig;
  rngState: number;
  month: number;
  players: Player[];
  /** Unowned Jokers. */
  pool: JokerCard[];
  phase: Phase;
  /** Your opponent this crossing (at a fuller table, the first of them). */
  opponentId: string | null;
  /** Everyone at your table this crossing besides you, by seat: a duel's one opponent, or (where a story seats them) several. */
  tableIds?: string[];
  /** This round's sitter: with an odd number of captains, a random rival sits out (and pays snag upkeep). */
  sitterId?: string | null;
  lastOpponentId: string | null;
  round: RoundState | null;
  report: MonthReport | null;
  /** A lesson or story encounter, by script id: it is played, not saved or recorded. */
  story?: string;
  /** Hands dealt to order, one per round from the first; later rounds are shuffled as usual. */
  arranged?: ArrangedHand[];
  /** A story's encounters: who sits at your table, round by round from the first (none, or a captain not afloat: the river decides). */
  tables?: (string[] | null)[];
  /** What the money on the table is: dollars, or (in Morag's lessons) buttons. */
  currency?: 'buttons';
  /** Four are left: when the month's report is read, the League goes to the final table. */
  finaleNext?: boolean;
  /** How the final table went: your place (0 gold) and what you walked away with. */
  finale?: { place: number; score: number };
  /** The final table as it stands, saved with every move (so a voyage picked up there carries on, not deals again). */
  finaleTable?: HighRollersState;
}

const clone = <T>(x: T): T => structuredClone(x);

/**
 * Starts a tournament. The line-up is drawn from the gallery (a mix of rascals,
 * middling captains and sharps) unless one is given, e.g. by tests.
 */
export function newGame(
  seed: number,
  config: RulesConfig = DEFAULT_CONFIG,
  lineUp?: LineUpEntry[],
  extra: Pick<GameState, 'story' | 'arranged' | 'tables'> = {},
): GameState {
  const drawRng = new Rng((seed ^ 0x5eed) >>> 0);
  const entries = lineUp ?? drawLineUp(ROSTER, (n) => drawRng.int(n));
  const players: Player[] = [
    { id: HUMAN_ID, ai: null, money: config.startMoney, jokers: [], status: 'active' },
    ...entries.map(({ def, joins }): Player => ({
      id: def.id,
      ai: def.ai,
      money: def.startMoney,
      jokers: [],
      status: joins === 'start' ? 'active' : 'waiting',
      ...(joins === 'start' ? {} : { joinsAfter: joins }),
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
    ...extra,
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
/**
 * With an odd number of captains on the river (you included), someone has to
 * sit the round out: a rival drawn at random (never you, and not the same one
 * twice running when there's a choice). Sitting out isn't free: the sitter pays
 * their snag upkeep (but no ante, as there's no hand), so nobody can hide.
 */
export function chooseSitter(state: GameState, rng: Rng): Player | null {
  const rivals = activeOpponents(state);
  if ((rivals.length + 1) % 2 === 0 || rivals.length < 2) return null;
  const fresh = rivals.filter((p) => p.id !== state.sitterId);
  return rng.pick(fresh.length ? fresh : rivals);
}

export function pickOpponent(state: GameState, rng: Rng): Player {
  const candidates = activeOpponents(state).filter((p) => p.id !== state.sitterId);
  const fresh = candidates.filter((p) => p.id !== state.lastOpponentId);
  return rng.pick(fresh.length ? fresh : candidates);
}

/** A story's table for this crossing: the captains it names that are afloat (none: the river decides). */
function encounter(state: GameState): Player[] {
  const ids = state.tables?.[state.month - 1] ?? [];
  return ids.map((id) => state.players.find((p) => p.id === id && p.status === 'active')).filter((p): p is Player => !!p);
}

function startMonthMut(state: GameState): GameState {
  const rng = new Rng(state.rngState);
  const seated = encounter(state);
  let table: Player[];
  if (seated.length) {
    // A story seats you with whoever it says; the rest of the river pairs off, someone sitting out if they're odd.
    table = seated;
    const rest = activeOpponents(state).filter((p) => !seated.includes(p));
    const fresh = rest.filter((p) => p.id !== state.sitterId);
    state.sitterId = rest.length % 2 ? rng.pick(fresh.length ? fresh : rest).id : null;
  } else {
    state.sitterId = chooseSitter(state, rng)?.id ?? null;
    table = [pickOpponent(state, rng)];
  }
  state.opponentId = table[0].id;
  state.tableIds = table.map((p) => p.id);
  const human = player(state, HUMAN_ID);
  state.round = createRound(state.month, [human, ...table], state.pool, state.config, rng, { arranged: state.arranged?.[state.month - 1]?.deck });
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
  const arranged = state.arranged?.[state.month - 1];
  const moving = movers(round);
  // Everyone else at the table answers (an arranged hand may script their moves, if still legal ones).
  const actions = round.seats.map((seat, i): Action | null => {
    if (i === 0) return action;
    if (!moving.includes(i)) return null;
    const scripted = (i === 1 ? arranged?.opponent : arranged?.others?.[i - 2])?.[round.history.length];
    if (scripted && isLegal(round, i, scripted)) return scripted;
    return chooseAction(player(state, seat.playerId).ai!, viewFor(round, i, state.config), state.config, rng);
  });
  resolveStreet(round, actions, state.config);
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
      [chooseAction(a.ai!, viewFor(round, 0, state.config), state.config, rng), chooseAction(b.ai!, viewFor(round, 1, state.config), state.config, rng)],
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
      // Pay in what you bet, take your share of the pot, pay your forfeits (a lesson without a pot moves no money).
      if (round.potMode) p.money += res.share[i] - round.bets[i] - res.forfeit[i];
    });
    state.pool.push(...res.returnedToPool);
    return { players: round.seats.map((s) => s.playerId), result: res };
  };

  const duel = settle(state.round!);

  // Meanwhile, on the river: everyone else not in the Captain's duel pairs up.
  const atTable = state.tableIds ?? [state.opponentId];
  const others = rng.shuffle(activeOpponents(state).filter((p) => !atTable.includes(p.id) && p.id !== state.sitterId));
  for (let i = 0; i + 1 < others.length; i += 2) settle(simulateDuel(state, others[i], others[i + 1], rng));

  // Joker drain hits every player still on the river.
  const money: MonthReport['money'] = {};
  const eliminated: string[] = [];
  for (const p of state.players) {
    if (p.status !== 'active') continue;
    before[p.id] ??= p.money;
    // In pot mode Joker upkeep is paid into each ante instead, except by the
    // captain sitting the round out, who has no ante but still pays upkeep.
    const potUpkeep = cfg.pot;
    const drained = !potUpkeep || p.id === state.sitterId ? p.jokers.length * cfg.drainPerJoker : 0;
    if (drained) p.money = Math.max(0, p.money - drained);
    money[p.id] = { before: before[p.id], after: p.money, drained };
    if (p.money <= 0) {
      p.status = 'eliminated';
      eliminated.push(p.id);
      // A busted rival's snags go back into the river's pool; in a story they outlive the game, so they keep them.
      if (p.id !== HUMAN_ID && !state.story) {
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

  state.report = { month: state.month, duel, money, eliminated, joined, sittingOut: state.sitterId ?? null };
  state.lastOpponentId = state.opponentId;

  if (player(state, HUMAN_ID).status === 'eliminated') state.phase = 'gameOver';
  else if (activeOpponents(state).length === 0) state.phase = 'victory';
  else {
    state.phase = 'monthEnd';
    // The League's last four go to the High Rollers table (not in a story: there the river decides).
    if (!state.story && activeOpponents(state).length + 1 <= FINALISTS) state.finaleNext = true;
  }
}

export function nextMonth(prev: GameState): GameState {
  if (prev.phase !== 'monthEnd') throw new Error('Month is not over');
  const state = clone(prev);
  if (state.finaleNext) {
    // To the final table: no more crossings.
    state.finaleNext = false;
    state.phase = 'finale';
    state.round = null;
    state.opponentId = null;
    state.tableIds = [];
    return state;
  }
  state.month++;
  return startMonthMut(state);
}

/**
 * The final table's seating: you and the rivals still afloat, with their
 * purses (plus the League's stake) and their snags, at the next crossing's
 * hand (it sets the ante).
 */
export function finaleSetup(state: GameState): HighRollersSetup & { seed: number } {
  const rivals = activeOpponents(state);
  const you = player(state, HUMAN_ID);
  return {
    seed: state.rngState,
    rivals: rivals.map((p) => p.id),
    money: [you, ...rivals].map((p) => Math.max(0, p.money) + FINALE_STAKE),
    jokers: [you, ...rivals].map((p) => p.jokers.slice()),
    pool: state.pool.slice(),
    startHand: state.month + 1,
  };
}

/** The final table is over: your place and what you walked away with end the voyage. */
export function finishFinale(prev: GameState, result: HighRollersResult): GameState {
  if (prev.phase !== 'finale') throw new Error('Not at the final table');
  const state = clone(prev);
  state.phase = 'finished';
  state.finale = { place: result.place, score: result.score };
  delete state.finaleTable;
  return state;
}
