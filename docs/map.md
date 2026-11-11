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
style, not a game marker. It fades when the cards come in. The travelled line stays, faintly,
as the voyage's memory.

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
