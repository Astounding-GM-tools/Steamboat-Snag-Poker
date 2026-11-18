# Story review: 17 November 2026

A read of the story text on `claude/overnight-integration` (`ee272cf`): the chapters, the
characters, the log, `en.ts`, and where `Journey.svelte` writes the log. Nothing has been
changed. Every item is a proposal: where, what's wrong, a fix (draft text where it's
dialogue or log), and how sure I am: **definitely** better, **probably**, or **taste**.

It builds on `docs/dialogue-review.md` and last night's `docs/drafts-2026-11-17.md` and
doesn't redo them. Where a finding there still stands, it's one line under *Still open*.

Three things to know before reading:

- **Several "random" lines aren't.** Table talk is drawn from `journey.seed`, which is the
  same all voyage, and indexed by the hand number, which starts at 1 at every table. So a
  table says the same lines on the same hands every visit. This is behind most of the
  repetition below, and it's why last night's note "nine flop quips … come round again on
  the fourth evening" is wrong: it's the same three, every evening, for ever.
- **The log goes quiet at the Tri-Cities.** Chapter one's river is well logged. From the
  first evening at the hub, almost nothing is written except trades, one tap at a time.
- **Willie's arc has a hook already in the game.** Bill, of Willie: *"Too young, and too
  eager. Maybe in a few seasons."* (`01_muscatine/index.ts:141`). The log can pay that off:
  Willie works out, deal by deal, that "eager" was the half that mattered.

---

## The ten I'd do first

1. **One log line per visit to the Mercantile, not one per tap** (`Journey.svelte:596`,
   `log.ts:55`). Five loads sold is five entries; salvage is sold a dollar at a time, so $7 of
   it is seven "Sold salvage, $1."; and a hire reads "Bought a second fireman, $4." Each is
   typed out in the header in turn, slowly. *Definitely.* → [Trades](#trades-one-line-a-visit)
2. **The deck game says the same three quips every evening of the voyage**, and six of the
   nine are never heard (`crew.ts:80`). Fix the draw, then split the quips by where she is,
   which also cures the Davenport gossip at The Sandbar. *Definitely.* → [The deck game](#the-deck-game)
3. **Write the depot into the log, with Willie's thought on it** (`log.ts:13`). The record
   says only "Cards with the strikers at the coal depot.": not the loss, not the coal. The
   thought, and the callback to Bill's "too eager", are drafted. *Definitely the record;
   the thought is the piece you asked for.* → [The depot](#the-depot-in-the-log)
4. **Fill the log's silence from the Tri-Cities on**: the pilot news (the most important
   thing Willie learns, and it isn't written down), arriving, the Pilot Games, the climb,
   Gaylord, LeClaire. Drafted, a line each. *Definitely.* → [What's missing](#whats-missing-from-the-log)
5. **Gaylord at the saloon**: two long speeches every evening from day 9 to day 21, word for
   word; the same speeches after he's left town (day 22 on, from an empty chair); a full
   introduction to a Captain who has already sat at Davenport with him; and "You missed a
   fine week at Davenport" to a Captain who was there (`gaylord.ts:89–99`,
   `bettendorf.ts:76`). *Definitely.* → [Gaylord](#gaylord)
6. **The depot's chat and Ellie's marks use only two of their four lines, each twice a
   game** (`depot.ts:54`, `03_rapids/index.ts:160`). And Ellie's marks are shuffled, so
   "Smith's. Nearly. Don't you dare." can be the first thing she says on the Long Reach.
   Say them in river order. *Definitely.* → [The climb](#the-climb), [The depot](#the-depot-at-the-table)
7. **Bettendorf: Willie speaks at a table the crew stayed away from** (`bettendorf.ts:72`
   against `:32`), and Tripp gives the house rule and the verdict on the evenings he isn't
   there (days 3 to 21, which is most first visits). *Definitely.* → [Bettendorf](#bettendorf)
8. **The log's own wording**: "Took command of the Best Intentions…" reads as if Willie took
   command; "docking fee" for the dock fee; "Off The Sandbar at last" when it took four hands;
   the same "Aground on The Sandbar. We stay the night." every night (`log.ts:9–10, 39–41`).
   *Definitely.* → [Chapter one: the log](#willies-log)
9. **Gus's nagging** (`crew.ts:33–39`): two of the five say the same thing; he goes on asking
   for a boiler overhaul after it's bought; he asks for a cook and a galley the Mercantile
   doesn't sell; and "upgrade" is a word from the 1920s. *Definitely.* → [The hub](#the-hub)
10. **Six small certain fixes**: the "Snag?" button after the foreman has just offered a game
    (`depot.ts:82`); "50 dollars" in figures (`gaylord.ts:63`); a missing full stop
    (`01_muscatine/index.ts:116`); "So did the Thierry Belle", which can be said first
    (`crew.ts:55`); "Captains only, today" with a troubadour and a high roller at the table
    (`gaylord.ts:40`); and "Last one, Montague." never said on the day you hired him
    (`gaylord.ts:80`). *Definitely.*

---

## Across the whole story

### Repetitive chatter

**The seed.** `talkNow` passes `seed: journey.seed` (`Journey.svelte:574`), fixed for the
voyage. Anything of the form `new Rng(seed).shuffle(LINES)[hand % LINES.length]` therefore
gives the same line on hand *n* at every visit:

| Where | Code | What the player hears |
|---|---|---|
| Deck game | `crew.ts:80` | The same 3 of 9 quips every evening |
| Bettendorf, Odds | `bettendorf.ts:81` | The same 4 of 6 odds every evening, on the same hands |
| Depot, chat | `depot.ts:54, 57` | 2 of 4 lines, each twice a game (hands 2 and 6, 4 and 8), every visit |
| Depot, strike chest | `depot.ts:67–68` | `Rng(seed + hand).pick` of 3: repeats inside a game, same every visit |
| Climb, Ellie's marks | `03_rapids/index.ts:160, 164` | 2 of 4 marks a push, each twice |
| Gaylord in your seat | `gaylord.ts:78` | `pick` of 3, three times a hand, for up to forty hands |

The even-hands bug: lines are said when `hand % 2 === 0` and chosen by `hand % 4`, so only
indices 2 and 0 ever come up.

**Fix, one pattern for all** (*definitely*): draw from `seed + day` (or `seed + attempt`,
or a count of visits), and index by how many have been said this game, not by the raw hand
number. For the short lists (three or four lines), say each once and then nothing: Sandy's
rule, "silence beats filler", already in `docs/story.md`.

**The obstacle win line**, "She gains! A little further up.": drafted last night
(`drafts-2026-11-17.md` §2). Nothing to add except priority: with The Sandbar, every piece of
debris and every push of the climb, it's still the most-read sentence in the story.

### Names and terms

- **Mr. Klemm or Gus.** Willie says "Mr. Klemm says" (`01_muscatine/index.ts:185`) and so do
  the Captain and Ellie. But `crew.ts:71` builds "That's one for Gus, Captain." from
  `called('gus')`, and his log has "Gus says being First Mate means…" (`:22`). → Spoken,
  always "Mr. Klemm" (a small special case in `PASSING.willie`); in the log, "Gus" is fine:
  it's private, and the difference is characterful. *Probably.*
- **Ellie or Miss Sawyer.** Willie: "sits down with Ellie at noon" (`03_rapids/index.ts:125`).
  A first mate who takes the job very seriously, of a pilot he hasn't met: → "sits down with
  Miss Sawyer at noon." (Gaylord already says Miss Sawyer.) *Probably.*
- **Dock fee, docking fee.** Muscatine's is "the dock fee" (Bill, the harbour master, the
  snag); Moline's $3 is the "docking fee" (`en.ts:432`). The log calls Muscatine's "the
  docking fee" (`log.ts:39, 40`) and then "the dock fee" (`:41`). → "dock fee" at Muscatine,
  throughout. *Definitely.*
- **Cap'n.** Only the foreman's `FOLDED` (`depot.ts:49`); he says "Captain" nine other times.
  → "Folding, Captain?" *Probably.*
- **Willie's gallery entry** still says "Deck hand" / "Deck hand and galley boy"
  (`en.ts:400–401`); the story has made him First Mate. If the gallery is the League's,
  leave it; if the story shows it, → "First Mate" / "First Mate, and still the cook". *Taste.*
- **The Sandbar.** Every use in game text is right. (`sandy.ts:2`, a comment, has "Sandy,
  the Sandbar".)

### Still open from the earlier review (not re-argued)

"First boat up the river this year" against the Davenport queue (`01_muscatine/index.ts:185`);
Gus's long "Pray that our strength outlasts the work…" (`:194`); "A good deal of money"
(`:159`); "You load sixteen tons" (`depot.ts:43`); "Never fall in love with a pair" and
"who came to play and who came to pay" (`gaylord.ts:73–74`); "the parasites" (`:98`);
"Kerosene is in short supply" and "The river speaks to you" (`crew.ts:21, 23`); Finlay, who
still never says a word. If these were turned down, ignore this paragraph.

---

## Chapter one: Muscatine to The Sandbar

### Repetitive chatter

**`debris.ts:83` and `:115`: Willie says it, then types it.** At the table: "Salvaged goods,
worth $3 at the Mercantile." In the log, the same sentence. Last night's crate contents fix
this for free (what he says names the find, the log is shorter). Until then → log: "A crate
aboard. $3 of salvage." *Probably.*

**`log.ts:52`, unnamed islands.** Two of the three islands below the Tri-Cities have no name
on the chart, so the log reads "Kept to port of the island." twice. → For an unnamed one:
"Kept to port of a towhead." / "Starboard of an island with no name on the chart." *Taste.*

### Willie's log

**`log.ts:9` "Took command of the Best Intentions from Captain Bill, at Muscatine."**
In the First Mate's own log this reads as Willie taking command. It's also the first line
on page one, above "The first day of spring.", which ought to open the book.
→ "The First Mate was made Captain today. Captain Bill has gone ashore." And write it after
`LEAVING_MUSCATINE.backingOut`, or fold it into it: "The first day of spring. We have a new
Captain." *Definitely the wording; probably the order.*

**`log.ts:39–41`, the dock fee.** As it stands:

- dodged: "The Captain played the harbour master for the docking fee." / "Dodged the fee: $37
  saved for coal. We'll need it."
- snagged: "…" / "Snagged the fee, and the ante. $13 left for expenses."
- paid: "Captain paid the dock fee. $37." / "$13 left for the river."

"Snagged the fee" reads as if the Captain caught it; "Captain paid" drops its "The"; and the
purse line after a loss can't be "$13" (the antes went too), so let it show what's left.
→
- dodged: "The Captain played the harbour master for the dock fee, and won. Mr. Quaid settles
  it himself." / "$37 kept for coal. We'll need it."
- snagged: "The Captain played the harbour master for the dock fee, and lost." / "Paid it
  after all, and the antes besides. $N left."
- paid: "The Captain paid the dock fee, $37. $13 left for the river."

*Definitely.*

**A thought for the dock fee dodged** (log only; new, after the lines above):

> Captain Bill left fifty dollars. Thirty-seven was for the dock fee. He said so.
> He also said to stay away from gamblers.
> The Captain kept the money by not keeping the advice, inside the hour, and Mr. Quaid is
> paying our winter's fee out of his own pocket.
> It is in the River Code. I went over it twice.
> I would have paid at the door and said good morning.

And for the fee played for and lost (shorter; *taste*):

> I would have paid at the door and kept the antes.
> But then I'd never have had the chance of keeping thirty-seven dollars. I am still
> deciding which of us is right.

Neither notices anything out of time: only the Captain's nerve. *Probably.*

**`01_muscatine/index.ts:19–29`, the First Mate thought.** Good as it is. Two notes:

- The comment above it promises "the chain of command, and Bill's missus", and the missus
  isn't in it. A line would warm it: → after "Captain Bill is not coming with us.", add
  "His wife is poorly, and there are the little ones." *Taste.*
- The last three lines ("Pick up some prime salvage" …) have no full stops and the rest do.
  If that's a list, fine; if not, → "I hope this will be a smooth run: some prime salvage,
  good money on the haul, and not all of it left at tables along the way." *Taste.*

**`log.ts:48` "Struck a sandbar, a few miles below the Tri-Cities."** The stream puts The
Sandbar at 0.35 to 0.48 of the leg, and the Tri-Cities are at 0.64: on a 42-mile leg, seven
to twelve miles short. → "Struck a sandbar, some miles below the Tri-Cities." *Probably.*
(`docs/itinerary.md` has it "just past Horse Island"; Horse Island is at 0.49, so she now
strikes just *below* it.)

**`log.ts:10`, The Sandbar.** "Off The Sandbar at last. All hands sore." is written even
when she's off in four hands on the first afternoon, and "Aground on The Sandbar. We stay
the night." is written word for word every night she's stuck. By `attempt` (*definitely*):

| | Record |
|---|---|
| Off, first day | "Off The Sandbar before dark. All hands sore." |
| Off, second day | "Off The Sandbar at last. All hands sore." *(as now)* |
| Off, third day on | "Off The Sandbar, after {n} nights. I shan't miss it." |
| Stuck, first night | "Aground on The Sandbar. We stay the night." *(as now)* |
| Stuck, second night | "A second night on The Sandbar." |
| Stuck, third night on | "Still on The Sandbar. Gus has stopped counting. I have not." |

**`log.ts:11` "Cards on deck by lantern light. Repairs seen to."** Written every deck game,
whether or not anything was mended. `enc.fixed` knows. → Nothing fixed: "Cards on deck by
lantern light." Something fixed: "Cards on deck by lantern light. Lars mended the Broken
Paddle." *Definitely.*

**Thoughts for The Sandbar** (log only). Willie takes Sandy as he finds him, a bartender:
nothing out of time, nothing uncanny. The first night aground:

> The bartender at The Sandbar is a cheerful sort and has a joke for everything.
> I laughed at four of them, which I regret, as it encouraged him.
> The Captain answered every question in his quiz. I don't believe the answers mattered.

And when she comes off (*probably*: it's the first step of his arc):

> I had thought you beat a sandbar by digging hardest.
> The Captain let hands go by without a fight, and saved the men for the ones that counted,
> and we came off sooner for it.
> There is more to it than trying. I have written that down so I remember it.

### Order and continuity

**The author's example, in full.** The deck game is one pool of nine quips (`crew.ts:48–58`)
for every evening, wherever she is. So on the first night, stuck on The Sandbar, before the
Tri-Cities are in sight, Willie can say:

- `:54` "The Mathilda Belle tried the rapids without a pilot, Captain…"
- `:55` "So did the Thierry Belle. She's back in the queue at Davenport."
- `:56` (Gus) "Too early on the thaw to go up. Everyone says so. I say so."

He learns all of this ashore at Davenport, a day or more later, and the queue and the pilot
are supposed to be news when he wades back with them (`crew.ts:106–108`). And the other way
round: "Old Hildegard doesn't care for sand" (`:49`) and "I think he liked us, Captain.
Sandy." (`:53`) are still coming up at anchor on day nine. See [The deck game](#the-deck-game)
for the fix.

**`crew.ts:55` "So did the Thierry Belle."** It leans on the Mathilda line, but the quips
are shuffled and said one a hand: it can come first, or alone. → Stand it on its own feet:
"The Thierry Belle tried the rapids without a pilot too, Captain. She's back in the queue at
Davenport." Or make the two one aside in two beats (Sandy's quips do this). *Definitely.*

**The first day of spring, twice.** The caption (`01_muscatine/index.ts:36`) says it's the
first day of spring; then Bill's hands; then a `dawn` (`:49`); then the log's "The first day
of spring." as she backs out. So either Bill hands over the night before the ice goes out,
or dawn comes twice on one day. Nobody will count, but the log is where someone might.
→ Caption: "Muscatine, on the Mississippi. / The ice goes out tomorrow, they say: the first
day of spring." *Taste.*

**Arriving.** She comes off The Sandbar and the next thing is the hub, always at nightfall
(`:103–105`), even off The Sandbar at breakfast time, "some miles below". No line marks it.
→ See *Arriving* under the Tri-Cities.

### Polish

- `01_muscatine/index.ts:116` "…bound for the World's Fair in St. Louis": no full stop.
  *Definitely.*
- `:159–166` After the **Snag** button the harbour master answers "Hrmpf. The River Code:
  can't refuse that." It's the first time the Code is named, and nobody has invoked it: at
  Bill's table every button is followed by the Captain's words. → add
  `you('River Code, Mr. Quaid. I'll play you for it.')` between them. *Probably.*
- `:189` "Snag! We are aground, Captain!" (earlier review: "We're"). Still stands; one word.
- `sandy.ts:101–102` "That's the light gone. She won't move tonight." Fine. Only noting that
  it's Willie's fourth line in a row that ends a day on The Sandbar when it comes after
  Sandy's "beaten" and Gus's "not another shove": three closers. On `lostAll` Gus's is
  enough. *Taste.*

---

## Chapter two: the Tri-Cities

### The deck game

**`crew.ts:80`: the same three, every night.** See *The seed* above. Once that's fixed, the
nine want sorting by when they're true (*definitely*; new lines are *drafts*):

**Aground on The Sandbar** (the `stuckNight` game):
- (Gus) "Old Hildegard doesn't care for sand, Captain. Not one bit." *(keep)*
- (Willie) "I think he liked us, Captain. Sandy." *(keep; funnier while still stuck on him)*
- (Willie) "He never closes, Captain. I asked."
- (Gus) "Sand in the bearings. I'll be finding it in August."

**Anywhere:**
- (Gus) "She's a good boat. Don't tell her I said so." *(keep)*
- (Lars) ♪ ♪ ♫ / "Sjekk." and ♫ ♪ ♫ ♪ / "Fåld." *(keep)*
- (Willie) "Beans again tomorrow, Captain! Cold beans." *(keep, if the beans are staying)*

**At the Tri-Cities, once Willie has been ashore** (`FLAG.heardOfPilot`):
- the two Belles *(as rewritten above)*
- (Gus) "Too early on the thaw to go up. Everyone says so. I say so." *(keep)*
- (Willie) "They've a boat in the queue that's been there since the ice went, Captain. The
  crew have started a garden."
- (Gus) "Rock Island coal. Burns clean. Shame about the strike."

**`crew.ts:98` "Same town, same talk, Captain."** plus the list of jobs: said word for word
every night at anchor after the first. → Three to turn through, by day:
- "Same town, same talk, Captain. There's a timber raft wants herding off the bridge piers,
  and cattle to ferry." *(as now, shorter)*
- "Nothing new ashore, Captain, except the price of coal, which is the same but said louder."
- "The queue's a boat longer, Captain. And there's work, if we want it."

*Probably.*

**`crew.ts:98`, the mail.** Willie reports "the mail to Moline" as work he's found, and at
the jobs menu says the mail runs don't pay (`02_triCities/index.ts:28`). Both can be true if
he says so once: → "…and the mail to Moline, for what it pays." *Taste.*

**`crew.ts:106–108`, the first night's news.** The caption says he went "looking for work
and gossip" and the flag `jobFound` opens the timber and cattle jobs, but on the first night
he reports only the pilot. The player isn't told that Odd Jobs has changed. → add, after
"…the winners sit down with her at noon.": `say('willie', 'And there's work going, Captain:
a timber raft to herd, and cattle to ferry.')` *Probably.*

### The hub

**`crew.ts:33–39`, `NAGS`.** Shown in turn at the hub while she's under strength.

- `:34` "A boiler overhaul would get us the steam for the rapids, Captain." and `:38` "We
  should upgrade the boiler before even thinking about those rapids, Captain." are one nag
  twice, and "upgrade" as a verb is 1920s. → cut `:38`. *Definitely.*
- With the overhaul bought she makes 24, still under 34, so Gus goes on asking for the
  overhaul he's just been given. → Skip `:34` once `boilerOverhaul` is in `upgrades`; in its
  place: "The new boiler wants a second man to feed it, Captain." *Definitely.*
- `:37` "A real cook in a real galley would double our strength…": the Mercantile's list is
  coal, salvage, supper, a fireman and the boiler (`02_triCities/index.ts:56`). No stove and
  no cook, so this is advice the player can't take. → Hold it for the landing that sells a
  stove, or put the stove and Mrs. Pfund on the list. *Definitely one or the other.*
- `:35` "Beans again, Captain. I'm sorry. I'm no real cook, and there's no stove." is behind
  `heardOfPilot` and under-strength with the rest, so Willie only apologises for the beans
  when the boat is too weak for the rapids. It's a deck-game line more than a nag. *Taste.*

**`02_triCities/index.ts:55` "An overhaul gets twice the work from the same coal, Captain."**
Gus's one line at the Mercantile, every visit, including after the overhaul. → Before: as
now. After: "She's steaming like a new boat, Captain. A second fireman, and she'd fly."
*Probably.*

**`:34` "They'll bet on anything in Bettendorf, Captain. Even on which it'll be, three or
four."** Shown every evening, and on the first evening it gives away the saloon's joke (the
Captain's "I counted four cities on the way in") before the saloon. → Until
`met:triCities`: "They'll bet on anything in Bettendorf, Captain." After: the line as it
stands. *Probably.*

**`en.ts:434` `hub.depot.desc` "Fill bunker (2 of 6)".** The foreman says he has no coal to
sell, and "what nobody tells the player" (`docs/story.md`) is that it turns up anyway. The
menu tells them. → "On strike. No coal to sell ({n} of {max})". *Taste: it may be there on
purpose, so nobody misses the coal.*

### Bettendorf

**`bettendorf.ts:72` against `:32`.** Willie opens the saloon ("Here we are, at Bettendorf.
They're batty about betting here, Captain."), and the caption after it says "The crew stay
aboard, playing among themselves while Lars sings." He was at the table and aboard. → Give
the welcome to the house: `say('odds', 'Welcome to Bettendorf, Captain. We're batty about
betting here.')`. Odds is always at the table. *Definitely.*

**`:73, :83, :85`, Tripp from an empty chair.** Tripp is a guest only to day 2 and from day
22 (`:22–24`); in between, Gaylord has his chair. But the house rule on a first visit, and
both verdicts on every visit, are his. A first visit on day 3 or later (which is any voyage
that spent a night on The Sandbar and a day at the depot) has him laying down the rule
without being there. → When Tripp isn't seated, Finlay says it, and at last has a line:
- `:73` → `say('finlay', 'House rule, Captain: we play till somebody makes three of a kind.
  Three cities, three of a kind.')`
- `:83` → "Three of a kind! That's the game. Somebody tell Tripp."
- `:85` → "No three of a kind. Tripp'd call that a draw. I call it a thirst."

*Definitely the problem; the lines are drafts.*

**`:81` Odds.** The same four of her six lines every evening (see *The seed*). *Definitely.*

**`:80` Lenny.** `who: 'lenny'` as an aside, on hand 3 of every evening; he has no chair
here, and `debris.ts:72` notes that an aside needs its speaker's chair. I haven't seen how
it sits on screen. Check it in play; if it's off, make it a `scene` line. And since
`25eb1ef` the band is playing in this saloon as well: two acts at once. *To check.*

**`:38` "You treat the crew to breakfast at the Bettendorf saloon. Lars has two."** Every
breakfast, up to nineteen of them. → Turn through: "…Lars has two." / "…Lars has two. The
cook comes out to look." / "…Lars has three, and is asked to stop." *Taste.*

### Gaylord

**`gaylord.ts:96–99`, days 9 to 21.** Both speeches ("You missed a fine week at Davenport…"
and "My clients? Pitiful men…"), on hand one, every evening you sit down: thirteen evenings
at most. → The speeches once (a flag, or `met` plus the day first heard); after that one of:
- "Captain."
- "Still here, Captain. So, I regret to say, am I."
- "I am told there's a steamer due. I am told a good many things."

*Definitely.*

**`:97` "You missed a fine week at Davenport."** Said whether or not the Captain sat at the
noon table that week and heard the bingo ultimatum in person. → If `met:noon`: "A fine week
at Davenport, Captain, as you saw. She threatened me with her aunt." *Definitely.*

**`gaylordAtTheSaloon` after day 21.** The function has no upper bound, so from day 22, with
Gaylord gone and Tripp back in the chair (`bettendorf.ts:24`), Gaylord still makes both
speeches. → `if (day > GAYLORD_LEAVES) return [];` and perhaps, once:
`say('odds', 'Montague's gone, Captain. Took the steamer. I had eleven to four on Thursday.')`
*Definitely.*

**`bettendorf.ts:76`** calls `gaylordAtTheSaloon(day, client)` with no `known`, so on a
first evening at the saloon he introduces himself in full to a Captain who may have played
him at Davenport's noon table that same day. `:65` passes `met:gaylord`; `:76` should too.
*Definitely.*

**`gaylord.ts:95` "Bingo, Captain. She said bingo. To me."** Days 6, 7 and 8, the same.
Good once. → Day 7: "Two more, Captain. I have begun to dream of numbered balls." Day 8:
"Tomorrow I am a free man, Captain. Or a bingo caller." *Probably.*

**`:91` "Still afloat, Captain? Somebody must be playing your hand for you."** For a client,
every evening from day 6 to day 21. On days 6 and 7 he hasn't played for you yet. → Days 6–7:
"Captain. The eighth day. Do try to be there to watch." After: the line as it is, once, then
the short ones above. *Probably.*

**`:54`, the pitch.** If the Captain never went to the saloon, breakfast is the first
meeting, and he opens with "I'm all but booked this week, Captain" without having said what
he does. → When `!met:gaylord`, put his introduction (`:94`, less "You'll find me at
breakfast") in front. *Probably.*

**`:63` "50 dollars now, twice that back in two weeks."** Figures, where everyone else says
their money in words ("Thirty-seven dollars", "Ten dollars", "Five dollars in"). → "Fifty
dollars now…" (`LOAN` is 50; spell it, or add a small number-to-words). *Definitely.*

**`:68` "The eggs are adequate, Captain. Good morning."** His only line at any breakfast
where he has nothing to offer: most of them. → Turn through: as now / "The coffee is a
rumour, Captain. Good morning." / "I recommend the eggs. I do not recommend the company.
Good morning." *Taste.*

**`:78–83`, in your seat.** Three asides a hand, picked at random from three each, for the
whole table: by the fourth hand everything has been said, and it can run to forty. → Each
of the nine once, in order, over the first three hands; then he plays in silence, which
suits him. *Definitely.*

**`:80`, the hired day.** It's day 8, the last of his week, and the day's quarrel ("Last
one, Montague." / "And a pleasure, as ever." / "I've told my auntie to stand down.") is
only in `noonTalk`, which this table doesn't use. The one day the player is sure to be
watching misses the end of the story. → `deal: [...quarrel(day), …]` in front of "Here to
watch and learn". *Definitely.*

**`:40` "Captains only, today. Just how I like it."** The entrants include Lenny King
(travelling troubadour) and Eliza Bathory ("no captain", `docs/story.md`), and either can be
at her table. What she means is nobody's proxy. → "Everyone in their own chair, today. Just
how I like it. Anyone for bingo? No? Good." *Definitely.*

**Bingo.** The word is from about 1929 (it was "beano", and before that "lotto" or "keno"),
so it's the one clear anachronism in chapter one, where there are meant to be none. It's
also the best running joke in the chapter. Two ways: change it ("the game is keno. My auntie
in Cordova is a terror at keno."), or keep it and bank it: in chapter two Willie writes
"Miss Sawyer said bingo. I asked Gus what bingo is. He did not know either." *Taste; I'd
keep it and bank it.*

### The depot, at the table

**`depot.ts:82`.** On a return visit the foreman says "Fancy a game to pass the time?", and
the button that accepts is labelled **Snag?**, a question, as if the Captain were proposing
it. → `{ label: 'Deal', … }`, as at the harbour master's. *Definitely.*

**`:54, :57`, the chat.** Two of the four lines, each twice a game (see *The seed*). If
"How do I look, Captain?" is one of the two, Rourke asks it twice in eight hands, every
visit; if not, the best joke in the depot is never heard. → Each of the four once a game, in
a new order each visit. *Definitely.*

**`:40–41, :67–68`, the strike chest.** A pick of three after every hand that isn't the
last: seven a game, so each line twice or more, and the same on each visit. → Each once a
visit; then, sometimes, nothing. Three more to deepen the pool:
- up: "Mrs. Doolan thanks you, Captain. She's never met you, but she will."
- up: "That's the fiddler paid for Saturday."
- down: "Don't look so sorry, Captain. It's the union's, and the union's rich."

*Probably.*

**`:79` "Fancy a game"** is British; and `:97` "right, fellas?" is a spelling from the
thirties. Doolan and Rourke are Irish. → "Care for a game to pass the time?"; "right, lads?"
*Probably.*

**`:63` "Good game, Captain."** A modern sign-off. → "A pleasure, Captain. Come by any time.
We're not going anywhere." *Taste.*

### The depot, in the log

**`log.ts:13` "Cards with the strikers at the coal depot."** It's written only when the
Captain has lost enough for the coal, and says neither. When the Captain wins, or doesn't
lose enough, nothing is written. `enc.lostAtShowdown` and the outcome are both to hand in
`leave()` (`Journey.svelte:548`). *Definitely:*

- coal: "Cards with the strikers at Rock Island. The Captain lost $14 to the strike chest.
  Six loads of coal fell off the heap by our boat."
- no coal, down: "Cards with the strikers at Rock Island. The Captain lost $7. No coal."
- no coal, up: "Cards with the strikers at Rock Island. The Captain won $9 off the strike
  chest. No coal."
- a second time: "The depot again. Lost $13. Six loads fell off the heap. It's getting to be
  a habit of that heap."
- snags they took: "The strikers took the Fouled Rudder off our hands. They have the time."
- snags they gave: "Came away with a Strike Support Button and a bundle of pamphlets."

**The thought** (log only). Written once, the first time coal that came from the heap is
sold at the Mercantile (a flag when the depot pays out; checked when a visit to the
Mercantile ends with coal sold). The middle paragraph changes with what the money bought:

> The strikers have no coal to sell, the strike being on.
> The Captain sat down with them and lost fourteen dollars to the strike chest, cheerfully,
> and afterwards six loads had fallen off the heap by our boat, and nobody had counted them.
>
> Today we sold five of them at the Mercantile for eight dollars the load, coal being short
> on account of the strike. Gus has his boiler overhaul.
>
> I have gone over it and I can't find the lie in it. Nobody said a false word. The foreman
> was pleased. The chandler was pleased. Gus is very pleased.
> But I could not have done it, because I would never have thought to lose.
>
> Captain Bill said I was too young and too eager. I took him to mean the first.
> I think now he meant I only know how to try to win.

If no overhaul was bought that visit, the middle ends: "…on account of the strike. Forty
dollars, for fourteen." *This is the piece asked for; I think it's the best thing in the
file, and it should come once.*

A ticker line to go with it, the same day, so the header hints that there's something to
find: "Sold five loads at Moline that fell off a heap at Rock Island. Entered as salvage."
*Probably.*

And the mirror, the first time the Captain wins there and comes away with nothing (*taste*):

> The Captain won nine dollars from the strike chest and we got no coal.
> So winning is the wrong way to do it. I shall have to think about that.

### Trades: one line a visit

**`Journey.svelte:596`, `log.ts:55`.** `purchase()` writes a record on every tap. What the
log gets now, from the item names lower-cased:

- "Sold a load of coal, $8." five times
- "Sold salvage, $1." once for each dollar
- "Bought a load of coal, $10."
- "Bought a proper supper, $4."
- "Bought a second fireman, $4." (Mr. Flood is hired, not bought)
- "Bought boiler overhaul, $40." (no article)
- and, when the cook is for sale, "Bought mrs. pfund, cook, $6."

Each is typed in the header in full before the next begins, and the river holds debris back
until he's finished (`AFTER_TYPING_S`), so a morning's shopping also delays the river.

→ Write nothing on the tap. Keep a tally for the visit, and write one entry when the Captain
leaves (the council's **Done**). *Definitely.* Wording, joined in this order, each part only
if it happened:

> At the Moline Mercantile, $3 to dock. Sold five loads of coal, $40, and the salvage, $7.
> Took on two loads of coal at $10. Boiler overhaul, $40. Signed on Mr. Flood, second
> fireman, two days, $4. A proper supper for all hands.

Nothing bought or sold: "Docked at Moline, $3. Bought nothing. The Captain looked at
everything." If that's too much to build tonight, the cheap version is to log only the
things that happen once (the overhaul, a hire) and nothing for coal, salvage and supper.

Thoughts to hang on a visit (*taste*, each once):

- the supper: "The Captain bought supper from the chandler's. I was not offended. I had two
  helpings so as not to seem offended."
- black-market coal bought at $10: "Ten dollars the load. At Muscatine it was three. Gus
  shovelled it himself so as to know where each dollar went."
- Mr. Flood: "Mr. Flood shovels what he is paid to shovel and says the union says so. Lars
  has given him the long shovel. I don't know if that is a kindness."

### What's missing from the log

One line each (*definitely* that they're missing; wordings are drafts). Where it needs
something the code has to hand, it says what.

**Arriving** (the `travel` step, `01_muscatine/index.ts:103`):
- "Made the Tri-Cities at dusk. Davenport and Bettendorf to port, Rock Island and Moline to
  starboard. I count four."

**The pilot news** (`log.ts:12`). Now: "Anchored downstream of the dock. Went ashore for
news.", the same every night, and the news itself is never written.
- first night: "Anchored below the dock, where it's free. Ashore for news." / "One pilot for
  the rapids this early: Miss Ellie Sawyer, of Cordova. One boat a day. They play for it, at
  Davenport."
- later nights: "Anchored below the dock. Ashore: no news. Work to be had."

A thought for the first night (the Captain's thrift; *probably*):

> The dock at Moline is three dollars. Below the dock it is free, if the First Mate wades.
> The First Mate wades.
> The water is as cold as you would think, two days after the ice.

**Jobs** (`02_triCities/index.ts:73–75`, captions only):
- timber: "Herded a timber raft off the bridge piers. $10, less a load of coal."
- cattle: "Ferried cattle to the Illinois side. $14. Swabbed the deck. Then swabbed it again."
- mail: "Ran the mail to Moline and back. $9, and a load of coal to do it. Gus did the sum
  out loud."

And a thought, the first mail run made on coal from the heap (*taste*):

> I told the Captain the mail doesn't pay, with coal at ten dollars.
> It pays if the coal fell off a heap. I did not tell the Captain that. The Captain had
> worked it out before I'd finished the sum.

**Bettendorf** (`log.ts:14` "An evening at the Bettendorf saloon."). Willie wasn't there, so
he can only write what came back:
- "The Captain went ashore to the Bettendorf saloon. Back by midnight, $12 to the good."
  (or "$9 the lighter"); with trips: "…Three of a kind settled it, I'm told."

> I was not asked along. Lars sang.
> I counted the purse when the Captain came back, which a First Mate may do. The Captain
> watched me do it and said nothing. I think that was permission.

**The odd job** (`en.ts:509`, a note at the table, not logged, and always barrels):
- "Purse near empty. Found a morning's work unloading barrels, $10. The Captain didn't ask.
  That is the job."

**Wages** are paid at every dawn and never written. A ship's log would open each day with
its reckoning, and it would give every page a first line: "Wages paid, $6. Purse $31. Coal
5 of 6." *Taste: it's a line a day, and some days it's the only one.*

**Gaylord** (`bettendorf.ts:45–46`; `CHOICE_RECORDS` has only `aground`):
- first met: "A Mr. Montague, Esquire, at the saloon. He plays other captains' seats at
  Davenport, for a fee."
- hired: "The Captain has engaged Mr. Montague for the last day of his week. $10."
- the loan: "The Captain borrowed $50 of Mr. Montague over breakfast. $100 due in two weeks."
- beaten (`FLAG.beatGaylord`): "The Captain finished ahead of Mr. Montague today. He took it
  very politely."

> A captain may send someone else to play the hand. The River Code doesn't forbid it. Mr.
> Montague says the Code is silent on the matter, and he says it like someone who has read
> the Code for its silences.
> Miss Sawyer doesn't care for it. Nor do I, and I can't say why, since I would give a
> week's wages not to sit across from her myself.

> Fifty dollars from Mr. Montague, a hundred back in two weeks. I've written the date
> inside the cover and counted fourteen forward.
> He only offered after the Captain beat him. I'd have thought you lend to the ones you can
> beat. That's twice this week I have had it backwards.

---

## Chapter three: Davenport and the rapids

### Willie's log

Nothing at all is written from the morning table to LeClaire: `ENCOUNTER_RECORDS` has no
`morning`, `noon`, `hired` or any of the three chains, and the chains aren't caught as
debris because they run past one hand. *Definitely missing.* Drafts:

**The Pilot Games:**
- morning won: "Pilot Games at Davenport, $5 in. The Captain took the morning table."
- morning lost: "Pilot Games at Davenport, $5 in. Out at the morning table. No pilot today."
- noon won: "Noon with Miss Sawyer, $10 in. The Captain won it. We go up."
- runner-up: "Noon with Miss Sawyer. She won her own table; the Captain was next. We go up."
- noon lost: "Noon with Miss Sawyer. Not today, she said."
- hired, won: "Mr. Montague played our seat at noon and won it. The Captain watched. Miss
  Sawyer was short with us all the way up."
- hired, lost: "Mr. Montague played our seat at noon and lost it. He kept the ten dollars."

A thought for the queue, the first day the Captain goes out (*probably*):

> Half the river is tied up below the bridge waiting on one pilot, and the pilot picks her
> boat at cards.
> I asked Gus if that was fair. He said it was the Code, and that fair is a word for people
> with a second pilot.

And one that fits Bill's warning, if Eliza Bathory is at the Captain's morning table (she's
in `state.mates`); she is a "high roller on the grand steamers" (*taste*):

> A Miss Bathory at the Captain's table this morning, off one of the grand steamers.
> Captain Bill said to stay away from those.
> It wasn't my place to say so. I am saying so here.

**The climb:**
- Moline chain: "Up the Moline chain. Miss Sawyer at the wheel. {n} loads left."
- Campbell's: "Campbell's chain behind us. Three wrecks under it. I didn't look."
- the top: "Smith's chain, and the top. LeClaire. Fourteen miles on {n} loads of coal."
- swept back: "Bunker empty on the {stage}. The river took us back to Davenport in a quarter
  of the time it took to climb."
- turned back: "The Captain turned back below {stage} with {n} loads in the bunker. Back of
  the queue."
- Gus's warning, if it was given: "The Captain asked Mr. Klemm for all she's got. Mr. Klemm
  said it does not work like that."

The thought for turning back, which is the arc's turn (*probably; the best of this chapter*):

> I would have pushed on. I know I would.
> We'd have been swept back with an empty bunker, and I'd have called it trying.
> The Captain kept two loads and Miss Sawyer's good opinion. She said it was the first
> sensible thing anyone had said on this river.
> Nobody has ever said that about anything I've done. I mean to change that.

And a thought to close the chapter at LeClaire, built from what happened (each line only if
its flag is up: `dockFee:dodged`, coal from the heap sold, `hiredGaylord` or `owesGaylord`,
a turn back):

> LeClaire. Gus has not said a word since Smith's chain, which is how I know he's happy.
>
> Since Muscatine the Captain has:
> played the harbour master for a bill we had the money to pay;
> lost to the strikers on purpose;
> sold what fell off a heap;
> borrowed from a man who lends only to people who beat him;
> turned back when I'd have gone on.
> Every time, we came out ahead.
>
> Gus told me to write down what the Captain should know. I think I've been writing down
> what I don't.

### Repetitive chatter

**`03_rapids/index.ts:157`, "Just give me all she's got, Mr. Klemm." / "It does not work
like that, Captain."** The scene plays on every climb begun under strength, word for word,
button and all. It's a joke that works once. → First time: as now. After (`met:molineChain`):
`say('gus', 'Same boiler, Captain. Same river.')`, and no button. *Definitely.*

**`:136`** Ellie's "Mr. Klemm, every pound of steam you have. Captain, do as I say and
nothing else." and Gus's "Every push burns a load, Captain. We've six…" also open every
climb. → From the second climb: Ellie, "You know the way, Captain. So does the river." Gus's
count is useful every time; keep it. *Probably.*

**`:31` and `:102`, "Same time tomorrow."** Ellie says it when you lose at noon and again
when you're swept back. The second is also not true: there's a morning table to win first,
as her own "Back of the queue, Captain." (`:43`) says. → `:31` "Nobody gets it every time,
Captain. Win your table and I'll take you again." *Probably.*

### The climb

**`:160, :164`, the marks.** Shuffled, and (see *The seed*) only two of the four are said on
a push, turn about. But they're places, in order up the river: Brazil Rock, Mason's Rock,
Duck Creek on the Moline chain; St. Louis chain, Cabin chain, Sycamore, Smith's on the Long
Reach, which Ellie has just listed in that order at Hampton (`:107`). Shuffled, "Smith's.
Nearly. Don't you dare." can be the first thing she says, with the whole reach ahead.
→ Say them in order, by how much of the stage is worn down (its pile, in quarters), not by
hand. Then the last line of each list is always the last, and "Nearly" is true. *Definitely.*

**`:137` "Jackstaff on the white house. Hold her there."** With the order fixed this is the
first mark on the first chain, and it teaches how she steers. Good as it is.

**`:148` "That's the top. That's LeClaire. You can breathe, Captain."** (The earlier review
counted three breaths in one climb; still stands.)

### Order and continuity

**`:198`, LeClaire.** After the last push the story goes straight to a caption titled "To be
continued" with no lines. The chapter's whole effort lands on nothing. Until chapter two is
there, → `lines: [{ text: 'LeClaire, at the head of the rapids. Fourteen miles below you, the
queue at Davenport is one boat shorter.' }, { who: 'ellie', text: 'Buy your man a drink,
Captain. He's earned it. So have you.' }]`. *Probably.*

**Who has heard of whom.** Gaylord's saloon introduction ("I play at Davenport of a noon, on
behalf of those who'd rather not", `gaylord.ts:94`) can come before Willie has brought the
news of the pilot: a Captain who went to the saloon instead of anchoring. It works as a
tease, and his offer at breakfast waits for `heardOfPilot`, so nothing breaks. Leave it;
noted so it's on purpose.

**The eighth day without coal.** The seat Gaylord plays for you is on the list on day 8 only
and needs six loads (`02_triCities/index.ts:66`). A client with five loads that morning sees
it greyed, and the hire is gone, with nothing said then or after. → A line that evening at
the saloon: "I played to an empty chair this noon, Captain. Yours. I won. Miss Sawyer took
the runner-up. The ten dollars is not returnable." *Probably; needs a flag for the missed
day.*

### Polish

- `:129` Willie, to Ellie: "They say you're crazy, taking boats up on the thaw." Good. It
  would be better still as "They say you're crazy, miss, …": he's a polite boy. *Taste.*
- `:143` "Tell your man to breathe." and my LeClaire draft both say "your man" of Gus;
  that's Ellie's way of speaking and it's consistent.
- `:32` and `:44` both end on Gus. Fine since the earlier fix.

---

## Smaller things, anywhere

- `debris.ts:103` "That's the Fouled Rudder, Captain. We'll live." With the snag's name in
  title case and an article it's a little stiff out loud, and "Scraped Paint" and "Fatigue"
  have no article at all. Last night's alternatives cover the variety; whichever is used,
  read each of the five debris troubles into it once. *Taste.*
- `02_triCities/index.ts:31` "{Snag} wants seeing to, Captain. A night at anchor would do it."
  Same check: "On the Rocks wants seeing to" doesn't parse. → For that one: "She's still on
  the rocks, Captain, in a manner of speaking." or name it "the scraped hull". *Probably.*
- `crew.ts:19–26`, the closers, go by `mornings % 6`, so they hold up; "It's a rainy night,
  and the roof has a leak. Should fix that in the morning." is the only one in note form.
  → "It rains in the night, and the roof leaks. That's for the morning." *Taste.*
- `crew.ts:30` "Supper on deck, and the lantern lit." Every night at anchor or aground. One
  more to turn with it: "Beans, and the lantern." *Taste.*
- `log.ts:42` "Need to bunker up before we reach the rapids." A deep-water word. → "We must
  coal before the rapids." *Taste.*
- `log.ts:33` "Strong spring-thaw current, four miles an hour." Good, and exactly his voice:
  the pattern for the records above.

---

## If only an hour tonight

The trades tally (1), the deck game's draw and its three pools (2), and the depot record
with its thought (3). The first two are what a player hears and reads most; the third is
where the log starts being about Willie.
