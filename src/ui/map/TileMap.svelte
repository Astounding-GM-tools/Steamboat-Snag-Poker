<script lang="ts">
  /**
   * A tiled map (tiles cut in the map's own pixels, z/x/y, the top zoom level at native
   * size), looked at from `center` (map pixels) at `scale` (screen pixels per map pixel).
   * Only the tiles in view are fetched; a coarser level sits under them while they load, and
   * goes once they're all in. `children` (if any) draws over the map in map pixels (an SVG
   * `<g>`): `scale` is there to keep markers a steady size.
   */
  import type { Snippet } from 'svelte';
  import type { Pt, TileSet } from './route';

  interface Props {
    /** The folder the tile URL is relative to (the sidecar's own folder). */
    base: string;
    tiles: TileSet;
    center: Pt;
    scale: number;
    children?: Snippet;
  }
  let { base, tiles, center, scale, children }: Props = $props();

  let width = $state(0);
  let height = $state(0);
  /** Tiles that aren't there: a sparse set skips the empty ones. */
  let missing = $state(new Set<string>());
  /** Sharp tiles loaded: once every one in view is, the coarse layer under them goes. */
  let loaded = $state(new Set<string>());

  const ts = $derived(tiles.tile_size);
  /** The finest level the screen can use, never upscaling a coarser one. */
  const level = $derived(Math.max(tiles.min_zoom, Math.min(tiles.max_zoom, Math.ceil(tiles.max_zoom + Math.log2(scale) - 1e-6))));
  /** Screen position of the map's origin. */
  const ox = $derived(width / 2 - center[0] * scale);
  const oy = $derived(height / 2 - center[1] * scale);

  function layer(z: number) {
    const span = ts * 2 ** (tiles.max_zoom - z); // map pixels per tile
    const [w, h] = tiles.size_px;
    const x0 = Math.max(0, Math.floor(-ox / scale / span)), x1 = Math.min(Math.ceil(w / span) - 1, Math.floor((width - ox) / scale / span));
    const y0 = Math.max(0, Math.floor(-oy / scale / span)), y1 = Math.min(Math.ceil(h / span) - 1, Math.floor((height - oy) / scale / span));
    const out: { url: string; left: number; top: number; size: number }[] = [];
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) {
        const url = base + tiles.url.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
        if (!missing.has(url)) out.push({ url, left: x * span * scale, top: y * span * scale, size: span * scale });
      }
    return out;
  }

  const top = $derived(width ? layer(level) : []);
  const sharp = $derived(top.every((t) => loaded.has(t.url)));
  const under = $derived(width && !sharp ? layer(Math.max(tiles.min_zoom, level - 3)) : []);

  function gone(url: string) {
    missing = new Set(missing).add(url);
  }
  function arrived(url: string) {
    loaded = new Set(loaded).add(url);
  }
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
  <!-- The tiles sit still in their own layer; the layer moves (a transform, done by the compositor). -->
  <div class="tiles" style:transform="translate3d({ox}px, {oy}px, 0)">
  {#each under as t (t.url)}
    <img src={t.url} alt="" style:left="{t.left}px" style:top="{t.top}px" style:width="{t.size + 0.5}px" style:height="{t.size + 0.5}px" onerror={() => gone(t.url)} />
  {/each}
  {#each top as t (t.url)}
    <img src={t.url} alt="" style:left="{t.left}px" style:top="{t.top}px" style:width="{t.size + 0.5}px" style:height="{t.size + 0.5}px" onload={() => arrived(t.url)} onerror={() => gone(t.url)} />
  {/each}
  </div>
  {#if children}
    <svg width={width} height={height}>
      <g transform="translate({ox} {oy}) scale({scale})">
        {@render children()}
      </g>
    </svg>
  {/if}
</div>

<style>
  .map {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    background: #ece4cf;
  }
  .tiles {
    position: absolute;
    inset: 0;
    will-change: transform;
  }
  img {
    position: absolute;
    user-select: none;
    pointer-events: none;
  }
  svg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
</style>
