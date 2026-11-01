<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Card, Category } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import Purse from './Purse.svelte';
  import SnagFan from './SnagFan.svelte';
  import { cardPrefs } from './cards.svelte';
  import { name, nickname, tagName } from './format';

  /**
   * An opponent at the table, however many there are: what it shows depends
   * on the room it gets, measured, not on the phase of the game. Across the
   * whole table (one opponent): the name and title over their coins, a tall
   * portrait beside, their cards full size on the table's grid. Half of it
   * (two): a small portrait by the name, smaller coins. A third (three): the
   * short name, tiny coins, small cards, and no portrait. Under the cards a
   * line says what they did, or the hand they showed.
   */
  export interface SeatCard {
    key: string;
    /** The card, when it's face up (or when it's thrown away: the transition reads it). */
    card?: Card | null;
    faceDown?: boolean;
    faded?: boolean;
    fresh?: boolean;
    deal?: 'top' | 'flip' | null;
    /** Held in the hand: it can leave on its own when thrown away. */
    held?: boolean;
  }
  interface PurseShown {
    amount: number;
    start: number;
    keep?: number;
    paid?: number;
    won?: number;
  }
  interface Props {
    /** The captain (their character id). */
    id: string;
    /** Their seat at this hand's table (the purse carries it, for the coins). */
    seat: number;
    cards: SeatCard[];
    thrown: (node: Element, card: Card | null | undefined) => { duration: number; css: (t: number) => string };
    snags: Card[];
    snagLook?: (card: Card) => { lifted?: boolean; fresh?: boolean };
    discarded: Card[];
    flopDiscards?: number;
    /** Their money on the table (none in the first lessons). */
    purse?: PurseShown | null;
    /** What they did, or the hand they showed (with its category, the name opens the hands). */
    line?: string | null;
    lineCategory?: Category | null;
    dealer?: boolean;
    /** Their move or their hand is being shown. */
    focus?: boolean;
    folded?: boolean;
    /** Out of money: still in their chair, watching. */
    broke?: boolean;
    /** Tapping their name or portrait (their details). */
    onselect?: () => void;
    /** Something over the portrait (a line's countdown). */
    portrait?: Snippet;
    /** Columns of the table's twelve it spans (twelve: the whole width). */
    span?: number;
    cardsEl?: HTMLElement;
    purseEl?: HTMLElement;
  }
  let {
    id,
    seat,
    cards,
    thrown,
    snags,
    snagLook,
    discarded,
    flopDiscards,
    purse = null,
    line = null,
    lineCategory = null,
    dealer = false,
    focus = false,
    folded = false,
    broke = false,
    onselect,
    portrait,
    span = 12,
    cardsEl = $bindable(),
    purseEl = $bindable(),
  }: Props = $props();

  /**
   * The room it gets, measured: the whole table (288px on the smallest phone),
   * about half (around 170px), or about a third (never more than 146px).
   * Until it's measured, the columns it spans say as much.
   */
  let width = $state(0);
  const room = $derived(width || span * 28);
  const mode = $derived(room >= 260 ? 'full' : room >= 150 ? 'medium' : 'compact');
  const title = $derived(nickname(id) ? `“${nickname(id)}”` : t(`character.${id}.boat`));
</script>

{#snippet hand()}
  {#each cards as c (c.key)}
    {#if c.held}<span class="held" out:thrown={c.card}>{@render one(c)}</span>{:else}{@render one(c)}{/if}
  {/each}
{/snippet}
{#snippet one(c: SeatCard)}
  {#if c.faceDown || !c.card}<CardView faceDown faded={c.faded} deal={c.deal === 'top' ? 'top' : null} />{:else}<CardView card={c.card} faded={c.faded} fresh={c.fresh} deal={c.deal} />{/if}
{/snippet}
{#snippet theLine()}
  {#if lineCategory}
    <button class="line ladder-link" onclick={() => (cardPrefs.ladder = lineCategory)}>{line}</button>
  {:else}
    <p class="line">{line ?? ''}</p>
  {/if}
{/snippet}
{#snippet coins(size: 'big' | 'small' | 'tiny')}
  {#if purse}<Purse amount={purse.amount} start={purse.start} {size} showAmount={false} focus={size === 'big' ? 18 : 30} label={name(id)} keep={purse.keep} paid={purse.paid} won={purse.won} />{/if}
{/snippet}

<div class="seat {mode}" class:focus class:folded class:broke style:grid-column={mode === 'full' ? '1 / -1' : `span ${span}`} bind:clientWidth={width}>
  {#if mode === 'full'}
    <!-- Name and title over their coins; a tall portrait beside both. -->
    <div class="head">
      <div class="left">
        <button class="name-btn" onclick={onselect}>
          <span class="who">
            <span class="name">{name(id)}{#if dealer}<span class="button" title={t('hr.dealer')}></span>{/if}</span>
            <span class="title">{title}</span>
          </span>
        </button>
        <div class="purse-place" data-purse={seat} bind:this={purseEl}>{@render coins('big')}</div>
      </div>
      <button class="portrait-btn" onclick={onselect} aria-label={name(id)}>
        <span class="oval portrait">{name(id)[0]}{@render portrait?.()}</span>
      </button>
    </div>
    <div class="cards" bind:this={cardsEl}>
      <div class="hand-cell">{@render hand()}</div>
      <!-- Played snags rise out of the fan as they're revealed: riding along in their hand. -->
      <div class="fan-cell"><SnagFan cards={snags} look={snagLook} /></div>
      <div class="discard-cell"><DiscardChips tall cards={discarded} flop={flopDiscards} title={t('draw.theirDiscards', { name: name(id) })} /></div>
    </div>
    {#if line}{@render theLine()}{/if}
  {:else}
    <!-- Mirroring yours across the table: the name at their edge, cards held close, their purse with them, and what they do (or hold) under it, nearest the pot. -->
    <div class="tagline">
      {#if mode === 'medium'}
        <button class="mini-portrait" onclick={onselect} aria-label={name(id)}><span class="oval">{name(id)[0]}{@render portrait?.()}</span></button>
      {/if}
      {#if dealer}<span class="button" title={t('hr.dealer')}></span>{/if}
      <span class="tag">{tagName(id)}</span>
      <SnagFan tiny cards={snags} look={snagLook} />
    </div>
    <div class="small-cards" bind:this={cardsEl}>
      <div class="small-hand">{@render hand()}</div>
      <DiscardChips cards={discarded} flop={flopDiscards} title={tagName(id)} />
    </div>
    <div class="purse-place" data-purse={seat} bind:this={purseEl}>{@render coins(mode === 'medium' ? 'small' : 'tiny')}</div>
    {#if broke}<p class="line">{t('hr.out')}</p>{:else}{@render theLine()}{/if}
  {/if}
</div>

<style>
  /* Across the whole table: on the table's own grid, so their cards line up with the board and yours. */
  .seat.full {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    row-gap: 0.5rem;
  }
  :global(.short) .seat.full {
    row-gap: 0.25rem;
  }
  /* Name and title over their coins in columns 1–8; the portrait in 9–12. */
  .head {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
  }
  .left {
    grid-column: 1 / 9;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  /* Centred in the space beside the portrait; a long title wraps rather than spill. */
  .left .name-btn {
    align-self: center;
    max-width: 100%;
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
    align-items: center;
    line-height: 1.15;
  }
  .name,
  .title {
    text-shadow: 0 0 2px #000, 0 0 4px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
  }
  .name {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    font-family: var(--title-font);
    font-size: 1.3rem;
    text-decoration: underline dotted var(--grey);
    text-underline-offset: 4px;
  }
  .title {
    font-size: 0.8rem;
    color: var(--grey);
    letter-spacing: 0.04em;
    white-space: normal;
    text-align: center;
    line-height: 1.15;
  }
  /* A purse's place keeps its height when there is no money on the table, so nothing moves. */
  .full .purse-place {
    min-height: 72px;
    /* Lifted clear of their cards, into the room under the name. */
    transform: translateY(-12px);
  }
  :global(.short) .full .purse-place {
    min-height: 56px;
  }
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
  /* Their cards on the grid, like yours: three cards in columns 1–6, the snag fan in 7–10, the discards in 11–12. */
  .cards {
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
  .full .line {
    grid-column: 1 / -1;
  }

  /* Half or a third of the table: the seat lays itself out, every one the same fixed height, so nothing moves. */
  .seat.medium,
  .seat.compact {
    container-type: inline-size;
    display: grid;
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
  .seat.medium {
    grid-template-rows: 40px auto auto 1.9rem;
  }
  .seat.focus {
    border-color: var(--paper);
    background: rgba(242, 239, 230, 0.06);
  }
  .seat.folded .tagline,
  .seat.folded :global(.purse) {
    opacity: 0.5;
  }
  .seat.broke {
    opacity: 0.45;
  }
  .tagline {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    min-width: 0;
  }
  .medium .tagline {
    align-items: center;
    gap: 6px;
  }
  .tag {
    font-family: var(--title-font);
    font-size: 0.85rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .medium .tag {
    font-size: 1rem;
  }
  .mini-portrait {
    flex: none;
    padding: 0;
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
  }
  .mini-portrait .oval {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border-width: 2px;
    font-size: 1.2rem;
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
  .small-cards {
    --small-w: calc((100cqw - 32px) / 3);
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }
  .small-hand {
    display: flex;
    gap: 2px;
    flex: none;
    width: calc(100cqw - 28px);
    min-height: calc(var(--small-w) * 1.4);
  }
  .seat .small-hand :global(.card:not(.huge)) {
    --w: var(--small-w) !important;
  }
  .small-cards :global(.discards) {
    --h: calc(var(--small-w) * 1.4);
    width: 20px;
  }
  .small-cards :global(.discards .chip) {
    font-size: 0.55rem;
    border-radius: 2px;
  }
  .small-cards :global(.discards .suit) {
    display: none;
  }
  .purse-place {
    position: relative;
  }
  /* A card held in a hand: its own box, so it can leave on its own. */
  .held {
    display: block;
    flex: none;
  }
  .line {
    margin: 0;
    font-size: 0.7rem;
    line-height: 1.25;
    text-align: center;
    overflow: hidden;
  }
  .medium .line {
    font-size: 0.8rem;
  }
  .seat.folded .line {
    color: var(--grey);
  }
</style>
