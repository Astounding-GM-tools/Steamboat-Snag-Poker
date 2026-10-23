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
  /** How many taglines the language file has (title.tagline.0 … n-1); one is picked per visit. */
  const TAGLINES = 12;
  const tagline = Math.floor(Math.random() * TAGLINES);
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
    <!-- The whole scene fades softly into the dark at its edges -->
    <defs>
      <radialGradient id="scene-fade-gradient" cx="50%" cy="45%" r="62%">
        <stop offset="70%" stop-color="#fff" />
        <stop offset="100%" stop-color="#000" />
      </radialGradient>
      <mask id="scene-fade" maskUnits="userSpaceOnUse" x="0" y="-34" width="240" height="184">
        <rect x="0" y="-34" width="240" height="184" fill="url(#scene-fade-gradient)" />
      </mask>
    </defs>
    <g mask="url(#scene-fade)">
    <!-- Background, slowest first: soft suit-shaped clouds, then the far bank -->
    <defs>
      <filter id="soft-cloud" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" /></filter>
      <clipPath id="sky-clip"><rect x="0" y="-34" width="240" height="184" /></clipPath>
    </defs>
    <g clip-path="url(#sky-clip)">
      <!-- Night: twinkling stars and a moon on a very slow arc -->
      {#each [{ x: 60.3, y: 8.1, r: 0.9, d: 3.2, dl: 2.5 }, { x: 20.9, y: -29.1, r: 1.3, d: 2.4, dl: 0.9 }, { x: 233.0, y: 2.9, r: 1.3, d: 2.9, dl: 2.6 }, { x: 40.3, y: 14.4, r: 1.3, d: 3.1, dl: 3.0 }, { x: 159.1, y: -25.5, r: 1.2, d: 3.2, dl: 1.2 }, { x: 13.1, y: 30.6, r: 1.0, d: 3.5, dl: 3.5 }, { x: 168.8, y: 34.5, r: 0.9, d: 3.7, dl: 1.8 }, { x: 219.3, y: 31.5, r: 0.7, d: 2.1, dl: 0.9 }, { x: 226.1, y: 0.5, r: 1.1, d: 2.5, dl: 2.0 }, { x: 94.0, y: -5.4, r: 1.1, d: 3.2, dl: 3.6 }, { x: 161.5, y: 35.0, r: 1.3, d: 4.2, dl: 2.7 }, { x: 43.2, y: 30.2, r: 1.4, d: 4.0, dl: 2.3 }, { x: 168.8, y: -15.2, r: 1.3, d: 3.2, dl: 1.1 }, { x: 20.5, y: 29.8, r: 1.4, d: 2.0, dl: 3.2 }] as star, i (i)}
        <circle class="star" cx={star.x} cy={star.y} r={star.r} fill="#f2efe6" style="--d: {star.d}s; --dl: {star.dl}s" />
      {/each}
      <g class="moon">
        <circle cx="190" cy="-6" r="13" fill="#f2efe6" opacity="0.18" filter="url(#soft-cloud)" />
        <circle cx="190" cy="-6" r="9" fill="#e9e5da" />
        <circle cx="187" cy="-8" r="2" fill="#cfcbc1" />
        <circle cx="193" cy="-3" r="1.4" fill="#cfcbc1" />
        <circle cx="192" cy="-10" r="1" fill="#cfcbc1" />
      </g>
      {#each [{ s: '♠', y: -4, size: 58, dur: 70, delay: 0 }, { s: '♥', y: 22, size: 22, dur: 52, delay: -12 }, { s: '♦', y: -20, size: 34, dur: 60, delay: -30 }, { s: '♣', y: 8, size: 76, dur: 88, delay: -45 }, { s: '♠', y: 30, size: 16, dur: 44, delay: -26 }, { s: '♥', y: -12, size: 44, dur: 76, delay: -60 }] as cloud, i (i)}
        <text class="cloud" x="260" y={cloud.y} font-size={cloud.size} fill="#8f8c84" fill-opacity="0.5" filter="url(#soft-cloud)" style="--dur: {cloud.dur}s; --delay: {cloud.delay}s">{cloud.s}</text>
      {/each}
      <path class="bank" d="M-120 106 Q-115.0 88.0 -110.0 106 L-106.0 92.0 L-102.0 106 Q-95.0 84.0 -88.0 106 Q-84.0 92.0 -80.0 106 L-77.0 95.0 L-74.0 106 Q-68.0 86.0 -62.0 106 L-57.5 90.0 L-53.0 106 Q-48.0 90.0 -43.0 106 Q-35.0 82.0 -27.0 106 L-23.5 94.0 L-20.0 106 Q-15.0 88.0 -10.0 106 L-6.0 92.0 L-2.0 106 Q5.0 84.0 12.0 106 Q16.0 92.0 20.0 106 L23.0 95.0 L26.0 106 Q32.0 86.0 38.0 106 L42.5 90.0 L47.0 106 Q52.0 90.0 57.0 106 Q65.0 82.0 73.0 106 L76.5 94.0 L80.0 106 Q85.0 88.0 90.0 106 L94.0 92.0 L98.0 106 Q105.0 84.0 112.0 106 Q116.0 92.0 120.0 106 L123.0 95.0 L126.0 106 Q132.0 86.0 138.0 106 L142.5 90.0 L147.0 106 Q152.0 90.0 157.0 106 Q165.0 82.0 173.0 106 L176.5 94.0 L180.0 106 Q185.0 88.0 190.0 106 L194.0 92.0 L198.0 106 Q205.0 84.0 212.0 106 Q216.0 92.0 220.0 106 L223.0 95.0 L226.0 106 Q232.0 86.0 238.0 106 L242.5 90.0 L247.0 106 Q252.0 90.0 257.0 106 Q265.0 82.0 273.0 106 L276.5 94.0 L280.0 106 Q285.0 88.0 290.0 106 L294.0 92.0 L298.0 106 Q305.0 84.0 312.0 106 Q316.0 92.0 320.0 106 L323.0 95.0 L326.0 106 Q332.0 86.0 338.0 106 L342.5 90.0 L347.0 106 Q352.0 90.0 357.0 106 Q365.0 82.0 373.0 106 L376.5 94.0 L380.0 106 Q385.0 88.0 390.0 106 L394.0 92.0 L398.0 106 Q405.0 84.0 412.0 106 Q416.0 92.0 420.0 106 L423.0 95.0 L426.0 106 Q432.0 86.0 438.0 106 L442.5 90.0 L447.0 106 Q452.0 90.0 457.0 106 Q465.0 82.0 473.0 106 L476.5 94.0 L480.0 106 V112 H-120 Z" fill="#4f4d48" />
    </g>

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

      <!-- Stern wheel, partly hidden behind the hull -->
      <g class="wheel">
        <circle cx="52" cy="97" r="20" fill="none" stroke="#f2efe6" stroke-width="2.5" />
        <circle cx="52" cy="97" r="4" fill="#f2efe6" />
        {#each Array.from({ length: 8 }) as _, i (i)}
          <line x1="52" y1="97" x2={52 + 20 * Math.cos((i * Math.PI) / 4)} y2={97 + 20 * Math.sin((i * Math.PI) / 4)} stroke="#f2efe6" stroke-width="2" />
          <rect
            x={52 + 20 * Math.cos((i * Math.PI) / 4) - 3}
            y={97 + 20 * Math.sin((i * Math.PI) / 4) - 3}
            width="6"
            height="6"
            fill="#f2efe6"
            transform="rotate({i * 45} {52 + 20 * Math.cos((i * Math.PI) / 4)} {97 + 20 * Math.sin((i * Math.PI) / 4)})"
          />
        {/each}
      </g>
      <!-- Hull, bow to the right -->
      <path d="M52 96 H206 L224 86 L208 116 H58 Z" fill="#111" stroke="#f2efe6" stroke-width="2.5" />

    </g>

    <!-- The river, over the hull and the bottom of the wheel (clipped to the picture) -->
    <defs>
      <clipPath id="river-clip"><rect x="0" y="-34" width="240" height="184" /></clipPath>
    </defs>
    <g clip-path="url(#river-clip)">
      <g class="waves back">
        <path d="M-60 110 Q-45 104 -30 110 T0 110 T30 110 T60 110 T90 110 T120 110 T150 110 T180 110 T210 110 T240 110 T270 110 T300 110 T330 110 T360 110 T390 110 T420 110 V150 H-60 Z" fill="#3a3935" />
        <path d="M-60 110 Q-45 104 -30 110 T0 110 T30 110 T60 110 T90 110 T120 110 T150 110 T180 110 T210 110 T240 110 T270 110 T300 110 T330 110 T360 110 T390 110 T420 110" fill="none" stroke="#9a978f" stroke-width="2" />
      </g>
      <g class="waves front">
        <path d="M-60 117 Q-45 110 -30 117 T0 117 T30 117 T60 117 T90 117 T120 117 T150 117 T180 117 T210 117 T240 117 T270 117 T300 117 T330 117 T360 117 T390 117 T420 117 V150 H-60 Z" fill="#2a2926" />
        <path d="M-60 117 Q-45 110 -30 117 T0 117 T30 117 T60 117 T90 117 T120 117 T150 117 T180 117 T210 117 T240 117 T270 117 T300 117 T330 117 T360 117 T390 117 T420 117" fill="none" stroke="#f2efe6" stroke-width="2.5" />
      </g>
    </g>
    </g>
  </svg>

  <div class="intertitle">
    <div class="flourish">❦ ❦ ❦</div>
    <h1>{t('title.name')}</h1>
    <p class="tagline">{t(`title.tagline.${tagline}`)}</p>
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
    /* Its own stacking order keeps the animated picture in step with the film overlay. */
    position: relative;
    z-index: 0;
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
  .star {
    animation: twinkle var(--d) ease-in-out var(--dl) infinite;
  }
  .moon {
    /* Pivot far below the picture: the moon crosses the sky on a gentle arc. */
    transform-origin: 120px 420px;
    animation: moon 240s ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.15; }
  }
  @keyframes moon {
    from { transform: rotate(3deg); }
    to { transform: rotate(-14deg); }
  }
  .cloud {
    animation: cloud var(--dur) linear var(--delay) infinite;
  }
  .bank {
    animation: bank 16s linear infinite;
  }
  /* Clouds cross the whole sky; the bank repeats every 100 units, so its loop is seamless. */
  @keyframes cloud { to { transform: translateX(-300px); } }
  @keyframes bank { to { transform: translateX(-100px); } }
  @keyframes bob { 50% { transform: translateY(3px) rotate(-1deg); } }
  /* Clockwise: the lower paddles sweep left, pushing the water astern as the boat goes right. */
  @keyframes spin { to { transform: rotate(360deg); } }
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
  /* One full wavelength per loop, so the last frame matches the first. */
  @keyframes waves { to { transform: translateX(-60px); } }
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
