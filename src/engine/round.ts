/**
 * One month's duel between two seats. These functions mutate the round they are
 * given; the public game API (game.ts) clones state before calling them.
 */
import { fullDeck, isJoker, type Card, type JokerCard, type StdCard } from './cards';
import { DEAL_SCHEDULE, type RulesConfig } from './config';
import { compareHands, evaluate, type HandValue } from './evaluate';
import type { Rng } from './rng';

export type SlotIndex = 0 | 1;

export type Action =
  | { type: 'place'; cardId: string; slot: SlotIndex }
  | { type: 'discard'; cardId: string }
  | { type: 'pass' };

export interface Seat {
  playerId: string;
  hand: StdCard[];
  /** Owned Jokers not currently in a slot. They never take hand space. */
  jokers: JokerCard[];
  slots: [Card | null, Card | null];
}

export const STREETS = ['flop', 'turn', 'river'] as const;
export type StreetName = (typeof STREETS)[number];

export interface RoundResult {
  /** Seat index of the winner, or null for a true draw. */
  winner: 0 | 1 | null;
  hands: [HandValue, HandValue];
  gain: number;
  /** Jokers the winner dumped on the loser. */
  dumped: JokerCard[];
  /** Community Jokers the loser had to take. */
  communityTaken: JokerCard[];
  /** Jokers that went back to the unowned pool. */
  returnedToPool: JokerCard[];
}

export interface RoundState {
  month: number;
  seats: [Seat, Seat];
  deck: Card[];
  /** Revealed community cards (in shuffled mode one may be a dead Joker). */
  community: Card[];
  /** Slot mode: the Joker in the fourth community slot, if any. */
  communityJoker: JokerCard | null;
  /** 0..2 while playing, 3 once the showdown has been resolved. */
  street: number;
  discards: StdCard[];
  history: { street: number; actions: [Action, Action] }[];
  result: RoundResult | null;
}

export interface RoundPlayer {
  id: string;
  jokers: JokerCard[];
}

/**
 * Creates a round and deals the Flop. Takes any Jokers it needs from `pool`
 * (mutated). Returns the round, ready for the players' Flop actions.
 */
export function createRound(
  month: number,
  players: [RoundPlayer, RoundPlayer],
  pool: JokerCard[],
  config: RulesConfig,
  rng: Rng,
): RoundState {
  const seat = (p: RoundPlayer): Seat => ({ playerId: p.id, hand: [], jokers: p.jokers.slice(), slots: [null, null] });
  const round: RoundState = {
    month,
    seats: [seat(players[0]), seat(players[1])],
    deck: rng.shuffle(fullDeck()),
    community: [],
    communityJoker: null,
    street: 0,
    discards: [],
    history: [],
    result: null,
  };

  if (config.jokerMode === 'slot' && month > 1 && pool.length > 0 && rng.next() < config.communityJokerChance) {
    round.communityJoker = takeFromPool(pool, rng);
  }

  dealStreet(round, config);

  if (config.jokerMode === 'shuffled') {
    const count = Math.min(pool.length, Math.floor((month - 1) / config.shuffledJokerEveryMonths));
    const jokers: Card[] = [];
    for (let i = 0; i < count; i++) jokers.push(takeFromPool(pool, rng));
    round.deck = rng.shuffle([...round.deck, ...jokers]);
  }
  return round;
}

function takeFromPool(pool: JokerCard[], rng: Rng): JokerCard {
  return pool.splice(rng.int(pool.length), 1)[0];
}

function draw(round: RoundState): Card {
  const card = round.deck.pop();
  if (!card) throw new Error('Deck is empty');
  return card;
}

function drawToSeat(round: RoundState, seat: Seat) {
  const card = draw(round);
  if (isJoker(card)) seat.jokers.push(card);
  else seat.hand.push(card);
}

function dealStreet(round: RoundState, config: RulesConfig) {
  round.community.push(draw(round));
  const n = DEAL_SCHEDULE[config.dealMode][round.street];
  for (let i = 0; i < n; i++) for (const seat of round.seats) drawToSeat(round, seat);
}

export function legalActions(round: RoundState, seatIndex: number): Action[] {
  return legalSeatActions(round.seats[seatIndex], round.deck.length);
}

export function legalSeatActions(seat: Pick<Seat, 'hand' | 'jokers' | 'slots'>, deckSize: number): Action[] {
  const actions: Action[] = [{ type: 'pass' }];
  const placeable: Card[] = [...seat.hand];
  // All Jokers are interchangeable for play, so one representative is enough.
  if (seat.jokers.length) placeable.push(seat.jokers[0]);
  for (const card of placeable) {
    for (const slot of [0, 1] as const) {
      // Swapping a Joker for a Joker changes nothing.
      if (isJoker(card) && isJoker(seat.slots[slot])) continue;
      actions.push({ type: 'place', cardId: card.id, slot });
    }
  }
  if (deckSize > 0) for (const card of seat.hand) actions.push({ type: 'discard', cardId: card.id });
  return actions;
}

export function isLegal(round: RoundState, seatIndex: number, action: Action): boolean {
  const seat = round.seats[seatIndex];
  if (action.type === 'pass') return true;
  if (action.type === 'discard') return round.deck.length > 0 && seat.hand.some((c) => c.id === action.cardId);
  return seat.hand.some((c) => c.id === action.cardId) || seat.jokers.some((c) => c.id === action.cardId);
}

function applyAction(round: RoundState, seat: Seat, action: Action) {
  if (action.type === 'pass') return;
  if (action.type === 'discard') {
    const i = seat.hand.findIndex((c) => c.id === action.cardId);
    round.discards.push(...seat.hand.splice(i, 1));
    drawToSeat(round, seat);
    return;
  }
  let card: Card;
  const hi = seat.hand.findIndex((c) => c.id === action.cardId);
  if (hi >= 0) card = seat.hand.splice(hi, 1)[0];
  else card = seat.jokers.splice(seat.jokers.findIndex((c) => c.id === action.cardId), 1)[0];
  returnToHand(seat, seat.slots[action.slot]);
  seat.slots[action.slot] = card;
}

function returnToHand(seat: Seat, card: Card | null) {
  if (!card) return;
  if (isJoker(card)) seat.jokers.push(card);
  else seat.hand.push(card);
}

/**
 * Applies both players' secret actions simultaneously, then deals the next
 * street or resolves the showdown.
 */
export function resolveStreet(round: RoundState, actions: [Action, Action], config: RulesConfig) {
  if (round.street > 2) throw new Error('Round is over');
  actions.forEach((a, i) => {
    if (!isLegal(round, i, a)) throw new Error(`Illegal action for seat ${i}: ${JSON.stringify(a)}`);
  });
  actions.forEach((a, i) => applyAction(round, round.seats[i], a));
  round.history.push({ street: round.street, actions });
  round.street++;
  if (round.street <= 2) dealStreet(round, config);
  else showdown(round, config);
}

export function handInPlay(round: RoundState, seatIndex: number): HandValue {
  return evaluate([...round.seats[seatIndex].slots, ...round.community]);
}

function showdown(round: RoundState, config: RulesConfig) {
  const hands: [HandValue, HandValue] = [handInPlay(round, 0), handInPlay(round, 1)];
  const cmp = compareHands(hands[0], hands[1]);
  const winner: 0 | 1 | null = cmp > 0 ? 0 : cmp < 0 ? 1 : null;

  const communityJokers = round.community.filter(isJoker);
  if (round.communityJoker) communityJokers.push(round.communityJoker);
  const placed = round.seats.map((s) => s.slots.filter(isJoker));
  const returnedToPool = round.deck.filter(isJoker);

  let dumped: JokerCard[] = [];
  let communityTaken: JokerCard[] = [];
  if (winner === null) {
    round.seats.forEach((s, i) => s.jokers.push(...placed[i]));
    returnedToPool.push(...communityJokers);
  } else {
    const loser = round.seats[1 - winner];
    dumped = placed[winner];
    communityTaken = communityJokers;
    loser.jokers.push(...dumped, ...placed[1 - winner], ...communityTaken);
  }

  round.result = {
    winner,
    hands,
    gain: winner === null ? 0 : config.winGain[hands[winner].category],
    dumped,
    communityTaken,
    returnedToPool,
  };
}
