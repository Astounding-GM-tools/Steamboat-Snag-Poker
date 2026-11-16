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
    /** Debris in the open river ahead, on her course (as the leg's t). */
    adrift?: number[];
    /** Something ahead to see before she gets there (an island to choose a way round): the view leans towards it. */
    ahead?: Pt | null;
    /** What she has built so far: Bill's bare boat until the story says otherwise. */
    built?: Built;
    /** Skip held: the view stays on her rather than letting her steam across it. */
    racing?: boolean;
    /** How hard the engine's working (1: steaming upstream at her pace): she chuffs this much more, or less. */
    effort?: number;
    /** She lies at a landing (its spot on the map): the departure plays, and `ondeparted` when she's under way. */
    departure?: Pt | null;
    ondeparted?: () => void;
    /** Departing, the wheel turns ahead: she's about to get under way. */
    onturn?: () => void;
  }
  let { leg, t, mode, jolt = false, lanes = {}, adrift = [], ahead = null, built = {}, racing = false, effort = 1, departure = null, ondeparted, onturn }: Props = $props();

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
    return { drawn, along, point, line };
  });
  /** How far along the line a spot on the leg (t) is. */
  function distanceAt(at: number): number {
    if (!sailed) return 0;
    const x = Math.max(0, Math.min(1, at)) * SAMPLES, i = Math.floor(x);
    const { along } = sailed;
    return i >= SAMPLES ? along[SAMPLES] : along[i] + (x - i) * (along[i + 1] - along[i]);
  }
  /** How far along the line she is. */
  const distance = $derived(distanceAt(t));
  /** The debris in the water ahead, on her course. */
  const flotsam = $derived(sailed ? adrift.map((a) => sailed.point(distanceAt(a))) : []);

  /** log2 of the scale: steaming, high enough to see the river's bends; at play, down on her. */
  const zoom = new Tween(untrack(() => (departure ? voyage.dockZoom : voyage.steamZoom)), { duration: 1100, easing: cubicInOut });
  let wasDeparting = untrack(() => !!departure);
  $effect(() => {
    const at = !!departure;
    untrack(() => {
      if (at) zoom.set(voyage.dockZoom, { duration: 0 });
      // Under way from the landing: the camera draws back slowly to the river's height.
      else if (wasDeparting) zoom.set(voyage.steamZoom, { duration: 7000 });
      else zoom.target = mode === 'play' ? voyage.playZoom : voyage.steamZoom;
      wasDeparting = at;
    });
    void mode;
  });
  /**
   * In close (at a landing) she's drawn bigger, so her wheel can be seen turning, but not as much bigger
   * as the map is (she'd fill the river): at the river's height, her usual size.
   */
  const GROWTH = 0.15;
  const growth = $derived(Math.max(1, 2 ** ((zoom.current - voyage.steamZoom) * GROWTH)));
  const scale = $derived(2 ** zoom.current);
  /** Her length on the screen (the top view is drawn about 260 units long). */
  const boatOnScreen = $derived(260 * voyage.boatSize * TOP_SCALE);

  /**
   * How she moves: she glides. Drawn far bigger than the map would make her, she can't follow every
   * wiggle of the channel without sliding sideways, so she steers instead: she aims at a spot on the
   * channel a good way ahead (`LOOK` boat lengths), turns towards it no tighter than her length
   * allows (`TURN_RADIUS`), and moves the way she points, as far as she's steamed. On a straight she
   * runs straight; at a bend she swings round in an arc, and she's drawn back towards her spot on the
   * channel as she goes (`PULL`), so the arc stays close to it. Should she ever stray far from her spot
   * (a reload, a race), she's set back on it.
   */
  const LOOK = 1.6;
  const TURN_RADIUS = 1.1;
  /** The size she steers as (in `boatSize` terms), however small she's drawn: wide, unhurried turns. */
  const STEER_SIZE = 1.5;
  /** Development only (`?path` in the address): her course drawn on the chart, and her spot on it. */
  const SHOW_PATH = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('path');
  /**
   * How hard she's drawn back to her spot on the way: for every length she steams, this share of the gap
   * closes. Steering alone, as big as she's drawn, she'd swing half a length wide of the channel at a
   * bend (over a bank, or an island), and never quite come back to it.
   */
  const PULL = 2.5;
  let boat = $state<{ p: Pt; heading: number } | null>(null);
  let lastDistance = 0;
  /**
   * Off a landing, the channel starts where the departure left her, not where the chart's course
   * begins: the difference (`join`), fading out over her first `JOIN_LENGTHS` lengths of the way.
   */
  let join: Pt | null = null;
  const JOIN_LENGTHS = 6;
  $effect(() => {
    const d = distance, s = sailed;
    if (!s || departure) return;
    untrack(() => {
      // She steers as a boat of `STEER_SIZE` would, whatever size she's drawn: drawn small, she'd
      // otherwise turn as sharply as her little length allows, and dart about.
      const length = (260 * Math.max(voyage.boatSize, STEER_SIZE) * TOP_SCALE) / scale;
      const moved = d - lastDistance;
      lastDistance = d;
      const fade = (x: number) => (join ? Math.max(0, 1 - x / (JOIN_LENGTHS * length)) ** 2 : 0);
      /** Her spot on the way at distance `x`: the channel, and off a landing, where she joined it. */
      const at = (x: number): Pt => {
        const q = s.point(x), k = fade(x);
        return k ? [q[0] + join![0] * k, q[1] + join![1] * k] : q;
      };
      if (join && !fade(d)) join = null;
      /** The spot she aims for: the channel a good way ahead of where she's got to. */
      const mark = at(d + Math.sign(moved || 1) * LOOK * length);
      const there = at(d);
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
      const ahead: Pt = [boat.p[0] + Math.cos(heading) * step, boat.p[1] + Math.sin(heading) * step];
      // Then drawn back towards her spot on the way, a little for every bit of way she makes.
      const k = Math.min(1, (PULL * step) / length);
      boat = { p: [ahead[0] + (there[0] - ahead[0]) * k, ahead[1] + (there[1] - ahead[1]) * k], heading };
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
    const follow = racing || mode === 'play' || !!departure;
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
  /** The boat's own layer: a square of the top view's units, room for her at any heading. */
  const BOAT_BOX = 460;
  const boatBox = $derived(BOAT_BOX * voyage.boatSize * TOP_SCALE * growth);
  const boatAt = $derived(boat ? onScreen(boat.p) : ([0, 0] as Pt));

  /**
   * Steam, as particles on one canvas over the chart, drawn thirty times a second while she steams
   * (and not at all otherwise). It lives on the chart, not on her: chuffed from her chimneys, it
   * hangs where it came out, drifts on the wind, swells and thins. Each cloudlet is one stamp of a
   * small image drawn once: about the cheapest thing a canvas does. How hard she chuffs comes from
   * how hard she's going (racing, for now; the engine later: see EXHAUST). A steamboat: steam, no
   * smoke, and no wake to speak of (the steam covers her track).
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
    /** Which cloudlet: a few drawn, each its own lumpy shape. */
    shape: number;
  }
  /** How she steams, in the top view's units (her length is about 260) and seconds. */
  const EXHAUST = {
    /** The wind (units a second); the steam rides it lazily (`steamDrift`). */
    wind: [10, -14] as const,
    /**
     * Steam from the chimneys: big, portly cloudlets, cel-shaded as the cartoons drew them (flat white,
     * a flat grey shade on the side away from the light, an ink outline), in chuffs as the engine
     * breathes. Each swells out fast, then slowly, and drifts lazily off before thinning away.
     */
    steamEvery: 0.6,
    steamLife: 6,
    steamSize: [14, 70] as const,
    steamAlpha: 1,
    /** How much of the wind the steam rides. */
    steamDrift: 0.45,
  };
  /** Where the chimneys stand, from her middle in the top view's units (BoatTop: chimneys at 142, middle at 100). */
  const CHIMNEYS: Pt[] = [
    [42, -9],
    [42, 9],
  ];
  /** How many lumpy cloudlet shapes are drawn (each chuff picks one). */
  const CLOUDLETS = 5;
  type Puffs = [number, number, number][];
  /**
   * Now and then a cloudlet comes out in the shape of a suit: the white steam's are hearts and
   * diamonds (clubs and spades will be the dark wood-fired smoke's, when she burns wood). Puffs are
   * [x, y, radius] in half-widths, y down; they stand upright on the screen whatever her heading.
   */
  const SUITS: Puffs[] = [
    // A heart: two lobes, tapering to a point below.
    [[-0.19, -0.14, 0.25], [0.19, -0.14, 0.25], [0, 0.04, 0.24], [-0.12, 0.17, 0.17], [0.12, 0.17, 0.17], [0, 0.3, 0.12], [0, 0.4, 0.06]],
    // A diamond: puffs along its four edges, small at the four tips, with its middle filled.
    diamond(),
  ];
  function diamond(): Puffs {
    const tips: [number, number][] = [[0, -0.44], [0.3, 0], [0, 0.44], [-0.3, 0]];
    const puffs: Puffs = [[0, 0, 0.19], [0, -0.17, 0.13], [0, 0.17, 0.13]];
    for (let e = 0; e < 4; e++) {
      const [ax, ay] = tips[e], [bx, by] = tips[(e + 1) % 4];
      for (let k = 0; k <= 4; k++) {
        const f = k / 4;
        // Pulled in a little from the edge, so the outline runs along it; small at the tips.
        const r = 0.035 + 0.085 * Math.sin(Math.PI * f);
        puffs.push([(ax + (bx - ax) * f) * (1 - r * 1.2), (ay + (by - ay) * f) * (1 - r * 1.2), r]);
      }
    }
    return puffs;
  }
  /** One cloudlet in this many is a suit. */
  const SUIT_EVERY = 9;

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
    /**
     * Cel-shaded cloudlets: a lumpy cluster of round puffs, an ink outline round the whole, flat white,
     * and a flat grey where the puffs turn away from the light (down and to the right).
     */
    const lumpy = (seed: number): Puffs => {
      let x = seed * 9301 + 49297;
      const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
      const puffs: Puffs = [[0, 0, 0.42]];
      for (let i = 0; i < 6; i++) {
        const a = rand() * Math.PI * 2, d = 0.18 + rand() * 0.22;
        puffs.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.2 + rand() * 0.16]);
      }
      return puffs;
    };
    const cloudlet = (puffs: Puffs) =>
      sprite((c, n) => {
        const R = n / 2;
        const ink = 0.045;
        const disc = (ctx: CanvasRenderingContext2D, grow: number, dx = 0, dy = 0) => {
          ctx.beginPath();
          for (const [px, py, pr] of puffs) {
            ctx.moveTo(R + (px + dx) * R + (pr + grow) * R, R + (py + dy) * R);
            ctx.arc(R + (px + dx) * R, R + (py + dy) * R, (pr + grow) * R, 0, Math.PI * 2);
          }
          ctx.fill();
        };
        // The body: grey where it turns away, white where the light falls (the same puffs, nudged up-left).
        const body = document.createElement('canvas');
        body.width = body.height = n;
        const b = body.getContext('2d')!;
        b.fillStyle = '#c9c5b8';
        disc(b, 0);
        b.globalCompositeOperation = 'source-atop';
        b.fillStyle = '#fbf9f2';
        disc(b, -0.03, -0.07, -0.08);
        // The outline under it all, then the body.
        c.fillStyle = '#1d1a14';
        disc(c, ink);
        c.drawImage(body, 0, 0);
      }, 160);
    // The lumpy ones first, then the suits.
    const steam = [...Array.from({ length: CLOUDLETS }, (_, k) => cloudlet(lumpy(k + 1))), ...SUITS.map(cloudlet)];
    const motes: Mote[] = [];
    let raf = 0, last = performance.now(), steamClock = 0;
    let was: Pt | null = null;
    let drawnAt: Pt = [NaN, NaN], drawnScale = NaN, blank = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Thirty times a second while the chart holds still; every frame while it's moving (a pan, a lean,
      // a zoom), so the steam moves with the chart and doesn't judder against it.
      const view = center, zoomed = scale;
      const panning = view[0] !== drawnAt[0] || view[1] !== drawnAt[1] || zoomed !== drawnScale;
      if (!panning && now - last < 1000 / 30) return;
      drawnAt = view;
      drawnScale = zoomed;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(mapW * dpr) || cv.height !== Math.round(mapH * dpr)) {
        cv.width = Math.round(mapW * dpr);
        cv.height = Math.round(mapH * dpr);
      }
      const b = boat;
      // Units of the top view, in map px, at this zoom: the boat's (where her chimneys are), and the steam's (how big it billows, how far it drifts).
      const u = (voyage.boatSize * TOP_SCALE * growth) / scale;
      const su = (voyage.steamSize * TOP_SCALE * growth) / scale;
      // How hard she's working: chuffs come oftener, and bigger, the harder it is.
      const hard = departure ? departEffort : effort;
      const moving = !!b && !!was && Math.hypot(b.p[0] - was[0], b.p[1] - was[1]) > 0.01;
      if (b) was = b.p;
      if (b && (moving || (departure && departEffort > 0))) {
        const cos = Math.cos(b.heading), sin = Math.sin(b.heading);
        const at = ([fx, fy]: Pt): Pt => [b.p[0] + (fx * cos - fy * sin) * u, b.p[1] + (fx * sin + fy * cos) * u];
        steamClock += dt * hard;
        while (steamClock > EXHAUST.steamEvery) {
          steamClock -= EXHAUST.steamEvery * (0.8 + Math.random() * 0.4);
          const [x, y] = at(CHIMNEYS[Math.floor(Math.random() * CHIMNEYS.length)]);
          const k = EXHAUST.steamDrift;
          motes.push({ x, y, vx: (EXHAUST.wind[0] * k + (Math.random() - 0.5) * 10) * su, vy: (EXHAUST.wind[1] * k + (Math.random() - 0.5) * 10) * su, age: 0, life: EXHAUST.steamLife * (0.8 + Math.random() * 0.4), r0: EXHAUST.steamSize[0] * su, r1: EXHAUST.steamSize[1] * su * Math.sqrt(hard) * (0.8 + Math.random() * 0.4), alpha: EXHAUST.steamAlpha, shape: Math.random() < 1 / SUIT_EVERY ? CLOUDLETS + Math.floor(Math.random() * SUITS.length) : Math.floor(Math.random() * CLOUDLETS) });
        }
      }
      // Nothing in the air: cleared once, then left alone till there is.
      if (!motes.length) {
        if (!blank) ctx.clearRect(0, 0, cv.width, cv.height);
        blank = true;
        return;
      }
      blank = false;
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
        // It swells out fast, then slowly.
        const grow = 1 - (1 - f) ** 3;
        const r = (m.r0 + (m.r1 - m.r0) * grow) * scale;
        const [sx, sy] = onScreen([m.x, m.y]);
        if (sx < -r || sy < -r || sx > mapW + r || sy > mapH + r) continue;
        // It holds solid, then thins in its last third (a cel drawing doesn't blur).
        ctx.globalAlpha = m.alpha * Math.min(1, (1 - f) * 3);
        ctx.drawImage(steam[m.shape], sx - r, sy - r, 2 * r, 2 * r);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });

  /**
   * The departure, from a landing: the picture fades in on her made fast bow-first at the levee, close
   * enough to see her wheel. A moment, then light puffs of steam; the wheel turns astern; she backs
   * out, swinging her stern downstream so her bow comes round upstream, drifting down a little on the
   * current; the wheel stops, then turns ahead, the steam comes up, and she's under way (`ondeparted`):
   * from there she steers up the channel as always, and the camera draws back to the river's height.
   */
  const DEPART = {
    /** Seconds from the start: the first steam, the wheel astern, backing out (from, to), the wheel ahead. */
    steam: 3.5,
    astern: 4.5,
    back: [5.5, 14] as const,
    ahead: 15.5,
    /** How far she backs out, and drifts down, in her lengths. */
    out: 0.7,
    drift: 0.6,
    /** The share of the backing spent pushing off the bank, before the current takes her and she comes round. */
    push: 0.45,
  };
  /** How far her stern lies swung downstream at the landing, off square to the river (radians): she lies at 70° to the bank. */
  const MOORED_ANGLE = (20 * Math.PI) / 180;
  let departEffort = $state(0);
  let departWheel = $state<'ahead' | 'astern' | 'still'>('still');
  /** The old film's scratches and specks, over the fade-in, gone once the picture's settled. */
  let oldFilm = $state(false);
  $effect(() => {
    const landing = departure, s = sailed;
    if (!landing || !s) return;
    // Her length on the map, as she's drawn at the landing (in close, she's shorter on the map than at the river's height).
    const length = untrack(() => (boatOnScreen * growth) / scale);
    // Her bow on the bank, and the current dragging her stern downstream: she lies out from the landing
    // towards the channel, angled down the river (MOORED_ANGLE off square to it).
    const start = s.point(0);
    const ahead = s.point(length);
    const up = Math.atan2(ahead[1] - start[1], ahead[0] - start[0]);
    const ux = Math.cos(up), uy = Math.sin(up);
    // Square off the river, on the channel's side of the landing.
    const side = Math.sign(-uy * (start[0] - landing[0]) + ux * (start[1] - landing[1])) || 1;
    const px = -uy * side, py = ux * side;
    const nx = px * Math.cos(MOORED_ANGLE) - ux * Math.sin(MOORED_ANGLE), ny = py * Math.cos(MOORED_ANGLE) - uy * Math.sin(MOORED_ANGLE);
    const moored: Pt = [landing[0] + nx * 0.5 * length, landing[1] + ny * 0.5 * length];
    const into = Math.atan2(-ny, -nx);
    // Coming round: the stern swings downstream, so the bow turns the short way past the bank's normal.
    const swing = ((((up - into) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    /** Off the levee, and down the river: she backs out over the backing, and drifts down until the wheel turns ahead. */
    const off: Pt = [nx * DEPART.out * length, ny * DEPART.out * length];
    const down: Pt = [-Math.cos(up) * DEPART.drift * length, -Math.sin(up) * DEPART.drift * length];
    const ease = (f: number) => f * f * (3 - 2 * f);
    untrack(() => {
      boat = { p: moored, heading: into };
      oldFilm = true;
      departEffort = 0;
      departWheel = 'still';
    });
    const t0 = performance.now();
    let raf = 0, done = false, turned = false;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= DEPART.ahead && !turned) {
        turned = true;
        untrack(() => onturn?.());
      }
      if (t > 4.5) oldFilm = false;
      departEffort = t < DEPART.steam ? 0 : t < DEPART.back[1] ? 0.35 : t < DEPART.ahead ? 0.2 : 1.1;
      departWheel = t < DEPART.astern ? 'still' : t < DEPART.back[1] ? 'astern' : t < DEPART.ahead ? 'still' : 'ahead';
      const clamp = (x: number) => Math.max(0, Math.min(1, x));
      const span = DEPART.back[1] - DEPART.back[0];
      // First she pushes off the bank, straight back along her length (quick, then easing off)...
      const pushed = 1 - (1 - clamp((t - DEPART.back[0]) / (span * DEPART.push))) ** 2;
      // ...then, clear of it, the current takes her: she drifts down as she comes round, until she's driving ahead.
      const turning = DEPART.back[0] + span * DEPART.push * 0.7;
      const drifted = ease(clamp((t - turning) / (DEPART.ahead + 0.6 - turning)));
      const swung = ease(clamp((t - turning) / (DEPART.back[1] - turning)));
      boat = {
        p: [moored[0] + off[0] * pushed + down[0] * drifted, moored[1] + off[1] * pushed + down[1] * drifted],
        heading: into + swing * swung,
      };
      if (t >= DEPART.ahead + 0.6 && !done) {
        done = true;
        lastDistance = 0;
        // The way on starts here, where she is: it joins the channel over her first few lengths.
        const o = s.point(0);
        join = [boat!.p[0] - o[0], boat!.p[1] - o[1]];
        untrack(() => ondeparted?.());
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<!-- Development (`?path`): the course she steers by, drawn on the chart. -->
{#snippet coursePath()}
  {#if sailed}
    <polyline points={sailed.line.map((q) => `${q[0]},${q[1]}`).join(' ')} fill="none" stroke="#d0301e" stroke-width="2" vector-effect="non-scaling-stroke" />
    {#if boat}<circle cx={sailed.point(distance)[0]} cy={sailed.point(distance)[1]} r={4 / scale} fill="#d0301e" />{/if}
  {/if}
{/snippet}

<div class="backdrop" class:play={mode === 'play'} class:jolt aria-hidden="true">
  {#if sidecar && boat}
    <div class="map" bind:clientWidth={mapW} bind:clientHeight={mapH}>
      <TileMap base={ROOT} tiles={sidecar.tiles} {center} {scale} children={SHOW_PATH ? coursePath : undefined} />
      <!--
        What's on the chart, each in a small layer of its own, placed by a transform: their smoke and
        bobbing repaint only themselves, not a drawing the size of the screen.
      -->
      {#each flotsam as c, i (i)}
        {@const [x, y] = onScreen(c)}
        <!-- Something in the water: a crate, or a snag. No telling till she's on it. -->
        <svg class="mark" viewBox="-6 -6 12 12" width={12 * voyage.steamSize} height={12 * voyage.steamSize} style:transform="translate3d({x - 6 * voyage.steamSize}px, {y - 6 * voyage.steamSize}px, 0)">
          <g class="crate" style:animation-delay="{i * -0.7}s">
            <path class="ink" d="M -5 0.5 C -4 -2.5 -1 -1.5 0 -3 C 1.5 -1.5 4 -2.5 5 0 C 4 2.5 -3.5 3 -5 0.5 Z" />
            <path d="M -3.5 -1 L 3 1 M -1 -3.5 L 1.5 2.5" stroke="#f4ecd8" stroke-width="0.8" fill="none" />
          </g>
        </svg>
      {/each}
      <!-- The Best Intentions from above (src/ui/boat): she turns to any heading, never flips -->
      <svg class="mark boat" viewBox="{-BOAT_BOX / 2} {-BOAT_BOX / 2} {BOAT_BOX} {BOAT_BOX}" width={boatBox} height={boatBox} style:transform="translate3d({boatAt[0] - boatBox / 2}px, {boatAt[1] - boatBox / 2}px, 0)">
        <BoatTop {built} heading={deg} printed paddle={departure ? departWheel : 'still'} />
      </svg>
      <!-- Steam (particles), over her: it billows out of her chimneys, on top of everything -->
      <canvas class="exhaust" bind:this={canvas} style:width="{mapW}px" style:height="{mapH}px"></canvas>
    </div>
  {/if}
  <!-- The old film, over the opening fade-in: scratches and specks, gone once the picture's settled -->
  {#if oldFilm}<div class="old-film"></div>{/if}
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
  /* The old film: grain and scratches jittering over the fade-in (only then: it's a whole-screen repaint). */
  .old-film {
    position: absolute;
    inset: -10%;
    z-index: 2;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent 31.8%, rgba(255, 255, 255, 0.12) 32%, transparent 32.2%),
      linear-gradient(90deg, transparent 77.9%, rgba(0, 0, 0, 0.35) 78%, transparent 78.15%),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>");
    opacity: 0.3;
    animation:
      old-film-jitter 0.25s steps(3) infinite,
      old-film-out 1.5s ease-in 3s forwards;
  }
  @keyframes old-film-jitter {
    0% {
      background-position: 0 0, 0 0, 0 0;
    }
    33% {
      background-position: 18vw 0, -9vw 0, -40px 25px;
    }
    66% {
      background-position: -12vw 0, 25vw 0, 30px -45px;
    }
  }
  @keyframes old-film-out {
    to {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .old-film {
      display: none;
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
