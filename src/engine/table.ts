/**
 * A hand at a table of several captains (High Rollers): Snag Poker's draw
 * style for three to four seats. Everyone acts at once, in secret, but the
 * moves resolve in seat order from `first`, and that order is real: swaps
 * draw their replacements off the deck one seat after another. Folded seats
 * stay at the table, out of the hand. The best hand takes the pot; the snags
 * go to the weakest hand still in.
 *
 * Like round.ts, these functions mutate the hand they're given; the game
 * (highrollers.ts) clones state first.
 */
import { fullDeck, isJoker, type Card, type JokerCard, type StdCard } from './cards';
import type { RulesConfig } from './config';
import { bestHand, type HandValue } from './evaluate';
import { anteFor, baseAnte, discardCost } from './pot';
import type { Action, RoundPlayer, Seat } from './round';
import type { Rng } from './rng';

export interface TableSeat extends Seat {
  folded: boolean;
}

export interface TableResult {
  /** Seats that won (more than one on a tie: the pot is split). */
  winners: number[];
  /** Each seat's hand at the showdown; null for a folded seat (or everyone, when the hand ended in folds). */
  hands: (HandValue | null)[];
  pot: number;
  /** What each seat takes from the pot. */
  share: number[];
  /** The seat with the weakest hand still in, which takes the snags; null when the hand ended in folds. */
  weakest: number | null;
  /** Snags that went to the weakest hand: those the winners played, and any at stake on the board. */
  dumped: JokerCard[];
  /** Forfeits paid by each seat (losers who played snags), to the winners. */
  forfeit: number[];
  /** The hand ended because everyone else folded. */
  byFolds: boolean;
  /** Snags that went back to the pool (left in the deck, or on the board when the hand ended in folds). */
  returnedToPool: JokerCard[];
}

export interface TableRound {
  /** The hand number: it sets the ante, as the crossing does in the League. */
  month: number;
  seats: TableSeat[];
  /** The seat that acts (and draws) first this hand; it moves on each hand, like a dealer's button. */
  first: number;
  deck: Card[];
  community: Card[];
  /** 0 the Flop, 1 the Turn, 2 the River (hands are made). */
  street: number;
  discards: StdCard[];
  /** Each street's moves, by seat (null for a seat already out). */
  history: { street: number; actions: (Action | null)[] }[];
  /** Snags fished out of the deck by a seat this hand. */
  fished: { seat: number; street: number; joker: JokerCard }[];
  /** What each seat has paid into the pot. */
  bets: number[];
  result: TableResult | null;
}

/** High Rollers' street fees: half the ante to see the Turn, the full ante to see the River. */
export function tableFee(config: RulesConfig, month: number, nextStreet: number): number {
  const ante = baseAnte(config, month);
  return nextStreet === 1 ? Math.floor(ante / 2) : nextStreet === 2 ? ante : 0;
}

/** Seat indices in acting order, from `first` round the table. */
export function seatOrder(round: TableRound): number[] {
  const n = round.seats.length;
  return Array.from({ length: n }, (_, k) => (round.first + k) % n);
}

/** Seats still in the hand. */
export function inHand(round: TableRound): number[] {
  return seatOrder(round).filter((i) => !round.seats[i].folded);
}

export function tableComposing(round: TableRound): boolean {
  return round.street === 2 && !round.result;
}

export function tableCanFold(round: TableRound, seat: number): boolean {
  return !round.result && round.street < 2 && !round.seats[seat].folded;
}

/** What a move costs a seat: the fee to see the next street, plus the swaps. */
export function tableCost(round: TableRound, seat: number, action: Action, config: RulesConfig): number {
  if (action.type !== 'draw') return 0;
  return tableFee(config, round.month, round.street + 1) + discardCost(round.seats[seat].discarded.length, action.cardIds.length);
}

function draw(round: TableRound): Card {
  const card = round.deck.pop();
  if (!card) throw new Error('Deck is empty');
  return card;
}

/** One card for a seat; a snag fished out of the deck becomes the seat's, and it draws again. */
function drawToSeat(round: TableRound, seat: number) {
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

/** The deck with `order` on top (tests), the rest shuffled beneath. */
function stack(order: string[] | undefined, rng: Rng): Card[] {
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
 * Deals a hand: everyone antes, the Flop goes out, then three cards each,
 * one at a time round the table from `first`. Snags from `pool` may be
 * shuffled into the deck as in the League; an arranged `order` (tests) keeps
 * the deck as given.
 */
export function createTableRound(
  month: number,
  players: RoundPlayer[],
  first: number,
  pool: JokerCard[],
  config: RulesConfig,
  rng: Rng,
  order?: string[],
): TableRound {
  const round: TableRound = {
    month,
    seats: players.map((p) => ({ playerId: p.id, hand: [], jokers: p.jokers.slice(), slots: [], discarded: [], folded: false })),
    first: first % players.length,
    deck: stack(order, rng),
    community: [],
    street: 0,
    discards: [],
    history: [],
    fished: [],
    bets: players.map((p) => anteFor(config, month, p.jokers.length)),
    result: null,
  };
  for (let i = 0; i < config.communitySchedule[0]; i++) round.community.push(draw(round));
  for (let k = 0; k < config.dealSchedule[0]; k++) for (const s of seatOrder(round)) drawToSeat(round, s);
  if (!order && config.jokerMode === 'shuffled') {
    const count = Math.min(pool.length, Math.floor((month - 1) / config.shuffledJokerEveryMonths));
    const snags: Card[] = [];
    for (let i = 0; i < count; i++) snags.push(pool.splice(rng.int(pool.length), 1)[0]);
    round.deck = rng.shuffle([...round.deck, ...snags]);
  }
  return round;
}

export function tableLegal(round: TableRound, seat: number, action: Action): boolean {
  const s = round.seats[seat];
  if (s.folded || round.result) return false;
  if (action.type === 'fold') return tableCanFold(round, seat);
  if (action.type !== (tableComposing(round) ? 'compose' : 'draw')) return false;
  const ids = action.cardIds;
  if (new Set(ids).size !== ids.length || !ids.every((id) => s.hand.some((c) => c.id === id))) return false;
  if (action.type === 'draw') return ids.length <= round.deck.length;
  return Number.isInteger(action.jokers) && action.jokers >= 0 && action.jokers <= s.jokers.length && ids.length + action.jokers <= 5;
}

/**
 * Everyone's secret moves for this street (null for a seat already out),
 * applied in seat order from `first`; then the next street is dealt, or, on the
 * River, the showdown. If only one seat is left in, it takes the pot.
 */
export function resolveTableStreet(round: TableRound, actions: (Action | null)[], config: RulesConfig) {
  if (round.result) throw new Error('The hand is over');
  for (const i of inHand(round)) {
    const a = actions[i];
    if (!a || !tableLegal(round, i, a)) throw new Error(`Illegal or missing move for seat ${i}: ${JSON.stringify(a)}`);
  }
  for (const i of seatOrder(round)) {
    const a = actions[i];
    const s = round.seats[i];
    if (!a || s.folded) continue;
    if (a.type === 'fold') {
      s.folded = true;
      continue;
    }
    round.bets[i] += tableCost(round, i, a, config);
    if (a.type === 'draw') {
      if (round.street === 0) s.flopDiscards = a.cardIds.length;
      for (const id of a.cardIds) {
        const [card] = s.hand.splice(s.hand.findIndex((c) => c.id === id), 1);
        round.discards.push(card);
        s.discarded.push(card);
      }
      for (let k = 0; k < a.cardIds.length; k++) drawToSeat(round, i);
    } else if (a.type === 'compose') {
      s.slots = [...a.cardIds.map((id) => s.hand.find((c) => c.id === id)!), ...s.jokers.splice(0, a.jokers)];
      s.hand = s.hand.filter((c) => !a.cardIds.includes(c.id));
    }
  }
  round.history.push({ street: round.street, actions: actions.map((a, i) => (round.seats[i].folded && a?.type !== 'fold' ? null : a)) });
  const left = inHand(round);
  if (left.length === 1) return endByFolds(round, left[0]);
  if (round.street === 2) return showdown(round, config);
  round.street++;
  for (let i = 0; i < config.communitySchedule[round.street]; i++) round.community.push(draw(round));
}

const pot = (round: TableRound) => round.bets.reduce((a, b) => a + b, 0);

/** Everyone else folded: the last seat in takes the pot; no hands shown, no snags change hands. */
function endByFolds(round: TableRound, winner: number) {
  const share = round.seats.map((_, i) => (i === winner ? pot(round) : 0));
  round.result = {
    winners: [winner],
    hands: round.seats.map(() => null),
    pot: pot(round),
    share,
    weakest: null,
    dumped: [],
    forfeit: round.seats.map(() => 0),
    byFolds: true,
    returnedToPool: [...round.deck.filter(isJoker), ...round.community.filter(isJoker)],
  };
}

function showdown(round: TableRound, config: RulesConfig) {
  const left = inHand(round);
  const hands: (HandValue | null)[] = round.seats.map((s, i) =>
    left.includes(i) ? bestHand(s.slots, round.community, { min: s.slots.length, max: s.slots.length }) : null,
  );
  const score = (i: number) => hands[i]!.score;
  const top = Math.max(...left.map(score));
  const winners = left.filter((i) => score(i) === top);
  const losers = left.filter((i) => score(i) < top);
  // The weakest hand still in (on a tie, the one acting earliest this hand).
  const weakest = losers.length ? losers.reduce((w, i) => (score(i) < score(w) ? i : w)) : null;

  const played = round.seats.map((s) => s.slots.filter(isJoker));
  const boardSnags = round.community.filter(isJoker);
  const forfeit = round.seats.map((_, i) => (losers.includes(i) ? played[i].length * (config.jokerForfeit ?? 0) : 0));
  // A winner's played snags (and the board's) go to the weakest hand; a loser keeps its own.
  // If everyone still in tied, there's no weakest: each keeps its own, and the board's go back to the pool.
  const dumped = weakest === null ? [] : [...winners.flatMap((i) => played[i]), ...boardSnags];
  round.seats.forEach((s, i) => {
    if (weakest === null || !winners.includes(i)) s.jokers.push(...played[i]);
  });
  if (weakest !== null) round.seats[weakest].jokers.push(...dumped);

  // The pot (and the forfeits) split among the winners; the odd coins to the earliest of them.
  const total = pot(round);
  const forfeits = forfeit.reduce((a, b) => a + b, 0);
  const share = round.seats.map(() => 0);
  const each = Math.floor((total + forfeits) / winners.length);
  winners.forEach((i) => (share[i] = each));
  share[winners[0]] += total + forfeits - each * winners.length;

  round.result = {
    winners,
    hands,
    pot: total,
    share,
    weakest,
    dumped,
    forfeit,
    byFolds: false,
    returnedToPool: [...round.deck.filter(isJoker), ...(weakest === null ? boardSnags : [])],
  };
}
