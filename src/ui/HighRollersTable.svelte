<script lang="ts">
  import {
    HUMAN_ID,
    STREETS,
    bestHand,
    discardCost,
    isJoker,
    mySeat,
    newHighRollers,
    nextHighRollersHand,
    placings,
    playHighRollers,
    highRollersResult,
    isAnswering,
    roundLeft,
    canFold,
    isComposing,
    feeFor,
    type Action,
    type Card,
    type HighRollersResult,
    type HighRollersSetup,
    type HighRollersState,
    type RoundState,
  } from '../engine';
  import { t } from '../i18n';
  import ActionBar from './ActionBar.svelte';
  import Board from './Board.svelte';
  import CardView from './CardView.svelte';
  import MyCards from './MyCards.svelte';
  import PotBand from './PotBand.svelte';
  import SnagFan from './SnagFan.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import Purse from './Purse.svelte';
  import { dollars, tagName } from './format';
  import { handLabel } from './handNames';
  import { cardPrefs } from './cards.svelte';
  import { clink } from './clink';
  import { CoinFlow, FACE_DOWN_MS, FACE_UP_MS, FLOP_MS, thrownCard } from './coinflow.svelte';
  import { moveLabel } from './prices';
  import { onMount, tick, untrack } from 'svelte';

  /**
   * High Rollers: four captains at one table, until the first is broke and
   * then The Last Hand (see docs/high-rollers.md). Your side and the river are
   * the duel's; your three rivals share the top, a third each: a name, a
   * purse, three cards, snags and discards. Everyone moves at once, in secret;
   * then the rivals' moves are replayed one at a time, in seat order (left,
   * across, right, and round to you), and you press Next as you take each in.
   * On the River only a raise is replayed, then how the rest answered it. At
   * the showdown your hand comes first, then theirs, left to right.
   *
   * Reusable: `setup` seats the table (rivals, purses, stakes); with
   * `onfinish` the table ends with Continue and hands back how it went,
   * without it (the mode on its own) with Again.
   */
  let {
    onmenu,
    setup,
    onfinish,
    saved,
    onsave,
  }: {
    onmenu: () => void;
    setup?: HighRollersSetup;
    onfinish?: (result: HighRollersResult) => void;
    /** The table as it stood when the voyage was put down: it carries on from there. */
    saved?: HighRollersState;
    /** Every move, for saving with the voyage. */
    onsave?: (table: HighRollersState) => void;
  } = $props();

  /** A table picked up again carries on where it was; a new one is seated (from a voyage, with its seed). */
  const resumed = untrack(() => saved);
  let game = $state.raw<HighRollersState>(resumed ?? newHighRollers(untrack(() => setup?.seed) ?? Date.now() >>> 0, untrack(() => setup)));
  // Saved with every move.
  $effect(() => {
    const g = game;
    untrack(() => onsave?.(g));
  });
  let tapped = $state<string[]>([]);

  const round = $derived(game.round!);
  const me = $derived(mySeat(game));
  const mine = $derived(me >= 0 ? round.seats[me] : null);
  const meIn = $derived(!!mine && !mine.folded);
  const composing = $derived(isComposing(round));
  /** Facing a raise on the River: match it or fold. */
  const answering = $derived(me >= 0 && isAnswering(round, me));
  /** You have a move to make this street. */
  const myTurn = $derived(meIn && (round.street !== 3 || answering));
  /** A seat's captain. */
  const captain = (seat: number) => game.players[game.seated[seat]];
  /** The rivals in their places across the top: seat order, left to right (you sit at seat 0, at the bottom). */
  const rivals = $derived(round.seats.map((_, s) => s).filter((s) => s !== me));
  /** The rivals' chairs, left to right, for the whole table: a captain who's gone broke keeps theirs, empty-handed. */
  const chairs = $derived(game.players.map((_, i) => i).filter((i) => game.players[i].id !== HUMAN_ID));

  // --- What's being shown -------------------------------------------------
  /**
   * 'choose': your move. 'replay': the rivals' moves, one at a time (`queue`,
   * `at`). 'reveal': the showdown, one hand at a time. 'verdict': who won, and
   * where the snags went. 'over': the placings.
   */
  let view = $state<'choose' | 'replay' | 'reveal' | 'verdict' | 'over'>('choose');
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
  /** Purses at the start of the hand. */
  let startMoney = $state<number[]>([]);
  $effect.pre(() => {
    if (!startMoney.length) startMoney = game.players.map((p) => p.money);
  });

  /** The rival in focus: the one whose move or hand is being shown. */
  const focus = $derived(view === 'replay' ? queue[at]?.seat : view === 'reveal' && revealOrder[revealed] !== me ? revealOrder[revealed] : undefined);

  // --- Your move ----------------------------------------------------------
  const tappedCards = $derived(mine ? mine.hand.filter((c) => tapped.includes(c.id)) : []);
  const tappedSnags = $derived(mine ? mine.jokers.filter((c) => tapped.includes(c.id)) : []);
  const cost = $derived(
    answering ? round.raise : meIn && !composing ? feeFor(round, game.config, round.street + 1) + discardCost(mine!.discarded.length, tappedCards.length) : 0,
  );
  const preview = $derived(
    view === 'choose' && myTurn && composing ? bestHand([...tappedCards, ...tappedSnags], round.community, { min: tapped.length, max: tapped.length }) : null,
  );
  /** What you have left to put in this hand: a price beyond it is everything, all in. */
  const left = $derived(me >= 0 ? roundLeft(round, me) : 0);
  const goLabel = $derived(moveLabel({ composing, answering, swaps: tappedCards.length, cost, left }));

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
    if (game.phase !== 'hand' || game.round?.result) return;
    before = round;
    const river = composing;
    game = playHighRollers(game, action);
    tapped = [];
    laid = false;
    const r = game.round!;
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
  function thrown(_node: Element, _card?: Card) {
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
    } else if (view === 'verdict') {
      if (game.phase === 'over') {
        view = 'over';
        void ceremony();
      }
      else nextHand();
    }
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

  function nextHand() {
    game = nextHighRollersHand(game);
    startMoney = game.players.map((p) => p.money);
    boardShown = 3;
    view = 'choose';
    if (!myTurn) play(null);
  }

  function again() {
    // A new table starts at the same hand number: its coins start afresh.
    flownHand = paidHand = -1;
    tableNo++;
    game = newHighRollers(Date.now() >>> 0, setup);
    startMoney = game.players.map((p) => p.money);
    tapped = [];
    boardShown = 3;
    view = 'choose';
  }

  // --- Showing it ---------------------------------------------------------
  const shownTo = (seat: number) => view === 'verdict' || view === 'over' || (view === 'reveal' && revealOrder.includes(seat) && revealOrder.indexOf(seat) <= revealed);
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
    if (action.type === 'compose') return t('hr.move.raise', { amount: dollars(round.raise) });
    if (action.type === 'match') return t('hr.move.match', { amount: dollars(round.raise) });
    if (action.type === 'draw' && action.cardIds.length) return t('hr.move.swap', { n: action.cardIds.length });
    const fee = feeFor(round, game.config, (round.history.at(-1)?.street ?? 0) + 1);
    return fee ? t('hr.move.call', { amount: dollars(fee) }) : t('hr.move.check');
  }
  /** Settled purses show only at the verdict; until then, what each had at the start of the hand, less what's in the pot. */
  const settled = $derived(view === 'verdict' || view === 'over');
  const purse = (seat: number) => (settled ? captain(seat).money : startMoney[game.seated[seat]] - betOf(seat));
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
  /** Which table this is (Again deals a new one). */
  let tableNo = $state(0);
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

  // The end: the placings one at a time from the bottom, then your takings counted out.
  let placed = $state(99);
  let counted = $state(0);
  const PLACE_MS = 900;
  const COUNT_MS = 1400;
  async function ceremony() {
    const order = placings(game);
    const score = highRollersResult(game).score;
    coins.begin();
    try {
      placed = 0;
      counted = 0;
      for (let i = 0; i < order.length; i++) {
        await pause(PLACE_MS);
        placed = i + 1;
      }
      await pause(PLACE_MS / 2);
      if (coins.still || !score) counted = score;
      else {
        const start = performance.now();
        await new Promise<void>((done) => {
          const step = (now: number) => {
            const f = Math.min(1, (now - start) / COUNT_MS);
            counted = coins.rushing ? score : Math.round(score * (1 - Math.pow(1 - f, 3)));
            if (counted >= score) return done();
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        clink();
      }
    } finally {
      placed = 99;
      counted = score;
      coins.end();
    }
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
      .map((id) => ({ from: snagsWere.get(id), el: rootEl?.querySelector<HTMLElement>(`.rival [data-snag="${id}"], .mine [data-snag="${id}"]`) }))
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
    const hand = game.hand;
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
  const who = (s: number) => (s === me ? t('character.captain.you') : tagName(captain(s).id));
  const verdictText = $derived.by(() => {
    const res = round.result;
    if (!res) return '';
    // You get your own line ("You take the pot!"), not your name in theirs.
    const line = (key: string, s: number) => (s === me ? t(`${key}.you`) : t(key, { name: who(s) }));
    if (res.byFolds) return line('hr.byFolds', res.winners[0]);
    const wins = res.winners.length > 1 ? t('hr.split', { names: res.winners.map(who).join(' & ') }) : line('hr.wins', res.winners[0]);
    const said = res.weakest !== null && res.dumped.length + res.boardTaken.length ? `${wins} ${line('hr.snagsTo', res.weakest)}` : wins;
    // Someone went broke: the next hand is the last.
    // Whoever went broke this hand is named; and if that brings on the last hand, so is that.
    const broke = game.players.filter((p) => p.out && p.outOn === game.hand);
    const named = (p: (typeof broke)[number]) => (p.id === HUMAN_ID ? t('character.captain.you') : tagName(p.id));
    // "You & King", "You, Walrus & King".
    const names = broke.map(named);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names.at(-1)}` : names[0];
    const out = !broke.length ? '' : broke.length > 1 ? t('hr.areOut', { names: list }) : broke[0].id === HUMAN_ID ? t('hr.isOut.you') : t('hr.isOut', { name: named(broke[0]) });
    return [said, out, game.phase === 'handEnd' && game.lastHand ? t('hr.lastHandNext') : ''].filter(Boolean).join(' ');
  });
  const handName = (seat: number) => {
    const h = round.result?.hands[seat];
    return h ? handLabel(h) : null;
  };
  /** A rival's line under their cards: the move being shown, their hand at the showdown, or that they're out of it. */
  function rivalLine(seat: number): string {
    if (view === 'replay' && focus === seat) return moveText(queue[at].action);
    // While the rest answer a raise, the raisers keep saying so.
    if (view === 'choose' && round.street === 3 && round.raisers.includes(seat)) return t('hr.raised', { amount: dollars(round.raise) });
    if (turnedUp(seat) && handName(seat)) return handName(seat)!.call;
    return seen(seat).seats[seat].folded ? t('hr.folded') : '';
  }
  const played = (cards: (Card | null)[]) => cards.filter((c): c is Card => c !== null);
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

  // Picked up again: the board as it was, and on from where the table stood (between hands, the next is dealt).
  onMount(() => {
    if (!resumed) return;
    boardShown = round.community.length;
    if (game.phase === 'handEnd') nextHand();
    else if (game.phase === 'over') view = 'over';
    else if (!myTurn) play(null);
  });
</script>

<!-- A tap anywhere, while the table is moving, hurries it along. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="hr" bind:this={rootEl} onclick={hurry}>
  <!-- A new table (Again) starts afresh: purses laid out new. -->
  {#key tableNo}
  <!-- The rivals across the top, a third of the width each, in seat order. -->
  <div class="rivals">
    {#each chairs as chair (game.players[chair].id)}
      {@const seat = game.seated.indexOf(chair)}
      {#if seat < 0}
        <!-- Broke: still at the table, watching from the rail. -->
        <div class="rival broke">
          <div class="who"><span class="tag">{tagName(game.players[chair].id)}</span></div>
          <div class="rival-cards"><div class="rival-hand"></div></div>
          <div class="rival-purse"><Purse amount={0} start={0} size="tiny" showAmount={false} focus={30} label={tagName(game.players[chair].id)} /></div>
          <p class="line">{t('hr.out')}</p>
        </div>
      {:else}
      {@const p = captain(seat)}
      {@const s = seen(seat).seats[seat]}
      {@const cards = played(s.played).filter((c) => !isJoker(c))}
      {@const snags = snagsOf(seat)}
      <div class="rival" class:focus={focus === seat} class:folded={s.folded}>
        <div class="who">
          {#if dealer === seat}<span class="button" title={t('hr.dealer')}></span>{/if}
          <span class="tag">{tagName(p.id)}</span>
          <SnagFan tiny cards={snags} look={(card) => ({ lifted: turnedUp(seat) && s.played.some((c) => c.id === card.id) })} />
        </div>
        <div class="rival-cards">
          <div class="rival-hand">
            {#if s.folded}
              {#each s.hand as _, i (i)}<CardView faceDown faded />{/each}
            {:else if shownTo(seat) && cards.length}
              <!-- The showdown: their played cards turn over one by one, then what they kept back, dimmed. -->
              {#each cards as card, k (card.id)}
                {#if turning(seat) && k >= turned}<CardView faceDown />{:else}<CardView {card} deal={turning(seat) ? 'flip' : null} />{/if}
              {/each}
              {#each s.hand as card (card.id)}{#if turnedUp(seat)}<CardView {card} faded />{:else}<CardView faceDown faded />{/if}{/each}
            {:else}
              <!-- Thrown cards leave; replacements are dealt in, face down. -->
              {#each Array.from({ length: Math.min(cards.length + handOf(seat).length, holeDealt(seat)) }) as _, i (i)}
                <span class="held" out:thrown><CardView faceDown deal="top" /></span>
              {/each}
            {/if}
          </div>
          <DiscardChips cards={s.discarded} flop={s.flopDiscards} title={tagName(p.id)} />
        </div>
        <div class="rival-purse" data-purse={seat}>
          <Purse amount={purse(seat)} start={startMoney[game.seated[seat]] ?? p.money} size="tiny" showAmount={false} focus={30} label={tagName(p.id)} keep={game.hand} paid={paidOut(seat)} won={wonIn(seat)} />
        </div>
        {#if turnedUp(seat) && round.result?.hands[seat]}
          <!-- Their hand's name opens the hands, best first. -->
          <button class="line ladder-link" onclick={() => (cardPrefs.ladder = round.result?.hands[seat]?.category ?? 'all')}>{rivalLine(seat)}</button>
        {:else}
          <p class="line">{rivalLine(seat)}</p>
        {/if}
      </div>
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
    <PotBand count={potCount} paid={settled} outcome={settled ? verdictText : null} won={!!round.result?.winners.includes(me)} wordy bind:el={pileEl} />
    <Board cards={boardCards} />
  </div>

  <!-- Your side, as in a duel: your money nearest the pot, then your cards, your snags and your discards. -->
  <div class="mine">
    <div class="my-purse" data-purse={me}>
      {#if mine}
        <Purse amount={purse(me)} start={startMoney[game.seated[me]] ?? captain(me).money} showAmount={false} focus={18} label={t('character.captain.you')} keep={game.hand} paid={paidOut(me)} won={wonIn(me)} tidy />
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
    {#if view === 'choose' && myTurn && composing && round.raise && laid}
      <!-- The River, your hand laid: raise on it, or let it stand. Either commits you. -->
      <!-- All in already: nothing left to raise with. -->
      <button class="ghost" onclick={() => go(true)} data-heavy="true" disabled={left === 0}>{round.raise > left && left > 0 ? t('draw.allIn', { amount: dollars(left) }) : t('hr.raise', { amount: dollars(round.raise) })}</button>
      <button onclick={() => go()} data-heavy="true">{t('show.next')}</button>
    {:else if view === 'choose' && myTurn && composing && round.raise}
      <!-- The River, first: lay your hand (held: high stakes, heavy decisions; then Raise or Next commits it). -->
      <button class="ghost" disabled>{t('draw.fold')}</button>
      <button onclick={() => (laid = true)} data-heavy="true">{goLabel}</button>
    {:else if view === 'choose' && myTurn}
      <button class="ghost" onclick={() => play({ type: 'fold' })} disabled={!canFold(round, me)}>{t('draw.fold')}</button>
      <button onclick={() => go()} data-heavy={composing || answering || tappedCards.length > 0 || cost > 0 ? 'true' : undefined}>{goLabel}</button>
    {:else if view === 'over'}
      <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
      {#if onfinish}<button onclick={() => onfinish(highRollersResult(game))}>{t('show.continue')}</button>{:else}<button onclick={again}>{t('hr.again')}</button>{/if}
    {:else if view === 'replay'}
      <!-- The rivals' turns: Next through them, one by one, or Skip to the end. -->
      <button class="ghost" onclick={skipReplay}>{t('show.skip')}</button>
      <button onclick={next}>{t('show.next')}</button>
    {:else}
      <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
      <button onclick={next}>{t('show.next')}</button>
    {/if}
  </ActionBar>

  {/key}

  {#if view === 'over'}
    <!-- The placings: those still standing take gold, silver and bronze by purse; what you walk away with is your score. -->
    {@const result = highRollersResult(game)}
    {@const order = placings(game)}
    <div class="placings">
      <!-- Placed one at a time, from the bottom up; then what you walk away with, counted out. -->
      <ol>
        {#each order as p, i (p.id)}
          <li class:me={p.id === HUMAN_ID} class:out={p.out} class:placed={i >= order.length - placed}>
            <span class="medal {p.out ? '' : `m${i}`}">{p.out ? '' : i + 1}</span>
            <span>{p.id === HUMAN_ID ? t('character.captain.you') : tagName(p.id)}</span>
            <span>{p.out ? t('table.out') : t(`hr.place.${i}`)}</span>
            <span>{p.out ? '' : dollars(p.money)}</span>
          </li>
        {/each}
      </ol>
      <p class="score" class:shown={placed >= order.length}>{result.score ? t('hr.walkAway', { amount: dollars(counted) }) : t('hr.broke')}</p>
    </div>
  {/if}
</div>

<style>
  /*
   * The duel's screen grid: 12 columns (a card is two and a gap wide), the
   * table kept to the bottom so the buttons sit where they always do.
   */
  .hr {
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
  .hr > :not(.placings) {
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
  .hr :global(.card:not(.huge)) {
    --w: var(--card-w) !important;
  }

  /* The rivals: four columns each, every one the same fixed height, so nothing moves. */
  .rival {
    grid-column: span 4;
    container-type: inline-size;
    display: grid;
    /* Mirroring yours across the table: name at their edge, cards held close, their purse with them, and what they do (or hold) under it, nearest the pot. */
    grid-template-rows: 26px auto auto 1.9rem;
    row-gap: 3px;
    padding: 3px 4px 0;
    margin: -4px -4px 0;
    border: 1px solid transparent;
    border-radius: 4px;
    min-width: 0;
    transition:
      border-color 0.2s,
      background 0.2s;
  }
  .rival.focus {
    border-color: var(--paper);
    background: rgba(242, 239, 230, 0.06);
  }
  .rival.folded .who,
  .rival.folded :global(.purse) {
    opacity: 0.5;
  }
  .who {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    min-width: 0;
  }
  .tag {
    font-family: var(--title-font);
    font-size: 0.85rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  /* Three small cards, and their discards in a column beside them. */
  .rival-cards {
    --small-w: calc((100cqw - 32px) / 3);
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }
  .rival-hand {
    display: flex;
    gap: 2px;
    flex: none;
    width: calc(100cqw - 28px);
  }
  .rival .rival-hand :global(.card:not(.huge)) {
    --w: var(--small-w) !important;
  }
  /* A card held in a hand: its own box, so it can leave on its own. */
  .held {
    display: block;
    flex: none;
  }
  .rival-cards :global(.discards) {
    --h: calc(var(--small-w) * 1.4);
    width: 20px;
  }
  .rival-cards :global(.discards .chip) {
    font-size: 0.55rem;
    border-radius: 2px;
  }
  .rival-cards :global(.discards .suit) {
    display: none;
  }
  /* Winnings come to rest on it, placed from here. */
  .rival-purse {
    position: relative;
  }
  .line {
    margin: 0;
    font-size: 0.7rem;
    line-height: 1.25;
    text-align: center;
    overflow: hidden;
  }
  .rival.folded .line {
    color: var(--grey);
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
  .placings {
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 30%;
    margin: 0;
    padding: 1rem;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    outline: 1px solid var(--paper);
    outline-offset: 4px;
    z-index: 60;
  }
  .placings ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .placings li.out {
    color: var(--grey);
  }
  /* Placed one at a time: each line arrives when its turn comes. */
  .placings li {
    visibility: hidden;
  }
  .placings li.placed {
    visibility: visible;
    animation: placed 0.4s ease-out;
  }
  @keyframes placed {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .score {
    visibility: hidden;
  }
  .score.shown {
    visibility: visible;
  }
  /* Medals in black and white: bright, pale, dark. */
  .medal {
    display: inline-grid;
    place-items: center;
    width: 1.4em;
    height: 1.4em;
    border-radius: 50%;
    font-family: var(--title-font);
    font-size: 0.8em;
  }
  .medal.m0 {
    background: var(--paper);
    color: #0c0c0b;
    box-shadow:
      0 0 0 2px #0c0c0b,
      0 0 0 3px var(--paper);
  }
  .medal.m1 {
    background: #a9a69e;
    color: #0c0c0b;
  }
  .medal.m2 {
    background: #5d5a54;
    color: var(--paper);
  }
  /* A broke captain: still in their chair, greyed. */
  .rival.broke {
    opacity: 0.45;
  }
  .rival-hand {
    min-height: calc(var(--small-w) * 1.4);
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
  .score {
    margin: 0.75rem 0 0;
    text-align: center;
    font-family: var(--title-font);
    font-size: 1.2rem;
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
  .placings li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.3rem 0;
  }
  .placings li.me {
    font-weight: bold;
  }
</style>
