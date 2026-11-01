<script lang="ts">
  import {
    STREETS,
    bestHand,
    discardCost,
    isJoker,
    isAnswering,
    roundLeft,
    canFold,
    isComposing,
    feeFor,
    type Action,
    type Card,
    type RoundState,
    type RulesConfig,
  } from '../engine';
  import { t } from '../i18n';
  import ActionBar from './ActionBar.svelte';
  import Board from './Board.svelte';
  import MyCards from './MyCards.svelte';
  import OpponentSeat, { type SeatCard } from './OpponentSeat.svelte';
  import PotBand from './PotBand.svelte';
  import Purse from './Purse.svelte';
  import { tagName } from './format';
  import { handLabel } from './handNames';
  import { cardPrefs } from './cards.svelte';
  import { CoinFlow, FACE_DOWN_MS, FACE_UP_MS, FLOP_MS, thrownCard } from './coinflow.svelte';
  import { moneyText, moveLabel, priceText, type Currency } from './prices';
  import { tick, untrack, type Snippet } from 'svelte';

  /**
   * The table, for every game: you at the bottom, your opponents across the
   * top (one across the whole width, two or three sharing it), the river
   * between, with the street, the pot and the board. Everyone moves at once,
   * in secret; then the moves are replayed one at a time, in seat order, and
   * you take each in (Skip for the rest). On the River only a raise is
   * replayed, then how the rest answered it. At the showdown your hand comes
   * first, then theirs, left to right, turning over a card at a time.
   *
   * Whoever runs the game (the League's crossings, the High Rollers table)
   * keeps it, and shows it here as a `table`: the hand, the seats and their
   * money. The table sends back your moves (`onplay`) and, after the
   * verdict, Next (`onnext`); what comes between hands is theirs to show
   * (`cover`, over the board) and to offer (`buttons`).
   */
  export interface TableView {
    round: RoundState;
    config: RulesConfig;
    /** Counts up hand by hand: a new one brings the antes and the deal. */
    hand: number;
    /** The captain in each seat. */
    ids: string[];
    /** Your seat (-1: out of money, watching). */
    me: number;
    /** The chairs across the top, left to right, for the whole table: each rival's seat this hand, or -1 (broke, watching from the rail). */
    chairs: { id: string; seat: number }[];
    /** Each seat's money when the hand began, and now (settled once it's over). */
    start: number[];
    money: number[];
    /** The hand being played, the hand over, or the table over. */
    phase: 'hand' | 'handEnd' | 'over';
    /** Said with the verdict, after who won: who went broke, that the next hand is the last. */
    aftermath?: string;
    /** What the money is: dollars, or in Morag's lessons, buttons. */
    currency?: Currency;
  }

  let {
    table,
    onplay,
    onnext,
    onmenu,
    onseat,
    cover,
    buttons,
  }: {
    table: TableView;
    /** Your move for the street (null: you're out of the hand, and it plays on without you). */
    onplay: (action: Action | null) => void;
    /** After the verdict: on (the next hand, or whatever comes between). */
    onnext: () => void;
    onmenu: () => void;
    /** A rival's name or portrait tapped. */
    onseat?: (seat: number) => void;
    /** Shown over the board in its place (it stays, hidden, so nothing moves): standings, a captain's details. */
    cover?: Snippet;
    /** In place of the table's own two buttons. */
    buttons?: Snippet;
  } = $props();

  let tapped = $state<string[]>([]);

  const round = $derived(table.round);
  const me = $derived(table.me);
  const mine = $derived(me >= 0 ? round.seats[me] : null);
  const meIn = $derived(!!mine && !mine.folded);
  const composing = $derived(isComposing(round));
  /** Facing a raise on the River: match it or fold. */
  const answering = $derived(me >= 0 && isAnswering(round, me));
  /** You have a move to make this street. */
  const myTurn = $derived(meIn && (round.street !== 3 || answering));
  const money = (n: number) => moneyText(n, table.currency);
  const price = (n: number) => priceText(n, table.currency);

  // --- What's being shown -------------------------------------------------
  /**
   * 'choose': your move. 'replay': the rivals' moves, one at a time (`queue`,
   * `at`). 'reveal': the showdown, one hand at a time. 'verdict': who won, and
   * where the snags went (then Next is theirs: `onnext`).
   */
  let view = $state<'choose' | 'replay' | 'reveal' | 'verdict'>('choose');
  let queue = $state<{ seat: number; action: Action }[]>([]);
  let at = $state(0);
  /** The table as it stood before the street: a rival's seat is shown from it until its move comes up in the replay. */
  let before = $state.raw<RoundState | null>(null);
  /** A seat's place in the replay (-1: it has nothing to show, and is shown as it is). */
  const placeIn = (seat: number) => queue.findIndex((q) => q.seat === seat);
  const shownYet = (seat: number) => view !== 'replay' || !before || placeIn(seat) <= at;
  /** How far the money has followed the replay: a seat's coins go in once its cards have moved. */
  let betsAt = $state(0);
  /** What a seat has in the pot, as far as the table has seen. */
  const betOf = (seat: number) => (view !== 'replay' || !before || placeIn(seat) <= betsAt ? round : before).bets[seat];
  /** A swap being shown: the seat, and how many replacements have been dealt so far (0: the thrown cards have just gone). */
  let swapping = $state<{ seat: number; drawn: number } | null>(null);
  /** A seat's hand as it should be seen: mid-swap, without the thrown cards and with the replacements dealt so far. */
  function handOf(seat: number): Card[] {
    const sw = swapping;
    const move = queue.find((q) => q.seat === seat)?.action;
    if (sw?.seat === seat && before && move?.type === 'draw') {
      const old = before.seats[seat].hand;
      const fresh = round.seats[seat].hand.filter((c) => !old.some((o) => o.id === c.id));
      return [...old.filter((c) => !move.cardIds.includes(c.id)), ...fresh.slice(0, sw.drawn)];
    }
    // Your hand on the River is as you laid it (the cards you play shown apart): only a swap waits its turn.
    return (seat === me && before && before.street >= 2 ? round : seen(seat)).seats[seat].hand;
  }
  /** A seat as it should be seen just now. */
  const seen = (seat: number) => (shownYet(seat) ? round : before!);
  /** Board cards on show: a new street's card waits until the replay is done. */
  let boardShown = $state(3);
  /** The showdown's order (you first, then the rivals left to right), and how far it has got. */
  let revealOrder = $state<number[]>([]);
  let revealed = $state(0);

  /** The rival in focus: the one whose move or hand is being shown. */
  const focus = $derived(view === 'replay' ? queue[at]?.seat : view === 'reveal' && revealOrder[revealed] !== me ? revealOrder[revealed] : undefined);

  // --- Your move ----------------------------------------------------------
  const tappedCards = $derived(mine ? mine.hand.filter((c) => tapped.includes(c.id)) : []);
  const tappedSnags = $derived(mine ? mine.jokers.filter((c) => tapped.includes(c.id)) : []);
  const cost = $derived(
    answering ? round.raise : meIn && !composing ? feeFor(round, table.config, round.street + 1) + discardCost(mine!.discarded.length, tappedCards.length) : 0,
  );
  const preview = $derived(
    view === 'choose' && myTurn && composing ? bestHand([...tappedCards, ...tappedSnags], round.community, { min: tapped.length, max: tapped.length }) : null,
  );
  /** What you have left to put in this hand: a price beyond it is everything, all in. */
  const left = $derived(me >= 0 ? roundLeft(round, me) : 0);
  const goLabel = $derived(moveLabel({ composing, answering, swaps: tappedCards.length, cost, left, currency: table.currency }));

  /** On the River, your hand is laid (Play hand): what's left is to raise, or not (Next). A tap picks it back up. */
  let laid = $state(false);

  function tap(card: Card) {
    if (view !== 'choose' || !meIn) return;
    laid = false;
    if (isJoker(card) && !composing) return; // Snags can't be thrown away
    if (tapped.includes(card.id)) tapped = tapped.filter((id) => id !== card.id);
    else if (!composing || tapped.length < 5) tapped = [...tapped, card.id]; // A hand is five cards at most
  }

  /**
   * Your move (or none, if you're out of the hand): the street resolves, and
   * the rivals' moves are replayed in seat order from the first. On the River
   * everyone just plays a hand, so only a raise is shown; then how the rest
   * answered it.
   */
  function play(action: Action | null) {
    // A move that arrives after the hand is over (a double tap, say) has nothing to act on.
    if (table.phase !== 'hand' || round.result) return;
    before = round;
    const river = composing;
    onplay(action);
    tapped = [];
    laid = false;
    // Whoever runs the game has played the street: the table now shows its outcome.
    const r = table.round;
    const moves = r.history.at(-1)!.actions;
    const order = Array.from({ length: r.seats.length }, (_, k) => (r.first + k) % r.seats.length);
    // The Flop and the Turn play out by themselves, every seat in turn (yours too); on the River only a raise is
    // shown, then how the rest answered it, a Next at a time.
    const auto = before.street < 2;
    // Every move with something to show, in its seat: yours too (but your own fold shows nothing new).
    const shown = (s: number, a: Action | null) => !!a && !(s === me && a.type === 'fold') && (auto || !river || (a.type === 'compose' && !!a.raise));
    queue = order.filter((s) => shown(s, moves[s])).map((s) => ({ seat: s, action: moves[s]! }));
    // All of it plays out by itself, in seat order: the Flop's and the Turn's moves, the River's raises, the answers.
    at = -1;
    betsAt = -1;
    boardShown = before.community.length;
    if (!queue.length) afterReplay();
    else {
      view = 'replay';
      void playOut();
    }
  }

  /** A thrown card: up out of the hand, turning, and gone (only in a swap, and not when hurried). */
  function thrown(_node: Element, _card?: Card | null) {
    return thrownCard(!!swapping && !coins.still);
  }

  /** A breath between beats (none when hurried). */
  const pause = (ms: number) => (coins.still ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, ms)));
  const STEP_MS = 700;
  const THROW_MS = 450;

  /**
   * The Flop's or the Turn's moves, by themselves, in seating order: each
   * seat's thrown cards go, its replacements are dealt (yours face up,
   * slowly), then its money goes in, and a breath before the next.
   */
  async function playOut() {
    coins.begin();
    try {
      for (let i = 0; i < queue.length; i++) {
        at = i;
        const { seat, action } = queue[i];
        if (action.type === 'draw' && action.cardIds.length) {
          swapping = { seat, drawn: 0 };
          await pause(THROW_MS);
          for (let k = 0; k < action.cardIds.length; k++) {
            swapping = { seat, drawn: k + 1 };
            await pause(seat === me ? FACE_UP_MS : FACE_DOWN_MS * 2);
          }
          swapping = null;
        }
        betsAt = i;
        await tick();
        await coins.idle;
        await pause(STEP_MS);
      }
    } finally {
      swapping = null;
      coins.end();
    }
    afterReplay();
  }

  function go(raise = false) {
    if (!mine) return;
    if (answering) play({ type: 'match' });
    else if (composing) play({ type: 'compose', cardIds: tappedCards.map((c) => c.id), jokers: tappedSnags.length, raise });
    else play({ type: 'draw', cardIds: tappedCards.map((c) => c.id) });
  }

  function next() {
    if (view === 'replay') {
      if (at + 1 < queue.length) betsAt = ++at;
      else afterReplay();
    } else if (view === 'reveal') {
      if (revealed + 1 < revealOrder.length) void turnOver(revealOrder[++revealed]);
      else {
        noteSnags();
        view = 'verdict';
      }
    } else if (view === 'verdict') onnext();
  }

  /** Past the rest of the rivals' moves at once: their money goes in without the flights. */
  async function skipReplay() {
    if (view !== 'replay') return;
    coins.rushing = true;
    afterReplay();
    // Their payments are queued once the table updates; the hurry ends when they're done.
    await tick();
    coins.later(async () => {});
  }

  function afterReplay() {
    // A new card for the board waits its turn, after the money.
    if (round.community.length > boardShown) coins.later(dealBoard);
    const res = round.result;
    if (!res) {
      // On to the next street (or a raise to answer): your move, or, with nothing for you to do, on we go without you.
      if (myTurn) view = 'choose';
      else play(null);
      return;
    }
    if (res.byFolds) {
      view = 'verdict';
      return;
    }
    // The showdown: you first (if you're in), then the rest in their seats, left to right.
    const inHand = round.seats.map((_, s) => s).filter((s) => !round.seats[s].folded);
    const others = inHand.filter((s) => s !== me);
    revealOrder = [...(inHand.includes(me) ? [me] : []), ...others];
    revealed = 0;
    view = 'reveal';
    void showdown();
  }

  /** The showdown, by itself: each hand in turn (yours you know: just its name), a breath between, then the verdict. */
  async function showdown() {
    coins.begin();
    try {
      for (let i = 0; i < revealOrder.length; i++) {
        revealed = i;
        await turnOver(revealOrder[i]);
        await pause(STEP_MS);
      }
    } finally {
      coins.end();
    }
    noteSnags();
    view = 'verdict';
  }

  // A new hand: the board starts at the Flop, your move (or, with nothing for you to do, on without you).
  // Picked up again mid-hand, the board as it was; between hands, on to the next.
  let handNow = -1;
  $effect(() => {
    const hand = table.hand;
    untrack(() => {
      if (hand === handNow) return;
      const first = handNow === -1;
      handNow = hand;
      tapped = [];
      laid = false;
      before = null;
      queue = [];
      view = 'choose';
      boardShown = first ? Math.max(3, round.community.length) : 3;
      if (table.phase === 'handEnd') onnext();
      else if (table.phase === 'hand' && !round.result && !myTurn) play(null);
    });
  });

  // --- Showing it ---------------------------------------------------------
  const shownTo = (seat: number) => view === 'verdict' || (view === 'reveal' && revealOrder.includes(seat) && revealOrder.indexOf(seat) <= revealed);
  /** At the showdown, how many of the current rival's played cards are turned over so far (all, once they're done). */
  const TURNED_ALL = 99;
  let turned = $state(TURNED_ALL);
  const FLIP_MS = 750;
  /** This rival's cards are being turned over right now. */
  const turning = (seat: number) => view === 'reveal' && revealOrder[revealed] === seat && turned < TURNED_ALL;
  /** A hand all turned up: its name said, its kept-back cards shown, its played snags lifted. */
  const turnedUp = (seat: number) => shownTo(seat) && !turning(seat);
  /** A rival's showdown: each card it played turned over in turn, a breath apart, then the rest. Yours you know already. */
  async function turnOver(seat: number) {
    const n = played(round.seats[seat].played).filter((c) => !isJoker(c)).length;
    if (seat === me || !n || coins.still) return;
    coins.begin();
    turned = 0;
    try {
      for (let k = 0; k < n; k++) {
        await pause(k ? FLIP_MS : FLIP_MS / 2);
        turned = k + 1;
      }
      await pause(FLIP_MS);
    } finally {
      turned = TURNED_ALL;
      coins.end();
    }
  }
  /** What a rival did, in a word or two. */
  function moveText(action: Action): string {
    if (action.type === 'fold') return t('hr.move.fold');
    if (action.type === 'compose') return t('hr.move.raise', { amount: money(round.raise) });
    if (action.type === 'match') return t('hr.move.match', { amount: money(round.raise) });
    if (action.type === 'draw' && action.cardIds.length) return t('hr.move.swap', { n: action.cardIds.length });
    const fee = feeFor(round, table.config, (round.history.at(-1)?.street ?? 0) + 1);
    return fee ? t('hr.move.call', { amount: money(fee) }) : t('hr.move.check');
  }
  /** Settled purses show only at the verdict; until then, what each had at the start of the hand, less what's in the pot. */
  const settled = $derived(view === 'verdict');
  const purse = (seat: number) => (settled ? table.money[seat] : table.start[seat] - betOf(seat));
  /** What each seat has in the pot, as far as the table has seen. */
  const shownBets = $derived(round.seats.map((_, s) => betOf(s)));
  const potCount = $derived(shownBets.reduce((a, b) => a + b, 0));

  // --- Coins in flight, and the deal ------------------------------------------
  // Money moves through the shared coin queue (coinflow.svelte.ts): a purse at
  // a time, the pile to the winners. The cards are dealt in the same queue,
  // after the antes; a tap anywhere hurries it all along (the stacks just
  // change, as they do for those who'd rather have no motion).
  let rootEl = $state<HTMLElement>();
  let pileEl = $state<HTMLElement>();
  let flown: number[] = [];
  let flownHand = -1;
  let paidHand = -1;
  const purseEl = (seat: number) => rootEl?.querySelector<HTMLElement>(`[data-purse="${seat}"]`) ?? null;
  const coins = new CoinFlow({ purse: purseEl, pot: () => pileEl });

  /** A tap on the table (not on a button or a card: those are moves): everything in the air lands, and whatever is queued happens at once. */
  function hurry(e?: MouseEvent) {
    if (e?.target instanceof Element && e.target.closest('button')) return;
    if (!coins.hurry()) return;
    dealt = DEALT_ALL;
    boardShown = Math.max(boardShown, round.community.length);
  }

  // The deal, as at a real table: one card at a time round the table, from the
  // dealer's left, until everyone has three; then, after a breath, the Flop,
  // each card a thunderclap.
  const DEALT_ALL = 99;
  /** Cards dealt so far this hand, in dealing order (hole cards, then the Flop). */
  let dealt = $state(DEALT_ALL);
  /** The dealer sits just before the first to act (who is on the dealer's left). */
  const dealer = $derived((round.first + round.seats.length - 1) % round.seats.length);
  /** A seat's k-th hole card in dealing order: round by round, from the dealer's left. */
  const dealIndex = (seat: number, k: number) => k * round.seats.length + ((seat - round.first + round.seats.length) % round.seats.length);
  const holeDealt = (seat: number) => [0, 1, 2].filter((k) => dealIndex(seat, k) < dealt).length;
  /** The Flop's i-th card in dealing order: after every hole card. */
  const flopIndex = (i: number) => 3 * round.seats.length + i;
  /** The board as dealt so far: the Flop after every hole card, a new street's card once the replay is done. */
  const boardCards = $derived(Array.from({ length: 5 }, (_, i) => (i < boardShown && (i >= 3 || flopIndex(i) < dealt) ? (round.community[i] ?? null) : null)));
  function deal(): Promise<void> {
    if (coins.still) {
      dealt = DEALT_ALL;
      return Promise.resolve();
    }
    const n = round.seats.length;
    const holes = 3 * n;
    const cards = holes + 3;
    /** How long after card i is dealt before the next: a card of yours (face up) is worth a look; theirs go quicker. */
    const after = (i: number) => {
      if (i === holes - 1) return FLOP_MS[0];
      if (i >= holes) return FLOP_MS[i - holes + 1] ?? FACE_UP_MS;
      return (round.first + (i % n)) % n === me ? FACE_UP_MS : FACE_DOWN_MS;
    };
    return new Promise((done) => {
      const tick = () => {
        // Hurried along: the rest at once.
        if (coins.rushing) dealt = DEALT_ALL;
        if (dealt >= cards) return done();
        const i = dealt++;
        setTimeout(tick, after(i));
      };
      tick();
    });
  }

  /** The next street's card onto the board, in a beat of its own. */
  function dealBoard(): Promise<void> {
    if (coins.still) {
      boardShown = round.community.length;
      return Promise.resolve();
    }
    return new Promise((done) =>
      setTimeout(() => {
        boardShown = round.community.length;
        setTimeout(done, FACE_UP_MS);
      }, FACE_UP_MS / 2),
    );
  }

  // The Last Hand's moment: its name over the table, before the antes go in.
  let announcing = $state(false);
  const ANNOUNCE_MS = 2400;
  function announce(): Promise<void> {
    if (coins.still) return Promise.resolve();
    announcing = true;
    return pause(ANNOUNCE_MS).then(() => {
      announcing = false;
    });
  }

  // Snags changing hands at the verdict slide from where they were (a winner's fan, the board) to the weakest hand's.
  /** Where each snag stood just before the verdict. */
  let snagsWere = new Map<string, DOMRect>();
  function noteSnags() {
    snagsWere = new Map([...(rootEl?.querySelectorAll<HTMLElement>('[data-snag]') ?? [])].map((el) => [el.dataset.snag!, el.getBoundingClientRect()]));
  }
  const SLIDE_MS = 700;
  function slideSnags(ids: string[]): Promise<void> {
    const moves = ids
      .map((id) => ({ from: snagsWere.get(id), el: rootEl?.querySelector<HTMLElement>(`.seat [data-snag="${id}"], .mine [data-snag="${id}"]`) }))
      .filter((m): m is { from: DOMRect; el: HTMLElement } => !!m.from && !!m.el);
    // Waiting their turn, they're not in their new fan yet.
    for (const m of moves) m.el.classList.add('landing');
    return new Promise((done) =>
      coins.later(async () => {
        await Promise.all(
          moves.map(({ from, el }, i) => {
            el.classList.remove('landing');
            if (coins.still) return;
            const to = el.getBoundingClientRect();
            return el
              .animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, zIndex: 30 }, { transform: 'none', zIndex: 30 }], {
                duration: SLIDE_MS,
                delay: i * 150,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'backwards',
              })
              .finished.then(() => {});
          }),
        );
        done();
      }),
    );
  }

  $effect(() => {
    const bets = shownBets;
    const hand = table.hand;
    const winners = settled ? round.result?.winners : undefined;
    untrack(() => {
      const fresh = hand !== flownHand;
      if (fresh) {
        flownHand = hand;
        flown = bets.map(() => 0);
        coins.reset();
        dealt = 0;
        // The Last Hand is announced before anything moves.
        if (round.stakes > 1) coins.later(announce);
      }
      // In seat order from the first, so the pile fills the way the table played: a purse at a time.
      for (let j = 0; j < bets.length; j++) {
        const s = (round.first + j) % bets.length;
        if (bets[s] > flown[s]) coins.payIn(s, flown[s], bets[s]);
      }
      flown = [...bets];
      // A new hand: the antes in, then the deal.
      if (fresh) coins.later(deal);
      if (winners && paidHand !== hand) {
        paidHand = hand;
        coins.payOut(winners);
        const dumped = round.result ? [...round.result.dumped, ...round.result.boardTaken] : [];
        if (dumped.length) void slideSnags(dumped.map((j) => j.id));
      }
    });
  });
  /** The table is moving: money in the air, cards being dealt. The buttons wait. */
  const busy = $derived(coins.pending > 0);
  /** What a seat has paid out this hand (into the pot, and forfeits at the verdict) and won (at the verdict): its purse settles them. */
  const paidOut = (seat: number) => (settled && round.result ? round.bets[seat] + round.result.forfeit[seat] : betOf(seat));
  const wonIn = (seat: number) => (settled && round.result ? round.result.share[seat] : 0);
  /** The street the board shows (a new card waits for the replay to end). */
  const streetName = $derived(STREETS[Math.min(boardShown - 3, 2)]);
  const who = (s: number) => (s === me ? t('character.captain.you') : tagName(table.ids[s]));
  const verdictText = $derived.by(() => {
    const res = round.result;
    if (!res) return '';
    // You get your own line ("You take the pot!"), not your name in theirs.
    const line = (key: string, s: number) => (s === me ? t(`${key}.you`) : t(key, { name: who(s) }));
    if (res.byFolds) return line('hr.byFolds', res.winners[0]);
    const wins = res.winners.length > 1 ? t('hr.split', { names: res.winners.map(who).join(' & ') }) : line('hr.wins', res.winners[0]);
    const said = res.weakest !== null && res.dumped.length + res.boardTaken.length ? `${wins} ${line('hr.snagsTo', res.weakest)}` : wins;
    return [said, table.aftermath].filter(Boolean).join(' ');
  });
  const handName = (seat: number) => {
    const h = round.result?.hands[seat];
    return h ? handLabel(h) : null;
  };
  /** A rival's line under their cards: the move being shown, their hand at the showdown, or that they're out of it. */
  function rivalLine(seat: number): string {
    if (view === 'replay' && focus === seat) return moveText(queue[at].action);
    // While the rest answer a raise, the raisers keep saying so.
    if (view === 'choose' && round.street === 3 && round.raisers.includes(seat)) return t('hr.raised', { amount: money(round.raise) });
    if (turnedUp(seat) && handName(seat)) return handName(seat)!.call;
    return seen(seat).seats[seat].folded ? t('hr.folded') : '';
  }
  const played = (cards: (Card | null)[]) => cards.filter((c): c is Card => c !== null);
  /** A rival's cards as they should be seen: face down while held (thrown ones leave, replacements are dealt in); at the showdown the played ones turning over one by one, then what they kept back, dimmed. */
  function rivalCards(seat: number): SeatCard[] {
    const s = seen(seat).seats[seat];
    const shown = played(s.played).filter((c) => !isJoker(c));
    if (s.folded) return s.hand.map((_, i) => ({ key: `f${i}`, faceDown: true, faded: true }));
    if (shownTo(seat) && shown.length)
      return [
        ...shown.map((card, k): SeatCard => (turning(seat) && k >= turned ? { key: card.id, faceDown: true } : { key: card.id, card, deal: turning(seat) ? 'flip' : null })),
        ...s.hand.map((card): SeatCard => (turnedUp(seat) ? { key: card.id, card, faded: true } : { key: card.id, faceDown: true, faded: true })),
      ];
    return Array.from({ length: Math.min(shown.length + handOf(seat).length, holeDealt(seat)) }, (_, i) => ({ key: `h${i}`, faceDown: true, deal: 'top' as const, held: true }));
  }
  const myPlayed = $derived(mine ? played(mine.played).filter((c) => !isJoker(c)) : []);
  const myPlayedSnags = $derived(new Set(mine ? played(mine.played).filter(isJoker).map((c) => c.id) : []));
  /**
   * A seat's snags. At the showdown, as they stood before the River was
   * played (those played lift out of the fan); at the verdict, those it owns
   * now (a winner's played snags have gone to the weakest hand).
   */
  const snagsOf = (seat: number) => (view === 'reveal' && before ? before : seen(seat)).seats[seat].jokers;
  const mySnags = $derived(mine ? snagsOf(me) : []);
  const myCall = $derived(preview ? handLabel(preview) : mine && shownTo(me) ? handName(me) : null);

</script>

<!-- A tap anywhere, while the table is moving, hurries it along. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="table" class:buttons={table.currency === 'buttons'} bind:this={rootEl} onclick={hurry}>
  <!-- Your opponents across the top, in seat order: one across the whole width, two or three sharing it. -->
  <div class="rivals">
    {#each table.chairs as chair (chair.id)}
      {@const seat = chair.seat}
      {#if seat < 0}
        <!-- Broke: still at the table, watching from the rail. -->
        <OpponentSeat id={chair.id} seat={-1} span={12 / table.chairs.length} cards={[]} {thrown} snags={[]} discarded={[]} purse={{ amount: 0, start: 0 }} broke />
      {:else}
        {@const s = seen(seat).seats[seat]}
        <OpponentSeat
          id={chair.id}
          {seat}
          span={12 / table.chairs.length}
          cards={rivalCards(seat)}
          {thrown}
          snags={snagsOf(seat)}
          snagLook={(card) => ({ lifted: turnedUp(seat) && s.played.some((c) => c.id === card.id) })}
          discarded={s.discarded}
          flopDiscards={s.flopDiscards}
          purse={round.potMode ? { amount: purse(seat), start: table.start[seat], keep: table.hand, paid: paidOut(seat), won: wonIn(seat) } : null}
          line={rivalLine(seat)}
          lineCategory={turnedUp(seat) ? (round.result?.hands[seat]?.category ?? null) : null}
          dealer={dealer === seat}
          focus={focus === seat}
          folded={s.folded}
          onselect={onseat ? () => onseat(seat) : undefined}
        />
      {/if}
    {/each}
  </div>

  <!-- The river: the street, the pot and the board. -->
  <div class="felt">
    <!-- The Last Hand says so over the street's name (it plays for double). -->
    <p class="last-hand">{round.stakes > 1 ? t('hr.lastHand', { n: round.stakes }) : ''}</p>
    <p class="street">{t(`street.${streetName}`)}</p>
    {#if announcing}
      <!-- The Last Hand: its moment, before the antes. -->
      <div class="title-card" aria-live="polite">
        <p class="big">{t('hr.lastHandTitle')}</p>
        <p class="small">{t('hr.lastHandStakes', { n: round.stakes })}</p>
      </div>
    {/if}
    <!-- Between hands, whatever comes then (the standings, a captain's details) takes the board's place; it stays, hidden, so nothing moves. -->
    <div class="board-place" class:covered={!!cover}>
      <PotBand count={potCount} paid={settled} outcome={settled ? verdictText : null} won={!!round.result?.winners.includes(me)} wordy bind:el={pileEl} />
      <Board cards={boardCards} />
      {#if cover}<div class="cover">{@render cover()}</div>{/if}
    </div>
  </div>

  <!-- Your side, as in a duel: your money nearest the pot, then your cards, your snags and your discards. -->
  <div class="mine">
    <div class="my-purse" data-purse={me}>
      {#if mine}
        {#if round.potMode}<Purse amount={purse(me)} start={table.start[me]} showAmount={false} focus={18} label={t('character.captain.you')} keep={table.hand} paid={paidOut(me)} won={wonIn(me)} tidy />{/if}
        {#if dealer === me}<span class="button own" title={t('hr.dealer')}></span>{/if}
        {#if preview && !tapped.length && !laid}<p class="my-hand">{t('draw.boardOnly')}</p>{:else if myCall}<button class="my-hand ladder-link" onclick={() => (cardPrefs.ladder = (preview ?? round.result?.hands[me])?.category ?? 'all')}>{myCall.lingo ?? myCall.call}</button>{/if}
      {:else}
        <p class="my-hand">{t('hr.youAreOut')}</p>
      {/if}
    </div>
    {#if mine}
      <MyCards
        played={myPlayed}
        hand={handOf(me).filter((_, k) => k >= 3 || dealIndex(me, k) < dealt)}
        look={(card) => ({
          selected: composing && !laid && tapped.includes(card.id),
          used: laid && tapped.includes(card.id),
          toss: !composing && tapped.includes(card.id),
          faded: mine.folded || (shownTo(me) && myPlayed.length > 0) || (laid && !tapped.includes(card.id)),
        })}
        ontap={view === 'choose' && meIn ? tap : undefined}
        {thrown}
        snags={mySnags}
        snagLook={(card) => ({
          selected: !laid && tapped.includes(card.id),
          used: myPlayedSnags.has(card.id) || (laid && tapped.includes(card.id)),
          lifted: shownTo(me) && myPlayedSnags.has(card.id),
        })}
        onsnag={view === 'choose' && meIn && composing ? tap : undefined}
        discarded={mine.discarded}
        flopDiscards={mine.flopDiscards}
      />
    {/if}
  </div>

  <!-- The two buttons. Call, Swap and Play hand are held (heavy); the rest are light taps. -->
  <ActionBar inert={busy}>
    {#if buttons}
      {@render buttons()}
    {:else if view === 'choose' && myTurn && composing && round.raise && laid}
      <!-- The River, your hand laid: raise on it, or let it stand. Either commits you. -->
      <!-- All in already: nothing left to raise with. -->
      <button class="ghost" onclick={() => go(true)} data-heavy="true" disabled={left === 0}>{round.raise > left && left > 0 ? t('draw.allIn', { amount: price(left) }) : t('hr.raise', { amount: price(round.raise) })}</button>
      <button onclick={() => go()} data-heavy="true">{t('show.next')}</button>
    {:else if view === 'choose' && myTurn && composing && round.raise}
      <!-- The River, first: lay your hand (held: high stakes, heavy decisions; then Raise or Next commits it). -->
      <button class="ghost" disabled>{t('draw.fold')}</button>
      <button onclick={() => (laid = true)} data-heavy="true">{goLabel}</button>
    {:else if view === 'choose' && myTurn}
      <button class="ghost" onclick={() => play({ type: 'fold' })} disabled={!canFold(round, me)}>{t('draw.fold')}</button>
      <button onclick={() => go()} data-heavy={composing || answering || tappedCards.length > 0 || cost > 0 ? 'true' : undefined}>{goLabel}</button>
    {:else if view === 'replay'}
      <!-- The rivals' turns: Next through them, one by one, or Skip to the end. -->
      <button class="ghost" onclick={skipReplay}>{t('show.skip')}</button>
      <button onclick={next}>{t('show.next')}</button>
    {:else}
      <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
      <button onclick={next}>{t('show.next')}</button>
    {/if}
  </ActionBar>

</div>

<style>
  /* The board's place: the pot over the board, and between hands whatever covers them (they stay, hidden, so nothing moves). */
  .board-place {
    position: relative;
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
  }
  .board-place.covered > :global(:not(.cover)) {
    visibility: hidden;
  }
  .cover {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: auto;
  }
  /*
   * The duel's screen grid: 12 columns (a card is two and a gap wide), the
   * table kept to the bottom so the buttons sit where they always do.
   */
  .table {
    --gap: 0.5rem;
    container-type: inline-size;
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gap);
    row-gap: clamp(0.5rem, 2vh, 1.4rem);
    align-content: end;
    width: 100%;
    max-width: 480px;
    min-height: 100svh;
    margin: 0 auto;
    padding: 1rem 1rem 0.75rem;
  }
  .table > :not(.layer) {
    --col: calc((100cqw - 11 * var(--gap)) / 12);
    --card-w: calc(2 * var(--col) + var(--gap));
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
  }
  .felt > *,
  .mine > * {
    grid-column: 1 / -1;
  }
  .table :global(.card:not(.huge)) {
    --w: var(--card-w) !important;
  }
  /* The dealer's button: the dealer this hand (the one on their left acts, and draws, first). */
  .button {
    flex: none;
    align-self: center;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--paper);
    box-shadow:
      0 0 0 2px #0c0c0b,
      0 0 0 3px var(--grey);
  }
  .button.own {
    position: absolute;
    top: 4px;
    right: 4px;
  }

  /* The river: the street, the pot, the board. */
  .felt {
    text-align: center;
    background: repeating-linear-gradient(0deg, transparent 0 18px, rgba(255, 255, 255, 0.03) 18px 20px);
  }
  .street {
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.3rem;
  }

  /* Your side: the duel's rows (cards in columns 1–6, the snag fan 7–10, the discards 11–12). */
  .mine {
    row-gap: 0.4rem;
  }
  .my-purse {
    position: relative;
    min-height: 72px;
  }
  :global(.short) .my-purse {
    min-height: 56px;
  }
  .my-hand {
    position: absolute;
    top: 0.8rem;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    font-style: italic;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow:
      0 0 3px #000,
      0 0 6px #000;
    /* Only the words are a tap target (the hands, best first). */
    width: fit-content;
    max-width: 100%;
    margin: 0 auto;
  }
  /* The Last Hand's title, over the pot and the board for a moment. */
  .felt {
    position: relative;
  }
  .title-card {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: grid;
    place-content: center;
    gap: 0.4rem;
    background: rgba(12, 12, 11, 0.85);
    animation: title-in 0.6s ease-out;
  }
  .title-card p {
    margin: 0;
  }
  .title-card .big {
    font-family: var(--title-font);
    font-size: 2.2rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .title-card .small {
    font-family: var(--title-font);
    font-size: 1rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--grey);
  }
  @keyframes title-in {
    from {
      opacity: 0;
      transform: scale(1.06);
    }
  }
  .last-hand {
    margin: 0;
    min-height: 1.2em;
    font-family: var(--title-font);
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--grey);
  }
</style>
