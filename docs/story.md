# Story Mode: design notes

Status: **the tutorial is built and live** (Morag's lessons, see
[tutorial.md](tutorial.md)), and with it the caption system: speakers,
placement, beats, replies, moves asked for, outcomes and snags. The story
itself is still a proposal; its lines are drafts to argue over, not copy.

## Principles

- **Captions are a literary form.** Every line is written, read aloud, and
  turned over before it goes in. No filler, no generated padding. Fewer, better
  lines beat many average ones.
- **Short and punchy,** like the silent films: one sentence, two at most,
  plain words, a period flavour, a joke when one is earned.
- **Never in the way.** Every caption can be dismissed; none blocks a decision
  for longer than it takes to read.
- **The game teaches; the story motivates.** Rules come through play, not
  through text walls.
- **No feature creep.** A mechanic goes in when an encounter we actually want
  needs it, not before.

## Modes

| Mode | Shape | Banter |
|---|---|---|
| **Story** (the default) | Upriver to downriver: Muscatine to the World's Fair in St. Louis. A chain of encounters, beginning with Morag's lessons. No standings. | Full: introductions, table talk, parting words. |
| **Tournament** | The league as it is now: long, a line-up drawn from the gallery, standings. Unlocked by finishing the story (the Fair hosts it). | Sparse: a word at a meeting or a parting, little more. |
| **Multiplayer** | Later, and its own thing. | None from us. |

The tutorial is the first chapter of the story, and canon. It is not forced:
on a new device Morag asks *"Have we met, Captain?"*, and the buttons answer
(skip it, or play it).

## The story

**Muscatine.** The old captain, **Steamboat Bill** (everyone aboard calls him
Father; the player is no relation, just his trusted deckhand), has just landed a Big Snag: deliver a horseless carriage to the World's
Fair in St. Louis. That is how fin-de-siècle logistics work. It is all
downriver from here, an easy passage.

Then family calls him ashore (someone to tend to; between cargo and family,
family wins). The deckhand, the player, is made captain: *"You're the captain
now. Just stay away from those whiskey-swilling river gamblers and their Snag
Poker!"*

Except the passage isn't easy. There are snags everywhere. The harbour master
won't clear the boat unless you beat him at Snag; the captains ahead in the
queue at the bridge works will trade their place for a hand; the mail bag goes
with whoever wins it. Coal moves the boat, but Snag Poker moves the river.

So the young captain breaks the promise to Father at the first landing, and
Morag's ("You should NEVER play for money!") soon after, and keeps breaking
them all the way to St. Louis.

**No villains.** Nobody is chasing the boat, nobody wants it sunk. It is
river life, and poker is a large part of it. Every encounter is a transaction:
passage, funds, a place in the queue, a job taken on or handed off.

**The goal: honour your obligations.** Reach the Fair with the carriage, and
every other job you took on along the way delivered or passed on fair and
square. Then the Fair's great river tournament opens, and Tournament mode
begins.

## Snags as cargo

In the tournament a snag is a penalty to pass on. In the story it is cargo and
duty: the mail bag, the stinking hides, the eggs that must not go rotten, the
horseless carriage itself. It works the same at the table, and reads
differently:

- **Upkeep is the cost of carrying it:** feed for the livestock, ice for the
  eggs.
- **Pawning it** is another captain taking the job off your hands, which is
  the mechanic we already have.
- **Delivering it** is new: at the right landing (or simply "in St. Louis"),
  the snag leaves your hand and the obligation is met.
- **A full hand of snags is a full hold,** and a reason to take a detour or
  play someone for their place.
- Some snags are **reputation**, not cargo: decline the captain's code and you
  are handed *Yellow-belly* for free. It goes when you pass it on, like any
  snag.

## Encounters

Every meeting, the tutorial included, is a match with its own settings plus a
script:

| Setting | Options |
|---|---|
| Who | One captain, or a table of several |
| Pot | Off, or on |
| Currency | Coins, or buttons (the tutorial) |
| Deck | Shuffled, or arranged hand by hand |
| Format | Until someone's broke, a set number of hands, best of three |
| Stakes | The ante, plus whatever a reply adds ("I'll put $5 in the pot") |
| Script | The conversation and its triggers |

Story mode is a chain of encounters, and flags decide which lines play.

**An encounter must be solved to go on.** Until it is, it is the only thing
to do: no going back upriver, no going on to the next landing. What "solved"
means is the encounter's own: usually winning, sometimes not (see the coal
miners).

## The caption system

**Sizes** (built): an **aside** over the speaker's cards, play going on
underneath; a **scene** from their cards down to the board; the **full**
table but the buttons, for introductions and lessons.

**Speakers** (built). The opponent's lines have the notch pointing up at their
portrait. Anyone else (Willie, Morag from the rail, the player) has their
name above the quote and their portrait in the corner of the caption.

**Closing** (built), in any combination:

- **Auto-close:** a countdown ring runs round the speaker's portrait; when it
  is full, the caption goes.
- **Manual:** tap the caption.
- **Replies:** one or two buttons with labels of their own (defaults *Agree* /
  *Decline*). Each leads to another caption, or to an effect. A single reply
  sits on the white side; the black one stays empty, with no pretend "No".
- **Compliance:** the caption waits for a move at the table. *"Throw away
  that four, child"*: the button stays disabled until you have tapped the four
  and only the four, and making the move closes the caption.

**Effects,** a short list that grows only when an encounter needs it: start
the match; add to the pot; the opponent folds before the deal (no ante paid);
give a snag; deliver a snag; turn the pot on (or the buttons into coins); set
or clear a flag; move or adjust money (IOUs).

**Flags.** A plain list of strings in the save, pushed when something starts
and removed when it resolves (`owesGaylord`, `promisedMorag`). No ledger
screen, no new UI.

**To build, from the tutorial play-through:**

- **Heavy buttons** (built, `src/ui/heavy.ts`). Only the white button: carrying
  on takes commitment, giving up takes no time at all (the black is a plain tap,
  ← on the keyboard). Hold → or Space or Return for the white; `?quick` in
  development turns holding off. Each press soaks its own paper. A choice should feel decisive, not a brush against
  glass: hold to commit (1.2 s). The button soaks up ink like thin paper
  pressed into an inkpad, from a stylised fingerprint where the finger
  presses; let go early and it drains back, but the fingerprint lingers,
  fading: a patina on the controls. A haptic tick at the commit where phones
  allow it; Enter or Space held the same; screen readers activate at once.
  Only the action buttons; tapping cards and captions stays light.
- **Longer replies.** Some replies don't fit half a row (*"No, ma'am"* is
  cut off on phones). A single reply may take the full width; and some
  conversations may want more than two replies, stacked. A compact game:
  desktop needn't look its best.

**How the player is addressed** is just text, by speaker and mood: Captain,
Cap'n, Herr Kapitän; Kitty's "Captain of my heart".

## Worked exchanges

### The stinking hides (replies, a branch, the captain's code)

1. A captain wants rid of a cargo of hides. *Agree* / *Decline*.
2. Decline → the player: *"Never! Your stinking hides would foul my ship."*
3. The captain: *"Captain's code, then. Beat me at Snag and I keep them; lose
   and they're yours. I'll put $5 in the pot."* *Agree* / *Decline*.
4. Agree → the match starts, $5 extra in the pot.
5. Decline → *"You refuse the code? Good day, then."* They fold before the
   deal (no ante), and the player is handed **Yellow-belly** (*does not honour
   the captain's code*).

### Gaylord's sponsorship (an obligation that comes back)

- Bored and flush, Gaylord invests "before the money is gone anyway": he pays
  the young captain's entry into a big table (a multi-captain game) for an IOU,
  $50 now, $100 back. Not a snag: an obligation (flag `owesGaylord`).
- Later he turns up to claim it: perhaps an expensive extension if the
  player's purse is thin, perhaps a best-of-three to settle it, or, destitute
  himself by then, asking for a loan on the same terms.
- Not adversarial, not generous either. The same shape serves other stories:
  promising Morag to look for Finlay, getting caught up in one of Kitty's
  schemes, or enlisting Max Moritz against the Walrus and the Inspector.

## Morag MacTavish, the Governess

- A governess by trade and by temperament, on the river looking for her
  husband, **Finlay**, who has slipped off to play.
- She **loves** Snag Poker and is a master of it. What she cannot abide is
  everything that comes with it: the whisky, the wagering, the company.
- Author of a pamphlet on the subject (a candidate title: *On the Vileness of
  River Gaming*), which she quotes when it suits her.
- As a tutor: exacting, dry, secretly fond of a good pupil. Praise from her is
  rare and therefore worth something.
- She **is** the tutorial. In the story she probably returns as a passenger
  on the player's boat (name to be found), chasing Finlay downriver,
  disapproving all the way, quietly proud of you at the Fair.

## The tutorial (chapter one)

Morag's lessons, three rounds and a pickle played for buttons: the script,
the arranged decks and what the build needs are in [tutorial.md](tutorial.md).

## Landings (a dozen to aim for; six good ones will do)

Formats to mix: heads-up until the pot is won, best of three, table games.
Reasons to mix: to pass on a snag, to get passage, to get funds, to take on a
job.

1. **Muscatine.** Father ashore; the carriage is aboard; Morag's lessons.
2. **The harbour master** won't clear the boat unless you beat him.
3. **Striking coal miners:** no coal for the boilers, unless… (below)
4. **A nosy cargo inspector.**
5. **The mail bag:** another captain bound downriver could take it…
6. **The railroad bridge works:** a queue of boats; the eggs are going off;
   play the captains ahead for their place.
7. **Podunk Junction:** Gaylord, flush or destitute.
8. –
9. –
10. –
11. –
12. **St. Louis.** The carriage delivered; the Fair; the tournament opens.

### The striking coal miners: you win by losing

The boat needs coal, but there's a strike at the depot and the river grinds
to a halt. The solution, as ever, is a friendly game of Snag Poker, heads-up
against the **foreman**. But this time the goal is not to win: the captain
must **lose an appropriate amount**, after which the miners hand over a
"consolation prize" of coal. Not a bribe. Not in any way, shape or form.

- **Nobody says so.** The player has to work it out: from the foreman's
  setup line, and from the miners' mood as the strike fund fills (a warmth
  meter in asides). Sometimes you win by losing.
- **It has to be a convincing loss.** Folding hand after hand is throwing the
  game, and that would be a bribe: *"Folding again, Cap'n? You wouldn't be…
  letting us win?"* You must lose at the showdown: read that you're beaten,
  and call anyway, like an honest man.
- **An appropriate amount is a window, not a number** (say $25–40 into the
  strike fund). Too little: friendly, but no coal, and the river stays stuck.
  About right: *"Hard luck, Captain. Take a few sacks for your boiler. No hard
  feelings."* Too much: you've beggared yourself.
- **The coal is story, not a mechanic:** no counter, no card. Securing it is
  what solves the encounter; until then there's no going on to St. Louis.
- Perhaps: the **Unpaid Coal Bill** (an existing snag) as a way to earn
  goodwill, taking their debt off their hands.

Engine needs: a solve condition per encounter (here: the amount lost at
showdowns, within a window, without folding your way there), and lines keyed
to it.

## Characters with secrets

- **Max Moritz, Captain of the Mischief.** At the table, one very tall captain
  in a very long coat (the only hint: *"The coat giggles."*). Story Mode
  reveals the truth: Wilhelm Busch's two rascals, Max and Moritz, one standing
  on the other's shoulders. Once seated, one of them slips out under the table
  to swap cards and peek at hands. Their play style (the "griefer": not out to
  win, out to make you lose) fits; the reveal could come with a new rule for
  that match (they can see one of your cards, say), or simply as the joke.
- They **take turns on top.** Between rounds the coat changes hands: the
  portrait shows whichever boy is wearing the top half this round, and the
  play style follows him (one cautious, one reckless, say), while the other is
  off doing mischief under the table. One captain on the table, two
  personalities to read: attentive players can learn to tell them apart.

## Next steps

1. A **character pass**: every captain's name, title, description and voice,
   with the story in mind (who they are, what they want, what they say).
2. Fill in the landings: who is there, what they want, the format.
3. Story mode itself: encounters built on what the tutorial already uses
   (arranged hands, scripts by trigger, snags that outlive a game).

## Open questions

- Who calls Steamboat Bill ashore.
- The name of the boat.
- How Morag comes aboard, and whether she stays to the Fair.
- What happens when you run out of money mid-river (a loan from Gaylord?).
- Banter volume in Tournament mode.
