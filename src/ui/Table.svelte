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
  import Countdown from './Countdown.svelte';
  import HowTo from './HowTo.svelte';
  import Speech, { autoMs, beats, BEAT_MS, type Reply, type SpeechLine } from './Speech.svelte';
  import { cardLabel, jokerList, name, tagName } from './format';
  import { flight } from './flight.svelte';
  import { rankLabel, winnerOf } from '../engine';
  import type { RoundScript, Trigger } from '../story/script';
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
    /** Beside the street's name: which crossing this is. */
    label?: string;
    /** In place of the street's name (what covers the board: the standings). */
    heading?: string;
    /** The game is over with this hand: all the money yours, or all of it theirs (for what's said after it). */
    ending?: 'wonAll' | 'lostAll';
  }

  let {
    table,
    onplay,
    onnext,
    onmenu,
    onseat,
    cover,
    buttons,
    script,
    ontalk,
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
    /** This hand's lines, spoken as it reaches each trigger (a lesson, a story's encounter). */
    script?: RoundScript;
    /** An answer in a conversation set something going (`buttons`, `snag:hides`…): whoever runs the game handles it. */
    ontalk?: (effect: string) => void;
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
    // Without a pot (the first lessons) nothing costs anything.
    !round.potMode ? 0 : answering ? round.raise : meIn && !composing ? feeFor(round, table.config, round.street + 1) + discardCost(mine!.discarded.length, tappedCards.length) : 0,
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
    // The move a line was waiting for closes it as it's made; so does any table talk still up: play comes first.
    // Made while its replies still stood, it skips past the line that would have asked for it.
    const skip = shortcut;
    if (skip) nextLine();
    if (line?.require || (line && !line.replies && line.size === 'aside')) nextLine();
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
      // Past the verdict: the hand's closing lines first, if it has any.
      if (!fire('verdict')) onnext();
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
      // A hand picked up again after it was over opens at its verdict.
      view = round.result ? 'verdict' : 'choose';
      boardShown = first ? Math.max(3, round.community.length) : 3;
      showHelp = false;
      if (table.phase === 'handEnd') onnext();
      else if (table.phase === 'hand' && !round.result && !myTurn) play(null);
    });
  });

  // --- Table talk -------------------------------------------------------
  // Captains (and Willie) speaking at the table: a conversation is a list of lines, shown one at a time.
  let talk = $state<{ lines: SpeechLine[]; i: number } | null>(null);
  /** The line the conversation is at; it comes up once every coin in the air has landed. */
  const nextUp = $derived(talk ? talk.lines[talk.i] : null);
  let landedFor = $state<SpeechLine | null>(null);
  $effect(() => {
    const up = nextUp;
    // (Cleared between conversations: a rematch says the very same lines again.)
    if (!up) {
      landedFor = null;
      return;
    }
    if (up === landedFor || flight.coins > 0 || flight.flows > 0) return;
    // A frame later: coins sent off in the same moment as the line (the antes at a deal) are in the air by then.
    const id = requestAnimationFrame(() => {
      if (flight.coins === 0 && flight.flows === 0) landedFor = up;
    });
    return () => cancelAnimationFrame(id);
  });
  const line = $derived(nextUp && nextUp === landedFor ? nextUp : null);
  /** A line waiting for the coins: the buttons wait with it, so it can't be skipped unseen. */
  const lineWaiting = $derived(!!nextUp && !line);
  /** Exactly these cards tapped, and only these. Whole cards first, then ranks, so `4c` and `4` both find their four. */
  function tappedAre(want: string[]): boolean {
    if (tapped.length !== want.length || tappedSnags.length) return false;
    const open = [...want].sort((a, b) => b.length - a.length);
    return tappedCards.every((c) => {
      const k = open.findIndex((w) => w === c.id || (!isJoker(c) && w === rankLabel(c.rank)));
      return k >= 0 && open.splice(k, 1).length > 0;
    });
  }
  /** A move still to be taught in this conversation (and not yet asked for): the table holds its tongue until then. */
  const lessonAhead = $derived(!line?.require && !!talk?.lines.slice(talk.i).some((l) => l.require));
  /** The line is waiting for a move at the table: the white button only takes that one. */
  const complies = $derived.by(() => {
    const want = line?.require;
    // A move asked for later in the conversation: no playing ahead of it.
    if (!want) return !lessonAhead;
    if (want === 'fold' || want === 'help') return false;
    return tappedAre(want);
  });
  /** "Show me": the line wants cards tapped to see what they make (no move); its replies wait for them. */
  const naming = $derived(!!line?.names);
  const named = $derived(!!line?.names && tappedAre(line.names));
  // Replies side by side unless one would be cut off on this screen: then they stack (measured, not guessed).
  let actionsEl = $state<HTMLElement>();
  let stackFor = $state<SpeechLine | null>(null);
  const stackReplies = $derived(!!line && stackFor === line);
  $effect(() => {
    const l = line;
    if (!l?.replies || l.replies.length > 2) return;
    tick().then(() => {
      if (line !== l || !actionsEl) return;
      const cut = [...actionsEl.querySelectorAll<HTMLButtonElement>(':scope > button:not([disabled])')].some((b) => b.scrollWidth > b.clientWidth + 1);
      if (cut) stackFor = l;
    });
  });
  /** A line with replies that also takes a move: once the move is tapped, the play buttons replace the replies. */
  const shortcut = $derived(!!line?.replies && !!line.require && complies);
  /** The line has the buttons: an answer to give, or a scene or more to read (one that asks for a move leaves them to play). */
  const holding = $derived(!!line && ((!!line.replies && !shortcut) || (line.size !== 'aside' && !line.require)));
  /** A rival speaking: their lines come from their side of the table. */
  const rivalSpeaks = (who: string) => table.ids.some((id, s) => s !== me && id === who);
  /** Your lines come from your side of the table, theirs from theirs. */
  const lowLine = $derived(!!line && line.size !== 'full' && (line.who === 'you' || line.at === 'low'));
  let feltEl = $state<HTMLElement>();
  let boardEl = $state<HTMLElement>();
  let myPurseEl = $state<HTMLElement>();
  let speechAt = $state({ top: 0, bottom: 0 });
  /** Where a caption of each size sits, in px from the table's top and bottom edges. */
  function placeSpeech() {
    if (!line || !rootEl || !actionsEl || !boardEl || !feltEl) return;
    const tbl = rootEl.getBoundingClientRect();
    const rivalsEl = rootEl.querySelector('.rivals');
    const cards = (rivalsEl?.querySelector('.cards, .small-cards') ?? rivalsEl)?.getBoundingClientRect() ?? tbl;
    const buttonsTop = actionsEl.getBoundingClientRect().top - 10;
    if (lowLine && myPurseEl) {
      const purse = myPurseEl.getBoundingClientRect();
      // Your own asides sit over your purse, where your stacks go.
      if (line.size === 'aside') speechAt = { top: purse.top - tbl.top, bottom: tbl.bottom - purse.bottom };
      else {
        // Over your side: below the name of your hand (which stays readable), down to the buttons.
        const named = myPurseEl.querySelector('.my-hand')?.getBoundingClientRect().bottom;
        speechAt = { top: (named ?? purse.top) + 8 - tbl.top, bottom: tbl.bottom - buttonsTop };
      }
      return;
    }
    const river = feltEl.getBoundingClientRect();
    if (line.at === 'band') {
      // Their half, between their cards and the board: both stay in view.
      speechAt = { top: river.top - tbl.top, bottom: tbl.bottom - (boardEl.getBoundingClientRect().top - 20) }; // clear of the ▼ marks over the board
      return;
    }
    if (line.at === 'mid') {
      // Over the empty board, before the deal: their cards row (and their snags) stay in view.
      speechAt = { top: river.top - tbl.top, bottom: tbl.bottom - boardEl.getBoundingClientRect().bottom };
      return;
    }
    const from = line.size === 'full' ? tbl.top + parseFloat(getComputedStyle(rootEl).paddingTop) : cards.top;
    const to = line.size === 'aside' ? cards.bottom : line.size === 'scene' ? boardEl.getBoundingClientRect().bottom : buttonsTop;
    speechAt = { top: from - tbl.top, bottom: tbl.bottom - to };
  }
  $effect(() => {
    if (!line) return;
    untrack(placeSpeech);
    window.addEventListener('resize', placeSpeech);
    return () => window.removeEventListener('resize', placeSpeech);
  });
  /** Starts a conversation, or queues it behind the one under way. */
  function say(lines: SpeechLine[]) {
    if (!lines.length) return;
    // A line said over the deal gives way to whatever comes next.
    if (talk && line?.dealing) talk = { lines, i: 0 };
    else talk = talk ? { ...talk, lines: [...talk.lines, ...lines] } : { lines, i: 0 };
  }
  /** On to the line named `go`, or the next in order; past the last, the conversation is over. */
  function nextLine(go?: string) {
    if (!talk) return;
    const lines = talk.lines;
    // In order, a branch is passed by: only a reply leads there.
    const i = go ? lines.findIndex((l) => l.id === go) : lines.findIndex((l, k) => k > talk!.i && !l.branch);
    talk = i >= 0 && i < talk.lines.length ? { ...talk, i } : null;
    if (!talk) talkOver();
  }
  function answer(reply: Reply) {
    // Shown, not played: the taps go.
    if (line?.names) tapped = [];
    if (reply.effect) ontalk?.(reply.effect);
    if (reply.end) talk = null;
    else nextLine(reply.go);
  }
  /** The lines after a hand, over: on (the next hand, or home), without a word more. */
  function talkOver() {
    if (view === 'verdict' && verdictSaid === table.hand) onnext();
  }
  const speakerName = (who: string) => (who === 'you' ? t('character.captain.you') : who === 'willie' ? t('willie.name') : name(who));
  const lineMs = $derived(line ? autoMs(line) : null);
  // A line that closes by itself: the countdown runs on the speaker's portrait, and the table keeps the time.
  $effect(() => {
    if (!lineMs) return;
    const id = setTimeout(() => nextLine(), lineMs);
    return () => clearTimeout(id);
  });
  // For trying captions out in the browser console (dev builds only): say([...]).
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).say = say;

  // How it works, over the table down to the two buttons, which close it.
  let showHelp = $state(false);
  let helpBottom = $state(0);
  function openHelp() {
    if (rootEl && actionsEl) helpBottom = rootEl.getBoundingClientRect().bottom - actionsEl.getBoundingClientRect().top + 6;
    showHelp = true;
  }
  /** The line asks you to open How it works (the "?" beckons) and close it again: then on. */
  const helpWanted = $derived(line?.require === 'help');
  let helpOpened = false;
  $effect(() => {
    const open = showHelp;
    if (!helpWanted) return void (helpOpened = false);
    if (open) helpOpened = true;
    else if (helpOpened) untrack(() => ((helpOpened = false), nextLine()));
  });

  // Snags you just fished out of the deck: Willie announces them.
  let fishedSeen = 0;
  let fishedHand = -1;
  $effect(() => {
    const r = round;
    untrack(() => {
      const caught = r.fished.filter((f) => f.seat === me);
      if (fishedHand !== table.hand) {
        // A resumed hand shouldn't re-announce old catches; a new one starts fresh.
        fishedSeen = fishedHand === -1 ? caught.length : 0;
        fishedHand = table.hand;
      }
      const fresh = caught.slice(fishedSeen);
      fishedSeen = caught.length;
      if (fresh.length) say([{ size: 'scene', who: 'willie', text: t('willie.fished', { jokers: jokerList(fresh.map((f) => f.joker)) }), replies: [{ label: t('willie.ok') }] }]);
    });
  });

  // A line where they show their hand: their cards stay face up for the rest of the hand.
  let showed = $state<{ hand: number; seats: number[] }>({ hand: -1, seats: [] });
  $effect(() => {
    const l = line;
    if (!l?.show) return;
    const seat = table.ids.indexOf(l.who);
    untrack(() => {
      if (seat < 0 || seat === me) return;
      showed = { hand: table.hand, seats: showed.hand === table.hand ? [...showed.seats, seat] : [seat] };
    });
  });
  const shows = (seat: number) => showed.hand === table.hand && showed.seats.includes(seat);

  // The hand's script: each trigger's lines once, when the hand gets there.
  let fired = new Set<string>();
  /** The hand whose lines after the verdict have been said (their end moves on). */
  let verdictSaid = $state(-1);
  function fire(trigger: Trigger): boolean {
    const key = `${table.hand}:${trigger}`;
    const res = round.result;
    const won = !!res && winnerOf(res) === me;
    // Dumped or kept only while the game goes on: at the end, the last word says it all.
    const outcomes = table.ending ? [table.ending] : won ? ['won', res!.dumped.length ? 'dumped' : 'kept'] : ['lost'];
    const holder = (snag: number) =>
      round.seats[me]?.jokers.some((j) => j.index === snag) ? 'you' : round.seats.some((s, i) => i !== me && s.jokers.some((j) => j.index === snag)) ? 'them' : null;
    const lines = script?.[trigger]?.filter((l) => (!l.when || outcomes.includes(l.when)) && (l.holding ?? []).every((h) => holder(h.snag) === h.by));
    if (!lines?.length || fired.has(key)) return false;
    fired.add(key);
    if (trigger === 'verdict') verdictSaid = table.hand;
    // After the hand, their lines sit on their half between their cards and the board (anyone else's low, over your side);
    // before the deal, over the empty board, so their snags stay in view.
    const place = (l: SpeechLine) => (trigger === 'verdict' ? (rivalSpeaks(l.who) ? 'band' : 'low') : trigger === 'deal' ? 'mid' : undefined);
    say(lines.map((l) => (l.size === 'full' || l.at || !place(l) ? l : { ...l, at: place(l) })));
    return true;
  }
  /** The hand whose cards are all dealt: its street's lines may come. */
  let dealtHand = $state(-1);
  // A street's lines once its cards are on the table and the moves before them have played out.
  $effect(() => {
    if (table.phase !== 'hand' || round.result || view !== 'choose' || busy || dealtHand !== table.hand || round.street > 2) return;
    const trigger: Trigger = round.street === 0 ? 'flop' : round.street === 1 ? 'turn' : 'river';
    untrack(() => fire(trigger));
  });
  // Nothing covers the table while the cards turn: anything still up goes (the lines after the verdict come later, low).
  $effect(() => {
    if (view === 'reveal' && line && line.at !== 'low') untrack(() => (talk = null));
  });
  // A hand that ends in folds has no showdown: its closing lines come as it ends (with none, a lesson moves on after a beat).
  $effect(() => {
    if (view !== 'verdict' || !round.result?.byFolds || !script) return;
    untrack(() => {
      if (!fire('verdict')) setTimeout(() => onnext(), 1200);
    });
  });
  /** Waits until nothing is being said (or only a line said over the deal, its last beat out). */
  let quietWaiters: (() => void)[] = [];
  const quiet = () => (talk && !line?.dealing ? new Promise<void>((done) => quietWaiters.push(done)) : Promise.resolve());
  $effect(() => {
    if (talk && !line?.dealing) return;
    const l = line;
    const release = () => {
      const waiting = quietWaiters;
      quietWaiters = [];
      waiting.forEach((done) => done());
    };
    const wait = l?.dealing ? (beats(l).length - 1) * BEAT_MS + 500 : 0;
    if (!wait) return release();
    const id = setTimeout(release, wait);
    return () => clearTimeout(id);
  });

  /** The hand your taps make: on the River, or when a line asks you to show it. */
  const preview = $derived(
    view === 'choose' && myTurn && (composing || (naming && tapped.length)) ? bestHand([...tappedCards, ...tappedSnags], round.community, { min: tapped.length, max: tapped.length }) : null,
  );

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
    if (seat === me || !n || coins.still || shows(seat)) return;
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
      // A new hand: the antes in, any lines before the deal, then the deal.
      if (fresh) {
        const said = fire('deal');
        const go = () => coins.later(() => deal().then(() => void (dealtHand = hand)));
        if (said) void quiet().then(go);
        else go();
      }
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
    // You folded and one captain is left: say so (with more still at the table, the rest folded too).
    if (res.byFolds && me >= 0 && round.seats[me].folded && res.winners.length === 1 && round.seats.length === 2) return t('hr.youFolded', { name: who(res.winners[0]) });
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
    if (s.folded && !shows(seat)) return s.hand.map((_, i) => ({ key: `f${i}`, faceDown: true, faded: true }));
    // Shown (a lesson, an encounter): face up, as they are, for the rest of the hand.
    if (shows(seat) && !(shownTo(seat) && shown.length))
      return [...shown, ...handOf(seat)].slice(0, Math.max(shown.length, holeDealt(seat))).map((card) => ({ key: card.id, card, fresh: true, held: !shown.some((c) => c.id === card.id) }));
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

  const callout = $derived(preview ? handLabel(preview) : null);
  /** Board cards your hand uses: marked below. The hand you're making (not while a lesson waits to show you), or at the showdown the one you played. */
  const usedIds = $derived(
    new Set(shownTo(me) && round.result?.hands[me] ? round.result.hands[me]!.cards.map((c) => c.id) : lessonAhead && !naming ? [] : (preview?.cards.map((c) => c.id) ?? [])),
  );
  /** Board cards their hand uses, marked above: the rival being shown down (or, with one opponent, theirs at the verdict). */
  const theirBoard = $derived.by(() => {
    const inHand = round.seats.map((_, i) => i).filter((i) => i !== me && !round.seats[i].folded);
    const seat = view === 'reveal' ? revealOrder[revealed] : view === 'verdict' && inHand.length === 1 ? inHand[0] : -1;
    const hand = seat >= 0 && seat !== me && turnedUp(seat) ? round.result?.hands[seat] : null;
    return new Set(hand ? hand.cards.map((c) => c.id) : []);
  });
  /** Folding gives up what you've put in so far: the black button says so, while you may fold at all. */
  const foldLabel = $derived(mine && round.potMode && round.bets[me] && canFold(round, me) ? t('draw.foldIn', { amount: price(round.bets[me]) }) : t('draw.fold'));
  function fold() {
    if (!canFold(round, me)) return;
    if (line?.require === 'fold') nextLine();
    play({ type: 'fold' });
  }

  /** Snags on the board: at stake, the weakest hand takes them. */
  const stakes = $derived(boardCards.filter((c): c is Card => !!c && isJoker(c)));
</script>

<!-- A tap anywhere, while the table is moving, hurries it along. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="table" class:buttons={table.currency === 'buttons'} bind:this={rootEl} onclick={hurry}>
  {#if showHelp}<div class="help-layer layer" style="bottom: {helpBottom}px"><HowTo /></div>{/if}
  <!-- How it works covers what's said: the line comes back when it closes. -->
  {#if line && !showHelp}
    <Speech
      {line}
      name={speakerName(line.who)}
      opponent={rivalSpeaks(line.who) && table.chairs.length === 1 && line.at !== 'low'}
      top={speechAt.top}
      bottom={speechAt.bottom}
      grow={line.at === 'band' ? 'down' : lowLine && line.size !== 'aside' ? 'up' : undefined}
      onnext={line.replies || line.require ? undefined : () => nextLine()}
    />
  {/if}
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
        >
          {#snippet portrait()}{#if line && lineMs && line.who === chair.id && line.size !== 'full' && line.at !== 'low'}{#key line}<Countdown ms={lineMs} />{/key}{/if}{/snippet}
        </OpponentSeat>
      {/if}
    {/each}
  </div>

  <!-- The river: the street, the pot and the board. -->
  <div class="felt" bind:this={feltEl}>
    <!-- The Last Hand says so over the street's name (it plays for double). -->
    <p class="last-hand">{round.stakes > 1 ? t('hr.lastHand', { n: round.stakes }) : ''}</p>
    <div class="river-head">
      <span class="crossing">{table.label ?? ''}</span>
      <span class="street">
        {table.heading ?? t(`street.${streetName}`)}
        <!-- Every street has a second line, so nothing moves. -->
        <span class="street-sub">{round.result || table.heading ? '' : t(`street.sub.${composing ? 'compose' : streetName}`)}</span>
      </span>
      <button class="ghost icon" class:beckon={helpWanted && !showHelp} onclick={openHelp} aria-label={t('title.howTo')}>?</button>
    </div>
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
      <Board cards={boardCards} marks={(card) => ({ above: theirBoard.has(card.id), below: usedIds.has(card.id) })} bind:el={boardEl} />
      {#if cover}<div class="cover">{@render cover()}</div>{/if}
    </div>
    <!-- Always there, so a snag coming up never moves the table; empty when nothing is at stake (after a fold the snag goes back into the deck). -->
    <p class="stakes">{#if stakes.length && !cover && !round.result?.byFolds}{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}{/if}</p>
  </div>

  <!-- Your side, as in a duel: your money nearest the pot, then your cards, your snags and your discards. -->
  <div class="mine">
    <div class="my-purse" data-purse={me} bind:this={myPurseEl}>
      {#if mine}
        {#if round.potMode}<Purse amount={purse(me)} start={table.start[me]} showAmount={false} focus={18} label={t('character.captain.you')} keep={table.hand} paid={paidOut(me)} won={wonIn(me)} tidy />{/if}
        {#if dealer === me}<span class="button own" title={t('hr.dealer')}></span>{/if}
        {#if shownTo(me) && myCall}
          <!-- At the showdown your hand's name, one line above your coins (the pot may fly to them). -->
          <button class="my-hand ladder-link" onclick={() => (cardPrefs.ladder = round.result?.hands[me]?.category ?? 'all')}>{myCall.lingo ?? myCall.call}</button>
        {:else if preview && callout && (naming || !lessonAhead)}
          <!-- On the River (or when a line asks you to show it) the hand you're making is called over your coins, with the snags riding along and their forfeit. Fixed size: it never shifts as you tap. -->
          <div class="callout" aria-live="polite">
            <button class="call ladder-link" class:long={callout.call.length > 30} onclick={() => (cardPrefs.ladder = preview?.category ?? 'all')}>{callout.call}</button>
            <span class="lingo">{callout.lingo ?? ''}</span>
            <span class="note">
              {#if tappedSnags.length === 1}{t('draw.ridingOne', { cost: money(table.config.jokerForfeit ?? 0) })}{:else if tappedSnags.length}{t('draw.riding', { n: t(`number.${tappedSnags.length}`), cost: money(tappedSnags.length * (table.config.jokerForfeit ?? 0)) })}{:else if !tapped.length}{t('draw.boardOnly')}{/if}
            </span>
          </div>
        {/if}
      {:else}
        <p class="my-hand">{t('hr.youAreOut')}</p>
      {/if}
    </div>
    {#if mine}
      <MyCards
        played={myPlayed}
        hand={handOf(me).filter((_, k) => k >= 3 || dealIndex(me, k) < dealt)}
        look={(card) => ({
          selected: (composing || naming) && !laid && tapped.includes(card.id),
          used: (laid && tapped.includes(card.id)) || ((composing || naming) && usedIds.has(card.id)),
          toss: !composing && !naming && tapped.includes(card.id),
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
  <ActionBar inert={busy || lineWaiting} bind:el={actionsEl}>
    {#if buttons}
      {@render buttons()}
    {:else if showHelp}
      <!-- How it works is up: Menu (the way out mid-hand) and Close. -->
      <button class="ghost" onclick={() => ((showHelp = false), onmenu())}>{t('end.pause')}</button>
      <button onclick={() => (showHelp = false)}>{t('draw.close')}</button>
    {:else if line?.replies && !shortcut}
      {@const replies = line.replies}
      {@const label = (r: Reply, i: number) => r.label ?? (replies.length === 2 && i === 0 ? t('talk.decline') : t('talk.agree'))}
      {#if replies.length <= 2 && !stackReplies}
        <!-- A line waiting for an answer: two replies (black, white), or one on the white button and nothing pretending on the black. -->
        {#if replies.length === 2}
          <button class="ghost" onclick={() => answer(replies[0])} disabled={naming && !named}>{label(replies[0], 0)}</button>
          <button onclick={() => answer(replies[1])} disabled={naming && !named}>{label(replies[1], 1)}</button>
        {:else}
          <button class="ghost" disabled style="visibility: hidden" aria-hidden="true"></button>
          <!-- "Show me": the answer waits for the cards it asks you to tap. -->
          <button onclick={() => answer(replies[0])} disabled={naming && !named}>{label(replies[0], 0)}</button>
        {/if}
      {:else}
        <!-- More replies, or longer ones than half the row holds: stacked, rising over the table, the last (white) nearest the thumb. -->
        <button class="stand-in" disabled aria-hidden="true">&nbsp;</button>
        <div class="stack">
          {#each replies as r, i (i)}<button class:ghost={i < replies.length - 1} onclick={() => answer(r)} disabled={naming && !named}>{label(r, i)}</button>{/each}
        </div>
      {/if}
    {:else if holding}
      <!-- A scene to read: skip the conversation, or on to the next line. -->
      <button class="ghost" onclick={() => (talk = null)}>{t('show.skip')}</button>
      <button onclick={() => nextLine()}>{t('show.next')}</button>
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
      <!-- A line asking for a move: only that move will do (no folding your way out of a lesson). -->
      <button class="ghost" onclick={fold} disabled={dealtHand !== table.hand || !canFold(round, me) || (line?.require ? line.require !== 'fold' : !complies)}>{foldLabel}</button>
      <button onclick={() => go()} disabled={dealtHand !== table.hand || !complies} data-heavy={composing || answering || tappedCards.length > 0 || cost > 0 ? 'true' : undefined}>{goLabel}</button>
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

  /* The head and the showdown callout that replaces it are the same height: nothing moves. */
  .river-head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 3.5rem;
    margin-bottom: 0.4rem;
  }
  .crossing {
    font-family: var(--title-font);
    font-size: 0.85rem;
    color: var(--grey);
    text-align: left;
  }
  .river-head .street {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    line-height: 1.1;
  }
  .street-sub {
    min-height: 1.2em;
    font-family: var(--body-font);
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    color: var(--grey);
  }
  .icon {
    justify-self: end;
    padding: 0 0.55em;
    font-size: 1rem;
    border-radius: 50%;
  }
  /* A lesson pointing at How it works: the "?" pulses until it's opened. */
  .icon.beckon {
    border-color: var(--paper);
    color: var(--paper);
    animation: beckon 1.1s ease-in-out infinite;
  }
  @keyframes beckon {
    50% {
      box-shadow: 0 0 0 6px rgba(242, 239, 230, 0.25);
      transform: scale(1.12);
    }
  }

  .help-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
  }
  .callout {
    position: absolute;
    inset: -4px 0;
    display: grid;
    grid-template-rows: 1fr 1fr auto;
    align-items: center;
    justify-items: center;
    padding: 4px 0.5rem;
    background: rgba(10, 10, 9, 0.88);
    border: 3px double var(--paper);
    text-align: center;
    overflow: hidden;
    animation: callout-in 0.2s ease-out;
  }
  .callout span {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .call {
    font-family: var(--title-font);
    font-size: 1.1rem;
    line-height: 1.1;
  }
  /* "Straight flush, Diamonds, Queen high" still fits a phone. */
  .call.long {
    font-size: 0.9rem;
  }
  .lingo {
    font-style: italic;
    font-size: 0.95rem;
    line-height: 1.1;
  }
  .note {
    font-size: 0.75rem;
    color: var(--grey);
    min-height: 1em;
    line-height: 1;
  }
  @keyframes callout-in {
    from { opacity: 0; }
  }
  :global(.short) .river-head {
    height: 3.3rem;
  }
</style>
