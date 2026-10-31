# High Rollers: the final table

Status: **in development** on the `final-table` branch. Try it at
`/?highrollers` (development builds).

The tournament's finale, and in the story a table to sit in on at smaller
tournaments along the river (the table takes its rivals, purses and stakes
from whoever seats you, and hands back how it went). Four captains at one
table: the money gets serious, everyone plays everyone, and it runs until
the first captain is broke; then comes **The Last Hand**, and that's it.
What you walk away with is your score.

## The rules

- **Four captains at one table:** you and three rivals, each with the purse
  (and the snags) they brought.
- **The antes stay as in the League.** Seeing the Turn costs **half the
  ante**; seeing the River costs **the full ante**. Swaps cost as always (the
  k-th card thrown away in a hand costs k).
- **Everyone acts at once, in secret,** as in a duel; but the moves resolve in
  **seat order**, and that order is real: swaps draw their replacements off
  the deck one seat after another. Who acts first rotates each hand, like a
  dealer's button.
- **Folding** (on the Flop or the Turn) takes you out of the hand: your money
  stays in the pot, you stay at the table watching, and you're out of reach of
  the snags. If everyone else folds, the last captain in takes the pot.
- **The River raise:** first **Play hand** (held) lays your hand (nothing is
  committed yet: tap a card to pick it back up); then **Raise** (black) or
  **Next** (white) commits it. The raise is the table ante (times the
  stakes). Raises made at the same moment don't stack: every raiser is in
  once. Then everyone else still in **matches or folds** (black: Fold, white:
  Match), in secret, at once; one raise, no re-raising. If everyone folds to a raise,
  the raiser takes the pot unseen.
- **All in:** nobody pays more than they have. Short of the price (the ante,
  a fee, a raise), you put in everything and stay in the hand; the pot holds
  only real money. Lose it, and with nothing left, you're out.
- **The showdown:** the best hand takes the pot (a tie splits it). **The
  snags go to the weakest hand** still in: every snag the winner played, and
  any snag at stake on the board. A loser who played a snag keeps it and pays
  the winner its forfeit.
- **The Last Hand:** when the first captain goes broke, the next hand is the
  last, at **double stakes** (the ante, the fees and the raise; not the
  snags' upkeep). Folding early is the safe play, keeping what you have; but
  your purse at the end is your score, so a big score means betting hard on
  it. After it, those still standing take **gold, silver and bronze** by
  purse; the broke follow, the latest out first.
- **Purses:** $160 each on its own (in the story, whatever the captains
  bring). With that, a table lasts **5–8 hands** about 85% of the time
  (`scripts/raise-*.sim.ts`, with the latest results beside them).
- **No banter** in this mode (perhaps later, in the story).
- **How the rivals raise** (`src/engine/raise.ts`): each judges its laid hand
  against those still in (they've been swapping, so as the best three of
  five unseen cards) and raises or matches by temperament. Bill matches
  everything; Lenny barely raises and folds readily; Finlay bluffs now and
  then. On The Last Hand the leader guards the lead and the short stack
  gambles. Over 120 tables they raise on about 38% of Rivers, and a raise
  is matched about half the time.

## The table (built: `src/ui/HighRollersTable.svelte`)

- **Your side and the river are the duel's:** your purse, your cards, your
  snag fan and your discards in the same places; no figures, no hand number.
- **The table takes its time:** money moves one purse at a time, heavily
  (each purse's coins pour in, and only when the last has landed does the
  next begin); at a new hand the antes go in seat by seat from the dealer's
  left; then the deal, as at a real table: one card at a time round the table
  from the dealer's left until everyone has three (yours slowly, face up,
  theirs face down, quicker); then, after a breath, the Flop, each card a
  thunderclap: Boom. Boom. BOOM. The Turn and the River each arrive in a
  beat of their own. The buttons wait until the table is still. A tap anywhere hurries
  it (the stacks just change, as they do with reduced motion); on the
  rivals' turns, **Skip** goes past the rest of them.
- **Purses keep their shape** from hand to hand: coins paid in leave from
  the front; winnings land on the stacks' tops for a few rounds, then in new
  stacks beside them, and stay where they fell (tidying up is a quality-of-life
  idea for later).
- **The pot is one heap, nobody's in particular** (`Pile.svelte`): it starts
  in the middle and spills outwards in uneven stacks. Every coin flies from
  its purse to a spot laid out in advance and hidden until it lands, with a
  clink (synthesised, `clink.ts`). At the verdict the heap flies to the
  winner: their own coins back where they came from, the rest to rest on top
  of their stacks until the next hand.
- **The rivals across the top, a third of the width each,** in seat order
  (you sit at the bottom; the order runs left, across, right, and round to
  you), mirroring yours across the table: one name at their edge (the
  shortest of nickname, first name and surname) with their snags fanned
  beside it, then three small cards held close and their discards, then a
  purse of little stacks nearest the pot. No portraits for now. A dot marks
  the dealer; the captain on the dealer's left is dealt to, and acts, first.
- **The Flop and the Turn:** you choose; then everyone's move plays out by
  itself, in seating order from the dealer's left, yours included: the seat
  shown is framed ("Swaps 2", "Calls · $4", "Folds"), its thrown cards leave
  its hand, its replacements are dealt in (yours face up, slowly), then its
  money goes in, and a breath before the next. A tap hurries it. Purses,
  snags and discards change only as each is shown; the new board card waits
  for the end. Folded, you watch the same way. **The River:** only a raise is
  shown, then how the rest answered it, a **Next** at a time; then the
  showdown.
- **The showdown:** your hand first, then the others in their seats, **left
  to right**.

## The engine (built)

`src/engine/table.ts` (a hand at a table of several) and
`src/engine/highrollers.ts` (the game, to two left). Starting from 120 each at
hand 24 (an ante of 8), a table lasts about **7 hands** (4 to 14); a careful
player finishes first about a third of the time, in the money about two
thirds.

## Open

- How the AI weighs three opponents instead of one (for now it plays each
  hand as if against one, with the rest of the table's discards and snags).
- Where the League hands over to the High Rollers table, and with which purses.
- Reading and bluffing: each rival could remember what your raises turned
  out to be at showdowns (Gaylord calling more once he's caught you, folding
  to you once he hasn't), and the portraits' moods could give (or fake) tells.
