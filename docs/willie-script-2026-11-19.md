# Willie's script, chapter one (2026-11-19)

Everything Willie types in the header in chapter one, in the order it comes, with what writes it and
how long he takes over it. (His *thoughts* go to the log only and are never typed: there are none in
chapter one now.)

**How the header works** (`src/ui/Journey.svelte`, `ticker`): every entry goes in a queue. He types
them **one at a time, each in full**, and leaves each up to be read (5 s, plus 0.11 s a character)
before starting the next. Nothing is ever dropped or skipped. While a table is up the header is
hidden; he picks up where he was when it comes back.

**Times** are estimates from the simulator's model of his typing (`typingSeconds` in
`src/story/sim/playtest.ts`): the pause before, the keys, and the time left to read it.

## The morning at Muscatine

| # | When it's written | What he types | Takes |
|---|---|---|---|
| 1 | The opening shot (waits for him, 16 s at least) | The first day of spring is what some folks call the day the ice lets go of the river. | 35 s |
| 2 | The walk to the harbour master's (12 s, **doesn't wait**) | Captain Bill is not coming with us. / First Mate made Captain… / Gus says being First Mate means… / So that is what I'll do… / I hope this will be a smooth run. / Pick up some prime salvage / Make good money on the haul / And not leave it all at tables along the way *(8 lines)* | **184 s** |
| – | The harbour master's table | *(nothing)* | |
| 3 | Casting off begins | The Captain played the harbour master for the docking fee. / Dodged the fee: $37 saved for coal. We'll need it. *(or paid, or snagged)* | 48 s |
| 4 | Swung round, under way | Cargo run for Dubuque, 125 miles upriver. / Strong spring-thaw current, four miles an hour. | 42 s |

By the time she's under way, entries 2–4 are **about 4½ minutes** of typing, and he's had 12 seconds
of the walk to start on them. The whole first leg is 7 minutes.

## On the river (every stretch)

| When it's written | What he types | Takes |
|---|---|---|
| The first crate out of Muscatine | *a find*, e.g. A gross of corncob pipes. Gus took the best. / Worth $2 at the Mercantile. *(or a loss)* | 37 s |
| Every crate after | Salvaged goods, worth $2 at the Mercantile. / *or* Fished out a crate. Soggy cotton. | 23 s |
| Every hazard | Struck a drift pile: Bent Shaft. / *or* Steered clear of a drift pile. | 20 s |
| **After every hand on the river** | **Under way again.** | 15 s |
| Every island she rounds (seven on the first leg, five unnamed) | Kept to port of Horse Island. / Kept to starboard of **the island**. | 18 s |
| The Sandbar, run aground (the answer at the table) | Struck a sandbar, a few miles below the Tri-Cities. | 25 s |
| Off The Sandbar / stuck there | Off The Sandbar at last. All hands sore. / Aground on The Sandbar. We stay the night. | ~22 s |
| Setting out from a stop (not Muscatine) | Cast off from *place*, upbound. | 20 s |

The river puts debris in her way about every **35 s** (`restSeconds`), and each piece writes two
entries (its record, then "Under way again."): about **35–40 s** of typing. So on a busy stretch he
only just keeps pace, and he **never works off** the backlog from Muscatine. That's why he
types the walk's entry halfway up the river, the dock fee long after she's left, and "Under way
again." over and over.

## At the Tri-Cities and after

| When | What he types |
|---|---|
| Cards on deck (anchored) | Cards on deck by lantern light. Repairs seen to. |
| Ashore for news | Anchored downstream of the dock. Went ashore for news. |
| The coal depot | Cards with the strikers at the coal depot. |
| The Bettendorf saloon | An evening at the Bettendorf saloon. |
| Buying or selling at the Mercantile | Bought *item*, $*n*. / Sold *item*, $*n*. |

## Verdict: mostly the script, some logic

**The script (too much, too plain):**

1. **The walk's entry is a page long** (8 lines, about 3 minutes), for a 12-second shot. Either the
   header gets its first two lines ("Captain Bill is not coming with us. / First Mate made Captain,
   and I am the new First Mate now.") and the rest goes to the log as a thought, or the walk waits for him.
2. **"Under way again." after every hand** is the plainest line he has and the most frequent. Cut it
   on the river; keep "Cast off from…" for real departures.
3. **Every debris record, every time.** "Salvaged goods, worth $2…" and "Steered clear of a drift
   pile." repeated all the way up. Log them, but type only the first of each kind, or only the ones
   that matter (a snag struck).
4. **Unnamed islands**: "Kept to starboard of the island." five times. Named islands only, or none.

**The logic (the queue never lets go):**

5. Nothing is dropped. An entry written four minutes ago is still typed in full before what's
   happening now. Records could **expire from the header** once they're stale (still in the log),
   so he's always typing about the present.
6. A shot that doesn't wait for him (the walk) leaves its entry half typed, to be finished at
   the next place the header shows, which may be somewhere else entirely.

Fixing 1–4 takes out most of the first leg's typing: the walk's 3 minutes and the 15 s after
every hand. That should let him catch up. 5 is the safety net for busy stretches.
