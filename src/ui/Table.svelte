<script lang="ts">
  import {
    HUMAN_ID,
    STREETS,
    evaluate,
    isJoker,
    isLegal,
    player,
    type Action,
    type Card,
    type GameState,
    type SlotIndex,
  } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import { cardLabel, name } from './format';

  interface Props {
    game: GameState;
    peek: boolean;
    onaction: (a: Action) => void;
    onmenu: () => void;
  }
  let { game, peek, onaction, onmenu }: Props = $props();

  let selectedId = $state<string | null>(null);
  let staged = $state<Action | null>(null);

  const round = $derived(game.round!);
  const me = $derived(round.seats[0]);
  const them = $derived(round.seats[1]);
  const opponentId = $derived(game.opponentId!);
  const playing = $derived(game.phase === 'duel');
  const captain = $derived(player(game, HUMAN_ID));
  const opponent = $derived(player(game, opponentId));

  const findCard = (id: string): Card | undefined => [...me.hand, ...me.jokers].find((c) => c.id === id);

  const stagedCard = $derived(staged && staged.type !== 'pass' ? findCard(staged.cardId) : undefined);
  const previewSlots = $derived.by(() => {
    const slots = me.slots.slice() as (Card | null)[];
    if (staged?.type === 'place' && stagedCard) slots[staged.slot] = stagedCard;
    return slots;
  });
  const myHand = $derived(evaluate([...previewSlots, ...round.community]));
  const myJokerCount = $derived(me.jokers.length + me.slots.filter(isJoker).length);
  const theirJokerCount = $derived(them.jokers.length + them.slots.filter(isJoker).length);
  const stakes = $derived([
    ...(round.communityJoker ? [round.communityJoker] : []),
    ...round.community.filter(isJoker),
    ...them.slots.filter(isJoker),
  ]);
  const lastMoves = $derived(round.history.at(-1));
  const streetName = $derived(round.street <= 2 ? STREETS[round.street] : 'showdown');

  function select(card: Card) {
    if (!playing) return;
    selectedId = selectedId === card.id ? null : card.id;
  }

  function stage(action: Action) {
    if (!playing || !isLegal(round, 0, action)) return;
    staged = action;
    selectedId = null;
  }

  function toSlot(slot: SlotIndex, id = selectedId) {
    if (id) stage({ type: 'place', cardId: id, slot });
  }

  function toDiscard(id = selectedId) {
    if (id && !isJoker(findCard(id))) stage({ type: 'discard', cardId: id });
  }

  function send(action: Action) {
    staged = null;
    selectedId = null;
    onaction($state.snapshot(action) as Action);
  }

  function commit() {
    if (staged) send(staged);
  }

  const dragStart = (card: Card) => (e: DragEvent) => {
    e.dataTransfer?.setData('text/plain', card.id);
    selectedId = card.id;
  };
  const dropId = (e: DragEvent) => {
    e.preventDefault();
    return e.dataTransfer?.getData('text/plain') || null;
  };
  const allowDrop = (e: DragEvent) => e.preventDefault();

  function describe(action: Action, who: string, slots: (Card | null)[]): string {
    if (action.type === 'pass') return t('log.pass', { name: who });
    if (action.type === 'discard') return t('log.discard', { name: who });
    const card = slots[action.slot];
    return t('log.place', { name: who, card: card ? cardLabel(card) : '?', n: action.slot + 1 });
  }

  const meterLevel = (p: number) => (p < 20 ? 'danger' : p < 35 ? 'warn' : '');
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
    </div>
    <div class="row">
      <div class="hand-backs">
        {#each them.hand as card (card.id)}
          <CardView small faceDown={!peek} card={peek ? card : null} />
        {/each}
        {#each them.jokers as card (card.id)}
          <CardView small faceDown={!peek} card={peek ? card : null} />
        {/each}
        <span class="count">{t('table.cards', { n: them.hand.length + them.jokers.length })}</span>
      </div>
      <div class="slots">
        {#each them.slots as card, i}
          <CardView {card} fresh={lastMoves?.actions[1].type === 'place' && lastMoves.actions[1].slot === i} placeholder={t('table.slot', { n: i + 1 })} />
        {/each}
      </div>
    </div>
    {#if lastMoves}
      <p class="log">{describe(lastMoves.actions[1], name(opponentId), them.slots)}</p>
    {/if}
  </section>

  <!-- The river -->
  <section class="river">
    <div class="street">{t(`street.${streetName}`)}</div>
    <div class="community">
      {#each [0, 1, 2] as i}
        <CardView card={round.community[i] ?? null} fresh={i === round.community.length - 1} placeholder={t(`street.${STREETS[i]}`)} />
      {/each}
      {#if game.config.jokerMode === 'slot'}
        <div class="joker-slot">
          <CardView card={round.communityJoker} placeholder="🃏?" />
        </div>
      {/if}
    </div>
    <p class="stakes">
      {#if stakes.length}{t('table.stakes')}: {stakes.map(cardLabel).join(', ')}{:else}{t('table.noStakes')}{/if}
    </p>
  </section>

  <!-- The Captain -->
  <section class="captain">
    <div class="row targets">
      {#each previewSlots as card, i}
        <div
          class="target"
          class:armed={!!selectedId}
          role="button"
          tabindex="0"
          onclick={() => toSlot(i as SlotIndex)}
          onkeydown={(e) => e.key === 'Enter' && toSlot(i as SlotIndex)}
          ondragover={allowDrop}
          ondrop={(e) => toSlot(i as SlotIndex, dropId(e))}
        >
          <CardView {card} ghost={staged?.type === 'place' && staged.slot === i} placeholder={t('table.slot', { n: i + 1 })} />
        </div>
      {/each}
      <div
        class="target discard"
        class:armed={!!selectedId && !isJoker(findCard(selectedId))}
        role="button"
        tabindex="0"
        onclick={() => toDiscard()}
        onkeydown={(e) => e.key === 'Enter' && toDiscard()}
        ondragover={allowDrop}
        ondrop={(e) => toDiscard(dropId(e))}
      >
        {#if staged?.type === 'discard' && stagedCard}
          <CardView card={stagedCard} ghost />
        {:else}
          <CardView card={round.discards.at(-1) ?? null} small={false} placeholder={t('table.discard')} />
        {/if}
      </div>
      <div class="best">{t('table.yourBest', { hand: t(`hand.${myHand.category}`) })}</div>
    </div>

    <div class="row hand">
      {#each me.hand as card (card.id)}
        {#if !(staged && staged.type !== 'pass' && staged.cardId === card.id)}
          <CardView {card} selected={selectedId === card.id} onclick={() => select(card)} ondragstart={playing ? dragStart(card) : undefined} />
        {/if}
      {/each}
      {#if me.jokers.length}
        <div class="jokers">
          {#each me.jokers as card (card.id)}
            {#if !(staged && staged.type !== 'pass' && staged.cardId === card.id)}
              <CardView small {card} selected={selectedId === card.id} onclick={() => select(card)} ondragstart={playing ? dragStart(card) : undefined} />
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    {#if playing}
      <div class="row controls">
        {#if staged}
          <span class="staged">
            {#if staged.type === 'place' && stagedCard}{t('table.staged.place', { card: cardLabel(stagedCard), n: staged.slot + 1 })}
            {:else if staged.type === 'discard' && stagedCard}{t('table.staged.discard', { card: cardLabel(stagedCard) })}
            {:else}{t('table.staged.pass')}{/if}
          </span>
          <button onclick={commit}>{t('table.reveal')}</button>
          <button class="ghost" onclick={() => (staged = null)}>{t('table.cancel')}</button>
        {:else}
          <span class="hint">{t('table.hint')}</span>
          <button class="ghost" onclick={() => send({ type: 'pass' })}>{t('table.pass')}</button>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Side panel -->
  <aside class="side">
    <div class="month">{t('table.month', { month: game.month, total: game.config.months })}</div>
    <div class="meter {meterLevel(captain.popularity)}">
      <div class="fill" style="height: {captain.popularity}%"></div>
      <span class="pct">{captain.popularity}%</span>
    </div>
    <div class="label">{t('table.popularity')}</div>
    <div class="label">🃏 × {myJokerCount}</div>

    <h3>{t('table.league')}</h3>
    <ul class="league">
      {#each game.players as p (p.id)}
        <li class:out={p.status !== 'active'} class:me={p.id === HUMAN_ID} class:foe={p.id === opponentId}>
          <span>{p.id === opponentId ? '► ' : ''}{p.id === HUMAN_ID ? t('character.captain.you') : name(p.id)}</span>
          <span>
            {#if p.status === 'eliminated'}{t('table.out')}
            {:else if p.status === 'waiting'}{t('table.waiting')}
            {:else}{p.popularity}% · 🃏{p.jokers.length}{/if}
          </span>
        </li>
      {/each}
    </ul>
    <button class="ghost menu" onclick={onmenu}>{t('table.menu')}</button>
  </aside>
</div>

<style>
  .table {
    display: grid;
    grid-template-columns: 1fr 210px;
    grid-template-areas: 'opp side' 'river side' 'me side';
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    max-width: 1100px;
    margin: 0 auto;
    min-height: 100vh;
  }
  section {
    border: 2px solid var(--dim);
    padding: 0.75rem 1rem;
  }
  .opponent {
    grid-area: opp;
  }
  .river {
    grid-area: river;
    text-align: center;
    border-style: double;
    border-width: 4px;
    border-color: var(--grey);
    background: repeating-linear-gradient(0deg, transparent 0 18px, rgba(255, 255, 255, 0.03) 18px 20px);
  }
  .captain {
    grid-area: me;
  }
  .side {
    grid-area: side;
    border-left: 2px solid var(--dim);
    padding-left: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }
  .row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .portrait {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .oval {
    width: 64px;
    height: 80px;
    border-radius: 50%;
    border: 3px double var(--paper);
    display: grid;
    place-items: center;
    font-family: var(--title-font);
    font-size: 2.2rem;
    background: radial-gradient(circle, #444, #111);
    flex: none;
  }
  h2,
  h3 {
    font-family: var(--title-font);
    font-weight: normal;
    margin: 0;
  }
  .blurb,
  .stats,
  .log {
    margin: 0.15rem 0;
    color: var(--grey);
    font-size: 0.9rem;
  }
  .stats b {
    color: var(--paper);
  }
  .log {
    color: var(--paper);
    font-style: italic;
    margin-top: 0.5rem;
  }
  .hand-backs {
    display: flex;
    gap: 3px;
    align-items: center;
    flex-wrap: wrap;
    flex: 1;
  }
  .count {
    margin-left: 0.5rem;
    color: var(--grey);
    font-size: 0.85rem;
  }
  .slots {
    display: flex;
    gap: 0.5rem;
  }
  .street {
    font-family: var(--title-font);
    font-size: 1.6rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }
  .community {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    align-items: center;
  }
  .joker-slot {
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 2px dashed var(--grey);
  }
  .stakes {
    color: var(--grey);
    margin: 0.5rem 0 0;
  }
  .target {
    padding: 4px;
    border-radius: 8px;
    cursor: pointer;
  }
  .target.armed {
    outline: 2px dashed var(--paper);
    animation: pulse 1s infinite;
  }
  @keyframes pulse {
    50% { outline-color: transparent; }
  }
  .discard {
    margin-left: 1rem;
  }
  .best {
    margin-left: auto;
    font-family: var(--title-font);
    font-size: 1.1rem;
  }
  .hand {
    margin-top: 0.75rem;
    min-height: 110px;
  }
  .jokers {
    display: flex;
    gap: 4px;
    margin-left: auto;
    padding-left: 0.75rem;
    border-left: 2px dashed var(--dim);
  }
  .controls {
    margin-top: 0.75rem;
    justify-content: flex-end;
  }
  .hint,
  .staged {
    margin-right: auto;
    color: var(--grey);
  }
  .staged {
    color: var(--paper);
  }
  .month {
    font-family: var(--title-font);
    text-align: center;
  }
  .meter {
    width: 46px;
    height: 220px;
    border: 3px solid var(--paper);
    position: relative;
    display: flex;
    align-items: flex-end;
    background: #000;
  }
  .meter .fill {
    width: 100%;
    background: repeating-linear-gradient(0deg, var(--paper) 0 6px, #ccc 6px 8px);
    transition: height 0.6s ease-out;
  }
  .meter .pct {
    position: absolute;
    inset: auto 0 -1.6rem;
    text-align: center;
    font-family: var(--title-font);
  }
  .meter.warn {
    animation: shake 0.5s infinite;
  }
  .meter.danger {
    animation: shake 0.18s infinite;
  }
  @keyframes shake {
    25% { transform: translate(-2px, 1px) rotate(-1deg); }
    75% { transform: translate(2px, -1px) rotate(1deg); }
  }
  .label {
    color: var(--grey);
    margin-top: 1.4rem;
  }
  .label + .label {
    margin-top: 0;
  }
  .side h3 {
    margin-top: 1rem;
  }
  .league {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
    font-size: 0.85rem;
  }
  .league li {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    border-bottom: 1px dotted var(--dim);
  }
  .league .out {
    color: var(--dim);
    text-decoration: line-through;
  }
  .league .me,
  .league .foe {
    font-weight: bold;
  }
  .menu {
    margin-top: auto;
    font-size: 0.9rem;
  }
  @media (max-width: 760px) {
    .table {
      grid-template-columns: 1fr;
      grid-template-areas: 'side' 'opp' 'river' 'me';
      padding: 0.5rem;
    }
    .side {
      border-left: none;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }
    .meter {
      height: 60px;
    }
  }
</style>
