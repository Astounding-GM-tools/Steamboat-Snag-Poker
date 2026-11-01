/**
 * Showdown drama: the order in which a seat's played cards are turned over,
 * and the hand they make with the board so far. The cards that make the
 * revealed hand look best come first, then any snags, and the card that
 * decides the duel last.
 */
import { isJoker, isStd, type Card, type StdCard } from './cards';
import { bestHand, bestScore, type HandValue } from './evaluate';
import type { RoundState } from './round';

export interface RevealStep {
  card: Card;
  /** The best hand from the cards revealed so far plus the board. */
  hand: HandValue;
  /** Board cards that hand uses. */
  boardUsed: string[];
}

const exact = (n: number) => ({ min: n, max: n });

/** Plans the reveal of `revealSeat`'s played cards, as seen by `viewer` (in a duel, the other seat). */
export function planReveal(round: RoundState, revealSeat: number, viewer = revealSeat === 0 ? 1 : 0): RevealStep[] {
  const board = round.community;
  const played = round.seats[revealSeat].played;
  const viewerSeat = round.seats[viewer];
  const viewerScore = bestScore(viewerSeat.played, board, exact(viewerSeat.played.length));
  const real = played.filter(isStd);
  const jokers = played.filter(isJoker);
  const finalScore = bestScore(played, board, exact(played.length));
  const outcome = Math.sign(viewerScore - finalScore);

  // The pivot: the real card whose absence would flip the duel (or change the hand most).
  let pivot: StdCard | null = null;
  let pivotWeight = -Infinity;
  for (const c of real) {
    const without = bestScore(played.filter((x) => x !== c), board, exact(played.length - 1));
    const flips = Math.sign(viewerScore - without) !== outcome;
    const weight = (flips ? 1e12 : 0) + Math.abs(finalScore - without);
    if (weight > pivotWeight) {
      pivotWeight = weight;
      pivot = c;
    }
  }

  // Teasers, greedily: each next card is the one that makes the revealed hand look best.
  const order: Card[] = [];
  const rest = real.filter((c) => c !== pivot);
  while (rest.length) {
    let bi = 0;
    let bs = -1;
    rest.forEach((c, i) => {
      const s = bestScore([...order, c], board, exact(order.length + 1));
      if (s > bs) (bs = s), (bi = i);
    });
    order.push(rest.splice(bi, 1)[0]);
  }
  order.push(...jokers);
  if (pivot) order.push(pivot);

  return order.map((card, i): RevealStep => {
    const shown = order.slice(0, i + 1);
    const hand = bestHand(shown, board, exact(shown.length));
    const used = new Set(hand.cards.map((c) => c.id));
    return { card, hand, boardUsed: board.filter((c) => used.has(c.id)).map((c) => c.id) };
  });
}
