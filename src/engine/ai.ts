/**
 * Opponent AIs. Each AI only sees a SeatView: its own cards, the board and what
 * the other player has revealed — never the other player's hand.
 */
import { fullDeck, isJoker, isStd, type Card, type JokerCard, type StdCard } from './cards';
import type { AiId } from './characters';
import type { RulesConfig } from './config';
import { bestScore, CATEGORIES, categoryOf, type Category, type OwnCardRule } from './evaluate';
import { canFold, feeFor, inHand, isComposing, subsets, type Action, type RoundState } from './round';
import { discardCost } from './pot';
import type { Rng } from './rng';

/**
 * What an AI sees: its own cards, the board, and the rest of the table still
 * in folded into one "opponent" (all their discards, the most snags any of
 * them holds), so the same AIs play a duel and a table of four.
 */
export interface SeatView {
  /** Hands are being made (the River). */
  composing: boolean;
  street: number;
  hand: StdCard[];
  jokers: JokerCard[];
  played: Card[];
  community: Card[];
  opponentPlayed: Card[];
  opponentHandSize: number;
  opponentJokerCount: number;
  discards: StdCard[];
  /** What the others have discarded this hand (face up). */
  opponentDiscarded: StdCard[];
  /** How many cards this seat has thrown away this crossing (discard fees rise with it). */
  discardedCount: number;
  month: number;
  /** Pot mode: the pot so far, the fees to see the Turn and the River, and whether this seat may still fold. */
  potMode: boolean;
  pot: number;
  fees: [number, number];
  canFold: boolean;
  /** Snags shuffled into the deck this crossing (public knowledge). */
  deckSnags: number;
  deckSize: number;
}

export function viewFor(round: RoundState, seat: number, config: RulesConfig): SeatView {
  const me = round.seats[seat];
  const others = inHand(round).filter((i) => i !== seat).map((i) => round.seats[i]);
  return {
    composing: isComposing(round),
    street: round.street,
    hand: me.hand,
    jokers: me.jokers,
    played: me.played,
    community: round.community,
    opponentPlayed: others.flatMap((s) => s.played),
    opponentHandSize: Math.max(0, ...others.map((s) => s.hand.length)),
    opponentJokerCount: Math.max(0, ...others.map((s) => s.jokers.length + s.played.filter(isJoker).length)),
    discards: round.discards,
    opponentDiscarded: others.flatMap((s) => s.discarded),
    discardedCount: me.discarded.length,
    month: round.month,
    potMode: round.potMode,
    pot: round.bets.reduce((a, b) => a + b, 0),
    fees: [feeFor(round, config, 1), feeFor(round, config, 2)],
    canFold: canFold(round, seat),
    deckSnags: round.deck.filter(isJoker).length,
    deckSize: round.deck.length,
  };
}

export function chooseAction(ai: AiId, view: SeatView, config: RulesConfig, rng: Rng): Action {
  return view.composing ? composeAction(ai, view, config, rng) : drawAction(ai, view, config, rng);
}

const ANY_OWN = (n: number): OwnCardRule => ({ min: 0, max: n });

/** Standard cards the viewer cannot see: candidates for the deck and the opponent's hand. */
function unseen(view: SeatView): StdCard[] {
  const known = new Set<string>(
    [...view.hand, ...view.played, ...view.community, ...view.opponentPlayed, ...view.discards].filter(isStd).map((c) => c.id),
  );
  return fullDeck().filter((c) => !known.has(c.id));
}

function boardSize(config: RulesConfig) {
  return config.communitySchedule.reduce((a, b) => a + b, 0);
}

/** Expected snag stakes against us if we lose: snags on the board plus a guess at what the opponent dares. */
function expectedStakes(view: SeatView) {
  return view.community.filter(isJoker).length + 0.3 * Math.min(view.opponentJokerCount, 2);
}

/** How readily each style folds in pot mode: fold when continuing is worth less than this share of the pot. */
const FOLD_BAR: Partial<Record<AiId, number>> = {
  careful: 0.1,
  gambler: 0,
  shark: -0.1,
  dreamer: 0,
  loose: -0.3,
  defeatist: 0.35, // Lenny folds at the first sign of trouble
  predator: 0.15, // Eliza only stays in with a reason
};

function drawAction(ai: AiId, view: SeatView, config: RulesConfig, rng: Rng): Action {
  const options = subsets(view.hand.map((c) => c.id)).filter((ids) => ids.length <= view.deckSize);
  const discard = (cards: Card[]): Action => ({ type: 'draw', cardIds: cards.map((c) => c.id).slice(0, view.deckSize) });
  switch (ai) {
    case 'bully':
      // Keeps his big cards, throws away anything below a ten.
      return discard(view.hand.filter((c) => isStd(c) && c.rank < 10));
    case 'stubborn':
      // Stands pat on anything that isn't truly hopeless.
      return discard(view.hand.filter((c) => isStd(c) && c.rank <= 4));
    case 'anarchist': {
      // Throw-happy: always chucks a card or two, usually the small ones.
      const low = [...view.hand].sort((x, y) => x.rank - y.rank);
      return discard(low.slice(0, rng.next() < 0.5 ? 1 : 2));
    }
    case 'clueless':
      return { type: 'draw', cardIds: rng.pick(options) };
    case 'prankster':
      return rng.next() < 0.7 ? { type: 'draw', cardIds: rng.pick(options) } : smartDraw(ai, view, config, rng, options, 15);
    case 'dreamer':
      return rng.next() < 0.5 ? { type: 'draw', cardIds: rng.pick(options) } : smartDraw(ai, view, config, rng, options, 40);
    case 'loose':
      return smartDraw(ai, view, config, rng, options, 15);
    case 'careful':
      return smartDraw(ai, view, config, rng, options, 40);
    case 'shark':
      return smartDraw(ai, view, config, rng, options, 30);
    case 'gambler':
      return smartDraw(ai, view, config, rng, options, 50);
    case 'predator':
      return smartDraw(ai, view, config, rng, options, 50);
    case 'defeatist':
      // Never chases: swaps one card at most.
      return smartDraw(ai, view, config, rng, options.filter((o) => o.length <= 1), 25);
    case 'swashbuckler':
      // Goes for the spectacular: big hands count for far more than small ones.
      return smartDraw(ai, view, config, rng, options, 30, 3);
    case 'griefer':
      // Never fishes while snags are in the deck: let someone else catch them.
      if (view.deckSnags > 0) return { type: 'draw', cardIds: [] };
      return smartDraw(ai, view, config, rng, options, 15);
    case 'clueless':
    case 'prankster':
      return { type: 'draw', cardIds: rng.pick(options) };
  }
}

/**
 * Monte Carlo over which cards to throw away, judged by the chance of winning
 * at showdown. In pot mode it weighs that chance against what the swap costs,
 * and folds when no option is worth paying for.
 */
function smartDraw(ai: AiId, view: SeatView, config: RulesConfig, rng: Rng, options: string[][], samples: number, ambition = 0): Action {
  const pool = unseen(view);
  const size = boardSize(config);
  const oppHandSize = view.opponentHandSize;
  const fee = view.fees[view.street] ?? 0;
  const laterFees = view.street === 0 ? view.fees[1] : 0;
  let best = options[0];
  let bestValue = -Infinity;
  for (const ids of options) {
    let wins = 0;
    for (let s = 0; s < samples; s++) {
      const pile = rng.shuffle(pool);
      const hand: Card[] = view.hand.filter((c) => !ids.includes(c.id));
      for (let i = 0; i < ids.length; i++) hand.push(pile.pop()!);
      const board = view.community.slice();
      while (board.length < size) board.push(pile.pop()!);
      const opp = pile.slice(-oppHandSize);
      const mine = bestScore(hand, board, ANY_OWN(hand.length));
      const theirs = bestScore(opp, board, ANY_OWN(opp.length));
      if (mine > theirs) {
        // Ambition: how much more a big hand is worth to this captain than a small one.
        const glory = 1 + (ambition * CATEGORIES.indexOf(categoryOf(mine))) / 8;
        wins += glory;
      }
    }
    let value: number;
    if (view.potMode) {
      // Expected pot at showdown: what's in it, plus both sides' fees from here on.
      const cost = fee + laterFees + discardCost(view.discardedCount, ids.length);
      const finalPot = view.pot + cost + fee + laterFees + 1;
      value = (wins / samples) * finalPot - cost;
    } else value = wins;
    if (value > bestValue) {
      bestValue = value;
      best = ids;
    }
  }
  const bar = FOLD_BAR[ai];
  if (view.potMode && view.canFold && bar !== undefined && bestValue < bar * view.pot) return { type: 'fold' };
  return { type: 'draw', cardIds: best };
}

interface Composition {
  cardIds: string[];
  jokers: number;
  score: number;
}

function compositions(view: SeatView): Composition[] {
  const out: Composition[] = [];
  for (const ids of subsets(view.hand.map((c) => c.id))) {
    const cards = view.hand.filter((c) => ids.includes(c.id));
    for (let j = 0; j <= Math.min(view.jokers.length, 5 - ids.length); j++) {
      const own: Card[] = [...cards, ...view.jokers.slice(0, j)];
      out.push({ cardIds: ids, jokers: j, score: bestScore(own, view.community, { min: own.length, max: own.length }) });
    }
  }
  return out;
}

const asAction = (c: Composition): Action => ({ type: 'compose', cardIds: c.cardIds, jokers: c.jokers });

function composeAction(ai: AiId, view: SeatView, config: RulesConfig, rng: Rng): Action {
  const options = compositions(view);
  const strongest = (list: Composition[]) => list.reduce((a, b) => (b.score > a.score ? b : a));
  const noJokers = options.filter((o) => o.jokers === 0);
  switch (ai) {
    case 'bully':
      return asAction(strongest(noJokers));
    case 'clueless': {
      // Believes snags make a hand stronger, so in they all go.
      const ids = rng.pick(subsets(view.hand.map((c) => c.id)));
      return { type: 'compose', cardIds: ids, jokers: Math.min(view.jokers.length, 5 - ids.length) };
    }
    case 'anarchist': {
      // Plays his best hand — and now and then hurls every Joker he has at you.
      const best = strongest(noJokers);
      if (view.jokers.length && rng.next() < 0.35) {
        return { type: 'compose', cardIds: best.cardIds, jokers: Math.min(view.jokers.length, 5 - best.cardIds.length) };
      }
      return asAction(best);
    }
    case 'prankster':
      return asAction(rng.pick(options));
    case 'dreamer':
      return rng.next() < 0.5 ? asAction(rng.pick(options)) : smartCompose(view, config, rng, options, 150, 1);
    case 'stubborn':
      return smartCompose(view, config, rng, options, 80, 0.5);
    case 'loose':
      return smartCompose(view, config, rng, options, 60, 1.3);
    case 'careful':
      return smartCompose(view, config, rng, options, 200, 0.3);
    case 'shark':
      return smartCompose(view, config, rng, options, 150, 1.6);
    case 'gambler':
      return smartCompose(view, config, rng, options, 300, 1);
    case 'predator':
      // Patient all round, then merciless: loves to bury a beaten rival in snags.
      return smartCompose(view, config, rng, options, 300, 2);
    case 'defeatist':
      return smartCompose(view, config, rng, options, 120, 0.2);
    case 'swashbuckler':
      return smartCompose(view, config, rng, options, 100, 1.8);
    case 'griefer':
      // Gleefully puts snags in play, whatever the cost.
      return smartCompose(view, config, rng, options, 100, 2.5);
  }
}

/** Weighs each composition's chance of winning against the Jokers it could shed. */
function smartCompose(view: SeatView, config: RulesConfig, rng: Rng, options: Composition[], samples: number, jokerBold: number): Action {
  const pool = unseen(view);
  const theirs: number[] = [];
  for (let s = 0; s < samples; s++) {
    const opp = rng.shuffle(pool).slice(0, view.opponentHandSize);
    theirs.push(bestScore(opp, view.community, ANY_OWN(opp.length)));
  }
  const jokerValue = config.drainPerJoker * 3;
  const stakes = expectedStakes(view);
  let best = options[0];
  let bestValue = -Infinity;
  for (const o of options) {
    const pWin = theirs.filter((t) => o.score > t).length / samples;
    const forfeit = o.jokers * (config.jokerForfeit ?? 0);
    // Without a pot (a lesson), winning is its own reward.
    const prize = view.potMode ? view.pot : 10;
    const value = pWin * (prize + o.jokers * jokerValue * jokerBold) - (1 - pWin) * (stakes * jokerValue + forfeit);
    if (value > bestValue) {
      bestValue = value;
      best = o;
    }
  }
  return asAction(best);
}

export interface OpponentOdds {
  /** Chance the opponent's best possible hand (without Jokers) is each category. */
  categories: Record<Category, number>;
  /** Chance their best possible hand beats your best possible hand (both without Jokers). */
  beatsYou: number;
}

/**
 * The hint: what could the other player be holding? Uses only what the viewer
 * can see — the board, all discards and the opponent's hand size.
 */
export function opponentOdds(view: SeatView, config: RulesConfig, rng: Rng, samples = 400): OpponentOdds {
  const pool = unseen(view);
  const size = boardSize(config);
  const categories = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  let beats = 0;
  for (let s = 0; s < samples; s++) {
    const pile = rng.shuffle(pool);
    const opp = pile.splice(0, view.opponentHandSize);
    const board = view.community.slice();
    while (board.length < size) board.push(pile.pop()!);
    const theirs = bestScore(opp, board, ANY_OWN(opp.length));
    categories[categoryOf(theirs)] += 1 / samples;
    if (theirs > bestScore(view.hand, board, ANY_OWN(view.hand.length))) beats++;
  }
  return { categories, beatsYou: beats / samples };
}
