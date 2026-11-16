# Brief for the map agent: one river, one chart

For the HistoricalMap project (`projects/river-1904`). The reasoning is in `docs/map.md`, "One
river, one chart". This is what to make, and what the game needs from it. Written 2026-11-16.

## Why

Today every leg is its own cut of the chart. Downbound legs will run over the same water as upbound
ones (Dubuque to Muscatine in a single day; Muscatine becomes the downbound hub), and a cut per leg
would duplicate tiles and give the same island different coordinates on each leg. We want **one
tile set for the whole river**, with each leg as **data drawn on it**.

## What exists now (chapter one)

`public/maptiles/river-1904/chapter-1/travel/`:
- `tiles/{z}/{x}/{y}.webp`: one cut's own pyramid, z0–8, 256 px tiles, webp quality 90.
- `travel.json`:
  - `asset`: `crs: EPSG:32615` (UTM 15N), `bounds_utm: [658240.7, 4579353.4, 727552.7, 4613381.4]`,
    `size_px: [34656, 17014]`, pixel origin top-left, **2 m per pixel**.
  - `path`: `{ geometry, source, px }`, the channel line (300 points) in that cut's pixels.
  - `stops`: `{ name, role, t, wgs84, px }`.
  - `islands`: `{ id, name, from_t, to_t, area_ha, passages: [{ side, name, kind, width_m, depth_ft, px }] }`,
    with `islands_convention`: side is the descending bank looking downstream (`left` Illinois,
    `right` Iowa), fixed to the river, never flipping.
  - `tiles`: `{ url, scheme: 'xyz', format, quality, tile_size, min_zoom, max_zoom, size_px }`.
- `public/maptiles/river-1904/route.json`: the whole voyage's route and places.
- `chapter-1/hubs/tri-cities/`: a landing's close-up. Leave hubs as they are for now.

The source sheets are the Mississippi River Commission's charts; the soundings on these sheets are
dated September 1894.

## What to make

**One shared grid, the same as today's but bigger (recommended).** Keep UTM 15N (EPSG:32615) and
**2 m per pixel**, with one fixed origin for the whole river: a round easting and northing north-west
of everything we'll ever need (Dubuque, about 42.6° N, to St. Louis, about 38.5° N; the whole route
lies in zone 15). Every pixel coordinate is then global. This keeps:
- the game's zoom numbers, boat size and pacing tuned for 2 m/px, all unchanged;
- conversion trivial: today's chapter-one pixel coordinates become global by **adding one fixed
  offset** (the cut's top-left in the global grid), including the hand-placed mooring at Muscatine.

(The alternative, standard web-map tiles in EPSG:3857, is more conventional for tooling but changes
the scale with latitude, and every tuned zoom and size with it. Not recommended.)

**Tiles:** one pyramid over the global grid, 256 px, webp quality 90, max zoom where one tile pixel is
one map pixel, as now. **Sparse:** only tiles touching the river's corridor (the channel and its banks,
with a generous buffer for the camera's view: a few kilometres either side), plus the coarse levels.
A missing tile is fine (the game skips any that fail to load), but please write a list of the tiles
that exist (or their extent per zoom) into the tiles metadata if it's cheap. Start with what chapter
one covers now. More river later means more tiles in the same pyramid: nothing gets re-cut.

**Legs as data**, one small file per leg, all coordinates in global pixels:
- `id`, a name, `from` and `to` stops;
- `path.px`: the channel line in the direction of travel. A downbound leg is mostly an upbound path
  reversed (its own channel where pilots went differently downstream);
- `stops`: `{ name, role, t, wgs84, px }`, with `t` along this leg's path (0 to 1);
- `islands`: as now, `from_t`/`to_t` along this leg's path, passages in global px, the same
  side convention (fixed to the river, so a downbound leg's port and starboard come out right by
  themselves).

The first legs: **chapter one upbound** (Muscatine to the Rock Island Rapids and LeClaire, as now).
Later: Dubuque to Muscatine downbound (one day's run), and on down.

## Layout (for the Cloudflare R2 bucket)

Served from `https://snag-assets.astounding.games/maptiles/…` (nothing uploaded yet):

```
maptiles/mrc-1894/
  tiles/{z}/{x}/{y}.webp
  tiles.json             the grid: crs, origin (UTM), 2 m/px, tile size, zooms, extent or tile list
  legs/<leg-id>.json     one per leg, global px
  route.json             the whole voyage, global px
  hubs/…                 as now, for the time being
```

Please produce it locally first (the game reads `public/maptiles` in development), and say the offset
from chapter one's old cut to the global grid, so the game's hand-placed points can be converted.

## The game's side (done here, after)

The game's map code changes to read `tiles.json` and the leg files, the root moves to the bucket
(`VITE_MAP_ROOT` already exists), and the hand-placed points get the offset: the mooring at Muscatine
(`landing` in `src/story/chapters/01_muscatine/index.ts`, now `[2450, 13185]` in the old cut).
