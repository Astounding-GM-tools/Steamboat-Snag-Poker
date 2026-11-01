<script lang="ts">
  import { t } from '../i18n';
  import HandLadder from './HandLadder.svelte';

  /**
   * How it works, as a plain page laid over the screen above the two buttons
   * (the screen's own buttons close it). Long text scrolls inside the page.
   * It is Morag's pamphlet against the game: every rule accurate, set down so
   * that decent folk may recognise the game and walk away. The hands come
   * early, after a word of warning, so nobody has to scroll for them.
   */
</script>

<div class="howto" role="dialog" aria-label={t('title.howTo')}>
  <header>
    <h2>{t('howto.title')}</h2>
    <p class="subtitle">{t('howto.subtitle')}</p>
    <p class="byline">{t('howto.byline')}</p>
  </header>
  <p>{t('howto.intro')}</p>
  <div class="ladder-part"><HandLadder inline /></div>
  {#each t('howto.body').split('\n\n') as para}<p>{para}</p>{/each}
  <p class="closing">{t('howto.closing')}<br /><span class="signature">{t('howto.signature')}</span></p>
  <p class="imprint">{t('howto.imprint')}</p>
  <p class="tip">{t('cards.zoomTip')}</p>
</div>

<style>
  .howto {
    position: absolute;
    inset: 0;
    z-index: 30;
    overflow: auto;
    padding: 1rem 1.25rem;
    background: rgba(12, 12, 11, 0.97);
    text-align: left;
    animation: howto-in 0.2s ease-out;
  }
  header {
    text-align: center;
    margin: 0 0 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--grey);
  }
  h2 {
    font-family: var(--title-font);
    font-weight: normal;
    line-height: 1.2;
    margin: 0 0 0.35rem;
  }
  .subtitle {
    font-style: italic;
    margin: 0 0 0.35rem;
  }
  .byline {
    font-family: var(--title-font);
    font-size: 0.85rem;
    color: var(--grey);
    margin: 0;
  }
  p {
    margin: 0 0 0.75rem;
    line-height: 1.45;
    font-size: 0.95rem;
  }
  .ladder-part {
    margin: 0 0 1.25rem;
  }
  .closing {
    margin-top: 1.25rem;
    text-align: right;
    font-style: italic;
  }
  .signature {
    font-family: var(--title-font);
    font-style: normal;
  }
  .imprint {
    text-align: center;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--grey);
    margin: 1.5rem 0 1rem;
  }
  .tip {
    color: var(--grey);
    font-size: 0.85rem;
  }
  @keyframes howto-in {
    from { opacity: 0; }
  }
</style>
