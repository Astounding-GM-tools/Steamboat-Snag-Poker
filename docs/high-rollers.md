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

- **Your side and the river are the duel's:** your purse, your cards, your
  snag fan and your discards in the same places; no figures, no hand number.
- **The pot is one heap, nobody's in particular** (`Pile.svelte`): it starts
  in the middle and spills outwards in uneven stacks. Every coin flies from
  its purse to a spot laid out in advance and hidden until it lands, with a
  clink (synthesised, `clink.ts`). At the verdict the heap flies to the
  winner: their own coins back where they came from, the rest to rest on top
  of their stacks until the next hand.
- **The rivals across the top, a third of the width each,** in seat order
  (you sit at the bottom; the order runs left, across, right, and round to
  you): one name (the shortest of nickname, first name and surname), their
  snags fanned beside it, a purse of little stacks, three small cards and
  their discards. No portraits for now. A dot marks who acts first.
- **The Flop and the Turn:** you choose; then each rival's move is shown in
  turn, in seat order from the first, the one shown framed ("Swaps 2",
  "Calls · $4", "Folds"), and you press **Next**. Purses, snags and discards
  change only as each is shown; the new board card waits for the end.
  Folded, you watch the same way. **The River** has no replay (everyone just
  plays a hand): straight to the showdown.
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
