<script lang="ts">
  import BoatSide from './boat/BoatSide.svelte';
  import type { Built } from './boat/boat';

  /** What she has built so far: Bill's bare boat until the story says otherwise. */
  let { built = {} }: { built?: Built } = $props();

  /** Suit-shaped clouds of very different sizes; each gets a random tilt per visit. */
  const clouds = [
    { s: '♥\uFE0E', y: -6, size: 56, dur: 70, delay: 0 },
    { s: '♦\uFE0E', y: 22, size: 20, dur: 52, delay: -12 },
    { s: '♦\uFE0E', y: -20, size: 34, dur: 60, delay: -30 },
    { s: '♥\uFE0E', y: 6, size: 74, dur: 88, delay: -45 },
    { s: '♥\uFE0E', y: 30, size: 16, dur: 44, delay: -26 },
    { s: '♦\uFE0E', y: -10, size: 44, dur: 76, delay: -60 },
  ].map((c) => ({ ...c, tilt: Math.round(Math.random() * 70 - 35) }));
</script>

<!-- The Best Intentions under way: on the title, and between encounters. -->
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
  <!-- Background, slowest first: soft heart and diamond clouds, then copses of club and spade trees -->
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
      <circle cx="190" cy="-6" r="9" fill="#e5e5e5" />
      <circle cx="187" cy="-8" r="2" fill="#cbcbcb" />
      <circle cx="193" cy="-3" r="1.4" fill="#cbcbcb" />
      <circle cx="192" cy="-10" r="1" fill="#cbcbcb" />
    </g>
    {#each clouds as cloud, i (i)}
      <g class="cloud" style="--dur: {cloud.dur}s; --delay: {cloud.delay}s">
        <text
          x="260"
          y={cloud.y}
          font-size={cloud.size}
          fill="#8f8c84"
          fill-opacity="0.5"
          filter="url(#soft-cloud)"
          transform="rotate({cloud.tilt} {260 + cloud.size * 0.35} {cloud.y - cloud.size * 0.35})"
        >{cloud.s}</text>
      </g>
    {/each}
    <g class="bank">
      <rect x="-400" y="104" width="1100" height="8" fill="#5a5852" />
      {#each [{ x: -360.0, s: '♠\uFE0E', size: 29 }, { x: -345.1, s: '♣\uFE0E', size: 21 }, { x: -334.3, s: '♠\uFE0E', size: 21 }, { x: -310.8, s: '♣\uFE0E', size: 19 }, { x: -300.9, s: '♣\uFE0E', size: 27 }, { x: -286.9, s: '♠\uFE0E', size: 21 }, { x: -258.6, s: '♣\uFE0E', size: 18 }, { x: -249.4, s: '♣\uFE0E', size: 22 }, { x: -237.9, s: '♣\uFE0E', size: 18 }, { x: -228.9, s: '♠\uFE0E', size: 26 }, { x: -180.0, s: '♠\uFE0E', size: 29 }, { x: -165.1, s: '♣\uFE0E', size: 21 }, { x: -154.3, s: '♠\uFE0E', size: 21 }, { x: -130.8, s: '♣\uFE0E', size: 19 }, { x: -120.9, s: '♣\uFE0E', size: 27 }, { x: -106.9, s: '♠\uFE0E', size: 21 }, { x: -78.6, s: '♣\uFE0E', size: 18 }, { x: -69.4, s: '♣\uFE0E', size: 22 }, { x: -57.9, s: '♣\uFE0E', size: 18 }, { x: -48.9, s: '♠\uFE0E', size: 26 }, { x: 0.0, s: '♠\uFE0E', size: 29 }, { x: 14.9, s: '♣\uFE0E', size: 21 }, { x: 25.7, s: '♠\uFE0E', size: 21 }, { x: 49.2, s: '♣\uFE0E', size: 19 }, { x: 59.1, s: '♣\uFE0E', size: 27 }, { x: 73.1, s: '♠\uFE0E', size: 21 }, { x: 101.4, s: '♣\uFE0E', size: 18 }, { x: 110.6, s: '♣\uFE0E', size: 22 }, { x: 122.1, s: '♣\uFE0E', size: 18 }, { x: 131.1, s: '♠\uFE0E', size: 26 }, { x: 180.0, s: '♠\uFE0E', size: 29 }, { x: 194.9, s: '♣\uFE0E', size: 21 }, { x: 205.7, s: '♠\uFE0E', size: 21 }, { x: 229.2, s: '♣\uFE0E', size: 19 }, { x: 239.1, s: '♣\uFE0E', size: 27 }, { x: 253.1, s: '♠\uFE0E', size: 21 }, { x: 281.4, s: '♣\uFE0E', size: 18 }, { x: 290.6, s: '♣\uFE0E', size: 22 }, { x: 302.1, s: '♣\uFE0E', size: 18 }, { x: 311.1, s: '♠\uFE0E', size: 26 }, { x: 360.0, s: '♠\uFE0E', size: 29 }, { x: 374.9, s: '♣\uFE0E', size: 21 }, { x: 385.7, s: '♠\uFE0E', size: 21 }, { x: 409.2, s: '♣\uFE0E', size: 19 }, { x: 419.1, s: '♣\uFE0E', size: 27 }, { x: 433.1, s: '♠\uFE0E', size: 21 }, { x: 461.4, s: '♣\uFE0E', size: 18 }, { x: 470.6, s: '♣\uFE0E', size: 22 }, { x: 482.1, s: '♣\uFE0E', size: 18 }, { x: 491.1, s: '♠\uFE0E', size: 26 }, { x: 540.0, s: '♠\uFE0E', size: 29 }, { x: 554.9, s: '♣\uFE0E', size: 21 }, { x: 565.7, s: '♠\uFE0E', size: 21 }, { x: 589.2, s: '♣\uFE0E', size: 19 }, { x: 599.1, s: '♣\uFE0E', size: 27 }, { x: 613.1, s: '♠\uFE0E', size: 21 }, { x: 641.4, s: '♣\uFE0E', size: 18 }, { x: 650.6, s: '♣\uFE0E', size: 22 }, { x: 662.1, s: '♣\uFE0E', size: 18 }, { x: 671.1, s: '♠\uFE0E', size: 26 }] as tree, i (i)}
        <text x={tree.x} y="108" font-size={tree.size} fill="#5a5852">{tree.s}</text>
      {/each}
    </g>
  </g>

  <!-- The Best Intentions herself (src/ui/boat, docs/boat.md), at night, as built so far -->
  <g class="bob">
    <g transform="translate(45 112) scale(0.75)"><BoatSide {built} night /></g>
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

<style>
  .boat {
    width: var(--boat-width, min(380px, 84vw));
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
  .waves.front {
    animation: waves 2.8s linear infinite;
  }
  .waves.back {
    animation: waves 4.3s linear infinite;
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
    animation: bank 40s linear infinite;
  }
  /* Clouds cross the whole sky; the copses repeat every 180 units, so the bank loops seamlessly. */
  @keyframes cloud { to { transform: translateX(-300px); } }
  @keyframes bank { to { transform: translateX(-180px); } }
  @keyframes bob { 50% { transform: translateY(3px) rotate(-1deg); } }
  /* One full wavelength per loop, so the last frame matches the first. */
  @keyframes waves { to { transform: translateX(-60px); } }
</style>
