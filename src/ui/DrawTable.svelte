<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import {
    STREETS,
    CATEGORIES,
    bestHand,
    canFold,
    discardCost,
    isComposing,
    streetFee,
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
  import CardView from './CardView.svelte';
  import Pot from './Pot.svelte';
  import Standings from './Standings.svelte';
  import Purse from './Purse.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import HowTo from './HowTo.svelte';
  import Speech, { autoMs, beats, BEAT_MS, type Reply, type SpeechLine } from './Speech.svelte';
  import Countdown from './Countdown.svelte';
  import type { RoundScript, Trigger } from '../story/script';
  import { cardLabel, dollars, jokerList, name, nickname } from './format';
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
  const line = $derived(talk ? talk.lines[talk.i] : null);
  /** The line is waiting for a move at the table: the white button only takes that one. */
  const complies = $derived.by(() => {
    const want = line?.require;
    // A move asked for later in the conversation: no playing ahead of it.
    if (!want) return !lessonAhead;
    if (want === 'fold') return false;
    if (tapped.length !== want.length || tappedJokers.length) return false;
    // Whole cards first, then ranks, so `4c` and `4` both find their four.
    const open = [...want].sort((a, b) => b.length - a.length);
    return tappedCards.every((c) => {
      const k = open.findIndex((w) => w === c.id || (!isJoker(c) && w === rankLabel(c.rank)));
      return k >= 0 && open.splice(k, 1).length > 0;
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

  // Jokers are interchangeable, so the selection only tracks how many are in.
  const tappedCards = $derived(me.hand.filter((c) => tapped.includes(c.id)));
  const tappedJokers = $derived(me.jokers.filter((c) => tapped.includes(c.id)));
  const preview = $derived(
    composing ? bestHand([...tappedCards, ...tappedJokers], round.community, { min: tapped.length, max: tapped.length }) : null,
  );
  // The showdown, on the table: their played cards flip in place, one per Next,
  // with their hand so far called where the street name was.
  const result = $derived(round.result);
  const shownDown = $derived(!!result && result.folded == null);
  const steps = $derived(shownDown ? planReveal(round, 1, new Rng(round.month * 31 + round.discards.length)) : []);
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
  const theirPlayed = $derived(shownDown ? them.slots.filter((c): c is Card => c !== null) : []);
  const playedIds = $derived(new Set(theirPlayed.map((c) => c.id)));
  /** Their cards face up: those flipped so far, or all they played once the showdown is over. */
  const faceUp = $derived(
    !shownDown ? new Set<string>() : revealing ? new Set(steps.slice(0, revealIndex + 1).map((s) => s.card.id)) : playedIds,
  );
  const theirHand = $derived(revealStep?.hand ?? (shownDown ? result!.hands[1] : null));
  /** Once the verdict is in, only the winning hand gets its exclamation mark. */
  const decided = $derived(shownDown && (verdictShown || stage === 'result'));
  const theirCall = $derived(theirHand ? handLabel(theirHand, { exclaim: decided && result?.winner === 1 }) : null);
  /** The third line, once the last card is down: what decided it, on a tie-break. (No odds while the cards turn: let them play out.) */
  const theirNote = $derived.by(() => {
    if (!revealing || !result || !verdictShown) return '';
    if (result.winner === null) return '';
    const tb = tiebreak(result.hands[result.winner], result.hands[1 - result.winner]);
    return tb ? t(`show.tb.${tb.kind}.${result.winner === 0 ? 'you' : 'them'}`, { name: name(opponentId), win: tb.winner, lose: tb.loser }) : '';
  });
  /**
   * The result, where the pot was, once the last card is down (or a fold ends
   * the hand) and the coins have gone: a win, or what it cost you.
   */
  const outcomeShown = $derived(!playing && !!result && (decided || result.folded != null));
  const outcomeText = $derived.by(() => {
    if (!result) return '';
    if (result.winner === 0) return t('show.youWin');
    if (result.winner === null) return round.potMode ? t('show.split') : t('show.draw');
    const lost = (round.potMode ? round.bets[0] : 0) + (result.forfeit ?? 0);
    if (lost) return t('show.lost', { amount: money(lost) });
    // A fold with nothing in the pot isn't a defeat (in a lesson it may be the wise move).
    return result.folded === 0 ? t('show.folded') : t('show.youLose');
  });
  function revealNext() {
    // Past the verdict: the round's closing lines first, if it has any.
    if (verdictShown && !fire('verdict')) onrevealed?.();
    else revealPos = { month: game.month, i: revealIndex + 1 };
  }
  function revealSkip() {
    onverdict?.();
    // Skipping to the verdict still hears the round's closing lines, over the finished showdown.
    revealPos = { month: game.month, i: lastStep };
    if (!fire('verdict')) onrevealed?.();
  }
  /** Board cards each hand uses: theirs marked above, yours below. */
  const theirBoard = $derived(
    revealStep ? new Set(revealStep.boardUsed) : shownDown && !revealing ? new Set(result!.hands[1].cards.map((c) => c.id)) : new Set<string>(),
  );
  const myCall = $derived(shownDown ? handLabel(result!.hands[0], { exclaim: decided && result?.winner === 0 }) : null);
  /** After Play hand the played cards leave the hand for the slots: show them first, the rest dimmed. */
  const myPlayed = $derived(shownDown ? me.slots.filter((c): c is Card => c !== null && !isJoker(c)) : []);
  const myPlayedSnagIds = $derived(new Set(shownDown ? me.slots.filter((c): c is Card => c !== null && isJoker(c)).map((c) => c.id) : []));
  /**
   * A side's snags in its fan. The hand is already resolved when the showdown
   * starts (the loser keeps the snags it played, and takes the winner's), so
   * until the verdict each fan shows the snags as they were when the hand was
   * played, then the outcome: snags dumped on the loser land in their fan.
   */
  function fan(seat: typeof me): Card[] {
    const played = seat.slots.filter((c): c is Card => c !== null && isJoker(c));
    if (!shownDown || settled) return seat.jokers;
    const moved = new Set([...result!.dumped, ...result!.communityTaken].map((c) => c.id));
    const kept = seat.jokers.filter((j) => !moved.has(j.id) && !played.some((p) => p.id === j.id));
    return [...kept, ...played];
  }
  const mySnags = $derived(fan(me));
  const theirSnags = $derived(fan(them));

  const callout = $derived(preview ? handLabel(preview) : null);
  // Like the callout, the marks under the board wait for the lesson.
  const usedIdsPlay = $derived(new Set(lessonAhead ? [] : (preview?.cards.map((c) => c.id) ?? [])));
  const usedIds = $derived(shownDown ? new Set(result!.hands[0].cards.map((c) => c.id)) : usedIdsPlay);

  const stakes = $derived([...(round.communityJoker ? [round.communityJoker] : []), ...round.community.filter(isJoker)]);
  const streetName = $derived(composing ? 'compose' : round.street <= 2 ? STREETS[round.street] : 'showdown');

  // Willie's reckoning appears on the captain card while a round is being played.
  const odds = $derived.by((): OpponentOdds | null => {
    if (!showCaptain || !playing) return null;
    // Seeded from the visible situation so the numbers stay put while you look.
    const seed = round.community.length * 7919 + round.discards.length * 104729 + round.month;
    return opponentOdds(viewFor(round, 0), config, new Rng(seed), 600);
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
  onDestroy(() => {
    clearTimeout(dealTimer);
    clearResting();
  });
  // Coins resting on a purse are placed on the screen, not the table: if the
  // screen changes size (a phone turned), they go, and the purse shows the rest.
  $effect(() => {
    const onResize = () => clearResting();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

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
    if (order.length) dealTimer = setTimeout(dealNext, 250);
  }

  function dealNext() {
    const [id, ...rest] = pending;
    if (!id) return;
    dealt = new Set([...dealt, id]);
    pending = rest;
    if (!rest.length) return;
    // A beat before the board: the hole cards are out, now the Flop.
    const boardNext = round.community.some((c) => c.id === rest[0]) && !round.community.some((c) => c.id === id);
    const delay = fastDeal ? 70 : boardNext ? 600 : 300;
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
    const won = result?.winner === 0;
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
    if (!playing && result?.folded != null)
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
  const bets = $derived<[number, number]>(round.potMode ? round.bets : [0, 0]);
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
  const potBets = $derived<[number, number]>(round.potMode ? bets : [0, 0]);
  const payout = $derived<'me' | 'them' | 'split' | null>(
    !playing && settled && round.result && round.potMode
      ? round.result.winner === 0 ? 'me' : round.result.winner === 1 ? 'them' : 'split'
      : null,
  );
  // Coins fly: from the purse's active coin (where it stood) to its spot in the
  // pot as a captain pays in, and from the pot to the winner at the verdict.
  let myPurseEl = $state<HTMLElement>();
  let theirPurseEl = $state<HTMLElement>();
  let potEl = $state<HTMLElement>();
  let flownMonth = -1;
  let flown: [number, number] = [0, 0];
  let paidMonth = -1;
  const MAX_FLYERS = 40;
  const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Winnings resting on the winner's stacks until the next round lays the purse out with them. */
  let resting: HTMLElement[] = [];
  function clearResting() {
    for (const c of resting) c.remove();
    resting = [];
  }
  // Resting coins are drawn over the whole table: a caption over your side would show them through it, so they wait under it.
  $effect(() => {
    const hide = lowLine;
    for (const c of resting) c.style.visibility = hide ? 'hidden' : '';
  });

  /** One coin from one spot on screen to another; resolves when it lands. `stay` leaves it there. */
  function fly(from: DOMRect, to: DOMRect, delay: number, stay = false): Promise<void> {
    const coin = document.createElement('span');
    coin.className = game.currency === 'buttons' ? 'flying-coin button' : 'flying-coin';
    Object.assign(coin.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    document.body.append(coin);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width / from.width;
    const anim = coin.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${dx / 2}px, ${dy / 2 - 24}px) scale(${(1 + scale) / 2 + 0.15})`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: 520, delay, easing: 'ease-in-out', fill: 'backwards' },
    );
    if (stay) {
      resting.push(coin);
      return anim.finished.then(() => {
        Object.assign(coin.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, transform: 'none' });
        anim.cancel();
      });
    }
    return anim.finished.then(() => coin.remove(), () => coin.remove());
  }

  /** A captain paid dollars a..b into the pot: each coin leaves its purse spot and lands on its pot spot. */
  function payIn(seat: 0 | 1, a: number, b: number) {
    const purse = seat === 0 ? myPurseEl : theirPurseEl;
    if (!purse || !potEl || still()) return;
    const offset = Math.max(0, startMoney(seat) - 400); // purses show at most $400
    for (let k = a; k < Math.min(b, a + MAX_FLYERS); k++) {
      const src = purse.querySelector(`[data-d="${k - offset}"]`);
      const dst = potEl.querySelector<HTMLElement>(`[data-seat="${seat}"][data-k="${k}"]`);
      if (!src || !dst) continue;
      dst.classList.add('landing');
      fly(src.getBoundingClientRect(), dst.getBoundingClientRect(), (k - a) * 45).then(() => dst.classList.remove('landing'));
    }
  }

  /** The tops of a purse's stacks, left to right: where winnings come to rest. */
  function stackTops(purse: HTMLElement): DOMRect[] {
    const tops = new Map<number, DOMRect>();
    for (const c of purse.querySelectorAll<HTMLElement>('[data-d]:not(.spent)')) {
      const r = c.getBoundingClientRect();
      const key = Math.round(r.left);
      if (!tops.has(key) || r.top < tops.get(key)!.top) tops.set(key, r);
    }
    return [...tops.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
  }

  /**
   * The verdict: each coin in the pot flies to the winner (on a tie, each side's
   * go home). A captain's own coins return to the very spots they left, which
   * stay empty until they land, so the stacks refill; the loser's coins come to
   * rest on top of the winner's stacks, one stack after another.
   */
  function payOut(to: 'me' | 'them' | 'split') {
    if (!potEl || still()) return;
    const coins = [...potEl.querySelectorAll<HTMLElement>('[data-seat]')].slice(-MAX_FLYERS * 2);
    const tops: Record<number, DOMRect[]> = {};
    const piled: Record<number, number> = { 0: 0, 1: 0 };
    coins.forEach((c, i) => {
      const from = Number(c.dataset.seat) as 0 | 1;
      const k = Number(c.dataset.k);
      const seat = to === 'split' ? from : to === 'me' ? 0 : 1;
      const purse = seat === 0 ? myPurseEl : theirPurseEl;
      if (!purse) return;
      const home = from === seat ? purse.querySelector<HTMLElement>(`[data-d="${k - Math.max(0, startMoney(seat) - 400)}"]`) : null;
      if (home) {
        home.classList.add('landing');
        fly(c.getBoundingClientRect(), home.getBoundingClientRect(), i * 14).then(() => home.classList.remove('landing'));
        return;
      }
      tops[seat] ??= stackTops(purse);
      const list = tops[seat];
      if (!list.length) return;
      const n = piled[seat]++;
      const top = list[n % list.length];
      const step = top.height * 0.5; // each coin sits half a coin higher on the pile
      const spot = new DOMRect(top.left, top.top - step * (1 + Math.floor(n / list.length)), top.width, top.height);
      fly(c.getBoundingClientRect(), spot, i * 14, true);
    });
  }

  $effect(() => {
    const b = potBets;
    const month = game.month;
    const pay = payout;
    untrack(() => {
      if (month !== flownMonth) {
        clearResting();
        flownMonth = month;
        flown = [0, 0];
      }
      ([0, 1] as const).forEach((seat) => {
        if (b[seat] > flown[seat]) payIn(seat, flown[seat], b[seat]);
      });
      flown = [b[0], b[1]];
      if (pay && paidMonth !== month) {
        paidMonth = month;
        payOut(pay);
      }
    });
  });

  const cost = $derived(
    round.potMode && !composing && playing
      ? streetFee(config, round.month, round.street + 1) + discardCost(me.discarded.length, tappedCards.length)
      : 0,
  );
  /** A price on the table: dollars, or in the lessons, buttons. */
  const money = (n: number) => (game.currency === 'buttons' ? t(n === 1 ? 'money.button' : 'money.buttons', { n }) : dollars(n));
  /** On the action buttons there's only room for a sign and the figure: $3, or ⚇3 (a button, two holes). */
  const price = (n: number) => (game.currency === 'buttons' ? `⚇${n}` : dollars(n));
  const priced = (label: string) => (cost ? `${label} · ${price(cost)}` : label);
  const buttonLabel = $derived(
    composing
      ? t('draw.play')
      : tapped.length
        ? priced(t('draw.discard', { n: tapped.length }))
        : cost
          ? priced(t('draw.call'))
          : t('draw.check'),
  );
  const showFold = $derived(playing && !composing);
  // Folding gives up everything you have put into the pot so far.
  const foldLabel = $derived(bets[0] ? `${t('draw.fold')} · ${price(bets[0])}` : t('draw.fold'));

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
  {#if line}
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
    <!-- Name and title over their coins; a tall portrait beside both. -->
    <div class="opp-head">
      <div class="opp-left">
        <button class="name-btn" onclick={() => (showCaptain = !showCaptain)}>
          <span class="who">
            <span class="name">{name(opponentId)}</span>
            <span class="title">{nickname(opponentId) ? `“${nickname(opponentId)}”` : t(`character.${opponentId}.boat`)}</span>
          </span>
        </button>
        <!-- No pot, no money on the table (the first lessons). -->
        <div class="opp-purse" bind:this={theirPurseEl}>{#if round.potMode}<Purse amount={shownMoney(1)} start={startMoney(1)} showAmount={false} focus={18} label={name(opponentId)} />{/if}</div>
      </div>
      <button class="portrait-btn" onclick={() => (showCaptain = !showCaptain)} aria-label={name(opponentId)}>
        <span class="oval portrait">{name(opponentId)[0]}{#if line && lineMs && line.who === opponentId && line.size !== 'full' && line.at !== 'low'}{#key line}<Countdown ms={lineMs} />{/key}{/if}</span>
      </button>
    </div>
    <div class="opp-cards" bind:this={oppCardsEl}>
      <div class="hand-cell">
      <!-- At the showdown their played cards flip in place, one per Next. -->
      {#each theirPlayed.filter((c) => !isJoker(c)) as card (card.id)}
        {#if faceUp.has(card.id) || theyShowed}<CardView {card} fresh={revealStep?.card.id === card.id} />{:else}<CardView faceDown />{/if}
      {/each}
      <!-- Held back, but turned over too (dimmed), one per Next after the played ones: you get to see how they play. -->
      {#each them.hand.filter((c) => dealt.has(c.id)) as card, k (card.id)}
        {@const turned = decided || theyShowed || (revealing && revealIndex >= steps.length + k)}
        {#if turned}<CardView {card} faded={shownDown} fresh={(revealing && revealIndex === steps.length + k) || (theyShowed && !shownDown)} />{:else}<CardView faceDown deal="top" faded={shownDown} />{/if}
      {/each}
      </div>
      <div class="fan-cell">
      {#if theirSnags.length}
        <!-- However many snags they carry, the fan never grows past its width. Played snags flip like their cards. -->
        <div class="snag-fan" style="--n: {theirSnags.length}">
          {#each theirSnags as card (card.id)}
            <!-- A snag they played rises out of the fan as it's revealed: riding along in their hand. -->
            {#if !playedIds.has(card.id) || faceUp.has(card.id)}<CardView {card} lifted={playedIds.has(card.id) && faceUp.has(card.id)} fresh={revealStep?.card.id === card.id} />{:else}<CardView faceDown />{/if}
          {/each}
          {#if theirSnags.length > 2}<span class="snag-count">×{theirSnags.length}</span>{/if}
        </div>
      {/if}
      </div>
      <div class="discard-cell"><DiscardChips tall cards={them.discarded} flop={them.flopDiscards} title={t('draw.theirDiscards', { name: name(opponentId) })} /></div>
    </div>
  </section>

  <!-- The river: the border between them and you. -->
  <section class="river" bind:this={riverEl}>
    {#if revealing && theirCall}
      <!-- The showdown: their hand so far, called where the street name was. -->
      <div class="callout theirs" aria-live="polite">
        <span class="call" class:long={theirCall.call.length > 30}>{theirCall.call}</span>
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
      <button class="ghost icon" onclick={openHelp} aria-label={t('title.howTo')}>?</button>
    </div>
    {/if}
    <!-- After the round the standings take the pot's and the board's place (those stay, hidden, so nothing moves). -->
    <div class="river-body" class:cleared={standing}>
      <!-- The pot: their coins above the middle, yours below, filling in from the left. -->
      <!-- With no pot (the first lessons) it stays, empty, so the table keeps its shape. -->
      <div class="pot-band" bind:this={potEl}>
        <Pot bets={potBets} paid={!!payout} />
        {#if outcomeShown}<p class="outcome" class:won={result?.winner === 0} aria-live="polite">{outcomeText}</p>{/if}
      </div>
      <div class="community" bind:this={communityEl}>
        {#each Array.from({ length: boardSize }) as _, i}
          {@const card = round.community[i] && dealt.has(round.community[i].id) ? round.community[i] : null}
          <CardView {card} deal="left" markAbove={!!card && theirBoard.has(card.id)} markBelow={!!card && usedIds.has(card.id)} />
        {/each}
      </div>
      {#if standing}<div class="standings-over"><Standings {game} /></div>{/if}
    </div>
    {#if stakes.length}<p class="stakes">{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}</p>{/if}
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
      {#if round.potMode}<Purse amount={shownMoney(0)} start={startMoney(0)} showAmount={false} focus={18} label={t('character.captain.you')} />{/if}
      <!-- On the River your coins are idle, so the hand you're making is called over them, with the count of snags riding along and their forfeit. Fixed size: it never shifts as you tap. -->
      {#if shownDown && myCall}
        <!-- At the showdown your coins show again (the pot may fly to them); your hand is one line above. -->
        <p class="my-hand">{myCall.lingo ?? myCall.call}</p>
      {:else if playing && composing && callout && !lessonAhead}
        <div class="callout" aria-live="polite">
          <span class="call" class:long={callout.call.length > 30}>{callout.call}</span>
          <span class="lingo">{callout.lingo ?? ''}</span>
          <span class="note">
            {#if tappedJokers.length === 1}{t('draw.ridingOne', { cost: money(config.jokerForfeit ?? 0) })}{:else if tappedJokers.length}{t('draw.riding', { n: t(`number.${tappedJokers.length}`), cost: money(tappedJokers.length * (config.jokerForfeit ?? 0)) })}{:else if !tapped.length}{t('draw.boardOnly')}{/if}
          </span>
        </div>
      {/if}
    </div>
    <div class="hand-row">
      <div class="hand-cell">
      <!-- At the showdown: the cards you played, then any you kept back, dimmed. -->
      {#each myPlayed as card (card.id)}<CardView {card} used />{/each}
      {#each me.hand.filter((c) => dealt.has(c.id)) as card (card.id)}
        <CardView
          {card}
          selected={composing && tapped.includes(card.id)}
          toss={!composing && tapped.includes(card.id)}
          used={composing && usedIds.has(card.id)}
          faded={shownDown}
          deal="left"
          onclick={playing ? () => tap(card) : undefined}
        />
      {/each}
      </div>
      <div class="fan-cell">
      {#if mySnags.length}
        <!-- However many snags you carry, the fan never grows past its width. -->
        <div class="snag-fan mine" class:live={composing} style="--n: {mySnags.length}">
          {#each mySnags as card (card.id)}
            <CardView {card} selected={tapped.includes(card.id)} used={shownDown && myPlayedSnagIds.has(card.id)} lifted={shownDown && myPlayedSnagIds.has(card.id)} onclick={playing && composing ? () => tap(card) : undefined} />
          {/each}
          {#if mySnags.length > 2}<span class="snag-count">×{mySnags.length}</span>{/if}
        </div>
      {/if}
      </div>
      <div class="discard-cell"><DiscardChips tall cards={me.discarded} flop={me.flopDiscards} title={t('draw.yourDiscards')} /></div>
    </div>



  </section>

  <!-- The two buttons, the same on every screen: black on the left half, white on the right. -->
  <div class="actions" class:idle={!playing && !revealing && !standing && !showCaptain && !showHelp && !holding} bind:this={actionsEl}>
    {#if showHelp}
      <!-- How it works is up: Menu (the way out mid-hand) and Close. -->
      <button class="ghost" onclick={() => ((showHelp = false), onmenu())}>{t('end.pause')}</button>
      <button onclick={() => (showHelp = false)}>{t('draw.close')}</button>
    {:else if line?.replies && !shortcut}
      <!-- A line waiting for an answer: two replies (black, white), or one on the white button and nothing pretending on the black. -->
      {@const [a, b] = line.replies}
      {#if b}
        <button class="ghost" onclick={() => answer(a)}>{a.label ?? t('talk.decline')}</button>
        <button onclick={() => answer(b)}>{b.label ?? t('talk.agree')}</button>
      {:else}
        <button class="ghost" disabled style="visibility: hidden" aria-hidden="true"></button>
        <button onclick={() => answer(a)}>{a.label ?? t('talk.agree')}</button>
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
      <button onclick={() => onnext?.()}>{t('end.next')}</button>
    {:else if revealing}
      <button class="ghost" onclick={revealSkip}>{t('show.skip')}</button>
      <button onclick={revealNext}>{t('show.next')}</button>
    {:else}
      <!-- A line asking for a move: only that move will do (no folding your way out of a lesson). -->
      <button class="ghost" onclick={fold} disabled={!playing || dealing || !showFold || !canFold(round, 0) || (line?.require ? line.require !== 'fold' : !complies)}>{foldLabel}</button>
      <button onclick={go} disabled={!playing || dealing || !complies}>{buttonLabel}</button>
    {/if}
  </div>
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
  .opponent {
    row-gap: 0.5rem;
  }
  /* Name and title over their coins in columns 1–8; the portrait in 9–12. */
  .opp-head {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
  }
  .opp-left {
    grid-column: 1 / 9;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  /* Centred in the space beside the portrait; a long title wraps rather than spill. */
  .opp-left .name-btn {
    align-self: center;
    max-width: 100%;
  }
  .opp-left .title {
    white-space: normal;
    text-align: center;
    line-height: 1.15;
  }
  /* Lifted clear of their cards, into the room under the name. */
  /* A purse's place keeps its height when there is no money on the table, so nothing moves. */
  .opp-purse,
  .my-purse {
    min-height: 72px;
  }
  :global(.short) .opp-purse,
  :global(.short) .my-purse {
    min-height: 56px;
  }
  .opp-purse {
    transform: translateY(-12px);
  }
  /* The portrait sits on the bottom of the head row and may rise above it, so it never makes the row taller. */
  .portrait-btn {
    grid-column: 9 / 13;
    position: relative;
    display: block;
    padding: 0;
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
  }
  /* A round portrait, as wide as its four columns. */
  .portrait {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    border-radius: 50%;
    font-size: 3.2rem;
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
  .standings-over :global(.standings) {
    width: 100%;
  }
  .standings-over {
    padding: 0.2rem 0;
  }
  .pot-band {
    position: relative;
    margin: 0.2rem 0 0.5rem;
  }
  /* The result takes the pot's place once the coins have flown. */
  .outcome {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.6rem;
    letter-spacing: 0.06em;
    color: var(--grey);
    animation: outcome 0.4s ease-out 0.8s backwards;
  }
  .outcome.won {
    font-size: 2rem;
    color: var(--paper);
  }
  @keyframes outcome {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .outcome {
      animation: none;
    }
  }
  /*
   * Card rows (theirs and yours) on the grid: three cards in columns 1–6, the
   * snag fan in 7–10, the discards in 11–12. A card is two columns wide.
   */
  .opp-cards,
  .hand-row {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: end;
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
  /* How many snags, as a badge on the fan: more than two can't be counted by eye. */
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
  .name-btn {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    outline: none;
    border: none;
    color: var(--paper);
    padding: 0;
  }
  .who {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    line-height: 1.15;
  }
  .who {
    align-items: center;
  }
  .title {
    font-size: 0.8rem;
    color: var(--grey);
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  /* An outline keeps the name readable where it overlaps the coins. */
  .name,
  .title {
    text-shadow: 0 0 2px #000, 0 0 4px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
  }
  .name {
    white-space: nowrap;
    font-family: var(--title-font);
    font-size: 1.3rem;
    text-decoration: underline dotted var(--grey);
    text-underline-offset: 4px;
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
  .table.solo > .actions {
    grid-row: 4;
    /* Above the film's vignette and grain: the buttons must read clearly, whatever the edges do. */
    position: relative;
    z-index: 51;
  }
  .table.solo > section > :global(*) {
    grid-column: 1 / -1;
  }
  .table.solo :global(.card:not(.huge)) {
    --w: var(--card-w) !important;
  }
  .table.solo .community {
    gap: var(--gap);
  }
  .captain {
    row-gap: 0.4rem;
  }
  /* Tall enough for a lifted card, so selecting one doesn't push anything. */
  .hand-row {
    height: calc(var(--card-w) * 1.4 + 14px);
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
    pointer-events: none;
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
  /* Two fixed halves of the grid: changing labels and prices never move them. */
  .actions > :first-child {
    grid-column: 1 / 7;
  }
  .actions > :last-child {
    grid-column: 7 / 13;
  }
  /* The main button's outline goes inside its edge, so both buttons stand the same size. */
  .actions button:not(.ghost) {
    outline-offset: -2px;
  }
  .actions button {
    padding-top: 0.6em;
    padding-bottom: 0.6em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .actions.idle {
    visibility: hidden;
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
  /* Phones: bigger button type. */
  @media (max-width: 600px) {
    .actions button {
      font-size: 1.15rem;
      padding-left: 0.5em;
      padding-right: 0.5em;
    }
  }
  .snag-fan.live :global(.card:hover) {
    z-index: 3;
  }
</style>
