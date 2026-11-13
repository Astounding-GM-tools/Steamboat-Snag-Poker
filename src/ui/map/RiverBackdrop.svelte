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

  /**
   * Smoke and wake, as particles on one canvas over the chart, drawn thirty times a second while she
   * steams (and not at all otherwise). They live on the chart, not on her: smoke puffed from her
   * chimneys hangs where it was puffed, drifts on the wind, spreads and thins; her wake is a trail
   * of bubbles left where she passed, fading, so it stays in the water she sailed (it never washes
   * up on a bank). Each mote is one stamp of a small soft image drawn once: about the cheapest thing
   * a canvas does. How heavy the smoke is comes from how hard she's going (racing, for now; the fuel
   * and the engine later: see EXHAUST).
   */
  let canvas = $state<HTMLCanvasElement>();
  interface Mote {
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
    life: number;
    r0: number;
    r1: number;
    alpha: number;
    kind: 'smoke' | 'steam' | 'bubble';
  }
  /** How she smokes and stirs the water, in the top view's units (her length is about 260) and seconds. */
  const EXHAUST = {
    /** A puff from each chimney this often; how long it hangs; its size as it leaves and as it spreads; how dark. */
    puffEvery: 0.28,
    puffLife: 9,
    puffSize: [16, 80] as const,
    puffAlpha: 0.55,
    /** The wind the smoke drifts on (units a second). */
    wind: [10, -14] as const,
    /** A bubble this often; how long it lasts; its size; how plain. */
    bubbleEvery: 0.06,
    bubbleLife: 3.2,
    bubbleSize: [5, 9] as const,
    bubbleAlpha: 0.75,
    /**
     * Steam from the escape pipe: thick, white, billowing, in chuffs as the engine breathes, rising
     * slowly and spreading wide before it goes home to the clouds. Drawn white with a soft grey under
     * it, so it reads on the pale paper.
     */
    steamEvery: 0.55,
    steamLife: 6.5,
    steamSize: [22, 120] as const,
    steamAlpha: 0.95,
    /** The steam rides the wind more lazily than the smoke. */
    steamDrift: 0.45,
    /** Going hard (Skip held): puffs this much more often, bigger and darker. */
    hard: 2.5,
  };
  /** Where the chimneys stand and the wheel turns, from her middle in the top view's units (BoatTop: chimneys at 142, middle at 100). */
  const CHIMNEYS: Pt[] = [
    [42, -9],
    [42, 9],
  ];
  const STERN = -112;
  /** The escape pipe, between and a little aft of the chimneys. */
  const ESCAPE: Pt = [30, 0];

  function sprite(draw: (c: CanvasRenderingContext2D, n: number) => void, n: number): HTMLCanvasElement {
    const img = document.createElement('canvas');
    img.width = img.height = n;
    draw(img.getContext('2d')!, n);
    return img;
  }
  $effect(() => {
    const cv = canvas;
    if (!cv || mode !== 'steam') {
      cv?.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
      return;
    }
    const ctx = cv.getContext('2d')!;
    const puff = sprite((c, n) => {
      const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      g.addColorStop(0, 'rgba(38, 36, 32, 1)');
      g.addColorStop(0.55, 'rgba(38, 36, 32, 0.45)');
      g.addColorStop(1, 'rgba(38, 36, 32, 0)');
      c.fillStyle = g;
      c.fillRect(0, 0, n, n);
    }, 64);
    const steam = sprite((c, n) => {
      const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      // A firm white body with a soft edge: a billow, not a blur.
      g.addColorStop(0, 'rgba(253, 252, 247, 1)');
      g.addColorStop(0.55, 'rgba(250, 248, 241, 0.97)');
      g.addColorStop(0.8, 'rgba(246, 244, 236, 0.55)');
      g.addColorStop(1, 'rgba(246, 244, 236, 0)');
      c.fillStyle = g;
      c.fillRect(0, 0, n, n);
    }, 64);
    const bubble = sprite((c, n) => {
      c.strokeStyle = 'rgba(30, 30, 28, 1)';
      c.lineWidth = n / 8;
      c.beginPath();
      c.arc(n / 2, n / 2, n / 2 - c.lineWidth, 0, Math.PI * 2);
      c.stroke();
    }, 16);
    const motes: Mote[] = [];
    let raf = 0, last = performance.now(), puffClock = 0, bubbleClock = 0, steamClock = 0;
    let was: Pt | null = null;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / 30) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(mapW * dpr) || cv.height !== Math.round(mapH * dpr)) {
        cv.width = Math.round(mapW * dpr);
        cv.height = Math.round(mapH * dpr);
      }
      const b = boat;
      // Units of the top view, in map px, at this zoom.
      const u = (voyage.boatSize * TOP_SCALE) / scale;
      const hard = racing ? EXHAUST.hard : 1;
      const moving = !!b && !!was && Math.hypot(b.p[0] - was[0], b.p[1] - was[1]) > 0.01;
      if (b) was = b.p;
      if (b && moving) {
        const cos = Math.cos(b.heading), sin = Math.sin(b.heading);
        const at = ([fx, fy]: Pt): Pt => [b.p[0] + (fx * cos - fy * sin) * u, b.p[1] + (fx * sin + fy * cos) * u];
        puffClock += dt * hard;
        while (puffClock > EXHAUST.puffEvery) {
          puffClock -= EXHAUST.puffEvery;
          for (const c of CHIMNEYS) {
            const [x, y] = at(c);
            motes.push({ x, y, vx: (EXHAUST.wind[0] + (Math.random() - 0.5) * 8) * u, vy: (EXHAUST.wind[1] + (Math.random() - 0.5) * 8) * u, age: 0, life: EXHAUST.puffLife * (0.8 + Math.random() * 0.4), r0: EXHAUST.puffSize[0] * u * Math.sqrt(hard), r1: EXHAUST.puffSize[1] * u * Math.sqrt(hard), alpha: Math.min(0.85, EXHAUST.puffAlpha * Math.sqrt(hard)), kind: 'smoke' });
          }
        }
        bubbleClock += dt;
        while (bubbleClock > EXHAUST.bubbleEvery) {
          bubbleClock -= EXHAUST.bubbleEvery;
          const [x, y] = at([STERN - Math.random() * 6, (Math.random() - 0.5) * 22]);
          const r = (EXHAUST.bubbleSize[0] + Math.random() * (EXHAUST.bubbleSize[1] - EXHAUST.bubbleSize[0])) * u;
          motes.push({ x, y, vx: 0, vy: 0, age: 0, life: EXHAUST.bubbleLife * (0.7 + Math.random() * 0.6), r0: r, r1: r * 1.4, alpha: EXHAUST.bubbleAlpha, kind: 'bubble' });
        }
        steamClock += dt * hard;
        while (steamClock > EXHAUST.steamEvery) {
          steamClock -= EXHAUST.steamEvery * (0.8 + Math.random() * 0.4);
          const [x, y] = at(ESCAPE);
          const k = EXHAUST.steamDrift;
          motes.push({ x, y, vx: (EXHAUST.wind[0] * k + (Math.random() - 0.5) * 10) * u, vy: (EXHAUST.wind[1] * k + (Math.random() - 0.5) * 10) * u, age: 0, life: EXHAUST.steamLife * (0.8 + Math.random() * 0.4), r0: EXHAUST.steamSize[0] * u, r1: EXHAUST.steamSize[1] * u * (0.8 + Math.random() * 0.4), alpha: EXHAUST.steamAlpha, kind: 'steam' });
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, mapW, mapH);
      for (let k = motes.length - 1; k >= 0; k--) {
        const m = motes[k];
        m.age += dt;
        if (m.age >= m.life) {
          motes.splice(k, 1);
          continue;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const f = m.age / m.life;
        const r = (m.r0 + (m.r1 - m.r0) * Math.sqrt(f)) * scale;
        const [sx, sy] = onScreen([m.x, m.y]);
        if (sx < -r || sy < -r || sx > mapW + r || sy > mapH + r) continue;
        // Smoke and steam thicken a moment as they leave, then thin away; bubbles simply fade.
        const fade = m.kind === 'bubble' ? 1 - f : Math.min(1, f * 6) * (1 - f) * (m.kind === 'steam' ? 1 - f * 0.5 : 1);
        if (m.kind === 'steam') {
          // A soft grey under the white, a little down-light, so the billow has body on the pale paper.
          ctx.globalAlpha = m.alpha * fade * 0.42;
          ctx.drawImage(puff, sx - r + r * 0.12, sy - r + r * 0.18, 2 * r, 2 * r);
        }
        ctx.globalAlpha = m.alpha * fade;
        ctx.drawImage(m.kind === 'smoke' ? puff : m.kind === 'steam' ? steam : bubble, sx - r, sy - r, 2 * r, 2 * r);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
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
      <!-- Smoke and wake (particles, under her: the smoke drifts away astern and the bubbles trail her) -->
      <canvas class="exhaust" bind:this={canvas} style:width="{mapW}px" style:height="{mapH}px"></canvas>
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
  .exhaust {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }
  .play .exhaust {
    opacity: 0;
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
