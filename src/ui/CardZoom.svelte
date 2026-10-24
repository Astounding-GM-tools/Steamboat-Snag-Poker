<script lang="ts">
  import { isJoker } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import { cardPrefs } from './cards.svelte';
  import { longCardName } from './format';

  /** The card held up for a closer look (long-press any card), with its name spelled out. */
  const card = $derived(cardPrefs.zoomed);
  const close = () => (cardPrefs.zoomed = null);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />

{#if card}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="zoom" onclick={close} role="dialog" aria-modal="true" aria-label={longCardName(card)} tabindex="-1">
    <CardView {card} huge />
    <p class="caption">
      {#if isJoker(card)}{t('card.snag')}: {longCardName(card)}{:else}{longCardName(card)}{/if}
    </p>
    <p class="hint">{t('cards.zoomClose')}</p>
  </div>
{/if}

<style>
  .zoom {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.85);
    animation: lift 0.18s ease-out;
  }
  .caption {
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.6rem;
    text-align: center;
    padding: 0 1rem;
  }
  .caption::first-letter {
    text-transform: uppercase;
  }
  .hint {
    margin: 0;
    color: var(--grey);
    font-size: 0.85rem;
  }
  @keyframes lift {
    from { opacity: 0; transform: scale(0.9); }
  }
  @media (prefers-reduced-motion: reduce) {
    .zoom { animation: none; }
  }
</style>
