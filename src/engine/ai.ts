/**
 * Opponent AIs. Each AI only sees a SeatView: its own cards, the board and what
 * the other player has revealed — never the other player's hand.
 */
import { fullDeck, isJoker, isStd, type Card, type JokerCard, type StdCard } from './cards';
import type { AiId } from './characters';
import type { RulesConfig } from './config';
import { bestScore, categoryOf, type OwnCardRule } from './evaluate';
import { legalSeatActions, type Action, type RoundState } from './round';
import type { Rng } from './rng';

export interface SeatView {
  street: number;
  hand: StdCard[];
  jokers: JokerCard[];
  slots: (Card | null)[];
  community: Card[];
  communityJoker: JokerCard | null;
  opponentSlots: (Card | null)[];
  opponentHandSize: number;
  opponentJokerCount: number;
  discards: StdCard[];
  deckSize: number;
}

export function viewFor(round: RoundState, seatIndex: number): SeatView {
  const me = round.seats[seatIndex];
  const them = round.seats[1 - seatIndex];
  return {
    street: round.street,
    hand: me.hand,
    jokers: me.jokers,
    slots: me.slots,
    community: round.community,
    communityJoker: round.communityJoker,
    opponentSlots: them.slots,
    opponentHandSize: them.hand.length,
    opponentJokerCount: them.jokers.length + them.slots.filter(isJoker).length,
    discards: round.discards,
    deckSize: round.deck.length,
  };
}

export function chooseAction(ai: AiId, view: SeatView, config: RulesConfig, rng: Rng): Action {
  switch (ai) {
    case 'pete':
      return peteAction(view);
    case 'felix':
      return randomAction(view, rng, 3);
    case 'willie':
      return rng.next() < 0.65 ? randomAction(view, rng, 1) : smartAction(view, config, rng, { samples: 25, jokerBold: 1, noise: 1 });
    case 'betty':
      return smartAction(view, config, rng, { samples: 30, jokerBold: 0.3, noise: 2 });
    case 'sherlock':
      return smartAction(view, config, rng, { samples: 60, jokerBold: 1, noise: 0 });
  }
}

/** Pete: always wants the highest card on the table, never touches Jokers. */
function peteAction(view: SeatView): Action {
  const best = [...view.hand].sort((a, b) => b.rank - a.rank)[0];
  const worst = [...view.hand].sort((a, b) => a.rank - b.rank)[0];
  if (!best) return legalSeatActions(view, view.deckSize)[0];
  const empty = view.slots.findIndex((s) => s === null);
  if (empty >= 0) return { type: 'place', cardId: best.id, slot: empty };
  const worth = (c: Card | null) => (isStd(c) ? c.rank : 0);
  let weakest = 0;
  view.slots.forEach((c, i) => {
    if (worth(c) < worth(view.slots[weakest])) weakest = i;
  });
  if (best.rank > worth(view.slots[weakest])) return { type: 'place', cardId: best.id, slot: weakest };
  // Nothing worth playing: throw away the smallest card.
  return view.deckSize > 0 ? { type: 'discard', cardId: worst.id } : legalSeatActions(view, view.deckSize)[0];
}

/**
 * Random legal action; Joker placements weighted by `jokerWeight`. Even a
 * chaotic player usually fills an empty slot rather than wasting the street.
 */
function randomAction(view: SeatView, rng: Rng, jokerWeight: number): Action {
  let actions = legalSeatActions(view, view.deckSize);
  const fills = actions.filter((a) => a.type === 'place' && view.slots[a.slot] === null);
  if (fills.length && rng.next() < 0.75) actions = fills;
  const weighted: Action[] = [];
  for (const a of actions) {
    const isJokerPlay = a.type === 'place' && view.jokers.some((j) => j.id === a.cardId);
    for (let i = 0; i < (isJokerPlay ? jokerWeight : 1); i++) weighted.push(a);
  }
  return rng.pick(weighted);
}

interface SmartOptions {
  samples: number;
  /** How much the AI values shedding a Joker (1 = rationally). */
  jokerBold: number;
  /** Random noise added to each action's utility. */
  noise: number;
}

/**
 * Monte Carlo: for each legal action, sample the unknown cards many times,
 * assume we greedily improve on later streets, and score the expected
 * Popularity outcome including Joker stakes.
 */
function smartAction(view: SeatView, config: RulesConfig, rng: Rng, opts: SmartOptions): Action {
  const actions = legalSeatActions(view, view.deckSize);
  const known = new Set<string>(
    [...view.hand, ...view.slots, ...view.community, ...view.opponentSlots, ...view.discards]
      .filter(isStd)
      .map((c) => c.id),
  );
  const unknown = fullDeck().filter((c) => !known.has(c.id));
  // A Joker's drain lasts until it is shed, so it is worth several rounds of drain.
  const jokerValue = config.drainPerJoker * 3;
  const stakes =
    (view.communityJoker ? 1 : 0) + view.community.filter(isJoker).length + view.opponentSlots.filter(isJoker).length;
  const futureStreets = 2 - view.street;
  const futureDeals = config.dealSchedule.slice(view.street + 1).reduce((a, b) => a + b, 0);
  const boardSize = config.communitySchedule.reduce((a, b) => a + b, 0);
  const rule = config.ownCards;

  let bestAction = actions[0];
  let topScore = -Infinity;
  for (const action of actions) {
    let total = 0;
    for (let s = 0; s < opts.samples; s++) {
      const pile = rng.shuffle(unknown);
      let hand = view.hand.slice();
      const slots = view.slots.slice() as (Card | null)[];
      if (action.type === 'discard') {
        hand = hand.filter((c) => c.id !== action.cardId);
        hand.push(pile.pop()!);
      } else if (action.type === 'place') {
        const card = hand.find((c) => c.id === action.cardId) ?? view.jokers.find((c) => c.id === action.cardId)!;
        hand = hand.filter((c) => c.id !== action.cardId);
        const old = slots[action.slot];
        if (isStd(old)) hand.push(old);
        slots[action.slot] = card;
      }
      const community = view.community.slice();
      while (community.length < boardSize) community.push(pile.pop()!);
      for (let i = 0; i < futureDeals; i++) hand.push(pile.pop()!);
      for (let i = 0; i < futureStreets; i++) greedyImprove(hand, slots, community, rule);

      const oppSlots = view.opponentSlots.map((c) => c ?? pile.pop()!);
      const mine = bestScore(slots, community, rule);
      const cmp = mine - bestScore(oppSlots, community, rule);
      const myJokers = slots.filter(isJoker).length;
      if (cmp > 0) total += config.winGain[categoryOf(mine)] + myJokers * jokerValue * opts.jokerBold;
      else if (cmp < 0) total -= stakes * jokerValue;
    }
    const score = total / opts.samples + (opts.noise ? (rng.next() - 0.5) * opts.noise : 0);
    if (score > topScore) {
      topScore = score;
      bestAction = action;
    }
  }
  return bestAction;
}

/** Makes the single best standard-card placement, if it improves the hand. */
function greedyImprove(hand: StdCard[], slots: (Card | null)[], community: Card[], rule: OwnCardRule) {
  let best = bestScore(slots, community, rule);
  // Fill empty slots first; only consider swaps once every slot is used.
  const empties = slots.flatMap((c, i) => (c === null ? [i] : []));
  const targets = empties.length ? empties : slots.map((_, i) => i);
  let move: { i: number; slot: number } | null = null;
  hand.forEach((card, i) => {
    for (const slot of targets) {
      if (isJoker(slots[slot])) continue; // keep a Joker we chose to play
      const trial = slots.slice();
      trial[slot] = card;
      const v = bestScore(trial, community, rule);
      if (v > best) {
        best = v;
        move = { i, slot };
      }
    }
  });
  if (move) {
    const { i, slot } = move;
    const old = slots[slot];
    slots[slot] = hand.splice(i, 1)[0];
    if (isStd(old)) hand.push(old);
  }
}
