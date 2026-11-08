<script lang="ts">
  import { untrack } from 'svelte';
  import Portrait from '../portrait/Portrait.svelte';
  import type { MoodBlend } from '../portrait/faces';

  /**
   * The Sandbar, as a picture that keeps the score: the Best Intentions run
   * aground on Sandy's heap, and the heap is his pile. Win a pot and sand
   * drifts off downstream and the heap goes down; lose one and your stake
   * turns to sand on it and the heap goes up. Clear it and she floats. The
   * troubles he holds (a broken pole, a paddle, an axle) stick out of the
   * sand until they're yours. See docs/art.md: the scene is the score.
   */
  let {
    pile,
    start,
    mood = 'neutral',
    snags = [],
  }: {
    /** Sandy's pile now. */
    pile: number;
    /** His pile when the day began: the heap's full size. */
    start: number;
    mood?: MoodBlend;
    /** The snags he holds, by index (the troubles show in the sand). */
    snags?: number[];
  } = $props();

  /** The heap's size: by area, so it reads true; never quite nothing until it is. */
  const size = $derived(pile <= 0 ? 0 : Math.max(0.3, Math.min(1.3, Math.sqrt(pile / Math.max(1, start)))));
  const afloat = $derived(pile <= 0);

  // Sand on the move: off downstream when the heap goes down, onto it when it goes up.
  let drifts = $state<{ id: number; dir: 'off' | 'on' }[]>([]);
  let last = untrack(() => pile);
  let next = 0;
  $effect(() => {
    const now = pile;
    untrack(() => {
      if (now !== last) {
        const id = ++next;
        drifts = [...drifts, { id, dir: now < last ? 'off' : 'on' }];
        setTimeout(() => (drifts = drifts.filter((d) => d.id !== id)), 2000);
      }
      last = now;
    });
  });

  const has = (index: number) => snags.includes(index);
  const GRAINS = Array.from({ length: 14 }, (_, i) => ({ dx: 8 + ((i * 37) % 50), dy: ((i * 13) % 11) - 4, delay: (i % 7) * 0.07, r: 0.9 + (i % 3) * 0.4 }));
</script>

<div class="scene" class:afloat>
  <svg class="river" viewBox="0 0 240 120" aria-hidden="true">
    <!-- A few stars, and the far bank. -->
    {#each [[18, 14], [52, 8], [96, 20], [140, 10], [204, 16], [226, 6]] as [x, y], i (i)}
      <circle class="star" cx={x} cy={y} r={0.9} fill="#f2efe6" style="--d: {(i * 0.7) % 3}s" />
    {/each}
    <path d="M0 78 C30 74 60 76 90 75 C130 74 170 77 240 74 L240 80 L0 80 Z" fill="#3a3935" />
    {#each [8, 22, 34, 186, 200, 214, 228] as x, i (i)}
      <text x={x} y={78} font-size={10 + (i % 3) * 3} fill="#3a3935">{i % 2 ? '♣︎' : '♠︎'}</text>
    {/each}

    <!-- The Best Intentions, her bow up on the bar. -->
    <g class="boat">
      <g class="smoke">
        {#each [0, 1, 2] as i (i)}<circle class="puff" cx="62" cy="52" r={2 + i * 0.6} fill="#9a978f" style="--d: {i * 0.8}s" />{/each}
      </g>
      <rect x="58" y="52" width="7" height="22" fill="#f2efe6" stroke="#111" stroke-width="2" />
      <rect x="56.5" y="49.5" width="10" height="4" fill="#111" />
      <rect x="72" y="60" width="7" height="14" fill="#f2efe6" stroke="#111" stroke-width="2" />
      <rect x="70.5" y="57.5" width="10" height="4" fill="#111" />
      <rect x="92" y="64" width="20" height="10" fill="#f2efe6" stroke="#111" stroke-width="2" />
      <rect x="40" y="74" width="84" height="12" fill="#f2efe6" stroke="#111" stroke-width="2" />
      {#each ['♠︎', '♡︎', '♢︎', '♣︎'] as suit, i (suit)}<text x={52 + i * 19} y="83.5" text-anchor="middle" font-size="8" fill="#111">{suit}</text>{/each}
      <g class="wheel">
        <circle cx="32" cy="88" r="12" fill="none" stroke="#f2efe6" stroke-width="2" />
        {#each Array.from({ length: 6 }) as _, i (i)}<line x1="32" y1="88" x2={32 + 12 * Math.cos((i * Math.PI) / 3)} y2={88 + 12 * Math.sin((i * Math.PI) / 3)} stroke="#f2efe6" stroke-width="1.6" />{/each}
      </g>
      <path d="M30 86 H130 L142 80 L132 100 H36 Z" fill="#111" stroke="#f2efe6" stroke-width="2" />
      <!-- A pole over the bow: the crew, pushing. -->
      <path class="pole" d="M120 72 L150 100" stroke="#cfc8b4" stroke-width="2.2" stroke-linecap="round" />
    </g>

    <!-- The river, over the hull. -->
    <g class="waves">
      <path d="M-40 98 Q-30 94 -20 98 T0 98 T20 98 T40 98 T60 98 T80 98 T100 98 T120 98 T140 98 T160 98 T180 98 T200 98 T220 98 T240 98 T260 98 T280 98 V120 H-40 Z" fill="#2a2926" />
      <path d="M-40 98 Q-30 94 -20 98 T0 98 T20 98 T40 98 T60 98 T80 98 T100 98 T120 98 T140 98 T160 98 T180 98 T200 98 T220 98 T240 98 T260 98 T280 98" fill="none" stroke="#f2efe6" stroke-width="1.6" />
    </g>
  </svg>

  <!-- Sandy's heap: as big as his pile. -->
  <div class="heap" style="--size: {size}">
    <Portrait id="sandbar" {mood} backdrop="dark" />
    <svg class="troubles" viewBox="0 0 100 100" aria-hidden="true">
      {#if has(23)}
        <!-- A broken pole, snapped, stuck in the sand. -->
        <path d="M14 88 L6 58 M8 56 L2 44" stroke="#cfc8b4" stroke-width="4" stroke-linecap="round" />
        <path d="M14 88 L6 58 M8 56 L2 44" stroke="#111" stroke-width="1.2" stroke-linecap="round" fill="none" />
      {/if}
      {#if has(16)}
        <!-- A paddle board, split. -->
        <path d="M80 92 L92 64 L98 67 L86 95 Z" fill="#f2efe6" stroke="#111" stroke-width="2" />
        <path d="M90 70 L86 76 L92 80" fill="none" stroke="#111" stroke-width="1.4" />
      {/if}
      {#if has(15)}
        <!-- A twisted axle. -->
        <path d="M66 96 C70 86 62 82 68 72 C72 66 76 70 80 62" fill="none" stroke="#111" stroke-width="3.4" stroke-linecap="round" />
      {/if}
    </svg>
  </div>

  <!-- Sand on the move. -->
  <svg class="drift" viewBox="0 0 240 120" aria-hidden="true">
    {#each drifts as drift (drift.id)}
      {#each GRAINS as g, i (i)}
        <circle class="grain {drift.dir}" cx={drift.dir === 'off' ? 182 : 120} cy={drift.dir === 'off' ? 92 : 74} r={g.r} fill="#cfc8b4" style="--dx: {g.dx}px; --dy: {g.dy}px; --delay: {g.delay}s" />
      {/each}
    {/each}
  </svg>
</div>

<style>
  .scene {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 1;
    overflow: hidden;
    border-radius: 6px;
    background: radial-gradient(ellipse at 50% 30%, #1d1c1a, #0c0c0b);
  }
  .river,
  .drift {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .drift {
    pointer-events: none;
    z-index: 2;
  }
  /* The heap stands in the river to the right, its foot at the waterline, its size the score. */
  .heap {
    position: absolute;
    left: 53%;
    bottom: 13%;
    width: 44%;
    aspect-ratio: 1;
    transform: scale(var(--size));
    /* It shrinks away from the bow, not from it: her nose stays in the sand to the last. */
    transform-origin: 18% 92%;
    transition: transform 0.9s cubic-bezier(0.3, 1.3, 0.5, 1);
    z-index: 1;
  }
  .heap > :global(svg),
  .troubles {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  /* Aground: she lists, nose up. Afloat: level, and away she bobs. */
  .boat {
    transform-box: view-box;
    transform-origin: 90px 100px;
    transform: rotate(-3deg);
    transition: transform 1.2s ease-in-out;
  }
  .afloat .boat {
    transform: rotate(0deg);
    animation: bob 2.4s ease-in-out infinite;
  }
  @keyframes bob {
    50% {
      transform: translateY(-1.5px);
    }
  }
  .pole {
    transform-box: fill-box;
    transform-origin: 0 0;
    animation: push 1.8s ease-in-out infinite;
  }
  .afloat .pole {
    display: none;
  }
  @keyframes push {
    50% {
      transform: rotate(-4deg) translateX(-2px);
    }
  }
  .wheel {
    transform-box: fill-box;
    transform-origin: center;
  }
  .afloat .wheel {
    animation: turn 3s linear infinite;
  }
  @keyframes turn {
    to {
      transform: rotate(-360deg);
    }
  }
  .waves {
    animation: flow 6s linear infinite;
  }
  @keyframes flow {
    to {
      transform: translateX(40px);
    }
  }
  .puff {
    transform-box: fill-box;
    transform-origin: center;
    animation: puff 2.4s ease-out infinite;
    animation-delay: var(--d);
    opacity: 0;
  }
  @keyframes puff {
    10% {
      opacity: 0.8;
    }
    100% {
      opacity: 0;
      transform: translate(-14px, -22px) scale(2);
    }
  }
  .star {
    animation: twinkle 3s ease-in-out infinite;
    animation-delay: var(--d);
  }
  @keyframes twinkle {
    50% {
      opacity: 0.3;
    }
  }
  .grain {
    opacity: 0;
    animation: 1.6s ease-out forwards;
    animation-delay: var(--delay);
  }
  /* Off downstream, along the water. */
  .grain.off {
    animation-name: off;
  }
  @keyframes off {
    10% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--dx), var(--dy));
    }
  }
  /* Your stake, turned to sand, flung onto the heap. */
  .grain.on {
    animation-name: on;
  }
  @keyframes on {
    10% {
      opacity: 1;
    }
    50% {
      transform: translate(calc(var(--dx) * 0.6), -14px);
    }
    100% {
      opacity: 0;
      transform: translate(calc(var(--dx) + 20px), 4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scene * {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
