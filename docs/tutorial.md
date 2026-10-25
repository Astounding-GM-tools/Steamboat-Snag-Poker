# The tutorial: Morag's lessons

Status: **playable from start to finish** at `/?tutorial` (decks and lines in
`src/story/tutorial.ts`; in development, `tutorialButtons()` in the console
jumps to the knockout). Chapter one of the story, and canon: the
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
**The River**

11. *"Later, child. This is the River: pick cards to go with the ones in the
    middle."* (No explanation of the ducks yet: it comes at the showdown.) →
    **Five?**
12. *"Five make a hand. Tap all three of yours."* → you must tap 2♦ 2♥ Q♥ and
    **Play hand**.

**The showdown** (scene)

14. *"There you go: the mighty aces brought low by a pair of ducks."* →
    **Ducks?**
15. *"Deuces, child. Ducks, on the river. Aces are bullets, and so on. Knowing
    how ducks beat bullets is the same as knowing when to fold and when to
    call."* → **Call?** / **Fold?**
16. *"I forgot to show you. Here, look."* She deals round two.

## Round two: the wise fold (no pot)

| | You | Morag | Board |
|---|---|---|---|
| Deal | J♠ J♦ 3♣ | Q♥ 10♥ 5♣ | |
| Flop | check | stands pat | A♥ K♥ 9♥ |
| Turn | fold | stands pat | 4♥ |

Your pair of jacks is decent on the Flop. Morag has a flush already, the best
there is (no other flush beats it, no straight flush can be made; the J♥
would have made her a royal). The Turn brings a fourth heart: any heart makes
a flush, you hold none, and she has not traded a single card. Her discards are
the tell: that is the lesson.

**The Flop** (aside)

1. *"Want to trade in any card, or check up on what comes next?"* → you must
   **Check**.

**The Turn** (asides)

2. *"When there's no cost to stay in the game, that is a Check."*
3. *"Four hearts in the middle, and I've not traded a card. Well?"* →
   **Fold?**
4. *"Fold."* → you must **Fold**.

**After the fold** (scene)

5. *"Wise. My queen of hearts made the best flush there is."* → **Best?**
6. *"Nothing on this table could beat it. And that's how you dodge snags: you
   win, or you fold wisely."* → **Snag?**
7. *"Ah yes, snags. We'd need some stakes for that. Here, have some buttons, so
   we have something for the pot."* The buttons appear. (Snags are explained
   when one first comes up, in the pickle. An earlier line that may still
   find a place: *"You should NEVER play for money!"*)

## Round three: room for a snag (buttons, still arranged)

The buttons are out and both snags are in play, but the deck is still
arranged: the last lesson before the knockout.

| | You | Morag | Board |
|---|---|---|---|
| Deal | 8♠ 8♦ K♣ + Grudging Respect | A♣ K♦ 6♥ + the Solemn Oath | |
| Flop | call | stands pat | 8♥ A♦ 4♣ |
| Turn | call | stands pat | 4♠ |
| River | your choice | A♣ + the Oath: two pair, aces and fours | J♥ |

The rules are the regular game's: five cards to a hand, and a snag takes one
of the five places. So on the River the eights make a full house, with no
room for a snag (you win, and keep your Respect); three eights with Respect
riding still beat her two pair (you win, and she takes your Respect).
Nothing is said about it: the callout shows the full house turn into three
of a kind as the snag goes in.

- **Before the deal** (over the empty board, so both snags stay in view): her
  snag introductions (drafts).
- **The Flop:** the first-call scene, then *"Yes. Call."* (you must call; no
  swaps, the deck is arranged). **The Turn:** *"And again, to see the
  River."*
- **After the hand** (drafts): she took your Respect: *"Hmph. Grudging
  Respect, landed on me. / I suppose you've earned it."* You kept it: *"A full
  house: a fine hand, with no room for a snag. / The pot is yours. So is your
  Respect, still."* You lost: *"And now you carry my Oath. / Mind your cards,
  child."*

## Round four and on: the knockout (buttons)

No more arranged decks: from round four it is a real game,
shuffled, until one side has all the buttons. (Any further constructed lesson
goes in before the pot and the snags arrive.)

- **20 buttons each.** The ante is the round number (3, then 4…), a button to
  see the Turn and one for the River, each snag a button of upkeep, and a snag
  lost with costs 2.
- **The snags:** you are handed **Grudging Respect**, and want Morag to
  receive it; she carries **the Solemn Oath** (never to play Snag Poker again)
  and wants you to take it. Ideally you dodge the Oath and she ends up with
  your Respect; how it goes is anyone's guess, and it can be played again and
  again.
- The buttons are drawn as sewing buttons, and prices on the action buttons
  use ⚇ for a button (*Call · ⚇1*).

**When the snags arrive** (first hand only; drafts, the snag explanation still
to be written properly)

1. *"Here: Grudging Respect, for you. Pawn it off on me, if you can."* →
   **Snag?**
2. *"A snag is a burden. Win with it in your hand, and the loser takes it.
   Lose with it, and it costs you."* → **And yours?**
3. *"My Solemn Oath, never to play Snag Poker again. You'll be taking it off
   my hands."* → **We'll see**

**The first call** (scene, on the Flop): *"Now it costs a button to see the
next card. You can fold, or pay to stay in the game: that's a call."* →
**Call?**

**The knockout runs until one side is unbuttoned** (no standings between
hands, no offer to stop: poker is the long game, Snag Poker doubly so). **The
money ends the game; the snags outlive it:** whoever holds them at the end
keeps them (even a captain who goes broke). Her last word reads both:

| | You have all the buttons | She has all the buttons |
|---|---|---|
| **She holds your Respect** | *"Cleaned out by a deckhand. / And I do hold a grudging respect for you, it seems. Well done."* | *"You are out of buttons. / But I do find myself holding a grudging respect for you."* |
| **You still hold it** | *"Cleaned out by a deckhand. / Yet your snag remains with you."* | *"You are out of buttons. / And your snag remains with you."* (draft) |

Then, if you are left holding her Oath: *"Now you know what Snag Poker is. / Do
you swear never to play this game for money?"* → **I swear** / **Yes. I
do.** (Whichever you press, you swear.)

If the game ends on round three itself, these are her words there too (her
round-three reactions are for a game that goes on).

For now every ending goes back to the title. Later the last caption offers
**Menu** (black) and **Story** (white).

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

- The snag explanation, properly written.
- The first-call line is long for an aside: shown as a scene before the
  decision, or trimmed.
