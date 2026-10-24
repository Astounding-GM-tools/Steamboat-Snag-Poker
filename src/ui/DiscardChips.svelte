<script lang="ts">
  import { isJoker, rankLabel, type Card } from '../engine';
  import { t } from '../i18n';
  import SuitIcon from './SuitIcon.svelte';
  import { cardPrefs } from './cards.svelte';

  /**
   * Thrown-away cards as card notation (7♣) at the end of a card row, in two
   * little stacks of up to three: the Flop's along the edge, the Turn's beside it.
   * Shorter than a card, so it sits on the table beside them. Tap it for a
   * closer look.
   */
  let { cards, flop = cards.length, title }: { cards: Card[]; flop?: number; title: string } = $props();
  const rows = $derived(
    [
      { label: t('street.flop'), cards: cards.slice(0, flop) },
      { label: t('street.turn'), cards: cards.slice(flop) },
    ].map((r) => ({ ...r, cards: r.cards.filter((c) => !isJoker(c)) })),
  );
</script>

<button
  type="button"
  class="discards"
  aria-label={title}
  disabled={!cards.length}
  onclick={(e) => {
    e.stopPropagation();
    cardPrefs.discards = { title, rows: rows.filter((r) => r.cards.length) };
  }}
>
  {#each rows as row}
    <span class="row">
      {#each row.cards as card (card.id)}
        {#if !isJoker(card)}<span class="chip">{card.rank === 10 ? '10' : rankLabel(card.rank)}<span class="suit"><SuitIcon suit={card.suit} /></span></span>{/if}
      {/each}
    </span>
  {/each}
</button>

<style>
  /* Always the same size, so the first discard doesn't push anything. */
  .discards {
    flex: none;
    align-self: flex-end;
    display: flex;
    flex-direction: row-reverse;
    gap: 3px;
    width: 47px;
    height: 55px;
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
  .row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 22px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    height: 17px;
    border-radius: 3px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--title-font);
    font-size: 0.72rem;
    letter-spacing: 0;
    opacity: 0.8;
  }
  .suit {
    width: 0.6rem;
    height: 0.6rem;
  }
</style>
