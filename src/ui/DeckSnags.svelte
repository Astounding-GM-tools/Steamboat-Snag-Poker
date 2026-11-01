<script lang="ts">
  import { t } from '../i18n';

  /**
   * The snags shuffled into the deck, face down: which ones is anyone's
   * guess, but how many is public, and it matters. Every card you swap for
   * (or the board brings) might be one, and a snag fished out is yours to
   * carry: with several in the deck, folding can come cheaper than a swap.
   */
  let { count }: { count: number } = $props();
  const label = $derived(count === 1 ? t('table.deckSnag') : t('table.deckSnags', { n: count }));
</script>

{#if count}
  <span class="deck-snags" role="img" aria-label={label} title={label}>
    {#each Array.from({ length: count }) as _, i (i)}<span class="snag"><span class="log">🪵</span></span>{/each}
  </span>
{/if}

<style>
  .deck-snags {
    display: inline-flex;
    align-items: flex-end;
  }
  /* A snag's back in miniature: the stripes and the log, no name (nobody knows which). */
  .snag {
    display: grid;
    place-items: center;
    width: 13px;
    height: 18px;
    border-radius: 2px;
    border: 1px solid #0c0c0b;
    background: repeating-linear-gradient(45deg, #ddd 0 3px, #bbb 3px 6px);
    box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6);
  }
  .snag + .snag {
    margin-left: -4px;
  }
  .log {
    font-size: 8px;
    line-height: 1;
  }
</style>
