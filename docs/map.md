# The river map

The voyage is shown on a real map: the 1890 Mississippi River Commission survey, stitched and
tiled by the HistoricalMap project (`projects/river-1904`). Its tiles and sidecars go in
`public/maptiles` (gitignored: hosting them for production is a GitHub issue of its own).

**See it:** `npm run dev`, then `/map.html`: the Chapter 1 leg with the boat steaming it, and
the Tri-Cities hub.

## The code

| File | What's in it |
|---|---|
| `src/ui/map/route.ts` | A leg: the channel polyline and its stops; `at(t)` gives the boat's spot and heading, `line(from, to)` the channel between. Stops land exactly where the sidecar puts them |
| `src/ui/map/TileMap.svelte` | The tile viewer: `center` (map pixels) and `scale`; fetches only the tiles in view, a coarser layer under them while they load; `children` draws over the map in map pixels |
| `src/bench/RiverMap.svelte` | The dev page |

Tiles are cut in the map's own pixels (`gdal2tiles --profile=raster --xyz`): the top zoom level
is native size (2 m a pixel), each level down halves it, and the sidecar's `px` coordinates
line up with the tiles directly. No map library.

## How the game uses it

**The felt lifts.** Story mode opens on the usual black felt. After the game against the harbour
master, everything not in use (the stacks, the cards) slides off the screen, each piece its own
way, and the black felt fades to reveal the map beneath it, with the *Best Intentions* steaming
up the river at a leisurely pace.

**Underway,** the two buttons become:
- **Pause:** to the main menu; Continue there brings you back to the river.
- **Skip:** a hold-to-press button that speeds the boat up a lot, winding up while held.

**An encounter** stops the boat: the screen shudders and jerks, the map zooms in on the boat's
spot, and the cards slide back in: Sandy's portrait, the flop, the hands, the stack. The map
stays as the background, because this game is *on the river*: the encounter is that place.
Afterwards the map zooms out and the journey goes on.

**Readability** during play, to tune by eye (all CSS filters and gradients):
- the map dimmed and warmed towards sepia once the cards are in;
- a soft dark vignette behind the play areas (the flop, the hands, the seats);
- a slight blur on the zoomed-in map, so the survey's linework doesn't fight the card faces.

**The boat:** a small ink-drawn sternwheeler silhouette with a puff of smoke, in the cartoon's
style, not a game marker. It fades when the cards come in. No line is drawn behind her (there was a
red one, before she was drawn properly): she shows the way herself, and the log records which way she
went. A faint pencil track may come back for a whole-voyage view.

**Where each kind of game is played:**

| Game | Background |
|---|---|
| Encounters on the river | The map, zoomed in on the spot, dimmed |
| Deck games (aboard) | The map drifting by slowly underneath, dimmed: the voyage goes on while you play |
| Saloon games (ashore, indoors) | Back to the black felt |

**Hubs** keep the black-and-white survey, one look for the whole river. The coloured USGS land
map may come back as the town plan for choosing where to go in a hub, a chart pulled out of a
drawer.

**Annotations** (the sidecars' `annotations: []`): the map becomes the voyage's diary.
Corrections scrawled in as the story earns them: "Tri-Cities" to "Quad Cities" on the way
down; "Gilbert" to "Bettendorf" (the town renamed in 1903; the sheets still read the old name).

## Ideas waiting (2026-11-16)

- **A nudge tool for the course.** The channel line is right almost everywhere, but where it isn't
  (through an island, over a sand bank) it's jarring, and calculation has gone as far as it can. The
  paths are lines of points (not Bézier curves; the game rounds the corners), so: a dev overlay on
  the `?path` view where a nudge is dragged out (a spot, a push, a reach), bending the line smoothly
  there. Nudges kept in their own file in global pixels, applied on load: a re-export never loses them,
  and every leg over that water (up and down) gets the fix.

  *How to nudge* (built 2026-11-16). Run the dev server and open the game with `?nudge` in the address
  (it shows the red course too, as `?path` does); pick a scene that steams the water in question (the
  dev scene "Endless amble: the whole river" covers it all; hold Skip to race there). Drag the red line
  where it should go: that's a nudge, its spot where you grabbed and its push as far as you drag. Its
  reach is the dashed circle (300 px, 600 m, to start; the wheel over its dot or handle, or `[` and `]`,
  makes it smaller or bigger). Drag the red handle to change the push, the blue dot to move the spot;
  Delete takes the picked one away. **Freeze view** holds the view still while you work (she steams on
  out of it; untick to catch her up). **Save to repo** writes them all to `src/story/map/nudges.json`
  (through the dev server: `nudgeFile` in `vite.config.ts`), ready to commit; **Copy** is the fallback
  (on a phone over `--host`, where the clipboard won't take it, a box to copy from). The bend is
  `bend` in `src/ui/map/nudges.ts`: every point within the reach moves by the push times a cosine
  falloff, the line cut finer there first; nothing beyond the reach moves. It's applied where the
  map builds her course (`RiverBackdrop`), to the channel and the islands' passages: the stops and
  islands go by `t`, so the story's places stay put. None of the overlay is in a build.
- **The opening, slower.** Black; the chart fades in off to the side and pans along the river as it
  does, till it rests on Muscatine. The header: just "Muscatine". We linger: it's the opening shot,
  and we have time. A puff of steam; only then does she back out, gently ("The first day of spring");
  she drifts down, comes round to face the river, and gathers way slowly. Then "Muscatine, upbound".
- **Momentum.** Drawn small, her catch-up to the course reads as a sprint. She should speed up and
  slow down only gradually, the current pushing back: momentum and resistance, not a pull onto her spot.
- **Hands on the river, at her real pace.** When a hand comes up, she slows to a real boat's speed
  (about 3.5 m/s: under 2 map px a second) and the view turns it round: the boat fades, and the chart
  itself creeps by at that pace. The longer the hand, the slower and closer the view (full detail is at
  zoom 0; steaming is at −1.6, so about three times closer before it blurs). When it's settled: back
  out, and up to speed gradually, as if she'd slowed to hoist the salvage aboard or ease past the snag.
  (Debris hands are one round: mostly they'd never get far into the zoom.)
  *Built 2026-11-16:* `src/ui/map/creep.ts` (the curves; tuned in `tuning.svelte.ts`: `creepTail`,
  `closeInTail`, `handZoom`, `backOutMs`), capped by the stream's `creepRoom`; the stretch carries on
  from where she crept to (`driftOnRiver`). Aground (a `stuck` encounter) she holds still.
- **An encounter: the great Sand Bank Robbery.**

## One river, one chart (decided 2026-11-15; not built)

> *From the First Mate's Log, written at the chart table:*
>
> The Captain says we have been keeping the river in pieces, a separate chart for every run, as if
> the Mississippi were a different river going down than coming up. It is not. I have looked.
>
> So: one chart, the whole river, and each run is only a line drawn on it in pencil. Up from
> Muscatine is one line; down from Dubuque another, over the same water. Where we need more river,
> we paste in another sheet. Nothing is cut twice.
>
> The chart is the Commission's, older than the Captain lets on: the soundings are dated September
> 1894. The river has not moved much since. It will, once they start on the locks.
>
> Going down we will be quicker; the current does half the work. Dubuque to Muscatine in a day,
> and Muscatine is home.

**What that means, plainly:**
- **One tile set for the whole river,** in one shared frame (the standard web-map XYZ tiling,
  EPSG:3857, as QGIS exports it): `maptiles/mrc-1894/{z}/{x}/{y}.webp`. Sparse: tiles only along the
  river's corridor (the game already shrugs off a missing tile). More river later: more tiles, nothing
  re-cut. Not per chapter or per leg.
- **A leg is data, not pictures:** its course, stops and islands in the shared coordinates (a small
  file each). Upbound and downbound legs run over the same tiles; a downbound one is mostly an upbound
  course reversed (a channel of its own here and there). Each leg its own pace: downbound quicker.
- **Hub views** (the close-ups at landings) stay as they are for now, or become the same chart,
  nearer.
- **Today, by contrast:** each leg is its own cut of the chart (chapter one: 34,656 × 17,014 px, zoom
  0 to 8), and everything on it is in that cut's own pixels: the course, the islands, the mooring at
  Muscatine (`landing` in chapters/01_muscatine). Those convert mechanically once the chart's
  georeferenced in the shared frame.
- **Work:** the re-export is the map project's (HistoricalMap, QGIS); here, TileMap and route.ts
  take the shared frame, and the hand-placed points are converted. Not light: one sitting each.
- **The bucket** (Cloudflare R2, one bucket: `maptiles/` and `music/`): upload nothing until the
  re-export, so it starts in its final shape. Issue #17.

## Next: the river as the game (2026-11-14)

The meat of the game is on the river, not between landings: steaming is slow, and it's full.
Encounters break it up; between them there's always something happening, at river speed.

- **Timing, orchestrated.** Willie's log entries, the island calls (port or starboard), salvage
  talk, obstacles adrift, one-hand Snag games and the encounters must never crash into each other.
  One scheduler for the stretch (a "river director") that knows what's coming and spaces it: an
  entry waits for a fork call to be answered, a fork isn't called while a hand is on, and so on.
- **Slower still.** With hands to play on the way, her speed matters less: there's no rush to get
  anywhere, because you're already playing.
- **Everything leads to Snag:** one-hand games on the river for the value of a crate, the price of
  an upgrade, debris to clear, the timber raft; the manure chores as a deck game.
- **Obstacles adrift** in the lanes, making port or starboard a real choice.
- Watch for repetition: dense, but never the same thing twice in a row.
- **Backing out from the landing.** The first leg opens with her bow-first against the Muscatine
  landing. She backs out, swings round to face the river, drifts down a little on the current while
  the steam comes up, then gathers way forward and comes up to speed. Only then does Willie type
  "First day of spring.": under steam, and under way, and the game has properly started. (The same
  move, shorter, wherever she lies at a landing.)

## The syncopated event stream (agreed 2026-11-15)

Tuning moments by hand is a never-ending nightmare; the river decides as it goes instead, by rules:
a fixed beat, and everything else falls around it, played only where there's room. Tight, never
rushed; never quiet for long, with gentle intermissions.

**Kinds of event**
- **Fixed:** the departure from a landing (with Willie's first section), and the island forks
  (they're on the map: they can't move).
- **Main:** one per leg, never skipped (The Sandbar). By default around the leg's halfway mark, in a
  window (say 40 to 60 percent): it happens at the first gap in the window (not in a fork, not on top
  of a hand); if none, at the window's far end, and a fill is dropped instead. (Sandbars really did
  shift from season to season: a Sandbar in a slightly different spot each voyage is true.)
- **Fill:** debris or salvage (one item, settled with one hand of Snag; skippable), and Willie's log
  sections (the calm breathers; never dropped, they wait for a gap).

**Room.** At each decision point: how long, at her pace, to the next fork's warning, or to the main
event's window? Each fill has a rough length (a debris hand about 30 to 45 seconds, a log section its
typing time and a beat); a fill happens only if it fits with a margin, else a shorter one, else the
river. Intensity alternates: after a busy one, a calm one, and never the same twice running if
something else fits.

**Debris slows the river.** While a hand is on she slows to a crawl; nearing a fork's warning with
the hand still open, she stops altogether (the player may have stepped away), and goes on when it's
settled. A fork's zone (warning to rejoin) is never interrupted by a new fill, and nothing's in the
passages themselves (see below).

**Willie types through anything.** His typing is in the header: it can run under a fork's call or a
debris hand. It's a leisurely game.

**A fast player** squeezes in more debris than a leisurely one: fine for balance.

**Build, in steps:** (1) the stream itself, plain TypeScript with tests (what comes next, given where
she is, what's ahead and how long things take: "never collides" checked, not hoped for); (2) wire in
what exists (departure, forks, The Sandbar, the log); (3) the debris event and its one-hand Snag.
All three are in.

**Debris, as built** (src/story/characters/debris.ts). Every piece is a coin flip, drawn from the
voyage's seed and where it lies (the same thing there on a reload), and played for with one hand of
Snag for the crew's strength, against something that can only be worn down (what's lost goes down the
river):
- **A crate:** won, salvage worth its ante at the Mercantile ($2, every one: it used to climb a dollar a
  crate along a leg, and drained the crew); lost, soggy cotton. Out of Muscatine the first is a set
  piece (the stretch's `fills`), and Willie writes up what was in it.
- **An obstacle** (a sawyer, a deadhead, a drift pile) carries one snag, a trouble with a fixer: the
  Stove-in Plank (Lars), the Fouled Rudder (Willie), the Fouled Wheel (Lars), the Sprung Plank (Gus),
  Scraped Paint (Willie). It leaves her with it only if it wins the hand with it played.
- **Where:** on open water only. The stream puts a piece in the water ahead (`debrisLeadSeconds`),
  after a rest, where there's room, whether or not Willie's typing (he types through anything). None
  while she races, with the crew at 6 strength or less (`DEBRIS_FLOOR`: the river never leaves them
  with nothing), or downbound (yet).
- **Round an island:** where the stretch says so (`laneCrates`), a crate lies in one passage, drawn
  there to be spotted; steer that way and she fishes it out. On chapter one's first stretch, starboard,
  once The Sandbar is behind her (at Horse Island that's the main channel). Otherwise port or
  starboard picks the way round, and Willie logs it: for now a cosmetic call. Later it should be
  about time: one passage shorter or quicker than the other, the time saved (or lost) the point of it.

For now she stops for the hand rather than crawling (`paceDuringHand` is unused): simpler, and safe.
Later: faces for the debris, what's in the crates, the full-house bonus, and selling salvage properly
at the Mercantile (the Tri-Cities trader sells it a dollar's worth at a time, as a stopgap).

