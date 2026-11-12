<script lang="ts">
  /**
   * The river beneath the felt: the leg's map, behind everything, with the
   * Best Intentions on it at `t`. Steaming, it follows her at a leisurely
   * height, the travelled channel drawn behind her. At play (an encounter, or
   * a game on deck), it closes in on her spot, dimmed, warmed and softened so
   * the cards read over it, and she fades: the table is there now.
   *
   * It comes in with the felt lifting off it (black fading away). Without the
   * tiles (they're served apart from the game: public/maptiles in
   * development), it stays the black felt, and nothing else changes.
   */
  import { Tween } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import TileMap from './TileMap.svelte';
  import { course as forked, route, type Pt, type TravelSidecar } from './route';
  import { loadLeg, MAP_ROOT as ROOT } from './legs';
  import { voyage } from './tuning.svelte';

  interface Props {
    leg: string;
    t: number;
    mode: 'steam' | 'play';
    /** It hits her: the map lurches too. */
    jolt?: boolean;
    /** Round the islands, the passages chosen (by island key). */
    lanes?: Record<string, 'left' | 'right'>;
    /** Crates bobbing in the water, still to be picked up (map px). */
    crates?: Pt[];
    /** Something ahead to see before she gets there (an island to choose a way round): the view leans towards it. */
    ahead?: Pt | null;
  }
  let { leg, t, mode, jolt = false, lanes = {}, crates = [], ahead = null }: Props = $props();

  let sidecar = $state<TravelSidecar | null>(null);
  $effect(() => {
    const id = leg;
    loadLeg(id).then((s) => {
      if (leg === id) sidecar = s;
    });
  });

  /** The channel, round the islands by the passages chosen. */
  const course = $derived(sidecar ? forked(route(sidecar.path.px[0], sidecar.stops), leg, sidecar.islands ?? [], lanes) : null);
  const boat = $derived(course?.at(t));
  const wake = $derived(course ? course.line(0, t) : []);

  /** log2 of the scale: steaming, high enough to see the river's bends; at play, down on her. */
  const zoom = new Tween(voyage.steamZoom, { duration: 1100, easing: cubicInOut });
  $effect(() => {
    zoom.target = mode === 'play' ? voyage.playZoom : voyage.steamZoom;
  });
  /** How far the view leans towards what's ahead (0: on her). */
  const lean = new Tween(0, { duration: 1400, easing: cubicInOut });
  let leanTo = $state<Pt | null>(null);
  $effect(() => {
    if (ahead) leanTo = ahead;
    lean.target = ahead ? 0.65 : 0;
  });
  const center = $derived.by<Pt>(() => {
    if (!boat) return [0, 0];
    const [bx, by] = boat.p, k = lean.current, a = leanTo ?? boat.p;
    return [bx + k * (a[0] - bx), by + k * (a[1] - by)];
  });
  const scale = $derived(2 ** zoom.current);

  const pts = (p: readonly Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const deg = $derived(boat ? (boat.heading * 180) / Math.PI : 0);
  /** Heading west she'd be upside down: flip her instead. */
  const flip = $derived(Math.abs(deg) > 90 ? -1 : 1);
</script>

<div class="backdrop" class:play={mode === 'play'} class:jolt aria-hidden="true">
  {#if sidecar && boat}
    <div class="map">
      <TileMap base="{ROOT}{leg}/travel/" tiles={sidecar.tiles} {center} {scale}>
        <polyline points={pts(wake)} class="wake" style:stroke-width="{3 * voyage.boatSize}px" />
        {#each crates as c, i (i)}
          <!-- A crate adrift: what she picks up if she goes that way. -->
          <g class="crate" transform="translate({c[0]} {c[1]}) scale({voyage.boatSize / scale})" style:animation-delay="{i * -0.7}s">
            <rect class="ink" x="-4" y="-4" width="8" height="8" />
            <path class="paper" d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#f4ecd8" stroke-width="1" />
          </g>
        {/each}
        <g class="boat" transform="translate({boat.p[0]} {boat.p[1]}) scale({voyage.boatSize / scale}) rotate({deg}) scale(1 {flip})">
          <!-- A sternwheeler side on, bow to the right: hull, cabin, two chimneys, the wheel astern. -->
          <path class="ink" d="M -17 2 L 16 2 L 19 -1 L 19 3 Q 15 7 -15 7 Z" />
          <rect class="ink" x="-12" y="-4" width="20" height="6" />
          <rect class="paper" x="-10" y="-3" width="2" height="2" />
          <rect class="paper" x="-6" y="-3" width="2" height="2" />
          <rect class="paper" x="-2" y="-3" width="2" height="2" />
          <rect class="paper" x="2" y="-3" width="2" height="2" />
          <rect class="ink" x="-8" y="-8" width="12" height="4" />
          <rect class="ink" x="5" y="-15" width="2.2" height="11" />
          <rect class="ink" x="9" y="-15" width="2.2" height="11" />
          <circle class="wheel" cx="-19" cy="1" r="4.5" />
          <circle class="puff one" cx="8" cy="-19" r="2.5" />
          <circle class="puff two" cx="6" cy="-22" r="3.2" />
        </g>
      </TileMap>
    </div>
  {/if}
  <!-- The projector's lamp: bright in the middle, falling away to black at the edges, so the chart's own edges never show hard. -->
  <div class="lamp"></div>
  <!-- The felt: black over the map, lifted off it as she sets out. -->
  <div class="felt"></div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: #000;
  }
  /* Off the chart is the dark of the table it lies on. */
  .map :global(.map) {
    background: transparent;
  }
  .map {
    position: absolute;
    inset: 0;
    transition: filter 1.1s ease;
  }
  /* At play: dimmed, warmed towards sepia, softened, and darker where the cards lie. */
  .play .map {
    filter: brightness(0.5) sepia(0.55) contrast(0.9) blur(1.2px);
  }
  .backdrop::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 55%, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.15) 75%, transparent);
    opacity: 0;
    transition: opacity 1.1s ease;
  }
  .play::after {
    opacity: 1;
  }
  .lamp {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 75% 70% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.45) 60%, rgba(0, 0, 0, 0.85) 85%, #000 100%);
  }
  .felt {
    position: absolute;
    inset: 0;
    background: #000;
    animation: lift 1.8s ease-in 0.5s both;
  }
  @keyframes lift {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  .jolt .map {
    animation: jolt 0.55s ease-out;
  }
  @keyframes jolt {
    12% {
      transform: translate(-18px, 12px) rotate(-1.2deg) scale(1.03);
    }
    30% {
      transform: translate(12px, -8px) rotate(0.9deg) scale(1.02);
    }
    55% {
      transform: translate(-6px, 3px) rotate(-0.4deg);
    }
  }
  .wake {
    fill: none;
    stroke: #6b2a1c;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-opacity: 0.8;
    vector-effect: non-scaling-stroke;
  }
  .boat {
    transition: opacity 0.8s ease;
  }
  .crate {
    animation: bob 2.2s ease-in-out infinite;
    transform-box: fill-box;
  }
  .play .crate {
    opacity: 0;
  }
  @keyframes bob {
    50% {
      translate: 0 1.5px;
    }
  }
  .play .boat {
    opacity: 0;
  }
  .ink {
    fill: #15130f;
    stroke: #f4ecd8;
    stroke-width: 0.8;
    paint-order: stroke;
  }
  .paper {
    fill: #f4ecd8;
  }
  .wheel {
    fill: none;
    stroke: #15130f;
    stroke-width: 2;
    stroke-dasharray: 2 1.5;
  }
  .puff {
    fill: #f4ecd8;
    stroke: #15130f;
    stroke-width: 0.8;
    animation: puff 1.6s ease-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .puff.two {
    animation-delay: 0.8s;
  }
  @keyframes puff {
    from {
      opacity: 0.9;
      transform: translate(0, 0) scale(0.6);
    }
    to {
      opacity: 0;
      transform: translate(-10px, -8px) scale(1.5);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .felt,
    .puff,
    .jolt .map {
      animation: none;
    }
    .felt {
      opacity: 0;
    }
  }
</style>
