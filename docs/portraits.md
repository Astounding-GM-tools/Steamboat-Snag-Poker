# Portraits

Every face in the game is one SVG rig with its own settings. A face is data;
moods are poses of the rig, so they blend and glide; effects are written once
and work on any face. No drawing program, no images: everything is paths in a
100 × 100 box, animated in CSS like the boat on the title.

**See them all:** `npm run dev`, then `/portraits.html`. Every face in each
mood, at the sizes the table uses, with sliders for size and nerves, buttons
for the effects, and a backdrop switch. A face added to `faces.ts` appears
there by itself.

## The files

| File | What's in it |
|---|---|
| `src/ui/portrait/rig.ts` | The vocabulary: `Pose`, `Face`, `Part`, the moods and their poses, effects, backdrops |
| `src/ui/portrait/faces.ts` | The cast: every face, by the id they go by at the table and in the story (`FACES`, `hasFace`) |
| `src/ui/portrait/hats.ts` | Hats by rule, cut to the head beneath them |
| `src/ui/portrait/Portrait.svelte` | The drawing: `<Portrait id mood />` |
| `src/ui/portrait/portrait.test.ts` | The hat rule, and that every face draws |
| `src/bench/Portraits.svelte` | The gallery page |

Where faces show up: `OpponentSeat` draws one in a rival's seat (`mood` from
`Table.rivalMood`: worried as their purse drains, pleased when they raise or
win), and `Speech` draws one on a caption when the speaker has a face (a line
can carry a `mood`). Anyone without a face keeps their initial.

## The box

The head's widest point is at y 46; the oval's centre is (50, 50). An oval
head is drawn from five numbers (`width`, `top`, `jaw`, `chin`, `bottom`); a
head of any other shape is an `outline` path (Sandy's heap, the ice sheet).
Everything is drawn 16% larger than the box (`zoom`, default 1.16) so faces
fill their oval: a square jaw (the harbour master) or a jagged sheet of ice
wants less.

## Draw order

Inside the oval, clipped to it:

1. the cream backdrop;
2. `back` parts (ears, hair behind the head);
3. the head;
4. `face` parts (cheeks, scars, whiskers, stubble);
5. the eyes, then **the brows over the eyes**, so a brow hangs over a lid;
6. the nose and mouth, then `mouth` parts (a moustache rides with the mouth);
7. the bead of sweat;
8. `front` parts (hair over the brow, collars, most hats).

Then, outside the clip, free to break the frame:

9. `over` parts (a top hat, a bun, a nightcap's tassel, tusks);
10. `swing` parts, which turn with the mood about the face's `pivot` (a pipe,
    a cigar, a holder), and the smoke;
11. `over` parts marked `withMouth`, on top of everything (Gaylord's
    moustache, which his holder disappears into);
12. `spill` parts drawn again, only outside the oval (a beard that won't keep
    to the frame).

## Moods

Three moods: `neutral`, `confident`, `nervous`. A mood is a `Pose`: brows
(lift, tilt, one cocked), eyes (open, looking where), mouth (curve, smirk,
wobble), lean, sweat, and the angle of a pipe. A face can be given a blend
(`{ neutral: 0.6, nervous: 0.4 }`), and it glides between them.

How a face plays a mood:

- **`rest`:** where the face sits before any mood. Willie is already smiling;
  Lenny is already low.
- **`temper`:** how much of a mood shows, 0 to about 1. Gus 0.6, Lars 0.4.
  **0 is stone-faced:** the same in every mood (Steamboat Bill, Ignatz).
- **`moods`:** a mood played its own way, in place of the usual pose.
  Sandy and the ice sheet keep a straight face when nervous; Gaylord's
  nervous face is his confident one with the cigarette drooping; Lenny's
  mouth never changes ("it's all hopeless anyway"); Eliza never smiles;
  Nemo's worry never reaches his mouth.
- **`dry`:** never sweats.

The nervous mouth is a thin, shaky, closed line. An open nervous mouth
reads as a pucker: don't.

## Effects and tells

Effects, written once: `shifty` (the eyes slide aside and back), `twitch`
(a brow jumps), `wrinkle` (the nose). `play(effect)` sets one off. A face's
`tic` sets one off now and then, about every so many seconds, never on the
beat; with `when`, only in that mood, which makes it a **tell**: Gaylord
glances aside only when he's rattled.

Blinking: `blink` seconds apart; `slowBlink` for lids that take their time
(Nemo). A half-shut eye keeps its light inside it.

## Eyes and skin

- **Pie eyes** (black, with a wedge of light) work on a pale face.
- **`soft`** eyes (round, with a small round catch of light) are for a dark
  face, and suit lashes too (Ellie, Odds).
- **Skin:** `paper`, or a tone from the film's own greys: `tan` (Rourke) or
  `umber` (Willie, the Walrus). Never ink.
- **The rule:** the old cartoons' minstrel shapes (ink-black skin, a pale ring
  of a mouth, big lips, huge white eyes) have no place on this boat. A Black
  character has the same proportions and expressions as everyone else; only
  the tone, the eyes and the hair change. The same care for anyone drawn
  from a group the old cartoons caricatured: no hooked noses for Lenny.

## Hats

A hat is drawn from the head beneath it (`hat(head, spec)` in `hats.ts`):

- **The crown keeps its own shape** (a cap's puff, a bowler's dome, an
  officer's flat top), **but its opening is the head:** it meets the head's
  outline at the band, so it can't float above it or swallow it.
- **The brim or peak is free to jut.**
- **A tilted hat turns about the middle of the head,** so it still sits on it.

Kinds: `beanie` (the crew's cap), `flat` (Gus), `soft` (Rourke), `bowler`,
`top`, `porkpie`, `boater`, `officer` (with a `badge`: anchor, wheel, dot;
`braid` for a sea dog). `band` is where it sits; `fit` makes room for hair
(Ellie's curls); `layer: 'over'` lets it break the frame; `size` sets a brim
or peak's half width, or a top hat's height.

A hat-wearer keeps its head's numbers in a const of its own
(`const gusHead = {...}`), so `head: gusHead` and `hat(gusHead, ...)` agree.

**Brows under a brim:** a brow the brim would cut through isn't drawn at all
(`brim`: the brim's lower edge). Gaylord, Konrad and the harbour master keep
their brows under their hats.

## Adding a face

1. In `faces.ts`, a `const` with a short description (who they are, the one or
   two shapes that make them) and the face's numbers. Start from someone
   similar and change what makes this one different.
2. **Give them a shape of their own,** or thirty captains look like cousins:
   a hat, a bun, a beard, a collar, ears, a silhouette.
3. If they wear a hat, a `const ...Head` and `...hat(...)` at the end of `parts`.
4. Add them to `FACES`, by the id they have in the game (`character.<id>` in
   the translations, and the story's `who` and rival ids).
5. Look at them on `/portraits.html` in every mood and at the small sizes,
   then at the table.

Things learned the hard way:

- **Don't position an animated part with a `transform` attribute:** the CSS
  animation's transform replaces it. (The sweat bead stays at one spot, which
  on a narrow face is in the hair; anime, and fine.)
- **A round dark shape low on a face reads as an open mouth.**
- **A face too like a famous one** (the Spy from MAD's *Spy vs. Spy*) is worth
  steering away from in a published game.

## The cast so far

Everyone in chapter one: the crew (Gus, Willie, Lars), Sandy and an ice sheet,
Steamboat Bill, Morag, the harbour master, the foreman and Rourke, Gaylord,
Ellie, Bettendorf's Tripp and Odds, and the pilot games' field: Konrad, Lenny,
Max Moritz, Ignatz, Nemo, the Walrus, Eliza and Finlay. Still to come: the
Rapids' stages, the Deadheads, the Fog Bank, the Big Muddy, the cook and her
family, Patty's inventor.
