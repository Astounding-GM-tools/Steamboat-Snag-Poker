/**
 * Money on the table (and the deal's pace), shared by the tables. It moves one purse at a time,
 * heavily: a seat's coins leave from where they stood in its purse and land
 * on the pot's next spots (`[data-k]`), and only when the last has landed does
 * the next purse pour. At the verdict the pot flies to the winners, onto the
 * spots their purses have laid out for what they won (`[data-g]`; purses keep
 * their stacks from hand to hand, so that's where the coins stay). Everything
 * waits its turn in one queue, which the speech and the buttons wait on; a
 * hurry lands whatever is in the air and lets the rest happen at once.
 */
import { flyInto, landAll, reducedMotion } from './coins';
import { flight } from './flight.svelte';

/** Only the last few dozen coins of a payment fly (the rest are simply there). */
const MAX_FLYERS = 40;
/** A coin's flight, and the beat between one coin and the next. */
const FLIGHT_MS = 650;
const POUR_MS = 70;

type Moves = [Element, HTMLElement][];

export interface CoinPlaces {
  /** A seat's purse (its coins carry `data-d`, the spots for winnings `data-g`). */
  purse: (seat: number) => HTMLElement | null | undefined;
  /** The pot (its spots carry `data-k`). */
  pot: () => HTMLElement | null | undefined;
  /** The flying coin's class (the lessons' buttons look different). */
  coinClass?: () => string | undefined;
}

export class CoinFlow {
  /** Flows waiting or under way, and anything else the table marks as busy: the buttons wait while there are any. */
  pending = $state(0);
  /** Hurrying: what's queued happens at once, without movement. */
  rushing = false;
  #flows: Promise<void> = Promise.resolve();
  /** Whose each coin in the pot is, in the order they landed. */
  #owners: number[] = [];

  constructor(private places: CoinPlaces) {}

  /** No movement just now: hurried, or the player prefers none. */
  get still(): boolean {
    return this.rushing || reducedMotion();
  }

  /** Everything queued so far, done. */
  get idle(): Promise<void> {
    return this.#flows;
  }

  /** A new hand: the pot is empty. */
  reset() {
    this.#owners = [];
  }

  /** The table is busy with something of its own (a replay, a showdown): `end` when it's done. */
  begin() {
    this.pending++;
  }
  end() {
    if (--this.pending === 0) this.rushing = false;
  }

  /** Runs after everything queued before it. */
  later(run: () => Promise<void>) {
    this.begin();
    flight.flows++;
    this.#flows = this.#flows
      .then(run)
      .catch(() => {})
      .finally(() => {
        flight.flows--;
        this.end();
      });
  }

  /** Lands everything in the air; the rest of the queue happens at once. False if there was nothing to hurry. */
  hurry(): boolean {
    if (!this.pending) return false;
    this.rushing = true;
    landAll();
    return true;
  }

  /** Coins moving from one place to another, one after another (or a handful at a time); resolves when the last has landed. */
  pour(moves: Moves, { handful = 1, gap = POUR_MS } = {}): Promise<void> {
    for (const [src] of moves) src.classList.remove('waiting');
    if (this.still) {
      for (const [, spot] of moves) spot.classList.remove('landing');
      return Promise.resolve();
    }
    return Promise.all(moves.map(([src, spot], i) => flyInto(src, spot, Math.floor(i / handful) * gap, this.places.coinClass?.(), FLIGHT_MS))).then(() => {});
  }

  /** A seat paid dollars a..b into the pot: its coins wait in its purse for their turn, then pour onto the pot. */
  payIn(seat: number, a: number, b: number) {
    const purse = this.places.purse(seat);
    const pot = this.places.pot();
    const moves: Moves = [];
    for (let k = a; k < b; k++) {
      const spot = pot?.querySelector<HTMLElement>(`[data-k="${this.#owners.length}"]`);
      this.#owners.push(seat);
      const src = purse?.querySelector(`[data-d="${k}"]`);
      if (!spot || !src || k >= a + MAX_FLYERS) continue;
      spot.classList.add('landing');
      src.classList.add('waiting');
      moves.push([src, spot]);
    }
    if (moves.length) this.later(() => this.pour(moves));
  }

  /** The verdict: the pot flies to the winners (a winner's own coins back to it, the rest shared out among them in turn). */
  payOut(winners: number[]) {
    const pot = this.places.pot();
    if (!pot || !winners.length) return;
    const landed = new Map<number, number>();
    let shared = 0;
    const coins = [...pot.querySelectorAll<HTMLElement>('[data-k]')];
    const first = Math.max(0, coins.length - MAX_FLYERS * 2);
    const moves: Moves = [];
    coins.forEach((c, i) => {
      const owner = this.#owners[Number(c.dataset.k)];
      const to = winners.includes(owner) ? owner : winners[shared++ % winners.length];
      const g = landed.get(to) ?? 0;
      landed.set(to, g + 1);
      const spot = this.places.purse(to)?.querySelector<HTMLElement>(`[data-g="${g}"]`);
      if (!spot || i < first) return;
      spot.classList.add('landing');
      c.classList.add('waiting');
      moves.push([c, spot]);
    });
    // A pot is heavy too, but paid out in handfuls: big pots still look big, without the wait.
    if (moves.length) this.later(() => this.pour(moves, { handful: 3, gap: 45 }).then(() => moves.forEach(([c]) => c.classList.remove('waiting'))));
  }
}

/**
 * The deal's pace, the same at every table: a card face up (the board, yours)
 * changes the game, so it comes slowly; one face down to a rival, quicker.
 * Then the Flop after a breath, each card a thunderclap: Boom. Boom. BOOM.
 */
export const FACE_UP_MS = 650;
export const FACE_DOWN_MS = 220;
export const FLOP_MS = [1100, 1000, 1300];

/** A card thrown away: up out of the hand, turning, and gone (`moving` false: it simply goes). */
export function thrownCard(moving: boolean) {
  return {
    duration: moving ? 450 : 0,
    css: (t: number) => `transform: translate(${(1 - t) * 14}px, ${(1 - t) * -26}px) rotate(${(1 - t) * 12}deg); opacity: ${t}`,
  };
}
