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
    tableAnswering,
    tableLeft,
    tableCanFold,
    tableComposing,
    tableFee,
    type Action,
    type Card,
    type HighRollersResult,
    type HighRollersSetup,
    type HighRollersState,
    type TableRound,
  } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import Pile from './Pile.svelte';
  import Purse from './Purse.svelte';
  import { dollars, tagName } from './format';
  import { handLabel } from './handNames';
  import { heavy } from './heavy';
  import { flyInto, landAll, reducedMotion } from './coins';
  import { tick, untrack } from 'svelte';

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
  let { onmenu, setup, onfinish }: { onmenu: () => void; setup?: HighRollersSetup; onfinish?: (result: HighRollersResult) => void } = $props();

  let game = $state.raw<HighRollersState>(newHighRollers(Date.now() >>> 0, untrack(() => setup)));
  let tapped = $state<string[]>([]);

  const round = $derived(game.round!);
  const me = $derived(mySeat(game));
  const mine = $derived(me >= 0 ? round.seats[me] : null);
  const meIn = $derived(!!mine && !mine.folded);
  const composing = $derived(tableComposing(round));
  /** Facing a raise on the River: match it or fold. */
  const answering = $derived(me >= 0 && tableAnswering(round, me));
  /** You have a move to make this street. */
  const myTurn = $derived(meIn && (round.street !== 3 || answering));
  /** A seat's captain. */
  const captain = (seat: number) => game.players[game.seated[seat]];
  /** The rivals in their places across the top: seat order, left to right (you sit at seat 0, at the bottom). */
  const rivals = $derived(round.seats.map((_, s) => s).filter((s) => s !== me));

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
  let before = $state.raw<TableRound | null>(null);
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
    return seen(seat).seats[seat].hand;
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
    answering ? round.raise : meIn && !composing ? tableFee(game.config, round.month, round.street + 1, round.stakes) + discardCost(mine!.discarded.length, tappedCards.length) : 0,
  );
  const preview = $derived(
    myTurn && composing ? bestHand([...tappedCards, ...tappedSnags], round.community, { min: tapped.length, max: tapped.length }) : null,
  );
  /** What you have left to put in this hand: a price beyond it is everything, all in. */
  const left = $derived(me >= 0 ? tableLeft(round, me) : 0);
  const goLabel = $derived(
    cost > left && left > 0
      ? t('hr.allIn', { amount: dollars(left) })
      : cost > left
      ? t('draw.check') // all in already: nothing more to put in, and you stay in
      : answering
      ? t('hr.match', { amount: dollars(cost) })
      : composing
      ? t('draw.play')
      : tappedCards.length
        ? `${t('draw.discard', { n: tappedCards.length })} · ${dollars(cost)}`
        : cost
          ? `${t('draw.call')} · ${dollars(cost)}`
          : t('draw.check'),
  );

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
    const shown = (s: number, a: Action | null) => !!a && (auto ? !(s === me && a.type === 'fold') : s !== me && (!river || (a.type === 'compose' && !!a.raise)));
    queue = order.filter((s) => shown(s, moves[s])).map((s) => ({ seat: s, action: moves[s]! }));
    at = auto ? -1 : 0;
    betsAt = at;
    boardShown = before.community.length;
    if (!queue.length) afterReplay();
    else {
      view = 'replay';
      if (auto) void playOut();
    }
  }

  /** A thrown card: up out of the hand, turning, and gone (only in a swap, and not when hurried). */
  function thrown(_node: Element) {
    return { duration: !swapping || rushing || reducedMotion() ? 0 : THROW_MS, css: (t: number) => `transform: translate(${(1 - t) * 14}px, ${(1 - t) * -26}px) rotate(${(1 - t) * 12}deg); opacity: ${t}` };
  }

  /** A breath between beats (none when hurried). */
  const pause = (ms: number) => (rushing || reducedMotion() ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, ms)));
  const STEP_MS = 700;
  const THROW_MS = 450;

  /**
   * The Flop's or the Turn's moves, by themselves, in seating order: each
   * seat's thrown cards go, its replacements are dealt (yours face up,
   * slowly), then its money goes in, and a breath before the next.
   */
  async function playOut() {
    pending++;
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
        await flows;
        await pause(STEP_MS);
      }
    } finally {
      swapping = null;
      if (--pending === 0) rushing = false;
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
      if (revealed + 1 < revealOrder.length) revealed++;
      else view = 'verdict';
    } else if (view === 'verdict') {
      if (game.phase === 'over') view = 'over';
      else nextHand();
    }
  }

  /** Past the rest of the rivals' moves at once: their money goes in without the flights. */
  async function skipReplay() {
    rushing = true;
    afterReplay();
    // Their payments are queued once the table updates; the hurry ends when they're done.
    await tick();
    later(async () => {});
  }

  function afterReplay() {
    // A new card for the board waits its turn, after the money.
    if (round.community.length > boardShown) later(dealBoard);
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
  /** What a rival did, in a word or two. */
  function moveText(action: Action): string {
    if (action.type === 'fold') return t('hr.move.fold');
    if (action.type === 'compose') return t('hr.move.raise', { amount: dollars(round.raise) });
    if (action.type === 'match') return t('hr.move.match', { amount: dollars(round.raise) });
    if (action.type === 'draw' && action.cardIds.length) return t('hr.move.swap', { n: action.cardIds.length });
    const fee = tableFee(game.config, round.month, (round.history.at(-1)?.street ?? 0) + 1, round.stakes);
    return fee ? t('hr.move.call', { amount: dollars(fee) }) : t('hr.move.check');
  }
  /** Settled purses show only at the verdict; until then, what each had at the start of the hand, less what's in the pot. */
  const settled = $derived(view === 'verdict' || view === 'over');
  const purse = (seat: number) => (settled ? captain(seat).money : startMoney[game.seated[seat]] - betOf(seat));
  /** What each seat has in the pot, as far as the table has seen. */
  const shownBets = $derived(round.seats.map((_, s) => betOf(s)));
  const potCount = $derived(shownBets.reduce((a, b) => a + b, 0));

  // --- Coins in flight, and the deal ------------------------------------------
  // Money moves one purse at a time, and heavily: a seat's coins leave from
  // where they stood in its purse and land on the pile's next spots, and only
  // when the last has landed does the next purse pour. At the verdict the pile
  // flies to the winners, onto the spots their purses have laid out for what
  // they won (purses keep their stacks from hand to hand, so that's where the
  // coins stay). The cards are dealt the same way, after the antes. Everything
  // waits its turn in one queue; a tap anywhere hurries it all along (the
  // stacks just change, as they do for those who'd rather have no motion).
  let rootEl = $state<HTMLElement>();
  let pileEl = $state<HTMLElement>();
  /** Whose each coin in the pile is, in the order they landed. */
  let owners: number[] = [];
  let flown: number[] = [];
  let flownHand = -1;
  let paidHand = -1;
  /** Which table this is (Again deals a new one). */
  let tableNo = $state(0);
  const MAX_FLYERS = 40;
  /** A coin's flight, and the beat between one coin and the next. */
  const FLIGHT_MS = 650;
  const POUR_MS = 70;
  /** The deal: a card face up (the board, yours) changes the game, so it comes slowly; one face down to a rival, quicker. */
  const FACE_UP_MS = 650;
  const FACE_DOWN_MS = 220;
  const purseEl = (seat: number) => rootEl?.querySelector<HTMLElement>(`[data-purse="${seat}"]`) ?? null;

  /** Flows waiting or under way; while there are any, the table is busy and the buttons wait. */
  let pending = $state(0);
  let flows: Promise<void> = Promise.resolve();
  /** Hurrying: what's queued happens at once, without movement. */
  let rushing = false;
  function later(run: () => Promise<void>) {
    pending++;
    flows = flows
      .then(run)
      .catch(() => {})
      .finally(() => {
        if (--pending === 0) rushing = false;
      });
  }
  /** Coins moving from one place to another, one after another; resolves when the last has landed. */
  function pour(moves: [Element, HTMLElement][]): Promise<void> {
    for (const [src] of moves) src.classList.remove('waiting');
    if (rushing || reducedMotion()) {
      for (const [, spot] of moves) spot.classList.remove('landing');
      return Promise.resolve();
    }
    return Promise.all(moves.map(([src, spot], i) => flyInto(src, spot, i * POUR_MS, undefined, FLIGHT_MS))).then(() => {});
  }
  /** A tap on the table (not on a button or a card: those are moves): everything in the air lands, and whatever is queued happens at once. */
  function hurry(e?: MouseEvent) {
    if (!pending || (e?.target instanceof Element && e.target.closest('button'))) return;
    rushing = true;
    landAll();
    dealt = DEALT_ALL;
    boardShown = Math.max(boardShown, round.community.length);
  }

  /** A seat paid dollars a..b into the pot: its coins wait in its purse for its turn, then pour into the pile. */
  function payIn(seat: number, a: number, b: number) {
    const purse = purseEl(seat);
    const moves: [Element, HTMLElement][] = [];
    for (let k = a; k < b; k++) {
      const spot = pileEl?.querySelector<HTMLElement>(`[data-k="${owners.length}"]`);
      owners.push(seat);
      const src = purse?.querySelector(`[data-d="${k}"]`);
      if (!spot || !src || k >= a + MAX_FLYERS) continue;
      spot.classList.add('landing');
      src.classList.add('waiting');
      moves.push([src, spot]);
    }
    if (moves.length) later(() => pour(moves));
  }

  /** The verdict: the pile flies to the winners (a winner's own coins to it, the rest shared out among them in turn). */
  function payOut(winners: number[]) {
    if (!pileEl) return;
    const landed = new Map<number, number>();
    let shared = 0;
    const coins = [...pileEl.querySelectorAll<HTMLElement>('[data-k]')];
    const first = Math.max(0, coins.length - MAX_FLYERS * 2);
    const moves: [Element, HTMLElement][] = [];
    coins.forEach((c, i) => {
      const owner = owners[Number(c.dataset.k)];
      const to = winners.includes(owner) ? owner : winners[shared++ % winners.length];
      const g = landed.get(to) ?? 0;
      landed.set(to, g + 1);
      const spot = purseEl(to)?.querySelector<HTMLElement>(`[data-g="${g}"]`);
      // Only the last few dozen fly (the rest are there already when the pot is paid).
      if (!spot || i < first) return;
      spot.classList.add('landing');
      c.classList.add('waiting');
      moves.push([c, spot]);
    });
    if (moves.length) later(() => pour(moves).then(() => moves.forEach(([c]) => c.classList.remove('waiting'))));
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
  /** The pause before the Flop, and between its cards: Boom. Boom. BOOM. */
  const FLOP_MS = [1100, 1000, 1300];
  function deal(): Promise<void> {
    if (rushing || reducedMotion()) {
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
        if (rushing) dealt = DEALT_ALL;
        if (dealt >= cards) return done();
        const i = dealt++;
        setTimeout(tick, after(i));
      };
      tick();
    });
  }

  /** The next street's card onto the board, in a beat of its own. */
  function dealBoard(): Promise<void> {
    if (rushing || reducedMotion()) {
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

  $effect(() => {
    const bets = shownBets;
    const hand = game.hand;
    const winners = settled ? round.result?.winners : undefined;
    untrack(() => {
      const fresh = hand !== flownHand;
      if (fresh) {
        flownHand = hand;
        flown = bets.map(() => 0);
        owners = [];
        dealt = 0;
      }
      // In seat order from the first, so the pile fills the way the table played: a purse at a time.
      for (let j = 0; j < bets.length; j++) {
        const s = (round.first + j) % bets.length;
        if (bets[s] > flown[s]) payIn(s, flown[s], bets[s]);
      }
      flown = [...bets];
      // A new hand: the antes in, then the deal.
      if (fresh) later(deal);
      if (winners && paidHand !== hand) {
        paidHand = hand;
        payOut(winners);
      }
    });
  });
  /** The table is moving: money in the air, cards being dealt. The buttons wait. */
  const busy = $derived(pending > 0);
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
    const said = res.weakest !== null && res.dumped.length ? `${wins} ${line('hr.snagsTo', res.weakest)}` : wins;
    // Someone went broke: the next hand is the last.
    return game.phase === 'handEnd' && game.lastHand ? `${said} ${t('hr.lastHandNext')}` : said;
  });
  const handName = (seat: number) => {
    const h = round.result?.hands[seat];
    return h ? handLabel(h) : null;
  };
  /** A rival's line under their cards: the move being shown, their hand at the showdown, or that they're out of it. */
  function rivalLine(seat: number): string {
    if (view === 'replay' && focus === seat) return moveText(queue[at].action);
    if (shownTo(seat) && handName(seat)) return handName(seat)!.call;
    return seen(seat).seats[seat].folded ? t('hr.folded') : '';
  }
  const played = (cards: (Card | null)[]) => cards.filter((c): c is Card => c !== null);
  const myPlayed = $derived(mine ? played(mine.slots).filter((c) => !isJoker(c)) : []);
  const myPlayedSnags = $derived(new Set(mine ? played(mine.slots).filter(isJoker).map((c) => c.id) : []));
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
<div class="hr" bind:this={rootEl} onclick={hurry}>
  <!-- A new table (Again) starts afresh: purses laid out new. -->
  {#key tableNo}
  <!-- The rivals across the top, a third of the width each, in seat order. -->
  <div class="rivals">
    {#each rivals as seat (captain(seat).id)}
      {@const p = captain(seat)}
      {@const s = seen(seat).seats[seat]}
      {@const cards = played(s.slots).filter((c) => !isJoker(c))}
      {@const snags = snagsOf(seat)}
      <div class="rival" class:focus={focus === seat} class:folded={s.folded}>
        <div class="who">
          {#if dealer === seat}<span class="button" title={t('hr.dealer')}></span>{/if}
          <span class="tag">{tagName(p.id)}</span>
          {#if snags.length}
            <div class="snag-fan tiny" style="--n: {snags.length}">
              {#each snags as card (card.id)}<CardView {card} lifted={shownTo(seat) && s.slots.some((c) => c?.id === card.id)} />{/each}
              {#if snags.length > 1}<span class="snag-count">×{snags.length}</span>{/if}
            </div>
          {/if}
        </div>
        <div class="rival-cards">
          <div class="rival-hand">
            {#if s.folded}
              {#each s.hand as _, i (i)}<CardView faceDown faded />{/each}
            {:else if shownTo(seat) && cards.length}
              {#each cards as card (card.id)}<CardView {card} />{/each}
              {#each s.hand as card (card.id)}<CardView {card} faded />{/each}
            {:else}
              <!-- Thrown cards leave; replacements are dealt in, face down. -->
              {#each Array.from({ length: Math.min(cards.length + handOf(seat).length, holeDealt(seat)) }) as _, i (i)}
                <span class="held" out:thrown><CardView faceDown deal="top" /></span>
              {/each}
            {/if}
          </div>
          <DiscardChips cards={s.discarded} flop={s.flopDiscards} title={tagName(p.id)} />
        </div>
        <p class="line">{rivalLine(seat)}</p>
        <div class="rival-purse" data-purse={seat}>
          <Purse amount={purse(seat)} start={startMoney[game.seated[seat]] ?? p.money} size="tiny" showAmount={false} focus={30} label={tagName(p.id)} keep={game.hand} paid={paidOut(seat)} won={wonIn(seat)} />
        </div>
      </div>
    {/each}
  </div>

  <!-- The river: the street, the pot and the board. -->
  <div class="felt">
    <!-- The Last Hand says so over the street's name (it plays for double). -->
    <p class="last-hand">{round.stakes > 1 ? t('hr.lastHand', { n: round.stakes }) : ''}</p>
    <p class="street">{t(`street.${streetName}`)}</p>
    <div class="pot-band">
      <div bind:this={pileEl}><Pile count={potCount} paid={settled} /></div>
      {#if settled}<p class="outcome" class:won={round.result?.winners.includes(me)} aria-live="polite">{verdictText}</p>{/if}
    </div>
    <div class="community">
      {#each Array.from({ length: 5 }) as _, i}
        {@const card = i < boardShown && (i >= 3 || flopIndex(i) < dealt) ? (round.community[i] ?? null) : null}
        <!-- Each lands with a thud; the Flop's last card and the River slam down. -->
        {#key card?.id}<CardView {card} deal={i === 2 || i === 4 ? 'slam' : 'drop'} />{/key}
      {/each}
    </div>
  </div>

  <!-- Your side, as in a duel: your money nearest the pot, then your cards, your snags and your discards. -->
  <div class="mine">
    <div class="my-purse" data-purse={me}>
      {#if mine}
        <Purse amount={purse(me)} start={startMoney[game.seated[me]] ?? captain(me).money} showAmount={false} focus={18} label={t('character.captain.you')} keep={game.hand} paid={paidOut(me)} won={wonIn(me)} />
        {#if dealer === me}<span class="button own" title={t('hr.dealer')}></span>{/if}
        {#if preview && !tapped.length && !laid}<p class="my-hand">{t('draw.boardOnly')}</p>{:else if myCall}<p class="my-hand">{myCall.lingo ?? myCall.call}</p>{/if}
      {:else}
        <p class="my-hand">{t('hr.youAreOut')}</p>
      {/if}
    </div>
    <div class="hand-row">
      {#if mine}
        <div class="hand-cell">
          {#each myPlayed as card (card.id)}<CardView {card} used />{/each}
          {#each handOf(me).filter((_, k) => k >= 3 || dealIndex(me, k) < dealt) as card (card.id)}
            <span class="held" out:thrown><CardView
              {card}
              deal="left"
              selected={composing && !laid && tapped.includes(card.id)}
              used={laid && tapped.includes(card.id)}
              toss={!composing && tapped.includes(card.id)}
              faded={mine.folded || (shownTo(me) && myPlayed.length > 0) || (laid && !tapped.includes(card.id))}
              onclick={view === 'choose' && meIn ? () => tap(card) : undefined}
            /></span>
          {/each}
        </div>
        <div class="fan-cell">
          {#if mySnags.length}
            <!-- However many snags you carry, the fan never grows past its width. -->
            <div class="snag-fan" style="--n: {mySnags.length}">
              {#each mySnags as card (card.id)}
                <CardView
                  {card}
                  selected={!laid && tapped.includes(card.id)}
                  used={myPlayedSnags.has(card.id) || (laid && tapped.includes(card.id))}
                  lifted={shownTo(me) && myPlayedSnags.has(card.id)}
                  onclick={view === 'choose' && meIn && composing ? () => tap(card) : undefined}
                />
              {/each}
              {#if mySnags.length > 2}<span class="snag-count">×{mySnags.length}</span>{/if}
            </div>
          {/if}
        </div>
        <div class="discard-cell"><DiscardChips tall cards={mine.discarded} flop={mine.flopDiscards} title={t('draw.yourDiscards')} /></div>
      {/if}
    </div>
  </div>

  <!-- The two buttons. Call, Swap and Play hand are held (heavy); the rest are light taps. -->
  <div class="actions" use:heavy inert={busy}>
    {#if view === 'choose' && myTurn && composing && round.raise && laid}
      <!-- The River, your hand laid: raise on it, or let it stand. Either commits you. -->
      <!-- All in already: nothing left to raise with. -->
      <button class="ghost" onclick={() => go(true)} data-heavy="true" disabled={left === 0}>{round.raise > left && left > 0 ? t('hr.allIn', { amount: dollars(left) }) : t('hr.raise', { amount: dollars(round.raise) })}</button>
      <button onclick={() => go()} data-heavy="true">{t('show.next')}</button>
    {:else if view === 'choose' && myTurn && composing && round.raise}
      <!-- The River, first: lay your hand (held: high stakes, heavy decisions; then Raise or Next commits it). -->
      <button class="ghost" disabled>{t('draw.fold')}</button>
      <button onclick={() => (laid = true)} data-heavy="true">{goLabel}</button>
    {:else if view === 'choose' && myTurn}
      <button class="ghost" onclick={() => play({ type: 'fold' })} disabled={!tableCanFold(round, me)}>{t('draw.fold')}</button>
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
  </div>

  {/key}

  {#if view === 'over'}
    <!-- The placings: those still standing take gold, silver and bronze by purse; what you walk away with is your score. -->
    {@const result = highRollersResult(game)}
    <div class="placings">
      <ol>
        {#each placings(game) as p, i (p.id)}
          <li class:me={p.id === HUMAN_ID} class:out={p.out}>
            <span>{p.id === HUMAN_ID ? t('character.captain.you') : tagName(p.id)}</span>
            <span>{p.out ? t('table.out') : t(`hr.place.${i}`)}</span>
            <span>{p.out ? '' : dollars(p.money)}</span>
          </li>
        {/each}
      </ol>
      <p class="score">{result.score ? t('hr.walkAway', { amount: dollars(result.score) }) : t('hr.broke')}</p>
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
    /* Mirroring yours across the table: name at their edge, cards held close, the purse nearest the pot. */
    grid-template-rows: 26px auto 1.9rem auto;
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
  .rival .snag-fan :global(.card:not(.huge)) {
    --w: 18px !important;
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
  .pot-band {
    position: relative;
    margin: 0.2rem 0 0.5rem;
  }
  .outcome {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.1rem;
    line-height: 1.2;
    color: var(--grey);
    text-wrap: balance;
    /* Once the coins are on their way. */
    animation: outcome 0.4s ease-out 0.6s backwards;
  }
  .outcome.won {
    color: var(--paper);
  }
  @keyframes outcome {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
  }
  .community {
    display: flex;
    justify-content: center;
    gap: var(--gap);
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
    pointer-events: none;
  }
  .hand-row {
    display: grid;
    grid-template-columns: subgrid;
    align-items: end;
    height: calc(var(--card-w) * 1.4 + 14px);
  }
  .hand-cell {
    grid-column: 1 / 7;
    display: flex;
    gap: var(--gap);
    align-items: flex-end;
  }
  .fan-cell {
    grid-column: 7 / 11;
    display: flex;
    align-items: flex-end;
  }
  .discard-cell {
    grid-column: 11 / 13;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
  /* However many snags, the fan keeps to its four columns. */
  .snag-fan {
    --fan: calc(4 * var(--col) + 3 * var(--gap));
    position: relative;
    display: flex;
    max-width: var(--fan);
  }
  .snag-fan :global(.card + .card) {
    margin-left: min(3px, calc((var(--fan) - var(--card-w) * var(--n)) / (var(--n) - 1)));
  }
  /* A rival's fan: little snags, overlapping, beside the purse. */
  .snag-fan.tiny {
    --fan: 32px;
    flex: none;
    margin-left: auto;
  }
  .snag-fan.tiny :global(.card + .card) {
    margin-left: min(2px, calc((var(--fan) - 18px * var(--n)) / (var(--n) - 1)));
  }
  .snag-count {
    position: absolute;
    top: -6px;
    right: -6px;
    z-index: 4;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--ink);
    border: 1px solid var(--grey);
    font-family: var(--title-font);
    font-size: 0.75rem;
    line-height: 1.3;
  }
  .tiny .snag-count {
    font-size: 0.6rem;
    padding: 0 3px;
  }

  .actions {
    position: relative;
    z-index: 51;
  }
  .actions > button:first-child {
    grid-column: 1 / 7;
  }
  .actions > button:last-child {
    grid-column: 7 / 13;
  }
  .actions button {
    padding-top: 0.6em;
    padding-bottom: 0.6em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    grid-template-columns: 1fr auto auto;
    gap: 0.75rem;
    padding: 0.3rem 0;
  }
  .placings li.me {
    font-weight: bold;
  }
</style>
