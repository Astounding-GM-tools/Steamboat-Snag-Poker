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
- **A crate:** won, salvage worth its ante at the Mercantile (the ante starts at $2 on a leg and goes up
  a dollar for every crate met on it); lost, soggy cotton. What's in it isn't said yet.
- **An obstacle** (a sawyer, a deadhead, a drift pile) carries one snag, a trouble with a fixer: the
  Stove-in Plank (Lars), the Fouled Rudder (Willie), the Fouled Wheel (Lars), the Sprung Plank (Gus),
  Scraped Paint (Willie). It leaves her with it only if it wins the hand with it played.
- **Where:** on open water only. The stream puts a piece in the water ahead (`debrisLeadSeconds`),
  after a rest, where there's room. None while she races, with no strength left to play, or downbound
  (yet).
- **Round an island, nothing** (tried, and taken out: with the open river's debris it was too much). Port
  or starboard picks the way round, and Willie logs it: for now a cosmetic call. Later it should be
  about time: one passage shorter or quicker than the other, the time saved (or lost) the point of it.

For now she stops for the hand rather than crawling (`paceDuringHand` is unused): simpler, and safe.
Later: faces for the debris, what's in the crates, the full-house bonus, and selling salvage properly
at the Mercantile (the Tri-Cities trader sells it a dollar's worth at a time, as a stopgap).

