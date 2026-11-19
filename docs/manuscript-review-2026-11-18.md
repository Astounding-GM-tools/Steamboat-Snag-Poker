# Manuscript review: 18 November 2026

A line-by-line read of `docs/manuscript.md` (generated 2026-11-18), for AI tells, loose prose
and voice. Nothing in the game has been changed: every item is a proposal. Each one gives
the line, where it lives (file:line, as the manuscript has it), what's wrong, a rewrite, and
how sure I am: **clearly better**, **probably better**, or **taste**.

It doesn't redo `docs/dialogue-review.md`, `docs/story-review-2026-11-17.md` or
`docs/drafts-2026-11-17.md`. Where one of their findings is still open in the text, it gets
one line and a pointer ("*still open: story-review, Gaylord*"), not a second argument.

---

## Overview: what the text does most

The good news first: the text is mostly free of the usual machine tells. There's one em
dash in the whole story, and it's a joke (Willie's "not a single sn—"). There are no
"testament to"s, no "little did they know", no "the weight of", no "it's not just X, it's Y",
and almost nobody announces their feelings. Ellie's climb, Morag's pamphlet, Odds, the crate
log lines and Willie's gossip asides ("He winked, Captain. Twice.") are as good as anything
in the game, and need nothing.

What tells there are come in four clumps:

| Pattern | Count | Where it clusters |
|---|---|---|
| **The address tag: "[Statement], Captain. [Short tag]."** | 104 of 417 story lines say "Captain"; 51 have the full "X, Captain. Y." shape | **Gus: 25 of his 29 lines.** Willie, Ellie, the foreman, Gaylord, Sandy all use it too, so they all sound alike |
| **Lines that open "That's…"** | 18 | Gus 5, Ellie 4, Morag 4 |
| **The colon gloss: "Right: you play the four."** | 28 story lines with a colon | 17 of them Morag's ("Right:", "Yes:", "No:", "There you go:"): one in six of her lines |
| **Aphoristic closers** (a tidy maxim to end on) | about 12 | Gaylord's table talk (6 of 9 are maxims), Gus ("What we lose, the river keeps"), Morag ("A big part of the game is knowing when to quit") |
| **Stock phrases** | about 15 | "the point of no return", "where the game is won and lost", "never stood a chance", "plenty more where that came from", "watch and learn" (twice), "wish me luck", "always has, always will", "rarely disappointed", "fallen for none of them", "impeccable manners", "better luck next time" |
| **Paired, mirrored blurbs** ("Has done every X, and most of them Y") | 7 | the gallery blurbs: Bill, the harbour master, Lenny, Eliza, Morag, Tripp, Konrad |
| **Tricolons** | about 8 | blurbs and Morag; mostly earned, two worth cutting |
| **"Not X, Y" corrections** | 3 | Morag's "not kings and queens", Gaylord's "I don't play the cards", Gus's "no more" |

**The one big one is the address tag.** `docs/story.md` already plans the cure: "How the
player is addressed is just text, by speaker and mood: Captain, Cap'n, Herr Kapitän". It was
never done, so the earnest boy, the grumbling engineer, the Irish foreman and the gambler all
end their sentences the same way. Willie should keep "Captain" everywhere: it's his whole
character, a new First Mate saying the new title as often as he can. Gus should say it only
when it carries weight (bad news, a correction). The foreman and Rourke: "Cap'n" (which is
the opposite of what story-review proposed for `FOLDED`; I'd keep his one "Cap'n" and give
him the rest). Ellie already uses it sparingly (8 of 24) and is the best-voiced speaker in
the game: that's the model.

**Voice, in a line each:**

- **Willie:** right when he's private (the log, the gossip), generic when he speaks: his
  spoken lines are Gus's with an exclamation mark. His log has one modern phrase ("doing
  tasks").
- **Gus:** right in what he says ("Too early on the thaw to go up. Everyone says so. I say
  so."), samey in how: the address tag, "That's…", and "no more" twice. Three slips: a
  coach's "We'll do better next time", a tentative "I think I can fix", and "boys".
- **Sandy:** on model. One semicolon too many.
- **Bill:** good until the end of his talk, where he turns into a melodrama father ("This is
  how it must be. I've made my decision.").
- **The harbour master:** good; "Hrmpf" and "a good deal of money" are still open.
- **Gaylord:** the voice is right and the material is thin: half his table talk is poker
  maxims anyone could say, and "wish me luck" goes against his creed.
- **Ellie:** the best in the game. Leave her alone.
- **The foreman:** "Alas" and "Wise man" in a man who says "ain't got no". He needs to sound
  more like a striker and less like a narrator.
- **Morag:** strong in the pamphlet and the openings, slipping into a modern teacher's
  patter in the lessons ("There you go", "A big part of the game", the colon glosses).
- **The narrator (captions):** good when it's dry ("The raft is bigger than the boat."),
  purple twice ("the river hands back what the rapids took off the boats that tried them").

---

## The top 20

1. **Gus says "Captain" in 25 of 29 lines**, and nearly everyone else uses the same "X,
   Captain. Y." shape. Cut it from about half of Gus's lines and give the foreman "Cap'n"
   (the list is under [The crew](#the-crew-aboard)). *Probably better.*
2. **"KING OF THE RIVER!"** (`end.winGame`, `end.gameOverKing`) genders the player, and
   Morag, Ellie or Odds when they win. → "MASTER OF THE RIVER!": a steamboat's *master* was
   her licensed captain, so it's period, and nobody's left out. *Probably better.*
3. **Gus: "It's just soggy cotton, boys."** (`debris.ts:91`) The Captain is at the rail,
   so "boys" genders the Captain. → "It's just soggy cotton, Captain." *Clearly better, by
   the house rule.*
4. **Gus's push readings say "she" and "her" for the chain** (`03_rapids/index.ts:179–184`),
   a line after "She hasn't the strength for this" meant the boat. → "It barely felt that." /
   "We dented it. A quarter, no more." / "Half of it." *Clearly better.*
5. **"The bridge: yours, Captain."** (`ship.bridge`) A riverboat has a pilothouse; a bridge
   is for seagoing ships. → "The pilothouse: yours, Captain." *Clearly better.*
6. **Gaylord's table talk is six maxims out of nine** (`gaylord.ts:73–75`): "Patience is an
   edge that doesn't wear dull", "The best hand is the one they believe", "Never show more
   than you must". Cut those three; keep the ones only he would say. *Probably better.*
7. **Gaylord: "Here to watch and learn, I see. Well, wish me luck."** (`gaylord.ts:80`)
   Luck is the one thing he doesn't believe in, and "watch and learn" is his breakfast pitch
   word for word. → "Here to watch, I see. Do take notes." *Probably better.*
8. **Morag: "This is where the game is won and lost: the point of no return."**
   (`tutorial.ts:309`) Two stock phrases, and not true (it's the last swap, not the
   decision). → "Your last chance to swap. Swap badly now, and the hand is lost."
   (The "…lost?" button still works.) *Probably better.*
9. **Bill: "This is how it must be. I've made my decision."** (`01_muscatine/index.ts:150`)
   Stage-father talk, in a man who's been plain all scene. → "No. I've made up my mind."
   *Probably better.*
10. **Bill says the premise twice** (`:138`): "Poker is what makes the river run." / "Every
    decision on the river is made over a hand of cards. Just as we're doing now." → cut the
    slogan: "Everything. Every decision on the river is made over a hand of cards. Like this
    one." *Probably better.*
11. **The foreman: "Plenty more where that came from."** (`depot.ts:41`) is the very line
    `docs/story.md` put "out for good" ("There's more where that came from"); and "Alas,"
    (`depot.ts:90`) isn't his word. Rewrites under [The depot](#the-depot). *Probably better.*
12. **The harbour master: "only five rounds"** (`01_muscatine/index.ts:170`). Everywhere
    else these are *hands*, and "Round" is the League's word for a month. → "only five
    hands". *Clearly better.*
13. **Willie's log: "doing tasks before anyone realises they need doing"**
    (`01_muscatine/index.ts:22`). "Doing tasks" is office English. → "seeing to things
    before anyone knows they want seeing to". *Probably better.*
14. **Morag: "And so can you, because an ace can also count as a one…"** (`hands.ts:56`).
    "So can you" refers back two lines, past a button. → "You can make one too: an ace can
    count as a one, and start a run." *Clearly better.*
15. **Morag points at the UI: "they're ranked in How it works: open the question mark and
    see."** (`hands.ts:77`) How it works *is* her pamphlet. → "In case you forget, I have set
    them down in my pamphlet. The question mark, child." *Probably better.*
16. **Gus: "We'll do better next time, Captain."** (`03_rapids/index.ts:32`) A coach's line.
    He counts coal. → "That's every shovel we had, Captain." *Probably better.*
17. **Gus: "There's no more where they came from."** (`03_rapids/index.ts:136`) A stock
    phrase turned inside out, and Gus's third "no more". → cut it: "Every push burns a load,
    Captain. We've six." *Probably better.*
18. **The salvage camp caption** (`02_triCities/index.ts:36`): "where the river hands back
    what the rapids took off the boats that tried them" is the one purple caption in the
    Tri-Cities, and "hands her back" is said again when she's swept back. → "You tie up
    below the Moline chain with a boat hook, and wait for the rapids to send something
    down." *Probably better.*
19. **Small certain fixes:** a straight apostrophe in `nick.deadMan` ("Dead Man's"); "Deck
    hand" in the gallery against "deckhand" in the tutorial; "clothes-pegs" (British; in
    Iowa, "clothespins"); "Tuesday's post" (the game says "the mail"); "A pair of aces are
    Bullets" (a pair *is*); the button "Right." (the only one with a full stop that isn't a
    joke); "You're out. Watch the rest play it out." (out, out). *Clearly better.*
20. **`options.fullscreenTip`**: "Any tap goes back to it if the phone drops out of it." Two
    "it"s, two meanings. → "If the phone drops out of it, tap anywhere to go back."
    *Clearly better.*

---

## By part

### Chapter one: Muscatine (`01_muscatine/index.ts`)

**Willie's first thought (`:20–28`)**

- `:21` "First Mate made Captain, and I am the new First Mate now." Telegraphic in a way
  nothing else in the thought is, and the reader has to stop to work out who was made
  Captain. → "The First Mate is Captain now, and I am the new First Mate." *Probably better.*
- `:22` "Gus says being First Mate means doing tasks before anyone realises they need doing,
  and to write down everything the Captain should know and that I should remember." Two
  things: "doing tasks" (see top 20, #13), and "and that I should remember" hangs off the
  end. → "Gus says being First Mate means seeing to things before anyone knows they want
  seeing to, and writing down everything the Captain ought to know, and everything I ought
  to remember." *Probably better.*
- `:22` "realises" is -ise; the snag list has "Unionized" (-ize). Pick one spelling for the
  game. *Clearly better, either way.*
- The capital-F "First Mate" in Willie's log against lower-case "first mate" from Bill and
  the Captain (`:126–127`, `tutorial.ts:179`): if it's on purpose (Willie capitalises his
  new title; nobody else does), it's a good touch and should stay. Noted so it's a choice.
- `:26–28`, the three hopes. (*still open: story-review, Willie's log*; the full stops.) A
  three-item list is the natural shape for a hope list, so no tricolon complaint here.

**Bill (`:120–153`)**

- `:122` "Good money. And the worst timing of my life." Fine. "Timing" in this sense is
  modern-ish, but it reads clean. Leave.
- `:138` "Everything. Poker is what makes the river run." / "Every decision on the river is
  made over a hand of cards. Just as we're doing now." (top 20, #10). Also: the game is
  *Snag*, which Bill has just called it; "poker" is the wider word, which is fine, but it's
  the slogan that's redundant. *Probably better.*
- `:145` "Too young, and too eager. Maybe in a few seasons. For now, it's your turn." Good;
  the hook story-review builds Willie's arc on.
- `:148–150` "She needs me here, and so do the little ones." / "The river's no place for
  little ones": the echo is fine. "This is how it must be. I've made my decision." (top 20,
  #9). *Probably better.*
- `:153` "Enough to settle it, with a little over for food and coal. Past that, you'll find
  your own cargo." Clear now. Leave.

**The harbour master (`:163–215`)**

- `:163` "A good deal of money." (*still open: dialogue-review*.)
- `:170` "Hrmpf." (*still open: dialogue-review*.) "only five rounds" → "five hands" (top
  20, #12). *Clearly better.*
- `:214` "Thirty-seven dollars, Captain. Pleasure doing business." Fine; a little stock, but
  it's his blurb's joke (he charges everyone) cashed in. Leave.
- `:215` "Hrmpf. Mine to settle, then. Off with you." Good.

**Under way (`:189–199`)**

- `:189` "Clear water to the Tri-Cities, Mr. Klemm says, and not a single sn—" The best
  set-up in the chapter. Leave.
- `:193` "We are aground" and `:198` Gus's two lines (*still open: dialogue-review*).

### The Sandbar (`sandy.ts`)

Sandy is on model. His routine's anachronisms (Piña Coladas, Adam Ant, "five o'clock
somewhere") are noted in `docs/story.md` and are a choice, so I haven't counted them as
period slips.

- `:63` "I think you've had enough, Captain. You're in no shape to navigate; better spend
  the night." The joke is the first sentence (the bartender cutting you off); the rest
  explains it, with a semicolon. → "I think you've had enough, Captain. Better sleep it off
  here." *Probably better.*
- `:86` "You're getting the hang of this. Do nothing. Nothing moves here." "Nothing moves
  here" explains the joke. → "You're getting the hang of this, Captain. Doing nothing."
  *Taste.*
- `:90` Gus, "That's our own sweat back, Captain, no more. What we lose, the river keeps."
  The second sentence is a tidy aphorism, but it's the one that teaches the rule (worn
  down, never fed), so it earns it. Leave; but it's one of Gus's three "no more"s (see
  `03_rapids:136, :181`).
- `:96` Willie, "She's off, Captain! We're floating!" Good.

### Debris (`debris.ts`)

- `:91` "It's just soggy cotton, boys." (top 20, #3.) The Nov 17 drafts' lost-crate lines
  use "boys" four more times; the same fix goes for them. *Clearly better.*
- `:98` "Sawyer off the bow, Captain! She'll need watching." "She" for a tree, a line after
  every "she" has been the boat. → "Sawyer off the bow, Captain! That'll want watching."
  *Probably better.*
- `:100` "Drift pile, dead ahead!" straight after the Deadhead's line: if the two can come
  close together, "dead ahead" lands as a pun on "Deadhead" that nobody meant. *Taste.*

### The log (`log.ts`)

- `:52` "Fished out a crate of clothes-pegs." Britishism; in 1904 Iowa, clothespins. →
  "Fished out a crate of clothespins." *Clearly better.*
- `:53–60` The finds are good: "Luck, by the pound.", "No doors.", "Gus would." are the
  right size. Two of nine are about Lars ("Lars approves", "Lars hums along"); fine.
- `:65` "The river kept the first one. Testing us, I think." Good.

### The Tri-Cities hub (`02_triCities/index.ts`)

- `:36` The salvage camp caption (top 20, #18). *Probably better.*
- `:37` Gus, "Not a shovel of coal, Captain. Just patience and a boat hook." Good line, one
  of the "Captain"s to cut: "Not a shovel of coal. Just patience and a boat hook."
  *Probably better.*
- `:52` "Even on which it'll be, three or four." (*still open: story-review, the hub*, the
  spoiler). Also unclear out of context: three or four *what*. If it stays, → "Even on how
  many cities there are." *Probably better.*
- `:91–92` "You herd a timber raft…" / "You ferry a herd of cattle…": herd, herd, in
  neighbouring lines. → "You ferry cattle across the river, and spend the rest of the day
  swabbing the deck." *Probably better.*

### The depot (`depot.ts`)

- `:40` "More for the strike chest! That should last us another day or two." Fine.
- `:41` "Plenty more where that came from. Union sends it up by the sack." The first half
  is the stock phrase `docs/story.md` retired from Sandy. → "Union sends it up by the sack,
  Cap'n." *Probably better.*
- `:41` "Easy come, Captain. Tuesday's post brings more." "Post" is British; the game's
  word is mail. → "Easy come, Cap'n. Tuesday's mail brings more." *Clearly better (the
  word); taste (Cap'n).*
- `:43` "You load sixteen tons…" (*still open: dialogue-review*).
- `:55` "I'll sort out {snag}, Captain. Got nothing better to do." Good, and the right
  voice.
- `:63` "Good game" (*still open: story-review*).
- `:90` "Left you in charge, did he? Wise man. Alas, ain't got no coal to sell you.
  Strike's on, see." "Alas" next to "ain't got no" is two registers in one breath, and
  "Wise man" is a narrator's nod. → "Left you in charge, did he? Good for you. Only I ain't
  got no coal to sell you. Strike's on, see." *Probably better.*
- `:97` "Can't say no to a friendly game…" (*still open: dialogue-review*, "fellas").

### Bettendorf (`bettendorf.ts`)

- `:54` The odds are the best one-liners in the Tri-Cities. "Five to one that boat of yours
  floats." is perfect. Leave all six.
- `:72` Willie at a table he isn't at (*still open: story-review*).
- `:80` Lenny's song (*still open: dialogue-review*; "the thaw is flowing" is still in).
- `:83, :85` Tripp. Fine.

### Gaylord (`gaylord.ts`)

The quarrel with Ellie (`:16–40`) is the best-written scene in the Tri-Cities: two voices,
quick, every line doing work ("I can count, Miss Sawyer. It's rather the point of me.").
Leave it all.

- `:54` "I'm all but booked this week, Captain: I've the last day left, and no other." "And
  no other" says "the last day left" again. → "I'm all but booked this week, Captain. I've
  the last day left." *Probably better.*
- `:54` "The winnings are mine; the boat up the rapids is yours. Watch and learn." The
  mirrored semicolon is a tell, though it suits a man stating terms; "Watch and learn"
  comes back at `:80`. → "The winnings are mine, and the boat up the rapids is yours."
  *Probably better (the cut); taste (the semicolon).*
- `:63` "Fearless and audacious. I do see myself in you, Captain." Two words that mean the
  same; the joke is the vanity in the second sentence. → "Audacious. I do see myself in
  you, Captain." *Taste.*
- `:73–75`, his table talk. Nine lines, six of them maxims of the "poker wisdom" kind (top
  20, #6). Keep what's his:
  - keep: "Note who stands pat. It's the only honest thing a man does at this table." (and
    it pays off Willie's Davenport gossip)
  - keep: "I don't play the cards, I play the price of the cards." Better as two sentences:
    "I don't play the cards. I play the price of the cards." *Taste.*
  - keep: "A fee to see the River. Cheap, for what it tells me."
  - keep: "Lay it down gently. You want them to think you're sorry."
  - cut: "Patience, now. Patience is an edge that doesn't wear dull." (a metaphor about
    nothing)
  - cut: "There. Never show more than you must."
  - cut: "The best hand is the one they believe." (fortune cookie)
  - "Never fall in love with a pair" and "who came to play and who came to pay" (*still
    open: dialogue-review*).
  With six left, three a hand, say each once (story-review's fix). *Probably better.*
- `:80` "Here to watch and learn, I see. Well, wish me luck." (top 20, #7.) *Probably
  better.*
- `:98` "My clients? Pitiful men…" (*still open: dialogue-review*). Add to that: "Bah" is
  the one word in the game that his manners wouldn't let out.

### The crew, aboard (`crew.ts`)

**The address tag, Gus's lines.** Keep "Captain" where it carries something (bad news, a
correction, the first line of a scene); cut it where it's a tag. *Probably better* for the
set; each line is small.

| Line | Where | → |
|---|---|---|
| Old Hildegard doesn't care for sand, Captain. Not one bit. | `crew.ts:49` | Old Hildegard doesn't care for sand. (both tags go) |
| One fireman won't get us up the rapids, Captain. | `crew.ts:36` | One fireman won't get us up the rapids. |
| Not a shovel of coal, Captain. Just patience and a boat hook. | `02_triCities/index.ts:37` | Not a shovel of coal. Just patience and a boat hook. |
| She'll want a full bunker for the rapids, Captain. | `02_triCities/index.ts:51` | She'll want a full bunker for the rapids. |
| An overhaul gets twice the work from the same coal, Captain. | `02_triCities/index.ts:73` | An overhaul gets twice the work from the same coal. |
| That's all they have, Captain. There's not another shove in them today. | `sandy.ts:98` | That's all they have. There's not another shove in them today. |
| We kept the coal, Captain. That counts. | `03_rapids/index.ts:44` | We kept the coal. That counts. |
| That's a load gone, Captain. {coal} left. | `03_rapids/index.ts:161` | A load gone. {coal} left. |
| Nearly, Captain. Another push like that… | `03_rapids/index.ts:184` | Nearly. Another push like that… |

Keep it in: "It does not work like that, Captain." (the "Captain" is the punch), "She hasn't
the strength for this, Captain.", "That's the last of the coal, Captain.", "Anything broken,
Captain, lay it on the table.", "That's {snag}, Captain. We'll live."

- `:21` "Kerosene is in short supply." / `:23` "The river speaks to you…" (*still open*).
- `:22` "The moon is out and very pretty." The plainness is charming; leave. *Taste.*
- `:38` "We should upgrade the boiler…" (*still open: story-review*).
- `:53` "I think he liked us, Captain. Sandy." Good: the late name is the joke.
- `:62` Gus, "I think I can fix {snag}, Captain." Tentative, from a man who "knows to the
  shovel" what a stretch will burn. → "I can fix {snag}, Captain." *Probably better.*
- `:105` "Any captain who loses a dozen dollars at their table is a friend of the union":
  "their" can be the captain's table. → "Any captain who loses a dozen dollars to the strike
  chest is a friend of the union, he says." *Probably better.*
- `:100` "Funny, how the strikers' heap keeps losing sacks." The foreman's own line opens
  "Funny thing, Captain." Willie borrowing the word is either a nice echo or a
  repetition, depending on which the player hears first. *Taste.*
- `:114` "They just sit there looking stubborn, and let the others throw their money
  about." Good: the most Willie line he speaks.
- `:122` "He thinks I didn't notice." Good.

### Davenport, the rapids, LeClaire (`03_rapids/index.ts`)

- `:30` "The river takes the Best Intentions, and hands her back at Davenport." Good on its
  own; it's the salvage caption that should give up "hands back" (#18).
- `:32` Gus, "We'll do better next time, Captain." (top 20, #16.) *Probably better.*
- `:31`, `:102` "Same time tomorrow" (*still open: story-review*).
- `:107` "the only breath you'll get", `:143`, `:148` (*still open: dialogue-review*, three
  breaths).
- `:125` "sits down with Ellie" (*still open: story-review*, Miss Sawyer).
- `:136` Gus, "There's no more where they came from." (top 20, #17.) *Probably better.*
- `:137–148` Ellie's marks: leave every one. "She was a good boat, the Brazil." and "Mason's
  Rock to port. Don't look at it." are the best lines in the chapter.
- `:179–184` the push readings (top 20, #4). Also `:183` "Half of her, Captain. It wasn't
  enough." "It wasn't enough" is flat after "A quarter, no more." → "Half of it, Captain."
  *Probably better.*
- `:157` "Just give me all she's got, Mr. Klemm." / "It does not work like that, Captain."
  Good: the inverted Scotty joke is just enough.

### The tutorial (`tutorial.ts`)

Morag's openings are excellent and need nothing. The slips are in the teaching, where she
starts to sound like a modern instructor.

- `:150` "And I do hold a grudging respect for you, it seems. Well done." / `:166` "But I do
  find myself holding a grudging respect for you." The same joke in two wordings, and "Well
  done" to a player she's just cleaned out muddies it. → both: "And I do hold a grudging
  respect for you, it seems." *Probably better.*
- `:158`, `:175` "Yet your snag remains…" (*still open: dialogue-review*).
- `:309` "This is where the game is won and lost: the point of no return." (top 20, #8.)
  *Probably better.*
- `:317` "Ditch the boys" (*still open: dialogue-review*).
- `:331` "Numbers win battles, not kings and queens." The pun (number cards) is good; the
  "not X" tail is the tell. → "Numbers win battles, child. Look at the ducks." *Taste.*
- `:353` "There you go: the mighty aces brought low by a flock of ducks." "There you go" is
  a modern shop-counter phrase, and the colon again. → "There. The mighty aces, brought low
  by a flock of ducks." *Probably better.*
- `:359` "Deuces, or Ducks, when they come in pairs." capitalises Ducks; `hands.ts:45`
  doesn't ("is called ducks"). `:366` "Bullets" capital, `:367` "bullets" not. → lower case
  throughout, as the lingo is spoken. *Clearly better.*
- `:366–367` "A pair of aces are Bullets, and so on." A pair *is*. → "Two aces are bullets."
  (The second sentence: *still open: dialogue-review*.) *Clearly better.*
- `:404` "A big part of the game is knowing when to quit." Stock, and soft for her. → "Most
  of this game is knowing when to quit." *Taste.*
- `:417` "Your jacks never stood a chance." Stock. Fine for a teacher, and short. Leave.

### The hands lesson (`hands.ts`)

- `:43`, `:46` "So what do you do?" twice, three lines apart. → `:46` "And two pair beats
  one pair. Now what?" *Probably better.*
- `:55` button "Right." The only button with a full stop that isn't a joke ("Yes. I do."
  is). → "Right". *Clearly better.*
- `:56` "And so can you…" (top 20, #14). *Clearly better.*
- `:69` "Very good! So everyone at the table has two pair now. Tap one of your threes. What
  do you have now?" Now, now. → cut the first. *Clearly better.*
- `:71` "No: mine is weaker. Your house has three threes; mine only three deuces. The bigger
  three wins." Colon, semicolon, and "the bigger three" can be misread as the bigger number
  of cards. → "No, mine is weaker. Your three threes beat my three deuces." *Probably
  better.*
- `:77` "they're ranked in How it works" (top 20, #15). *Probably better.*
- Praise count, for the record: in 30 lines she says Right, Yes, Well done, That's right
  (twice), Exactly (twice), Very good, Quite so, You are right. Dialogue-review trimmed it
  once; it's still a tic. `:47` "That's right. These are all weak hands." answers the
  *Swap?* button, a question, with "That's right". → "Yes. These are all weak hands."
  *Probably better.*

---

## The dictionary (`src/i18n/en.ts`)

**Title**

- `title.tagline.0` "Because the Night Was Made for Poker" and `.1` "Because the River Was
  Made for Poker": the same line twice in a list of twelve. → keep one (the River). *Probably
  better.*
- `title.tagline.9` "Play Your Cards, Pass On Your Problems." "Problems" is the one modern
  self-help word on the title screen. → "Play Your Cards, Pass On Your Snags." *Taste* (it
  nears tagline.3, "Dump Your Snags Downstream").

**Options**

- `options.fullscreenTip` (top 20, #20). *Clearly better.*
- `options.sound` "The clink of coins" and `options.music` "The band" sit beside plain
  "Full screen" and "Card faces". Two whimsical labels out of five is fine. Leave.

**How it works** is Morag's best writing: "which is the only Christian thing about the
game", "Wiser still: fold before you sit down.", "I have seen it.", "as though they had not
lost enough". Leave all of it. The one tricolon ("their money, their boats and their good
names") is the pamphlet's register, and earned.

**The table**

- `hr.youAreOut` "You're out. Watch the rest play it out." → "You're out. Watch the rest
  play on." *Clearly better.*
- `finale.next` "Four captains left. You have been invited to The High Rollers Table." A
  capital "The" mid-sentence, and no apostrophe. → "Four captains left. You are invited to
  the High Rollers' Table." *Probably better.*
- `end.winGame`, `end.gameOverKing` (top 20, #2). *Probably better.*
- `end.gameOverMany` "Better luck next time!" Stock, but it's a game-over screen, so stock
  is allowed. Leave.
- **Ties, three names:** `show.draw` "A dead heat!", `hr.rides` "Dead level!", `ladder.ties`
  "dead level". "Dead level" is the house word. → `show.draw` "Dead level!" *Probably
  better.*
- `show.tb.suit.*` "Dead level! Your {win} beats {name}'s {lose} on suit." contradicts
  `ladder.ties` ("Suits count for nothing"), and itself (dead level, then a winner). As far
  as I can tell `tiebreak()` in `ui/handNames.ts` is only called from its tests, so these
  strings are dead; if they're ever wired up, the suit pair has to go. *Clearly, if used.*
- `willie.fished` "Blast! You fished {jokers} out of the deck. You draw again, so your hand
  is still full, but that snag is yours now." When `{jokers}` is two, "that snag" is wrong.
  → "…but the snags are yours now." (or by count). *Clearly better.*
- `draw.boardOnly` "No cards tapped, playing the board": a comma between two clauses. →
  "No cards tapped: playing the board". *Taste.*

**Hand names**

- `nick.deadMan` "The Dead Man's Hand!" has a straight apostrophe; `lingo.deadMan` has a
  curly one. *Clearly better.*
- `hand.*` and `describe.*` are Title Case ("a Pair", "Two Pair, {a} and {b}"); `call.*` and
  `ladder.*` are sentence case. If they never show side by side, fine; if they do, pick one.
  *Taste.*
- `lingo.rank.6` "Kicks" is from "(Get Your Kicks on) Route 66", 1946, the same problem as
  "sixteen tons"; `lingo.route66` itself is 1926, inside the cartoon's frame. → "Kicks" can
  stay if the League is outside the period rule; if not, sixes are "Boxcars" in pairs
  (dice, and 1900s) or simply "Sixes". *Taste.*

**The gallery (`character.*`)**

The blurbs are where the paired, tidy sentence lives. Several share one template: "Has done
every X, and [most/none] of them Y".

- `steamboatBill.blurb` "A gruff old-timer who has seen every trick on the river and fallen
  for none of them." Stock, and not the Bill we meet (warm, worried, a family man). →
  "Thirty years on the Best Intentions. Left her in the one pair of hands he'd trust."
  *Taste.*
- `harbourMaster.blurb` "Has cleared every boat out of Muscatine for thirty years, and
  charged most of them for it." Good: the one the template was copied from. Keep this one.
- `lenny.blurb` "Moody and gloomy; expects the worst, and is rarely disappointed." Two
  near-synonyms, a semicolon and a stock phrase. → "A wandering troubadour with a cardboard
  violin. Expects the worst, and sings about it." *Probably better.*
- `konrad.blurb` "A hard man from a hard river. Grips the wheel, and his cards, until his
  knuckles go white." The second sentence explains the nickname, Whiteknuckle, which is
  printed above it. → "A hard man from a hard river. Grips the wheel and his cards the same
  way." *Probably better.*
- `eliza.blurb` "Charming, patient and terribly polite. Those who lose to her tend to stay
  lost." Tricolon plus a closer. The closer is the good part. → "Terribly polite. Those who
  lose to her tend to stay lost." *Taste.*
- `pfund.blurb` "Pays no attention to anyone, and pays it loudly." The zeugma doesn't parse
  (you can't pay *no* attention loudly). → "Pays no attention to anyone, loudly." *Taste.*
- `tripp.blurb` "Three of a kind settles it. Always has, always will." Stock tail. →
  "Three of a kind settles it. He has never once been asked why." *Taste.*
- `longReach.blurb` "the longest, hardest stretch on the river". A superlative where every
  other chain blurb is concrete ("Three wrecks and a standing wave."). → "St. Louis, Cabin,
  Sycamore, Smith's: four chains, end to end." *Probably better.*
- `willie.nick` "Deck hand" against `tutorial.ts:150` "deckhand". (Whether it should say
  First Mate: *still open: story-review*.) *Clearly better, the spelling.*
- `morag.blurb` "Came to fetch her husband home. Stayed to clean out the table." Mirrored,
  and it works. Leave.
- Good as they are: Max Moritz ("The coat giggles."), the Sawyer ("Patient."), the fireman,
  Gus, Willie ("Indomitable. The beans are his."), the Sandbar, the Crate.

**The boat (`ship.*`) and the river (`river.*`, `hub.*`, `item.*`)**

- `ship.bridge` (top 20, #5). *Clearly better.*
- `ship.strength` "Ship's strength". The crew make it (`ship.strengthNote`), the hub calls
  it "the crew's strength", and everyone aboard says boat, not ship. → "Crew's strength".
  *Probably better.*
- `ship.part.kitchen` "Kitchen" against `ship.station.galley` "Galley"; `item.cook.desc`
  "Needs a kitchen. Takes the galley" has both in one line. Dialogue-review moved Gus to
  "galley". → "Galley" for the part as well ("Galley 1"). *Probably better.*
- `river.needsCoal` "Needs {n} coal" against `river.needCoal` "{n} loads of coal needed to
  cast off" and `river.coalLoads` "{n} of {max} loads". → "Needs {n} loads". *Probably
  better.*
- `river.won.sandbar.2` "She shifts! The bar gives a little." and `.5` "She budges! The
  bar's a little shallower." "A little" twice in six lines that rotate. → `.2` "She shifts!
  The bar gives." *Taste.*
- `river.won.deadhead.4` "Missed you by a hand's breadth!" says "you" from the deadhead's
  side, where the others are the boat's. → "Missed it by a hand's breadth!" *Taste.*
- `hub.job:salvage.desc` "No coal. Crates below the rapids, for the crew's strength":
  reads as if the crates *give* strength. → "No coal. Crates below the rapids, played for
  the crew's strength". *Probably better.*
- `joker.3` "the Unionized Coal Shoveller": -ize with British -ll; and see "realises" above.
  *Clearly better, once a spelling is picked.*
- The item descriptions are the tightest text in the game ("Better than beans: +4 strength
  tomorrow morning.", "Sell one. Coal's short while the strike's on."). Leave.

---

## If only an hour tonight

The address tag (#1, a few dozen one-word cuts, and the biggest change to how the crew
sound), the three gender slips (#2, #3), and the small certain fixes (#4, #5, #12, #19,
#20). Gaylord's table talk (#6, #7) next: it's said three times a hand.
