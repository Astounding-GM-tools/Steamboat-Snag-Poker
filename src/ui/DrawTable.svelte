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
    opponentOdds,
    HUMAN_ID,
    player,
    viewFor,
    Rng,
    type Action,
    type Card,
    type GameState,
    type OpponentOdds,
  } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import CaptainCard from './CaptainCard.svelte';
  import { cardPrefs, setCardFace } from './cards.svelte';
  import PotStack from './PotStack.svelte';
  import CoinPile from './CoinPile.svelte';
  import WillieSays from './WillieSays.svelte';
  import { cardLabel, dollars, jokerList, name, nickname } from './format';
  import { describeHand } from './handNames';

  interface Props {
    game: GameState;
    peek: boolean;
    onaction: (a: Action) => void;
    /** False while the showdown is still being revealed: the pot hasn't been paid out yet. */
    settled?: boolean;
    /** Back to the main menu (the game is saved after every move). */
    onmenu: () => void;
  }
  let { game, peek, onaction, settled = true, onmenu }: Props = $props();

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
  const usedIds = $derived(new Set(preview?.cards.map((c) => c.id) ?? []));

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
  const potBets = $derived<[number, number]>(round.potMode && (playing || !settled) ? bets : [0, 0]);
  const payout = $derived<'me' | 'them' | 'split' | null>(
    !playing && settled && round.result && round.potMode
      ? round.result.winner === 0 ? 'me' : round.result.winner === 1 ? 'them' : 'split'
      : null,
  );
  const cost = $derived(
    round.potMode && !composing && playing
      ? streetFee(config, round.month, round.street + 1) + discardCost(me.discarded.length, tappedCards.length)
      : 0,
  );
  const priced = (label: string) => (cost ? `${label} · ${dollars(cost)}` : label);
  const buttonLabel = $derived(
    tapped.length === 0
      ? cost
        ? priced(t('draw.call'))
        : t('draw.check')
      : composing
        ? t('draw.play')
        : priced(t('draw.discard', { n: tapped.length })),
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
    <div class="who">
      <button class="name-btn" onclick={() => (showCaptain = true)}>
        <span class="oval small-oval">{name(opponentId)[0]}</span>
        <span class="who">
          <span class="name">{name(opponentId)}</span>
          {#if nickname(opponentId)}<span class="aka">{t('captain.aka', { nick: nickname(opponentId)! })}</span>{/if}
        </span>
      </button>
      <div class="pile-right"><CoinPile amount={shownMoney(1)} align="right" label={name(opponentId)} /></div>
    </div>
    <div class="row">
      <div class="hand-backs">
        {#each them.hand.filter((c) => dealt.has(c.id)) as card (card.id)}<CardView small faceDown={!peek} card={peek ? card : null} deal="top" />{/each}
        {#each them.jokers as card (card.id)}<CardView small {card} />{/each}
      </div>
      {#if them.discarded.length}
        <div class="tossed" aria-label={t('draw.theyDiscarded')}>
          <span class="x">✕</span>
          {#each them.discarded as card (card.id)}<CardView small {card} />{/each}
        </div>
      {/if}
    </div>
  </section>

  <!-- The river: the border between them and you. -->
  <section class="river">
    <div class="river-head">
      <span class="crossing">{t('table.crossing', { month: game.month })}</span>
      <span class="street">{t(`street.${streetName}`)}</span>
      <button class="ghost icon" onclick={() => (showHelp = true)} aria-label={t('willie.helpTitle')}>?</button>
    </div>
    <div class="river-row">
      {#if round.potMode}<PotStack bets={potBets} {payout} />{/if}
      <div class="community">
        {#each Array.from({ length: boardSize }) as _, i}
          {@const card = round.community[i] && dealt.has(round.community[i].id) ? round.community[i] : null}
          <CardView {card} deal="left" markBelow={!!card && usedIds.has(card.id)} />
        {/each}
      </div>
    </div>
    {#if stakes.length}<p class="stakes">{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}</p>{/if}
  </section>

  <!-- Your side of the table. -->
  <section class="captain">
    <div class="row hand-row">
      {#each me.hand.filter((c) => dealt.has(c.id)) as card (card.id)}
        <CardView
          {card}
          selected={composing && tapped.includes(card.id)}
          toss={!composing && tapped.includes(card.id)}
          used={composing && usedIds.has(card.id)}
          deal="left"
          onclick={playing ? () => tap(card) : undefined}
        />
      {/each}
      {#if me.jokers.length}
        <div class="joker-fan" class:live={composing}>
          {#each me.jokers as card (card.id)}
            <CardView {card} selected={tapped.includes(card.id)} onclick={playing && composing ? () => tap(card) : undefined} />
          {/each}
        </div>
        {#if composing && tappedJokers.length}
          <button class="ghost small-btn" onclick={untapJoker}>− 🪵</button>
        {/if}
      {/if}
      {#if me.discarded.length}
        <div class="tossed mine" aria-label={t('table.discard')}>
          <span class="x">✕</span>
          {#each me.discarded as card (card.id)}<CardView small {card} />{/each}
        </div>
      {/if}
    </div>

    <div class="row controls">
      <CoinPile amount={shownMoney(0)} label={t('character.captain.you')} />
      {#if playing}
        <span class="hint">
          {#if composing && tapped.length}
            {describeHand(preview!)}{#if tappedJokers.length}<b> · {t('draw.risking', { n: tappedJokers.length, cost: dollars(tappedJokers.length * (config.jokerForfeit ?? 0)) })}</b>{/if}
          {/if}
        </span>
        {#if showFold}
          <button class="ghost" onclick={fold} disabled={dealing || !canFold(round, 0)}>{foldLabel}</button>
        {/if}
        <button onclick={go} disabled={dealing}>{buttonLabel}</button>
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
  .river-head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .crossing {
    font-family: var(--title-font);
    font-size: 0.85rem;
    color: var(--grey);
    text-align: left;
  }
  .river-head .street {
    margin: 0;
  }
  .icon {
    justify-self: end;
    padding: 0 0.55em;
    font-size: 1rem;
    border-radius: 50%;
  }
  .pile-right {
    margin-left: auto;
  }
  .tossed.mine {
    margin-left: auto;
  }
  .controls {
    align-items: flex-end;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
  }
  .name-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    outline: none;
    border: none;
    color: var(--paper);
    padding: 0;
  }
  .small-oval {
    width: 34px;
    height: 42px;
    font-size: 1.2rem;
  }
  .who {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.15;
  }
  .aka {
    font-size: 0.75rem;
    color: var(--grey);
    letter-spacing: 0.04em;
  }
  .name {
    font-family: var(--title-font);
    font-size: 1.3rem;
    text-decoration: underline dotted var(--grey);
    text-underline-offset: 4px;
  }
  .tossed {
    display: flex;
    gap: 3px;
    align-items: center;
    opacity: 0.8;
  }
  .x {
    color: var(--grey);
    margin-right: 2px;
  }
  .hand-row {
    min-height: 110px;
    align-items: flex-end;
  }
  .joker-fan {
    display: flex;
    margin-left: 0.5rem;
  }
  .joker-fan :global(.card + .card) {
    margin-left: -40px;
  }
  .joker-fan.live :global(.card:hover) {
    z-index: 3;
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
