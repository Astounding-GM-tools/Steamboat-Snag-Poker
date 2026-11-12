# The *Best Intentions*

The player’s steamboat, redesigned: one design for the title vignette and the
story’s pages (side on, animated), the river map (from above, turning with the
channel), and a boat that is built out as the story goes on.

**See her:** `npm run dev`, then `/boat.html`. Side on and from above, with
toggles for the modules, night, ink wobble, the chimneys down, and her
heading. Nothing is wired into the game yet.

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
| **Galley** | main | 2–3 | the cook in the door, steam from the window (the Clinton rafters) |
| **Dining saloon** | boiler | 0–2 | the four suits, one each, as on the old vignette; painted over the railing too, so they read whole |
| **Staterooms** | boiler | 3–4 | doors with transoms; a passenger promenades the guard |
| **Bandstand** | roof | 0–2 | the whole saloon roof, and needs the saloon; Bennie Moten’s band |
| **Bigger engine** | main | none | a bigger, faster wheel and more smoke |
| **Pretty Patty** | main | the foredeck | in place of the freight there |

Where nothing is built, freight fills the main deck (crates and bales).

**More to come**, by the same rule: a ballroom (the saloon grown aft, or the
bandstand roofed in), more staterooms (the berths spill into bays 7–9 forward
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

## Next

1. **Wire her in:** the title’s `BoatScene` draws `BoatSide` in place of its
   boat; `RiverBackdrop` draws `BoatTop` in place of the flipped side view
   (today’s boat is about 40 units long, hers about 250 with the stage and
   wheel, so roughly 0.16× for the same size), and drops the flip.
2. **What she has built** comes from the story’s state (a `Built` record),
   saved with the voyage.
3. **The tow:** houseboats and rafts on lines astern, in both views.
4. **More figures and stations:** Willie, Gus and Morag as themselves (a hat or
   a beard each, from their portraits), the band growing as Bennie’s men come
   aboard, a crowd for the arrival at St. Louis.
5. **The chimneys folding:** they fold aft over the texas now; they may need to
   fold forward, or the pilothouse to sit further aft, to look right.
