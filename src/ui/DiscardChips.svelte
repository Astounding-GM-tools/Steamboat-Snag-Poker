<script lang="ts">
  import { isJoker, rankLabel, type Card } from '../engine';
  import SuitIcon from './SuitIcon.svelte';
  import { cardPrefs } from './cards.svelte';

  /**
   * Thrown-away cards as card notation (7♣), in a small block of three rows of
   * two at the end of a hand row: never more than six, in the order thrown.
   * Tap it for a closer look at them all.
   */
  let { cards, title }: { cards: Card[]; title: string } = $props();
  const shown = $derived(cards.filter((c) => !isJoker(c)));
</script>

<button
  type="button"
  class="discards"
  aria-label={title}
  disabled={!shown.length}
  onclick={(e) => {
    e.stopPropagation();
    cardPrefs.discards = { title, cards: shown };
  }}
>
  {#each shown as card (card.id)}
    {#if !isJoker(card)}<span class="chip">{card.rank === 10 ? '10' : rankLabel(card.rank)}<span class="suit"><SuitIcon suit={card.suit} /></span></span>{/if}
  {/each}
</button>

<style>
  /* Always the same size, so the first discard doesn't push anything. */
  .discards {
    flex: none;
    display: grid;
    grid-template-columns: repeat(2, 26px);
    grid-auto-rows: 22px;
    align-content: start;
    gap: 3px;
    width: 55px;
    height: 72px;
    padding: 0;
    margin: 0 0 0 auto;
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
    cursor: pointer;
  }
  .discards:disabled {
    cursor: default;
    opacity: 1;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    border-radius: 3px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--title-font);
    font-size: 0.8rem;
    letter-spacing: 0;
    opacity: 0.8;
  }
  .suit {
    width: 0.65rem;
    height: 0.65rem;
  }
</style>
