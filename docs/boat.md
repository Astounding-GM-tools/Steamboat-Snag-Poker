# The *Best Intentions*

The player’s steamboat, redesigned: one design for the title vignette and the
story’s pages (side on, animated), the river map (from above, turning with the
channel), and a boat that is built out as the story goes on.

**See her:** `npm run dev`, then `/boat.html`. Side on and from above, with
toggles for the modules, night, ink wobble, the chimneys down, and her
heading. In the game she is on the title (and between encounters,
`BoatScene`) and on the river map (`RiverBackdrop`), as Bill’s bare boat until
the story passes what she has built (`built`).

## What she is

**A sternwheel packet that wears the packet’s silhouette.** Two tall chimneys
forward with feathered crowns, the pilothouse on the texas, open guards and
railings round the boiler deck, a long white cabin, and the wheel at the stern.

- **History.** On the Upper Mississippi in 1904 nearly every working boat was a
  sternwheeler: raft boats, freighters, most packets. The side-wheelers were
  the big Lower River packets. The landing stage hung from a boom at the bow.
- **The story agrees.** Patty comes aboard over the stage onto the foredeck (a
  sternwheeler’s freight goes on the main deck, forward), stalling halfway.
- **The finale wants the chimneys forward and tall.** They are hinged at the
  hurricane deck, and Willie and Gus crank them down for the Eads Bridge.
- **What we gave up:** a big stern deck. The wheel is the stern. The card game
  sits on the **promenade**, the open after end of the boiler deck above the
  wheel. Patty rides forward under the chimneys, where everyone sees her.

She starts as Bill’s bare freighter: freight on the main deck, a short cabin
(the office), the texas and the pilothouse.

## The decks and the bays

Side-view units: x from the stern (0) to the bow (214), y up from the waterline
(negative, as in SVG).

| Level | y | What’s there |
|---|---|---|
| Main deck | −8 | Engine room aft, galley, freight, boilers, cordwood, Patty, the stage |
| Boiler deck | −24 | The promenade aft, the cabins, the guards and railing; her name, big, along its edge |
| Hurricane deck | −38 | The cabins’ roofs, the bandstand |
| Texas | −47 | Officers’ cabins |
| Pilothouse | −60 | The pilot at the wheel |

The upper works (the boiler deck and all above it) are drawn at these heights and
then lifted 5 units (`RISE`), so the people on the main deck stand clear of the
name board with room to spare. Stations up there are in the upper works’ frame.

The hull is cut into **ten bays** of 16 units (x 20 to 180), numbered from aft.
Each deck has its row of bays, and a module fills some of them. Fixed parts are
Bill’s boat; modules are what you add.

| Part | Deck | Bays | Notes |
|---|---|---|---|
| Engine room | main | 0–1 | fixed |
| Boilers | main | 5–7 | fixed; fireboxes face forward, the stoker in front |
| Office | boiler | 5–6 | fixed |
| Porch roof, texas | roof | 5–7, 5–6 | fixed; the chimneys come up through the porch |
| **Galley** | main | 2–3 | the cook in the door, steam from the window (the cook’s raft, from the village) |
| **Dining saloon** | boiler | 0–2 | the four suits, one each, as on the old vignette; painted over the railing too, so they read whole |
| **Staterooms** | boiler | 3–4 | doors with transoms; a passenger promenades the guard |
| **Bandstand** | roof | 0–2 | the whole saloon roof, and needs the saloon; Bennie Moten’s band |
| **Engine overhaul** | main | none | a bigger, faster wheel and more smoke |
| **Pretty Patty** | main | the foredeck | in place of the freight there |

Where nothing is built, freight fills the main deck (crates and bales).

**More to come**, by the same rule (but no ballroom: see below): more staterooms (the berths spill into bays 7–9 forward
of the office), the houseboat tow and the rafts on lines astern (map and side
view both), Willie’s and Gus’s chimney crank.

## People aboard

Tiny figures in the rubber-hose manner, about a window high: round heads, a
pear of a body, noodle limbs, a hat that says who they are. Each is a short
loop at a **station**, a named place on the boat (`stations()` in `boat.ts`),
so the story can put someone somewhere and both views agree.

| Station | Who, doing what |
|---|---|
| `stoker` | Lars at the firebox: bends and scoops off the deck, straightens with the load, chucks it in |
| `deckhand` | walking the main-deck guard, turning about at each end |
| `fisher` | on the boiler-deck guard, legs over the side, rod dipping |
| `leadsman` | right up in the bow: whirls the lead round, lets it fly far out ahead, it falls in, he hauls and reads the line, calls the depth, and reels it back up to hang ready; the lead never vanishes |
| `pilot` | at the wheel, leaning with the river |
| `cards` | by day a reader in a deck chair; at night two at the card table under a lantern |
| `cook` | in the galley door, the pan held level, flipping a pancake (with the galley) |
| `stroller` | a lady with a parasol along the guard (with the staterooms) |
| `band` | drum kit, double bass, saxophone, trumpet and trombone on the bandstand (with the bandstand) |

The band is five parts, and a band of any size is drawn from them (three
trumpets and two saxes are just more figures): the trumpet rocks, the sax dips
into it, the trombone’s slide runs out and back with the arm stretching after
it, the bass is plucked, and the drummer sits at a little kit (bass drum,
snare, cymbal), one stick on the snare and one riding the cymbal.

Hats: a cap, a boater, a bowler, a toque, and a top hat for Gaylord.

They are ink with a paper rim (an SVG dilate filter), so they read on the dark
main deck and the white cabin alike.

**One by one:** below the boat on `/boat.html`, every figure stands alone and
large, with a hat to try on, a speed slider for the loops (down to a standstill,
to catch a pose), facing aft, guides (the deck, a window’s height, the pivot
line) and the three backdrops a figure must read on: the dark deck, the grey
sky, the white cabin. A new figure is worked out there first, then given a
station on the boat. A `doing` added to `Figure.svelte` (`DOINGS`) appears
there by itself.

**Close up:** she is all vectors in one set of units, so a scene can frame any
part of her (the promenade for the deck game). At that size the figures want
more than a pear and noodles: a detailed version of each figure for close
scenes, perhaps borrowing faces from the portrait rig so Lars at the deck game
is the Lars at the table. That would be worked out in the gallery too.

## Two views of one boat

**Side on** (`BoatSide.svelte`) for the title and the story’s pages: a `<g>` in
boat units, so the vignette can draw her in its own scene (sky, bank, water)
and scale her.

**From above** (`BoatTop.svelte`) for the map: she turns to any heading and
never flips. The same bays seen as roofs: the boiler deck wider than the hull
(the guards overhang), the hurricane roofs with their skylights, the texas,
the pilothouse, the bandstand pavilion, Patty and the stage on the open
foredeck, and the wheel’s slats running forward as she drives.

**The cheat that gives her height:** whatever her heading, every level is
shifted a little toward the top of the screen by its height, as if seen from a
little south of overhead. The chimneys become lines standing up out of the
picture, and the smoke rises up the screen. Her shadow falls down and right.
`lift` sets how much (0 is straight down). Heading north (up the screen), the
cue is weakest: the chimneys lean along her length.

**Printed on the chart:** on the map she is drawn as part of the 1890 survey
(`printed`), in its own grey paper and black ink (sampled from the tiles: paper
#e4e4e4, ink #232323), not sepia: the chart is black and white, a cartoon on
carton. Shade is engraved as hachures, the way the chart shades its banks: light
strokes on the open boiler deck and foredeck, denser ones for her shadow on the
water, fine enough at play scale to read as tone, not stripes. Her lines are a little uneven and specked where the ink didn’t take (an
displacement filter over a small baked noise image, `public/boat/ink-noise.png`,
so nothing is generated per frame), keep a pen’s width on screen whatever the
zoom, and the river’s paper is laid under her so the wake and soundings don’t
show through. She is also broader in the beam there (`BEAM`, 1.3×) for a bit of
a pudge, the wheel’s slats turn slowly enough to see, and the smoke is heavier.
The bench’s top views sit on a real patch of the chart (above Muscatine); the
small one is at play scale, a screen pixel to a chart pixel.

A licence: side on, the two chimneys stand one behind the other along her
length so both show; from above they stand abreast, as they did.

## How she’s drawn

**In code, like the portrait rig** (`docs/portraits.md`). No drawing program.

- **The boat is data** (`src/ui/boat/boat.ts`): the levels, the bays, the fixed
  parts, the modules (`MODULES`, with what each `needs`), `occupancy()` (which
  throws if two parts want one bay), the wheel by engine, and the stations.
- **Each view draws from it.** A module is a span of bays on a deck, so a view
  knows where to draw it without being told twice.
- **Animation is CSS**, as on the title: the wheel and its slats, the chimneys
  breathing, the smoke, the firebox flicker, every figure’s loop, a walker’s
  beat (forward, turn about, back). Pivots are set in boat units with
  `transform-box: view-box`.
- **Ink on paper:** an optional displacement filter makes every line tremble
  a little (`wobble`). The film grain over the whole screen does the rest.
- **Hand-drawn parts can still come in.** If an ornament or the wheel wants an
  Inkscape drawing, it drops into a module’s place as an inline SVG.

Why code over hand-drawn files: two views × every module × night and day is a
lot of drawings to keep in step by hand, and a code part stays parametric (a
cabin one bay longer, a chimney folding).

## The files

| File | What’s in it |
|---|---|
| `src/ui/boat/boat.ts` | The boat as data: levels, bays, fixed parts, modules, stations |
| `src/ui/boat/BoatSide.svelte` | Side on: `<BoatSide built night fold wobble />` |
| `src/ui/boat/BoatTop.svelte` | From above: `<BoatTop built heading lift night fold />` |
| `src/ui/boat/Figure.svelte` | The people: `<Figure doing hat flip delay />` |
| `src/ui/boat/boat.test.ts` | Every module fits; nothing before what it stands on |
| `src/bench/Boat.svelte` | The bench page, `/boat.html` |
| `src/bench/Figures.svelte` | The people one by one, on the same page |

## Where modules come from

*Agreed 2026-11-13.* Two sources:

- **Upgrades** bought at the Mercantile docks along the river (the engine overhaul is the bigger
  engine, and so on).
- **Story events.** Above all the floating village on the way to Dubuque: some of the rafts in
  tow are cabins built to fit a boat, and the rafters take one off its raft and install it aboard.
  The cook's raft becomes **the galley**, stove and all; another's cabins can become **the
  staterooms**. **The tail shrinks while the body grows:** each raft installed is one fewer on
  the line astern.

**People and fittings are separate.** The cook comes with the village and the stove comes with
her raft, but they're two things: a hire (who's aboard) and a module (what's built). The band
joins at The Sandbar before there's a bandstand to put them on; they play on the foredeck among
the freight until one is built for them (it needs the dining saloon under it).

So in the tow, some rafts must be drawn as installable boat modules (a galley house, a row of
stateroom cabins) sitting on rafts, recognisably the same parts as on the boat, and moved
aboard when the story says.

## What she can have, and where

*Agreed 2026-11-13.* Slim early, richer as she goes; nobody gets everything (the purse won't run
to it), so each is a choice.

| Module | Comes from | Where |
|---|---|---|
| Boiler overhaul | The Mercantile (the upgrade that matters on the way up: the steam for the rapids) | Tri-Cities |
| Galley | The village: the cook's raft, installed aboard | Clinton to Dubuque |
| Staterooms | The village: another raft's cabins | Clinton to Dubuque |
| Dining saloon | The Mercantile (a place to eat and play cards) | Dubuque |
| Bandstand | Built on top of the dining saloon, so not before it | Dubuque, or after |
| Pretty Patty | The story: she's fetched from Dubuque | Dubuque, for the way down |
| Engine overhaul | The dry dock | The Quad Cities, on the way down |

- **The Tri-Cities is slim:** coal, supper, a second fireman, salvage sold, and the boiler
  overhaul. The engine overhaul and the hammocks are off (the hammocks were filler: crew comfort
  isn't thought out yet).
- **The band** joins at The Sandbar, long before a bandstand: they play on the foredeck among the
  freight until one is built.
- **No ballroom:** a dining saloon for meals and cards, and a bandstand, are as grand as the
  *Best Intentions* gets.
- **The stove and cook** stay on sale at Dubuque for anyone who passed the village by.

## Next

1. **Wired in:** `BoatScene` draws `BoatSide` (at night, 0.75×, waterline at
   the scene’s river) in place of its old boat; `RiverBackdrop` draws `BoatTop`
   (0.16× of `boatSize`, `TOP_SCALE`) in place of the flipped side view.
2. **What she has built** comes from the story’s state (a `Built` record),
   saved with the voyage.
3. **The tow:** houseboats and rafts on lines astern, in both views, in a row
   like ducklings. Raft boats really pushed their rafts ahead; we tow for the
   look, knowingly. The line is made fast high on the stern, on a towing bitt at
   the after end of the boiler deck (the promenade), so it clears the wheel;
   from above, a bridle from both quarters meets behind the wheel.
4. **More figures and stations:** Willie, Gus and Morag as themselves (a hat or
   a beard each, from their portraits), the band growing as Bennie’s men come
   aboard, a crowd for the arrival at St. Louis.
5. **The chimneys folding:** they fold aft over the texas now; they may need to
   fold forward, or the pilothouse to sit further aft, to look right.
