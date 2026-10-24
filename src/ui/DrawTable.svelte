<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import {
    STREETS,
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
  import CaptainCard from './CaptainCard.svelte';
  import { cardPrefs, setCardFace } from './cards.svelte';
  import Pot from './Pot.svelte';
  import Purse from './Purse.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import WillieSays from './WillieSays.svelte';
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
  }
  let { game, onaction, settled = true, onmenu, stage = 'play', onverdict, onrevealed }: Props = $props();

  /** Tapped card ids: cards to discard on a street, cards to play when composing. */
  let tapped = $state<string[]>([]);
  let showHelp = $state(false);
  let showCaptain = $state(false);
  /** Jokers you just fished out of the deck, for Willie to announce. */
  let fishedNews = $state<string | null>(null);
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
      if (fresh.length) fishedNews = t('willie.fished', { jokers: jokerList(fresh.map((f) => f.joker)) });
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
  let revealIndex = $state(0);
  $effect(() => {
    if (stage === 'reveal') untrack(() => (revealIndex = 0));
  });
  const revealing = $derived(stage === 'reveal' && shownDown);
  const revealStep = $derived(revealing && steps.length ? steps[Math.min(revealIndex, steps.length - 1)] : null);
  const verdictShown = $derived(revealing && (!steps.length || !!revealStep?.last));
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
  /** The third line: what could still come, or what decided it. */
  const theirNote = $derived.by(() => {
    if (!revealing || !result) return '';
    if (!verdictShown && revealStep) {
      const pct = `${Math.round(revealStep.threat * 100)}%`;
      if (revealStep.possible.length) return t('show.stillOpen', { hand: t(`call.cat.${revealStep.possible[0]}`), pct });
      return revealStep.threat > 0 ? t('show.against', { pct }) : '';
    }
    if (result.winner === null) return '';
    const tb = tiebreak(result.hands[result.winner], result.hands[1 - result.winner]);
    return tb ? t(`show.tb.${tb.kind}.${result.winner === 0 ? 'you' : 'them'}`, { name: name(opponentId), win: tb.winner, lose: tb.loser }) : '';
  });
  const verdictLabel = $derived(
    result?.winner === 0 ? t('show.youWin') : result?.winner === 1 ? t('show.youLose') : t('show.draw'),
  );
  function revealNext() {
    if (verdictShown) onrevealed?.();
    else revealIndex++;
  }
  function revealSkip() {
    onverdict?.();
    onrevealed?.();
  }
  /** Board cards each hand uses: theirs marked above, yours below. */
  const theirBoard = $derived(
    revealStep ? new Set(revealStep.boardUsed) : shownDown && !revealing ? new Set(result!.hands[1].cards.map((c) => c.id)) : new Set<string>(),
  );
  const myCall = $derived(shownDown ? handLabel(result!.hands[0], { exclaim: decided && result?.winner === 0 }) : null);
  /** After Play hand the played cards leave the hand for the slots: show them first, the rest dimmed. */
  const myPlayed = $derived(shownDown ? me.slots.filter((c): c is Card => c !== null && !isJoker(c)) : []);
  const myPlayedSnagIds = $derived(new Set(shownDown ? me.slots.filter((c): c is Card => c !== null && isJoker(c)).map((c) => c.id) : []));
  const mySnags = $derived([...me.jokers, ...(shownDown ? me.slots.filter((c): c is Card => c !== null && isJoker(c)) : [])]);
  const theirSnags = $derived([...them.jokers, ...theirPlayed.filter(isJoker)]);
  const myPlayedSnags = $derived(shownDown ? me.slots.filter((c) => c && isJoker(c)).length : 0);

  const callout = $derived(preview ? handLabel(preview) : null);
  const usedIdsPlay = $derived(new Set(preview?.cards.map((c) => c.id) ?? []));
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
  // (you, them, you, them…), then the board. Fast deal speeds it up; a click
  // on the table finishes it at once.
  const FAST_KEY = 'wwr.fastDeal';
  let fastDeal = $state(readFast());
  let dealt = $state(new Set<string>());
  let pending = $state<string[]>([]);
  let dealtMonth = -1;
  let dealTimer: ReturnType<typeof setTimeout> | undefined;
  const dealing = $derived(pending.length > 0);

  /** Fast deal is on if chosen, and always for people who prefer reduced motion. */
  function readFast(): boolean {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    try {
      return localStorage.getItem(FAST_KEY) === '1';
    } catch {
      return false;
    }
  }

  function setFast(on: boolean) {
    fastDeal = on;
    try {
      localStorage.setItem(FAST_KEY, on ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  }

  $effect(() => {
    const r = round;
    untrack(() => scheduleDeal(r));
  });
  onDestroy(() => clearTimeout(dealTimer));

  function scheduleDeal(r: typeof round) {
    clearTimeout(dealTimer);
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

  function untapJoker() {
    const last = [...tapped].reverse().find((id) => me.jokers.some((j) => j.id === id));
    if (last) tapped = tapped.filter((id) => id !== last);
  }

  function go() {
    if (!playing || dealing) return;
    const action: Action = composing
      ? { type: 'compose', cardIds: tappedCards.map((c) => c.id), jokers: tappedJokers.length }
      : { type: 'draw', cardIds: tappedCards.map((c) => c.id) };
    tapped = [];
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

  /** One coin from one spot on screen to another; resolves when it lands. */
  function fly(from: DOMRect, to: DOMRect, delay: number): Promise<void> {
    const coin = document.createElement('span');
    coin.className = 'flying-coin';
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

  /** The verdict: the pot's coins fly to the winner (on a tie, each side's coins go home). */
  function payOut(to: 'me' | 'them' | 'split') {
    if (!potEl || still()) return;
    const coins = [...potEl.querySelectorAll<HTMLElement>('[data-seat]')].slice(-MAX_FLYERS * 2);
    coins.forEach((c, i) => {
      const seat = to === 'split' ? Number(c.dataset.seat) : to === 'me' ? 0 : 1;
      const purse = seat === 0 ? myPurseEl : theirPurseEl;
      const target = purse?.querySelector('.coins')?.getBoundingClientRect();
      if (!target) return;
      const spot = new DOMRect(target.left + target.width * (0.1 + 0.4 * Math.random()), target.bottom - 12, 18, 6);
      fly(c.getBoundingClientRect(), spot, i * 12);
    });
  }

  $effect(() => {
    const b = potBets;
    const month = game.month;
    const pay = payout;
    untrack(() => {
      if (month !== flownMonth) {
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
  const priced = (label: string) => (cost ? `${label} · ${dollars(cost)}` : label);
  const buttonLabel = $derived(
    composing
      ? t('draw.play')
      : tapped.length
        ? priced(t('draw.discard', { n: tapped.length }))
        : cost
          ? priced(t('draw.call'))
          : t('draw.check'),
  );
  const showFold = $derived(round.potMode && playing && !composing);
  // Folding gives up everything you have put into the pot so far.
  const foldLabel = $derived(bets[0] ? `${t('draw.fold')} · ${dollars(bets[0])}` : t('draw.fold'));

  function fold() {
    if (!playing || dealing || !canFold(round, 0)) return;
    tapped = [];
    onaction({ type: 'fold' });
  }

  const pct = (x: number) => `${Math.round(x * 100)}%`;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="table solo" onclick={finishDeal}>
  <!-- Their side of the table: everything above the board belongs to the opponent. -->
  <section class="opponent">
    <!-- Name and title over their coins; a tall portrait beside both. -->
    <div class="opp-head">
      <div class="opp-left">
        <button class="name-btn" onclick={() => (showCaptain = true)}>
          <span class="who">
            <span class="name">{name(opponentId)}</span>
            <span class="title">{nickname(opponentId) ? `“${nickname(opponentId)}”` : t(`character.${opponentId}.boat`)}</span>
          </span>
        </button>
        <div class="opp-purse" bind:this={theirPurseEl}><Purse amount={shownMoney(1)} start={startMoney(1)} showAmount={false} focus={18} label={name(opponentId)} /></div>
      </div>
      <button class="portrait-btn" onclick={() => (showCaptain = true)} aria-label={name(opponentId)}>
        <span class="oval portrait">{name(opponentId)[0]}</span>
      </button>
    </div>
    <div class="opp-cards">
      <!-- At the showdown their played cards flip in place, one per Next; any they kept back stay down, dimmed. -->
      {#each theirPlayed.filter((c) => !isJoker(c)) as card (card.id)}
        {#if faceUp.has(card.id)}<CardView {card} fresh={revealStep?.card.id === card.id} />{:else}<CardView faceDown />{/if}
      {/each}
      {#each them.hand.filter((c) => dealt.has(c.id)) as card (card.id)}<CardView faceDown deal="top" faded={shownDown} />{/each}
      {#if theirSnags.length}
        <!-- However many snags they carry, the fan never grows past its width. Played snags flip like their cards. -->
        <div class="snag-fan" style="--n: {theirSnags.length}">
          {#each theirSnags as card (card.id)}
            {#if !playedIds.has(card.id) || faceUp.has(card.id)}<CardView {card} fresh={revealStep?.card.id === card.id} />{:else}<CardView faceDown />{/if}
          {/each}
          {#if theirSnags.length > 2}<span class="snag-count">×{theirSnags.length}</span>{/if}
        </div>
      {/if}
      <DiscardChips cards={them.discarded} flop={them.flopDiscards} title={t('draw.theirDiscards', { name: name(opponentId) })} />
    </div>
  </section>

  <!-- The river: the border between them and you. -->
  <section class="river">
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
        {t(`street.${streetName}`)}
        <!-- Every street has a second line (blank at the showdown), so nothing moves. -->
        <span class="street-sub">{streetName === 'showdown' ? '' : t(`street.sub.${streetName}`)}</span>
      </span>
      <button class="ghost icon" onclick={() => (showHelp = true)} aria-label={t('willie.helpTitle')}>?</button>
    </div>
    {/if}
    <!-- The pot: their coins above the middle, yours below, filling in from the left. -->
    {#if round.potMode}<div class="pot-band" bind:this={potEl}><Pot bets={potBets} paid={!!payout} /></div>{/if}
    <div class="community">
      {#each Array.from({ length: boardSize }) as _, i}
        {@const card = round.community[i] && dealt.has(round.community[i].id) ? round.community[i] : null}
        <CardView {card} deal="left" markAbove={!!card && theirBoard.has(card.id)} markBelow={!!card && usedIds.has(card.id)} />
      {/each}
    </div>
    {#if stakes.length}<p class="stakes">{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}</p>{/if}
  </section>

  <!-- Your side of the table, from the pot outwards: your money, your cards, your decisions. Fixed rows, so nothing moves as the round goes on. -->
  <section class="captain">
    <!-- Your money nearest the pot, no figure: never count your money at the table. -->
    <div class="my-purse" bind:this={myPurseEl}>
      <Purse amount={shownMoney(0)} start={startMoney(0)} showAmount={false} focus={18} label={t('character.captain.you')} />
      <!-- On the River your coins are idle, so the hand you're making is called over them, with the count of snags riding along and their forfeit. Fixed size: it never shifts as you tap. -->
      {#if shownDown && myCall}
        <!-- At the showdown: the hand you played, opposite theirs. -->
        <div class="callout">
          <span class="call" class:long={myCall.call.length > 30}>{myCall.call}</span>
          <span class="lingo">{myCall.lingo ?? ''}</span>
          <span class="note">
            {#if myPlayedSnags === 1}{t('draw.ridingOne', { cost: dollars(config.jokerForfeit ?? 0) })}{:else if myPlayedSnags}{t('draw.riding', { n: t(`number.${myPlayedSnags}`), cost: dollars(myPlayedSnags * (config.jokerForfeit ?? 0)) })}{/if}
          </span>
        </div>
      {:else if playing && composing && callout}
        <div class="callout" aria-live="polite">
          <span class="call" class:long={callout.call.length > 30}>{callout.call}</span>
          <span class="lingo">{callout.lingo ?? ''}</span>
          <span class="note">
            {#if tappedJokers.length === 1}{t('draw.ridingOne', { cost: dollars(config.jokerForfeit ?? 0) })}{:else if tappedJokers.length}{t('draw.riding', { n: t(`number.${tappedJokers.length}`), cost: dollars(tappedJokers.length * (config.jokerForfeit ?? 0)) })}{:else if !tapped.length}{t('draw.boardOnly')}{/if}
          </span>
        </div>
      {/if}
    </div>
    <div class="hand-row">
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
      {#if mySnags.length}
        <!-- However many snags you carry, the fan never grows past its width. -->
        <div class="snag-fan mine" class:live={composing} style="--n: {mySnags.length}">
          {#each mySnags as card (card.id)}
            <CardView {card} selected={tapped.includes(card.id)} used={shownDown && myPlayedSnagIds.has(card.id)} onclick={playing && composing ? () => tap(card) : undefined} />
          {/each}
          {#if composing && tappedJokers.length}
            <button class="ghost small-btn unsnag" onclick={untapJoker} aria-label={t('draw.untapSnag')}>−</button>
          {/if}
          {#if mySnags.length > 2}<span class="snag-count">×{mySnags.length}</span>{/if}
        </div>
      {/if}
      <DiscardChips tall cards={me.discarded} flop={me.flopDiscards} title={t('draw.yourDiscards')} />
    </div>


    <div class="actions" class:idle={!playing && !revealing}>
      {#if revealing}
        <button class="ghost" onclick={revealSkip}>{t('show.skip')}</button>
        <button onclick={revealNext}>{verdictShown ? `${verdictLabel} ▸` : t('show.next')}</button>
      {:else}
        <button class="ghost" onclick={fold} disabled={!playing || dealing || !showFold || !canFold(round, 0)}>{foldLabel}</button>
        <button onclick={go} disabled={!playing || dealing}>{buttonLabel}</button>
      {/if}
    </div>

  </section>
</div>

{#if showHelp}
  <WillieSays title={t('willie.helpTitle')} onclose={() => (showHelp = false)}>
    {#each t('title.howToBody').split('\n\n') as para}<p>{para}</p>{/each}
    <label class="fast"><input type="checkbox" checked={fastDeal} onchange={(e) => setFast(e.currentTarget.checked)} /> {t('draw.fastDeal')}</label>
    <fieldset class="faces">
      <legend>{t('cards.face')}</legend>
      <label class="fast"><input type="radio" name="card-face" checked={cardPrefs.face === 'value'} onchange={() => setCardFace('value')} /> {t('cards.faceValue')}</label>
      <label class="fast"><input type="radio" name="card-face" checked={cardPrefs.face === 'pair'} onchange={() => setCardFace('pair')} /> {t('cards.facePair')}</label>
    </fieldset>
    <p class="tip">{t('cards.zoomTip')}</p>
    <button class="ghost menu-btn" onclick={() => ((showHelp = false), onmenu())}>{t('table.menu')}</button>
  </WillieSays>
{/if}

{#if fishedNews}
  <WillieSays onclose={() => (fishedNews = null)}>
    <p>{fishedNews}</p>
  </WillieSays>
{/if}

{#if showCaptain}
  <CaptainCard captain={opponent} players={game.players} {odds} onclose={() => (showCaptain = false)} />
{/if}

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
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .opp-head {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
  }
  .opp-left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .opp-left .name-btn {
    align-self: flex-end;
  }
  .portrait-btn {
    flex: none;
    display: flex;
    padding: 0;
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
  }
  /* From the top of the name to the bottom of their coins. */
  .portrait {
    width: 92px;
    height: 100%;
    min-height: 110px;
    font-size: 2.8rem;
  }
  .pot-band {
    margin: 0.2rem 0 0.5rem;
  }
  .opp-cards {
    --hgap: 0.75rem;
    display: flex;
    align-items: flex-end;
    gap: var(--hgap);
  }
  .opp-cards .snag-fan {
    margin-left: 0;
  }
  .snag-fan {
    --fan: 120px;
    display: flex;
    margin-left: 0.6rem;
    max-width: var(--fan);
  }
  .snag-fan :global(.card + .card) {
    margin-left: min(3px, calc((var(--fan) - var(--cw) * var(--n)) / (var(--n) - 1)));
  }
  .snag-fan {
    --cw: 76px;
  }
  .snag-fan {
    position: relative;
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
   * The play screen fills the height (up to a big phone's): the opponent at the
   * top, you at the bottom, the river in between. The gaps take up any slack,
   * so neither end moves when something in the middle changes.
   */
  .table.solo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.75rem;
    min-height: 100dvh;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  /* Card width and the gap between cards: the buttons below line up with them. */
  .captain {
    --cw: 76px;
    --hgap: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  /* No frames for the players: the river between them is separation enough. */
  .opponent,
  .captain {
    border-color: transparent;
  }
  /* Tall enough for a lifted card, so selecting one doesn't push anything. */
  .hand-row {
    display: flex;
    align-items: flex-end;
    gap: var(--hgap);
    height: 122px;
  }
  .my-purse {
    position: relative;
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
  .callout.theirs {
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
  /* Two fixed halves: changing labels and prices never move them. */
  /* Fold as wide as your three cards; the main button under your snags and discards. */
  .actions {
    display: grid;
    grid-template-columns: calc(3 * var(--cw) + 2 * var(--hgap)) 1fr;
    gap: var(--hgap);
  }
  /* The main button's outline goes inside its edge, so both buttons stand the same size. */
  .actions button:not(.ghost) {
    outline-offset: -2px;
  }
  .actions button {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .actions.idle {
    visibility: hidden;
  }
  /* Short phones: the gaps and paddings give way first. */
  @media (max-height: 740px) {
    .table.solo {
      gap: 0.4rem;
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }
    .portrait {
      min-height: 100px;
    }
    .table.solo section {
      padding-top: 0.35rem;
      padding-bottom: 0.35rem;
    }
    .captain {
      gap: 0.2rem;
    }
    .opponent {
      gap: 0.25rem;
    }
  }
  @media (max-width: 600px) {
    .snag-fan {
      --cw: 54px;
      --fan: 80px;
    }
    .opp-cards {
      --hgap: 0.5rem;
    }
    .pot-band {
    margin: 0.2rem 0 0.5rem;
  }
  .opp-cards {
      height: 54px;
    }
    .captain {
      --cw: 54px;
      --hgap: 0.5rem;
    }
    .hand-row {
      height: 92px;
    }
    .actions button {
      font-size: 1rem;
      padding-left: 0.5em;
      padding-right: 0.5em;
    }
  }
  .snag-fan.mine {
    --cw: 76px;
    --fan: 220px;
    margin-left: 0;
  }
  @media (max-width: 600px) {
    .snag-fan.mine {
      --cw: 54px;
      --fan: 80px;
    }
  }
  .snag-fan.live :global(.card:hover) {
    z-index: 3;
  }
  /* Takes one tapped snag back out; sits on the fan so it costs no room. */
  .unsnag {
    position: absolute;
    left: -6px;
    bottom: -6px;
    z-index: 4;
    padding: 0 0.45em;
    border-radius: 50%;
  }
  .faces {
    border: none;
    padding: 0;
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
  }
  .faces legend {
    padding: 0;
    color: var(--grey);
  }
  .faces .fast {
    margin-top: 0.3rem;
  }
  .menu-btn {
    margin-top: 0.5rem;
  }
  .tip {
    font-size: 0.85rem;
    color: var(--grey);
  }
  .fast {
    font-size: 0.85rem;
    display: flex;
    gap: 0.4rem;
    align-items: center;
    cursor: pointer;
    margin-top: 0.75rem;
  }
  .small-btn {
    font-size: 0.85rem;
    padding: 0.2em 0.6em;
  }
</style>
