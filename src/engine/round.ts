/**
 * One month's duel between two seats. These functions mutate the round they are
 * given; the public game API (game.ts) clones state before calling them.
 */
import { fullDeck, isJoker, type Card, type JokerCard, type StdCard } from './cards';
import type { PlayStyle, RulesConfig } from './config';
import { bestHand, compareHands, type HandValue } from './evaluate';
import type { Rng } from './rng';

export type SlotIndex = number;

export type Action =
  | { type: 'place'; cardId: string; slot: SlotIndex }
  | { type: 'discard'; cardId: string }
  | { type: 'pass' }
  /** Draw style: discard these cards and draw replacements (none = stand pat). */
  | { type: 'draw'; cardIds: string[] }
  /** Draw style, after the River: the hand cards and number of Jokers you play. */
  | { type: 'compose'; cardIds: string[]; jokers: number };

export interface Seat {
  playerId: string;
  hand: StdCard[];
  /** Owned Jokers not currently in a slot. They never take hand space. */
  jokers: JokerCard[];
  /** Slots style: the play slots. Draw style: empty until composed, then the cards played. */
  slots: (Card | null)[];
  /** Cards this seat discarded this round (face up). */
  discarded: StdCard[];
}

export const STREETS = ['flop', 'turn', 'river'] as const;
export type StreetName = (typeof STREETS)[number];

export interface RoundResult {
  /** Seat index of the winner, or null for a true draw. */
  winner: 0 | 1 | null;
  hands: [HandValue, HandValue];
  gain: number;
  /** Extra the loser pays the winner for the Jokers they risked and lost with. */
  forfeit: number;
  /** Jokers the winner dumped on the loser. */
  dumped: JokerCard[];
  /** Community Jokers the loser had to take. */
  communityTaken: JokerCard[];
  /** Jokers that went back to the unowned pool. */
  returnedToPool: JokerCard[];
}

export interface RoundState {
  month: number;
  playStyle: PlayStyle;
  seats: [Seat, Seat];
  deck: Card[];
  /** Revealed community cards (in shuffled mode one may be a dead Joker). */
  community: Card[];
  /** Slot mode: the Joker in the fourth community slot, if any. */
  communityJoker: JokerCard | null;
  /** 0..2 on the streets (draw style composes on the River); 3 once a slots-style showdown is done. */
  street: number;
  discards: StdCard[];
  history: { street: number; actions: [Action, Action] }[];
  /** Jokers drawn from the deck by a player this round (shuffled Joker mode). */
  fished: { seat: number; street: number; joker: JokerCard }[];
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
  const seat = (p: RoundPlayer): Seat => ({
    playerId: p.id,
    hand: [],
    jokers: p.jokers.slice(),
    slots: config.playStyle === 'slots' ? Array.from({ length: config.slotCount }, () => null) : [],
    discarded: [],
  });
  const round: RoundState = {
    month,
    playStyle: config.playStyle,
    seats: [seat(players[0]), seat(players[1])],
    deck: rng.shuffle(fullDeck()),
    community: [],
    communityJoker: null,
    street: 0,
    discards: [],
    history: [],
    fished: [],
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

/**
 * Draws one card for a seat. A Joker fished out of the deck becomes the seat's
 * Joker; in the draw style the seat then draws again, so the hand never
 * shrinks (catching the Joker is penalty enough).
 */
function drawToSeat(round: RoundState, seat: Seat) {
  while (round.deck.length) {
    const card = draw(round);
    if (!isJoker(card)) {
      seat.hand.push(card);
      return;
    }
    seat.jokers.push(card);
    round.fished.push({ seat: round.seats.indexOf(seat), street: round.street, joker: card });
    if (round.playStyle !== 'draw') return;
  }
}

function dealStreet(round: RoundState, config: RulesConfig) {
  for (let i = 0; i < config.communitySchedule[round.street]; i++) round.community.push(draw(round));
  const n = config.dealSchedule[round.street];
  for (let i = 0; i < n; i++) for (const seat of round.seats) drawToSeat(round, seat);
}

export function legalActions(round: RoundState, seatIndex: number): Action[] {
  const seat = round.seats[seatIndex];
  if (round.playStyle === 'draw') {
    const ids = seat.hand.map((c) => c.id);
    if (isComposing(round)) {
      return subsets(ids).flatMap((cardIds) =>
        Array.from({ length: Math.min(seat.jokers.length, 5 - cardIds.length) + 1 }, (_, jokers): Action => ({ type: 'compose', cardIds, jokers })),
      );
    }
    return subsets(ids)
      .filter((cardIds) => cardIds.length <= round.deck.length)
      .map((cardIds): Action => ({ type: 'draw', cardIds }));
  }
  return legalSeatActions(seat, round.deck.length);
}

/** All subsets of a small list, smallest first. */
export function subsets<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 0; mask < 1 << items.length; mask++) out.push(items.filter((_, i) => mask & (1 << i)));
  return out.sort((a, b) => a.length - b.length);
}

/** Draw style: true on the River, where hands are composed (no discarding there). */
export function isComposing(round: RoundState): boolean {
  return round.playStyle === 'draw' && round.street === 2 && !round.result;
}

/** Every action except passing; passing is only allowed when nothing else is. */
export function legalSeatActions(seat: Pick<Seat, 'hand' | 'jokers' | 'slots'>, deckSize: number): Action[] {
  const actions: Action[] = [];
  const placeable: Card[] = [...seat.hand];
  // All Jokers are interchangeable for play, so one representative is enough.
  if (seat.jokers.length) placeable.push(seat.jokers[0]);
  for (const card of placeable) {
    for (let slot = 0; slot < seat.slots.length; slot++) {
      // Swapping a Joker for a Joker changes nothing.
      if (isJoker(card) && isJoker(seat.slots[slot])) continue;
      actions.push({ type: 'place', cardId: card.id, slot });
    }
  }
  if (deckSize > 0) for (const card of seat.hand) actions.push({ type: 'discard', cardId: card.id });
  return actions.length ? actions : [{ type: 'pass' }];
}

export function isLegal(round: RoundState, seatIndex: number, action: Action): boolean {
  const seat = round.seats[seatIndex];
  if (round.playStyle === 'draw') {
    if (action.type !== (isComposing(round) ? 'compose' : 'draw')) return false;
    const ids = action.cardIds;
    if (new Set(ids).size !== ids.length || !ids.every((id) => seat.hand.some((c) => c.id === id))) return false;
    if (action.type === 'draw') return ids.length <= round.deck.length;
    return Number.isInteger(action.jokers) && action.jokers >= 0 && action.jokers <= seat.jokers.length && ids.length + action.jokers <= 5;
  }
  if (action.type === 'draw' || action.type === 'compose') return false;
  if (action.type === 'pass') return legalActions(round, seatIndex)[0].type === 'pass';
  if (action.type === 'place' && !(action.slot >= 0 && action.slot < seat.slots.length)) return false;
  if (action.type === 'discard') return round.deck.length > 0 && seat.hand.some((c) => c.id === action.cardId);
  return seat.hand.some((c) => c.id === action.cardId) || seat.jokers.some((c) => c.id === action.cardId);
}

function discardCard(round: RoundState, seat: Seat, cardId: string) {
  const [card] = seat.hand.splice(seat.hand.findIndex((c) => c.id === cardId), 1);
  round.discards.push(card);
  seat.discarded.push(card);
}

function applyAction(round: RoundState, seat: Seat, action: Action) {
  if (action.type === 'pass') return;
  if (action.type === 'discard') {
    discardCard(round, seat, action.cardId);
    drawToSeat(round, seat);
    return;
  }
  if (action.type === 'draw') {
    for (const id of action.cardIds) discardCard(round, seat, id);
    for (let i = 0; i < action.cardIds.length; i++) drawToSeat(round, seat);
    return;
  }
  if (action.type === 'compose') {
    seat.slots = [
      ...action.cardIds.map((id) => seat.hand.find((c) => c.id === id)!),
      ...seat.jokers.splice(0, action.jokers),
    ];
    seat.hand = seat.hand.filter((c) => !action.cardIds.includes(c.id));
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
  if (round.result) throw new Error('Round is over');
  actions.forEach((a, i) => {
    if (!isLegal(round, i, a)) throw new Error(`Illegal action for seat ${i}: ${JSON.stringify(a)}`);
  });
  actions.forEach((a, i) => applyAction(round, round.seats[i], a));
  round.history.push({ street: round.street, actions });
  if (round.playStyle === 'draw' && round.street === 2) return showdown(round, config); // hands composed
  round.street++;
  if (round.street <= 2) dealStreet(round, config);
  else showdown(round, config);
}

/** The own-card rule for a seat: draw style uses exactly the cards played. */
export function ownCardRule(round: RoundState, seatIndex: number, config: RulesConfig) {
  if (round.playStyle === 'slots') return config.ownCards;
  const n = round.seats[seatIndex].slots.length;
  return { min: n, max: n };
}

export function handInPlay(round: RoundState, seatIndex: number, config: RulesConfig): HandValue {
  return bestHand(round.seats[seatIndex].slots, round.community, ownCardRule(round, seatIndex, config));
}

function showdown(round: RoundState, config: RulesConfig) {
  const hands: [HandValue, HandValue] = [handInPlay(round, 0, config), handInPlay(round, 1, config)];
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
    forfeit: winner === null ? 0 : placed[1 - winner].length * (config.jokerForfeit ?? 0),
    dumped,
    communityTaken,
    returnedToPool,
  };
}
