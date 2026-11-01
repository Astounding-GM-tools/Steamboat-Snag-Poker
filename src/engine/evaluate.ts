import { isStd, suitValue, type Card, type StdCard } from './cards';

export const CATEGORIES = [
  'highCard',
  'pair',
  'twoPair',
  'threeOfAKind',
  'straight',
  'flush',
  'fullHouse',
  'fourOfAKind',
  'straightFlush',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface HandValue {
  category: Category;
  /**
   * Single comparable number: category, then ranks (group ranks, kickers), then
   * suits card-by-card (♣ < ♦ < ♥ < ♠). Dead cards count as nothing, so fewer
   * real cards lose once everything else is equal.
   */
  score: number;
  /** The real (non-Joker) cards used, sorted highest first. */
  cards: StdCard[];
}

export interface OwnCardRule {
  min: number;
  max: number;
}

const R1 = 15, R2 = R1 * 15, R3 = R2 * 15, R4 = R3 * 15, R5 = R4 * 15;
const RANK_W = [R4, R3, R2, R1, 1];
const SUIT_W = [256, 64, 16, 4, 1];

// Scratch buffers: scoring runs millions of times inside the AI's simulations.
const rk = new Int8Array(5);
const st = new Int8Array(5);
const counts = new Int8Array(15);
const groups = new Int8Array(5);

/** The cards scored so far, sorted as they come: rank down, then suit down. */
let n = 0;

/** One real card into the hand being scored (insertion sort: rank desc, then suit desc). */
function add(r: number, sv: number) {
  if (n === 5) throw new Error('At most 5 real cards can be evaluated');
  let j = n++;
  while (j > 0 && (rk[j - 1] < r || (rk[j - 1] === r && st[j - 1] < sv))) {
    rk[j] = rk[j - 1];
    st[j] = st[j - 1];
    j--;
  }
  rk[j] = r;
  st[j] = sv;
}

/** The score of the cards added since `n` was last set to 0. */
function finish(): number {
  for (let i = 0; i < n; i++) counts[rk[i]]++;
  let g = 0;
  for (let c = 4; c >= 1; c--) for (let i = 0; i < n; i++) if (counts[rk[i]] === c && (g === 0 || groups[g - 1] !== rk[i])) groups[g++] = rk[i];
  const top = g > 0 ? counts[groups[0]] : 0;
  const second = g > 1 ? counts[groups[1]] : 0;
  for (let i = 0; i < n; i++) counts[rk[i]] = 0;

  const isFlush = n === 5 && st[0] === st[1] && st[0] === st[2] && st[0] === st[3] && st[0] === st[4];
  let straightHigh = 0;
  if (n === 5 && g === 5) {
    if (rk[0] - rk[4] === 4) straightHigh = rk[0];
    else if (rk[0] === 14 && rk[1] === 5) straightHigh = 5; // the wheel
  }

  let cat: number;
  if (straightHigh && isFlush) cat = 8;
  else if (top === 4) cat = 7;
  else if (top === 3 && second === 2) cat = 6;
  else if (isFlush) cat = 5;
  else if (straightHigh) cat = 4;
  else if (top === 3) cat = 3;
  else if (top === 2 && second === 2) cat = 2;
  else if (top === 2) cat = 1;
  else cat = 0;

  let score = cat * R5;
  if (cat === 8 || cat === 4) score += straightHigh * RANK_W[0];
  else for (let i = 0; i < g; i++) score += groups[i] * RANK_W[i];
  score *= 1024;
  for (let i = 0; i < n; i++) score += st[i] * SUIT_W[i];
  return score;
}

/**
 * Scores up to 5 cards as one comparable number: category, then ranks (group
 * ranks, kickers), then suits card-by-card (♣ < ♦ < ♥ < ♠). Jokers and nulls
 * are dead, so fewer real cards lose once everything else is equal.
 * Straights and flushes need 5 real cards.
 */
export function scoreCards(inPlay: readonly (Card | null)[]): number {
  n = 0;
  for (let i = 0; i < inPlay.length; i++) {
    const c = inPlay[i];
    if (c && c.kind === 'std') add(c.rank, suitValue(c.suit));
  }
  return finish();
}

export function categoryOf(score: number): Category {
  return CATEGORIES[Math.floor(score / 1024 / R5)];
}

export function evaluate(inPlay: readonly (Card | null)[]): HandValue {
  const score = scoreCards(inPlay);
  const cards = inPlay.filter(isStd).sort((a, b) => b.rank - a.rank || suitValue(b.suit) - suitValue(a.suit));
  return { category: categoryOf(score), score, cards };
}

/** Positive if a beats b, negative if b beats a, 0 only for identical real cards. */
export function compareHands(a: HandValue, b: HandValue): number {
  return a.score - b.score;
}

const comboCache = new Map<string, number[][]>();

/** All k-element index combinations of 0..n-1 (cached). */
function indexCombos(n: number, k: number): number[][] {
  const key = n * 16 + k + '';
  let out = comboCache.get(key);
  if (out) return out;
  out = [];
  const pick: number[] = [];
  const go = (start: number) => {
    if (pick.length === k) return void out!.push(pick.slice());
    for (let i = start; i <= n - (k - pick.length); i++) {
      pick.push(i);
      go(i + 1);
      pick.pop();
    }
  };
  go(0);
  comboCache.set(key, out);
  return out;
}

/** A search's cards as numbers, read once rather than for every combination: rank (0 for a dead card) and suit. */
let ownR = new Int8Array(8);
let ownS = new Int8Array(8);
let boardR = new Int8Array(8);
let boardS = new Int8Array(8);
function load(cards: readonly (Card | null)[], r: Int8Array, s: Int8Array) {
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (c && c.kind === 'std') {
      r[i] = c.rank;
      s[i] = suitValue(c.suit);
    } else r[i] = 0;
  }
}

/**
 * Searches every legal 5-card hand: between `rule.min` and `rule.max` of the
 * player's own cards (snags, or nulls, count as dead cards) and the rest from
 * the community. While the board is incomplete, missing board cards
 * count as dead. Calls `visit` with the cards for the best one if given.
 */
export function bestScore(own: readonly (Card | null)[], board: readonly Card[], rule: OwnCardRule, visit?: (cards: (Card | null)[]) => void): number {
  if (own.length > ownR.length) (ownR = new Int8Array(own.length)), (ownS = new Int8Array(own.length));
  if (board.length > boardR.length) (boardR = new Int8Array(board.length)), (boardS = new Int8Array(board.length));
  load(own, ownR, ownS);
  load(board, boardR, boardS);
  let best = -1;
  let bestPick: number[] | null = null;
  let bestBoard: number[] | null = null;
  const minOwn = Math.min(rule.min, own.length);
  const maxOwn = Math.min(rule.max, own.length, 5);
  for (let k = minOwn; k <= maxOwn; k++) {
    const boardSets = indexCombos(board.length, Math.min(5 - k, board.length));
    for (const pick of indexCombos(own.length, k)) {
      for (const fromBoard of boardSets) {
        n = 0;
        for (const i of pick) if (ownR[i]) add(ownR[i], ownS[i]);
        for (const i of fromBoard) if (boardR[i]) add(boardR[i], boardS[i]);
        const s = finish();
        if (s > best) {
          best = s;
          bestPick = pick;
          bestBoard = fromBoard;
        }
      }
    }
  }
  if (visit && bestPick && bestBoard) visit([...bestPick.map((i) => own[i]), ...bestBoard.map((i) => board[i])]);
  return Math.max(best, 0);
}

/** Like bestScore, but returns the full HandValue (for display and showdown). */
export function bestHand(own: readonly (Card | null)[], board: readonly Card[], rule: OwnCardRule): HandValue {
  let cards: (Card | null)[] = [];
  bestScore(own, board, rule, (c) => (cards = c));
  return evaluate(cards);
}
