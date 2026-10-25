<script lang="ts">
  import { isJoker, rankLabel, type Card } from '../engine';
  import { t } from '../i18n';
  import SuitIcon from './SuitIcon.svelte';
  import { cardPrefs } from './cards.svelte';

  /**
   * Thrown-away cards as card notation (7♣) at the end of a card row: one
   * column, the Flop's first, then the Turn's. Up to four stack as they are;
   * five or six fan out (overlapping, each showing its top strip), so the
   * column never grows past a card's height. Tap it for a closer look, by street.
   */
  let {
    cards,
    flop = cards.length,
    title,
    tall = false,
  }: {
    cards: Card[];
    flop?: number;
    title: string;
    /** As tall as a full-size card: the stacks line up with the top and bottom of your hand. */
    tall?: boolean;
  } = $props();
  const all = $derived(cards.filter((c) => !isJoker(c)));
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
  class:tall
  class:fanned={all.length > 4}
  style="--n: {all.length}"
  aria-label={title}
  disabled={!cards.length}
  onclick={(e) => {
    e.stopPropagation();
    cardPrefs.discards = { title, rows: rows.filter((r) => r.cards.length) };
  }}
>
  {#each all as card (card.id)}
    <span class="chip">{card.rank === 10 ? '10' : rankLabel(card.rank)}<span class="suit"><SuitIcon suit={card.suit} /></span></span>
  {/each}
</button>

<style>
  /* Always the same size, so the first discard doesn't push anything. */
  .discards {
    --h: 61px;
    --chip-h: calc((var(--h) - 6px) / 4);
    flex: none;
    align-self: flex-end;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    height: var(--h);
    padding: 0;
    margin: 0;
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
    cursor: pointer;
  }
  /* As tall as a card, which is 1.4 times its width (the table sets --card-w). */
  .tall {
    --h: calc(var(--card-w, 76px) * 1.4);
  }
  .discards:disabled {
    cursor: default;
    opacity: 1;
  }
  .chip {
    flex: none;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    height: var(--chip-h);
    border-radius: 3px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--title-font);
    font-size: 0.78rem;
    line-height: 1;
    letter-spacing: 0;
    box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.5);
  }
  /* Five or six: they overlap to fit, each showing its top strip with the rank. */
  .fanned {
    gap: 0;
  }
  .fanned .chip {
    align-items: flex-start;
    padding-top: 1px;
  }
  .fanned .chip + .chip {
    margin-top: calc((var(--h) - var(--chip-h) * var(--n)) / (var(--n) - 1));
  }
  .suit {
    width: 0.65rem;
    height: 0.65rem;
  }
</style>
