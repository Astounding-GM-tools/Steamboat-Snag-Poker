<script lang="ts">
  import BoatSide from '../ui/boat/BoatSide.svelte';
  import BoatTop from '../ui/boat/BoatTop.svelte';
  import { MODULES, canBuild, type Built, type ModuleId } from '../ui/boat/boat';

  /**
   * The *Best Intentions* (development only): side on as on the title, and from above as
   * on the map, built out by the toggles. Nothing here is wired into the game. See
   * docs/boat.md.
   */
  const ids = Object.keys(MODULES) as ModuleId[];
  let built = $state<Built>({ galley: true, saloon: true, patty: true });
  let night = $state(false);
  let wobble = $state(true);
  let fold = $state(0);
  let heading = $state(-30);
  let turning = $state(true);
  let lift = $state(1);

  function toggle(id: ModuleId) {
    const next = { ...built, [id]: !built[id] };
    // Take down what stood on it: no bandstand without the saloon under it.
    for (const m of ids) if (next[m] && !canBuild(m, next)) next[m] = false;
    built = next;
  }

  // She comes round at the map's pace: 25° a second at most.
  $effect(() => {
    if (!turning) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      heading = ((heading + ((now - last) / 1000) * 25 + 180) % 360) - 180;
      last = now;
      raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  });

  const stars = Array.from({ length: 22 }, (_, i) => ({ x: -40 + ((i * 97) % 280), y: -110 + ((i * 53) % 70), r: 0.5 + (i % 3) * 0.3, d: 2 + (i % 4) * 0.6 }));
</script>

<main>
  <header>
    <h1>The <i>Best Intentions</i></h1>
    <div class="controls">
      {#each ids as id (id)}
        <label class:off={!canBuild(id, built)}>
          <input type="checkbox" checked={!!built[id]} disabled={!canBuild(id, built)} onchange={() => toggle(id)} />
          {MODULES[id].name}
        </label>
      {/each}
    </div>
    <div class="controls">
      <label><input type="checkbox" bind:checked={night} /> Night</label>
      <label><input type="checkbox" bind:checked={wobble} /> Ink wobble</label>
      <label>Chimneys down <input type="range" min="0" max="1" step="0.01" bind:value={fold} /></label>
    </div>
  </header>

  <section>
    <h2>Side on: the title and the story’s pages</h2>
    <svg class="side" class:night viewBox="-42 -112 282 126" aria-label="The Best Intentions, side on">
      <rect class="sky" x="-42" y="-112" width="282" height="126" />
      {#if night}
        {#each stars as s, i (i)}<circle class="star" cx={s.x} cy={s.y} r={s.r} style="--d: {s.d}s" />{/each}
        <circle cx="200" cy="-90" r="8" fill="#e5e5e5" />
      {/if}
      <g class="bob"><BoatSide {built} {night} {fold} {wobble} /></g>
      <g class="waves">
        <path
          d="M -100 0 {Array.from({ length: 14 }, () => 'q 7.5 -3 15 0 t 15 0').join(' ')} V 16 H -100 Z"
          class="water"
        />
        <path d="M -100 0 {Array.from({ length: 14 }, () => 'q 7.5 -3 15 0 t 15 0').join(' ')}" class="crest" />
      </g>
    </svg>
  </section>

  <section>
    <h2>From above: the river map</h2>
    <div class="controls">
      <label><input type="checkbox" bind:checked={turning} /> Turning</label>
      <label>Heading <input type="range" min="-180" max="180" step="1" bind:value={heading} disabled={turning} /> {Math.round(heading)}°</label>
      <label>Height <input type="range" min="0" max="2" step="0.05" bind:value={lift} /></label>
    </div>
    <div class="tops">
      <svg class="map" viewBox="-150 -150 300 300" aria-label="The Best Intentions from above">
        <rect class="chart" x="-150" y="-150" width="300" height="300" />
        <g><BoatTop {built} {heading} {lift} {night} {fold} /></g>
      </svg>
      <figure>
        <svg class="map small" viewBox="-60 -60 120 120" aria-label="At the map’s size">
          <rect class="chart" x="-60" y="-60" width="120" height="120" />
          <g transform="scale(0.22)"><BoatTop {built} {heading} {lift} {night} {fold} /></g>
        </svg>
        <figcaption>At about the map’s size</figcaption>
      </figure>
    </div>
  </section>
</main>

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 1rem;
  }
  h1,
  h2 {
    margin: 0 0 0.6rem;
  }
  h2 {
    margin-top: 1.4rem;
    font-size: 1rem;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  .off {
    opacity: 0.45;
  }
  svg {
    display: block;
    width: 100%;
    overflow: hidden;
  }
  .side {
    border: 1px dashed var(--dim);
  }
  .sky {
    fill: #5f5d57;
  }
  .night .sky {
    fill: #121210;
  }
  .star {
    fill: #f2efe6;
    animation: twinkle var(--d) ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    to { opacity: 0.2; }
  }
  .water {
    fill: #2a2926;
  }
  .crest {
    fill: none;
    stroke: #f2efe6;
    stroke-width: 1;
  }
  .waves {
    animation: waves 3s linear infinite;
  }
  @keyframes waves {
    to { transform: translateX(-30px); }
  }
  .bob {
    transform-box: view-box;
    transform-origin: 100px 0px;
    animation: bob 1.8s ease-in-out infinite;
  }
  @keyframes bob {
    50% { transform: translateY(0.8px) rotate(-0.4deg); }
  }
  .tops {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .map {
    width: min(100%, 520px);
    border: 1px dashed var(--dim);
  }
  .map.small {
    width: 160px;
  }
  .chart {
    fill: #e9dfc4;
  }
  figure {
    margin: 0;
  }
  figcaption {
    font-size: 0.8rem;
    color: var(--grey);
  }
</style>
