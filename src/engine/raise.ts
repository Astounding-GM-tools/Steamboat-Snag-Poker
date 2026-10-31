/**
 * The River raise at a High Rollers table, for the AI captains: how likely a
 * laid hand is to beat everyone still in, and what each personality does
 * with that: raise, or (facing a raise) match or fold.
 */
import { fullDeck, type Card } from './cards';
import type { AiId } from './characters';
import { bestScore } from './evaluate';
import type { Rng } from './rng';
import { inHand, type TableRound } from './table';

/**
 * How readily each style raises (from this chance of winning, plus a bluff
 * now and then) and how much it takes to make it match: it matches when its
 * chance beats the price of staying in (the raise over the pot it would
 * then be playing for) times `nerve`. Bill matches everything.
 */
const STYLE: Partial<Record<AiId, { raiseAt: number; bluff: number; nerve: number; always?: boolean }>> = {
  stubborn: { raiseAt: 0.6, bluff: 0, nerve: 0, always: true }, // Bill: never folds
  loose: { raiseAt: 0.45, bluff: 0.12, nerve: 0.75 }, // Finlay, Jim-Bob
  defeatist: { raiseAt: 0.75, bluff: 0, nerve: 1.6 }, // Lenny
  shark: { raiseAt: 0.55, bluff: 0.04, nerve: 1 }, // the Walrus
  gambler: { raiseAt: 0.5, bluff: 0.08, nerve: 1 }, // Gaylord
  predator: { raiseAt: 0.5, bluff: 0.06, nerve: 0.9 }, // Eliza
  careful: { raiseAt: 0.6, bluff: 0, nerve: 1 }, // Morag
};
const style = (ai: AiId) => STYLE[ai] ?? STYLE.careful!;

/**
 * A laid hand's chance of beating every other hand still in. Each unseen
 * hand is drawn from the cards not on show; a captain who's been swapping has
 * chosen well, so it plays the best three of five. Against several, as if
 * each were independent.
 */
export function raiseChance(round: TableRound, seat: number, laid: readonly (Card | null)[], rng: Rng, samples = 60): number {
  const others = inHand(round).filter((i) => i !== seat).length;
  if (!others) return 1;
  const mine = bestScore(laid, round.community, { min: laid.length, max: laid.length });
  const shown = new Set([...round.seats[seat].hand, ...round.seats[seat].slots, ...round.community, ...round.discards].map((c) => c?.id));
  const pool = fullDeck().filter((c) => !shown.has(c.id));
  let wins = 0;
  for (let s = 0; s < samples; s++) {
    const hole = rng.shuffle(pool).slice(0, 5);
    const theirs = bestScore(hole, round.community, { min: 0, max: 3 });
    wins += mine > theirs ? 1 : mine === theirs ? 0.5 : 0;
  }
  return Math.pow(wins / samples, others);
}

/** Where a captain stands going into The Last Hand: the leader guards a lead, the short stack has nothing left to guard. */
export type Standing = 'leader' | 'short' | null;

export function wantsRaise(ai: AiId, chance: number, rng: Rng): boolean {
  const s = style(ai);
  return chance >= s.raiseAt || rng.next() < s.bluff;
}

/** Facing a raise: match it (true) or fold. */
export function wantsMatch(ai: AiId, chance: number, raise: number, pot: number, standing: Standing = null): boolean {
  const s = style(ai);
  if (s.always) return true;
  const nerve = s.nerve * (standing === 'leader' ? 1.5 : standing === 'short' ? 0.5 : 1);
  return chance >= (raise / (pot + raise)) * nerve;
}
