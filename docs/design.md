# Willie's Wild River — Game Design Document

> Source of truth for the prototype. The original Norwegian sketch is kept in
> [design-original-no.md](design-original-no.md). Items marked **🔧 Variant** are
> switchable in the debug panel so we can play-test them; items marked **❓ Open**
> are undecided.

## Concept

**River Poker.** Whenever steamboat captains cross paths on the river, they sit
down for a hand of poker. You are **The Captain**, in a tournament against a
cast of public-domain cartoon captains. Each **crossing** you duel one of them;
the rest play each other off-screen. Losing costs money, and can saddle you
with **Jokers**: liabilities like stinking cargo, tiresome passengers and
thankless duties that cost upkeep every crossing until you dump them on someone
you beat.

**Aesthetic:** 1928 black-and-white cartoon. High contrast, film grain, flicker,
vignette, intertitle cards for all text.

**Language:** English, with all UI text in translation files from day one.

## Win and loss

- Every captain carries a **purse** of dollars (you start with $50; rivals have
  their own starting purses). There is no cap: money comes and goes, what
  matters is not running out.
- **Busted:** your purse hits $0 at the end of a crossing — your boat is sold at
  auction. Game over.
- **King of the River:** be the last captain afloat. There is no month limit.
- Persisted locally: tournaments won and the longest run (in crossings).

## Cards

- A standard 52-card deck, freshly shuffled every round.
- **10 Jokers** exist in the whole game (🔧 count is configurable). Every Joker is
  either *unowned* (in the pool) or *owned* by a player.
- Jokers are **dead cards**: no rank, no suit, they never count toward a hand.
  They exist only to be gotten rid of.
- Jokers you own are always available to play and **do not take up hand space**.
  You can hold 0, 5 or 10 of them. You cannot discard a Joker.

## Play styles and presets

All structural rules live in one config (`src/engine/config.ts`) with named
presets, selectable in the rules lab (⚙) and the balance simulation.

### Draw (default)

1. **Flop:** 3 community cards are revealed; each player is dealt **3 cards**.
2. **Flop and Turn:** tap any number of hand cards to **discard** and draw
   replacements, or **stand pat**. Jokers cannot be
   discarded. Discards lie **face up**: the opponent can read what you threw
   away, and you can read theirs.
3. **Make your hand (on the River):** when the River card comes there is no
   more discarding — tap the cards you want to play — any
   of your hand cards plus any Jokers you dare, up to 5. The best community
   cards automatically fill the rest. No pre-selection: choosing is your job.
   Tapping nothing plays the board alone (legal, close to folding).
4. **Showdown:** the best hand wins. Every Joker the winner *chose to play*
   goes to the loser, along with any community Jokers. Every Joker the
   *loser* risked costs them a **forfeit** (🔧 default $5 each), paid to the
   winner: sneaking Jokers into a weak hand is no longer free. There is no automatic
   shedding — betting hands on Jokers is how the game is won or lost.

The shape of a hand decides how many Jokers it can carry:

| Hand | Cards that matter | Room for Jokers |
|---|---|---|
| Four of a kind | 4 | 1 |
| Three of a kind | 3 | 2 |
| Two pair | 4 | 1 |
| Straight / flush / full house | 5 | none |

**The deal** (always fast for people who prefer reduced motion): cards are dealt like at a real table — hole cards one at a time
round the table (you, them, you, them…), a beat, then the Flop one, two, three;
Turn and River cards and replacement cards slide in too. A **Fast deal**
checkbox speeds it up (remembered per browser), and a click on the table
finishes the deal at once. Actions are disabled until the deal is done.

**Willie's reckoning** (on the opponent's captain card) shows what they could be holding
(chance of each hand category, and how often it beats your best hand), based
only on what you can see.

**The reveal:** your hand is announced first (with its nickname, if any). Then
the opponent's played cards are turned over one at a time — teasers first
("a flush is still possible!"), then Jokers ("the stakes go up!"), and the
deciding card last — each showing how it combines with the board. No auto-advance: the
player steps through with Next (or Skip to the result).

### The pot (draw style)

There are no fixed payouts: captains play for a **pot** in the middle of the
felt, and the winner takes it (a tie splits it).

- **Ante**, paid at the deal: ceil(crossing ÷ 3) (🔧 `anteEvery`), **plus Joker
  upkeep** for every Joker you carry, so a captain dragging Jokers around pays
  a fat ante, and everyone knows they will try to dump some.
- **Seeing the Turn** costs floor(ante ÷ 3); **seeing the River** floor(ante ÷ 2)
  (free early on).
- **Discards get dearer:** the k-th card you throw away in a crossing costs $k
  (six cards = $21).
- **Fold** on the Flop or Turn, as long as you have not swapped a card: the
  other captain takes the pot; you keep your Jokers (including any fished this
  crossing); community Jokers go back into the deck.
- **Forfeit:** each Joker in a losing hand still costs $5, paid to the winner.
- **Debt is all-in:** fees can push a purse below $0 mid-crossing. End a
  crossing at $0 or less and you are busted.

The pot sits left of the board; coins fly in from each side as captains pay,
and every button shows its price ("Discard 2 · $4").



| Preset | Board (Flop/Turn/River) | Deal per player | Slots | Own cards used |
|---|---|---|---|---|
| **Kansas** | 3 / 1 / 1 | 3 / 1 / 1 | 3 | exactly 2 |
| **Texas** | 3 / 1 / 1 | 3 / 1 / 1 | 3 | 0–3 |
| **Middle** | 3 / 1 / 1 | 3 / 1 / 1 | 3 | 1–2 |
| **3 + 3** | 1 / 1 / 1 | 3 / 1 / 1 | 3 | 2–3 |
| **Classic** (v1) | 1 / 1 / 1 | 3 / 1 / 1 | 2 | exactly 2, Joker in a 4th slot |

In the slots style you place one card per street into a slot (or discard one).
"Kansas" sits between Texas and Omaha (geographically, too).

## Hand ranking

Standard poker ranks. Your hand is the **best 5 cards** made from your slot cards
and the community cards, using the preset's number of own cards (Kansas:
exactly 2 of your 3 slots + exactly 3 of the 5 board cards). Jokers and empty
slots are dead cards — but they still count as "your cards", so:

- **1 Joker** in your slots is nearly free if the other two carry the hand
  (but you lose your fallback card).
- **2 Jokers** force you to use a dead card: a 4-card hand.
- **3 Jokers**: only 3 board cards — suicide unless the opponent is as stuck.
- Jokers on the board narrow everyone's choice of board cards the same way.

Straights and flushes need 5 real cards.

Straight flush > Four of a kind > Full house > Flush > Straight > Three of a kind
> Two pair > Pair > High card.

**Ties:** compare category, then ranks (kickers) as usual. If still equal, compare
suits card-by-card from the highest card down, with **♣ < ♦ < ♥ < ♠**.
Only when both hands contain exactly the same real cards is it a true **draw**:
nobody wins, no Jokers move, no money is gained.

## The round in the slots style

Two players, three **streets**: Flop, Turn, River. On each street:

1. Community cards are revealed (Kansas: 3, then 1, then 1).
2. Cards are dealt to the players (Kansas: 3, then 1, then 1).
3. Both players choose **one action** at the same time — the opponent never sees
   your move before making theirs. **A card laid is a card played**: there is no
   confirm button and no undo.

### Actions (exactly one per street)

- **Place** a card from hand (including an owned Joker) into one of your slots.
  If the slot is occupied, the old card goes back to your hand (a swap).
- **Discard** a non-Joker card from hand and draw a replacement. This is also
  how you "pass" — and it costs you a slot you will never fill.
- **Pass** only exists when nothing else is possible.

An empty slot at showdown is a dead card.

### Community Jokers (🔧 Joker mode)

- **Shuffled** (default): after the Flop deal, some unowned Jokers are shuffled
  into the deck (🔧 one per N months elapsed, capped by the unowned pool). A
  Joker drawn by a player joins their hand (now owned!); one drawn to the board
  is a dead community card and goes to the loser. Discarding is a gamble.
- **Slot** (Classic only): a separate fourth community slot; from month 2, with
  some chance, an unowned Joker sits there as the loser's prize.

### Showdown and Joker transfer

- **Winner** gains money based on their hand category (see table).
- **Loser** gains nothing, and receives:
  - every Joker the **winner** placed (dumped on them),
  - every **community** Joker,
  - and keeps any Joker they placed themselves.
- Worst case for one round: lose a round where the opponent placed a Joker *and*
  there is a community Joker → +2 Jokers, none shed.
- A no-Joker round is low stakes: losing just costs the pot.

### Loser pays (🔧)

`loserPays` (0–1) sets how much of the winner's gain the loser loses: 0 = losing
costs nothing, 1 = **zero-sum (default)**: the winner's points come out of
the loser's money. Simulated, this shortens a good player's game from
about 29 to about 20 months.

### End of round

1. Apply Joker transfers.
2. Every player (on screen and off) loses **money per Joker owned**
   (🔧 default $4 each).
3. Anyone at $0 is eliminated. An eliminated opponent's Jokers return to the pool.

### money for a win (🔧 tunable)

| Hand | Winnings ($) |
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
every crossing off-screen, trading Jokers and money with the same rules.

- Each crossing you duel one opponent; the remaining active opponents are paired
  randomly (an odd one out sits the crossing out).
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
- ❓ Later: weighting by similar money; a "temperature"/eagerness per
  character (desperate or game-loving characters seek duels); the Captain may
  decline a challenge. The engine keeps matchmaking behind one function so this
  can be swapped in.

## Opponents (public domain only)

Ten captains, each with a boat and a playing style — see
[roster.md](roster.md) for the table, sources, starting purses and who joins
when (Gaylord Ravenal after the first bust; Maggie once Jiggs is busted).

## Screens

1. **Title** — riverboat, "START" button, best result, short "How it works"
   card: *Steer public opinion. Avoid ruin. Dump your mess on someone else.*
2. **The Table** (draw style), one column so it fits a phone, split by the
   board into **their side** (top) and **yours** (bottom):
   - top: the opponent's name (tap for their **captain card**: portrait, boat,
     **Willie's reckoning** of what they could be holding right now, how they
     play, where they first appeared, trivia), their **coin pile**, face-down
     hand, Jokers face up, and their discards;
   - middle: crossing number, street, the **?** button (Willie: how to play,
     fast-deal setting), the **pot** and the board; Jokers at stake are named
     only when there are any;
   - bottom: your hand, Jokers and discards, your **coin pile**, Fold and the
     priced action button.
   Coin piles are stacks of silver dollars ($10 a stack) with loose change in
   front; new coins drop in as a purse grows. Coins fly into the pot from each
   side as captains pay, and at the verdict the pot flies to the winner's pile.
3. **Showdown** (draw style) — the card-by-card reveal described above, with
   the opponent's cards above the board and yours below; board cards are
   marked ▼ (the opponent's hand uses them) and ▲ (yours does). The veil is
   light so the coin piles stay visible as the pot is paid out.
4. **Round end** — intertitle: "VICTORY!" / "CATASTROPHE!", money change,
   Joker movements, standings, "Meanwhile on the river" league news. No
   countdown: **Next crossing** or **Drop anchor** (pause).

**Hand log:** the last 10 of the Captain's showdowns (board, both played hands,
the cards each hand uses, result and Jokers moved), saved with the voyage.
Open it from the result card or the rules lab.

**Pausing:** Drop anchor returns to the title screen, which then offers
**Continue voyage** and **New voyage** (with an "Abandon ship?" confirmation).
The voyage is saved in the browser after every move, so it survives a reload.

**Hand nicknames** (in the language file, easy to extend): Dead Man's Hand
(aces and eights), Full Boat (full house), the Waiter (full house of threes and
Jacks — a Jack carrying a tray), the Butler (threes and Kings, our own), the Wheel (A–5
straight), Broadway (10–A straight), Royal Flush, and rank nicknames like
Ducks, Sailboats, Snowmen, Cowboys and Ladies.

Play is by drag-and-drop onto a slot or the discard pile, with click-to-select
as a fallback. Dropping is final.

## Accessibility

- **Reduced motion:** all animations and transitions stop; the deal is fast.
- **High contrast:** no film grain, scratches, vignette or flicker; brighter
  secondary text.

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
