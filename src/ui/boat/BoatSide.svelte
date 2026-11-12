<script lang="ts">
  import Figure from './Figure.svelte';
  import {
    BOILER_DECK_END,
    CHIMNEY_TOP,
    CHIMNEYS,
    FIXED,
    FOLD,
    FOREDECK,
    HINGE,
    LEVEL,
    MODULES,
    STAGE_MAST,
    bayX,
    span,
    stations,
    wheel,
    type Built,
  } from './boat';

  /**
   * The *Best Intentions* side on, bow to the right: a sternwheel packet with two tall
   * hinged chimneys forward, the landing stage on its boom at the bow, the cabin on the
   * boiler deck, the texas and pilothouse on top. A `<g>` in boat units (see boat.ts), so
   * a scene places and scales it. `fold` lowers the chimneys (0 up, 1 down, for the Eads
   * Bridge); `night` lights the windows and brings out the card table.
   */
  let { built = {}, night = false, fold = 0, wobble = false }: { built?: Built; night?: boolean; fold?: number; wobble?: boolean } = $props();

  const w = $derived(wheel(built));
  const at = $derived(stations(built));
  const ang = $derived(-fold * FOLD);
  /** Where each chimney's crown is, folded or not: the smoke comes from there. */
  const tops = $derived(
    CHIMNEYS.map((x) => {
      const a = (fold * FOLD * Math.PI) / 180;
      const len = HINGE - CHIMNEY_TOP;
      return [x - len * Math.sin(a), HINGE - len * Math.cos(a)] as const;
    }),
  );
  const puffs = $derived(built.engine ? 6 : 4);

  /** The cabins on the boiler deck, aft to forward, with what their walls look like. */
  const cabins = $derived(
    [
      built.saloon ? { kind: 'saloon', bays: MODULES.saloon.bays! } : undefined,
      built.berths ? { kind: 'berths', bays: MODULES.berths.bays! } : undefined,
      { kind: 'office', bays: FIXED.office.bays },
    ].filter((c) => c !== undefined),
  );
  /** Roofs: over every cabin, and the fixed porch roof the chimneys come through. */
  const roofs = $derived([...cabins.filter((c) => c.kind !== 'office').map((c) => c.bays), FIXED.porchRoof.bays]);

  const SUITS = ['♠︎', '♡︎', '♢︎', '♣︎'];
  /** The black suits are drawn smaller in the font; these make all four look one size. */
  const SUIT_SIZE = [9, 7.4, 7.4, 9];
  /** Freight where nothing else stands: crates, bales, a barrel. */
  const freight = $derived([
    ...(built.galley ? [] : [bayX(2) + 3, bayX(3) + 2]),
    bayX(4) + 2,
    ...(built.patty ? [] : [FOREDECK[0] + 2, FOREDECK[0] + 12]),
  ]);
  const [b0, b1] = span(FIXED.boilers.bays);
  const [n0, n1] = span(FIXED.porchRoof.bays);
  const [t0, t1] = span(FIXED.texas.bays);
  const posts = Array.from({ length: Math.floor(BOILER_DECK_END / 8) + 1 }, (_, i) => 2 + i * 8);
</script>

<defs>
  <!-- A paper rim round the people, so they read on the dark main deck and the white cabin alike. -->
  <filter id="boat-halo" x="-50%" y="-50%" width="200%" height="200%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="0.55" result="grown" />
    <feFlood flood-color="#f2efe6" />
    <feComposite in2="grown" operator="in" result="rim" />
    <feMerge><feMergeNode in="rim" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
  <!-- Ink on paper: a slight tremble in every line. -->
  <filter id="boat-wobble" x="-20%" y="-40%" width="140%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" />
    <feDisplacementMap in="SourceGraphic" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
  </filter>
  <filter id="boat-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" /></filter>
  <radialGradient id="boat-lantern">
    <stop offset="0%" stop-color="#f2efe6" stop-opacity="0.75" />
    <stop offset="100%" stop-color="#f2efe6" stop-opacity="0" />
  </radialGradient>
  <clipPath id="boat-pilot-window"><rect x="111" y="-57" width="10" height="6" /></clipPath>
</defs>

<g class="side" class:night filter={wobble ? 'url(#boat-wobble)' : undefined}>
  <!-- The stern wheel, behind the hull, and the timbers that carry it -->
  <line class="spar" x1="2" y1={w.cy} x2={w.cx} y2={w.cy} />
  <line class="spar" x1="22" y1="-15" x2={w.cx} y2={w.cy} />
  <g class="wheel" style="transform-origin: {w.cx}px {w.cy}px; --spin: {w.period}s">
    <circle class="rim" cx={w.cx} cy={w.cy} r={w.r} />
    <circle class="rim" cx={w.cx} cy={w.cy} r={w.r * 0.55} />
    {#each Array.from({ length: 10 }) as _, i (i)}
      {@const a = (i * Math.PI) / 5}
      <line class="rim" x1={w.cx} y1={w.cy} x2={w.cx + w.r * Math.cos(a)} y2={w.cy + w.r * Math.sin(a)} />
      <line
        class="bucket"
        x1={w.cx + w.r * 0.72 * Math.cos(a)}
        y1={w.cy + w.r * 0.72 * Math.sin(a)}
        x2={w.cx + w.r * 1.08 * Math.cos(a)}
        y2={w.cy + w.r * 1.08 * Math.sin(a)}
      />
    {/each}
    <circle class="paper" cx={w.cx} cy={w.cy} r="2" />
  </g>

  <!-- The hull, bow to the right, and her rub rail -->
  <path class="hull" d="M 0 -8 H 196 Q 206 -9 214 -13 L 206 0 Q 200 3 190 3 H 8 Q 2 3 0 -1 Z" />
  <line class="spar" x1="1" y1="-5.5" x2="204" y2="-5.5" />

  <!-- Main deck: the engine room aft, the galley, freight, the boilers, Patty on the foredeck -->
  <g class="main">
    <rect class="paper" x={bayX(0)} y="-21" width={2 * 16} height="13" />
    <circle class="ink" cx={bayX(0) + 9} cy="-15" r="2.4" />
    <rect class="ink" x={bayX(0) + 20} y="-18" width="5" height="10" />

    {#if built.galley}
      {@const [g0, g1] = span(MODULES.galley.bays!)}
      <rect class="paper" x={g0} y="-21" width={g1 - g0} height="13" />
      <rect class="ink" x={g0 + 11} y="-18.5" width="6.5" height="10.5" />
      <rect class="window" x={g0 + 23} y="-18" width="5" height="4" />
      <text class="sign" x={g0 + 5} y="-17.6" text-anchor="middle">GALLEY</text>
      {#if at.cook}<g transform="translate({g0 + 14.2} -8)"><Figure doing="cook" hat="toque" /></g>{/if}
      {#each [0, 1, 2] as i (i)}
        <circle class="steam" cx={g0 + 25.5} cy="-18.5" r={1.2 + i * 0.3} style="--d: {i * 0.9}s" />
      {/each}
    {/if}

    {#each freight as x, i (i)}
      {#if i % 3 === 1}
        <rect class="paper" x={x} y="-15" width="11" height="7" rx="1.6" />
        <line class="ink-line" x1={x + 3.5} y1="-15" x2={x + 3.5} y2="-8" />
        <line class="ink-line" x1={x + 7.5} y1="-15" x2={x + 7.5} y2="-8" />
      {:else}
        <rect class="paper" x={x} y="-16" width="8" height="8" />
        <path class="ink-line" d="M {x} -16 L {x + 8} -8 M {x + 8} -16 L {x} -8" />
        <rect class="paper" x={x + 2} y="-21" width="5" height="5" />
      {/if}
    {/each}

    <!-- The boilers: three abreast, so one is seen; the fireboxes face forward -->
    <rect class="paper" x={b0} y="-18.5" width={b1 - b0} height="8" rx="4" />
    {#each [0.2, 0.45, 0.7] as f (f)}<line class="ink-line" x1={b0 + (b1 - b0) * f} y1="-18.5" x2={b0 + (b1 - b0) * f} y2="-10.5" />{/each}
    <rect class="ink" x={b1 - 2} y="-17" width="3" height="9" />
    <rect class="fire" x={b1 - 1.4} y="-15" width="1.8" height="4" />
    <!-- Cordwood for the firebox -->
    {#each [[160, -9.4], [163, -9.4], [166, -9.4], [161.5, -12.2], [164.5, -12.2], [163, -15]] as [x, y], i (i)}
      <circle class="paper" cx={x} cy={y} r="1.5" />
    {/each}
    {#if at.stoker}<g transform="translate({at.stoker.x} {at.stoker.y})"><Figure doing="stoke" hat="cap" flip delay={-0.4} /></g>{/if}

    {#if built.patty}
      <!-- Pretty Patty: a little runabout, high wheels and a tulip body, lashed on the foredeck -->
      <g class="patty">
        <path class="paper" d="M 174 -12 Q 172.6 -19 178.4 -19.4 L 183.6 -19.4 L 184.6 -14.6 L 193 -14.6 Q 195.6 -14.4 195.4 -12 Z" />
        <path class="ink-line" d="M 178 -19.4 Q 176.6 -23 180.4 -23.2 L 182 -23" />
        <line class="ink-line" x1="187" y1="-14.6" x2="185.4" y2="-21" />
        <circle class="ink" cx="185.4" cy="-21" r="0.6" />
        <circle class="paper" cx="195.6" cy="-15.6" r="1.3" />
        {#each [177.4, 190.4] as cx (cx)}
          <circle class="paper" cx={cx} cy="-11.6" r="3.6" />
          {#each [0, 1, 2, 3, 4, 5] as k (k)}
            <line class="ink-line" x1={cx} y1="-11.6" x2={cx + 3.4 * Math.cos((k * Math.PI) / 3)} y2={-11.6 + 3.4 * Math.sin((k * Math.PI) / 3)} />
          {/each}
          <circle class="ink" cx={cx} cy="-11.6" r="0.8" />
        {/each}
      </g>
    {/if}

    <!-- The landing stage, up on its boom at the bow, and its mast -->
    <line class="spar thick" x1={STAGE_MAST} y1="-8" x2={STAGE_MAST} y2="-54" />
    <line class="rope" x1={STAGE_MAST} y1="-53" x2="231" y2="-28.6" />
    <line class="rope" x1={STAGE_MAST} y1="-53" x2="216" y2="-20.2" />
    <line class="stage-edge" x1="198.5" y1="-10" x2="233" y2="-29" />
    <line class="stage" x1="198.5" y1="-10" x2="233" y2="-29" />
  </g>

  <!-- The deckhand on his beat along the main deck guard -->
  {#if at.deckhand}
    <g transform="translate({at.deckhand.x} {at.deckhand.y})">
      <g class="beat" style="--walk: {at.deckhand.walk}px; --dur: 22s"><Figure doing="walk" hat="cap" /></g>
    </g>
  {/if}

  <!-- The stanchions under the boiler deck guard -->
  {#each posts as x (x)}<line class="post" x1={x} y1="-8" x2={x} y2="-24" />{/each}

  <!-- The chimneys' lower ends, from the boilers up through the porch -->
  {#each CHIMNEYS as x (x)}<rect class="paper" x={x - 2.75} y={HINGE} width="5.5" height={LEVEL.boiler - HINGE} />{/each}

  <!-- The boiler deck's edge, deep enough to carry her name the length of her -->
  <rect class="paper" x="-1" y="-25.2" width={BOILER_DECK_END + 1} height="6.2" />
  <text class="name" x="99" y="-20.3" text-anchor="middle" textLength="96" lengthAdjust="spacing">BEST INTENTIONS</text>

  <!-- Cabins on the boiler deck -->
  {#each cabins as c (c.kind)}
    {@const [c0, c1] = span(c.bays)}
    <rect class="wall" x={c0} y="-36.5" width={c1 - c0} height="11.4" />
    {#if c.kind === 'berths'}
      {#each Array.from({ length: (c1 - c0) / 8 }) as _, i (i)}
        <rect class="ink" x={c0 + 2.3 + i * 8} y="-33.4" width="3.4" height="8.2" />
        <rect class="window" x={c0 + 2.3 + i * 8} y="-35.6" width="3.4" height="1.4" />
      {/each}
    {:else if c.kind === 'office'}
      <rect class="window" x={c0 + 3} y="-33.6" width="4" height="4.6" />
      <rect class="window" x={c0 + 11} y="-33.6" width="4" height="4.6" />
      <rect class="ink" x={c0 + 19} y="-34" width="4" height="8.8" />
      <rect class="window" x={c0 + 26} y="-33.6" width="4" height="4.6" />
    {/if}
  {/each}

  <!-- The promenade aft: a reader in a deck chair by day, the card game by lantern at night -->
  {#if at.cards}
    {#if night}
      <circle class="lantern-glow" cx={at.cards.x} cy={at.cards.y - 5} r="16" />
      <rect class="paper" x={at.cards.x - 3} y={at.cards.y - 4.2} width="6" height="0.9" />
      <line class="ink-line" x1={at.cards.x} y1={at.cards.y - 3.4} x2={at.cards.x} y2={at.cards.y} />
      <g transform="translate({at.cards.x - 6} {at.cards.y})"><Figure doing="cards" hat="bowler" delay={-1.2} /></g>
      <g transform="translate({at.cards.x + 6} {at.cards.y})"><Figure doing="deal" hat="cap" flip /></g>
      <rect class="lamp" x={at.cards.x - 0.9} y={at.cards.y - 7.4} width="1.8" height="3" rx="0.6" />
    {:else}
      <g transform="translate({at.cards.x - 2} {at.cards.y})"><Figure doing="read" hat="boater" delay={-3} /></g>
    {/if}
  {/if}

  <!-- A passenger promenading the guard in front of the staterooms -->
  {#if at.stroller}
    <g transform="translate({at.stroller.x} {at.stroller.y})">
      <g class="beat" style="--walk: {at.stroller.walk}px; --dur: 26s; --dl: -9s"><Figure doing="stroll" hat="boater" /></g>
    </g>
  {/if}

  <!-- The boiler deck railing: balusters and a rail, the whole length -->
  <line class="balusters" x1="0" y1="-27.2" x2={BOILER_DECK_END} y2="-27.2" />
  <line class="rail" x1="0" y1="-29.8" x2={BOILER_DECK_END} y2="-29.8" />

  <!-- The saloon's suits, one of each, painted over the railing too so they read whole -->
  {#if built.saloon}
    {@const [c0, c1] = span(MODULES.saloon.bays!)}
    {#each SUITS as suit, i (suit)}
      <text class="suit" x={c0 + ((c1 - c0) * (i + 0.5)) / 4} y="-30.4" font-size={SUIT_SIZE[i]} text-anchor="middle" dominant-baseline="central">{suit}</text>
    {/each}
  {/if}

  <!-- The fisherman on the guard, legs over the side -->
  {#if at.fisher}
    <g transform="translate({at.fisher.x} {at.fisher.y})"><Figure doing="fish" hat="boater" toWater={-at.fisher.y + 1} delay={-1.3} /></g>
  {/if}

  <!-- Roofs: the hurricane deck over each cabin, a scalloped fringe under its edge -->
  {#each roofs as bays, i (i)}
    {@const [r0, r1] = span(bays)}
    <line class="fringe" x1={r0} y1="-36.4" x2={r1} y2="-36.4" />
    <rect class="paper" x={r0 - 1} y="-39.4" width={r1 - r0 + 2} height="2.6" />
  {/each}
  <!-- The porch roof's fascia -->
  <line class="post" x1={n1} y1="-24" x2={n1} y2="-37" />
  <rect class="paper" x={n0 - 1} y="-42" width={n1 - n0 + 2} height="3" />

  <!-- The bandstand on the saloon roof, and the band -->
  {#if built.bandstand}
    {@const [s0, s1] = span(MODULES.bandstand.bays!)}
    {#if at.band}
      <!-- Drawn back to front: the bass behind the drums, the trombone behind the trumpet -->
      {#each [['bass', 13, 'bowler'], ['drums', 5, 'cap'], ['sax', 21, 'bowler'], ['trombone', 36, 'boater'], ['trumpet', 29, 'boater']] as const as [doing, dx, hat], i (doing)}
        <g transform="translate({s0 + dx} -38)"><Figure {doing} {hat} delay={-i * 0.17} /></g>
      {/each}
    {/if}
    {#each [s0 + 1, (s0 + s1) / 2, s1 - 1] as x (x)}<line class="post" x1={x} y1="-38" x2={x} y2="-57" />{/each}
    <path class="paper" d="M {s0 - 2} -56 L {(s0 + s1) / 2} -60 L {s1 + 2} -56 Z" />
    <path class="fringe-scallop" d="M {s0 - 2} -56 {Array.from({ length: 9 }, (_, i) => `q ${(s1 - s0 + 4) / 18} 1.6 ${(s1 - s0 + 4) / 9} 0`).join(' ')}" />
    <line class="spar" x1={(s0 + s1) / 2} y1="-60" x2={(s0 + s1) / 2} y2="-63.5" />
    <path class="pennant" d="M {(s0 + s1) / 2} -63.5 l 5 1 l -5 1 Z" />
  {/if}

  <!-- The texas, and the pilothouse on top with the pilot at the wheel -->
  <rect class="wall" x={t0} y={LEVEL.texas} width={t1 - t0} height={-42 - LEVEL.texas} />
  {#each [4, 10, 22, 28] as dx (dx)}<rect class="window" x={t0 + dx - 1.5} y="-45.6" width="3" height="2.6" />{/each}
  <rect class="paper" x={t0 - 1} y={LEVEL.texas - 1.2} width={t1 - t0 + 2} height="1.4" />
  <rect class="wall" x="109" y="-59" width="14" height="12" />
  <rect class="glass" x="111" y="-57" width="10" height="6" />
  {#if at.pilot}
    <g clip-path="url(#boat-pilot-window)"><g transform="translate({at.pilot.x} -48.6)"><Figure doing="pilot" hat="cap" /></g></g>
  {/if}
  <line class="mullion" x1="114.4" y1="-57" x2="114.4" y2="-51" />
  <line class="mullion" x1="117.7" y1="-57" x2="117.7" y2="-51" />
  <path class="paper" d="M 106.6 -59 L 125.4 -59 L 123 -61.4 L 109 -61.4 Z" />
  <circle class="ink" cx="116" cy="-62.6" r="1.2" />

  <!-- The chimneys, hinged at the hurricane deck: they fold back for the Eads Bridge -->
  {#each CHIMNEYS as x, i (x)}
    <g transform="rotate({ang} {x} {HINGE})">
      <g class="chimney" style="--b: {i * 0.5}s; transform-origin: {x}px {HINGE}px">
        <rect class="paper" x={x - 2.75} y={CHIMNEY_TOP} width="5.5" height={HINGE - CHIMNEY_TOP} />
        <line class="ink-line" x1={x - 2.75} y1={CHIMNEY_TOP + 12} x2={x + 2.75} y2={CHIMNEY_TOP + 12} />
        <!-- The crown: feathered points, the packet's pride -->
        <path
          class="crown"
          d="M {x - 3} {CHIMNEY_TOP} L {x - 5.6} {CHIMNEY_TOP - 5} L {x - 3} {CHIMNEY_TOP - 2.6} L {x - 1.6} {CHIMNEY_TOP - 6} L {x} {CHIMNEY_TOP - 3} L {x + 1.6} {CHIMNEY_TOP - 6} L {x + 3} {CHIMNEY_TOP - 2.6} L {x + 5.6} {CHIMNEY_TOP - 5} L {x + 3} {CHIMNEY_TOP} Z"
        />
      </g>
    </g>
    <circle class="hinge" cx={x} cy={HINGE} r="1" />
  {/each}

  <!-- Smoke from the crowns, drifting astern -->
  {#each tops as [x, y], s (s)}
    {#each Array.from({ length: puffs }) as _, i (i)}
      <circle
        class="puff"
        cx={x}
        cy={y - 5}
        r={2.4 + (i % 3) * 0.8}
        style="--d: {((i * 0.53 + s * 0.31) % 2.4).toFixed(2)}s; --dx: {-20 - i * 5}px; --dy: {-16 - (i % 3) * 6}px"
      />
    {/each}
  {/each}

</g>

<style>
  .side {
    --ink: #111;
    --paper: #f2efe6;
  }
  .side * {
    transform-box: view-box;
  }
  .paper,
  .wall {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 0.8;
  }
  .night .wall {
    fill: #8f8c84;
  }
  .ink {
    fill: var(--ink);
  }
  .ink-line {
    fill: none;
    stroke: var(--ink);
    stroke-width: 0.6;
  }
  .hull {
    fill: var(--ink);
    stroke: var(--paper);
    stroke-width: 1.4;
  }
  .spar {
    stroke: var(--paper);
    stroke-width: 1.2;
  }
  .spar.thick {
    stroke-width: 1.8;
  }
  .rope {
    stroke: var(--paper);
    stroke-width: 0.4;
  }
  .stage-edge {
    stroke: var(--ink);
    stroke-width: 3.4;
  }
  .stage {
    stroke: var(--paper);
    stroke-width: 2;
    stroke-dasharray: 3 0.6;
  }
  .post {
    stroke: var(--paper);
    stroke-width: 0.7;
  }
  .balusters {
    stroke: var(--paper);
    stroke-width: 4.8;
    stroke-dasharray: 0.45 1.8;
  }
  .rail {
    stroke: var(--paper);
    stroke-width: 0.9;
  }
  .fringe {
    stroke: var(--ink);
    stroke-width: 1.6;
    stroke-dasharray: 0.5 1;
  }
  .fringe-scallop {
    fill: none;
    stroke: var(--ink);
    stroke-width: 0.5;
  }
  .pennant {
    fill: var(--paper);
  }
  .window,
  .glass {
    fill: var(--ink);
  }
  .night .window {
    fill: var(--paper);
    filter: drop-shadow(0 0 1.2px #f2efe6);
  }
  .mullion {
    stroke: var(--paper);
    stroke-width: 0.6;
  }
  .suit {
    font-family: Georgia, 'Times New Roman', serif;
    fill: var(--ink);
  }
  .night .suit {
    fill: var(--paper);
    filter: drop-shadow(0 0 1.2px #f2efe6);
  }
  .sign {
    font-size: 2.2px;
    font-family: var(--title-font, Georgia, serif);
    fill: var(--ink);
  }
  .name {
    font-size: 5.2px;
    font-family: var(--title-font, Georgia, serif);
    fill: var(--ink);
  }
  .crown {
    fill: var(--ink);
    stroke: var(--paper);
    stroke-width: 0.5;
  }
  .hinge {
    fill: var(--ink);
  }
  .rim {
    fill: none;
    stroke: var(--paper);
    stroke-width: 0.9;
  }
  .bucket {
    stroke: var(--paper);
    stroke-width: 2.4;
  }
  .wheel {
    animation: spin var(--spin) linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .fire {
    fill: var(--paper);
    filter: url(#boat-glow);
    animation: flicker 0.7s steps(3) infinite alternate;
  }
  @keyframes flicker {
    from { opacity: 1; }
    to { opacity: 0.45; }
  }
  .lantern-glow {
    fill: url(#boat-lantern);
    animation: flicker 1.9s ease-in-out infinite alternate;
  }
  .lamp {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 0.4;
    filter: drop-shadow(0 0 1.5px #f2efe6);
  }
  .chimney {
    animation: breathe 1.5s ease-in-out var(--b) infinite;
  }
  @keyframes breathe {
    0%, 100% { transform: scale(1, 1); }
    40% { transform: scale(1.06, 0.985); }
    60% { transform: scale(0.97, 1.01); }
  }
  .puff {
    fill: #b9b6ad;
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: puff 2.4s ease-out var(--d) infinite;
  }
  .puff:nth-child(3n) {
    fill: #d9d6cd;
  }
  @keyframes puff {
    0% { transform: translate(0, 0) scale(0.4); opacity: 0.9; }
    70% { opacity: 0.45; }
    100% { transform: translate(var(--dx), var(--dy)) scale(2.4); opacity: 0; }
  }
  .steam {
    fill: var(--paper);
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: steam 2.7s ease-out var(--d) infinite;
  }
  @keyframes steam {
    0% { transform: translate(0, 0) scale(0.5); opacity: 0.7; }
    100% { transform: translate(-6px, -5px) scale(1.8); opacity: 0; }
  }
  /* A walker's beat: forward, turn about, back, turn about. */
  .beat {
    transform-origin: 0 0;
    animation: walk var(--dur) linear var(--dl, 0s) infinite;
  }
  @keyframes walk {
    0% { transform: translateX(0) scaleX(1); }
    46% { transform: translateX(var(--walk)) scaleX(1); }
    50% { transform: translateX(var(--walk)) scaleX(-1); }
    96% { transform: translateX(0) scaleX(-1); }
    100% { transform: translateX(0) scaleX(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .side * {
      animation: none !important;
    }
  }
</style>
