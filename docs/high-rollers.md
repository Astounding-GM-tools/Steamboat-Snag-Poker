# High Rollers: the final table

Status: **in development** on the `final-table` branch. Try it at
`/?highrollers` (development builds).

The League's last stage, and for now a mode of its own: when four captains
are left, they sit at one table. The money gets serious, everyone plays
everyone, and it runs until **two are left standing**.

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
- **The showdown:** the best hand takes the pot (a tie splits it). **The
  snags go to the weakest hand** still in: every snag the winner played, and
  any snag at stake on the board. A loser who played a snag keeps it and pays
  the winner its forfeit.
- **It ends when two captains are left.** Both made it: the bigger purse is
  the flat-out winner, and the runner-up keeps their winnings too. Out among
  the first two, and you're out of the money. (No anticlimactic duel between
  the last two.)
- **No banter** in this mode (perhaps later, in the story).

## The table (built: `src/ui/HighRollersTable.svelte`)

- **The opponents across the top, a rotating trinity:** three compact views
  (portrait, nickname, a simple purse: stacks or a figure, the snag count,
  what they've thrown away; their three cards are always three). The one
  whose move is being shown expands to take focus.
- **Each street:** you choose; then each opponent's move is shown in turn, in
  seat order, the focused one expanded (thrown away two, stood pat, folded),
  and you press **Next** when you've seen it. Folded, you watch the same way.
- **The showdown:** your hand first, then the others, **the chip leader
  last** (the order is fixed before a card is seen, so it gives nothing away).

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
