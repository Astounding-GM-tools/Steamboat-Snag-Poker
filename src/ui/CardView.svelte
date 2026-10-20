<script lang="ts">
  import { isJoker, rankLabel, type Card } from '../engine';
  import { t } from '../i18n';
  import { SUIT_GLYPH, jokerName } from './format';

  interface Props {
    card?: Card | null;
    faceDown?: boolean;
    /** Slide in as if dealt: from the dealer at the left, or from above for the opponent. */
    deal?: 'left' | 'top' | null;
    small?: boolean;
    selected?: boolean;
    ghost?: boolean;
    fresh?: boolean;
    /** Board card used by the opponent's hand (mark above) or yours (mark below). */
    markAbove?: boolean;
    markBelow?: boolean;
    /** Selected to be thrown away. */
    toss?: boolean;
    /** Part of the player's best hand. */
    used?: boolean;
    /** In a slot but not part of the best hand. */
    faded?: boolean;
    placeholder?: string;
    onclick?: () => void;
    ondragstart?: (e: DragEvent) => void;
  }

  let { card = null, faceDown = false, deal = null, markAbove = false, markBelow = false, small = false, selected = false, ghost = false, fresh = false, used = false, faded = false, toss = false, placeholder = '', onclick, ondragstart }: Props = $props();

  const rank = $derived(card && !isJoker(card) ? (card.rank === 10 ? '10' : rankLabel(card.rank)) : '');
  const suit = $derived(card && !isJoker(card) ? SUIT_GLYPH[card.suit] : '');
</script>

{#if faceDown}
  <div class="card back" class:small class:deal-left={deal === 'left'} class:deal-top={deal === 'top'}></div>
{:else if !card}
  <div class="card empty" class:small>{placeholder}</div>
{:else}
  <button
    type="button"
    class="card face"
    class:small
    class:selected
    class:ghost
    class:fresh
    class:deal-left={deal === 'left'}
    class:deal-top={deal === 'top'}
    class:used
    class:toss
    class:faded
    class:joker={isJoker(card)}
    draggable={!!ondragstart}
    {onclick}
    {ondragstart}
    disabled={!onclick && !ondragstart}
  >
    {#if toss}<span class="stamp">✕</span>{/if}
    {#if markAbove}<span class="mark above" aria-hidden="true">▼</span>{/if}
    {#if markBelow}<span class="mark below" aria-hidden="true">▲</span>{/if}
    {#if isJoker(card)}
      <span class="jtitle">{t('card.snag')}</span>
      <span class="jester">🪵</span>
      <span class="jname">{jokerName(card.index).replace(/^the /, '')}</span>
    {:else}
      <span class="corner">{rank}<br />{suit}</span>
      <span class="pip">{suit}</span>
    {/if}
  </button>
{/if}

<style>
  .card {
    --w: 76px;
    width: var(--w);
    height: calc(var(--w) * 1.4);
    border-radius: 6px;
    position: relative;
    flex: none;
    padding: 0;
    outline: none;
    font-family: var(--title-font);
  }
  .small {
    --w: 52px;
  }
  .face {
    background: var(--paper);
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.6);
    cursor: grab;
  }
  .face:disabled {
    cursor: default;
    opacity: 1;
  }
  .face:hover:not(:disabled) {
    transform: translateY(-4px) rotate(-1deg);
  }
  .selected {
    transform: translateY(-10px) rotate(-2deg) !important;
    box-shadow: 0 0 0 3px var(--paper), 0 0 18px 4px rgba(255, 255, 255, 0.45);
  }
  .ghost {
    opacity: 0.55;
    border-style: dashed;
  }
  .mark {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: var(--paper);
    line-height: 1;
  }
  .mark.above {
    top: -0.95rem;
  }
  .mark.below {
    bottom: -0.95rem;
  }
  .toss {
    transform: translateY(-10px) rotate(3deg) !important;
    filter: brightness(0.75);
  }
  .stamp {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: calc(var(--w) * 0.9);
    color: rgba(0, 0, 0, 0.7);
    z-index: 2;
    pointer-events: none;
  }
  .used {
    box-shadow: 0 0 0 2px var(--paper), 2px 3px 0 rgba(0, 0, 0, 0.6);
  }
  .faded {
    opacity: 0.5;
  }
  .fresh {
    animation: pop 0.5s ease-out;
  }
  .deal-left {
    animation: deal-left 0.35s cubic-bezier(0.2, 0.8, 0.3, 1);
  }
  .deal-top {
    animation: deal-top 0.35s cubic-bezier(0.2, 0.8, 0.3, 1);
  }
  @keyframes deal-left {
    from { transform: translate(-260px, -40px) rotate(-25deg); opacity: 0; }
    60% { opacity: 1; }
    to { transform: none; }
  }
  @keyframes deal-top {
    from { transform: translate(-120px, -160px) rotate(20deg); opacity: 0; }
    60% { opacity: 1; }
    to { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .deal-left,
    .deal-top {
      animation: none;
    }
  }
  @keyframes pop {
    0% { transform: scale(1.3) rotate(6deg); }
    100% { transform: scale(1) rotate(0); }
  }
  .corner {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: calc(var(--w) * 0.22);
    line-height: 1;
    text-align: center;
  }
  .pip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: calc(var(--w) * 0.55);
    padding-top: 10%;
  }
  .joker {
    background: repeating-linear-gradient(45deg, #ddd 0 6px, #bbb 6px 12px);
  }
  .jtitle {
    display: block;
    font-family: var(--title-font);
    font-size: calc(var(--w) * 0.16);
    letter-spacing: 0.12em;
    margin-top: 6%;
  }
  .jester {
    display: block;
    font-size: calc(var(--w) * 0.45);
    margin-top: 2%;
  }
  .jname {
    display: block;
    font-family: var(--body-font);
    font-size: calc(var(--w) * 0.13);
    line-height: 1.1;
    padding: 0 3px;
  }
  .back {
    background: repeating-linear-gradient(-45deg, #555 0 4px, #222 4px 8px);
    border: 2px solid var(--paper);
  }
  .empty {
    border: 2px dashed var(--grey);
    display: grid;
    place-items: center;
    color: var(--grey);
    font-size: 0.75rem;
    text-align: center;
  }
</style>
