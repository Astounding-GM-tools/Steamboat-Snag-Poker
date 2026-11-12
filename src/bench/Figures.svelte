<script lang="ts">
  import Figure, { DOINGS, HATS, type Doing, type Hat } from '../ui/boat/Figure.svelte';

  /**
   * The people aboard, one by one (development only): every loop on its own, large, to
   * tweak a figure or work out a new one before it gets a station on the boat. Add a
   * `doing` to Figure.svelte and it appears here.
   */
  /** The hat each wears on the boat (BoatSide), to start from. */
  const worn: Record<Doing, Hat> = {
    walk: 'cap',
    stroll: 'boater',
    stoke: 'cap',
    fish: 'boater',
    sound: 'cap',
    cards: 'bowler',
    deal: 'cap',
    read: 'boater',
    cook: 'toque',
    pilot: 'cap',
    trumpet: 'boater',
    sax: 'bowler',
    trombone: 'boater',
    bass: 'bowler',
    drums: 'cap',
  };
  const BACKDROPS = { deck: '#2a2926', sky: '#5f5d57', cabin: '#f2efe6' } as const;
  type Backdrop = keyof typeof BACKDROPS;

  let hats = $state<Record<Doing, Hat>>({ ...worn });
  let size = $state(180);
  let speed = $state(1);
  let flip = $state(false);
  let guides = $state(true);
  let backdrop = $state<Backdrop>('deck');
  let gallery: HTMLElement;

  // Slow the loops down (or speed them up) to see a pose: every animation in the gallery.
  $effect(() => {
    void hats;
    void flip;
    const rate = speed;
    // After the figures redraw, so new animations are caught too.
    queueMicrotask(() => gallery?.getAnimations({ subtree: true }).forEach((a) => (a.playbackRate = rate)));
  });
</script>

<section>
  <h2>The people, one by one</h2>
  <div class="controls">
    <label>Size <input type="range" min="80" max="360" step="10" bind:value={size} /></label>
    <label>Speed <input type="range" min="0" max="2" step="0.05" bind:value={speed} /> {speed.toFixed(2)}×</label>
    <label><input type="checkbox" bind:checked={flip} /> Facing aft</label>
    <label><input type="checkbox" bind:checked={guides} /> Guides</label>
    {#each Object.keys(BACKDROPS) as b (b)}
      <button class:ghost={backdrop !== b} onclick={() => (backdrop = b as Backdrop)}>{b}</button>
    {/each}
  </div>

  <div class="gallery" bind:this={gallery} style:--size="{size}px">
    {#each DOINGS as doing (doing)}
      <figure>
        <svg viewBox="-13 -19 32 27" aria-label={doing}>
          <rect x="-13" y="-19" width="32" height="27" fill={BACKDROPS[backdrop]} />
          {#if guides}
            <!-- The deck, a window's height (the figure's own), and the water for the fisherman -->
            <line class="guide" x1="-13" y1="0" x2="19" y2="0" />
            <line class="guide faint" x1="-13" y1="-11" x2="19" y2="-11" />
            <line class="guide faint" x1="0" y1="-19" x2="0" y2="8" />
          {/if}
          {#if doing === 'fish'}<line class="water" x1="-13" y1="6.4" x2="19" y2="6.4" />{/if}
          <Figure {doing} hat={hats[doing]} {flip} toWater={6} />
        </svg>
        <figcaption>
          {doing}
          <select bind:value={hats[doing]} aria-label="{doing}’s hat">
            {#each HATS as h (h)}<option value={h}>{h}</option>{/each}
          </select>
        </figcaption>
      </figure>
    {/each}
  </div>
</section>

<style>
  h2 {
    margin: 1.4rem 0 0.6rem;
    font-size: 1rem;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.1rem;
    margin-bottom: 0.6rem;
    font-size: 0.9rem;
  }
  .gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  figure {
    margin: 0;
  }
  svg {
    display: block;
    width: var(--size);
    border: 1px dashed var(--dim);
  }
  figcaption {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.3rem;
    font-size: 0.8rem;
  }
  .guide {
    stroke: #c0533a;
    stroke-width: 0.15;
  }
  .guide.faint {
    stroke-dasharray: 0.6 0.6;
    opacity: 0.7;
  }
  .water {
    stroke: #9a978f;
    stroke-width: 0.4;
  }
</style>
