# Dialogue review: chapter one and the tutorial

A read of every caption and line in story mode as of `fdf335a`: the tutorial,
Muscatine, the Tri-Cities and the rapids, the crew, Gaylord and Sandy, and the
story strings in `src/i18n/en.ts`. Nothing in the game has been changed; each
finding is a proposal to accept or turn down.

Each finding gives the line as it stands (file and line number), the problem
in one sentence, and a rewrite, or **cut**. Proposals keep curly quotes and
apostrophes. Where a fix needs a code change as well as a text change, it says
so. The ten changes I'd make first are at the end.

---

## `src/story/chapters/00_tutorial/tutorial.ts`

### Round one: the ducks

**L317** `'Ditch the boys, keep the queen.'`
"Ditch" is modern American slang, and Morag is a governess.
→ `'Away with the boys. Keep the queen.'`

**L326** (you) `'Bah. It’s just number cards.'`
"It’s … cards" doesn't agree, and it reads as a slip, not as the First Mate's voice.
→ `'Bah. Only number cards.'`

**L366–367**
`'A pair of aces are Bullets, and so on.'` /
`'Knowing how ducks can beat bullets is the same as knowing when to fold and when to call.'`
"And so on" is filler, and the second sentence doesn't follow from the first: it's what she wants to say, but tangled.
→ `['A pair of aces are Bullets.', 'Knowing when ducks can beat bullets is knowing when to call, and when to fold.']`

**L374** `'I forgot to show you. Here, look.'`
She hasn't forgotten anything: the line answers *Call?* / *Fold?* by moving on to round two, which shows the fold, so as it stands it's a non sequitur.
→ `'Better shown than told. Another hand.'`

### Round two: the wise fold

**L384** `'Want to trade in any card, or check up on what comes next?'`
"Want to" is too casual for her, and "check up on" muddles "check", which she defines two lines later.
→ `'Swap a card, or keep them and see what comes?'`

**L401** `'… Against four hearts on the board and a player that just checked. …'`
"A player that" should be "who". Keep the dry third person: she means herself.
→ `'Two jacks. Against four hearts on the board, and a player who just checked. That’s a folding hand.'`

### On to the snags (SNAGS)

**L210** `'And that’s how you dodge snags: you win, or you fold wisely.'`
This also follows the hands lesson, where nobody folded (it ends "Four threes beat my full house"), so there it jars.
→ `'Know your hands, and when to fold, and you’ll dodge the snags.'` (true on both paths)

**L216** `'Ah yes, snags. We’d need some stakes for that. Here, have some buttons, so we have something for the pot.'`
Three clauses for one idea; it's the longest line in the lesson.
→ `'Ah, yes. Snags want stakes. Here, have some buttons for the pot.'`

### After the knockout (AFTER)

**L158** `['Cleaned out by a deckhand.', 'Yet your snag remains with you.']`
"Yet your snag remains" is flat beside its sibling, which has the Respect joke.
→ `['Cleaned out by a deckhand.', 'But your Respect is still in your hand. Not in mine.']`

**L175** `['You are out of buttons.', 'And your snag remains with you.']`
Marked "not yet written". It's the same flat half-line.
→ `['You are out of buttons.', 'And your Respect is still in your hand. Not in mine.']`

**L151, 159, 167, 176, 185** `'Thanks, ma’am'` against `hands.ts` L80 `'Thank you, ma’am'`.
The same thanks to the same woman is spelled two ways.
→ Pick one. I'd use `'Thank you, ma’am'`, since she'd correct "Thanks".

No changes proposed for the opening ("Have you seen my lout of a husband?", "Finlay by name, good‑for‑nothing by nature", the broken-off tirade), the Turn ("…lost?" / "Not lost, not yet"), the Oath ("I swear" / "Yes. I do.") or "First mate, actually." / "I stand corrected. Cleaned out all the same." They're the tutorial's best lines.

---

## `src/story/chapters/00_tutorial/hands.ts`

**L40** `'… I’ll rig the deck and we´ll play cards open …'`
Typo: `´` (an acute accent), not an apostrophe.
→ `we’ll`

**L68** `'Oh! Two pair on the board now. Do you see them?'`, reply `'Crabs over ducks'`
The player's button says "crabs" before anyone has said what crabs are, and Morag's next line ("ducks full of crabs") builds on it.
→ `'Oh! Two pair on the board now: threes, which we call crabs, and our ducks. Do you see them?'` (the reply stays)

**L63** `'Most likely, unless you give up the hand you’ve got. A flush is a decent hand, but often not good enough with a pair in the middle.'`
Too long for its box, and it says "not good enough" where a turn of phrase would do.
→ `'Most likely. A flush is a decent hand, but with a pair in the middle, decent loses.'`

**L45, 57, 70, 74** `'Exactly…'` four times, plus `'That’s right'` twice (L47, L59).
Her praise is supposed to be rare. At this rate it's a tic.
→ L45 `'Yes: a pair of deuces is called ducks. Well done.'`; L74 `'Quite so. Four alike, also called quads, …'`. Keep "Exactly" at L57 and L70.

---

## `src/story/chapters/01_muscatine/index.ts`

### The handover (Bill)

**L102** (you) `'Why not Mr. Klemm? No one knows the ship better.'`
Everyone else calls her a boat ("She’s a good boat", the Brazil "was a good boat"); "ship" is a seagoing word.
→ `'Why not Mr. Klemm? No one knows the boat better.'`

**L127** `'Here. The dock fee for the winter, and fifty dollars. Enough to settle it, with a little over for food and coal. …'`
It doesn't say clearly that he's handing over a bill *and* the money to pay it, which is what the snag means.
→ `'Here: the winter’s dock fee, and fifty dollars to pay it. A little over for food and coal; past that, find your own cargo.'` (the second sentence, the gamblers, stays)

### The dock fee (harbour master)

**L137** `'Here to pay your dock fee, I suppose? Thirty-seven dollars. A good deal of money.'`
"A good deal of money" sounds like the narrator, and his blurb ("charged most of them for it") has a better joke waiting.
→ `'Here to pay your dock fee, I suppose? Thirty-seven dollars. It was thirty-five, but it’s been a hard winter.'`

**L144** `'Hrmpf. River code, can’t refuse that. …'`
"River code" is in lower case here, but Gaylord says "River Code" and Ellie "Code" (see Consistency).
→ `'Hrmpf. The River Code: can’t refuse that. But only five rounds, and whoever holds the bill after that settles it. Agreed?'`

**L148** reply `'No. I pay'`
A button label with a full stop in it, and it's the same choice the button above calls *Pay*.
→ `'Pay'`

### Steaming up (chatter)

**L61–63** `'Chatter 1'`, `'Chatter 2'`, `'Chatter 3'`
These are placeholders, and they show on screen in the first minute of the story. Each is closed with *Aye*, so here are three written for that answer:
→
- `{ who: 'willie', text: 'Can I call you Captain, Captain? I’m going to call you Captain.' }`
- `{ who: 'gus', text: 'Old Hildegard’s warm, Captain. Ask her for anything but hurry.' }`
- `{ who: 'lars', text: '♪ ♫ ♪ ♫' }`, or, for a word you can read, `{ who: 'willie', text: 'That’s Lars’s river song, Captain. Or his supper song. Hard to tell.' }`

### Underway, and aground

**L163** `'First boat up the river this year, Captain, and not a soul ahead of us! …'`
This contradicts what comes next: there's a queue at Davenport, and the crew talk of the Mathilda and the Terry Belle trying the rapids.
→ `'First boat out of Muscatine this year, Captain, and not a soul ahead of us!'` (the second sentence stays)

**L167** `['Snag! We are aground, Captain!', 'Stuck fast!']`
Willie talks in contractions everywhere else, and "We are" slows the panic down.
→ `['Snag! We’re aground, Captain!', 'Stuck fast!']`

**L172** `['We have run aground a sandbar, Captain. The engine alone can’t shift us, we need shovels and poles.', 'Pray that our strength outlasts the work, or we will spend the night right here.']`
"Run aground a sandbar" is a wrong word (aground *on*), the comma splices two sentences, and "Pray that…" is too long for Gus, who's terse.
→ `['We’re aground on a sandbar, Captain. The engine can’t shift her alone: shovels and poles.', 'If the crew gives out first, we spend the night here.']`

---

## `src/story/characters/sandy.ts`

Sandy's routine is the standard, and I propose no change to the opening, the morning, the rounds, the dozen, last call, cleared or beaten. One note: "Pub quiz" is a British word in an American saloon. It's earned its place and I'd keep it; I mention it only so it's a choice.

**L90** (Gus, first hand won) `'That’s our own sweat back, no more. But the sand’s gone with the current.'`
This is the line that explains the mechanic (worn down, never fed), and it's hard to parse: what's gone, and is it good?
→ `'That’s our own sweat back, Captain, no more. What we lose, the river keeps.'`

**L86** (stood pat) is fine as is. Noted only because "Sand pat again?" on the first hand of a later morning works too: it's "again" from yesterday.

---

## `src/story/characters/crew.ts`

### Closers (how an evening ends)

**L21** `'Kerosene is in short supply.'`
Filler: it's a supply note, not an evening.
→ `'The kerosene runs out before the cards do.'`

**L23** `'The river speaks to you, of faraway places it has visited and soon will visit again.'`
It's purple next to its neighbours (the frog, the leaky roof), and it says nothing.
→ `'The river goes by in the dark, on its way to St. Louis. It’ll get there first.'`

### NAGS (Gus and Willie, at the hub)

**L36** `'We doubt we can climb the rapids with a single fireman, Captain.'`
"We doubt" is the royal we, and it's not terse.
→ `'One fireman won’t get us up the rapids, Captain.'`

**L37** `'A real cook, with a real kitchen, would double our strength, Captain. No offence to the boy´s constant bean-slop.'`
Typo: `´`. Also a boatman says "galley", not "kitchen", and "constant bean-slop" is one adjective too many.
→ `'A real cook in a real galley would double our strength, Captain. No offence to the boy’s beans.'`

### Deck quips (round the lantern)

**L49** `'Real son of a beach, that sandbar.'`
"Son of a beach" was retired from Sandy's routine because the mother joke does it better (docs/story.md, Sandy's routine), and here it's back in Willie's mouth, stepping on Sandy's material.
→ **cut** (L54, "I think he liked us, Captain. Sandy.", already does the job better)

**L55–56** `'The Mathilda went up yesterday, Captain. …'`, `'The Terry Belle the day before. …'`
The quips rotate every evening, so on day six it's still "yesterday". These are the two best world-building lines in the set, and the dates go stale.
→ `'The Mathilda tried the rapids without a pilot, Captain. Came back down by evening, all washed up, cargo lost.'` / `'So did the Terry Belle. She’s back in the queue at Davenport.'`

### Willie's news (deckIntelTalk)

**L99** (you) `'One boat? With all that lot lined up at Davenport?'`
"All that lot" is British.
→ `'One boat? With half the river lined up at Davenport?'`

---

## `src/story/characters/gaylord.ts`

### The quarrel at noon (Ellie and Gaylord)

**L33** `['This week only. Show up with a new client next week and I change the game to Bingo.', 'Code says game. It doesn’t say poker. You a professional bingo player, Gaylord? I’ll bring my auntie down from Cordova. She’s a cracking bingoist.']`
Too long for one caption. It says "poker" where the game is Snag, it's the only place Ellie calls him "Gaylord" (everywhere else it's "Montague"), and it capitalises Bingo once and not again.
→ `['This week only. Bring me a new client next week and the game is bingo.', 'The Code says game, Montague. It doesn’t say Snag. My auntie in Cordova is a cracking bingoist.']`
(Keep "cracking bingoist": Gaylord quotes it later at the saloon, and the callback works. It's British, but in his mouth it fits.)

### Breakfast

**L54** `['I play at Davenport of a noon, Captain, on behalf of those who’d rather not. I’m all but booked: …', 'Ten dollars covers my breakfast, my stay and the entry. I take the noon entry out of the winnings, and I keep the rest. …']`
It contradicts itself: the ten dollars covers the entry, and then he takes the entry out of the winnings. The first sentence also repeats his saloon introduction (L92) word for word.
→ `['I’m all but booked this week, Captain: I’ve the last day left, and no other.', 'Ten dollars covers my breakfast, my room and the morning’s entry. The winnings are mine; the boat up the rapids is yours. Watch and learn.']`

**L63** `'… Double back when we next meet, shall we say two weeks? It doubles again if the third week begins.'`
"Double back" means "turn round" before it means "pay twice", and the terms take two readings.
→ `['Fearless and audacious. I see myself in you, Captain.', `${LOAN} dollars now, twice that back in two weeks. Should a third week begin, twice that again.`]`

### Gaylord in your seat (hiredTalk)

**L80** (Ellie) `'A captain who can’t be bothered to play his own seat. Lovely.'`
The player is never given a sex anywhere else, and this line, said about them, makes them a man.
→ `'Can’t be bothered to play your own seat, Captain? Lovely.'`

**L73** `'Never fall in love with a pair, Captain.'`, **L74** `'Now we see who came to play and who came to pay.'`
Stock poker sayings, below his other lines ("I don’t play the cards. I play the price of the cards." is the standard for him).
→ L73 `'A pair is an acquaintance, Captain. Not a marriage.'`; L74 `'Now we learn who came to play, and who merely came.'`

### Gaylord at the saloon

**L92** `'Gaylord Montague Esquire, Captain. I play at Davenport of a noon, on behalf of those who’d rather not. You’ll find me at breakfast.'`
It's missing a comma before "Esquire". He also introduces himself again every evening from day 3 to day 5, which jars on the second evening (that needs a small code change: a `met` branch).
→ First evening: `'Gaylord Montague, Esquire, Captain. I play at Davenport of a noon, on behalf of those who’d rather not. You’ll find me at breakfast.'` Later evenings: `'Captain. Breakfast is still served, and I am still at it.'`

**L96** `['My clients? Pitiful men, lacking the skill and courage even to lose convincingly at poker. Bah, good riddance.', 'They’ll come back down past here soon enough, and then I will fleece them again, and they deserve it, the parasites.']`
This is bitter, not snobbish. "Parasites" and "they deserve it" leave no room for the heart, it runs too long, and it says "poker" again.
→ `['My clients? Men who’d rather lose by proxy than in person. I obliged them.', 'They’ll be back down this way soon enough. I shall oblige them again.']`

---

## `src/story/chapters/02_triCities/index.ts` (the hub)

**L34** `'They’re batty about betting in Bettendorf, Captain. Everyone knows that, up and down the river.'`
Willie says the same line, at the same saloon, in `bettendorf.ts` L64, and "Everyone knows that" is padding.
→ `'They’ll bet on anything in Bettendorf, Captain. Even on which it’ll be, three or four.'` (it points at the house rule; keep "batty about betting" for L64)

**L73** `'You herd timber off the bridge piers all day. It’s bigger than the boat.'`
"It’s" has no clear referent: the timber? the pier?
→ `'You herd a timber raft off the bridge piers all day. The raft is bigger than the boat.'`

**L74** `'You ferry a herd of cattle across the river, and spend the evening cleaning up the manure.'`
The job takes a daytime slot, and the evening is still yours to spend.
→ `'You ferry a herd of cattle across the river, and spend the rest of the day swabbing the deck.'`

---

## `src/story/chapters/02_triCities/depot.ts`

**L43** `'You load sixteen tons, and what do you get?'`
A lyric from a 1946 song: past the 1920s wiggle room, and against the rule already set for Sandy (no borrowed lines).
→ `'Lovely weather for a strike.'`

**L85** `'Been a while! Ain’t seen The Best Intentions since last summer. Where’s Bill?'`
"The" is capitalised mid-sentence. Sandy's specials, the captions and the crew all say "the Best Intentions".
→ `'Been a while! Ain’t seen the Best Intentions since last summer. Where’s Bill?'`

**L95** `'Can’t say no to a friendly game to pass the time, right, fellas? Nothing much else to do around here, with this striking business.'`
Two sentences that say the same thing.
→ `'A friendly game, though, to pass the time? Right, fellas? Nothing else to do, with this striking business.'`

The strike chest lines, "Bill still cheat at patience?" and the sacks that fall off the heap are excellent. No change.

---

## `src/story/chapters/02_triCities/bettendorf.ts`

**L32** `'The crew stayed aboard, playing among themselves and listening to Lars sing.'`
It's past tense; every other caption is in the present ("You treat the crew…", "You anchor…").
→ `'The crew stay aboard, playing among themselves while Lars sings.'`

**L67** (Odds) `'Aye, we are four cities now, really, so we should hold out for four of a kind. I bet we´ll upgrade the name and the game and play for quads.'`
There's a typo (`´`), "Aye" is Scots in a Bettendorf German's mouth, and it's long. It's also the bookmaker's introduction, and she doesn't lay odds.
→ `['Four, if you ask Bettendorf. Bettendorf says hold out for four of a kind.', 'Three to one they win the argument by summer.']`

**L72** (Lenny) `'♪ Everybody knows that the thaw is flowing, everybody knows that the river´s strong ♪'`
Typo (`´`). Neither half is gloomy, and gloom is Lenny's whole note; "the thaw is flowing" isn't English.
→ `'♪ Everybody knows the deck is stacked… everybody knows the rapids win ♪'`

**L74** (Tripp) `'Three of a kind wins the game. That settles it for tonight.'`
It plays when the hands run out with nobody holding trips, so it's false on that path. This needs a code split on `trips`.
→ With trips: keep. Without: `'No three of a kind tonight. We’ll call it a draw, and argue about it tomorrow.'`

**Finlay** sits at this table and never says a word, though the tutorial built him up ("my lout of a husband"). That's not a fault in any line, but it's a missed laugh. One line on his first evening would land it:
→ `say('finlay', 'If a lady in a bonnet asks, Captain, you never saw me.')`

---

## `src/story/chapters/03_rapids/index.ts`

### The queue, and noon

**L125** (Willie) `'Five dollars in, Captain. Last one with money goes to the saloon at noon.'`
"The saloon" here suggests Bettendorf's, the only saloon the player knows; Willie's news (`crew.ts` L100) says the winners "sit down with her at noon".
→ `'Five dollars in, Captain. Last one with money sits down with Ellie at noon.'`

**L129** (Willie / Ellie) `'They say you’re crazy, taking boats up on the thaw.'` / `'I prefer adventurous.'`
The comeback is weak, and her blurb (`en.ts` L282) already tells the same joke word for word, so anyone who opens the gallery hears it twice.
→ Ellie: `'Crazy is going up without me.'` (and see `character.ellie.blurb` below)

### The climb

**L107, L143, L148** `'… and the only breath you’ll get.'`, `'Tell your man to breathe.'`, `'You can breathe, Captain.'`
Three breaths in one climb, and the last is the weakest of them.
→ L148 `'That’s the top. That’s LeClaire. Well steered, Captain.'` (Ellie praising you is worth more than the breathing joke a third time)

**L147** `'St. Louis chain. She was the heaviest loss on the river.'`
On first hearing "she" reads as the city.
→ `'St. Louis chain. The St. Louis was the dearest loss on the river.'`

**L161 and L181** `'That’s a load gone, Captain. ${coal} left.'` and `'A quarter of her, Captain, and that’s a load gone.'`
After a failed push both can show, so Gus says "a load gone" twice in a row.
→ L181 `'We dented her, Captain. A quarter, no more.'` ("Not enough" would echo L183's "It wasn’t enough.")

**L136** `'Every push burns a load, Captain. We’ve six. …'`
It's true while the bunker holds exactly six (`boat.ts` L60). Note it in case the bunker ever grows; otherwise fine.

**L32 and L44** `'We’ll do better next time, Captain.'`, said by Gus after being swept back and again after turning back.
After turning back (Ellie has just called it sensible), it reads as if he didn't hear her.
→ L44 `'We kept the coal, Captain. That counts.'`

---

## `src/i18n/en.ts`

**L282** `character.ellie.blurb` `'… They call it crazy. She prefers adventurous.'`
This is the same joke as the noon introduction.
→ `'The only pilot who takes boats up the rapids on the spring thaw. One boat a day, and she picks it at cards.'`

**L323** `character.sandbar.blurb` `'Stands pat on everything. Takes your coin and turns it into sand.'`
Sandy plays for strength, not money, and is worn down, never fed: the blurb describes a different obstacle.
→ `'Stands pat on everything. Takes your sweat and gives it to the river.'`

**L392** `hub.bettendorf.desc` `'Infamous High Rollers table game'`
"High Rollers" is Ellie's table in the docs, "table game" is padding, and it doesn't say what's special here.
→ `'Cards till someone makes three of a kind'`

**L398** `hub.tournament.desc` `'When you are ready to go upstream'`
A sentence where a menu wants a phrase, and it doesn't say what's on offer.
→ `'A pilot up the rapids, for the winner'`

**L471** `river.oddJob` `'Nearly broke: Willie found an odd job unloading barrels. ${n}.'`
It's in the past tense, unlike the other captions.
→ `'Nearly broke: Willie finds an odd job unloading barrels. ${n}.'`

**L508** `joker.8` `'the Sandbar'`
This is the League's snag, not Sandy's bar, so the house rule ("The Sandbar", capital T) may not apply. If the two are meant to be the same sandbar, it should be `'The Sandbar'`. That's your decision; flagged so it's made on purpose.

---

## Consistency across files

- **The River Code.** "River code" (harbour master, `muscatine` L144), "River Code" (Gaylord, `gaylord.ts` L24), "Code" (Ellie, L33), "captain’s code" (docs). → "the River Code" everywhere in game text.
- **Ellie's home.** The game says Cordova (Willie, Ellie, her auntie, her blurb); docs/story.md says LeClaire. The game is consistent with itself, so the docs are what need updating.
- **First boat up.** Willie's "First boat up the river this year" against the Davenport queue and the Mathilda (fixed above).
- **Where noon is played.** "The saloon at noon" against "sit down with her at noon" (fixed above).
- **The player's sex.** Only Ellie's "his own seat" gives the player one (fixed above). Keep it that way.
- **"Thanks, ma’am" against "Thank you, ma’am"** (above).
- **"Hrmpf" (harbour master) against "Hmph" (Morag).** These are different people, so both can stay, but "Hrmpf" is a misspelling to most eyes. → `'Harrumph.'`, if you want it read as intended.
- **Typos with `´` for `’`:** `hands.ts` L40, `crew.ts` L37, `bettendorf.ts` L67 and L72. A search for `´` finds all four.

---

## The ten I'd change first

1. **Write the three chatter placeholders** (`01_muscatine/index.ts` L61–63). They show as "Chatter 1" in the first minute of the story.
2. **Fix typos and wrong words:** the four `´` (above), "run aground a sandbar" (`muscatine` L172), "ship" (L102), "The Best Intentions" (`depot.ts` L85).
3. **Cut Willie's "Real son of a beach"** (`crew.ts` L49): retired material, back in the wrong mouth.
4. **Untangle Gaylord's breakfast pitch** (`gaylord.ts` L54): the ten dollars covers the entry, and then he takes it out of the winnings.
5. **Introduce crabs before the button says "Crabs over ducks"** (`hands.ts` L68).
6. **Morag's bullets line and "I forgot to show you"** (`tutorial.ts` L366–374): the only muddled stretch in the tutorial.
7. **Tripp's verdict claims trips when nobody made them** (`bettendorf.ts` L74): a false line on a common path.
8. **Odds' introduction** (`bettendorf.ts` L67): the bookmaker should lay odds when we first meet her.
9. **Replace "You load sixteen tons"** (`depot.ts` L43): a borrowed line, and a 1946 one.
10. **Ellie's "I prefer adventurous"**, said word for word in her blurb too (`03_rapids` L129, `en.ts` L282).

## To review: the staple lines (noted 2026-11-16)

The lines used over and over need a look, for repetition and fit. First: the win line at every
obstacle's table, "She gains! A little further up." (`river.gainedGround`): it suits The Sandbar
at best, and it's said at every debris hand too. Each kind of table wants its own, and more than one.
