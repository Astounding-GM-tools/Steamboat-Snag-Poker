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
  import { untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import TileMap from './TileMap.svelte';
  import { course as forked, route, type Pt, type TravelSidecar } from './route';
  import { loadLeg, MAP_ROOT as ROOT } from './legs';
  import { voyage } from './tuning.svelte';
  import BoatTop from '../boat/BoatTop.svelte';
  import type { Built } from '../boat/boat';

  /** The top view is drawn about 260 boat units long; the first map boat was about 40. */
  const TOP_SCALE = 0.16;

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
    /** What she has built so far: Bill's bare boat until the story says otherwise. */
    built?: Built;
    /** Skip held: the view stays on her rather than letting her steam across it. */
    racing?: boolean;
  }
  let { leg, t, mode, jolt = false, lanes = {}, crates = [], ahead = null, built = {}, racing = false }: Props = $props();

  let sidecar = $state<TravelSidecar | null>(null);
  $effect(() => {
    const id = leg;
    loadLeg(id).then((s) => {
      if (leg === id) sidecar = s;
    });
  });

  /** The channel, round the islands by the passages chosen. */
  const course = $derived(sidecar ? forked(route(sidecar.path.px[0], sidecar.stops), leg, sidecar.islands ?? [], lanes) : null);

  /** Corners cut off a line (Chaikin's), `rounds` times: the chart's channel as a boat would sail it, in curves. */
  function rounded(line: readonly Pt[], rounds: number): Pt[] {
    let out = line.slice();
    for (let r = 0; r < rounds; r++) {
      const next: Pt[] = [out[0]];
      for (let i = 0; i < out.length - 1; i++) {
        const [a, b] = [out[i], out[i + 1]];
        next.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      next.push(out[out.length - 1]);
      out = next;
    }
    return out;
  }

  /**
   * The way she sails: the whole leg's course, rounded, worked out once (again only when a passage
   * is chosen). She steers along it (see `boat`). No line is drawn behind her: she shows the way
   * herself. `along` turns her progress (t) into distance along it: sampled once with the line.
   */
  const SAMPLES = 2000;
  const sailed = $derived.by(() => {
    if (!course) return null;
    const line = rounded(course.line(0, 1), 3);
    const cum = new Float64Array(line.length);
    for (let i = 1; i < line.length; i++) cum[i] = cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    const drawn = cum[line.length - 1];
    const along = new Float64Array(SAMPLES + 1);
    let prev = course.at(0).p;
    for (let i = 1; i <= SAMPLES; i++) {
      const q = course.at(i / SAMPLES).p;
      along[i] = along[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      prev = q;
    }
    // Stretched to the rounded line's length, so progress and the line agree.
    const k = along[SAMPLES] ? drawn / along[SAMPLES] : 1;
    for (let i = 0; i <= SAMPLES; i++) along[i] *= k;
    /** The point at distance `d` along the line. */
    const point = (d: number): Pt => {
      d = Math.max(0, Math.min(drawn, d));
      let lo = 0, hi = line.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < d) lo = mid;
        else hi = mid;
      }
      const f = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
      return [line[lo][0] + f * (line[hi][0] - line[lo][0]), line[lo][1] + f * (line[hi][1] - line[lo][1])];
    };
    return { drawn, along, point };
  });
  /** How far along the line she is. */
  const distance = $derived.by(() => {
    if (!sailed) return 0;
    const x = Math.max(0, Math.min(1, t)) * SAMPLES, i = Math.floor(x);
    const { along } = sailed;
    return i >= SAMPLES ? along[SAMPLES] : along[i] + (x - i) * (along[i + 1] - along[i]);
  });

  /** log2 of the scale: steaming, high enough to see the river's bends; at play, down on her. */
  const zoom = new Tween(voyage.steamZoom, { duration: 1100, easing: cubicInOut });
  $effect(() => {
    zoom.target = mode === 'play' ? voyage.playZoom : voyage.steamZoom;
  });
  const scale = $derived(2 ** zoom.current);
  /** Her length on the screen (the top view is drawn about 260 units long). */
  const boatOnScreen = $derived(260 * voyage.boatSize * TOP_SCALE);

  /**
   * How she moves: she glides. Drawn far bigger than the map would make her, she can't follow every
   * wiggle of the channel without sliding sideways, so she steers instead: she aims at a spot on the
   * channel a good way ahead (`LOOK` boat lengths), turns towards it no tighter than her length
   * allows (`TURN_RADIUS`), and moves the way she points, as far as she's steamed. On a straight she
   * runs straight; at a bend she swings round in an arc, cutting it a little, as a pilot would.
   * Should she ever stray far from her spot (a reload, a race), she's set back on it.
   */
  const LOOK = 1.6;
  const TURN_RADIUS = 1.1;
  let boat = $state<{ p: Pt; heading: number } | null>(null);
  let lastDistance = 0;
  $effect(() => {
    const d = distance, s = sailed;
    if (!s) return;
    untrack(() => {
      const length = boatOnScreen / scale;
      const moved = d - lastDistance;
      lastDistance = d;
      /** The spot she aims for: the channel a good way ahead of where she's got to. */
      const mark = s.point(d + Math.sign(moved || 1) * LOOK * length);
      const there = s.point(d);
      if (!boat || Math.abs(moved) > 3 * length || Math.hypot(boat.p[0] - there[0], boat.p[1] - there[1]) > 1.5 * length) {
        boat = { p: there, heading: Math.atan2(mark[1] - there[1], mark[0] - there[0]) };
        return;
      }
      if (!moved) return;
      const want = Math.atan2(mark[1] - boat.p[1], mark[0] - boat.p[0]);
      const turn = ((((want - boat.heading) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      const most = Math.abs(moved) / (TURN_RADIUS * length);
      const heading = boat.heading + Math.max(-most, Math.min(most, turn));
      const step = Math.abs(moved);
      boat = { p: [boat.p[0] + Math.cos(heading) * step, boat.p[1] + Math.sin(heading) * step], heading };
    });
  });
  const deg = $derived(boat ? (boat.heading * 180) / Math.PI : 0);

  /**
   * The chart, moved like a chart on a table: it holds still while she steams across it, and when
   * she nears the edge she's heading for, it's slid back (gently, a few seconds) so she's near the
   * opposite edge again, with the whole screen ahead of her. Any heading: north, south, east or
   * west. Racing (Skip held), or at play, the view stays on her.
   */
  /** Clear of the heading above and the buttons below (px), and a margin inside that. */
  const CLEAR_TOP = 80;
  const CLEAR_BOTTOM = 130;
  const cam = new Tween<Pt>([0, 0], { duration: 2800, easing: cubicInOut });
  let camReady = false;
  $effect(() => {
    const b = boat;
    if (!b) return;
    const follow = racing || mode === 'play';
    untrack(() => {
      if (!camReady) {
        cam.set(b.p, { duration: 0 });
        camReady = true;
        return;
      }
      if (follow) {
        if (cam.target[0] !== b.p[0] || cam.target[1] !== b.p[1]) cam.set(b.p, { duration: mode === 'play' ? 1100 : 0 });
        return;
      }
      const W = innerWidth, H = innerHeight;
      const margin = 0.6 * boatOnScreen;
      // The open water of the screen: inside the margin, clear of the heading and the buttons.
      const x0 = margin, x1 = W - margin, y0 = CLEAR_TOP + margin, y1 = H - CLEAR_BOTTOM - margin;
      const [cx, cy] = cam.target;
      const sx = W / 2 + (b.p[0] - cx) * scale, sy = H / 2 + (b.p[1] - cy) * scale;
      const ux = Math.cos(b.heading), uy = Math.sin(b.heading);
      const leaving = (ux > 0.25 && sx > x1) || (ux < -0.25 && sx < x0) || (uy > 0.25 && sy > y1) || (uy < -0.25 && sy < y0) || sx < 0 || sx > W || sy < 0 || sy > H;
      if (!leaving) return;
      // Where she should land: from the middle of the open water, back against her heading to its edge.
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
      const reach = Math.min(Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity);
      const bx = mx - ux * reach, by = my - uy * reach;
      cam.target = [b.p[0] - (bx - W / 2) / scale, b.p[1] - (by - H / 2) / scale];
    });
  });
  /** How far the view leans towards what's ahead (0: on her). */
  const lean = new Tween(0, { duration: 1400, easing: cubicInOut });
  let leanTo = $state<Pt | null>(null);
  $effect(() => {
    if (ahead) leanTo = ahead;
    lean.target = ahead ? 0.65 : 0;
  });
  const center = $derived.by<Pt>(() => {
    const [cx, cy] = cam.current, k = lean.current, a = leanTo ?? cam.current;
    return [cx + k * (a[0] - cx), cy + k * (a[1] - cy)];
  });

  /** The chart's size on screen, and a spot on the chart (map px) on the screen. */
  let mapW = $state(0);
  let mapH = $state(0);
  const onScreen = (p: Pt): Pt => [mapW / 2 + (p[0] - center[0]) * scale, mapH / 2 + (p[1] - center[1]) * scale];
  /** The boat's own layer: a square of the top view's units, room for her at any heading and her smoke. */
  const BOAT_BOX = 460;
  const boatBox = $derived(BOAT_BOX * voyage.boatSize * TOP_SCALE);
  const boatAt = $derived(boat ? onScreen(boat.p) : ([0, 0] as Pt));
</script>

<div class="backdrop" class:play={mode === 'play'} class:jolt aria-hidden="true">
  {#if sidecar && boat}
    <div class="map" bind:clientWidth={mapW} bind:clientHeight={mapH}>
      <TileMap base="{ROOT}{leg}/travel/" tiles={sidecar.tiles} {center} {scale} />
      <!--
        What's on the chart, each in a small layer of its own, placed by a transform: their smoke and
        bobbing repaint only themselves, not a drawing the size of the screen.
      -->
      {#each crates as c, i (i)}
        {@const [x, y] = onScreen(c)}
        <!-- A crate adrift: what she picks up if she goes that way. -->
        <svg class="mark" viewBox="-6 -6 12 12" width={12 * voyage.boatSize} height={12 * voyage.boatSize} style:transform="translate3d({x - 6 * voyage.boatSize}px, {y - 6 * voyage.boatSize}px, 0)">
          <g class="crate" style:animation-delay="{i * -0.7}s">
            <rect class="ink" x="-4" y="-4" width="8" height="8" />
            <path class="paper" d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#f4ecd8" stroke-width="1" />
          </g>
        </svg>
      {/each}
      <!-- The Best Intentions from above (src/ui/boat): she turns to any heading, never flips -->
      <svg class="mark boat" viewBox="{-BOAT_BOX / 2} {-BOAT_BOX / 2} {BOAT_BOX} {BOAT_BOX}" width={boatBox} height={boatBox} style:transform="translate3d({boatAt[0] - boatBox / 2}px, {boatAt[1] - boatBox / 2}px, 0)">
        <BoatTop {built} heading={deg} printed />
      </svg>
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
  /* A mark on the chart: a small layer of its own, moved by the compositor. */
  .mark {
    position: absolute;
    left: 0;
    top: 0;
    overflow: visible;
    pointer-events: none;
    will-change: transform;
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
  @media (prefers-reduced-motion: reduce) {
    .felt,
    .jolt .map {
      animation: none;
    }
    .felt {
      opacity: 0;
    }
  }
</style>
