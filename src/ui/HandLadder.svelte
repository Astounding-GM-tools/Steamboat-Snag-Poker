<script lang="ts">
  import { CATEGORIES } from '../engine';
  import { t } from '../i18n';
  import { cardPrefs } from './cards.svelte';

  /**
   * The hands, best first, for quick reference: tap a hand's name at the
   * table (yours, or theirs at the showdown) and it comes up with that hand
   * picked out; How it works shows it too (`inline`). Each with a word on what
   * it is, and at the foot what a snag counts for, and how a tie is settled.
   */
  let { inline = false }: { inline?: boolean } = $props();

  const best = [...CATEGORIES].reverse();

  const shown = $derived(inline || cardPrefs.ladder !== null);
  const picked = $derived(inline ? null : cardPrefs.ladder === 'all' ? null : cardPrefs.ladder);
  const close = () => (cardPrefs.ladder = null);
</script>

<svelte:window onkeydown={(e) => !inline && e.key === 'Escape' && close()} />

{#if shown}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="ladder" class:inline onclick={inline ? undefined : close} role={inline ? undefined : 'dialog'} aria-label={t('ladder.title')}>
    <h2>{t('ladder.title')}</h2>
    <ol>
      {#each best as cat, i (cat)}
        <li class:picked={picked === cat}>
          <span class="n">{i + 1}</span>
          <span class="name">{t(`ladder.${cat}`)}</span>
          <span class="eg">{t(`ladder.eg.${cat}`)}</span>
        </li>
      {/each}
    </ol>
    <p>{t('ladder.snags')}</p>
    <p>{t('ladder.ties')}</p>
    {#if !inline}<p class="hint">{t('cards.zoomClose')}</p>{/if}
  </div>
{/if}

<style>
  .ladder {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: grid;
    align-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(12, 12, 11, 0.95);
    animation: ladder-in 0.2s ease-out;
  }
  .ladder.inline {
    position: static;
    padding: 0;
    background: none;
    animation: none;
  }
  @keyframes ladder-in {
    from {
      opacity: 0;
    }
  }
  h2 {
    margin: 0 0 0.25rem;
    font-family: var(--title-font);
    font-weight: normal;
    text-align: center;
  }
  ol {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.3rem;
  }
  li {
    display: grid;
    grid-template-columns: 1.4em 1fr auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.4rem;
    border: 1px solid transparent;
    border-radius: 4px;
  }
  /* The hand you tapped. */
  li.picked {
    border-color: var(--paper);
    background: rgba(242, 239, 230, 0.1);
  }
  .n {
    color: var(--grey);
    font-size: 0.8rem;
  }
  .name {
    font-family: var(--title-font);
    font-size: 0.95rem;
  }
  .eg {
    color: var(--grey);
    font-size: 0.8rem;
    text-align: right;
  }
  p {
    width: 100%;
    max-width: 420px;
    margin: 0.25rem auto 0;
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--grey);
  }
  .hint {
    text-align: center;
  }
</style>
