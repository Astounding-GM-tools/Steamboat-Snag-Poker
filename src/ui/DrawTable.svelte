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
  import Purse from './Purse.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import WillieSays from './WillieSays.svelte';
  import { cardLabel, dollars, jokerList, name, nickname } from './format';
  import { describeHand } from './handNames';

  interface Props {
    game: GameState;
    onaction: (a: Action) => void;
    /** False while the showdown is still being revealed: the pot hasn't been paid out yet. */
    settled?: boolean;
    /** Back to the main menu (the game is saved after every move). */
    onmenu: () => void;
  }
  let { game, onaction, settled = true, onmenu }: Props = $props();

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
    <!-- Their purse spreads behind the head: a low pile sits on the right, a rich one grows in behind the name. -->
    <div class="opp-head">
      <div class="opp-purse"><Purse amount={shownMoney(1)} showAmount={false} focus={84} label={name(opponentId)} /></div>
      <button class="name-btn" onclick={() => (showCaptain = true)}>
        <span class="oval portrait">{name(opponentId)[0]}</span>
        <span class="who">
          <span class="name">{name(opponentId)}</span>
          <span class="title">{nickname(opponentId) ? `“${nickname(opponentId)}”` : t(`character.${opponentId}.boat`)}</span>
        </span>
      </button>
    </div>
    <div class="opp-cards">
      {#each them.hand.filter((c) => dealt.has(c.id)) as card (card.id)}<CardView small faceDown deal="top" />{/each}
      {#if them.jokers.length}
        <!-- However many snags they carry, the fan never grows past its width. -->
        <div class="snag-fan" style="--n: {them.jokers.length}">
          {#each them.jokers as card (card.id)}<CardView small {card} />{/each}
        </div>
        {#if them.jokers.length > 2}<span class="snag-count">×{them.jokers.length}</span>{/if}
      {/if}
    </div>
    <DiscardChips cards={them.discarded} label={t('draw.theyDiscarded')} />
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

  <!-- Your side of the table: fixed rows, so nothing here moves as the round goes on. -->
  <section class="captain">
    <DiscardChips cards={me.discarded} label={t('draw.discarded')} />

    <div class="hand-row">
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
    </div>

    <p class="hint">
      {#if playing && composing && tapped.length}
        {describeHand(preview!)}{#if tappedJokers.length}<b> · {t('draw.risking', { n: tappedJokers.length, cost: dollars(tappedJokers.length * (config.jokerForfeit ?? 0)) })}</b>{/if}
      {/if}
    </p>

    <div class="actions" class:idle={!playing}>
      <button class="ghost" onclick={fold} disabled={!playing || dealing || !showFold || !canFold(round, 0)}>{foldLabel}</button>
      <button onclick={go} disabled={!playing || dealing}>{buttonLabel}</button>
    </div>

    <Purse amount={shownMoney(0)} label={t('character.captain.you')} />
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
  .opponent {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .opp-head {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 76px;
  }
  .opp-purse {
    position: absolute;
    inset: 0;
  }
  .portrait {
    width: 58px;
    height: 72px;
    font-size: 1.9rem;
  }
  .opp-cards {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 56px;
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
    --cw: 52px;
  }
  .snag-count {
    font-family: var(--title-font);
    font-size: 0.9rem;
    color: var(--grey);
    margin-left: 4px;
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
    justify-content: space-between;
    height: 100dvh;
    max-height: 940px;
    min-height: 0;
  }
  .captain {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  /* Tall enough for a lifted card, so selecting one doesn't push anything. */
  .hand-row {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    height: 122px;
  }
  .hint {
    height: 1.2rem;
    margin: 0;
    font-size: 0.85rem;
    color: var(--grey);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hint b {
    color: var(--paper);
  }
  /* Two fixed halves: changing labels and prices never move them. */
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
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
      gap: 0.3rem;
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
    .opp-head {
      min-height: 66px;
    }
    .portrait {
      width: 52px;
      height: 64px;
    }
  }
  @media (max-width: 600px) {
    .snag-fan {
      --cw: 38px;
      --fan: 100px;
    }
    .opp-cards {
      height: 54px;
    }
    .hand-row {
      height: 92px;
      gap: 0.5rem;
    }
    .actions button {
      font-size: 1rem;
      padding-left: 0.5em;
      padding-right: 0.5em;
    }
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
