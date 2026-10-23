<script lang="ts">
  import { t } from '../i18n';
  import WillieSays from './WillieSays.svelte';
  import type { Best } from './storage';

  interface Props {
    best: Best;
    /** Month of the voyage in progress, if any. */
    savedMonth: number | null;
    onstart: () => void;
    oncontinue: () => void;
  }
  let { best, savedMonth, onstart, oncontinue }: Props = $props();
  let showHowTo = $state(false);
  let confirmAbandon = $state(false);

  function newVoyage() {
    if (savedMonth) confirmAbandon = true;
    else onstart();
  }
</script>

<div class="title">
  <!-- A stern-wheeler steaming to the right: the wheel at the back turns so its
       lower paddles push the water astern; smoke trails back from three stacks
       that puff as they breathe; the river laps up over the hull. -->
  <svg class="boat" viewBox="0 -34 240 184" aria-hidden="true">
    <g class="bob">
      <!-- Smoke: particles rising from each stack, drifting astern -->
      {#each [{ x: 88, y: 50, n: 4 }, { x: 106, y: 28, n: 6 }, { x: 124, y: 40, n: 5 }] as stack, s (s)}
        {#each Array.from({ length: stack.n }) as _, i (i)}
          <circle
            class="puff"
            cx={stack.x}
            cy={stack.y}
            r={2.6 + (i % 3) * 0.8}
            fill={['#d9d6cd', '#b9b6ad', '#9a978f'][i % 3]}
            style="--d: {((i * 0.47 + s * 0.31) % 2.4).toFixed(2)}s; --dx: {-18 - i * 4}px; --dy: {-26 - (i % 3) * 6}px"
          />
        {/each}
      {/each}

      <!-- Stacks: short, tall, medium; each breathes on its own beat -->
      <g class="stack" style="--b: 0s"><rect x="83" y="52" width="10" height="24" fill="#f2efe6" stroke="#111" stroke-width="2.5" /><rect x="81" y="49" width="14" height="5" fill="#111" /></g>
      <g class="stack" style="--b: 0.5s"><rect x="101" y="30" width="10" height="46" fill="#f2efe6" stroke="#111" stroke-width="2.5" /><rect x="99" y="27" width="14" height="5" fill="#111" /></g>
      <g class="stack" style="--b: 1s"><rect x="119" y="42" width="10" height="34" fill="#f2efe6" stroke="#111" stroke-width="2.5" /><rect x="117" y="39" width="14" height="5" fill="#111" /></g>

      <!-- Pilot house -->
      <rect x="150" y="62" width="30" height="14" fill="#f2efe6" stroke="#111" stroke-width="2.5" />
      <rect x="160" y="65" width="10" height="6" fill="#111" />

      <!-- Main cabin with suit windows -->
      <rect x="66" y="76" width="124" height="20" fill="#f2efe6" stroke="#111" stroke-width="2.5" />
      {#each ['♠', '♡', '♢', '♣'] as suit, i (suit)}
        <text x={86 + i * 28} y="91" text-anchor="middle" font-size="13" fill="#111">{suit}</text>
      {/each}

      <!-- Hull, bow to the right -->
      <path d="M52 96 H206 L224 86 L208 116 H58 Z" fill="#111" stroke="#f2efe6" stroke-width="2.5" />

      <!-- Stern wheel -->
      <g class="wheel">
        <circle cx="36" cy="100" r="20" fill="none" stroke="#f2efe6" stroke-width="2.5" />
        <circle cx="36" cy="100" r="4" fill="#f2efe6" />
        {#each Array.from({ length: 8 }) as _, i (i)}
          <line x1="36" y1="100" x2={36 + 20 * Math.cos((i * Math.PI) / 4)} y2={100 + 20 * Math.sin((i * Math.PI) / 4)} stroke="#f2efe6" stroke-width="2" />
          <rect
            x={36 + 20 * Math.cos((i * Math.PI) / 4) - 3}
            y={100 + 20 * Math.sin((i * Math.PI) / 4) - 3}
            width="6"
            height="6"
            fill="#f2efe6"
            transform="rotate({i * 45} {36 + 20 * Math.cos((i * Math.PI) / 4)} {100 + 20 * Math.sin((i * Math.PI) / 4)})"
          />
        {/each}
      </g>
    </g>

    <!-- The river, over the hull and the bottom of the wheel (clipped to the picture) -->
    <defs>
      <clipPath id="river-clip"><rect x="0" y="-34" width="240" height="184" /></clipPath>
    </defs>
    <g clip-path="url(#river-clip)">
      <g class="waves back">
        <path d="M-30 110 Q-15 104 0 110 T30 110 T60 110 T90 110 T120 110 T150 110 T180 110 T210 110 T240 110 T270 110 T300 110 V150 H-30 Z" fill="#3a3935" />
        <path d="M-30 110 Q-15 104 0 110 T30 110 T60 110 T90 110 T120 110 T150 110 T180 110 T210 110 T240 110 T270 110 T300 110" fill="none" stroke="#9a978f" stroke-width="2" />
      </g>
      <g class="waves front">
        <path d="M-30 117 Q-15 110 0 117 T30 117 T60 117 T90 117 T120 117 T150 117 T180 117 T210 117 T240 117 T270 117 T300 117 V150 H-30 Z" fill="#2a2926" />
        <path d="M-30 117 Q-15 110 0 117 T30 117 T60 117 T90 117 T120 117 T150 117 T180 117 T210 117 T240 117 T270 117 T300 117" fill="none" stroke="#f2efe6" stroke-width="2.5" />
      </g>
    </g>
  </svg>

  <div class="intertitle">
    <div class="flourish">❦ ❦ ❦</div>
    <h1>{t('title.name')}</h1>
    <p class="tagline">{t('title.tagline')}</p>
    <div class="buttons">
      {#if savedMonth}
        <button onclick={oncontinue}>{t('title.continue', { month: savedMonth })}</button>
        <button class="ghost" onclick={newVoyage}>{t('title.newVoyage')}</button>
      {:else}
        <button onclick={onstart}>{t('title.start')}</button>
      {/if}
      <button class="ghost" onclick={() => (showHowTo = true)}>{t('title.howTo')}</button>
    </div>
    <p class="best">
      {#if !best.wins && !best.longest}{t('title.noBest')}
      {:else}{t('title.record', { wins: best.wins, months: best.longest })}{/if}
    </p>
  </div>

  {#if confirmAbandon}
    <div class="overlay">
      <div class="intertitle">
        <h2>{t('title.abandon')}</h2>
        <p>{t('title.abandonBody', { month: savedMonth ?? 0 })}</p>
        <div class="buttons">
          <button onclick={() => ((confirmAbandon = false), onstart())}>{t('title.abandonYes')}</button>
          <button class="ghost" onclick={() => (confirmAbandon = false)}>{t('title.abandonNo')}</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showHowTo}
    <WillieSays title={t('title.howTo')} onclose={() => (showHowTo = false)}>
      {#each t('title.howToBody').split('\n\n') as para}<p>{para}</p>{/each}
    </WillieSays>
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
    width: min(380px, 84vw);
    margin: 0 auto;
    display: block;
    overflow: visible;
  }
  .bob {
    transform-box: fill-box;
    transform-origin: center;
    animation: bob 1.6s ease-in-out infinite;
  }
  .wheel {
    transform-box: fill-box;
    transform-origin: center;
    animation: spin 2.4s linear infinite;
  }
  .stack {
    transform-box: fill-box;
    transform-origin: bottom center;
    animation: breathe 1.5s ease-in-out var(--b) infinite;
  }
  .puff {
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: puff 2.4s ease-out var(--d) infinite;
  }
  .waves.front {
    animation: waves 1.3s linear infinite;
  }
  .waves.back {
    animation: waves 2.1s linear infinite;
  }
  @keyframes bob { 50% { transform: translateY(3px) rotate(-1deg); } }
  /* Counter-clockwise: the lower paddles push the water astern as the boat goes right. */
  @keyframes spin { to { transform: rotate(-360deg); } }
  @keyframes breathe {
    0%, 100% { transform: scale(1, 1); }
    40% { transform: scale(1.12, 0.92); }
    60% { transform: scale(0.94, 1.06); }
  }
  @keyframes puff {
    0% { transform: translate(0, 0) scale(0.4); opacity: 0.95; }
    70% { opacity: 0.5; }
    100% { transform: translate(var(--dx), var(--dy)) scale(2.4); opacity: 0; }
  }
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
</style>
