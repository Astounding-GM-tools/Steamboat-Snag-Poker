# The tutorial: Morag's lessons

Status: **playable from start to finish**: **Tutorial** on the title screen
(always there, and on How to play) (decks and lines in
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
- **Where captions sit:** hers on her half, yours on yours. Before the deal
  over the empty board (her snags stay in view); during play over her cards;
  after a hand between her cards and the board (both stay in view). Yours
  over your purse, or your side of the table. Nothing covers her cards while
  they turn over. Multi-sentence lines can be written as beats: separate
  paragraphs, each a moment after the last.

## Round one: Ducks full of Ladies (no pot)

| | You | Morag | Board |
|---|---|---|---|
| Deal | J♣ Q♥ K♦ | A♣ 9♠ 5♥ | |
| Flop | keep: a pair of queens, a straight draw | | A♠ 2♣ Q♠ |
| Turn | swap J♣ K♦ → 2♥ 8♦ | stands pat, then shows her hand | 2♦ |
| River | | | 6♣ |
| Hands | **Ducks full of Ladies** (2♥ 2♣ 2♦ Q♥ Q♠) | two pair, aces and deuces | |

High cards everywhere: it *looks* like poker, which is what the ducks then
subvert. The Turn pairs the deuces: you hold queens and deuces, she holds
aces and deuces, and you've seen her cards all along. Her advice is the best play by the odds,
without knowing the deck is stacked (simulated, 40,000 deals each):

| At The Turn | Chance |
|---|---|
| Keep all three (a ten for the straight, or a queen) | 13.6% |
| Swap the jack, or the king, alone | 16% |
| **Swap the jack and king, keep the queen** (her advice) | **26.3%** |
| Swap all three | 26.5% |

Holding one ace, she can't make aces full. Once she has shown her hand, the
showdown goes straight to the verdict.

**Before the deal** (scenes, over the empty board)

1. *"You, there! / Have you seen my lout of a husband?"* → **Lout?** /
   **Who?**
2. *"Finlay MacTavish by name, good‑for‑nothing by nature. / Always sneaking
   off to play Snag Poker."* → **Snag?** / **Poker?** (read left to right,
   the deckhand spells out the name of the game)
3. *"A vile game! / Fit for drunkards, and liars… / … do you not know it?"*
   (broken off mid-tirade, by concern for a child deprived of the game she
   detests) → **No, ma'am**
4. *"Well. We can't have that. / I'll show you."* Said as she deals, in the
   pot area: the cards go out beneath it.

**The Flop** (in the pot area, so her cards and her Oath stay in view)

5. *"Three cards each, and three in the middle. / This is The Flop."* (a
   name, said with reverence) → **Flop?**
6. Her cards turn over, and stay up all hand: *"Since you are learning, I'll
   show you my cards from the start. / See what I have?"* → **Aces!**
7. *"Indeed. Let me see your cards… ah. / My aces beat your ladies. So how
   can you make your hand stronger?"* → **Swap?**
8. *"Not yet. Keep what you have, and see what comes."* → you must **Check**.

**The Turn** (in the pot area)

9. *"A fourth card arrives. / This is The Turn."* → **Turn?**
10. *"This is where the game is won and lost: the point of no return."* →
    **…lost?**
11. *"Not lost, not yet. Now you swap. / Ditch the boys, keep the queen."* →
    **Both?** (Tap the jack and king while this is up and the button becomes
    **Swap 2**: swapping skips the next line.)
12. *"Both."* → you must swap the jack and the king.

No word of what might come: the ducks arrive as luck, not prophecy.

13. **You:** *"Bah. It's just number cards."* (you drew a deuce and an 8)
14. *"Numbers win battles, not kings and queens. / Look at the ducks."* →
    **Ducks?**

**The River** (in the pot area)

15. *"Hush. This is The River. / Pick cards to go with the ones in the middle."* (No explanation of the ducks yet: it comes at the showdown.) →
    **Five?**
16. *"Five make a hand. Tap your queen and your deuce."* → you must tap Q♥ 2♥ and
    **Play hand**.

**The showdown** (scene)

17. *"There you go: the mighty aces brought low by a flock of ducks."* →
    **Ducks??** (the second time: exasperated)
18. *"Deuces, or Ducks, when they come in pairs. / Because they look a bit
    like ducks, swimming on the river."* → **Aces, then?** (the deckhand
    can't ask about Bullets, a word not yet learnt)
19. *"A pair of aces are Bullets, and so on. / Knowing how ducks can beat
    bullets is the same as knowing when to fold and when to call."* →
    **Call?** / **Fold?**
20. *"I forgot to show you. Here, look."* She deals round two.

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

**The Turn** (in the pot area)

2. *"When there is no cost to stay in the game, that is a check. / You should
   always check."*
3. She looks at your cards first: *"Let me see your cards… / Two jacks.
   Against four hearts on the board and a player that just checked. That's a
   folding hand."* → **Fold?**
4. *"A big part of the game is knowing when to quit."* → you must **Fold**.

Everything she says is true from what she can see: your jacks can't beat her
flush without a miracle (a heart would only make a smaller flush), and a
captain who stands pat on four hearts is the tell.

**After the fold** (scene)

5. *"Wise. My queen of hearts made the best flush this board allows."* →
   **Best?** (She shows her hand first: the cards, then the words.)
6. *"Your jacks never stood a chance. / And that's how you dodge snags: you
   win, or you fold wisely."* → **Snag?**
7. *"Ah yes, snags. We'd need some stakes for that. Here, have some buttons, so
   we have something for the pot."* The buttons appear. (Snags are explained
   when one first comes up, in the pickle. An earlier line that may still
   find a place: *"You should NEVER play for money!"*)

## Round four: room for a snag (buttons, still arranged; round three is the hands, below)

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
  Respect, still."* You lost: *"And now you carry my Oath. / Mind your cards."*

## Round five and on: the knockout (buttons)

No more arranged decks: from round five it is a real game,
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
3. *"A Solemn Oath, never to play Snag Poker for money. You'll be holding that
   soon enough."* → **We'll see**

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

Every ending also offers a rematch, **Again?** (black; **Thanks, ma'am** on
the white closes the tutorial, or leads to the Oath if you hold it): it's a
tutorial, and buttons aren't money, so her oath is safe: *"Buttons are not
money. / My oath is quite safe. Deal."* (draft) A fresh knockout
follows, 20 buttons each, Respect back with you and the Oath with her.

If the game ends on round four itself, these are her words there too (her
round-three reactions are for a game that goes on).

For now every ending goes back to the title. Later the last caption offers
**Menu** (black) and **Story** (white).

## The hands (round three, skippable)

Offered at the end of round two: "Your jacks never stood a chance. Do you
know your hands, child? Which beats which?" **No, ma'am** deals this round;
**Of course** goes straight on to the snags and the buttons (the round is
passed by, and the ante still starts at 3). Either way the snag lines and
the buttons follow. One round, the deck **openly rigged** and Morag **playing open**: it is a
teaching moment, not a game, and the sequence is always the same. The
weak hands on the Flop, the middling ones on the Turn, the big ones on the
River; and the lesson worth coming back for: a good middling hand must be
given up when the board makes bigger ones easy. Deal in `src/story/hands.ts`.

- The Flop 2♥ 3♣ 4♥. You A♥ 7♠ 4♣; Morag 2♠ 4♦ K♣.
- Swaps: you 7♠ 4♣ for 5♥ 6♥; she 4♦ K♣ for 5♠ 6♣.
- The Turn 2♦ (the board pairs). You A♥ 5♥ 6♥: the wheel (ace and five, a
  straight five-high) and a flush (all three); she has a straight (two to
  six), and three twos.
- You give up the flush: 5♥ 6♥ for 3♦ 3♠.
- The River 3♥. You: a full house (3♦), four of a kind (3♦ 3♠); she lays
  2♠: twos full of threes. Your four threes win.

Where the answer is a card, you tap the card and the button names what it
makes (**High card**, **Pair**): the "show me" tap (`names` on a line: the
callout names the hand, nothing is played, and the reply waits for exactly
those cards). Her lines sit between her cards and the board, which holds
about four rows: the longer lines below are said one sentence at a time.

### The Flop

1. "Hands it is, then. I'll rig the deck, and I'll play open: you see my
   cards, I see yours."
2. "We share the cards in the middle. See your ace?" → tap the A♥:
   **High card**
3. "That's the high card. If you play that and I play my king, you win."
4. "But I can play my deuce instead, and have a pair. Any pair beats any
   high card. So what do you do?" → tap the 4♣: **Pair**
5. "Right: you play the four. Your pair of fours beats my pair of deuces."
   → **Ducks!** (remembering) "Exactly: a pair of deuces is called ducks.
   Well done."
6. "But I have a four too. And two pair beats one pair. So what do you do?"
   → **Swap?**
7. "That's right. These are all weak hands." / "Let me rifle the deck for
   something that suits you better. Throw away the seven and the four." →
   swap 7♠ 4♣
8. Her own swap, as the cards land: "And for me… a five, a six. That will
   do nicely."

### The Turn

1. "Oh, another deuce. With my deuce, I can count three alike." / "We call
   that three of a kind, or trips, and it beats two pair." → **Next**
2. "But I can do better. Now I can count from two to six, do you see it?
   Two, three, four in the middle, and five and six in my hand." / "When the
   cards run in a row like that, it's called a straight." → **Right.**
3. "And so can you, because an ace can also count as a one and start a
   run." → tap the A♥ and 5♥: **Straight**
4. "Exactly. That straight is called the wheel, and since its highest card
   is a five, it doesn't beat my straight. So you must try something else."
   → tap all three: **Flush**
5. "That's right! Five cards of the same suit are called a flush, and a
   flush beats any straight." → **I win?**
6. "Not yet. See the pair on the board?" → **Ducks** (matter-of-fact: the
   lingo has stuck)
7. "With a pair in the middle, someone could easily have a full house: a
   pair and a three of a kind together. A full house beats every hand we
   have now, pretty as they are." → **I lose?**
8. "Most likely, unless you give up the hand you've got. A flush is a decent
   hand, but often not good enough with a pair in the middle." / "Throw away
   the five and the six. I'll find you something better still." → swap
   5♥ 6♥
9. She deals you 3♦ 3♠, without a word: yours to notice.

### The River

1. "Oh! Two pair on the board now. Do you see them?" → **Crabs over ducks**
2. "Very good! So everyone at the table has two pair now. Tap one of your
   threes. What do you have now?" → tap the 3♦: **Full house!**
3. "Exactly! And so do I." (her deuce) "Ducks full of crabs. Whose hand is
   stronger?" → **Yours** ("No: mine is weaker. Your house has three threes;
   mine only three deuces. The bigger three wins.") / **Mine** ("You are
   right: your house is stronger.") → **I win?**
4. "You do, but you have an even stronger hand waiting for you. Do you see
   it?" → tap the 3♠ too: **Four of a kind**
5. "Exactly. Four alike, also called quads, is the strongest hand on this
   board." → **Strongest?**
6. "Well, there are also straight flushes: all the numbers in a row, and in
   the same suit. Exceedingly rare, so it does not pay to chase them." →
   **Next**
7. "And those are the hands. In case you forget, they're ranked in How it
   works: open the question mark and see." → the "?" pulses; open How it
   works (her pamphlet against the game, the hands near the top) and close
   it (`require: 'help'`) → "Now play your four threes." → **Play hand**:
   four threes against her full house. You win.
8. "Four threes beat my full house. Now you know your hands." → **Thank
   you, ma'am**, and on to the snags (as after round two).

No "Again?" here: that's for the real play that follows. The lesson comes
round again only with the tutorial.

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
