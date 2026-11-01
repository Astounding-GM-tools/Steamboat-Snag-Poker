<script lang="ts">
  import type { Card, StdCard } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import SnagFan from './SnagFan.svelte';

  /**
   * Your cards, the same at every table, in fixed cells so nothing moves:
   * your hand (at the showdown the cards you played first, then the rest),
   * your snags, and your discards. Tall enough for a lifted card.
   */
  interface Look {
    selected?: boolean;
    /** Marked for swapping. */
    toss?: boolean;
    used?: boolean;
    faded?: boolean;
  }
  interface Props {
    /** The cards you played, shown first at the showdown. */
    played: Card[];
    /** The cards in your hand (dealt so far). */
    hand: Card[];
    look: (card: Card) => Look;
    ontap?: (card: Card) => void;
    /** A card leaving your hand (thrown away). */
    thrown: (node: Element, card: Card) => { duration: number; css: (t: number) => string };
    snags: Card[];
    snagLook: (card: Card) => { selected?: boolean; used?: boolean; lifted?: boolean };
    onsnag?: (card: Card) => void;
    discarded: StdCard[];
    flopDiscards?: number;
  }
  let { played, hand, look, ontap, thrown, snags, snagLook, onsnag, discarded, flopDiscards }: Props = $props();
</script>

<div class="hand-row">
  <div class="hand-cell">
    {#each played as card (card.id)}<CardView {card} used />{/each}
    {#each hand as card (card.id)}
      {@const l = look(card)}
      <span class="held" out:thrown={card}><CardView {card} deal="left" selected={l.selected} toss={l.toss} used={l.used} faded={l.faded} onclick={ontap ? () => ontap(card) : undefined} /></span>
    {/each}
  </div>
  <div class="fan-cell"><SnagFan cards={snags} look={snagLook} ontap={onsnag} /></div>
  <div class="discard-cell"><DiscardChips tall cards={discarded} flop={flopDiscards} title={t('draw.yourDiscards')} /></div>
</div>

<style>
  .hand-row {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: end;
    height: calc(var(--card-w) * 1.4 + 14px);
  }
  .hand-cell {
    grid-column: 1 / 7;
    display: flex;
    gap: var(--gap);
    align-items: flex-end;
  }
  /* A card held in a hand: its own box, so it can leave on its own. */
  .held {
    display: block;
    flex: none;
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
</style>
