/**
 * One hand of Snag Poker at a table of two or more seats: the League's duels
 * (two seats) and the High Rollers table (three or four) alike. Everyone acts
 * at once, in secret, but the moves resolve in seat order from `first`, and
 * that order is real: swaps draw their replacements off the deck one seat
 * after another. Folded seats stay at the table, out of the hand. A table may
 * allow a raise on the River (one fixed size; raises made at the same moment
 * don't stack), and then everyone else still in matches or folds. The best
 * hand takes the pot; the snags go to the weakest hand still in. Nobody pays
 * more than they have: short of the price, a captain puts in everything (all
 * in) and stays in the hand, and the pot holds only real money.
 *
 * These functions mutate the round they are given; the games (game.ts,
 * highrollers.ts) clone state before calling them.
 */
import { fullDeck, isJoker, type Card, type JokerCard, type StdCard } from './cards';
import type { RulesConfig } from './config';
import { bestHand, type HandValue } from './evaluate';
import { anteFor, baseAnte, discardCost, streetFee } from './pot';
import type { Rng } from './rng';

export type Action =
  /** On the Flop and the Turn: discard these cards and draw replacements (none = stand pat). */
  | { type: 'draw'; cardIds: string[] }
  /** On the River: the hand cards and number of snags you play; at a table that allows it, perhaps with a raise. */
  | { type: 'compose'; cardIds: string[]; jokers: number; raise?: boolean }
  /** After a raise on the River: put in as much, and stay in. */
  | { type: 'match' }
  /** On the Flop or the Turn (or facing a raise): give up the pot. */
  | { type: 'fold' };

export interface Seat {
  playerId: string;
  hand: StdCard[];
  /** Owned snags not played. They never take hand space. */
  jokers: JokerCard[];
  /** The cards played: empty until the hand is made on the River. */
  played: Card[];
  /** Cards this seat discarded this hand (face up). */
  discarded: StdCard[];
  /** How many of `discarded` were thrown on the Flop (the rest on the Turn). */
  flopDiscards?: number;
  /** Out of the hand (still at the table). */
  folded?: boolean;
}

export const STREETS = ['flop', 'turn', 'river'] as const;
export type StreetName = (typeof STREETS)[number];

export interface RoundResult {
  /** Seats that won (more than one on a tie: the pot is split). */
  winners: number[];
  /** Each seat's hand at the showdown; null for a folded seat (or everyone, when the hand ended in folds). */
  hands: (HandValue | null)[];
  /** Everything paid in. */
  pot: number;
  /** What each seat takes from the pot (and the forfeits). */
  share: number[];
  /** The seat with the weakest hand still in, which takes the snags; null on a tie, or when the hand ended in folds. */
  weakest: number | null;
  /** Snags the winners played: the weakest hand takes them. */
  dumped: JokerCard[];
  /** Snags at stake on the board: the weakest hand takes them too. */
  boardTaken: JokerCard[];
  /** Forfeits paid by each seat (losers who played snags), to the winners. */
  forfeit: number[];
  /** The hand ended because everyone else folded (or everyone folded at once: a stand-off, the pot split). */
  byFolds: boolean;
  /** Snags that went back to the pool (left in the deck, or on the board when nobody took them). */
  returnedToPool: JokerCard[];
}

export interface RoundState {
  /** The crossing (or the hand at a High Rollers table): it sets the ante. */
  month: number;
  seats: Seat[];
  /** The seat that acts (and draws) first this hand; at a table it moves on each hand, like a dealer's button. */
  first: number;
  deck: Card[];
  /** Revealed community cards (one may be a dead snag). */
  community: Card[];
  /** 0 the Flop, 1 the Turn, 2 the River (hands are made), 3 answering a raise (match or fold). */
  street: number;
  /** Playing for a pot: antes, fees and forfeits (a lesson may play without one). */
  potMode: boolean;
  /** The ante, the fees and the raise are this many times the usual (The Last Hand plays for double). */
  stakes: number;
  /** The Turn and River fees are the table ante over these. */
  feeDivisors: [number, number];
  /** What a raise costs on the River (0: no raising at this table). */
  raise: number;
  /** Seats that raised on the River. */
  raisers: number[];
  discards: StdCard[];
  /** Each street's moves, by seat (null for a seat that didn't move). */
  history: { street: number; actions: (Action | null)[] }[];
  /** Snags fished out of the deck by a seat this hand. */
  fished: { seat: number; street: number; joker: JokerCard }[];
  /** What each seat has paid into the pot. */
  bets: number[];
  /** What each seat had when the hand began: nobody pays in (or forfeits) more (missing: no limit). */
  purses?: number[];
  result: RoundResult | null;
}

export interface RoundPlayer {
  id: string;
  jokers: JokerCard[];
  /** What the captain has: in pot mode nobody pays in (or forfeits) more (default: no limit). */
  money?: number;
}

/**
 * A hand dealt to order, for lessons and story encounters: the cards in the
 * order they come off the deck (the Flop, then the hole cards round the table,
 * you first, then each swap's replacements as they are drawn, the Turn, the
 * River), and the opponent's moves street by street (null: their own choice;
 * at a fuller table, `others` for the rest).
 * The rest of the deck is shuffled underneath.
 */
export interface ArrangedHand {
  deck: string[];
  opponent?: (Action | null)[];
  /** At a fuller table, the moves of the seats after the first opponent's, seat by seat. */
  others?: (Action | null)[][];
}

export interface RoundOptions {
  /** The seat that acts first (default the first). */
  first?: number;
  /** The ante, fees and raise are this many times the usual. */
  stakes?: number;
  /** Raising on the River is allowed (one raise: the table ante, times the stakes). */
  raising?: boolean;
  /** The Turn and River fees as the table ante over these (default: the rules'). */
  feeDivisors?: [number, number];
  /** The deck to this order (lessons, story encounters, tests): no snags shuffled in. */
  arranged?: string[];
}

/** A shuffled deck with `order` on top, its first card the first drawn. */
function stackDeck(order: string[] | undefined, rng: Rng): Card[] {
  const deck = fullDeck();
  if (!order) return rng.shuffle(deck);
  const top = order.map((id) => {
    const k = deck.findIndex((c) => c.id === id);
    if (k < 0) throw new Error(`Not a card, or used twice: ${id}`);
    return deck.splice(k, 1)[0];
  });
  return [...rng.shuffle(deck), ...top.reverse()];
}

/**
 * Deals a hand: everyone antes, the Flop goes out, then the hole cards, one
 * at a time round the table from `first`. Snags from `pool` (mutated) may be
 * shuffled into the deck; an arranged deck keeps its order.
 */
export function createRound(
  month: number,
  players: RoundPlayer[],
  pool: JokerCard[],
  config: RulesConfig,
  rng: Rng,
  { first = 0, stakes = 1, raising = false, feeDivisors = config.streetFeeDivisors, arranged }: RoundOptions = {},
): RoundState {
  const potMode = config.pot;
  const purses = potMode ? players.map((p) => Math.max(0, p.money ?? Infinity)) : undefined;
  const round: RoundState = {
    month,
    seats: players.map((p) => ({ playerId: p.id, hand: [], jokers: p.jokers.slice(), played: [], discarded: [], folded: false })),
    first: first % players.length,
    deck: stackDeck(arranged, rng),
    community: [],
    street: 0,
    potMode,
    stakes,
    feeDivisors,
    raise: potMode && raising ? baseAnte(config, month) * stakes : 0,
    raisers: [],
    discards: [],
    history: [],
    fished: [],
    bets: players.map((p, i) => (potMode ? Math.min(anteFor(config, month, p.jokers.length, stakes), purses![i]) : 0)),
    ...(purses ? { purses } : {}),
    result: null,
  };
  for (let i = 0; i < config.communitySchedule[0]; i++) round.community.push(draw(round));
  for (let k = 0; k < config.handSize; k++) for (const s of seatOrder(round)) drawToSeat(round, s);
  if (!arranged) {
    const count = Math.min(pool.length, Math.floor((month - 1) / config.shuffledJokerEveryMonths));
    const snags: Card[] = [];
    for (let i = 0; i < count; i++) snags.push(pool.splice(rng.int(pool.length), 1)[0]);
    round.deck = rng.shuffle([...round.deck, ...snags]);
  }
  return round;
}

function draw(round: RoundState): Card {
  const card = round.deck.pop();
  if (!card) throw new Error('Deck is empty');
  return card;
}

/** One card for a seat; a snag fished out of the deck becomes the seat's, and it draws again (catching it is penalty enough). */
function drawToSeat(round: RoundState, seat: number) {
  const s = round.seats[seat];
  while (round.deck.length) {
    const card = draw(round);
    if (!isJoker(card)) {
      s.hand.push(card);
      return;
    }
    s.jokers.push(card);
    round.fished.push({ seat, street: round.street, joker: card });
  }
}

/** Seat indices in acting order, from `first` round the table. */
export function seatOrder(round: RoundState): number[] {
  const n = round.seats.length;
  return Array.from({ length: n }, (_, k) => (round.first + k) % n);
}

/** Seats still in the hand. */
export function inHand(round: RoundState): number[] {
  return seatOrder(round).filter((i) => !round.seats[i].folded);
}

/** True on the River, where hands are made (no discarding there). */
export function isComposing(round: RoundState): boolean {
  return round.street === 2 && !round.result;
}

/** After a raise: a seat still in that didn't raise must match it or fold. */
export function isAnswering(round: RoundState, seat: number): boolean {
  return round.street === 3 && !round.result && !round.seats[seat].folded && !round.raisers.includes(seat);
}

/** Seats that move this street: everyone still in, except, when answering a raise, those who made one. */
export function movers(round: RoundState): number[] {
  return inHand(round).filter((i) => round.street !== 3 || isAnswering(round, i));
}

/**
 * You may fold on the Flop or the Turn, whatever you've swapped, or facing a
 * raise. Never otherwise on the River: by then folding would only be a way to
 * dodge snags, so you face the showdown and take what comes.
 */
export function canFold(round: RoundState, seat: number): boolean {
  return !round.result && !round.seats[seat].folded && (round.street < 2 || isAnswering(round, seat));
}

/** What a seat has left to put in this hand (all of it, and it's all in). */
export function roundLeft(round: RoundState, seat: number): number {
  return Math.max(0, (round.purses?.[seat] ?? Infinity) - round.bets[seat]);
}

/** The fee to see the next street (1 the Turn, 2 the River), at this table's stakes. */
export function feeFor(round: RoundState, config: RulesConfig, nextStreet: number): number {
  return round.potMode ? streetFee(config, round.month, nextStreet, round.stakes, round.feeDivisors) : 0;
}

/** What a move costs a seat: the fee to see the next street, plus the swaps; a raise, or matching one. */
export function actionCost(round: RoundState, seat: number, action: Action, config: RulesConfig): number {
  if (!round.potMode) return 0;
  if (action.type === 'match' || (action.type === 'compose' && action.raise)) return round.raise;
  if (action.type !== 'draw') return 0;
  return feeFor(round, config, round.street + 1) + discardCost(round.seats[seat].discarded.length, action.cardIds.length);
}

/** Every move a seat could make now (one raise flag aside: a laid hand with or without it is the same choice). */
export function legalActions(round: RoundState, seat: number): Action[] {
  const s = round.seats[seat];
  if (round.result || s.folded) return [];
  const fold: Action[] = canFold(round, seat) ? [{ type: 'fold' }] : [];
  if (round.street === 3) return isAnswering(round, seat) ? [{ type: 'match' }, ...fold] : [];
  const ids = s.hand.map((c) => c.id);
  if (isComposing(round)) {
    return subsets(ids).flatMap((cardIds) =>
      Array.from({ length: Math.min(s.jokers.length, 5 - cardIds.length) + 1 }, (_, jokers): Action => ({ type: 'compose', cardIds, jokers })),
    );
  }
  const draws = subsets(ids)
    .filter((cardIds) => cardIds.length <= round.deck.length)
    .map((cardIds): Action => ({ type: 'draw', cardIds }));
  return [...draws, ...fold];
}

/** All subsets of a small list, smallest first. */
export function subsets<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 0; mask < 1 << items.length; mask++) out.push(items.filter((_, i) => mask & (1 << i)));
  return out.sort((a, b) => a.length - b.length);
}

export function isLegal(round: RoundState, seat: number, action: Action): boolean {
  const s = round.seats[seat];
  if (s.folded || round.result) return false;
  if (action.type === 'fold') return canFold(round, seat);
  if (round.street === 3) return action.type === 'match' && isAnswering(round, seat);
  if (action.type === 'match') return false;
  if (action.type === 'compose' && action.raise && !round.raise) return false;
  if (action.type !== (isComposing(round) ? 'compose' : 'draw')) return false;
  const ids = action.cardIds;
  if (new Set(ids).size !== ids.length || !ids.every((id) => s.hand.some((c) => c.id === id))) return false;
  if (action.type === 'draw') return ids.length <= round.deck.length;
  return Number.isInteger(action.jokers) && action.jokers >= 0 && action.jokers <= s.jokers.length && ids.length + action.jokers <= 5;
}

/**
 * Everyone's secret moves for this street (null for a seat that doesn't
 * move). The folds come first: if they leave one seat in (or none, a
 * stand-off), the hand is over and nobody else's move is made or paid for.
 * The rest are applied in seat order from `first`; then the next street is
 * dealt, or, on the River, the showdown (after a raise, once the rest have
 * matched or folded).
 */
export function resolveStreet(round: RoundState, actions: (Action | null)[], config: RulesConfig) {
  if (round.result) throw new Error('The hand is over');
  const moving = movers(round);
  for (const i of moving) {
    const a = actions[i];
    if (!a || !isLegal(round, i, a)) throw new Error(`Illegal or missing move for seat ${i}: ${JSON.stringify(a)}`);
  }
  const record = () => round.history.push({ street: round.street, actions: round.seats.map((_, i) => (moving.includes(i) ? actions[i] : null)) });
  const folding = moving.filter((i) => actions[i]!.type === 'fold');
  for (const i of folding) round.seats[i].folded = true;
  const left = inHand(round);
  if (left.length <= 1) {
    record();
    // Everyone still in folding at once is a stand-off: the pot is split between them.
    return endByFolds(round, left.length ? left : folding);
  }
  for (const i of seatOrder(round)) {
    const a = actions[i];
    const s = round.seats[i];
    if (!a || s.folded || !moving.includes(i)) continue;
    round.bets[i] += Math.min(actionCost(round, i, a, config), roundLeft(round, i));
    if (a.type === 'compose' && a.raise) round.raisers.push(i);
    if (a.type === 'draw') {
      if (round.street === 0) s.flopDiscards = a.cardIds.length;
      for (const id of a.cardIds) {
        const [card] = s.hand.splice(s.hand.findIndex((c) => c.id === id), 1);
        round.discards.push(card);
        s.discarded.push(card);
      }
      for (let k = 0; k < a.cardIds.length; k++) drawToSeat(round, i);
    } else if (a.type === 'compose') {
      s.played = [...a.cardIds.map((id) => s.hand.find((c) => c.id === id)!), ...s.jokers.splice(0, a.jokers)];
      s.hand = s.hand.filter((c) => !a.cardIds.includes(c.id));
    }
  }
  record();
  // A raise on the River: the rest still in answer it before the showdown.
  if (round.street === 2 && round.raisers.length && left.some((i) => !round.raisers.includes(i))) {
    round.street = 3;
    return;
  }
  if (round.street >= 2) return showdown(round, config);
  round.street++;
  for (let i = 0; i < config.communitySchedule[round.street]; i++) round.community.push(draw(round));
}

/** The one winner, or null on a split pot. */
export function winnerOf(result: RoundResult): number | null {
  return result.winners.length === 1 ? result.winners[0] : null;
}

/** The first seat that folded, if any did. */
export function foldedSeat(round: RoundState): number | null {
  const i = round.seats.findIndex((s) => s.folded);
  return i < 0 ? null : i;
}

const potOf = (round: RoundState) => round.bets.reduce((a, b) => a + b, 0);

/** The pot (and the forfeits) split among the winners; the odd coins to the earliest of them in seat order. */
function shares(round: RoundState, winners: number[], forfeits: number): number[] {
  const total = potOf(round) + forfeits;
  const share = round.seats.map(() => 0);
  const each = Math.floor(total / winners.length);
  winners.forEach((i) => (share[i] = each));
  share[winners[0]] += total - each * winners.length;
  return share;
}

/** Everyone else folded: the last seat in takes the pot; no hands shown, no snags change hands, the board's go back. */
function endByFolds(round: RoundState, winners: number[]) {
  const order = seatOrder(round);
  winners.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  round.result = {
    winners,
    hands: round.seats.map(() => null),
    pot: potOf(round),
    share: shares(round, winners, 0),
    weakest: null,
    dumped: [],
    boardTaken: [],
    forfeit: round.seats.map(() => 0),
    byFolds: true,
    returnedToPool: [...round.deck.filter(isJoker), ...round.community.filter(isJoker)],
  };
}

function showdown(round: RoundState, config: RulesConfig) {
  const left = inHand(round);
  const hands: (HandValue | null)[] = round.seats.map((s, i) =>
    left.includes(i) ? bestHand(s.played, round.community, { min: s.played.length, max: s.played.length }) : null,
  );
  const score = (i: number) => hands[i]!.score;
  const top = Math.max(...left.map(score));
  const winners = left.filter((i) => score(i) === top);
  const losers = left.filter((i) => score(i) < top);
  // The weakest hand still in (on a tie, the one acting earliest this hand).
  const weakest = losers.length ? losers.reduce((w, i) => (score(i) < score(w) ? i : w)) : null;

  const played = round.seats.map((s) => s.played.filter(isJoker));
  const boardSnags = round.community.filter(isJoker);
  // A loser's forfeits, as far as its purse goes (a lesson without a pot has none).
  const forfeit = round.seats.map((_, i) => (round.potMode && losers.includes(i) ? Math.min(played[i].length * (config.jokerForfeit ?? 0), roundLeft(round, i)) : 0));
  // A winner's played snags (and the board's) go to the weakest hand; a loser keeps its own.
  // If everyone still in tied, there's no weakest: each keeps its own, and the board's go back to the pool.
  const dumped = weakest === null ? [] : winners.flatMap((i) => played[i]);
  const boardTaken = weakest === null ? [] : boardSnags;
  round.seats.forEach((s, i) => {
    if (i === weakest) s.jokers.push(...dumped, ...played[i], ...boardTaken);
    else if (weakest === null || !winners.includes(i)) s.jokers.push(...played[i]);
  });

  round.result = {
    winners,
    hands,
    pot: potOf(round),
    share: shares(round, winners, forfeit.reduce((a, b) => a + b, 0)),
    weakest,
    dumped,
    boardTaken,
    forfeit,
    byFolds: false,
    returnedToPool: [...round.deck.filter(isJoker), ...(weakest === null ? boardSnags : [])],
  };
}
