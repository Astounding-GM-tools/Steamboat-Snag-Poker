<script lang="ts">
  import { onDestroy, tick, untrack } from 'svelte';
  import {
    STREETS,
    CATEGORIES,
    bestHand,
    canFold,
    roundLeft,
    discardCost,
    isComposing,
    feeFor,
    foldedSeat,
    winnerOf,
    isJoker,
    rankLabel,
    opponentOdds,
    HUMAN_ID,
    player,
    viewFor,
    Rng,
    planReveal,
    type Action,
    type Card,
    type GameState,
    type OpponentOdds,
  } from '../engine';
  import { t } from '../i18n';
  import ActionBar from './ActionBar.svelte';
  import Board from './Board.svelte';
  import MyCards from './MyCards.svelte';
  import OpponentSeat, { type SeatCard } from './OpponentSeat.svelte';
  import PotBand from './PotBand.svelte';
  import SnagFan from './SnagFan.svelte';
  import Standings from './Standings.svelte';
  import Purse from './Purse.svelte';
  import HowTo from './HowTo.svelte';
  import Speech, { autoMs, beats, BEAT_MS, type Reply, type SpeechLine } from './Speech.svelte';
  import Countdown from './Countdown.svelte';
  import { cardPrefs } from './cards.svelte';
  import { CoinFlow, FACE_DOWN_MS, FACE_UP_MS, FLOP_MS, thrownCard } from './coinflow.svelte';
  import { moneyText, moveLabel, priceText } from './prices';
  import { flight } from './flight.svelte';
  import type { RoundScript, Trigger } from '../story/script';
  import { cardLabel, jokerList, name } from './format';
  import { handLabel, tiebreak } from './handNames';

  interface Props {
    game: GameState;
    onaction: (a: Action) => void;
    /** False while the showdown is still being revealed: the pot hasn't been paid out yet. */
    settled?: boolean;
    /** Back to the main menu (the game is saved after every move). */
    onmenu: () => void;
    /** 'reveal': the showdown plays out on the table, one of their cards per Next. */
    stage?: 'play' | 'reveal' | 'result';
    /** The verdict is on the table: the pot can fly to the winner. */
    onverdict?: () => void;
    /** The showdown is over (or skipped). */
    onrevealed?: () => void;
    /** From the standings: deal the next round. */
    onnext?: () => void;
    /** An answer in a conversation set something going at the table (`snag:hides`, `pot:5`…). */
    ontalk?: (effect: string) => void;
    /** This round's lines, spoken as the round reaches each trigger. */
    script?: RoundScript;
  }
  let { game, onaction, settled = true, onmenu, stage = 'play', onverdict, onrevealed, onnext, script, ontalk = import.meta.env.DEV ? (e) => console.info('talk effect:', e) : undefined }: Props = $props();

  /** Tapped card ids: cards to discard on a street, cards to play when composing. */
  let tapped = $state<string[]>([]);
  let showHelp = $state(false);
  // How it works covers the table down to the two buttons, which close it.
  let tableEl = $state<HTMLElement>();
  let actionsEl = $state<HTMLElement>();
  let helpBottom = $state(0);

  // Captains speaking at the table: a conversation is a list of lines, shown one at a time.
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
  /** The line is waiting for a move at the table: the white button only takes that one. */
  /** Exactly these cards tapped, and only these. Whole cards first, then ranks, so `4c` and `4` both find their four. */
  function tappedAre(want: string[]): boolean {
    if (tapped.length !== want.length || tappedJokers.length) return false;
    const open = [...want].sort((a, b) => b.length - a.length);
    return tappedCards.every((c) => {
      const k = open.findIndex((w) => w === c.id || (!isJoker(c) && w === rankLabel(c.rank)));
      return k >= 0 && open.splice(k, 1).length > 0;
    });
  }
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
  /** A move still to be taught in this conversation (and not yet asked for): the table holds its tongue until then. */
  const lessonAhead = $derived(!line?.require && !!talk?.lines.slice(talk.i).some((l) => l.require));
  /** Your lines come from your side of the table, theirs from theirs. */
  const lowLine = $derived(!!line && line.size !== 'full' && (line.who === 'you' || line.at === 'low'));
  let oppCardsEl = $state<HTMLElement>();
  let riverEl = $state<HTMLElement>();
  let communityEl = $state<HTMLElement>();
  let speechAt = $state({ top: 0, bottom: 0 });
  /** Where a caption of each size sits, in px from the table's top and bottom edges. */
  function placeSpeech() {
    if (!line || !tableEl || !actionsEl || !oppCardsEl || !communityEl) return;
    const table = tableEl.getBoundingClientRect();
    const cards = oppCardsEl.getBoundingClientRect();
    const buttons = actionsEl.getBoundingClientRect().top - 10;
    if (lowLine && myPurseEl) {
      const purse = myPurseEl.getBoundingClientRect();
      // Your own asides sit over your purse, where your stacks go.
      if (line.size === 'aside') speechAt = { top: purse.top - table.top, bottom: table.bottom - purse.bottom };
      else {
        // Over your side: below the name of your hand (which stays readable), down to the buttons.
        const named = myPurseEl.querySelector('.my-hand')?.getBoundingClientRect().bottom;
        speechAt = { top: (named ?? purse.top) + 8 - table.top, bottom: table.bottom - buttons };
      }
      return;
    }
    if (line.at === 'band' && riverEl) {
      // Their half, between their cards and the board: both stay in view.
      const river = riverEl.getBoundingClientRect();
      speechAt = { top: river.top - table.top, bottom: table.bottom - (communityEl.getBoundingClientRect().top - 20) }; // clear of the ▼ marks over the board
      return;
    }
    if (line.at === 'mid' && riverEl) {
      // Over the empty board, before the deal: their cards row (and their snags) stay in view.
      const river = riverEl.getBoundingClientRect();
      speechAt = { top: river.top - table.top, bottom: table.bottom - communityEl.getBoundingClientRect().bottom };
      return;
    }
    const from = line.size === 'full' ? table.top + parseFloat(getComputedStyle(tableEl).paddingTop) : cards.top;
    const to = line.size === 'aside' ? cards.bottom : line.size === 'scene' ? communityEl.getBoundingClientRect().bottom : buttons;
    speechAt = { top: from - table.top, bottom: table.bottom - to };
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
  /** A story's conversation after a hand, over: on to the next hand (or home, if someone is out of money), without a word more. */
  function talkOver() {
    if (script && !playing) onrevealed?.();
  }
  const speakerName = (who: string) => (who === 'you' ? t('character.captain.you') : who === 'willie' ? t('willie.name') : name(who));
  const lineMs = $derived(line ? autoMs(line) : null);
  // A line that closes by itself: the countdown runs on the speaker's portrait, and the table keeps the time.
  $effect(() => {
    if (!lineMs) return;
    const id = setTimeout(() => nextLine(), lineMs);
    return () => clearTimeout(id);
  });
  // For trying captions out in the browser console (dev builds only): say([...]) or sayDemo().
  if (import.meta.env.DEV) {
    const w = window as unknown as Record<string, unknown>;
    w.say = say;
    w.sayDemo = () => {
      const low = [...me.hand].filter((c) => !isJoker(c)).sort((a, b) => (a as { rank: number }).rank - (b as { rank: number }).rank)[0];
      const rank = low && !isJoker(low) ? rankLabel(low.rank) : '2';
      say([
        { size: 'aside', who: opponentId, text: 'Drat! My no-good nephew!' },
        { size: 'aside', who: 'willie', text: 'A test of Willie in passing.' },
        ...(composing ? [] : [{ size: 'aside', who: 'morag', text: `Throw away that ${rank === 'T' ? '10' : rank}, child. It is doing you no favours.`, require: [rank] } satisfies SpeechLine]),
        { size: 'full', who: 'morag', text: 'A test of the long caption with a single answer: an introduction or a lesson, read at leisure, the table hidden behind.', replies: [{ label: 'Yes, ma’am' }] },
        { size: 'scene', who: opponentId, text: 'Take my hides downriver, Captain?', replies: [{ go: 'never' }, { effect: 'snag:hides', end: true }] },
        { id: 'never', size: 'scene', who: 'you', text: 'Never! Your stinking hides would foul my ship.' },
        { size: 'scene', who: opponentId, text: 'Captain’s code, then. Beat me at Snag and I keep them. I’ll put $5 in the pot.', replies: [{ go: 'refused' }, { effect: 'pot:5', end: true }] },
        { id: 'refused', size: 'scene', who: opponentId, text: 'You refuse the code? Good day, then.', replies: [{ label: 'Good day', effect: 'snag:yellowBelly', end: true }] },
      ]);
    };
  }
  function openHelp() {
    if (tableEl && actionsEl) helpBottom = tableEl.getBoundingClientRect().bottom - actionsEl.getBoundingClientRect().top + 6;
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
  let showCaptain = $state(false);
  // Their details close when the next round is dealt.
  let infoMonth = -1;
  $effect(() => {
    const m = game.month;
    untrack(() => {
      if (m !== infoMonth) {
        infoMonth = m;
        showCaptain = false;
      }
    });
  });
  // Jokers you just fished out of the deck: Willie announces them.
  let fishedSeen = 0;
  let fishedMonth = -1;
  $effect(() => {
    const r = round;
    untrack(() => {
      const mine = (r.fished ?? []).filter((f) => f.seat === 0);
      if (fishedMonth !== game.month) {
        // A resumed round shouldn't re-announce old catches; a new month starts fresh.
        fishedSeen = fishedMonth === -1 ? mine.length : 0;
        fishedMonth = game.month;
      }
      const fresh = mine.slice(fishedSeen);
      fishedSeen = mine.length;
      if (fresh.length) say([{ size: 'scene', who: 'willie', text: t('willie.fished', { jokers: jokerList(fresh.map((f) => f.joker)) }), replies: [{ label: t('willie.ok') }] }]);
    });
  });

  const round = $derived(game.round!);
  const config = $derived(game.config);
  const me = $derived(round.seats[0]);
  const them = $derived(round.seats[1]);
  const opponentId = $derived(game.opponentId!);
  const opponent = $derived(player(game, opponentId));
  const captain = $derived(player(game, HUMAN_ID));
  const playing = $derived(game.phase === 'duel');
  const composing = $derived(isComposing(round));
  const boardSize = $derived(config.communitySchedule.reduce((a, b) => a + b, 0));
  /** The board as dealt so far. */
  const boardCards = $derived(Array.from({ length: boardSize }, (_, i) => (round.community[i] && dealt.has(round.community[i].id) ? round.community[i] : null)));

  // Jokers are interchangeable, so the selection only tracks how many are in.
  const tappedCards = $derived(me.hand.filter((c) => tapped.includes(c.id)));
  const tappedJokers = $derived(me.jokers.filter((c) => tapped.includes(c.id)));
  const preview = $derived(
    composing || (naming && tapped.length) ? bestHand([...tappedCards, ...tappedJokers], round.community, { min: tapped.length, max: tapped.length }) : null,
  );
  // The showdown, on the table: their played cards flip in place, one per Next,
  // with their hand so far called where the street name was.
  const result = $derived(round.result);
  /** Who won (null on a split pot), and who folded, if anyone did. */
  const winner = $derived(result ? winnerOf(result) : null);
  const folder = $derived(result ? foldedSeat(round) : null);
  const shownDown = $derived(!!result && !result.byFolds);
  const steps = $derived(shownDown ? planReveal(round, 1) : []);
  // How many of their cards are face up, counted per round: a new showdown starts
  // at its first card at once (a reset after the fact would let the last
  // round's count fire this round's verdict, and pay out the pot, too early).
  let revealPos = $state({ month: -1, i: 0 });
  const revealIndex = $derived(revealPos.month === game.month ? revealPos.i : 0);
  const revealing = $derived(stage === 'reveal' && shownDown);
  /** After the round (not the last): the standings on the table. */
  const standing = $derived(stage === 'result' && game.phase === 'monthEnd' && !!game.report);
  const revealStep = $derived(revealing && steps.length ? steps[Math.min(revealIndex, steps.length - 1)] : null);
  /** The cards they kept back turn over after the played ones, one at a time like the rest (dimmed: they don't count). */
  const heldBack = $derived(shownDown ? them.hand.filter((c) => dealt.has(c.id)) : []);
  const lastStep = $derived(steps.length + heldBack.length - 1);
  /** The verdict waits until the last card is on the felt. */
  const verdictShown = $derived(revealing && revealIndex >= lastStep);
  $effect(() => {
    if (verdictShown) untrack(() => onverdict?.());
  });
  const theirPlayed = $derived(shownDown ? them.played : []);
  const playedIds = $derived(new Set(theirPlayed.map((c) => c.id)));
  /** Their cards face up: those flipped so far, or all they played once the showdown is over. */
  const faceUp = $derived(
    !shownDown ? new Set<string>() : revealing ? new Set(steps.slice(0, revealIndex + 1).map((s) => s.card.id)) : playedIds,
  );
  /**
   * Their cards as they should be seen: at the showdown the played ones turn
   * over in place, then the ones they held back (dimmed: you get to see how
   * they play); until then face down, a thrown one leaving before its
   * replacement is dealt.
   */
  const opponentCards = $derived.by((): SeatCard[] => [
    ...theirPlayed
      .filter((c) => !isJoker(c))
      .map((card): SeatCard => (faceUp.has(card.id) || theyShowed ? { key: card.id, card, fresh: revealStep?.card.id === card.id, deal: revealing ? 'flip' : null } : { key: card.id, faceDown: true })),
    ...them.hand
      .filter((c) => dealt.has(c.id))
      .map((card, k): SeatCard => {
        const turned = decided || theyShowed || (revealing && revealIndex >= steps.length + k);
        const fresh = (revealing && revealIndex === steps.length + k) || (theyShowed && !shownDown);
        return turned ? { key: card.id, card, faded: shownDown, fresh, deal: revealing ? 'flip' : null, held: true } : { key: card.id, card, faceDown: true, faded: shownDown, deal: 'top', held: true };
      }),
  ]);
  const theirHand = $derived(revealStep?.hand ?? (shownDown ? result!.hands[1] : null));
  /** Once the verdict is in, only the winning hand gets its exclamation mark. */
  const decided = $derived(shownDown && (verdictShown || stage === 'result'));
  const theirCall = $derived(theirHand ? handLabel(theirHand, { exclaim: decided && winner === 1 }) : null);
  /** The third line, once the last card is down: what decided it, on a tie-break. (No odds while the cards turn: let them play out.) */
  const theirNote = $derived.by(() => {
    if (!revealing || !result || !verdictShown) return '';
    if (winner === null) return '';
    const tb = tiebreak(result.hands[winner]!, result.hands[1 - winner]!);
    return tb ? t(`show.tb.${tb.kind}.${winner === 0 ? 'you' : 'them'}`, { name: name(opponentId), win: tb.winner, lose: tb.loser }) : '';
  });
  /**
   * The result, where the pot was, once the last card is down (or a fold ends
   * the hand) and the coins have gone: a win, or what it cost you.
   */
  const outcomeShown = $derived(!playing && !!result && (decided || result.byFolds));
  const outcomeText = $derived.by(() => {
    if (!result) return '';
    if (winner === 0) return t('show.youWin');
    if (winner === null) return round.potMode ? t('show.split') : t('show.draw');
    const lost = (round.potMode ? round.bets[0] : 0) + result.forfeit[0];
    if (lost) return t('show.lost', { amount: money(lost) });
    // A fold with nothing in the pot isn't a defeat (in a lesson it may be the wise move).
    return folder === 0 ? t('show.folded') : t('show.youLose');
  });
  function revealNext() {
    // Past the verdict: the round's closing lines first, if it has any.
    if (verdictShown && !fire('verdict')) onrevealed?.();
    else revealPos = { month: game.month, i: revealIndex + 1 };
  }
  // The showdown turns by itself, a card at a time, a breath apart (as at the final table): Next is for after the verdict.
  const TURN_MS = 750;
  $effect(() => {
    if (!revealing || verdictShown || line || theyShowed) return;
    const i = revealIndex;
    const id = setTimeout(() => {
      if (revealIndex === i) revealPos = { month: game.month, i: i + 1 };
    }, coins.still ? 0 : TURN_MS);
    return () => clearTimeout(id);
  });
  /** Skip to the result: every card turned and the verdict in; the next press goes on from there. */
  function revealSkip() {
    revealPos = { month: game.month, i: lastStep };
  }
  /** Board cards each hand uses: theirs marked above, yours below. */
  const theirBoard = $derived(
    revealStep ? new Set(revealStep.boardUsed) : shownDown && !revealing ? new Set(result!.hands[1]!.cards.map((c) => c.id)) : new Set<string>(),
  );
  const myCall = $derived(shownDown ? handLabel(result!.hands[0]!, { exclaim: decided && winner === 0 }) : null);
  /** After Play hand the played cards leave the hand: show them first, the rest dimmed. */
  const myPlayed = $derived(shownDown ? me.played.filter((c) => !isJoker(c)) : []);
  const myPlayedSnagIds = $derived(new Set(shownDown ? me.played.filter(isJoker).map((c) => c.id) : []));
  /**
   * A side's snags in its fan. The hand is already resolved when the showdown
   * starts (the loser keeps the snags it played, and takes the winner's), so
   * until the verdict each fan shows the snags as they were when the hand was
   * played, then the outcome: snags dumped on the loser land in their fan.
   */
  function fan(seat: typeof me): Card[] {
    const played = seat.played.filter(isJoker);
    if (!shownDown || settled) return seat.jokers;
    const moved = new Set([...result!.dumped, ...result!.boardTaken].map((c) => c.id));
    const kept = seat.jokers.filter((j) => !moved.has(j.id) && !played.some((p) => p.id === j.id));
    return [...kept, ...played];
  }
  const mySnags = $derived(fan(me));
  const theirSnags = $derived(fan(them));

  const callout = $derived(preview ? handLabel(preview) : null);
  // Like the callout, the marks under the board wait for the lesson.
  const usedIdsPlay = $derived(new Set(lessonAhead && !naming ? [] : (preview?.cards.map((c) => c.id) ?? [])));
  const usedIds = $derived(shownDown ? new Set(result!.hands[0]!.cards.map((c) => c.id)) : usedIdsPlay);

  const stakes = $derived(round.community.filter(isJoker));
  const streetName = $derived(composing ? 'compose' : round.street <= 2 ? STREETS[round.street] : 'showdown');

  // Willie's reckoning appears on the captain card while a round is being played.
  const odds = $derived.by((): OpponentOdds | null => {
    if (!showCaptain || !playing) return null;
    // Seeded from the visible situation so the numbers stay put while you look.
    const seed = round.community.length * 7919 + round.discards.length * 104729 + round.month;
    return opponentOdds(viewFor(round, 0, config), config, new Rng(seed), 600);
  });

  // A new street or a new month clears the selection.
  // --- The deal -----------------------------------------------------------
  // Cards appear one at a time like a real deal: hole cards round the table
  // (you, them, you, them…), then the board. Reduced motion speeds it up; a click
  // on the table finishes it at once.
  /** Fast deal for people who prefer reduced motion; everyone else gets the real deal. */
  const fastDeal = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dealt = $state(new Set<string>());
  let pending = $state<string[]>([]);
  let dealtMonth = -1;
  let dealTimer: ReturnType<typeof setTimeout> | undefined;
  const dealing = $derived(pending.length > 0);


  $effect(() => {
    const r = round;
    untrack(() => scheduleDeal(r));
  });
  onDestroy(() => clearTimeout(dealTimer));

  // A line where they show their hand: their cards stay face up for the rest of the round.
  let showedMonth = $state(-1);
  $effect(() => {
    if (line?.show) showedMonth = game.month;
  });
  const theyShowed = $derived(showedMonth === game.month);
  // Cards already shown have nothing left to reveal: the showdown goes straight to the verdict.
  $effect(() => {
    if (revealing && theyShowed && revealIndex < lastStep) untrack(() => (revealPos = { month: game.month, i: lastStep }));
  });

  /** A round whose deal waits for the lines spoken before it. */
  let heldDeal = $state<typeof round | null>(null);
  $effect(() => {
    // The deal goes out once the lines before it are said; under a line said over the deal, once its last beat is out.
    if (!heldDeal || (talk && !line?.dealing)) return;
    const r = heldDeal;
    const release = () => {
      if (heldDeal !== r) return;
      heldDeal = null;
      untrack(() => scheduleDeal(r));
    };
    const wait = line?.dealing ? (beats(line).length - 1) * BEAT_MS + 500 : 0;
    if (!wait) return release();
    const id = setTimeout(release, wait);
    return () => clearTimeout(id);
  });

  function scheduleDeal(r: typeof round) {
    clearTimeout(dealTimer);
    // A new round with lines before the deal: they are spoken first.
    if (dealtMonth !== game.month && fire('deal')) {
      dealtMonth = game.month;
      dealt = new Set();
      pending = [];
      heldDeal = r;
      return;
    }
    const base = dealtMonth === game.month ? new Set(dealt) : new Set<string>();
    dealtMonth = game.month;
    const mine = r.seats[0].hand.map((c) => c.id).filter((id) => !base.has(id));
    const theirs = r.seats[1].hand.map((c) => c.id).filter((id) => !base.has(id));
    const order: string[] = [];
    for (let i = 0; i < Math.max(mine.length, theirs.length); i++) {
      if (mine[i]) order.push(mine[i]);
      if (theirs[i]) order.push(theirs[i]);
    }
    order.push(...r.community.map((c) => c.id).filter((id) => !base.has(id)));
    dealt = base;
    pending = order;
    // A board card on its own (the Turn, the River) comes after a breath.
    const boardOnly = order.length > 0 && r.community.some((c) => c.id === order[0]);
    if (order.length) dealTimer = setTimeout(dealNext, boardOnly && !fastDeal ? 500 : 250);
  }

  function dealNext() {
    const [id, ...rest] = pending;
    if (!id) return;
    dealt = new Set([...dealt, id]);
    pending = rest;
    if (!rest.length) return;
    // Yours face up are worth a look; theirs go quicker. Then a breath, and the Flop, each card a thunderclap: Boom. Boom. BOOM.
    const board = round.community.findIndex((c) => c.id === id);
    const boardNext = round.community.some((c) => c.id === rest[0]) && board < 0;
    const mine = round.seats[0].hand.some((c) => c.id === id);
    const delay = fastDeal ? 70 : boardNext ? FLOP_MS[0] : board === 0 ? FLOP_MS[1] : board === 1 ? FLOP_MS[2] : mine ? FACE_UP_MS : FACE_DOWN_MS;
    dealTimer = setTimeout(dealNext, delay);
  }

  function finishDeal() {
    if (!dealing) return;
    clearTimeout(dealTimer);
    dealt = new Set([...dealt, ...pending]);
    pending = [];
  }

  // The round's script: each trigger's lines once, when the round gets there.
  let fired = new Set<string>();
  function fire(trigger: Trigger): boolean {
    const key = `${game.month}:${trigger}`;
    const won = !!result && winner === 0;
    // Dumped or kept only while the game goes on: at the end, the last word says it all.
    const outcomes = won
      ? game.phase === 'victory' ? ['wonAll'] : ['won', result!.dumped.length ? 'dumped' : 'kept']
      : [game.phase === 'gameOver' ? 'lostAll' : 'lost'];
    const holder = (snag: number) => (captain.jokers.some((j) => j.index === snag) ? 'you' : opponent.jokers.some((j) => j.index === snag) ? 'them' : null);
    const lines = script?.[trigger]?.filter(
      (l) => (!l.when || outcomes.includes(l.when)) && (l.holding ?? []).every((h) => holder(h.snag) === h.by),
    );
    if (!lines?.length || fired.has(key)) return false;
    fired.add(key);
    // After the hand, their lines sit on their half between their cards and the board (anyone else's low, over your side);
    // before the deal, over the empty board, so their snags stay in view.
    const place = (l: SpeechLine) => (trigger === 'verdict' ? (l.who === opponentId ? 'band' : 'low') : trigger === 'deal' ? 'mid' : undefined);
    say(lines.map((l) => (l.size === 'full' || l.at || !place(l) ? l : { ...l, at: place(l) })));
    return true;
  }
  // A street's lines once its cards are on the table.
  $effect(() => {
    if (!playing || dealing || heldDeal) return;
    const trigger: Trigger = composing ? 'river' : round.street === 0 ? 'flop' : 'turn';
    untrack(() => fire(trigger));
  });

  // Nothing covers the table while their cards turn: anything still up goes (the lines after the verdict come later, low).
  $effect(() => {
    if (revealing && !verdictShown && line && line.at !== 'low') untrack(() => (talk = null));
  });

  // A round that ends in a fold has no showdown: its closing lines come as it ends.
  $effect(() => {
    if (!playing && result?.byFolds)
      untrack(() => {
        // In a story with nothing to say about it, the next round comes after a beat.
        if (!fire('verdict') && script) setTimeout(() => onrevealed?.(), 1200);
      });
  });

  let lastKey = '';
  $effect.pre(() => {
    const key = `${game.month}:${round.street}`;
    if (key !== lastKey) {
      lastKey = key;
      tapped = [];
    }
  });

  function tap(card: Card) {
    if (!playing || dealing) return;
    if (isJoker(card) && !composing) return; // Jokers can't be discarded
    if (tapped.includes(card.id)) tapped = tapped.filter((id) => id !== card.id);
    else if (isJoker(card)) {
      // Any Joker will do: take the next untapped one.
      const next = me.jokers.find((j) => !tapped.includes(j.id));
      if (next && tapped.length < 5) tapped = [...tapped, next.id];
    } else if (!composing || tapped.length < 5) tapped = [...tapped, card.id];
  }

  function go() {
    if (!playing || dealing) return;
    const action: Action = composing
      ? { type: 'compose', cardIds: tappedCards.map((c) => c.id), jokers: tappedJokers.length }
      : { type: 'draw', cardIds: tappedCards.map((c) => c.id) };
    const skip = shortcut; // read before the taps are cleared
    tapped = [];
    // The move a line was waiting for closes it as it's made; so does any table talk still up: play comes first.
    // Made while its replies still stood, it skips past the line that would have asked for it.
    if (skip && talk) {
      const asks = talk.lines.findIndex((l, k) => k > talk!.i && l.require);
      talk = asks >= 0 ? { ...talk, i: asks } : talk;
      nextLine();
    } else if (line?.require || (line && !line.replies && line.size === 'aside')) nextLine();
    onaction(action);
  }

  // Pot mode: purses shrink as you pay in, and every action shows its price.
  const bets = $derived<number[]>(round.potMode ? round.bets : [0, 0]);
  /**
   * What each purse shows: during a round, money minus what's in the pot; while
   * the showdown is being revealed, the purse as it was before the payout; then
   * the settled amount (the pot flies to the winner as it changes).
   */
  function shownMoney(seat: number): number {
    const p = seat === 0 ? captain : opponent;
    if (playing) return p.money - bets[seat];
    if (!settled && round.potMode) return (game.report?.money[p.id]?.before ?? p.money) - bets[seat];
    return p.money;
  }
  /** The purse at the start of this round: it sets how the purse is drawn until the next one. */
  function startMoney(seat: number): number {
    const p = seat === 0 ? captain : opponent;
    return playing ? p.money : (game.report?.money[p.id]?.before ?? p.money);
  }
  const potBets = $derived<number[]>(round.potMode ? bets : [0, 0]);
  const payout = $derived<'me' | 'them' | 'split' | null>(
    !playing && settled && round.result && round.potMode
      ? winner === 0 ? 'me' : winner === 1 ? 'them' : 'split'
      : null,
  );
  // Money moves through the shared coin queue (coinflow.svelte.ts): one purse at a time, the pot to the winner.
  let myPurseEl = $state<HTMLElement>();
  let theirPurseEl = $state<HTMLElement>();
  let potEl = $state<HTMLElement>();
  let flownMonth = -1;
  let flown: [number, number] = [0, 0];
  let paidMonth = -1;
  const coins = new CoinFlow({
    purse: (seat) => (seat === 0 ? myPurseEl : theirPurseEl),
    pot: () => potEl,
    coinClass: () => (game.currency === 'buttons' ? 'flying-coin button' : 'flying-coin'),
  });

  /** A card thrown away: up out of the hand, turning, and gone (only a card that went onto the discard pile). */
  function thrown(_node: Element, card: Card | null | undefined) {
    return thrownCard(!!card && round.discards.some((c) => c.id === card.id) && !coins.still);
  }

  /**
   * What a purse has paid out this round and won: until the verdict, what's in the pot; after it, what the money
   * says (the pot, a forfeit, upkeep: whatever came and went).
   */
  function paidWon(seat: 0 | 1): [number, number] {
    if (!round.potMode) return [0, 0];
    if (playing || !settled) return [bets[seat], 0];
    const gain = (seat === 0 ? captain : opponent).money - (startMoney(seat) - bets[seat]);
    return gain >= 0 ? [bets[seat], gain] : [bets[seat] - gain, 0];
  }

  $effect(() => {
    const b = potBets;
    const month = game.month;
    const pay = payout;
    untrack(() => {
      if (month !== flownMonth) {
        flownMonth = month;
        flown = [0, 0];
        coins.reset();
      }
      ([0, 1] as const).forEach((seat) => {
        if (b[seat] > flown[seat]) coins.payIn(seat, flown[seat], b[seat]);
      });
      flown = [b[0], b[1]];
      if (pay && paidMonth !== month) {
        paidMonth = month;
        coins.payOut(pay === 'me' ? [0] : pay === 'them' ? [1] : [0, 1]);
      }
    });
  });

  const cost = $derived(
    round.potMode && !composing && playing
      ? feeFor(round, config, round.street + 1) + discardCost(me.discarded.length, tappedCards.length)
      : 0,
  );
  const money = (n: number) => moneyText(n, game.currency);
  const price = (n: number) => priceText(n, game.currency);
  /** What you have left to put in this round: a price beyond it is everything, all in. */
  const left = $derived(round.potMode ? roundLeft(round, 0) : Infinity);
  const buttonLabel = $derived(moveLabel({ composing, swaps: tapped.length, cost, left, currency: game.currency }));
  const showFold = $derived(playing && !composing);
  // Folding gives up everything you have put into the pot so far.
  /** What you'd walk away from (already in the pot, not a price), and only while you may fold at all. */
  const foldLabel = $derived(bets[0] && canFold(round, 0) ? t('draw.foldIn', { amount: price(bets[0]) }) : t('draw.fold'));

  function fold() {
    if (!playing || dealing || !canFold(round, 0)) return;
    tapped = [];
    if (line?.require === 'fold') nextLine();
    onaction({ type: 'fold' });
  }

  const pct = (x: number) => `${Math.round(x * 100)}%`;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="table solo layout" class:buttons={game.currency === 'buttons'} onclick={finishDeal} bind:this={tableEl}>
  {#if showHelp}<div class="help-layer" style="bottom: {helpBottom}px"><HowTo /></div>{/if}
  <!-- How it works covers what's said: the line comes back when it closes. -->
  {#if line && !showHelp}
    <Speech
      {line}
      name={speakerName(line.who)}
      opponent={line.who === opponentId && line.at !== 'low'}
      top={speechAt.top}
      bottom={speechAt.bottom}
      grow={line.at === 'band' ? 'down' : lowLine && line.size !== 'aside' ? 'up' : undefined}
      onnext={line.replies || line.require ? undefined : () => nextLine()}
    />
  {/if}
  <!-- Their side of the table: everything above the board belongs to the opponent. -->
  <section class="opponent">
    <OpponentSeat
      id={opponentId}
      seat={1}
      cards={opponentCards}
      {thrown}
      snags={theirSnags}
      snagLook={(card) => ({ lifted: playedIds.has(card.id) && (faceUp.has(card.id) || theyShowed), fresh: revealStep?.card.id === card.id })}
      discarded={them.discarded}
      flopDiscards={them.flopDiscards}
      purse={round.potMode ? { amount: shownMoney(1), start: startMoney(1), keep: game.month, paid: paidWon(1)[0], won: paidWon(1)[1] } : null}
      onselect={() => (showCaptain = !showCaptain)}
      bind:cardsEl={oppCardsEl}
      bind:purseEl={theirPurseEl}
    >
      {#snippet portrait()}{#if line && lineMs && line.who === opponentId && line.size !== 'full' && line.at !== 'low'}{#key line}<Countdown ms={lineMs} />{/key}{/if}{/snippet}
    </OpponentSeat>
  </section>

  <!-- The river: the border between them and you. -->
  <section class="river" bind:this={riverEl}>
    {#if revealing && theirCall}
      <!-- The showdown: their hand so far, called where the street name was. -->
      <div class="callout theirs" aria-live="polite">
        <!-- A hand's name opens the hands, best first, with it picked out. -->
        <button class="call ladder-link" class:long={theirCall.call.length > 30} onclick={() => (cardPrefs.ladder = theirHand?.category ?? 'all')}>{theirCall.call}</button>
        <span class="lingo">{theirCall.lingo ?? ''}</span>
        <span class="note">{theirNote}</span>
      </div>
    {:else}
      <div class="river-head">
      <span class="crossing">{t('table.crossing', { month: game.month })}</span>
      <span class="street">
        {standing ? t('street.standings') : t(`street.${streetName}`)}
        <!-- Every street has a second line (blank at the showdown), so nothing moves. -->
        <span class="street-sub">{standing || streetName === 'showdown' ? '' : t(`street.sub.${streetName}`)}</span>
      </span>
      <button class="ghost icon" class:beckon={helpWanted && !showHelp} onclick={openHelp} aria-label={t('title.howTo')}>?</button>
    </div>
    {/if}
    <!-- After the round the standings take the pot's and the board's place (those stay, hidden, so nothing moves). -->
    <div class="river-body" class:cleared={standing}>
      <!-- The pot: their coins above the middle, yours below, filling in from the left. -->
      <!-- With no pot (the first lessons) it stays, empty, so the table keeps its shape. -->
      <PotBand count={potBets[0] + potBets[1]} paid={!!payout} outcome={outcomeShown ? outcomeText : null} won={winner === 0} bind:el={potEl} />
      <Board cards={boardCards} marks={(card) => ({ above: theirBoard.has(card.id), below: usedIds.has(card.id) })} bind:el={communityEl} />
      {#if standing}<div class="standings-over"><Standings {game} />{#if game.finaleNext}<p class="finale-next">{t('finale.next')}</p>{/if}</div>{/if}
    </div>
    <!-- Always there, so a snag coming up never moves the table; empty when nothing is at stake (after a fold the snag goes back into the deck). -->
    <p class="stakes">{#if stakes.length && !standing && !result?.byFolds}{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}{/if}</p>
    {#if showCaptain}
      <!-- Their details take the river's place (tap to go back to the board): who they are and, mid-round, Willie's reckoning. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="river-info" onclick={() => (showCaptain = false)}>
        <p class="blurb">{t(`character.${opponentId}.blurb`)}</p>
        {#if odds}
          <p class="harbour">{t('draw.oddsTitle', { name: name(opponentId) })}</p>
          <!-- Every rank, even the impossible ones (a reminder of what beats what); not the all-but-mythical straight flush. -->
          {#each [...CATEGORIES].filter((c) => c !== 'straightFlush').reverse() as cat}
            {@const p = odds.categories[cat]}
            <div class="bar" class:none={p === 0}>
              <span>{t(`hand.${cat}`)}</span>
              <span class="track"><span class="fill" style="width: {p * 100}%"></span></span>
              <span class="num">{p === 0 ? '–' : p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`}</span>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </section>

  <!-- Your side of the table, from the pot outwards: your money, your cards, your decisions. Fixed rows, so nothing moves as the round goes on. -->
  <section class="captain">
    <!-- Your money nearest the pot, no figure: never count your money at the table. -->
    <div class="my-purse" bind:this={myPurseEl}>
      {#if round.potMode}<Purse amount={shownMoney(0)} start={startMoney(0)} showAmount={false} focus={18} label={t('character.captain.you')} keep={game.month} paid={paidWon(0)[0]} won={paidWon(0)[1]} tidy />{/if}
      <!-- On the River your coins are idle, so the hand you're making is called over them, with the count of snags riding along and their forfeit. Fixed size: it never shifts as you tap. -->
      {#if shownDown && myCall}
        <!-- At the showdown your coins show again (the pot may fly to them); your hand is one line above. -->
        <button class="my-hand ladder-link" onclick={() => (cardPrefs.ladder = result?.hands[0]?.category ?? 'all')}>{myCall.lingo ?? myCall.call}</button>
      {:else if playing && (composing || naming) && callout && (naming || !lessonAhead)}
        <div class="callout" aria-live="polite">
          <button class="call ladder-link" class:long={callout.call.length > 30} onclick={() => (cardPrefs.ladder = preview?.category ?? 'all')}>{callout.call}</button>
          <span class="lingo">{callout.lingo ?? ''}</span>
          <span class="note">
            {#if tappedJokers.length === 1}{t('draw.ridingOne', { cost: money(config.jokerForfeit ?? 0) })}{:else if tappedJokers.length}{t('draw.riding', { n: t(`number.${tappedJokers.length}`), cost: money(tappedJokers.length * (config.jokerForfeit ?? 0)) })}{:else if !tapped.length}{t('draw.boardOnly')}{/if}
          </span>
        </div>
      {/if}
    </div>
    <!-- At the showdown: the cards you played, then any you kept back, dimmed. -->
    <MyCards
      played={myPlayed}
      hand={me.hand.filter((c) => dealt.has(c.id))}
      look={(card) => ({
        selected: (composing || naming) && tapped.includes(card.id),
        toss: !composing && !naming && tapped.includes(card.id),
        used: (composing || naming) && usedIds.has(card.id),
        faded: shownDown,
      })}
      ontap={playing ? tap : undefined}
      {thrown}
      snags={mySnags}
      snagLook={(card) => ({ selected: tapped.includes(card.id), used: shownDown && myPlayedSnagIds.has(card.id), lifted: shownDown && myPlayedSnagIds.has(card.id) })}
      onsnag={playing && composing ? tap : undefined}
      discarded={me.discarded}
      flopDiscards={me.flopDiscards}
    />
  </section>

  <!-- The two buttons, the same on every screen: black on the left half, white on the right. -->
  <ActionBar idle={!playing && !revealing && !standing && !showCaptain && !showHelp && !holding} inert={lineWaiting} row={4} bind:el={actionsEl}>
    {#if showHelp}
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
        <!-- More replies, or longer ones than half the row holds: stacked, rising over the table, the last (white) nearest the thumb.
             The row keeps its height (an invisible stand-in), so nothing above moves. -->
        <button class="stand-in" disabled aria-hidden="true">&nbsp;</button>
        <div class="stack">
          {#each replies as r, i (i)}<button class:ghost={i < replies.length - 1} onclick={() => answer(r)} disabled={naming && !named}>{label(r, i)}</button>{/each}
        </div>
      {/if}
    {:else if holding}
      <!-- A scene to read: skip the conversation, or on to the next line. -->
      <button class="ghost" onclick={() => (talk = null)}>{t('show.skip')}</button>
      <button onclick={() => nextLine()}>{t('show.next')}</button>
    {:else if showCaptain}
      <!-- Their details are up: the white button takes you back, the black one waits. -->
      <button class="ghost" disabled>{standing ? t('end.pause') : revealing ? t('show.skip') : foldLabel}</button>
      <button onclick={() => (showCaptain = false)}>{t('draw.back')}</button>
    {:else if standing}
      <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
      <!-- Four left: on to the final table. -->
      <button onclick={() => onnext?.()}>{game.finaleNext ? t('finale.go') : t('end.next')}</button>
    {:else if revealing}
      <!-- Once the verdict is in there's nothing left to skip: the black button stays empty. -->
      <button class="ghost" onclick={revealSkip} disabled={verdictShown} style:visibility={verdictShown ? 'hidden' : null}>{t('show.skip')}</button>
      <button onclick={revealNext}>{t('show.next')}</button>
    {:else}
      <!-- A line asking for a move: only that move will do (no folding your way out of a lesson). -->
      <button class="ghost" onclick={fold} disabled={!playing || dealing || !showFold || !canFold(round, 0) || (line?.require ? line.require !== 'fold' : !complies)}>{foldLabel}</button>
      <!-- Call, Swap and Play hand commit you to the hand: held, not tapped (heavy.ts). A free Check is a light tap. -->
      <button onclick={go} disabled={!playing || dealing || !complies} data-heavy={composing || tapped.length > 0 || cost > 0 ? 'true' : undefined}>{buttonLabel}</button>
    {/if}
  </ActionBar>
</div>



<style>
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
  .opponent {
    row-gap: 0.5rem;
  }
  /* Lifted clear of their cards, into the room under the name. */
  /* A purse's place keeps its height when there is no money on the table, so nothing moves. */
  .my-purse {
    min-height: 72px;
  }
  :global(.short) .my-purse {
    min-height: 56px;
  }
  .river {
    position: relative;
  }

  .help-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
  }
  .river-info {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 0.4rem 0.75rem;
    background: rgba(12, 12, 11, 0.97);
    text-align: left;
    overflow: auto;
    cursor: pointer;
    animation: callout-in 0.2s ease-out;
  }
  .river-info .blurb {
    margin: 0 0 0.4rem;
    font-size: 0.85rem;
    line-height: 1.3;
    color: var(--paper);
  }
  .river-info .harbour {
    margin: 0 0 0.2rem;
    font-size: 0.8rem;
    color: var(--grey);
  }
  .bar {
    display: grid;
    grid-template-columns: 7.5rem 1fr 2.4rem;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.75rem;
    line-height: 1.15;
  }
  .bar.none {
    color: var(--grey);
    opacity: 0.7;
  }
  .track {
    height: 7px;
    background: #222;
    border: 1px solid var(--dim);
  }
  .track .fill {
    display: block;
    height: 100%;
    background: var(--paper);
  }
  .num {
    text-align: right;
  }
  .river-body {
    position: relative;
  }
  .river-body.cleared > :not(.standings-over) {
    visibility: hidden;
  }
  .standings-over {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    animation: callout-in 0.3s ease-out;
  }
  /* Four left: the League's last word before the final table. */
  .finale-next {
    margin: 0.5rem 0 0;
    text-align: center;
    font-family: var(--title-font);
    letter-spacing: 0.06em;
  }
  .standings-over :global(.standings) {
    width: 100%;
  }
  .standings-over {
    padding: 0.2rem 0;
  }
  /*
   * The screen grid: 12 columns, and rows top (them), center (the river),
   * bottom (you) and actions (the two buttons), the same on every screen. The
   * table keeps to the bottom, so the buttons sit where the title screen's do;
   * any spare height goes above. Capped at a big phone's width: it's a
   * portrait game. A card is two columns and a gap wide, so their cards, the
   * board and yours line up edge to edge.
   */
  .table.solo {
    --gap: 0.5rem;
    container-type: inline-size;
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gap);
    row-gap: clamp(0.6rem, 2.5vh, 1.75rem);
    align-content: end;
    width: 100%;
    max-width: 480px;
    min-height: 100svh;
    margin: 0 auto;
    padding: 1rem 1rem 0.75rem;
  }
  .table.solo > :not(.help-layer) {
    --col: calc((100cqw - 11 * var(--gap)) / 12);
    --card-w: calc(2 * var(--col) + var(--gap));
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    padding: 0;
    border: none;
  }
  /* The rows by name: top (them), center (the river), bottom (you), actions. */
  .table.solo > .opponent {
    grid-row: 1;
  }
  .table.solo > .river {
    grid-row: 2;
  }
  .table.solo > .captain {
    grid-row: 3;
  }
  .table.solo > section > :global(*) {
    grid-column: 1 / -1;
  }
  .table.solo :global(.card:not(.huge)) {
    --w: var(--card-w) !important;
  }
  .captain {
    row-gap: 0.4rem;
  }
  .my-purse {
    position: relative;
  }
  /* Your hand's name, low enough to clear the ▲ marks under the board cards it uses. */
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
    text-shadow: 0 0 3px #000, 0 0 6px #000;
    /* Only the words are a tap target (the hands, best first); the purse around them stays the purse's. */
    width: fit-content;
    max-width: 100%;
    margin: 0 auto;
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
  /* Their callout takes the street name's place at the head of the river. */
  /* No frame: the river head's own space is frame enough. */
  .callout.theirs {
    border: none;
    background: none;
    position: relative;
    inset: auto;
    height: 3.5rem;
    margin-bottom: 0.4rem;
    padding-top: 2px;
    padding-bottom: 2px;
  }
  .callout.theirs .call {
    font-size: 1rem;
  }
  .callout.theirs .call.long {
    font-size: 0.85rem;
  }
  .callout.theirs .lingo {
    font-size: 0.85rem;
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
  /* Short screens, decided once at load (so hiding a phone's browser bars never changes it): the gaps and paddings give way first. */
  :global(.short) .table.solo {
    gap: 0.4rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  :global(.short) .river-head,
  :global(.short) .callout.theirs {
    height: 3.3rem;
  }
  :global(.short) .captain {
    row-gap: 0.2rem;
  }
  :global(.short) .opponent {
    row-gap: 0.25rem;
  }
</style>
