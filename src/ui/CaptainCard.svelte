<script lang="ts">
  import type { Player } from '../engine';
  import { t } from '../i18n';
  import { dollars, name } from './format';

  /** A captain's portrait card: who they are, how they play, where they come from. */
  let { captain, onclose }: { captain: Player; onclose: () => void } = $props();
  const id = $derived(captain.id);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="intertitle card" role="dialog" aria-label={name(id)} tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <div class="oval">{name(id)[0]}</div>
    <h2>{name(id)}</h2>
    <p class="boat">{t(`character.${id}.boat`)}</p>
    <p class="purse">{dollars(captain.money)}{captain.jokers.length ? ` · ${'🃏'.repeat(captain.jokers.length)}` : ''}</p>
    <dl>
      <dt>{t('captain.style')}</dt>
      <dd>{t(`character.${id}.blurb`)}</dd>
      <dt>{t('captain.source')}</dt>
      <dd>{t(`character.${id}.source`)}</dd>
      <dt>{t('captain.trivia')}</dt>
      <dd>{t(`character.${id}.trivia`)}</dd>
    </dl>
    <button onclick={onclose}>{t('willie.ok')}</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 45;
  }
  .card {
    width: min(480px, 100%);
    max-height: 90vh;
    overflow: auto;
  }
  .oval {
    width: 110px;
    height: 140px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    border: 4px double var(--paper);
    display: grid;
    place-items: center;
    font-family: var(--title-font);
    font-size: 4rem;
    background: radial-gradient(circle, #444, #111);
  }
  h2 {
    margin-bottom: 0.1rem;
  }
  .boat {
    margin: 0;
    font-style: italic;
    color: var(--grey);
  }
  .purse {
    margin: 0.4rem 0 0.8rem;
  }
  dl {
    text-align: left;
    margin: 0;
  }
  dt {
    font-family: var(--title-font);
    letter-spacing: 0.08em;
    margin-top: 0.6rem;
  }
  dd {
    margin: 0.15rem 0 0;
    color: var(--grey);
    line-height: 1.4;
  }
  button {
    margin-top: 1rem;
  }
</style>
