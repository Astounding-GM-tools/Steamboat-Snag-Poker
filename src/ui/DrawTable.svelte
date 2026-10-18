<script lang="ts">
  import {
    CATEGORIES,
    STREETS,
    bestHand,
    isComposing,
    isJoker,
    opponentOdds,
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
  import SidePanel from './SidePanel.svelte';
  import { cardLabel, name } from './format';
  import { describeHand } from './handNames';

  interface Props {
    game: GameState;
    peek: boolean;
    onaction: (a: Action) => void;
    onmenu: () => void;
  }
  let { game, peek, onaction, onmenu }: Props = $props();

  /** Tapped card ids: cards to discard on a street, cards to play when composing. */
  let tapped = $state<string[]>([]);
  let showOdds = $state(false);

  const round = $derived(game.round!);
  const config = $derived(game.config);
  const me = $derived(round.seats[0]);
  const them = $derived(round.seats[1]);
  const opponentId = $derived(game.opponentId!);
  const opponent = $derived(player(game, opponentId));
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

  const theirJokerCount = $derived(them.jokers.length + them.slots.filter(isJoker).length);
  const stakes = $derived([...(round.communityJoker ? [round.communityJoker] : []), ...round.community.filter(isJoker)]);
  const lastMove = $derived(round.history.at(-1)?.actions[1]);
  const streetName = $derived(composing ? 'compose' : round.street <= 2 ? STREETS[round.street] : 'showdown');

  const odds = $derived.by((): OpponentOdds | null => {
    if (!showOdds) return null;
    // Seeded from the visible situation so the numbers stay put while you look.
    const seed = round.community.length * 7919 + round.discards.length * 104729 + round.month;
    return opponentOdds(viewFor(round, 0), config, new Rng(seed), 600);
  });

  // A new street or a new month clears the selection.
  let lastKey = '';
  $effect.pre(() => {
    const key = `${game.month}:${round.street}`;
    if (key !== lastKey) {
      lastKey = key;
      tapped = [];
    }
  });

  function tap(card: Card) {
    if (!playing) return;
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
    if (!playing) return;
    const action: Action = composing
      ? { type: 'compose', cardIds: tappedCards.map((c) => c.id), jokers: tappedJokers.length }
      : { type: 'draw', cardIds: tappedCards.map((c) => c.id) };
    tapped = [];
    onaction(action);
  }

  const buttonLabel = $derived(
    tapped.length === 0 ? t('draw.standPat') : composing ? t('draw.play') : t('draw.discard', { n: tapped.length }),
  );

  function describeMove(a: Action | undefined): string {
    if (!a || a.type !== 'draw') return '';
    const who = name(opponentId);
    return a.cardIds.length === 0 ? t('draw.log.pat', { name: who }) : t('draw.log.discard', { name: who, n: a.cardIds.length });
  }

  const pct = (x: number) => `${Math.round(x * 100)}%`;
</script>

<div class="table">
  <!-- Opponent -->
  <section class="opponent">
    <div class="portrait">
      <div class="oval">{name(opponentId)[0]}</div>
      <div>
        <h2>{name(opponentId)}</h2>
        <p class="blurb">{t(`character.${opponentId}.blurb`)}</p>
        <p class="stats">
          {t('table.popularity')}: <b>{opponent.popularity}%</b> · {t(theirJokerCount === 1 ? 'table.jokerCount.one' : 'table.jokerCount', { n: theirJokerCount })}
        </p>
      </div>
      <button class="ghost hint-btn" class:on={showOdds} onclick={() => (showOdds = !showOdds)}>{t('draw.hint')}</button>
    </div>
    <div class="row">
      <div class="hand-backs">
        {#each them.hand as card (card.id)}<CardView small faceDown={!peek} card={peek ? card : null} />{/each}
        {#each them.jokers as card (card.id)}<CardView small faceDown={!peek} card={peek ? card : null} />{/each}
        <span class="count">{t('table.cards', { n: them.hand.length + them.jokers.length })}</span>
      </div>
      {#if them.discarded.length}
        <div class="tossed">
          <span class="count">{t('draw.theyDiscarded')}</span>
          {#each them.discarded as card (card.id)}<CardView small {card} />{/each}
        </div>
      {/if}
    </div>
    {#if lastMove}<p class="log">{describeMove(lastMove)}</p>{/if}
    {#if odds}
      <div class="odds">
        <p class="odds-title">{t('draw.oddsTitle', { name: name(opponentId) })}</p>
        {#each [...CATEGORIES].reverse() as cat}
          {#if odds.categories[cat] >= 0.005}
            <div class="bar">
              <span>{t(`hand.${cat}`)}</span>
              <span class="track"><span class="fill" style="width: {odds.categories[cat] * 100}%"></span></span>
              <span class="num">{pct(odds.categories[cat])}</span>
            </div>
          {/if}
        {/each}
        <p class="odds-foot">{t('draw.oddsBeats', { name: name(opponentId), pct: pct(odds.beatsYou) })}</p>
      </div>
    {/if}
  </section>

  <!-- The river -->
  <section class="river">
    <div class="street">{t(`street.${streetName}`)}</div>
    <div class="river-row">
      <div class="community">
        {#each Array.from({ length: boardSize }) as _, i}
          {@const card = round.community[i] ?? null}
          <CardView {card} used={!!card && usedIds.has(card.id)} placeholder={t(`street.${STREETS[i < 3 ? 0 : i - 2] ?? 'river'}`)} />
        {/each}
      </div>
      <div class="discard pile">
        <span class="discard-label">{t('table.discard')}</span>
        <CardView card={round.discards.at(-1) ?? null} placeholder="✕" />
      </div>
    </div>
    <p class="stakes">
      {#if stakes.length}{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}{:else}{t('table.noStakes')}{/if}
    </p>
  </section>

  <!-- The Captain -->
  <section class="captain">
    <p class="prompt">{composing ? t('draw.promptCompose') : t('draw.promptDiscard')}</p>
    <div class="row hand-row">
      {#each me.hand as card (card.id)}
        <CardView
          {card}
          selected={composing && tapped.includes(card.id)}
          toss={!composing && tapped.includes(card.id)}
          used={composing && usedIds.has(card.id)}
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
          <button class="ghost small-btn" onclick={untapJoker}>− 🃏</button>
        {/if}
      {/if}
    </div>

    {#if playing}
      <div class="row controls">
        <span class="hint">
          {#if composing}
            {#if tapped.length}
              {t('table.yourBest', { hand: describeHand(preview!) })}
              {#if tappedJokers.length}<b> · {t('draw.risking', { n: tappedJokers.length })}</b>{/if}
            {:else}{t('draw.boardOnly')}{/if}
          {:else if round.street === 1}<b>{t('draw.lastStreet')}</b>{:else}{t('draw.street', { n: round.street + 1 })}{/if}
        </span>
        <button onclick={go}>{buttonLabel}</button>
      </div>
    {/if}
  </section>

  <SidePanel {game} {opponentId} {onmenu} />
</div>

<style>
  .hint-btn {
    margin-left: auto;
    align-self: flex-start;
    font-size: 0.85rem;
  }
  .hint-btn.on {
    background: var(--paper);
    color: var(--ink);
  }
  .tossed {
    display: flex;
    gap: 3px;
    align-items: center;
  }
  .odds {
    margin-top: 0.6rem;
    padding: 0.5rem 0.75rem;
    border: 1px dashed var(--grey);
    font-size: 0.8rem;
  }
  .odds-title,
  .odds-foot {
    margin: 0 0 0.3rem;
    color: var(--grey);
  }
  .odds-foot {
    margin: 0.3rem 0 0;
    color: var(--paper);
  }
  .bar {
    display: grid;
    grid-template-columns: 9rem 1fr 3rem;
    gap: 0.5rem;
    align-items: center;
  }
  .track {
    height: 8px;
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
  .pile {
    cursor: default;
  }
  .prompt {
    margin: 0 0 0.5rem;
    color: var(--grey);
  }
  .hand-row {
    min-height: 120px;
    align-items: flex-end;
  }
  .joker-fan {
    display: flex;
    margin-left: 0.75rem;
    padding-left: 0.75rem;
    border-left: 2px dashed var(--dim);
  }
  .joker-fan :global(.card + .card) {
    margin-left: -40px;
  }
  .joker-fan.live :global(.card:hover) {
    z-index: 3;
  }
  .small-btn {
    font-size: 0.85rem;
    padding: 0.2em 0.6em;
  }
</style>
