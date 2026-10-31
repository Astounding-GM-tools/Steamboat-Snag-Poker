<script lang="ts">
  import { isJoker, rankLabel, type Card } from '../engine';
  import { t } from '../i18n';
  import { snagTitle } from './format';
  import SuitIcon from './SuitIcon.svelte';
  import { cardPrefs } from './cards.svelte';

  interface Props {
    card?: Card | null;
    faceDown?: boolean;
    /** Slide in as if dealt: from the dealer at the left, or from above for the opponent; or, onto the board, dropped (a thud) or slammed down. */
    deal?: 'left' | 'top' | 'drop' | 'slam' | null;
    small?: boolean;
    /** The big close-up view (long-press any card). */
    huge?: boolean;
    /** Close-up width, when several cards share the view (a CSS length). */
    width?: string;
    /** Stamped with a cross: a thrown-away card in the close-up. */
    crossed?: boolean;
    selected?: boolean;
    /** Lifted out of its row: a snag the opponent played, shown at the reveal. */
    lifted?: boolean;
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

  let { card = null, faceDown = false, deal = null, markAbove = false, markBelow = false, small = false, huge = false, width, crossed = false, selected = false, lifted = false, ghost = false, fresh = false, used = false, faded = false, toss = false, placeholder = '', onclick, ondragstart }: Props = $props();

  const rank = $derived(card && !isJoker(card) ? (card.rank === 10 ? '10' : rankLabel(card.rank)) : '');
  const playing = $derived(card && !isJoker(card) ? card : null);

  // A long press on any face-up card holds it up for a closer look; the click
  // that ends the press is swallowed so it does not also select the card.
  const HOLD_MS = 450;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let holdStart = { x: 0, y: 0 };
  let held = false;
  function pressStart(e: PointerEvent) {
    if (huge || !card) return;
    held = false;
    holdStart = { x: e.clientX, y: e.clientY };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      held = true;
      cardPrefs.zoomed = card;
    }, HOLD_MS);
  }
  function pressMove(e: PointerEvent) {
    if (Math.hypot(e.clientX - holdStart.x, e.clientY - holdStart.y) > 10) clearTimeout(holdTimer);
  }
  function pressEnd() {
    clearTimeout(holdTimer);
  }
  function click() {
    if (held) {
      held = false;
      return;
    }
    onclick?.();
  }
</script>

{#if faceDown}
  <div class="card back" class:small class:faded class:deal-left={deal === 'left'} class:deal-top={deal === 'top'}></div>
{:else if !card}
  <div class="card empty" class:small>{placeholder}</div>
{:else}
  <button
    type="button"
    class="card face"
    class:small
    class:huge
    style={width ? `--w: ${width}` : undefined}
    class:pair={cardPrefs.face === 'pair'}
    class:passive={!onclick && !ondragstart}
    class:selected
    class:lifted
    class:ghost
    class:fresh
    class:deal-left={deal === 'left'}
    class:deal-top={deal === 'top'}
    class:deal-drop={deal === 'drop'}
    class:deal-slam={deal === 'slam'}
    class:used
    class:toss
    class:faded
    class:joker={isJoker(card)}
    draggable={!!ondragstart}
    onclick={click}
    {ondragstart}
    onpointerdown={pressStart}
    onpointermove={pressMove}
    onpointerup={pressEnd}
    onpointerleave={pressEnd}
    onpointercancel={pressEnd}
    oncontextmenu={(e) => e.preventDefault()}
    aria-disabled={!onclick && !ondragstart}
  >
    {#if toss || crossed}<span class="stamp">✕</span>{/if}
    {#if markAbove}<span class="mark above" aria-hidden="true">▼</span>{/if}
    {#if markBelow}<span class="mark below" aria-hidden="true">▲</span>{/if}
    {#if isJoker(card)}
      <span class="jtitle">{t('card.snag')}</span>
      <span class="jester">🪵</span>
      <span class="jname">{snagTitle(card.index)}</span>
    {:else}
      <span class="pip-corner"><SuitIcon suit={playing!.suit} /></span>
      <span class="pip-value" class:ten={rank === '10'}>{rank}</span>
      <span class="pip-side"><SuitIcon suit={playing!.suit} /></span>
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
  .huge {
    --w: min(64vw, 280px);
    border-radius: 14px;
  }
  .face {
    background: var(--paper);
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.6);
    cursor: grab;
  }
  .face {
    /* A long press opens the close-up, not the phone's own menu. */
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }
  .face.passive {
    cursor: default;
  }
  .face:hover:not(.passive) {
    transform: translateY(-4px) rotate(-1deg);
  }
  .selected {
    transform: translateY(-10px) rotate(-2deg) !important;
    box-shadow: 0 0 0 3px var(--paper), 0 0 18px 4px rgba(255, 255, 255, 0.45);
  }
  .lifted {
    transform: translateY(-14px) !important;
    transition: transform 0.25s ease-out;
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
  /* Onto the board: it falls from above, a touch big, and lands with a thud (a little give, then still). */
  .deal-drop {
    animation: deal-drop 0.5s cubic-bezier(0.5, 0, 0.75, 0.4) both;
  }
  @keyframes deal-drop {
    from { transform: translateY(-36px) scale(1.18); opacity: 0; box-shadow: 10px 16px 0 rgba(0, 0, 0, 0.25); }
    55% { opacity: 1; }
    70% { transform: translateY(0) scale(0.97); box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6); }
    85% { transform: scale(1.01); }
    to { transform: none; }
  }
  /* The big one: higher, bigger, harder, and the table shudders. */
  .deal-slam {
    animation: deal-slam 0.65s cubic-bezier(0.55, 0, 0.8, 0.3) both;
  }
  @keyframes deal-slam {
    from { transform: translateY(-70px) scale(1.4) rotate(-3deg); opacity: 0; box-shadow: 18px 26px 0 rgba(0, 0, 0, 0.2); }
    50% { opacity: 1; }
    62% { transform: translateY(0) scale(0.94) rotate(0); box-shadow: 0 0 0 rgba(0, 0, 0, 0.7); }
    70% { transform: translate(-2px, 1px) scale(1.02); }
    78% { transform: translate(2px, -1px); }
    86% { transform: translate(-1px, 0); }
    to { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .deal-left,
    .deal-top,
    .deal-drop,
    .deal-slam {
      animation: none;
    }
  }
  @keyframes pop {
    0% { transform: scale(1.3) rotate(6deg); }
    100% { transform: scale(1) rotate(0); }
  }
  /*
   * Two faces, chosen in Willie's help: the value big in the middle with the
   * suit in the corner (the default), or value and suit side by side.
   */
  .pip-corner {
    position: absolute;
    top: 6%;
    left: 7%;
    width: calc(var(--w) * 0.36);
    height: calc(var(--w) * 0.36);
  }
  .pip-value {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding-top: 30%;
    font-size: calc(var(--w) * 0.66);
    line-height: 1;
  }
  /* "10" is two figures wide, so it runs tighter to stand as tall as the rest. */
  .pip-value.ten {
    font-size: calc(var(--w) * 0.64);
    letter-spacing: -0.1em;
  }
  .pip-side {
    display: none;
  }
  .pair .pip-corner {
    display: none;
  }
  .pair .pip-value {
    inset: 0 auto 0 8%;
    padding-top: 0;
    font-size: calc(var(--w) * 0.5);
  }
  .pair .pip-value.ten {
    left: 2%;
    font-size: calc(var(--w) * 0.48);
  }
  .pair .pip-side {
    display: block;
    position: absolute;
    top: 50%;
    right: 9%;
    width: calc(var(--w) * 0.36);
    height: calc(var(--w) * 0.36);
    transform: translateY(-50%);
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
