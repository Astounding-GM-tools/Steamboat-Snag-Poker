<script lang="ts">
  import type { Card } from '../engine';
  import CardView from './CardView.svelte';

  /**
   * A captain's snags, fanned: however many there are, the fan never grows
   * past its width (four columns; `tiny`, a rival's at a table of four), and
   * more than can be counted by eye get a badge. Snags are public: always
   * face up. Each carries `data-snag`, so a snag changing hands can slide
   * from where it was.
   */
  interface Look {
    selected?: boolean;
    used?: boolean;
    /** Played, and riding along in the hand: risen out of the fan. */
    lifted?: boolean;
    fresh?: boolean;
  }
  interface Props {
    cards: Card[];
    look?: (card: Card) => Look;
    /** Tappable (yours, when making your hand). */
    ontap?: (card: Card) => void;
    tiny?: boolean;
  }
  let { cards, look = () => ({}), ontap, tiny = false }: Props = $props();
</script>

{#if cards.length}
  <div class="snag-fan" class:tiny class:live={!!ontap} style="--n: {cards.length}">
    {#each cards as card (card.id)}
      {@const l = look(card)}
      <span class="snag" data-snag={card.id}><CardView {card} selected={l.selected} used={l.used} lifted={l.lifted} fresh={l.fresh} onclick={ontap ? () => ontap(card) : undefined} /></span>
    {/each}
    {#if cards.length > (tiny ? 1 : 2)}<span class="snag-count">×{cards.length}</span>{/if}
  </div>
{/if}

<style>
  .snag-fan {
    --fan: calc(4 * var(--col) + 3 * var(--gap));
    position: relative;
    display: flex;
    max-width: var(--fan);
  }
  .snag {
    display: block;
    flex: none;
  }
  .snag + .snag {
    margin-left: min(3px, calc((var(--fan) - var(--card-w) * var(--n)) / (var(--n) - 1)));
  }
  /* A tappable fan: the card under the finger comes to the front. */
  .live .snag :global(.card:hover) {
    z-index: 3;
  }
  .snag-fan.tiny {
    --fan: 32px;
    flex: none;
    margin-left: auto;
  }
  .snag-fan.tiny .snag :global(.card:not(.huge)) {
    --w: 18px !important;
  }
  .tiny .snag + .snag {
    margin-left: min(2px, calc((var(--fan) - 18px * var(--n)) / (var(--n) - 1)));
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
  .tiny .snag-count {
    font-size: 0.6rem;
    padding: 0 3px;
  }
</style>
