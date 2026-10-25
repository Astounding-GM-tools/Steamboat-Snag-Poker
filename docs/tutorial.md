# The tutorial: Morag's lessons

Status: **round one is playable** at `/?tutorial` (the deck and lines in
`src/story/tutorial.ts`); the rest is script in progress. Chapter one of the story, and canon: the
deckhand meets Morag MacTavish, who is looking for her husband, and learns
Snag Poker from the one person on the river who disapproves of it. See
[story.md](story.md) for the caption system and the story around it.

## How to read the script

- **Morag** is the opponent, so her lines carry the notch. Before the deal and
  between hands they can be **scenes** (any length within reason); once cards
  are on the table they are **asides** over her cards (about 65 characters,
  two lines), so your hand and the board stay in view.
- **The deckhand speaks on the buttons:** short questions (*Lout?*, *Flop?*,
  *Ducks?*) that she answers at length. Two replies with the same outcome are
  fine. A line of the deckhand's own (**You:**) is a caption with your
  portrait in the corner.
- **"You must"** marks a line that waits for a move at the table: only that
  move lights the button, and making it closes the line.

## Round one: Ducks full of Ladies (no pot)

| | You | Morag | Board |
|---|---|---|---|
| Deal | Q♥ K♥ A♥ | A♣ A♦ 9♠ | |
| Flop | | | A♠ 7♥ 2♣ |
| Turn | swap A♥ K♥ → 2♦ 2♥ | stands pat | Q♠ |
| River | | | 5♦ |
| Hands | **Ducks full of Ladies** (2♦ 2♥ 2♣ Q♥ Q♠) | three aces | |

The board never pairs, so she stays on three aces; your hand is made on the
Turn. You throw away the best cards you will hold all evening and draw two
deuces, which look like a disaster for half a second.

**Before the deal** (scene)

1. *"You, there! Have you seen my lout of a husband?"* → **Lout?** / **Who?**
2. *"Finlay MacTavish by name, good-for-nothing by nature. Always sneaking off
   to play Snag Poker."* → **Snag?**
3. *"A vile game, fit for drunkards and liars. You don't know it?"* → **No,
   ma'am**

**The Flop** (asides)

4. *"Three cards each, and three in the middle. This is the Flop."* →
   **Flop?**
5. *"Yes, the Flop. Swap what you don't want. Those are good: keep them."* →
   you must **Check**.

**The Turn**

6. *"A fourth card. This is the Turn."* → **Turn?**
7. *"Last chance to swap. That ace and that king are no use to you now."* →
   **Both?**
8. *"Between the two of us, I hold two aces. Find something better."* → you
   must swap the ace and the king, and only those.
9. **You:** *"Twos! You tricked me!"*
10. *"Look again. Your ducks have a friend."* → **Ducks?**
11. *"Hush. Play your hand."* (No explanation yet: it comes at the showdown.)

**The River**

12. *"The River. Pick cards to go with the ones in the middle."* → **Five?**
13. *"Five make a hand. Tap all three of yours."* → you must tap 2♦ 2♥ Q♥ and
    **Play hand**.

**The showdown** (scene)

14. *"There you go: the mighty aces brought low by a pair of ducks."* →
    **Ducks?**
15. *"Deuces, child. Ducks, on the river. Aces are bullets, and so on. Knowing
    how ducks beat bullets is the same as knowing when to fold and when to
    call."* → **Call?** / **Fold?**
16. *"I forgot to show you. Here, look."* She deals round two.

## Round two: check, then fold (no pot)

A hand that goes nowhere: you check on the Flop and fold on the Turn. Calling
waits for round three, since with no pot there is no fee to call.

- On the Flop you can only **Check**.
- On the Turn, something like *"That hand is going nowhere. Fold it."* → you
  must **Fold**.
- *"And that's how you dodge snags: you win, or you fold wisely."* →
  **Snag?**
- *"Ah yes, snags. We'd need some stakes for that. Here, have some buttons, so
  we have something for the pot."* The buttons appear, a stack on each side.
  (An earlier line that may still find a place: *"You should NEVER play for
  money!"*)

Deck: to be arranged.

## Round three and on: the pickle (buttons)

One hand, designed with care: winnable, and repeatable until one side has all
the buttons. A smart player works out which cards to tap and when to call. The
same ranks every time, the suits and the order of the cards changed, so it
can be learned without looking copied.

- The first time you call (a scene, before the decision): *"Now it costs a
  button to see the next card. You can fold, or pay to stay in the game:
  that's a call."*
- Perhaps a snag rides along, with Morag explaining it the first time: the
  last rule, learned by beating the pickle.
- After any hand you win: *"And now you know why you must stay away from Snag
  Poker. Now hand me my buttons back."* → **Not yet** (another round) /
  **Sure, thanks** (the tutorial ends).
- When either side is out of buttons, it is over for good. You win: *"Cleaned
  out by a deckhand. Not a word of this to Finlay."* You lose: *"And that,
  child, is why you never play for money."*
- The last caption says where each button goes, so the labels stay short:
  **Menu** (black) and **Story** (white).

Deck: to be designed.

## Needs from the build

- **An arranged deck per hand,** and Morag's moves scripted to match (the
  shuffle is already seeded).
- **The pot off per round** (`potMode` exists), and **buttons** as a coin face.
- **Folding without a pot** in round two, and a line that waits for a fold.
- **Triggers:** before the deal, on each street, after your swap, at the
  showdown, after a hand.
- **A test per arranged hand:** the evaluator agrees with the script (round
  one: Ducks full of Ladies beats three aces).

## Open

- Round two's deck, and Morag's line on the Turn.
- The pickle's deck, and whether a snag rides in it.
- The first-call line is long for an aside: shown as a scene before the
  decision, or trimmed.
