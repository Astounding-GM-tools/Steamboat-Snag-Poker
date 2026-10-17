<script lang="ts">
  import { t } from '../i18n';
  import type { Best } from './storage';

  let { best, onstart }: { best: Best | null; onstart: () => void } = $props();
  let showHowTo = $state(false);
</script>

<div class="title">
  <svg class="boat" viewBox="0 0 220 120" aria-hidden="true">
    <g class="bob">
      <rect x="70" y="18" width="12" height="34" fill="#f2efe6" stroke="#111" stroke-width="3" />
      <rect x="100" y="12" width="12" height="40" fill="#f2efe6" stroke="#111" stroke-width="3" />
      <g class="smoke">
        <circle cx="76" cy="8" r="6" fill="#bbb" />
        <circle cx="108" cy="2" r="5" fill="#999" />
      </g>
      <rect x="50" y="50" width="100" height="20" fill="#f2efe6" stroke="#111" stroke-width="3" />
      <path d="M30 70 H180 L165 92 H45 Z" fill="#111" stroke="#f2efe6" stroke-width="3" />
      <g class="wheel">
        <circle cx="168" cy="72" r="16" fill="none" stroke="#f2efe6" stroke-width="3" />
        <path d="M168 56 V88 M152 72 H184 M157 61 L179 83 M179 61 L157 83" stroke="#f2efe6" stroke-width="2" />
      </g>
    </g>
    <path class="waves" d="M0 100 Q15 92 30 100 T60 100 T90 100 T120 100 T150 100 T180 100 T210 100 T240 100" fill="none" stroke="#f2efe6" stroke-width="3" />
  </svg>

  <div class="intertitle">
    <div class="flourish">❦ ❦ ❦</div>
    <h1>{t('title.name')}</h1>
    <p class="tagline">{t('title.tagline')}</p>
    <div class="buttons">
      <button onclick={onstart}>{t('title.start')}</button>
      <button class="ghost" onclick={() => (showHowTo = true)}>{t('title.howTo')}</button>
    </div>
    <p class="best">
      {#if !best}{t('title.noBest')}
      {:else if best.victory}{t('title.bestVictory', { months: best.months })}
      {:else}{t('title.best', { months: best.months })}{/if}
    </p>
  </div>

  {#if showHowTo}
    <div class="overlay">
      <div class="intertitle howto">
        <h2>{t('title.howTo')}</h2>
        {#each t('title.howToBody').split('\n\n') as para}<p>{para}</p>{/each}
        <button onclick={() => (showHowTo = false)}>{t('title.close')}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .title {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    padding: 2rem 1rem;
  }
  .boat {
    width: min(360px, 80vw);
    margin: 0 auto;
    display: block;
  }
  .bob {
    animation: bob 1.6s ease-in-out infinite;
  }
  .wheel {
    transform-origin: 168px 72px;
    animation: spin 2s linear infinite;
  }
  .smoke {
    animation: smoke 1.2s steps(3) infinite;
  }
  .waves {
    animation: waves 1.2s linear infinite;
  }
  @keyframes bob { 50% { transform: translateY(3px) rotate(-1deg); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes smoke { 50% { transform: translate(-4px, -4px); opacity: 0.6; } }
  @keyframes waves { to { transform: translateX(-30px); } }
  .tagline {
    font-style: italic;
    color: var(--grey);
  }
  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1.5rem 0 1rem;
  }
  .best {
    color: var(--grey);
    margin: 0;
  }
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 20;
  }
  .howto {
    text-align: left;
    line-height: 1.5;
    max-height: 90vh;
    overflow: auto;
  }
  .howto h2,
  .howto button {
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
</style>
