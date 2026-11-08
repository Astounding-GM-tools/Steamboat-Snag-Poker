# Art: portraits, scenes and vignettes

From the drive of 7 November. Drafts, not copy.

- All art in HTML or SVG, animated in the browser. A rubber hose limb is one curve from shoulder to hand: move the hand and the curve bends.
- A character is a rig of shapes and paths; each pose is a few points, not a new drawing. Portrait moods (neutral, confident, nervous) are poses of one rig, and can blend.
- Grain, flicker and vignette as SVG filters.
- Prior art: the RubberHose plugin for After Effects. New here: live, in the game.
- On mobile an animation can't sit beside the table, so either full screen between games, or in place of the pot during a game.

#### Full-screen scenes

- Bill hands over the boat at Muscatine
- Willie's ducking, and Lars fishing him out
- Pretty Patty driven up the ramp, stalling, Lars pushing her aboard
- The quiet morning after the rafts cast off
- Arriving under the Eads Bridge at the Fair

#### In place of the pot (obstacle games)

- Sandy at his bar, sand drifting off as you win
- Lars chopping at the ice jam
- The fog rolling over the board, the whistle lifting it
- Willie at the bow with his pole in the Deadheads
- The boat inching up the rapids, chain by chain

#### Portraits

- **Crew:** Willie, Gus, Lars
- **Story people:** Steamboat Bill, Morag, Gaylord, Ellie Sawyer, the cook (Mrs. Halloran, working name), Patty's inventor, the harbour master, the depot foreman
- **Obstacles:** Sandy, the ice sheets, the Deadheads, the Fog Bank, the Big Muddy
- **League gallery:** counted separately (roster.md)

*The portraits are built: see docs/portraits.md for how the system works and how to add a face. What follows is the plan as first drawn up.*

#### The portrait system

One Svelte component, `Portrait`, renders every face as SVG; each character is data passed in.

- **A shared face rig:** named parts (outline, hair, ears, brows, eyes, nose, mouth), each its own group with a pivot point. Props for the shape and style of each part (lips, nose, ears and so on).
- **Moods are settings,** not drawings: neutral, confident and nervous nudge the same parts, and can blend.
- **Effects written once,** working on any face: blink, shifty eyes, wrinkled nose, twitching brow. Per-character settings tune them (how often they blink; Gaylord's eyes slide sideways when he bluffs).
- **Extras** as slots: top hats, earrings, shoulder parrots, bow ties, a bar towel.
- **A custom outline** for non-human opponents, in the anthropomorphic cartoon tradition: Sandy as a heap of sand with eyes, moustache and bow tie; the Big Muddy as a swirling mouth; ice sheets with frosty brows. The face inside stays the standard rig.
- **Against sameness:** each character brings at least one shape of its own (silhouette, hat, size), or thirty captains look like cousins.
- **Look at the boat's SVG animation first.** It wasn't built as a framework; reuse what fits, keep one way of animating in the codebase. Plain SVG, no Rive or Lottie runtime; GSAP or the Web Animations API if needed.

## Scenes and vignettes

**Tried first: the Sandbar** (`src/ui/scenes/SandbarScene.svelte`; `/scenes.html` plays with it).
The *Best Intentions* aground on Sandy's heap, the heap his pile: shrinking as you win, sand
drifting off downstream, growing as you lose, and she floats when it's gone. It worked as a
picture, but not in its place across the head of Sandy's seat: there it was just the boat tilted
against his portrait, and added too little. Taken out of the game; Sandy keeps his portrait. The
placement is the problem to solve, later (there are ideas). The component and the page stay.


One 4:3 frame everywhere (silent-film ratio; Academy 1.37 came with sound around 1932). On a phone, full width, it fits over the opponent and pot area.

- **Scenes** play with a game, in the frame above the table. **Vignettes** set the stage between games, with a caption under them.
- **The scene is the score:** it moves with the obstacle's pile. Patty creeps up the ramp as you win and slips back as you lose; Sandy shrinks; the ice jam breaks up.
- **Snags fire gags:** a played snag gets its moment in the scene (a Broken Pole snaps under Lars; a Runaway Mule wanders onto the ramp; Willie sneezes and everyone lets go).
- **Never hide what the player reads:** the opponent's purse, snags and discards. Better still, show them in the scene (Sandy's discards on the bar). Keep a small trace of the pot: it decides calls.
- Cartoon contract: anything can happen, nothing sticks. Slapstick shows the danger and nobody is hurt.

### Scenes

Sandy (both visits), the ice jam, Patty's loading, the rapids up and down, the Deadheads, the Fog Bank (the scene under fog too), the lock queue (the lock filling), the long haul (shore passing, light going amber), the Chain of Rocks, the swing bridge.

**The deck game,** every night: the boat on dark water, a lantern on deck, tiny figures round it playing cards. The evening's closing line lives in it (the wick gutters, the moon comes out as Lars sings, a frog complains). On raft nights the lantern light spreads over a whole village.

### Vignettes

- Each hub: the Tri-Cities levee, Dubuque, LeClaire and its saloon, Muscatine.
- The boat travelling alone (the current boat animation, smaller).
- **The tow:** six rafts behind the boat. As fuel burns, the rafts get fewer and the upper deck fills with tiny people, a chair or a cradle among them.
- The arrival at St. Louis.
