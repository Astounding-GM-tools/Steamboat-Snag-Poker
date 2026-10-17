# Willie's Wild River — Game Design Document

> Source of truth for the prototype. The original Norwegian sketch is kept in
> [design-original-no.md](design-original-no.md). Items marked **🔧 Variant** are
> switchable in the debug panel so we can play-test them; items marked **❓ Open**
> are undecided.

## Concept

A tactical, silent-film-styled poker duel in the browser. You are **The Captain**,
steering a riverboat economy through 48 stormy months. Each month you duel a
public-domain cartoon character in a short game of Hold'em-like poker. Losing a
duel can saddle you with **Jokers** — crises that drain your **Popularity** every
month. Get rid of them by dumping them on whoever you beat.

**Aesthetic:** 1928 black-and-white cartoon. High contrast, film grain, flicker,
vignette, intertitle cards for all text.

**Language:** English, with all UI text in translation files from day one.

## Win and loss

- **Popularity** starts at 50% (opponents have their own starting value).
  It is capped at 100%.
- **Game over:** your Popularity hits 0% at the end of a round.
- **Victory:** survive month 48 with Popularity > 0%, **or** be the last one left
  on the river (every opponent eliminated).
- Persisted locally: best result (months survived, win/loss).

## Cards

- A standard 52-card deck, freshly shuffled every round.
- **10 Jokers** exist in the whole game (🔧 count is configurable). Every Joker is
  either *unowned* (in the pool) or *owned* by a player.
- Jokers are **dead cards**: no rank, no suit, they never count toward a hand.
  They exist only to be gotten rid of.
- Jokers you own are always available to play and **do not take up hand space**.
  You can hold 0, 5 or 10 of them. You cannot discard a Joker.

## Hand ranking

Standard Hold'em ranks, evaluated on the **5 cards in play**: your 2 play slots +
the 3 community cards. Jokers and empty slots are dead, so a hand may effectively
have 3–5 real cards. Straights and flushes need 5 real cards.

Straight flush > Four of a kind > Full house > Flush > Straight > Three of a kind
> Two pair > Pair > High card.

**Ties:** compare category, then ranks (kickers) as usual. If still equal, compare
suits card-by-card from the highest card down, with **♣ < ♦ < ♥ < ♠**.
Only when both hands contain exactly the same real cards (e.g. both players play
two Jokers and the hand is just the board) is it a true **draw**: nobody wins,
no Jokers move, no Popularity is gained.

## The round (one month)

Two players, three **streets**: Flop, Turn, River. On each street:

1. A community card is revealed.
2. Cards are dealt to the players according to the deal mode.
3. Both players choose **one action in secret**, then both actions are revealed
   simultaneously.

### Actions (exactly one per street)

- **Place** a card from hand (including an owned Joker) into Play Slot 1 or 2.
  If the slot is occupied, the old card goes back to your hand (a swap).
- **Discard** a non-Joker card from hand and draw a replacement.
- **Pass** — do nothing. Valid, rarely smart.

An empty slot at showdown is a dead card.

### 🔧 Deal mode

| Mode | Flop | Turn | River |
|---|---|---|---|
| **Drip** | 1 card each | 1 card each | 1 card each |
| **Draft** (default) | 3 cards each | +1 each | +1 each |
| **Hold'em** | 5 cards each | — | — |

### 🔧 Joker mode (how community Jokers appear)

- **Slot** (default): a fourth community slot. From month 2 on, with some chance
  (🔧 default 50%), an unowned Joker is placed there. It never affects hands; it
  is the prize the loser takes home.
- **Shuffled:** after the Flop deal, some unowned Jokers are shuffled into the
  deck (🔧 one per N months elapsed, capped by the unowned pool). Any Joker drawn
  later — by a player (it joins their hand, now owned!) or as a community card
  (a dead board card) — is in play. Discarding becomes a gamble.

### Showdown and Joker transfer

- **Winner** gains Popularity based on their hand category (see table).
- **Loser** gains nothing, and receives:
  - every Joker the **winner** placed (dumped on them),
  - every **community** Joker,
  - and keeps any Joker they placed themselves.
- Worst case for one round: lose a round where the opponent placed a Joker *and*
  there is a community Joker → +2 Jokers, none shed.
- A no-Joker round is low stakes: losing just means no Popularity that month.

### End of round

1. Apply Joker transfers.
2. Every player (on screen and off) loses **Popularity per Joker owned**
   (🔧 default 4% each).
3. Anyone at 0% is eliminated. An eliminated opponent's Jokers return to the pool.

### Popularity for a win (🔧 tunable)

| Hand | Gain |
|---|---|
| High card | +1 |
| Pair | +3 |
| Two pair | +5 |
| Three of a kind | +7 |
| Straight | +9 |
| Flush | +11 |
| Full house | +13 |
| Four of a kind | +16 |
| Straight flush | +20 |

## The league ("Meanwhile, on the river…")

The game is not just your duels: a small league of opponents plays each other
every month off-screen, trading Jokers and Popularity with the same rules.

- Each month you duel one opponent; the remaining active opponents are paired
  randomly (an odd one out sits the month out).
- Off-screen duels are **fully simulated** with the same engine and AIs (cheap,
  and keeps the Joker economy honest). ❓ Could later be replaced by a
  probability shortcut if needed.
- The results screen shows a newspaper-style "Meanwhile on the river" summary.
- Since eliminated opponents return their Jokers to the pool, keeping weak
  players like Felix alive is in your interest.
- Some characters **join later** (e.g. Sherlock enters after the first
  elimination) to keep the river busy.

### Matchmaking

- Prototype: random active opponent, avoiding the same opponent twice in a row
  when possible.
- ❓ Later: weighting by similar Popularity; a "temperature"/eagerness per
  character (desperate or game-loving characters seek duels); the Captain may
  decline a challenge. The engine keeps matchmaking behind one function so this
  can be swapped in.

## Opponents (public domain only)

Only public-domain versions and looks (no later redesigns, no trademarks/logos).

| Character | Start | Style |
|---|---|---|
| **Pete** (Black Pete, 1920s) | 45% | Predictable bully. Always plays his highest cards, ignores the board. Easy to beat with a straight. |
| **Willie** (Steamboat Willie, 1928) | 55% | Chaos. Plays mostly at random, but sometimes pulls an inspired River swap. |
| **Felix the Cat** (early 1920s shorts) | 70% | Hugely likeable, utterly irrational. Plays at random, happily throws Jokers away at the worst time. |
| **Betty** (Betty Boop, 1930 debut) | 65% | Charming, a soft touch. Plays reasonably on pairs, rarely risks shedding a Joker. |
| **Sherlock Holmes** | 30% | Perfectionist. Calculates odds, sheds Jokers only when safe. Unlikeable. Joins after the first elimination. |

❓ **Wanted:** more women, including strong players. Candidates (verify
status before use): Irene Adler ("the Woman" who outwitted Holmes — a natural
nemesis), Alice (Wonderland), Dorothy Gale (Oz, book version), Nancy Drew (1930
books), Wendy Darling, the Queen of Hearts.

## Screens

1. **Title** — riverboat, "START" button, best result, short "How it works"
   card: *Steer public opinion. Avoid ruin. Dump your mess on someone else.*
2. **The Table** — opponent area (portrait, played slots, hand size and Joker
   count visible but the hand hidden), the River (3 community slots + Joker
   slot), the Captain's area (hand, Jokers, 2 play slots, discard pile), side
   panel with a shaking Popularity meter and month counter.
3. **Round end** — intertitle: "VICTORY!" / "CATASTROPHE!", the winning hand,
   Popularity change, Joker movements, "Meanwhile on the river" league news,
   buttons: Next month / Main menu.

Play is by drag-and-drop to three targets (Slot 1, Slot 2, Discard), with
click-to-select as a fallback.

## Technical

- **Vite + Svelte 5 + TypeScript.**
- **Engine** (`src/engine`): pure, framework-free TypeScript. State is plain
  serializable data; transitions are `(state, action) → state`; all randomness
  goes through a seeded RNG so games and simulations are reproducible. This keeps
  the door open for a Kotlin/WASM port and for multiplayer (authoritative server
  running the same engine).
- **UI** (`src/ui`): Svelte components, i18n dictionary in `src/i18n`.
- **Saving:** localStorage for now.
- **Tests:** Vitest on the engine.

## Later / far down river

- Multiplayer duels.
- Richer matchmaking (temperature, declining challenges).
- Distinct Joker types with different effects.
- Larger, rotating roster.
