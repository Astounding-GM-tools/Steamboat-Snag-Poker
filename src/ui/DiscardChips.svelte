<script lang="ts">
  import { isJoker, rankLabel, type Card } from '../engine';
  import SuitIcon from './SuitIcon.svelte';

  /** Thrown-away cards as card notation (7♣): small, readable, out of the way. */
  let { cards, label }: { cards: Card[]; label: string } = $props();
</script>

<div class="discards" aria-label={label}>
  {#if cards.length}
    <span class="label">{label}</span>
    {#each cards as card (card.id)}
      {#if !isJoker(card)}
        <span class="chip">{card.rank === 10 ? '10' : rankLabel(card.rank)}<span class="suit"><SuitIcon suit={card.suit} /></span></span>
      {/if}
    {/each}
  {/if}
</div>

<style>
  /* Always the same height, so the first discard doesn't push anything. */
  .discards {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 1.5rem;
    overflow: hidden;
  }
  .label {
    font-size: 0.75rem;
    color: var(--grey);
    margin-right: 2px;
    white-space: nowrap;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    height: 1.25rem;
    padding: 0 4px;
    border-radius: 3px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--title-font);
    font-size: 0.8rem;
    opacity: 0.8;
  }
  .suit {
    width: 0.7rem;
    height: 0.7rem;
  }
</style>
