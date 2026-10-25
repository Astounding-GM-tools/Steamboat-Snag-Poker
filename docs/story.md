# Story Mode: design notes

Status: **planning**. Nothing here is built yet. The structure is a proposal;
the lines are drafts to argue over, not copy.

## Principles

- **Captions are a literary form.** Every line is written, read aloud, and
  turned over before it goes in. No filler, no generated padding. Fewer, better
  lines beat many average ones.
- **Short.** One sentence, two at most, in the silent-film voice: plain words,
  a period flavour, a joke when one is earned.
- **Never in the way.** Every caption can be skipped with a tap; none blocks a
  decision for longer than it takes to read.
- **The game teaches; the story motivates.** Rules come through play, not
  through text walls.

## Modes

| Mode | Shape | Banter |
|---|---|---|
| **Story** (the default) | Short and crafted: a chain of meetings up the river, heads-up, stakes rising from pennies. Begins with Morag's lessons. | Full: introductions, table talk, parting words. |
| **League** | The current tournament: long, a line-up drawn from the gallery, standings. | Sparse: a word at a meeting or a parting, little more. |
| **Multiplayer** | Later, and its own thing. | None from us. |

## Morag MacTavish, the Governess

- A governess by trade and by temperament. She is on the river looking for her
  husband, **Finlay**, who has slipped off to play (the roster already has her
  following him: she only comes aboard where he plays).
- She **loves** Snag Poker and is a master of it. What she cannot abide is
  everything that comes with it: the whisky, the wagering, the company.
- Author of a pamphlet on the subject (title to be decided; a candidate is
  *On the Vileness of River Gaming*), which she quotes when it suits her.
- As a tutor: exacting, dry, secretly fond of a good pupil. Praise from her is
  rare and therefore worth something.

Open: how she and the player meet, and what she wants in return for lessons
(help finding Finlay is the obvious bargain).

## Characters with secrets

- **Max Moritz, Captain of the Mischief.** At the table, one very tall captain
  in a very long coat (the only hint: *"The coat giggles."*). Story Mode
  reveals the truth: Wilhelm Busch's two rascals, Max and Moritz, one standing
  on the other's shoulders. Once seated, one of them slips out under the table
  to swap cards and peek at hands. Their play style (the "griefer": not out to
  win, out to make you lose) fits; the reveal could come with a new rule for
  that match (they can see one of your cards, say), or simply as the joke.

## The tutorial (chapter one)

A few hands against Morag with **arranged decks**, each hand teaching one
thing. She comments while you play, in the river head, without taking the
board away.

1. **Swapping.** A hand that wants one obvious card thrown away.
2. **Check, call and fold.** A hopeless hand, and the lesson that folding is
   not shameful.
3. **The River.** Making a hand from your cards and the board.
4. **Snags.** One rides along; you win, and it goes to her.

Needs from the engine: a way to **script the deck** for a hand (the shuffle is
already seeded; this is a small hook). Needs from the UI: a caption that can
sit in the river head while the board stays in play.

## Dialogue

Triggers, each with a small, hand-written set of lines per captain (most
captains need only a few):

- **Meeting** (introduction) and **parting** (after the match, by outcome)
- **Round start**, sparingly
- **Snag moments:** a snag fished, a snag dumped on them, a snag dumped on you;
  lines may name the snag ("Drat! My layabout nephew!")
- **Fold** (theirs and yours), **big pot**, **going broke**
- **Player replies** where it is a conversation: the white button for the bold
  answer, the black for the cautious one, or simply Next

The motif for asking anything of anyone on the river: *"…if you can beat me at
Snag Poker."*

## Draft lines (to argue over)

- Morag, on a poor discard: *"Throw away that four, child. It is doing you no
  favours."*
- A captain receiving the Layabout Nephew: *"Drat! My no-good nephew!"* —
  Player: *"I can take him off your hands, Captain… if you beat me at Snag."*
- Any captain asked for help: *"Sure, I'll carry your message to St. Louis…
  if you can beat me at Snag Poker!"*

## Next steps

1. A **character pass**: every captain's name, title, description and voice,
   with Story Mode in mind (who they are, what they want, what they say).
2. Then Story Mode in earnest: the dialogue layer, Morag's lessons, the first
   meetings.

## Open questions

- The river and its stops: real places (St. Louis, Natchez, New Orleans) or a
  river of our own?
- The player's own goal in Story mode, and how it ends.
- How much of Story mode reuses the League engine (line-ups, sitting out) and
  how much is heads-up only.
- Banter volume control in League mode.
