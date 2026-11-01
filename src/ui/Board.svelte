<script lang="ts">
  import { isJoker, type Card } from '../engine';
  import CardView from './CardView.svelte';
  import { switchFaces } from './settings.svelte';

  /**
   * The cards in the middle, the same at every table: each lands with a
   * thud, the Flop's last card and the River slam down. A tap on the board
   * switches every card's face (the value, or value and suit, for spotting
   * flushes). A snag on the board carries `data-snag`, so it can slide to
   * whoever takes it.
   */
  interface Props {
    /** Five places, empty until dealt. */
    cards: (Card | null)[];
    /** Marks on a card: used by their hand (above), by yours (below). */
    marks?: (card: Card) => { above?: boolean; below?: boolean };
    el?: HTMLElement;
  }
  let { cards, marks, el = $bindable() }: Props = $props();
</script>

<div class="community" bind:this={el}>
  {#each cards as card, i}
    {@const m = card && marks ? marks(card) : {}}
    {#key card?.id}<span class="board-card" data-snag={card && isJoker(card) ? card.id : undefined}><CardView {card} deal={i === 2 || i === 4 ? 'slam' : 'drop'} markAbove={!!m.above} markBelow={!!m.below} onclick={card ? switchFaces : undefined} /></span>{/key}
  {/each}
</div>

<style>
  .community {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--gap);
  }
  .board-card {
    display: block;
    flex: none;
  }
</style>
