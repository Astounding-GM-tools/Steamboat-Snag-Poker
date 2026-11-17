# River view: performance pass, 2026-11-17

What the river view (`src/ui/map/RiverBackdrop.svelte`, `TileMap.svelte`, driven by `src/ui/Journey.svelte`)
costs while it runs, what was cut, and what's left that would need a change to the look.

## How it was measured

Headless Chromium (Playwright), 1440×900 at DPR 2, the dev server on its own port, `?quick`, scenes from
`src/story/dev.ts`. (The app's browser pane was hidden, which throttles frames to one a second, so it
couldn't be used for timing.) In the page: frame times from `requestAnimationFrame` deltas,
`longtask` and `long-animation-frame` observers, a `MutationObserver` counting attribute and style
writes, resource timing for tiles, and a temporary probe (since removed) counting how often each
suspect effect, derived and loop ran. 15 s windows (the opening shot: its first 16 s, then the next 14 s).

Headless Chromium draws in software, so frame *times* are pessimistic next to a MacBook's GPU; the
*counts* (work per second) are what carry over, and they're what was cut.

| Scenario | Scene |
| --- | --- |
| Steaming | Endless amble: the whole river, 6 s in |
| Steaming, Skip held | the same, Skip held down |
| Opening shot | Ambling along: the pan and zoom in from the west (first 16 s), then the departure (next 14 s) |
| A hand on the river, with the creep | Under way (it opens on a table on the river: the view creeps in) |
| The Sandbar's table | Sandbar, 2 s in |
| Idle at a table | Sandbar, 37 s in, nothing touched |

## Before and after

Writes are DOM attribute writes a second (style writes are the part that's `style`); the probe
counted the rest.

| Scenario | Attr writes/s | Style writes/s | Tile list rebuilds/s | Other |
| --- | --- | --- | --- | --- |
| Steaming | 910 → **644** | 53 → 55 | 14.3 → **1.1** | steam drawn 35/s, the 30 fps tick 25/s (unchanged) |
| Steaming, Skip held | 856 → **399** | 26 → 26 | 0 → 0 | |
| Opening shot | 8,470 → **2,590** | 8,371 → **2,480** | 99.6 → **1.2** | p50 frame 15.9 → **9.2 ms**, frames over 20 ms 226 → **125** |
| Departure (after the shot) | 528 → **411** | 80 → 91 | 26.8 → **0** | |
| A hand, with the creep | 797 → **211** | 789 → **203** | 4 → **0.1** | |
| The Sandbar's table | 794 → **211** | 786 → **202** | 4 → **0.1** | |
| Idle at a table | 513 → **140** | 505 → **132** | 4 → **0.1** | |

Steady throughout, before and after: no JS long tasks while steaming; tiles ~56 a minute while
steaming (168 KB), none at a table; 42–54 tile images in the DOM, 200–390 nodes in all; heap 14–25 MB.

Checked and found fine (no change needed):

- `route.ts`'s `project` (O(n) a stop) runs only when the route's built: `course`, `sailed` and the
  2,000-sample `along` table are each derived once a leg (and again only when a passage is chosen).
  `legPx` in Journey builds a route once a leg too. Nothing route-shaped runs per frame.
- The steam canvas is resized only when the map's size changes, cleared once when the sky empties, and
  drawn 30 times a second (more only while the chart pans, so the steam doesn't judder against it).
- The tile layer moves by one `translate3d` (compositor); tiles are fetched only as they come into view.
- Hidden, the `requestAnimationFrame` loops (the 30 fps tick, the steam, the departure) stop by themselves.

## What was cut

1. **Tiles placed by one transform each, not left/top/width/height** (`TileMap.svelte`). Whenever the
   view zooms (the opening shot, a table coming up, the creep at a hand, backing out after it), every
   tile's four box properties were re-set every step, each a layout. Now each tile is an image `ts`
   across, moved and sized by one `transform` to exactly the same box (checked: neighbouring tiles meet
   with the same half-pixel overlap, edges within 0.001 px). The biggest win: style writes down ~3.4×
   in the opening shot and ~4× at every table.
2. **The tile list rebuilt only when the view crosses a tile's edge** (`TileMap.svelte`). The visible
   range is derived as a string, so panning (which changes the layer's offset every frame) no longer
   rebuilds the list and its URLs: from 14 times a second while steaming (100 in the opening shot) to
   about once.
3. **Her heading to the nearest quarter degree** (`RiverBackdrop.svelte`, `deg`). She steers a hair at
   every step, 30 times a second, and every change re-rendered the whole top view (some three dozen
   attributes, under the printed-ink displacement filters). A quarter degree moves her bow under a
   tenth of a pixel; her steering still runs on the exact heading. Attribute writes while steaming down
   about a third, and by half with Skip held.
4. **The creep's 4-a-second timers do nothing while the page is hidden** (`RiverBackdrop.svelte`'s
   close-in, `Journey.svelte`'s creep). Both are reckoned from the clock, so they're right again the
   moment it's shown. (The `requestAnimationFrame` loops already stopped when hidden; these timers didn't.)

## Left, that would change the look (proposals)

- **At a table, the creep repaints the whole blurred chart four times a second.** `.play .map` has a
  `filter: brightness sepia contrast blur(1.2px)` over the full screen, and each close-in step changes
  what's under it, so the filter is re-run on the whole screen each time. That's where the remaining
  long frames at The Sandbar come from (about 1–2 s of frames over 20 ms in every 15 s, headless; no
  script in them: it's paint). Options, cheapest first:
  - step the close-in once a second instead of four times (it moves under a pixel a step either way);
  - apply the close-in as a `scale` on the blurred layer between steps and re-lay the tiles only every
    few seconds (a compositor zoom, slightly softer between re-lays: under the blur, likely invisible);
  - drop `blur(1.2px)` from the filter (dimming and sepia alone are far cheaper), or bake the softness
    into a coarser tile level at play.
- **The portraits' grain** (`Portrait.svelte`, an infinite 2.6 s animation, seven at The Sandbar) runs
  over the blurred chart the whole time a table's up. Outside the river view; worth its own look.
- **The steam loop asks for every frame while steaming**, even on frames it skips (the 30 fps gate).
  The callback is trivial, but it keeps the browser's frame pipeline awake at the display's rate
  (120 Hz on ProMotion). A 30 fps `setTimeout` loop would sleep between, but the steam would then
  judder against the chart while it pans: a look change, so not done.
