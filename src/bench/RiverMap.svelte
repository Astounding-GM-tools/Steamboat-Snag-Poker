<script lang="ts">
  /**
   * Development only: the Chapter 1 travel map and the Tri-Cities hub, from the tiles in
   * public/maptiles (cut by the HistoricalMap project, gitignored here). The boat runs the
   * leg at `t`; the travelled channel is drawn solid, the rest faint. Drag to pan (it stops
   * following the boat), wheel to zoom.
   */
  import TileMap from '../ui/map/TileMap.svelte';
  import { route, type Pt, type TileSet, type TravelSidecar } from '../ui/map/route';

  const ROOT = '/maptiles/river-1904/chapter-1/';

  interface Place { id?: string; name: string; px: Pt }
  interface Hub { asset: { variants: Record<string, { label: string; tiles: TileSet }> }; docks: Place[]; landmarks: Place[] }

  let travel = $state<TravelSidecar | null>(null);
  let hub = $state<Hub | null>(null);
  let error = $state('');
  $effect(() => {
    Promise.all([fetch(ROOT + 'travel/travel.json'), fetch(ROOT + 'hubs/tri-cities/hub.json')])
      .then(async ([a, b]) => {
        if (!a.ok || !b.ok) throw new Error('no tiles in public/maptiles');
        travel = await a.json();
        hub = await b.json();
      })
      .catch((e) => (error = String(e)));
  });

  const leg = $derived(travel ? route(travel.path.px[0], travel.stops) : null);

  let view = $state<'travel' | 'land-map' | 'river-chart'>('travel');
  let t = $state(0);
  let playing = $state(false);
  /** Seconds for the whole leg at river speed. */
  let seconds = $state(60);
  /** log2 of the scale: 0 is native (2 m a pixel). */
  let zoom = $state(-4);
  let follow = $state(true);
  let center = $state<Pt>([0, 0]);

  const scale = $derived(2 ** zoom);
  const boat = $derived(leg?.at(t));
  const done = $derived(leg ? leg.line(0, t) : []);
  const ahead = $derived(leg ? leg.line(t, 1) : []);
  const pts = (p: readonly Pt[]) => p.map(([x, y]) => `${x},${y}`).join(' ');

  $effect(() => {
    if (view === 'travel' && follow && boat) center = boat.p;
  });

  $effect(() => {
    if (!playing) return;
    let last = performance.now(), raf = 0;
    const tick = (now: number) => {
      t = Math.min(1, t + (now - last) / 1000 / seconds);
      last = now;
      if (t >= 1) playing = false;
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  function show(v: typeof view) {
    view = v;
    if (v === 'travel') (zoom = -4), (follow = true);
    else if (hub) {
      const [w, h] = hub.asset.variants[v].tiles.size_px;
      (center = [w / 2, h / 2]), (zoom = -1), (follow = false);
    }
  }
  function overview() {
    if (!travel) return;
    const [w, h] = travel.asset.size_px;
    (center = [w / 2, h / 2]), (zoom = Math.log2(Math.min(innerWidth / w, (innerHeight - 60) / h))), (follow = false);
  }

  let drag: { x: number; y: number; c: Pt } | null = null;
  function down(e: PointerEvent) {
    drag = { x: e.clientX, y: e.clientY, c: center };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    follow = false;
    center = [drag.c[0] - (e.clientX - drag.x) / scale, drag.c[1] - (e.clientY - drag.y) / scale];
  }
  function wheel(e: WheelEvent) {
    e.preventDefault();
    zoom = Math.max(-9, Math.min(1, zoom - e.deltaY / 400));
  }

  const tiles = $derived(view === 'travel' ? travel?.tiles : hub?.asset.variants[view].tiles);
  const base = $derived(view === 'travel' ? ROOT + 'travel/' : ROOT + `hubs/tri-cities/${view}/`);
</script>

<div class="page">
  <header>
    {#each [['travel', 'Travel'], ['land-map', 'Tri-Cities land'], ['river-chart', 'Tri-Cities chart']] as [v, label] (v)}
      <button class:on={view === v} onclick={() => show(v as typeof view)}>{label}</button>
    {/each}
    {#if view === 'travel'}
      <button onclick={() => (playing = !playing)}>{playing ? 'Pause' : 'Steam'}</button>
      <input type="range" min="0" max="1" step="0.0005" bind:value={t} oninput={() => (follow = true)} />
      <span>t {t.toFixed(3)}</span>
      <label>leg <input type="number" min="5" max="600" bind:value={seconds} /> s</label>
      <button onclick={() => (follow = true)} disabled={follow}>Follow</button>
      <button onclick={overview}>Whole leg</button>
    {/if}
    <span>zoom {zoom.toFixed(1)}</span>
  </header>

  {#if error}
    <p class="err">{error}</p>
  {:else if tiles}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="view" onpointerdown={down} onpointermove={move} onpointerup={() => (drag = null)} onwheel={wheel}>
      <TileMap {base} {tiles} {center} {scale}>
        {#if view === 'travel' && leg && boat}
          <polyline points={pts(ahead)} class="ahead" />
          <polyline points={pts(done)} class="done" />
          {#each leg.stops as s (s.name)}
            <g transform="translate({s.px[0]} {s.px[1]}) scale({1 / scale})">
              <circle r="5" class="stop" />
              <text x="9" y="-8">{s.name}</text>
            </g>
          {/each}
          <g transform="translate({boat.p[0]} {boat.p[1]}) scale({1 / scale}) rotate({(boat.heading * 180) / Math.PI})">
            <path d="M 14 0 L 4 -6 L -12 -6 L -12 6 L 4 6 Z" class="boat" />
          </g>
        {:else if hub}
          {#each [...hub.docks, ...hub.landmarks] as p (p.name)}
            <g transform="translate({p.px[0]} {p.px[1]}) scale({1 / scale})">
              <circle r="5" class="stop" />
              <text x="9" y="-8">{p.name}</text>
            </g>
          {/each}
        {/if}
      </TileMap>
    </div>
  {/if}
</div>

<style>
  .page {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #1a1712;
    color: #eee;
    font: 14px system-ui, sans-serif;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
  }
  header input[type='range'] {
    flex: 1;
    min-width: 160px;
  }
  header input[type='number'] {
    width: 4em;
  }
  button.on {
    font-weight: bold;
    outline: 2px solid #c9a24a;
  }
  .view {
    flex: 1;
    min-height: 0;
    touch-action: none;
    cursor: grab;
  }
  .err {
    padding: 16px;
  }
  .ahead {
    fill: none;
    stroke: #7a2e1e;
    stroke-opacity: 0.35;
    stroke-width: 2;
    stroke-dasharray: 4 6;
    vector-effect: non-scaling-stroke;
  }
  .done {
    fill: none;
    stroke: #7a2e1e;
    stroke-width: 3.5;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .stop {
    fill: #f4ecd8;
    stroke: #1a1712;
    stroke-width: 2;
  }
  .boat {
    fill: #1a1712;
    stroke: #f4ecd8;
    stroke-width: 1.5;
  }
  text {
    font: 15px 'Special Elite', monospace;
    fill: #1a1712;
    paint-order: stroke;
    stroke: #f4ecd8;
    stroke-width: 4px;
  }
</style>
