<script lang="ts">
  import { stdCard } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import { cardPrefs } from './cards.svelte';
  import { saveSettings, settings, switchFaces } from './settings.svelte';

  /**
   * Options, as a plain page over the screen above the buttons (like How it
   * works): the sound of coins, and how card faces read. Remembered on this
   * device.
   */
  const sample = [stdCard(14, 's'), stdCard(10, 'h'), stdCard(7, 'd')];

  function sound(on: boolean) {
    settings.sound = on;
    saveSettings();
  }
</script>

<div class="options" role="dialog" aria-label={t('options.title')}>
  <h2>{t('options.title')}</h2>

  <section>
    <h3>{t('options.sound')}</h3>
    <div class="choice">
      <button class:ghost={!settings.sound} aria-pressed={settings.sound} onclick={() => sound(true)}>{t('options.on')}</button>
      <button class:ghost={settings.sound} aria-pressed={!settings.sound} onclick={() => sound(false)}>{t('options.off')}</button>
    </div>
  </section>

  <section>
    <h3>{t('options.faces')}</h3>
    <div class="choice">
      <button class:ghost={cardPrefs.face !== 'value'} aria-pressed={cardPrefs.face === 'value'} onclick={() => cardPrefs.face !== 'value' && switchFaces()}>{t('options.faceValue')}</button>
      <button class:ghost={cardPrefs.face !== 'pair'} aria-pressed={cardPrefs.face === 'pair'} onclick={() => cardPrefs.face !== 'pair' && switchFaces()}>{t('options.facePair')}</button>
    </div>
    <div class="sample">{#each sample as card (card.id)}<CardView {card} />{/each}</div>
    <p class="tip">{t('options.facesTip')}</p>
  </section>
</div>

<style>
  .options {
    position: absolute;
    inset: 0;
    z-index: 30;
    overflow: auto;
    padding: 1rem 1.25rem;
    background: rgba(12, 12, 11, 0.97);
    animation: options-in 0.2s ease-out;
  }
  @keyframes options-in {
    from {
      opacity: 0;
    }
  }
  h2 {
    font-family: var(--title-font);
    font-weight: normal;
    text-align: center;
    margin: 0 0 1rem;
  }
  section {
    margin: 0 0 1.5rem;
  }
  h3 {
    font-family: var(--title-font);
    font-weight: normal;
    font-size: 1rem;
    margin: 0 0 0.5rem;
  }
  .choice {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .choice button {
    font-size: 0.95rem;
    padding: 0.4em 0.5em;
  }
  .sample {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.75rem 0 0.5rem;
  }
  .sample :global(.card) {
    --w: 56px;
  }
  .tip {
    margin: 0;
    font-size: 0.85rem;
    color: var(--grey);
    text-align: center;
  }
</style>
