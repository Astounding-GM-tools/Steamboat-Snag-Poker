<script lang="ts">
  import { BOILER_DECK_END, BOW, FIXED, FOLD, MODULES, STAGE_MAST, span, wheel, type Built } from './boat';

  /**
   * The *Best Intentions* from above, for the river map: she turns to any heading and
   * never flips. The same bays and modules as the side view, seen as roofs. A `<g>` in
   * boat units, centred on her middle, bow along +x before `heading` (degrees, as the
   * map's `rotate`) turns her.
   *
   * The cheat that gives her height: whatever her heading, the upper decks, the chimneys
   * and the smoke lean a little toward the top of the screen, as if seen from a little
   * south of overhead; `lift` is how much (0 is straight down). Her shadow falls the
   * other way.
   */
  let {
    built = {},
    heading = 0,
    lift = 1,
    night = false,
    fold = 0,
  }: { built?: Built; heading?: number; lift?: number; night?: boolean; fold?: number } = $props();

  const MID = 100;
  const th = $derived((heading * Math.PI) / 180);
  /** A height, as a shift in her own frame that points up the screen. */
  const up = (h: number) => {
    const L = 10 * lift * h;
    return [-L * Math.sin(th), -L * Math.cos(th)] as const;
  };
  const tr = ([x, y]: readonly [number, number]) => `translate(${x.toFixed(2)} ${y.toFixed(2)})`;
  /** Her shadow: a fixed offset down and right on the screen, in her own frame. */
  const shadow = $derived.by(() => {
    const [a, b] = [2.5 * lift, 4 * lift];
    return [a * Math.cos(th) + b * Math.sin(th), -a * Math.sin(th) + b * Math.cos(th)] as const;
  });

  const w = $derived(wheel(built));
  const wheelAft = $derived(-3 - 2 * w.r);
  const HULL = `M 0 -19 H 150 Q 196 -19 ${BOW} 0 Q 196 19 150 19 H 0 Z`;

  const roofs = $derived(
    [built.saloon ? MODULES.saloon.bays! : undefined, built.berths ? MODULES.berths.bays! : undefined, FIXED.porchRoof.bays]
      .filter((b) => b !== undefined)
      .map(span),
  );
  const [t0, t1] = span(FIXED.texas.bays);

  /** The chimneys stand abreast; folded, they lie back toward the stern. */
  const a = $derived((fold * FOLD * Math.PI) / 180);
  const chimneys = $derived(
    [-7, 7].map((y) => {
      const base = up(0.45);
      const top = up(0.45 + 2.2 * Math.cos(a));
      return { base: [142 + base[0], y + base[1]] as const, top: [142 - 34 * Math.sin(a) + top[0], y + top[1]] as const };
    }),
  );
  const puffs = $derived(built.engine ? 6 : 4);
  const drift = (i: number) => {
    const u = up(0.8 + (i % 3) * 0.4);
    return [-18 - i * 5 + u[0], u[1]] as const;
  };
</script>

<defs>
  <radialGradient id="boat-top-lantern">
    <stop offset="0%" stop-color="#fff6d8" stop-opacity="0.9" />
    <stop offset="100%" stop-color="#fff6d8" stop-opacity="0" />
  </radialGradient>
  <clipPath id="boat-top-wheel"><rect x={wheelAft} y="-16" width={-3 - wheelAft} height="32" /></clipPath>
</defs>

<g class="top" class:night transform="rotate({heading})">
  <g transform="translate({-MID} 0)">
    <!-- Her shadow on the water -->
    <path class="shadow" d={HULL} transform={tr(shadow)} />
    <rect class="shadow" x={wheelAft} y="-16" width={-3 - wheelAft} height="32" transform={tr(shadow)} />

    <!-- The wheel astern: its top slats run forward as she drives -->
    <rect class="paper" x={wheelAft} y="-16" width={-3 - wheelAft} height="32" />
    <g clip-path="url(#boat-top-wheel)">
      <g class="slats" style="--spin: {w.period / 10}s">
        {#each Array.from({ length: Math.ceil(-wheelAft / 2.6) + 3 }) as _, i (i)}
          <line class="slat" x1={wheelAft - 2.6 + i * 2.6} y1="-16" x2={wheelAft - 2.6 + i * 2.6} y2="16" />
        {/each}
      </g>
    </g>
    <rect class="frame" x={wheelAft} y="-16" width={-3 - wheelAft} height="32" />

    <!-- The hull, its main deck open to the sky only forward of the boiler deck -->
    <path class="hull" d={HULL} />
    <path class="deck" d="M 150 -16.4 Q 190 -16.4 {BOW - 4} 0 Q 190 16.4 150 16.4 Z" />

    {#if built.patty}
      <g class="patty">
        {#each [[176, -5.6], [190, -5.6], [176, 5.6], [190, 5.6]] as [x, y], i (i)}<rect class="ink" x={x - 2} y={y - 0.9} width="4" height="1.8" />{/each}
        <rect class="paper" x="173" y="-4.6" width="23" height="9.2" rx="3.4" />
        <rect class="ink" x="177" y="-3.4" width="6" height="6.8" rx="1.2" />
        <circle class="paper" cx="195.4" cy="0" r="1.3" />
      </g>
    {:else}
      {#each [[174, -9], [184, -3], [176, 4]] as [x, y], i (i)}
        <rect class="paper" x={x} y={y} width="7" height="7" />
        <path class="line" d="M {x} {y} l 7 7 m 0 -7 l -7 7" />
      {/each}
    {/if}

    <!-- The landing stage on its boom, raised, and the mast -->
    <g transform={tr(up(0.35))}>
      <rect class="paper" x="196" y="-2.6" width="34" height="5.2" />
      {#each [202, 208, 214, 220, 226] as x (x)}<line class="line" x1={x} y1="-2.6" x2={x} y2="2.6" />{/each}
    </g>
    <circle class="ink" cx={STAGE_MAST} cy="0" r="1.6" transform={tr(up(0.6))} />

    <!-- The boiler deck, wider than the hull: the guards overhang her sides -->
    <g transform={tr(up(0.25))}>
      <path class="paper" d="M -1 -23 H {BOILER_DECK_END - 6} Q {BOILER_DECK_END} -23 {BOILER_DECK_END} -17 V 17 Q {BOILER_DECK_END} 23 {BOILER_DECK_END - 6} 23 H -1 Z" />
      {#each [-17, -11, 11, 17] as y (y)}<line class="plank" x1="0" y1={y} x2={BOILER_DECK_END - 2} y2={y} />{/each}
      {#if night}<circle class="lantern" cx="9" cy="0" r="22" />{/if}
      <!-- The card table on the promenade -->
      <rect class="paper" x="5.5" y="-3.5" width="7" height="7" />
    </g>

    <!-- The roofs: the hurricane deck over each cabin, with its skylight down the middle -->
    <g transform={tr(up(0.45))}>
      {#each roofs as [r0, r1], i (i)}
        <rect class="roof" x={r0 - 1} y="-17" width={r1 - r0 + 2} height="34" />
      {/each}
      {#each roofs as [r0, r1], i (i)}
        <rect class="skylight" x={r0 + 1} y="-3.4" width={r1 - r0 - 2} height="6.8" />
        {#each Array.from({ length: Math.floor((r1 - r0 - 2) / 4) }) as _, k (k)}
          <rect class="light" x={r0 + 2.4 + k * 4} y="-2.2" width="2" height="4.4" />
        {/each}
      {/each}
    </g>

    <!-- The bandstand: a little pavilion on the saloon roof -->
    {#if built.bandstand}
      {@const [s0, s1] = span(MODULES.bandstand.bays!)}
      <g transform={tr(up(0.75))}>
        <rect class="roof" x={s0 + 2} y="-10" width={s1 - s0 - 4} height="20" />
        <path class="line" d="M {s0 + 2} -10 L {(s0 + s1) / 2} 0 L {s1 - 2} -10 M {s0 + 2} 10 L {(s0 + s1) / 2} 0 L {s1 - 2} 10" />
        <circle class="ink" cx={(s0 + s1) / 2} cy="0" r="1" />
      </g>
    {/if}

    <!-- The texas, and the pilothouse on it -->
    <g transform={tr(up(0.65))}>
      <rect class="roof" x={t0} y="-8" width={t1 - t0} height="16" />
    </g>
    <g transform={tr(up(0.85))}>
      <rect class="roof" x="109" y="-7" width="14" height="14" />
      <path class="line" d="M 109 -7 L 123 7 M 123 -7 L 109 7" />
      <circle class="ink" cx="116" cy="0" r="1.4" />
    </g>

    <!-- The chimneys, standing up out of the picture, and their smoke -->
    {#each chimneys as c, i (i)}
      <line class="stack-rim" x1={c.base[0]} y1={c.base[1]} x2={c.top[0]} y2={c.top[1]} />
      <line class="stack" x1={c.base[0]} y1={c.base[1]} x2={c.top[0]} y2={c.top[1]} />
    {/each}
    {#each chimneys as c, i (i)}
      <circle class="crown" cx={c.top[0]} cy={c.top[1]} r="3.8" />
      <circle class="mouth" cx={c.top[0]} cy={c.top[1]} r="2" />
      {#each Array.from({ length: puffs }) as _, k (k)}
        {@const [dx, dy] = drift(k)}
        <circle
          class="puff"
          cx={c.top[0]}
          cy={c.top[1]}
          r={2.6 + (k % 3) * 0.8}
          style="--d: {((k * 0.53 + i * 0.31) % 2.4).toFixed(2)}s; --dx: {dx.toFixed(1)}px; --dy: {dy.toFixed(1)}px"
        />
      {/each}
    {/each}
  </g>
</g>

<style>
  .top {
    --ink: #111;
    --paper: #f2efe6;
  }
  .top * {
    transform-box: view-box;
  }
  .shadow {
    fill: #000;
    opacity: 0.22;
  }
  .hull {
    fill: var(--ink);
  }
  .deck {
    fill: #d9d4c4;
    stroke: var(--ink);
    stroke-width: 0.6;
  }
  .paper {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 0.9;
  }
  .roof {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .night .roof,
  .night .paper {
    fill: #bdb9ae;
  }
  .ink {
    fill: var(--ink);
  }
  .line,
  .plank {
    fill: none;
    stroke: var(--ink);
    stroke-width: 0.5;
  }
  .plank {
    stroke: #8a877f;
    stroke-width: 0.35;
  }
  .skylight {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 0.6;
  }
  .light {
    fill: var(--ink);
  }
  .night .light {
    fill: #fff6d8;
    filter: drop-shadow(0 0 1.4px #fff6d8);
  }
  .lantern {
    fill: url(#boat-top-lantern);
  }
  .frame {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .slat {
    stroke: var(--ink);
    stroke-width: 1;
  }
  .slats {
    animation: slats var(--spin) linear infinite;
  }
  @keyframes slats {
    to {
      transform: translateX(2.6px);
    }
  }
  .stack-rim {
    stroke: var(--paper);
    stroke-width: 6.6;
    stroke-linecap: round;
  }
  .stack {
    stroke: var(--ink);
    stroke-width: 5;
    stroke-linecap: round;
  }
  .crown {
    fill: var(--ink);
    stroke: var(--paper);
    stroke-width: 0.7;
  }
  .mouth {
    fill: #3a3936;
  }
  .puff {
    fill: #4a4843;
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: puff 2.4s ease-out var(--d) infinite;
  }
  @keyframes puff {
    0% { transform: translate(0, 0) scale(0.4); opacity: 0.75; }
    70% { opacity: 0.3; }
    100% { transform: translate(var(--dx), var(--dy)) scale(2.4); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .top * {
      animation: none !important;
    }
  }
</style>
