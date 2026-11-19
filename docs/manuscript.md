# Manuscript: every word the player sees

Generated from the source by `node scripts/manuscript.mjs` (2026-11-19): don't edit it here, edit the
source (each line says where: the declaration, and file:line), then run it again.

How to read it: **Speaker:** the line; **You** is the player (the Captain, or Bill's First Mate before
the handover). Lines with no speaker are captions (intertitles) or log entries; *button* is the player's
reply button, *comeback* is said back to a reply. `{…}` is filled in at play (a number, a
name). Story parts come in roughly the order they're met; the dictionary (titles, buttons, names, item
descriptions, the river's calls and the log's labels) is at the end.


## Chapter one: Muscatine, The Sandbar, the river

### src/story/chapters/01_muscatine/index.ts


**NEW_FIRST_MATE**

- First Mate made Captain, and I am the new First Mate now. <sub>[1] · index.ts:21</sub>
- Gus, the engineer, says being First Mate means being the Captain’s eyes and ears, and to write down everything I need to remember and that the Captain should know about. <sub>[2] · index.ts:22</sub>

**muscatineTalk**

- **Bill:** Landed a big job. <sub>bill.rounds[1].deal[1][1] · index.ts:122</sub>
- **Bill:** Horseless carriage, up in Dubuque, bound for the World’s Fair in St. Louis. <sub>bill.rounds[1].deal[1][2] · index.ts:122</sub>
- *button* Bad <sub>bill.rounds[1].deal[1].replies[1].label · index.ts:124</sub>
- *button* Good <sub>bill.rounds[1].deal[1].replies[2].label · index.ts:125</sub>
- **You:** This is good news, isn’t it, Captain? <sub>bill.rounds[1].deal[2] · index.ts:128</sub>
- **Bill:** Good money. And the worst timing of my life. <sub>bill.rounds[1].deal[3] · index.ts:129</sub>
- *button* Why? <sub>bill.rounds[1].deal[3].replies[1].label · index.ts:129</sub>
- **Bill:** Because you’re the captain now. <sub>bill.rounds[1].deal[4] · index.ts:130</sub>
- *button* Me? <sub>bill.rounds[1].deal[4].replies[1].label · index.ts:130</sub>
- **You:** You say that like it’s bad news, Captain? <sub>bill.rounds[1].deal[5] · index.ts:131</sub>
- **Bill:** It is good news. It’s just the timing that’s bad. <sub>bill.rounds[1].deal[6][1] · index.ts:132</sub>
- **Bill:** Because I can’t come with. I’m making you the captain. <sub>bill.rounds[1].deal[6][2] · index.ts:132</sub>
- *button* Me? <sub>bill.rounds[1].deal[6].replies[1].label · index.ts:132</sub>
- **You:** Me? I’m only the first mate. <sub>bill.rounds[1].flop[1] · index.ts:135</sub>
- **Bill:** That’s what a first mate is for. <sub>bill.rounds[1].flop[2] · index.ts:136</sub>
- *button* Gus? <sub>bill.rounds[1].flop[2].replies[1].label · index.ts:136</sub>
- **You:** Why not Mr. Klemm? No one knows the boat better. <sub>bill.rounds[1].flop[3] · index.ts:137</sub>
- **Bill:** Gus only cares about his engine. He’d stay in port all day cleaning it if he could. <sub>bill.rounds[1].flop[4] · index.ts:138</sub>
- **Bill:** Any other bright ideas? <sub>bill.rounds[2].flop[1] · index.ts:143</sub>
- *button* Lars? <sub>bill.rounds[2].flop[1].replies[1].label · index.ts:143</sub>
- **You:** Lars, then. He’s a grown man, and stronger than anyone. <sub>bill.rounds[2].flop[2] · index.ts:144</sub>
- **Bill:** Lars doesn’t speak the language. We’re not even sure that’s his name. <sub>bill.rounds[2].flop[3][1] · index.ts:145</sub>
- **Bill:** And he’s a hopeless Snag player. <sub>bill.rounds[2].flop[2] · index.ts:145</sub>
- *button* Snag? <sub>bill.rounds[2].flop[3].replies[1].label · index.ts:145</sub>
- **You:** What has Snag got to do with captaining? <sub>bill.rounds[2].flop[4] · index.ts:146</sub>
- **Bill:** Everything. Poker is what makes the river run. <sub>bill.rounds[2].flop[5][1] · index.ts:147</sub>
- **Bill:** Every decision on the river is made over a hand of cards. Just as we’re doing now. <sub>bill.rounds[2].flop[5][2] · index.ts:147</sub>
- **Bill:** Well? <sub>bill.rounds[3].deal[1] · index.ts:152</sub>
- *button* Willie? <sub>bill.rounds[3].deal[1].replies[1].label · index.ts:152</sub>
- **You:** Willie, then. He’s a great player, and everyone likes him. <sub>bill.rounds[3].deal[2] · index.ts:153</sub>
- **Bill:** Too young, and too eager. Maybe in a few seasons. For now, it’s your turn. <sub>bill.rounds[3].deal[3] · index.ts:154</sub>
- **Bill:** My wife’s taken ill. She needs me here, and so do the little ones. <sub>bill.rounds[3].flop[1] · index.ts:157</sub>
- *button* Bring them? <sub>bill.rounds[3].flop[1].replies[1].label · index.ts:157</sub>
- **You:** Can’t they come with us, on the river? <sub>bill.rounds[3].flop[2] · index.ts:158</sub>
- **Bill:** The river’s no place for little ones, and she needs the doctor’s care. <sub>bill.rounds[3].flop[3][1] · index.ts:159</sub>
- **Bill:** This is how it must be. I’ve made my decision. <sub>bill.rounds[3].flop[2] · index.ts:159</sub>
- **Bill:** Here. The dock fee bill for the winter, and fifty dollars. Enough to settle it, with a little over for food and coal. Past that, you’ll find your own cargo. <sub>bill.rounds[3].verdict[1][1] · index.ts:162</sub>
- **Bill:** Mind her well, Captain. And stay away from those whiskey-swilling gamblers on the grand steamers. <sub>bill.rounds[3].verdict[1][2] · index.ts:162</sub>
- **The harbour master:** Here to pay your dock fee, I suppose? Thirty-seven dollars. A good deal of money. <sub>harbourTalk.rounds[1].deal[1] · index.ts:172</sub>
- *button* Pay <sub>harbourTalk.rounds[1].deal[1].replies[1].label · index.ts:174</sub>
- *button* Snag <sub>harbourTalk.rounds[1].deal[1].replies[2].label · index.ts:175</sub>
- **The harbour master:** Hrmpf. The River Code: can’t refuse that. But only five rounds, and whoever holds the bill after that settles it. Agreed? <sub>harbourTalk.rounds[1].deal[2] · index.ts:179</sub>
- *button* Pay <sub>harbourTalk.rounds[1].deal[2].replies[1].label · index.ts:183</sub>
- *button* Deal <sub>harbourTalk.rounds[1].deal[2].replies[2].label · index.ts:184</sub>
- **Willie:** It’s a fine day on the river, Captain! <sub>underway.rounds[1].deal[1].text[1] · index.ts:198</sub>
- **Willie:** Clear water up to the Tri-Cities, Mr. Klemm says, and not a single sn— <sub>underway.rounds[1].deal[1].text[2] · index.ts:198</sub>
- *button* Single what? <sub>underway.rounds[1].deal[1].replies[1].label · index.ts:199</sub>
- **Willie:** Snag! We are aground, Captain! <sub>underway.rounds[1].deal[2].text[1] · index.ts:202</sub>
- **Willie:** Stuck fast! <sub>underway.rounds[1].deal[2].text[2] · index.ts:202</sub>
- **Gus:** We have run aground on a sandbar, Captain. The engine alone can’t shift us, we need shovels and poles. <sub>underway.rounds[1].deal[3].text[1] · index.ts:207</sub>
- **Gus:** Pray that our strength outlasts the work, or we will spend the night right here. <sub>underway.rounds[1].deal[3].text[2] · index.ts:207</sub>
- *button* Next <sub>underway.rounds[1].deal[3].replies[1].label · index.ts:208</sub>
- **The harbour master:** Thirty-seven dollars, Captain. Pleasure doing business. <sub>harbourMaster.rounds[5].verdict[1] · index.ts:223</sub>
- **The harbour master:** Hrmpf. Mine to settle, then. Off with you. <sub>harbourMaster.rounds[5].verdict[2] · index.ts:224</sub>

### src/story/characters/sandy.ts


**SANDY**

- **Sandy:** Welcome to The Sandbar! I’ll be your bartender this evening. <sub>opening[1] · sandy.ts:37</sub>
- **Sandy:** Today’s specials: Paddle Split, Crankshaft with a Twist, and the Best Intentions, served on the Rocks. <sub>opening[2] · sandy.ts:37</sub>
- **Sandy:** Welcome back, Captain, have a seat. It’s five o’clock somewhere, I’m sure. <sub>mornings[1] · sandy.ts:38</sub>
- **Sandy:** Another round, Captain? <sub>rounds[1].text · sandy.ts:40</sub>
- *button* Leave <sub>rounds[1].answers[1].label · sandy.ts:40</sub>
- *comeback* **Sandy:** You wish. <sub>rounds[1].answers[1].comeback · sandy.ts:40</sub>
- *button* Deal <sub>rounds[1].answers[2].label · sandy.ts:40</sub>
- *comeback* **Sandy:** Shore thing. <sub>rounds[1].answers[2].comeback · sandy.ts:40</sub>
- **Sandy:** Pub quiz, Captain! <sub>rounds[2].text[1] · sandy.ts:41</sub>
- **Sandy:** Name a structure for retaining water. <sub>rounds[2].text[2] · sandy.ts:41</sub>
- *button* Well <sub>rounds[2].answers[1].label · sandy.ts:41</sub>
- *button* Dam <sub>rounds[2].answers[2].label · sandy.ts:41</sub>
- **Sandy:** Pub quiz, Captain! <sub>rounds[3].text[1] · sandy.ts:42</sub>
- **Sandy:** Name a common river sediment. <sub>rounds[3].text[2] · sandy.ts:42</sub>
- *button* Leaves <sub>rounds[3].answers[1].label · sandy.ts:42</sub>
- *button* Quartz <sub>rounds[3].answers[2].label · sandy.ts:42</sub>
- **Sandy:** Pub quiz, Captain! <sub>rounds[4].text[1] · sandy.ts:44</sub>
- **Sandy:** What do they raise along a river? <sub>rounds[4].text[2] · sandy.ts:44</sub>
- *button* Levy <sub>rounds[4].answers[1].label · sandy.ts:46</sub>
- *button* Levee <sub>rounds[4].answers[2].label · sandy.ts:46</sub>
- *button* I just want to leave. Please let me leave. <sub>rounds[4].answers[3].label · sandy.ts:46</sub>
- **Sandy:** A deuce drifts into a sandbar, orders a beer. <sub>quips[1][1] · sandy.ts:50</sub>
- **Sandy:** Says: “Put it on my bill.” <sub>quips[1][2] · sandy.ts:50</sub>
- **Sandy:** It wasn’t easy for me, growing up. <sub>quips[1] · sandy.ts:51</sub>
- **Sandy:** You see, my mother was a beach. <sub>quips[2][2] · sandy.ts:51</sub>
- **Sandy:** You are a very grounded person, Captain. <sub>quips[3] · sandy.ts:52</sub>
- **Sandy:** What’s your poison, Captain? We’ve got silt, and we’ve got grit. <sub>quips[4][1] · sandy.ts:53</sub>
- **Sandy:** Moonshine too, if you stick around. <sub>quips[4][2] · sandy.ts:53</sub>
- **Sandy:** This is a very fine sediment, Captain. <sub>quips[5] · sandy.ts:54</sub>
- **Sandy:** The nerve of some people! <sub>quips[6][1] · sandy.ts:55</sub>
- **Sandy:** Calling me shallow! <sub>quips[6][2] · sandy.ts:55</sub>
- **Sandy:** I aspire to be a Beach Club one day. <sub>quips[7] · sandy.ts:56</sub>
- **Sandy:** ♪ Sand and deliver! ♪ <sub>quips[8][1] · sandy.ts:57</sub>
- **Sandy:** ♪ Your money and your time! ♪ <sub>quips[8][2] · sandy.ts:57</sub>
- **Sandy:** I used to be a mountain, you know. <sub>quips[9][1] · sandy.ts:58</sub>
- **Sandy:** Erosion was a constant grind. <sub>quips[9][2] · sandy.ts:58</sub>
- **Sandy:** I hope you like the impression I made of your hull. <sub>quips[10][1] · sandy.ts:59</sub>
- **Sandy:** But wait until you see my work on the engine. <sub>quips[10][2] · sandy.ts:59</sub>
- **Sandy:** Do you know what the best thing about sand is? <sub>quips[11][1] · sandy.ts:60</sub>
- **Sandy:** Sand gets everywhere. <sub>quips[11][2] · sandy.ts:60</sub>
- **Sandy:** ♪ Do you like Piña Coladas? ♪ <sub>quips[12][1] · sandy.ts:61</sub>
- **Sandy:** ♪ And getting stuck on the river? ♪ <sub>quips[12][2] · sandy.ts:61</sub>
- **Sandy:** Last call! <sub>lastCall · sandy.ts:63</sub>
- **Sandy:** I’ll drift off downstream now… Catch you later, Captain! <sub>cleared · sandy.ts:64</sub>
- **Sandy:** I think you’ve had enough, Captain. You’re in no shape to navigate; better spend the night. <sub>beaten · sandy.ts:65</sub>

**sandbarTalk**

- **Sandy:** Going to sand pat, Captain? <sub>pat[1] · sandy.ts:88</sub>
- **Sandy:** Sand pat again? You’ll fit right in. <sub>pat[1] · sandy.ts:88</sub>
- **Sandy:** Sand pat again? You’ll fit right in. <sub>pat[1] · sandy.ts:88</sub>
- **Sandy:** You’re getting the hang of this. Do nothing. Nothing moves here. <sub>pat[1] · sandy.ts:88</sub>
- **Gus:** That’s our own sweat back, Captain, no more. What we lose, the river keeps. <sub>verdict[1][1].text · sandy.ts:92</sub>
- **Sandy:** Your first one’s on the house. So’s your boat. <sub>verdict[1][2] · sandy.ts:93</sub>
- **Willie:** She’s off, Captain! We’re floating! <sub>verdict[4].text · sandy.ts:98</sub>
- **Gus:** That’s all they have, Captain. There’s not another shove in them today. <sub>verdict[6].text · sandy.ts:100</sub>
- **Willie:** That’s the light gone. She won’t move tonight. <sub>verdict[7][1].text · sandy.ts:103</sub>
- **Willie:** That’s the light gone. She won’t move tonight. <sub>verdict[7][2].text · sandy.ts:104</sub>

### src/story/characters/debris.ts


**crateTalk**

- **Willie:** Crate in the water, Captain! Let’s fish it out. <sub>deal[1] · debris.ts:88</sub>
- **Willie:** Salvaged goods, worth ${worth} at the Mercantile. <sub>verdict[1] · debris.ts:90</sub>
- **Gus:** It’s just soggy cotton, boys. <sub>verdict[2] · debris.ts:91</sub>

**SIGHTED**

- Sawyer off the bow, Captain! She’ll need watching. <sub>sawyer · debris.ts:98</sub>
- Deadhead, Captain! Just under the water, there. <sub>deadhead · debris.ts:99</sub>
- Drift pile, dead ahead! Mind the wheel, Captain. <sub>driftPile · debris.ts:100</sub>

**hazardTalk**

- **Gus:** That’s {snag}, Captain. We’ll live. <sub>verdict[1] · debris.ts:110</sub>
- **Willie:** Clear of it, Captain! Not a scratch. <sub>verdict[1] · debris.ts:110</sub>

**debrisRecord**

- Salvaged goods, worth ${worth} at the Mercantile. <sub> · debris.ts:122</sub>
- Fished out a crate. Soggy cotton. <sub> · debris.ts:122</sub>
- Struck a {what}: {snag}. <sub> · debris.ts:124</sub>
- Steered clear of a {what}. <sub> · debris.ts:124</sub>

### src/story/log.ts


**ENCOUNTER_RECORDS**

- Off The Sandbar at last. All hands sore. <sub>sandbar.solved · log.ts:9</sub>
- Aground on The Sandbar. We stay the night. <sub>sandbar.failed · log.ts:9</sub>
- Cards on deck by lantern light. Repairs seen to. <sub>deck.solved · log.ts:10</sub>
- Anchored downstream of the dock. Went ashore for news. <sub>deckIntel.solved · log.ts:11</sub>
- Cards with the strikers at the coal depot. <sub>depot.solved · log.ts:12</sub>
- An evening at the Bettendorf saloon. <sub>triCities.solved · log.ts:13</sub>

**castOffRecord**

- Cast off from {place}, {bound}. <sub> · log.ts:17</sub>

**UNDER_WAY_AGAIN**

- Under way again. <sub> · log.ts:18</sub>

**LEAVING_MUSCATINE**

- The first day of spring is what some folks call the day the ice lets go of the river. <sub>opening · log.ts:32</sub>
- Cargo run for Dubuque, {MUSCATINE_TO_DUBUQUE} miles upriver. <sub>turning[1] · log.ts:33</sub>
- Strong spring-thaw current, four miles an hour. <sub>turning[2] · log.ts:33</sub>

**FIRST_CRATE**

- Fished a crate of clothes-pegs out of the river. <sub>found[1] · log.ts:52</sub>
- A gross of corncob pipes. Gus grabbed a handful. <sub>found[2] · log.ts:53</sub>
- Two dozen horseshoes. I hope they bring luck. <sub>found[3] · log.ts:54</sub>
- A crate of bicycle bells. <sub>found[4] · log.ts:55</sub>
- Seed packets, dry in their tins. Labels sloughed off. <sub>found[5] · log.ts:56</sub>
- Fished out a crate of doorknobs. Now all we need is some doors. <sub>found[6] · log.ts:57</sub>
- A crate of horehound candy, a little stuck together. Taste still sweet. <sub>found[7] · log.ts:58</sub>
- Peg salvage <sub>marks[1] · log.ts:61</sub>
- Pipe salvage <sub>marks[2] · log.ts:61</sub>
- Horseshoe salvage <sub>marks[3] · log.ts:61</sub>
- Bell salvage <sub>marks[4] · log.ts:61</sub>
- Seed salvage <sub>marks[5] · log.ts:61</sub>
- Doorknob salvage <sub>marks[6] · log.ts:61</sub>
- Candy salvage <sub>marks[7] · log.ts:61</sub>
- Lost the first salvage crate. We’ll never know what’s in it. <sub>lost[1] · log.ts:63</sub>
- Had to let go of the first salvage. River wouldn’t let go. <sub>lost[2] · log.ts:64</sub>
- The river kept our first salvage. I hope it is not a sign. <sub>lost[3] · log.ts:65</sub>

**SMOOTH_RUN**

- I hope this will be a smooth run. <sub>[1] · log.ts:70</sub>
- Pick up some prime salvage <sub>[2] · log.ts:70</sub>
- Make good money on the haul <sub>[3] · log.ts:70</sub>
- And not leave it all at tables along the way <sub>[4] · log.ts:70</sub>

**firstCrateRecord**

- {line}  
> Worth ${worth} at the Mercantile. <sub> · log.ts:76</sub>

**CHART_MARKS**

- Salvage <sub>salvage · log.ts:84</sub>
- Soggy cotton <sub>soggy · log.ts:85</sub>
- Lost a crate <sub>lostFirst · log.ts:86</sub>
- Aground <sub>aground · log.ts:87</sub>
- Hit a sawyer <sub>hazard.sawyer.struck · log.ts:89</sub>
- Hit a deadhead <sub>hazard.deadhead.struck · log.ts:90</sub>
- Hit a drift pile <sub>hazard.driftPile.struck · log.ts:91</sub>

**CHOICE_RECORDS**

- Struck a sandbar, a few miles below the Tri-Cities. <sub>aground · log.ts:110</sub>

**islandRecord**

- Kept to {way} of {island}. <sub> · log.ts:114</sub>

**tradeRecord**

- Sold {name}, ${price}. <sub> · log.ts:117</sub>
- Bought {name}, ${price}. <sub> · log.ts:117</sub>

## The Tri-Cities

### src/story/chapters/02_triCities/index.ts


**salvageCamp**

- You tie up below the Moline chain, where the river hands back what the rapids took off the boats that tried them. <sub>[1].lines[1].text · index.ts:37</sub>
- **Gus:** Not a shovel of coal, Captain. Just patience and a boat hook. <sub>[1].lines[2].text · index.ts:38</sub>
- camp:{mornings}:{time}:{i} <sub>[2] · index.ts:41</sub>

**triCities**

- **Willie:** At these coal prices the mail runs don’t pay, Captain. <sub>advice.text · index.ts:47</sub>
- **Gus:** {snag} wants seeing to, Captain. A night at anchor would do it. <sub>advice.text · index.ts:50</sub>
- **Willie:** We’re near broke, Captain. I could wade ashore and ask around. <sub>advice.text · index.ts:51</sub>
- **Gus:** She’ll want a full bunker for the rapids, Captain. <sub>advice.text · index.ts:52</sub>
- **Willie:** They’ll bet on anything in Bettendorf, Captain. Even on which it’ll be, three or four. <sub>advice.text · index.ts:53</sub>
- You anchor downstream of the dock, where it’s free. Willie wades ashore, looking for work and gossip. <sub>options[1].steps[1].lines[1].text · index.ts:61</sub>
- **Gus:** An overhaul gets twice the work from the same coal, Captain. <sub>options[2].steps[1].advice[1].text · index.ts:74</sub>
- Done <sub>options[2].steps[1].leave · index.ts:77</sub>
- You herd a timber raft off the bridge piers all day. The raft is bigger than the boat. <sub>options[8].menu[1] · index.ts:92</sub>
- You ferry a herd of cattle across the river, and spend the rest of the day swabbing the deck. <sub>options[8].menu[2] · index.ts:93</sub>
- You run the mail to Moline and back, and Gus counts every shovel. <sub>options[8].menu[3] · index.ts:94</sub>

### src/story/chapters/02_triCities/depot.ts


**CHEST_UP**

- More for the strike chest! That should last us another day or two. <sub>[1] · depot.ts:40</sub>
- That’s the week’s bread and beans. Much obliged, Captain. <sub>[2] · depot.ts:40</sub>
- The union thanks you, Captain. <sub>[3] · depot.ts:40</sub>

**CHEST_DOWN**

- Plenty more where that came from. Union sends it up by the sack. <sub>[1] · depot.ts:41</sub>
- Take it, take it. It’s only the strike chest. <sub>[2] · depot.ts:41</sub>
- Easy come, Captain. Tuesday’s post brings more. <sub>[3] · depot.ts:41</sub>

**RIVER_LIFE**

- **The foreman:** You load sixteen tons, and what do you get? <sub>[1].text · depot.ts:43</sub>
- **Rourke:** How do I look, Captain? <sub>[2].text · depot.ts:45</sub>
- *button* Good <sub>[2].replies[1].label · depot.ts:45</sub>
- *button* Striking <sub>[2].replies[2].label · depot.ts:45</sub>
- **The foreman:** Bill still cheat at patience? <sub>[3].text · depot.ts:46</sub>
- **Rourke:** Coal’s dear upriver, I hear. <sub>[4].text · depot.ts:47</sub>

**FOLDED**

- Folding, Cap’n? You wouldn’t be… letting us win, now would you? <sub> · depot.ts:49</sub>

**sorted**

- I’ll sort out {snag}, Captain. Got nothing better to do. <sub>text · depot.ts:55</sub>

**depotTalk**

- **The foreman:** Funny thing, Captain. Some sacks have fallen off the heap, down by your boat. Nobody’s counted those. <sub>verdict[1] · depot.ts:61</sub>
- **The foreman:** Good game, Captain. Any time. We’re not going anywhere. <sub>verdict[1] · depot.ts:63</sub>
- **The foreman:** Good game, Captain. Come by any time. We’re not going anywhere. <sub>verdict[1] · depot.ts:63</sub>

**depotTalks**

- **The foreman:** Welcome back, Captain. Strike’s still on. Fancy a game to pass the time? <sub>depotTalk.deal[1] · depot.ts:79</sub>
- *button* Leave <sub>depotTalk.deal[1].replies[1].label · depot.ts:81</sub>
- *button* Snag? <sub>depotTalk.deal[1].replies[2].label · depot.ts:82</sub>
- **The foreman:** Been a while! Ain’t seen the Best Intentions since last summer. Where’s Bill? <sub>depotTalk.deal[1] · depot.ts:87</sub>
- *button* Family <sub>depotTalk.deal[1].replies[1].label · depot.ts:87</sub>
- **You:** Family business. <sub>depotTalk.deal[2] · depot.ts:88</sub>
- **The foreman:** Left you in charge, did he? Wise man. Alas, ain’t got no coal to sell you. Strike’s on, see. <sub>depotTalk.deal[3] · depot.ts:90</sub>
- *button* Leave <sub>depotTalk.deal[3].replies[1].label · depot.ts:92</sub>
- *button* Snag? <sub>depotTalk.deal[3].replies[2].label · depot.ts:93</sub>
- **The foreman:** Can’t say no to a friendly game to pass the time, right, fellas? Nothing much else to do around here, with this striking business. <sub>depotTalk.deal[4] · depot.ts:97</sub>
- *button* Deal <sub>depotTalk.deal[4].replies[1].label · depot.ts:100</sub>

### src/story/chapters/02_triCities/bettendorf.ts


**saloon**

- The crew stay aboard, playing Snag for buttons while Lars sings. <sub>[2].lines[1].text · bettendorf.ts:32</sub>

**breakfast**

- You treat the crew to breakfast at the Bettendorf saloon. Lars has two. <sub>[1].lines[1].text · bettendorf.ts:38</sub>

**ODDS**

- Two to one you swap. <sub>[1] · bettendorf.ts:54</sub>
- Evens the River’s red. <sub>[2] · bettendorf.ts:54</sub>
- Eleven to four on rain. <sub>[3] · bettendorf.ts:54</sub>
- Six to four the cat jumps left. <sub>[4] · bettendorf.ts:54</sub>
- Five to one that boat of yours floats. <sub>[5] · bettendorf.ts:54</sub>
- I’ve got a dollar on Finlay. Don’t tell Finlay. <sub>[6] · bettendorf.ts:54</sub>

**triCitiesTalk**

- **Tripp:** Back again, Captain? Same house rule: three of a kind takes it. <sub>deal[1][1] · bettendorf.ts:64</sub>
- **Willie:** Here we are, at Bettendorf. They’re batty about betting here, Captain. <sub>deal[1] · bettendorf.ts:72</sub>
- **Tripp:** House rule: we play till somebody wins with three of a kind. Three cities, three of a kind. <sub>deal[2] · bettendorf.ts:73</sub>
- *button* Three? <sub>deal[2].replies[1].label · bettendorf.ts:73</sub>
- **You:** I counted four cities on the way in. <sub>deal[3] · bettendorf.ts:74</sub>
- **Odds:** Four, if you ask Bettendorf. Bettendorf says hold out for four of a kind. <sub>deal[4][1] · bettendorf.ts:75</sub>
- **Odds:** Three to one they win the argument by summer. <sub>deal[4][2] · bettendorf.ts:75</sub>
- **Lenny King:** ♪ Everybody knows that the thaw is flowing, everybody knows that the river’s strong ♪ <sub>flop[1].text · bettendorf.ts:80</sub>
- **Tripp:** Three of a kind wins the game. That settles it for tonight. <sub>verdict[1] · bettendorf.ts:83</sub>
- **Tripp:** No three of a kind tonight. We’ll call it a draw, and argue about it tomorrow. <sub>verdict[1] · bettendorf.ts:85</sub>

### src/story/characters/gaylord.ts


**quarrel**

- **Ellie:** You again, Mr. Montague. <sub>[1] · gaylord.ts:16</sub>
- **Gaylord:** A different captain, Miss Sawyer. I merely sit in his chair. <sub>[2] · gaylord.ts:17</sub>
- **Ellie:** Where is he, then? <sub>[3] · gaylord.ts:18</sub>
- **Gaylord:** At breakfast. He has every confidence in me. <sub>[4] · gaylord.ts:19</sub>
- **Ellie:** One more hand of this, Montague, and you’ll be swimming to St. Louis. <sub>[1] · gaylord.ts:23</sub>
- **Gaylord:** River Code, Miss Sawyer. It’s silent on the matter of representation. <sub>[2] · gaylord.ts:24</sub>
- **Ellie:** It’s silent on the matter of drowning, too. <sub>[3] · gaylord.ts:25</sub>
- **Ellie:** That’s enough. You’re finished at this table. <sub>[1] · gaylord.ts:29</sub>
- **Gaylord:** I signed those captains in good faith, Miss Sawyer. Their companies have lawyers. <sub>[2] · gaylord.ts:30</sub>
- **Ellie:** How many more contracts have you signed? <sub>[3] · gaylord.ts:31</sub>
- **Gaylord:** Three more. <sub>[4] · gaylord.ts:32</sub>
- **Ellie:** This week only. Bring me a new client next week and the game is bingo. <sub>[5][1] · gaylord.ts:33</sub>
- **Ellie:** The Code says game, Montague. It doesn’t say Snag. My auntie in Cordova is a cracking bingoist. <sub>[5][2] · gaylord.ts:33</sub>
- **Gaylord:** …This week only. <sub>[6] · gaylord.ts:34</sub>
- **Ellie:** Last one, Montague. <sub>[1] · gaylord.ts:38</sub>
- **Gaylord:** And a pleasure, as ever. <sub>[2] · gaylord.ts:38</sub>
- **Ellie:** I’ve told my auntie to stand down. <sub>[3] · gaylord.ts:38</sub>
- **Ellie:** {day} more, Montague. <sub>[1] · gaylord.ts:39</sub>
- **Gaylord:** I can count, Miss Sawyer. It’s rather the point of me. <sub>[2] · gaylord.ts:39</sub>
- **Ellie:** Captains only, today. Just how I like it. Anyone for bingo? No? Good. <sub>[1] · gaylord.ts:40</sub>

**pass**

- *button* Good day <sub>label · gaylord.ts:47</sub>

**breakfastTalk**

- **Gaylord:** I’m all but booked this week, Captain: I’ve the last day left, and no other. <sub>deal[1][1] · gaylord.ts:54</sub>
- **Gaylord:** Ten dollars covers my breakfast, my room and the morning’s entry. The winnings are mine; the boat up the rapids is yours. Watch and learn. <sub>deal[1][2] · gaylord.ts:54</sub>
- *button* Done <sub>deal[1].replies[2].label · gaylord.ts:55</sub>
- **Gaylord:** Fearless and audacious. I do see myself in you, Captain. <sub>deal[1][1] · gaylord.ts:63</sub>
- **Gaylord:** {LOAN} dollars now, twice that back in two weeks. Should a third week begin, twice that again. <sub>deal[1][2] · gaylord.ts:63</sub>
- *button* Done <sub>deal[1].replies[2].label · gaylord.ts:64</sub>
- **Gaylord:** The eggs are adequate, Captain. Good morning. <sub>deal[1] · gaylord.ts:68</sub>

**SHOPTALK**

- Never fall in love with a pair, Captain. <sub>flop[1] · gaylord.ts:73</sub>
- Note who stands pat. It’s the only honest thing a man does at this table. <sub>flop[2] · gaylord.ts:73</sub>
- I don’t play the cards, I play the price of the cards. <sub>flop[3] · gaylord.ts:73</sub>
- Now we see who came to play and who came to pay. <sub>turn[1] · gaylord.ts:74</sub>
- A fee to see the River. Cheap, for what it tells me. <sub>turn[2] · gaylord.ts:74</sub>
- Patience, now. Patience is an edge that doesn’t wear dull. <sub>turn[3] · gaylord.ts:74</sub>
- Lay it down gently. You want them to think you’re sorry. <sub>river[1] · gaylord.ts:75</sub>
- There. Never show more than you must. <sub>river[2] · gaylord.ts:75</sub>
- The best hand is the one they believe. <sub>river[3] · gaylord.ts:75</sub>

**hiredTalk**

- **Gaylord:** Here to watch and learn, I see. Well, wish me luck. <sub>deal[1] · gaylord.ts:80</sub>
- **Ellie:** Can’t be bothered to play your own seat, Captain? Lovely. <sub>deal[2] · gaylord.ts:80</sub>

**gaylordAtTheSaloon**

- **Gaylord:** Still afloat, Captain? Somebody must be playing your hand for you. <sub>[1] · gaylord.ts:91</sub>
- **Gaylord:** Captain. Breakfast is still served, and I am still at it. <sub>[1] · gaylord.ts:92</sub>
- **Gaylord:** Gaylord Montague, Esquire, Captain. I play at Davenport of a noon, on behalf of those who’d rather not. You’ll find me at breakfast. <sub>[1] · gaylord.ts:94</sub>
- **Gaylord:** Bingo, Captain. She said bingo. To me. <sub>[1] · gaylord.ts:95</sub>
- **Gaylord:** You missed a fine week at Davenport. She threatened me with her aunt, you know. <sub>[1][1] · gaylord.ts:97</sub>
- **Gaylord:** A cracking bingoist, I’m told. I shan’t be going back. <sub>[1][2] · gaylord.ts:97</sub>
- **Gaylord:** My clients? Pitiful men, lacking the skill and courage even to lose convincingly at poker. Bah, good riddance. <sub>[1] · gaylord.ts:98</sub>
- **Gaylord:** They’ll come back down past here soon enough, and then I will fleece them again, and they deserve it, the parasites. <sub>[2][2] · gaylord.ts:98</sub>

## The crew, aboard (the deck game, advice, chatter)

### src/story/characters/crew.ts


**deckLines**

- The wick burns low and gutters. <sub>closers[1][1].text · crew.ts:20</sub>
- Kerosene is in short supply. <sub>closers[1].text · crew.ts:21</sub>
- The moon is out and very pretty. After cards, you watch it for a while as Lars sings. <sub>closers[3][1].text · crew.ts:22</sub>
- The river speaks to you, of faraway places it has visited and soon will visit again. <sub>closers[4][1].text · crew.ts:23</sub>
- The lantern goes out. You hear a frog complaining about the weather. <sub>closers[5][1].text · crew.ts:24</sub>
- It’s a rainy night, and the roof has a leak. Should fix that in the morning. <sub>closers[6][1].text · crew.ts:25</sub>

**stuckNight**

- Supper on deck, and the lantern lit. <sub>[1].lines[1].text · crew.ts:30</sub>

**NAGS**

- **Gus:** A boiler overhaul would get us the steam for the rapids, Captain. <sub>[1].text · crew.ts:34</sub>
- **Willie:** Beans again, Captain. I’m sorry. I’m no real cook, and there’s no stove. <sub>[2].text · crew.ts:35</sub>
- **Gus:** One fireman won’t get us up the rapids, Captain. <sub>[3].text · crew.ts:36</sub>
- **Gus:** A real cook in a real galley would double our strength, Captain. No offence to the boy’s beans. <sub>[4].text · crew.ts:37</sub>
- **Gus:** We should upgrade the boiler before even thinking about those rapids, Captain. <sub>[5].text · crew.ts:38</sub>

**deckQuips**

- **Gus:** Old Hildegard doesn’t care for sand, Captain. Not one bit. <sub>[1] · crew.ts:49</sub>
- **Willie:** Beans again tomorrow, Captain! Cold beans. <sub>[2] · crew.ts:50</sub>
- **Lars:** Sjekk. <sub>[3] · crew.ts:51</sub>
- **Gus:** She’s a good boat. Don’t tell her I said so. <sub>[4] · crew.ts:52</sub>
- **Willie:** I think he liked us, Captain. Sandy. <sub>[5] · crew.ts:53</sub>
- **Willie:** The Mathilda Belle tried the rapids without a pilot, Captain. Came back down by evening, all washed up, cargo lost. <sub>[6] · crew.ts:54</sub>
- **Willie:** So did the Thierry Belle. She’s back in the queue at Davenport. <sub>[7] · crew.ts:55</sub>
- **Gus:** Too early on the thaw to go up. Everyone says so. I say so. <sub>[8] · crew.ts:56</sub>
- **Lars:** Fåld. <sub>[9] · crew.ts:57</sub>

**FIXING**

- I think I can fix {snag}, Captain. <sub>gus · crew.ts:62</sub>
- Ja. Fiks. <sub>lars · crew.ts:63</sub>
- Leave that one with me, Captain! <sub>willie · crew.ts:64</sub>

**PASSING**

- {snag}? Not my trade. {fixer}? <sub>gus · crew.ts:69</sub>
- Nei. <sub>lars · crew.ts:70</sub>
- {snag}? That’s one for {fixer}, Captain. <sub>willie · crew.ts:71</sub>
- Union says that’s {fixer}’s job. <sub>fireman · crew.ts:72</sub>

**deckTalk**

- **Gus:** Anything broken, Captain, lay it on the table. We’ll see to it. <sub>deal[1].text · crew.ts:79</sub>

**fixing**

- Leave it with me, Captain. <sub>text · crew.ts:84</sub>

**deckTalk**

- Not mine, Captain. <sub>verdict[1].text · crew.ts:86</sub>

**GOSSIP**

- Coal’s fetching eight dollars a load at the Mercantile, Captain, and they’re still buying. Funny, how the strikers’ heap keeps losing sacks. <sub>[1].text · crew.ts:100</sub>
- Rourke says the strike chest is running low. Any captain who loses a dozen dollars at their table is a friend of the union, he says. He winked, Captain. Twice. <sub>[2].text · crew.ts:105</sub>
- They say the house always wins in Bettendorf, Captain. I think they mean Odds. <sub>[3].text · crew.ts:109</sub>
- The captains who win at Davenport hardly swap a card when the table’s full, Captain. They just sit there looking stubborn, and let the others throw their money about. <sub>[4].text · crew.ts:114</sub>
- Every boat that tries the rapids and doesn’t make it comes down lighter, Captain. Folks camp below the Moline chain and fish out whatever floats by. <sub>[5].text · crew.ts:118</sub>
- The Mercantile has a boiler overhaul for forty dollars, Captain. Gus has been to look at it three times. He thinks I didn’t notice. <sub>[6].text · crew.ts:122</sub>

**deckIntelTalk**

- **Willie:** There’s work ashore, too: a timber raft to herd off the bridge piers, cattle to ferry across, the mail to Moline, and salvage below the rapids, for anyone with a boat hook. <sub>deal[2] · crew.ts:140</sub>
- **Gus:** Anything broken, Captain, lay it on the table. We’ll see to it. <sub>deal[3] · crew.ts:141</sub>
- **Willie:** I asked around, Captain. There’s one pilot for the rapids this early: Ellie Sawyer, out of Cordova. One boat a day. <sub>deal[1] · crew.ts:148</sub>
- *button* One? <sub>deal[1].replies[1].label · crew.ts:148</sub>
- **You:** One boat? With half the river lined up at Davenport? <sub>deal[2] · crew.ts:149</sub>
- **Willie:** They play for it, Captain. Snag, of course. Five dollars in the morning, and the winners sit down with her at noon. <sub>deal[3] · crew.ts:150</sub>
- **Gus:** Anything broken, Captain, lay it on the table. We’ll see to it. <sub>deal[4] · crew.ts:151</sub>

## Davenport, the rapids, LeClaire

### src/story/chapters/03_rapids/index.ts


**sweptBack**

- The bunker’s empty. The river takes the Best Intentions, and hands her back at Davenport. <sub>[1].lines[1].text · index.ts:30</sub>
- **Ellie:** Nobody gets it every time, Captain. Same time tomorrow. <sub>[1].lines[2].text · index.ts:31</sub>
- **Gus:** We’ll do better next time, Captain. <sub>[1].lines[3].text · index.ts:32</sub>

**turnedBack**

- **Ellie:** Good. That’s the first sensible thing anyone’s said on this river. Back of the queue, Captain. <sub>[1].lines[1].text · index.ts:43</sub>
- **Gus:** We kept the coal, Captain. That counts. <sub>[1].lines[2].text · index.ts:44</sub>

**tournament**

- **Ellie:** That’s you, Captain. Get your hat. <sub>[3].solved[1].text · index.ts:103</sub>
- **Ellie:** Not today, Captain. Same time tomorrow. <sub>[3].failed[1].text · index.ts:104</sub>
- Hampton. Deep water close in to the shore, and the only breath you’ll get. <sub>[6].lines[1].text · index.ts:109</sub>
- **Ellie:** St. Louis chain, Cabin chain, Sycamore, Smith’s. They don’t stop, Captain, so don’t you. <sub>[6].lines[2].text · index.ts:109</sub>

**morningTalk**

- **Willie:** Five dollars in, Captain. Last one with money sits down with Ellie at noon. <sub>deal[1] · index.ts:127</sub>

**intro**

- **Ellie:** Ellie Sawyer, out of Cordova. I take one boat up the rapids today. <sub>[1][1] · index.ts:131</sub>
- **Ellie:** Whoever wins this table. Or if I win it myself, the runner-up. <sub>[1][2] · index.ts:131</sub>
- **Willie:** They say you’re crazy, taking boats up on the thaw. <sub>[2] · index.ts:131</sub>
- **Ellie:** Crazy is going up without me. <sub>[3] · index.ts:131</sub>

**climbLines**

- **Ellie:** Mr. Klemm, every pound of steam you have. Captain, do as I say and nothing else. <sub>molineChain.first[1] · index.ts:138</sub>
- **Gus:** Every push burns a load, Captain. We’ve six. There’s no more where they came from. <sub>molineChain.first[2] · index.ts:138</sub>
- Jackstaff on the white house. Hold her there. <sub>molineChain.marks[1] · index.ts:139</sub>
- That’s Brazil Rock. She was a good boat, the Brazil. <sub>molineChain.marks[2] · index.ts:139</sub>
- Mason’s Rock to port. Don’t look at it. <sub>molineChain.marks[3] · index.ts:139</sub>
- Duck Creek chain. The War Eagle sat here a week. <sub>molineChain.marks[4] · index.ts:139</sub>
- That’s the Moline chain, Captain. That was the easy one. <sub>molineChain.cleared · index.ts:140</sub>
- **Ellie:** Campbell’s chain. The Danube, the Louisville, the Little Eagle. Standing wave off the head of the island. <sub>campbellsChain.first[1] · index.ts:143</sub>
- Take the wave on the bow. On the bow! <sub>campbellsChain.marks[1] · index.ts:144</sub>
- Hold her. Hold her. Now. <sub>campbellsChain.marks[2] · index.ts:144</sub>
- The Danube’s down there, somewhere. <sub>campbellsChain.marks[3] · index.ts:144</sub>
- Next mark’s the church. If you can see it. <sub>campbellsChain.marks[4] · index.ts:144</sub>
- Campbell’s is behind us. Tell your man to breathe. <sub>campbellsChain.cleared · index.ts:145</sub>
- **Ellie:** Get a line ashore to the ring. Capstan, every hand. We’ll haul her up if we can’t steam her. <sub>longReach.first[1] · index.ts:148</sub>
- St. Louis chain. The St. Louis was the dearest loss on the river. <sub>longReach.marks[1] · index.ts:149</sub>
- Cabin chain! Mind the Mary C.! <sub>longReach.marks[2] · index.ts:149</sub>
- Sycamore. Limestone. It doesn’t give. <sub>longReach.marks[3] · index.ts:149</sub>
- Smith’s. Nearly. Don’t you dare. <sub>longReach.marks[4] · index.ts:149</sub>
- That’s the top. That’s LeClaire. You can breathe, Captain. <sub>longReach.cleared · index.ts:150</sub>

**warned**

- **Gus:** She hasn’t the strength for this, Captain. <sub>[1] · index.ts:159</sub>
- *button* Full steam <sub>[1].replies[1].label · index.ts:159</sub>
- **You:** Just give me all she’s got, Mr. Klemm. <sub>[2] · index.ts:159</sub>
- **Gus:** It does not work like that, Captain. <sub>[3] · index.ts:159</sub>

**spent**

- That’s a load gone, Captain. {coal} left. <sub> · index.ts:163</sub>
- That’s the last of the coal, Captain. <sub> · index.ts:163</sub>

**pushReading**

- **Gus:** She barely felt that, Captain. <sub>text · index.ts:181</sub>
- **Gus:** We dented her, Captain. A quarter, no more. <sub>text · index.ts:183</sub>
- **Gus:** Half of her, Captain. It wasn’t enough. <sub>text · index.ts:185</sub>
- **Gus:** Nearly, Captain. Another push like that… <sub>text · index.ts:186</sub>

**leClaire**

- *caption title* To be continued <sub>[1].title · index.ts:200</sub>

## The tutorial (League mode)

### src/story/chapters/00_tutorial/tutorial.ts


**AFTER**

- Cleaned out by a deckhand. <sub>[1].text[1] · tutorial.ts:150</sub>
- And I do hold a grudging respect for you, it seems. Well done. <sub>[1].text[2] · tutorial.ts:150</sub>
- *button* Deckhand? <sub>[1].replies[1].label · tutorial.ts:151</sub>
- *button* Again? <sub>[1].replies[2].label · tutorial.ts:151</sub>
- *button* Thank you, ma’am <sub>[1].replies[3].label · tutorial.ts:151</sub>
- Cleaned out by a deckhand. <sub>[2].text[1] · tutorial.ts:158</sub>
- Yet your snag remains with you. <sub>[2].text[2] · tutorial.ts:158</sub>
- *button* Deckhand? <sub>[2].replies[1].label · tutorial.ts:159</sub>
- *button* Again? <sub>[2].replies[2].label · tutorial.ts:159</sub>
- *button* Thank you, ma’am <sub>[2].replies[3].label · tutorial.ts:159</sub>
- You are out of buttons. <sub>[3].text[1] · tutorial.ts:166</sub>
- But I do find myself holding a grudging respect for you. <sub>[3].text[2] · tutorial.ts:166</sub>
- *button* Again? <sub>[3].replies[1].label · tutorial.ts:167</sub>
- *button* Thank you, ma’am <sub>[3].replies[2].label · tutorial.ts:167</sub>
- You are out of buttons. <sub>[4].text[1] · tutorial.ts:175</sub>
- And your snag remains with you. <sub>[4].text[2] · tutorial.ts:175</sub>
- *button* Again? <sub>[4].replies[1].label · tutorial.ts:176</sub>
- *button* Thank you, ma’am <sub>[4].replies[2].label · tutorial.ts:176</sub>
- **You:** First mate, actually. <sub>[5].text · tutorial.ts:179</sub>
- I stand corrected. <sub>[6].text[1] · tutorial.ts:184</sub>
- Cleaned out all the same. <sub>[6].text[2] · tutorial.ts:184</sub>
- *button* Again? <sub>[6].replies[1].label · tutorial.ts:185</sub>
- *button* Thank you, ma’am <sub>[6].replies[2].label · tutorial.ts:185</sub>
- Now you know what Snag Poker is. <sub>[7].text[1] · tutorial.ts:191</sub>
- Do you swear never to play this game for money? <sub>[7].text[2] · tutorial.ts:191</sub>
- *button* I swear <sub>[7].replies[1].label · tutorial.ts:192</sub>
- *button* Yes. I do. <sub>[7].replies[2].label · tutorial.ts:192</sub>
- Buttons are not money. <sub>[8].text[1] · tutorial.ts:200</sub>
- My oath is quite safe. Deal. <sub>[8].text[2] · tutorial.ts:200</sub>
- *button* Deal <sub>[8].replies[1].label · tutorial.ts:201</sub>

**SNAGS**

- And that’s how you dodge snags: you win, or you fold wisely. <sub>[1].text · tutorial.ts:210</sub>
- *button* Snag? <sub>[1].replies[1].label · tutorial.ts:211</sub>
- Ah yes, snags. We’d need some stakes for that. Here, have some buttons, so we have something for the pot. <sub>[2].text · tutorial.ts:216</sub>
- *button* Buttons? <sub>[2].replies[1].label · tutorial.ts:217</sub>
- You should NEVER play for money! <sub>[3].text · tutorial.ts:222</sub>
- *button* Yes, ma’am <sub>[3].replies[1].label · tutorial.ts:223</sub>

**tutorialScript**

- You, there! <sub>rounds[1].deal[1].text[1] · tutorial.ts:234</sub>
- Have you seen my lout of a husband? <sub>rounds[1].deal[1].text[2] · tutorial.ts:234</sub>
- *button* Lout? <sub>rounds[1].deal[1].replies[1].label · tutorial.ts:235</sub>
- *button* Who? <sub>rounds[1].deal[1].replies[2].label · tutorial.ts:235</sub>
- Finlay by name, good‑for‑nothing by nature. <sub>rounds[1].deal[2].text[1] · tutorial.ts:241</sub>
- Always sneaking off to play Snag Poker. <sub>rounds[1].deal[2].text[2] · tutorial.ts:241</sub>
- *button* Snag? <sub>rounds[1].deal[2].replies[1].label · tutorial.ts:243</sub>
- *button* Poker? <sub>rounds[1].deal[2].replies[2].label · tutorial.ts:243</sub>
- A vile game!  
> Fit for drunkards, and liars… <sub>rounds[1].deal[3].text[1] · tutorial.ts:249</sub>
- … do you not know it? <sub>rounds[1].deal[3].text[2] · tutorial.ts:249</sub>
- *button* No, ma’am <sub>rounds[1].deal[3].replies[1].label · tutorial.ts:250</sub>
- Well. We can’t have that. <sub>rounds[1].deal[4].text[1] · tutorial.ts:256</sub>
- I’ll show you. <sub>rounds[1].deal[4].text[2] · tutorial.ts:256</sub>
- Three cards each, and three in the middle. <sub>rounds[1].flop[1].text[1] · tutorial.ts:267</sub>
- This is The Flop. <sub>rounds[1].flop[1].text[2] · tutorial.ts:267</sub>
- *button* Flop? <sub>rounds[1].flop[1].replies[1].label · tutorial.ts:269</sub>
- Since you are learning, I’ll show you my cards from the start. <sub>rounds[1].flop[2].text[1] · tutorial.ts:277</sub>
- See what I have? <sub>rounds[1].flop[2].text[2] · tutorial.ts:277</sub>
- *button* Aces! <sub>rounds[1].flop[2].replies[1].label · tutorial.ts:278</sub>
- Indeed. Let me see your cards… ah. <sub>rounds[1].flop[3].text[1] · tutorial.ts:285</sub>
- My aces beat your ladies.  
> So how can you make your hand stronger? <sub>rounds[1].flop[3].text[2] · tutorial.ts:285</sub>
- *button* Swap? <sub>rounds[1].flop[3].replies[1].label · tutorial.ts:286</sub>
- Not yet. Keep what you have, and see what comes. <sub>rounds[1].flop[4].text · tutorial.ts:292</sub>
- A fourth card arrives. <sub>rounds[1].turn[1].text[1] · tutorial.ts:302</sub>
- This is The Turn. <sub>rounds[1].turn[1].text[2] · tutorial.ts:302</sub>
- *button* Turn? <sub>rounds[1].turn[1].replies[1].label · tutorial.ts:303</sub>
- This is where the game is won and lost: the point of no return. <sub>rounds[1].turn[2].text · tutorial.ts:309</sub>
- *button* …lost? <sub>rounds[1].turn[2].replies[1].label · tutorial.ts:310</sub>
- Not lost, not yet. Now you swap. <sub>rounds[1].turn[3].text[1] · tutorial.ts:317</sub>
- Ditch the boys, keep the queen. <sub>rounds[1].turn[3].text[2] · tutorial.ts:317</sub>
- *button* Both? <sub>rounds[1].turn[3].replies[1].label · tutorial.ts:318</sub>
- Both. <sub>rounds[1].turn[4].text · tutorial.ts:322</sub>
- **You:** Bah. Only number cards. <sub>rounds[1].river[1].text · tutorial.ts:326</sub>
- Numbers win battles, not kings and queens. <sub>rounds[1].river[2].text[1] · tutorial.ts:331</sub>
- Look at the ducks. <sub>rounds[1].river[2].text[2] · tutorial.ts:331</sub>
- *button* Ducks? <sub>rounds[1].river[2].replies[1].label · tutorial.ts:332</sub>
- Hush. This is The River. <sub>rounds[1].river[3].text[1] · tutorial.ts:338</sub>
- Pick cards to go with the ones in the middle. <sub>rounds[1].river[3].text[2] · tutorial.ts:338</sub>
- *button* Five? <sub>rounds[1].river[3].replies[1].label · tutorial.ts:339</sub>
- Five make a hand. Tap your queen and your deuce. <sub>rounds[1].river[4].text · tutorial.ts:345</sub>
- There you go: the mighty aces brought low by a flock of ducks. <sub>rounds[1].verdict[1].text · tutorial.ts:353</sub>
- *button* Ducks?? <sub>rounds[1].verdict[1].replies[1].label · tutorial.ts:354</sub>
- Deuces, or Ducks, when they come in pairs. <sub>rounds[1].verdict[2].text[1] · tutorial.ts:359</sub>
- Because they look a bit like ducks, swimming on the river. <sub>rounds[1].verdict[2].text[2] · tutorial.ts:359</sub>
- *button* Aces, then? <sub>rounds[1].verdict[2].replies[1].label · tutorial.ts:360</sub>
- A pair of aces are Bullets, and so on. <sub>rounds[1].verdict[3].text[1] · tutorial.ts:366</sub>
- Knowing how ducks can beat bullets is the same as knowing when to fold and when to call. <sub>rounds[1].verdict[3].text[2] · tutorial.ts:367</sub>
- *button* Call? <sub>rounds[1].verdict[3].replies[1].label · tutorial.ts:369</sub>
- *button* Fold? <sub>rounds[1].verdict[3].replies[2].label · tutorial.ts:369</sub>
- Better shown than told. Another hand. <sub>rounds[1].verdict[4].text · tutorial.ts:374</sub>
- *button* Next <sub>rounds[1].verdict[4].replies[1].label · tutorial.ts:375</sub>
- Swap a card, or keep them and see what comes? <sub>rounds[2].flop[1].text · tutorial.ts:384</sub>
- When there is no cost to stay in the game, that is a check. <sub>rounds[2].turn[1].text[1] · tutorial.ts:394</sub>
- You should always check. <sub>rounds[2].turn[1].text[2] · tutorial.ts:394</sub>
- Let me see your cards… <sub>rounds[2].turn[2].text[1] · tutorial.ts:401</sub>
- Two jacks. Against four hearts on the board, and a player who just checked. That’s a folding hand. <sub>rounds[2].turn[2].text[2] · tutorial.ts:401</sub>
- *button* Fold? <sub>rounds[2].turn[2].replies[1].label · tutorial.ts:402</sub>
- A big part of the game is knowing when to quit. <sub>rounds[2].turn[3].text · tutorial.ts:404</sub>
- Wise. My queen of hearts made the best flush this board allows. <sub>rounds[2].verdict[1].text · tutorial.ts:410</sub>
- *button* Best? <sub>rounds[2].verdict[1].replies[1].label · tutorial.ts:412</sub>
- Your jacks never stood a chance. <sub>rounds[2].verdict[2].text[1] · tutorial.ts:417</sub>
- Do you know your hands, child? Which beats which? <sub>rounds[2].verdict[2].text[2] · tutorial.ts:417</sub>
- *button* No, ma’am <sub>rounds[2].verdict[2].replies[1].label · tutorial.ts:419</sub>
- *button* Of course <sub>rounds[2].verdict[2].replies[2].label · tutorial.ts:419</sub>
- Here: Grudging Respect, for you. Bestow it on me, if you can. <sub>rounds[4].deal[1].text · tutorial.ts:433</sub>
- *button* Snag? <sub>rounds[4].deal[1].replies[1].label · tutorial.ts:434</sub>
- A snag is a burden. Win with it in your hand, and the loser takes it. Lose with it, and it costs you. <sub>rounds[4].deal[2].text · tutorial.ts:439</sub>
- *button* And yours? <sub>rounds[4].deal[2].replies[1].label · tutorial.ts:440</sub>
- A Solemn Oath, never to play Snag Poker for money. You’ll be holding that soon enough. <sub>rounds[4].deal[3].text · tutorial.ts:445</sub>
- *button* We’ll see <sub>rounds[4].deal[3].replies[1].label · tutorial.ts:446</sub>
- Now it costs a button to see the next card. You can fold, or pay to stay in the game: that’s a call. <sub>rounds[4].flop[1].text · tutorial.ts:453</sub>
- *button* Call? <sub>rounds[4].flop[1].replies[1].label · tutorial.ts:454</sub>
- Yes. Call. <sub>rounds[4].flop[2].text · tutorial.ts:456</sub>
- And again, to see the River. <sub>rounds[4].turn[1].text · tutorial.ts:458</sub>
- Hmph. Grudging Respect, landed on me. <sub>rounds[4].verdict[1].text[1] · tutorial.ts:465</sub>
- I suppose you’ve earned it. <sub>rounds[4].verdict[1].text[2] · tutorial.ts:465</sub>
- *button* Next <sub>rounds[4].verdict[1].replies[1].label · tutorial.ts:466</sub>
- A full house: a fine hand, with no room for a snag. <sub>rounds[4].verdict[2].text[1] · tutorial.ts:472</sub>
- The pot is yours. So is your Respect, still. <sub>rounds[4].verdict[2].text[2] · tutorial.ts:472</sub>
- *button* Next <sub>rounds[4].verdict[2].replies[1].label · tutorial.ts:473</sub>
- And now you carry my Oath. <sub>rounds[4].verdict[3].text[1] · tutorial.ts:479</sub>
- Mind your cards. <sub>rounds[4].verdict[3].text[2] · tutorial.ts:479</sub>
- *button* Next <sub>rounds[4].verdict[3].replies[1].label · tutorial.ts:480</sub>

### src/story/chapters/00_tutorial/hands.ts


**handsRound**

- Hands it is, then. I’ll rig the deck and we’ll play cards open: you see my cards, I see yours. <sub>flop[1].text · hands.ts:40</sub>
- *button* Yes, ma’am <sub>flop[1].replies[1].label · hands.ts:40</sub>
- We share these cards in the middle. See your ace? <sub>flop[2].text · hands.ts:41</sub>
- *button* High card <sub>flop[2].replies[1].label · hands.ts:41</sub>
- That’s the high card. If you play that and I play my king, you win. <sub>flop[3].text · hands.ts:42</sub>
- But I can play my deuce instead, and have a pair. Any pair beats any high card. So what do you do? <sub>flop[4].text · hands.ts:43</sub>
- *button* Pair <sub>flop[4].replies[1].label · hands.ts:43</sub>
- Right: you play the four. Your pair of fours beats my pair of deuces. <sub>flop[5].text · hands.ts:44</sub>
- *button* Ducks! <sub>flop[5].replies[1].label · hands.ts:44</sub>
- Yes: a pair of deuces is called ducks. Well done. <sub>flop[6].text · hands.ts:45</sub>
- But I have a four too. And two pair beats one pair. So what do you do? <sub>flop[7].text · hands.ts:46</sub>
- *button* Swap? <sub>flop[7].replies[1].label · hands.ts:46</sub>
- That’s right. These are all weak hands. <sub>flop[8].text · hands.ts:47</sub>
- Let me rifle the deck for something that suits you better. Throw away the seven and the four. <sub>flop[9].text · hands.ts:48</sub>
- And for me… a five, a six. That will do nicely. <sub>turn[1].text · hands.ts:51</sub>
- Oh, another deuce. With my deuce, I can count three alike. <sub>turn[2].text · hands.ts:52</sub>
- We call that three of a kind, or trips, and it beats two pair. <sub>turn[3].text · hands.ts:53</sub>
- But I can do better. Now I can count from two to six, do you see it? Two, three, four in the middle, and five and six in my hand. <sub>turn[4].text · hands.ts:54</sub>
- When the cards run in a row like that, it’s called a straight. <sub>turn[5].text · hands.ts:55</sub>
- *button* Right. <sub>turn[5].replies[1].label · hands.ts:55</sub>
- And so can you, because an ace can also count as a one and start a run. <sub>turn[6].text · hands.ts:56</sub>
- *button* Straight <sub>turn[6].replies[1].label · hands.ts:56</sub>
- Exactly. That straight is called the wheel, and since its highest card is a five, it doesn’t beat my straight. <sub>turn[7].text · hands.ts:57</sub>
- So you must try something else. <sub>turn[8].text · hands.ts:58</sub>
- *button* Flush <sub>turn[8].replies[1].label · hands.ts:58</sub>
- That’s right! Five cards of the same suit are called a flush, and a flush beats any straight. <sub>turn[9].text · hands.ts:59</sub>
- *button* I win? <sub>turn[9].replies[1].label · hands.ts:59</sub>
- Not yet. See the pair on the board? <sub>turn[10].text · hands.ts:60</sub>
- *button* Ducks <sub>turn[10].replies[1].label · hands.ts:60</sub>
- With a pair in the middle, someone could easily have a full house: a pair and a three of a kind together. <sub>turn[11].text · hands.ts:61</sub>
- A full house beats every hand we have now, pretty as they are. <sub>turn[12].text · hands.ts:62</sub>
- *button* I lose? <sub>turn[12].replies[1].label · hands.ts:62</sub>
- Most likely, unless you give up the hand you’ve got. A flush is a decent hand, but often not good enough with a pair in the middle. <sub>turn[13].text · hands.ts:63</sub>
- Throw away the five and the six. I’ll find you something better still. <sub>turn[14].text · hands.ts:65</sub>
- Oh! Two pair on the board now: threes, which we call crabs, and our ducks. Do you see them? <sub>river[1].text · hands.ts:68</sub>
- *button* Crabs over ducks <sub>river[1].replies[1].label · hands.ts:68</sub>
- Very good! So everyone at the table has two pair now. Tap one of your threes. What do you have now? <sub>river[2].text · hands.ts:69</sub>
- *button* Full house! <sub>river[2].replies[1].label · hands.ts:69</sub>
- Exactly! And so do I: ducks full of crabs. Whose hand is stronger? <sub>river[3].text · hands.ts:70</sub>
- *button* Yours <sub>river[3].replies[1].label · hands.ts:70</sub>
- *button* Mine <sub>river[3].replies[2].label · hands.ts:70</sub>
- No: mine is weaker. Your house has three threes; mine only three deuces. The bigger three wins. <sub>river[4].text · hands.ts:71</sub>
- *button* I win? <sub>river[4].replies[1].label · hands.ts:71</sub>
- You are right: your house is stronger. <sub>river[5].text · hands.ts:72</sub>
- *button* I win? <sub>river[5].replies[1].label · hands.ts:72</sub>
- You do, but you have an even stronger hand waiting for you. Do you see it? <sub>river[6].text · hands.ts:73</sub>
- *button* Four of a kind <sub>river[6].replies[1].label · hands.ts:73</sub>
- Quite so. Four alike, also called quads, is the strongest hand on this board. <sub>river[7].text · hands.ts:74</sub>
- *button* Strongest? <sub>river[7].replies[1].label · hands.ts:74</sub>
- Well, there are also straight flushes: all the numbers in a row, and in the same suit. Exceedingly rare, so it does not pay to chase them. <sub>river[8].text · hands.ts:75</sub>
- And those are the hands. In case you forget, they’re ranked in How it works: open the question mark and see. <sub>river[9].text · hands.ts:77</sub>
- Now play your four threes. <sub>river[10].text · hands.ts:78</sub>
- Four threes beat my full house. Now you know your hands. <sub>verdict[1].text · hands.ts:80</sub>
- *button* Thank you, ma’am <sub>verdict[1].replies[1].label · hands.ts:80</sub>

## The dictionary (src/i18n/en.ts)

### title

- `title.name`: Steamboat Snag Poker
- `title.line1`: Steamboat
- `title.line2`: Snag Poker
- `title.tagline.0`: Because the Night Was Made for Poker
- `title.tagline.1`: Because the River Was Made for Poker
- `title.tagline.2`: A Card Game for River Captains
- `title.tagline.3`: Dump Your Snags Downstream
- `title.tagline.4`: Where Every Pot Has a Catch
- `title.tagline.5`: Mind the Snags, Captain
- `title.tagline.6`: Ante Up and Cast Off
- `title.tagline.7`: Full Steam, Full Boat
- `title.tagline.8`: In-Laws Not Included
- `title.tagline.9`: Play Your Cards, Pass On Your Problems
- `title.tagline.10`: The River Giveth, the River Taketh Away
- `title.tagline.11`: Sharp Cards, Deep Water, Stinking Hides
- `title.tutorial`: Tutorial
- `title.league`: League
- `title.story`: The Story of The Best Intentions
- `title.storyContinue`: The Story of The Best Intentions
- `title.continue`: Continue
- `title.abandon`: Start a new League?
- `title.abandonBody`: Your current game (round {month}) will be lost.
- `title.abandonYes`: New League
- `title.abandonNo`: Cancel
- `title.howTo`: How it works

### options

- `options.title`: Options
- `options.sound`: The clink of coins
- `options.on`: On
- `options.off`: Off
- `options.fullscreen`: Full screen
- `options.fullscreenTip`: The whole screen for the table, without the browser’s bars. Any tap goes back to it if the phone drops out of it.
- `options.faces`: Card faces
- `options.faceValue`: Big value
- `options.faceSuit`: Big suit
- `options.facesTip`: Big suit makes a flush easier to spot. At the table, tap a card on the board to switch.
- `options.music`: The band
- `options.volume`: Volume
- `options.musicTip`: Bennie Moten’s Kansas City Orchestra plays at The Sandbar and in the Bettendorf saloon: Tulsa Blues and Vine Street Blues in turn, their OKeh sides of 1924.

### music

- `music.nowPlaying`: Now playing: {title}, {band}, {year}

### howto

- `howto.title`: A Warning to the Decent Folk of the River
- `howto.subtitle`: concerning the Vile Game of Snag Poker
- `howto.byline`: by Morag, Governess
- `howto.intro`: Wherever two steamboat captains cross paths on the river, they sit down to a hand of Snag Poker, and their money, their boats and their good names go into the pot. So that you may know the game when you see it, and walk away, I set down its workings here. Learn first the hands by which captains ruin themselves:
- `howto.body`: Each player puts an ante into the pot: the first dollar lost, before a card is dealt. Each holds three cards; the cards in the middle belong to everyone, which is the only Christian thing about the game.  
>   
> On the Flop and the Turn you may swap any of your cards for new ones, each card dearer than the last, or keep what you have. Seeing the next card may cost a small fee: they call it a check when it is free and a call when it is not. If your hand is hopeless you may fold, on the Flop or the Turn, and give up what you put in. It is the one wise move in the game. Wiser still: fold before you sit down.  
>   
> When the River card comes, everyone makes a hand: tap the cards you mean to play, then Play hand, and the best cards in the middle fill the rest of your five. The best hand takes the whole pot, and the rest go home poorer.  
>   
> Snags are the burdens of the river: stinking cargo, tiresome passengers, thankless duties, and worse. Every snag you carry makes your ante dearer. To be rid of one you must put it in your hand and still win: then the loser takes every snag the winner dared to play. Lose with snags in your hand and you pay a forfeit for each. Four of a kind has room for a snag; a full house has not. And so misfortune passes from hand to hand, like a bad penny.  
>   
> Short of the price, a player puts in all they have and plays on. Lose that, and they are out of the game, and their boat is sold at auction. I have seen it.  
>   
> When only four captains are left afloat in a League, they sit down together at the final table, and the League stakes each of them sixty dollars more, as though they had not lost enough. There a player may raise on the River, and the others must match the raise or fold. When the first of them is broke, one more hand is dealt, the Last Hand, at double stakes, and then it is over. Gold, silver or bronze, they call it, and what a captain walks away with is their score. I call it a disgrace.
- `howto.closing`: Yours in sorrow and sobriety,
- `howto.signature`: Morag
- `howto.imprint`: Printed at her own expense, Muscatine

### street

- `street.flop`: The Flop
- `street.turn`: The Turn
- `street.river`: The River
- `street.showdown`: Showdown!
- `street.compose`: The River
- `street.standings`: Standings
- `street.part.1`: Part Two
- `street.part.2`: Part Three
- `street.part.3`: Still Riding
- `street.sub.flop`: Swap or stand pat
- `street.sub.turn`: Last chance to swap
- `street.sub.river`: Make your hand
- `street.sub.compose`: Make your hand

### table

- `table.crossing`: Round {month}
- `table.stakes`: At stake
- `table.league`: On the river
- `table.out`: out
- `table.new`: new

### draw

- `draw.check`: Check
- `draw.call`: Call
- `draw.fold`: Fold
- `draw.foldIn`: Fold · {amount} in
- `draw.allIn`: All in · {amount}
- `draw.discard`: Swap {n}
- `draw.play`: Play hand
- `draw.boardOnly`: No cards tapped, playing the board
- `draw.ridingOne`: One snag riding {cost}
- `draw.riding`: {n} snags riding {cost}

### number

- `number.2`: Two
- `number.3`: Three
- `number.4`: Four
- `number.5`: Five
- `number.6`: Six
- `number.7`: Seven
- `number.8`: Eight
- `number.9`: Nine
- `number.10`: Ten

### willie

- `willie.name`: Willie

### talk

- `talk.agree`: Agree
- `talk.decline`: Decline

### willie

- `willie.ok`: Aye!
- `willie.fished`: Blast! You fished {jokers} out of the deck. You draw again, so your hand is still full, but that snag is yours now.

### cards

- `cards.zoomTip`: Hold your finger on any card for a closer look.
- `cards.zoomClose`: Tap anywhere to put it back.

### draw

- `draw.back`: Back
- `draw.close`: Close
- `draw.oddsTitle`: Here’s what {name} could be harbouring:
- `draw.oddsTitleTable`: Here’s what any of them could be harbouring:
- `draw.theirDiscards`: Discarded by {name}
- `draw.yourDiscards`: Your discards

### list

- `list.and`:  and 

### end

- `end.next`: Next
- `end.pause`: Menu
- `end.toTitle`: Menu
- `end.gameOver`: INSOLVENT!
- `end.gameOverBody`: Your funds are gone, and you are out of the game.
- `end.gameOverKing`: {name} is the KING OF THE RIVER!
- `end.gameOverMany`: You can’t afford the ante for the next round. Better luck next time!
- `end.winGame`: KING OF THE RIVER!
- `end.lastStanding`: Every rival has gone broke. After {month} rounds, the river is yours!
- `end.again`: New game

### ladder

- `ladder.title`: The hands, best first
- `ladder.straightFlush`: Straight flush
- `ladder.fourOfAKind`: Four of a kind
- `ladder.fullHouse`: Full house
- `ladder.flush`: Flush
- `ladder.straight`: Straight
- `ladder.threeOfAKind`: Three of a kind
- `ladder.twoPair`: Two pair
- `ladder.pair`: Pair
- `ladder.highCard`: High card
- `ladder.snags`: A snag in a hand counts for nothing: it only raises the stakes.
- `ladder.eg.straightFlush`: Five in a row, one suit
- `ladder.eg.fourOfAKind`: Four kings
- `ladder.eg.fullHouse`: Three jacks and two queens
- `ladder.eg.flush`: Five of one suit
- `ladder.eg.straight`: Five in a row
- `ladder.eg.threeOfAKind`: Three eights
- `ladder.eg.twoPair`: Two jacks and two fives
- `ladder.eg.pair`: Two nines
- `ladder.eg.highCard`: Nothing but your best card
- `ladder.ties`: The same hand? Suits count for nothing: it’s dead level, and the pot rides. Whoever tied plays on, antes in, snags and all, as often as it takes. Fold, and those snags are yours.

### hand

- `hand.highCard`: High Card
- `hand.pair`: a Pair
- `hand.twoPair`: Two Pair
- `hand.threeOfAKind`: Three of a Kind
- `hand.straight`: a Straight
- `hand.flush`: a Flush
- `hand.fullHouse`: a Full House
- `hand.fourOfAKind`: Four of a Kind
- `hand.straightFlush`: a Straight Flush
- `hand.nothing`: nothing at all

### describe

- `describe.highCard`: {rank} high
- `describe.pair`: a Pair of {rank}
- `describe.trips`: Three {rank}
- `describe.quads`: Four {rank}
- `describe.twoPair`: Two Pair, {a} and {b}
- `describe.full`: a Full House, {a} full of {b}
- `describe.high`: {hand}, {rank} high

### nick

- `nick.royal`: The Royal Flush!
- `nick.fullBoat`: A Full Boat!
- `nick.waiter`: The Waiter!
- `nick.butler`: The Butler!
- `nick.deadMan`: The Dead Man's Hand!
- `nick.wheel`: The Wheel!
- `nick.broadway`: Broadway!

### call

- `call.high`: High card, {rank}
- `call.pair`: Pair of {rank}
- `call.twoPair`: Two pair, {a} and {b}
- `call.trips`: Three of a kind, {rank}
- `call.straight`: Straight, {rank} high
- `call.flush`: Flush, {suit}, {rank} high
- `call.full`: Full house, {a} and {b}
- `call.quads`: Four of a kind, {rank}
- `call.straightFlush`: Straight flush, {suit}, {rank} high
- `call.royal`: Royal flush, {suit}

### lingo

- `lingo.over`: {a} over {b}
- `lingo.full`: {a} full of {b}
- `lingo.trips`: Trip {rank}
- `lingo.quads`: Four {rank}
- `lingo.route66`: Route 66
- `lingo.deadMan`: The Dead Man’s Hand
- `lingo.waiter`: The Waiter
- `lingo.butler`: The Butler
- `lingo.wheel`: The Wheel
- `lingo.broadway`: Broadway
- `lingo.fullBoat`: A full boat
- `lingo.royal`: The Royal Flush
- `lingo.rank.2`: Ducks
- `lingo.rank.3`: Crabs
- `lingo.rank.4`: Sailboats
- `lingo.rank.5`: Nickels
- `lingo.rank.6`: Kicks
- `lingo.rank.7`: Walking Sticks
- `lingo.rank.8`: Snowmen
- `lingo.rank.10`: Dimes
- `lingo.rank.11`: Hooks
- `lingo.rank.12`: Ladies
- `lingo.rank.13`: Cowboys
- `lingo.rank.14`: Bullets

### nick

- `nick.rank.2`: Ducks!
- `nick.rank.3`: Crabs!
- `nick.rank.4`: Sailboats!
- `nick.rank.7`: Walking Sticks!
- `nick.rank.8`: Snowmen!
- `nick.rank.10`: Dimes!
- `nick.rank.11`: Hooks!
- `nick.rank.12`: Ladies!
- `nick.rank.13`: Cowboys!
- `nick.rank.14`: Bullets!

### rank

- `rank.name.2`: two
- `rank.name.3`: three
- `rank.name.4`: four
- `rank.name.5`: five
- `rank.name.6`: six
- `rank.name.7`: seven
- `rank.name.8`: eight
- `rank.name.9`: nine
- `rank.name.10`: ten
- `rank.name.11`: jack
- `rank.name.12`: queen
- `rank.name.13`: king
- `rank.name.14`: ace
- `rank.plural.2`: deuces
- `rank.plural.3`: threes
- `rank.plural.4`: fours
- `rank.plural.5`: fives
- `rank.plural.6`: sixes
- `rank.plural.7`: sevens
- `rank.plural.8`: eights
- `rank.plural.9`: nines
- `rank.plural.10`: tens
- `rank.plural.11`: jacks
- `rank.plural.12`: queens
- `rank.plural.13`: kings
- `rank.plural.14`: aces

### card

- `card.long`: the {rank} of {suit}
- `card.snag`: SNAG

### suit

- `suit.c`: Clubs
- `suit.d`: Diamonds
- `suit.h`: Hearts
- `suit.s`: Spades

### rank

- `rank.title.2`: Two
- `rank.title.3`: Three
- `rank.title.4`: Four
- `rank.title.5`: Five
- `rank.title.6`: Six
- `rank.title.7`: Seven
- `rank.title.8`: Eight
- `rank.title.9`: Nine
- `rank.title.10`: Ten
- `rank.title.11`: Jack
- `rank.title.12`: Queen
- `rank.title.13`: King
- `rank.title.14`: Ace

### show

- `show.tb.kicker.you`: Same hand! Your {win} kicker beats {name}’s {lose}.
- `show.tb.kicker.them`: Same hand! {name}’s {win} kicker beats your {lose}.
- `show.tb.next.you`: Same hand! Your {win} beats {name}’s {lose} on the next card.
- `show.tb.next.them`: Same hand! {name}’s {win} beats your {lose} on the next card.
- `show.tb.suit.you`: Dead level! Your {win} beats {name}’s {lose} on suit.
- `show.tb.suit.them`: Dead level! {name}’s {win} beats your {lose} on suit.
- `show.deadCard`: snag
- `show.tb.kicker.snag.them`: Same hand! {name}’s {win} kicker beats {snags}{end}
- `show.tb.kicker.snag.you`: Same hand! Your {win} kicker beats {snags}{end}
- `show.youWin`: You win!
- `show.youLose`: You lose!
- `show.draw`: A dead heat!
- `show.split`: Pot split
- `show.lost`: {amount} lost
- `show.folded`: Folded
- `show.next`: Next

### hr

- `hr.move.fold`: Folds
- `hr.move.swap`: Swaps {n}
- `hr.move.call`: Calls · {amount}
- `hr.move.check`: Checks
- `hr.folded`: Folded
- `hr.dealer`: Dealer
- `hr.byFolds`: The rest folded: {name} takes the pot.
- `hr.rides`: Dead level! The pot rides.
- `hr.split`: Pot split: {names}.
- `hr.wins`: {name} takes the pot!
- `hr.snagsTo`: The snags go to {name}.
- `hr.byFolds.you`: The rest folded: you take the pot.
- `hr.youFolded`: You folded: {name} takes the pot.

### table

- `table.deckSnag`: A snag in the deck
- `table.deckSnags`: Snags in the deck: {n}

### pass

- `pass.passTo`: Pass the phone to
- `pass.itsMe`: I’m {name}
- `pass.wins`: {name} takes the table!

### hr

- `hr.wins.you`: You take the pot!
- `hr.snagsTo.you`: The snags go to you.
- `hr.youAreOut`: You’re out. Watch the rest play it out.
- `hr.again`: Again

### finale

- `finale.next`: Four captains left. You have been invited to The High Rollers Table.
- `finale.go`: Accept

### hr

- `hr.raise`: Raise · {amount}
- `hr.match`: Match · {amount}
- `hr.move.raise`: Raises · {amount}
- `hr.move.match`: Matches · {amount}
- `hr.raised`: Raised · {amount}
- `hr.lastHand`: The Last Hand · stakes ×{n}
- `hr.lastHandNext`: Next: The Last Hand.
- `hr.lastHandTitle`: The Last Hand
- `hr.lastHandStakes`: Stakes ×{n}
- `hr.isOut`: {name} is broke.
- `hr.isOut.you`: You are broke.
- `hr.areOut`: {names} are broke.
- `hr.out`: Out
- `hr.place.0`: gold
- `hr.place.1`: silver
- `hr.place.2`: bronze
- `hr.walkAway`: You walk away with {amount}.
- `hr.broke`: You leave with nothing.

### show

- `show.continue`: Continue ▸
- `show.skip`: Skip

### character

- `character.captain.name`: Captain
- `character.captain.you`: You
- `character.konrad.name`: Konrad Marlowe
- `character.konrad.nick`: Whiteknuckle
- `character.konrad.boat`: Captain of the Monarch
- `character.konrad.blurb`: A hard man from a hard river. Grips the wheel, and his cards, until his knuckles go white.
- `character.maxMoritz.name`: Max Moritz
- `character.maxMoritz.nick`: Long Coat
- `character.maxMoritz.boat`: Captain of the Mischief
- `character.maxMoritz.blurb`: A very tall captain in a very long coat. The coat giggles.
- `character.ellie.name`: Ellie Sawyer
- `character.ellie.nick`: Pilot
- `character.ellie.boat`: Rapids pilot, out of Cordova
- `character.ellie.blurb`: The only pilot who takes boats up the rapids on the spring thaw. They call it crazy. She prefers adventurous.
- `character.ignatz.name`: Ignatz
- `character.ignatz.nick`: Hurler
- `character.ignatz.boat`: Captain of the Brickyard
- `character.ignatz.blurb`: A mouse with a brick, a grudge and no patience whatsoever.
- `character.nemo.name`: Nemo
- `character.nemo.nick`: Sleepwalker
- `character.nemo.boat`: Captain of the Slumber
- `character.nemo.blurb`: Never quite awake. Plays as if the cards were part of a dream.
- `character.steamboatBill.name`: Steamboat Bill
- `character.steamboatBill.called`: Bill
- `character.steamboatBill.nick`: Captain Bill
- `character.steamboatBill.boat`: Captain of the Best Intentions
- `character.steamboatBill.blurb`: A gruff old-timer who has seen every trick on the river and fallen for none of them.
- `character.finlay.name`: Finlay
- `character.finlay.nick`: Carouser
- `character.finlay.boat`: Carouser
- `character.finlay.blurb`: A bricklayer who struck it rich and never got used to it. Slips down to the river whenever his wife isn’t looking.
- `character.morag.name`: Morag
- `character.morag.nick`: Governess
- `character.morag.boat`: Governess
- `character.morag.blurb`: Came to fetch her husband home. Stayed to clean out the table.
- `character.lenny.name`: Lenny King
- `character.lenny.nick`: Troubadour
- `character.lenny.boat`: Travelling troubadour
- `character.lenny.blurb`: A wandering troubadour with a cardboard violin. Moody and gloomy; expects the worst, and is rarely disappointed.
- `character.walrus.name`: The Walrus
- `character.walrus.boat`: Captain of the Cacophony
- `character.walrus.blurb`: An old sea dog with a mighty moustache, forever at cards with his friend the Carpenter.
- `character.gaylord.name`: Gaylord Montague
- `character.gaylord.nick`: Esquire
- `character.gaylord.boat`: Travelling card-sharp
- `character.gaylord.blurb`: A professional gambler with impeccable manners and an IOU for every occasion.
- `character.harbourMaster.name`: Horace Quaid
- `character.harbourMaster.called`: The harbour master
- `character.harbourMaster.nick`: Harbour Master
- `character.harbourMaster.boat`: Harbour master at Muscatine
- `character.harbourMaster.blurb`: Has cleared every boat out of Muscatine for thirty years, and charged most of them for it.
- `character.sandbar.name`: Sandy
- `character.sandbar.nick`: The Sandbar
- `character.sandbar.boat`: Above Muscatine
- `character.sandbar.blurb`: Stands pat on everything. Takes your sweat and gives it to the river.
- `character.crate.name`: Salvage
- `character.crate.called`: Crate
- `character.crate.nick`: Crate
- `character.crate.boat`: Adrift
- `character.crate.blurb`: Could be anything. Worth a hand to find out.
- `character.sawyer.name`: Snag
- `character.sawyer.called`: Sawyer
- `character.sawyer.nick`: Sawyer
- `character.sawyer.boat`: Rooted in the riverbed
- `character.sawyer.blurb`: A whole tree, roots in the mud, nodding up and down in the current. Patient.
- `character.deadhead.name`: Snag
- `character.deadhead.called`: Deadhead
- `character.deadhead.nick`: Deadhead
- `character.deadhead.boat`: Just under the water
- `character.deadhead.blurb`: A waterlogged log, floating on end, the top of it a hand under the surface.
- `character.driftPile.name`: Snag
- `character.driftPile.called`: Drift pile
- `character.driftPile.nick`: Drift Pile
- `character.driftPile.boat`: Wherever the current left it
- `character.driftPile.blurb`: Brush, branches and a barn door, all heading for the wheel.
- `character.molineChain.name`: The Moline Chain
- `character.molineChain.called`: The Moline Chain
- `character.molineChain.boat`: The Rock Island Rapids
- `character.molineChain.blurb`: Brazil Rock, and the Duck Creek chain beyond it.
- `character.campbellsChain.name`: Campbell’s Chain
- `character.campbellsChain.called`: Campbell’s Chain
- `character.campbellsChain.boat`: The Rock Island Rapids
- `character.campbellsChain.blurb`: Three wrecks and a standing wave.
- `character.longReach.name`: The Long Reach
- `character.longReach.called`: The Long Reach
- `character.longReach.boat`: The Rock Island Rapids
- `character.longReach.blurb`: St. Louis, Cabin, Sycamore, Smith’s: the longest, hardest stretch on the river.
- `character.ellie.called`: Ellie
- `character.gaylord.called`: Gaylord
- `character.tripp.name`: Cornelius Tripp
- `character.tripp.called`: Tripp
- `character.tripp.nick`: Old Guard
- `character.tripp.boat`: Of Davenport
- `character.tripp.blurb`: Three of a kind settles it. Always has, always will.
- `character.odds.name`: Ottilie Pfeiffer
- `character.odds.called`: Odds
- `character.odds.nick`: Odds
- `character.odds.boat`: Bookmaker, of Bettendorf
- `character.odds.blurb`: Will lay you odds on anything: the cards, the weather, which way the cat jumps.
- `character.rourke.name`: Tommy Rourke
- `character.rourke.called`: Rourke
- `character.rourke.nick`: Picket
- `character.rourke.boat`: On strike, Rock Island
- `character.rourke.blurb`: Has never been so busy doing nothing.
- `character.foreman.name`: Mick Doolan
- `character.foreman.called`: The foreman
- `character.foreman.nick`: Foreman
- `character.foreman.boat`: The coal yard, Rock Island
- `character.foreman.blurb`: On strike, and enjoying the card games more than he lets on.
- `character.pfund.name`: Hannelore Pfund
- `character.pfund.called`: Mrs. Pfund
- `character.pfund.nick`: Cook
- `character.pfund.boat`: Cook, by the day
- `character.pfund.blurb`: Pays no attention to anyone, and pays it loudly.
- `character.gus.name`: Augustus Klemm
- `character.gus.called`: Gus
- `character.gus.nick`: Engineer
- `character.gus.boat`: Engineer of the Best Intentions
- `character.gus.blurb`: Talks to the engine, who answers to Old Hildegard. Knows to the shovel what a stretch will burn.
- `character.lars.name`: Lars Brekke
- `character.lars.called`: Lars
- `character.lars.nick`: Fireman
- `character.lars.boat`: Fireman of the Best Intentions
- `character.lars.blurb`: Enormous, nearly silent. Eats for two, shovels for three, sings songs nobody else knows.
- `character.willie.name`: Willie
- `character.willie.called`: Willie
- `character.willie.nick`: Deck hand
- `character.willie.boat`: Deck hand and galley boy
- `character.willie.blurb`: Indomitable. The beans are his.
- `character.fireman.name`: Seamus Flood
- `character.fireman.called`: Flood
- `character.fireman.nick`: Hired fireman
- `character.fireman.boat`: Fireman, by the day
- `character.fireman.blurb`: Shovels what he’s paid to shovel.
- `character.eliza.name`: Eliza Bathory
- `character.eliza.nick`: Bone Pale
- `character.eliza.boat`: High roller on the grand steamers
- `character.eliza.blurb`: Charming, patient and terribly polite. Those who lose to her tend to stay lost.

### river

- `river.handOf`: Round {n} of {of}
- `river.heading`: Day {day}: {place}, {bound}
- `river.upbound`: upbound
- `river.moored`: {place}

### log

- `log.title`: The First Mate’s Log
- `log.page`: Day {day}
- `log.earlier`: The day before
- `log.later`: The day after
- `log.close`: Close the log
- `log.open`: Open the log
- `log.empty`: Nothing written yet.

### river

- `river.downbound`: downbound

### hub

- `hub.anchor.name`: Anchor downstream
- `hub.anchor.desc`: Free. Willie wades ashore.
- `hub.bettendorf.name`: Bettendorf Saloon
- `hub.bettendorf.desc`: Cards till someone makes three of a kind
- `hub.mercantile.name`: Moline Mercantile
- `hub.mercantile.desc`: Docking fee. Chandler, market halls, dock hands
- `hub.depot.name`: Rock Island Coal Depot
- `hub.depot.desc`: Fill bunker ({n} of {max})
- `hub.tournament.name`: Davenport Pilot Games
- `hub.tournament.desc`: A pilot up the rapids, for the winner
- `hub.job:timber.name`: Job: Timber herding
- `hub.breakfast.name`: Bettendorf Breakfast
- `hub.breakfast.desc`: Gaylord Montague is staying at the saloon
- `hub.seat.name`: Davenport Pilot Games
- `hub.seat.desc`: Gaylord plays your seat today
- `hub.jobs.name`: Odd Jobs
- `hub.jobs.desc`: See what’s going
- `hub.job:timber.desc`: -1 coal, +$10
- `hub.job:cattle.name`: Job: Cattle freight
- `hub.job:cattle.desc`: -1 coal, +$14
- `hub.job:mail.name`: Job: Mail run
- `hub.job:mail.desc`: -1 coal, +$9
- `hub.job:salvage.name`: Job: Salvage camping
- `hub.job:salvage.desc`: No coal. Crates below the rapids, for the crew’s strength

### river

- `river.needsCoal`: Needs {n} coal
- `river.heldGround`: You hold your ground! The sand drifts away.
- `river.gainedGround`: She gains! A little further up.
- `river.won.sandbar.1`: You hold your ground! The sand drifts away.
- `river.won.sandbar.2`: She shifts! The bar gives a little.
- `river.won.sandbar.3`: The poles bite! She slides a hair.
- `river.won.sandbar.4`: A shovel’s worth of Sandy, back in the river!
- `river.won.sandbar.5`: She budges! The bar’s a little shallower.
- `river.won.sandbar.6`: That’s a few grains less of him!
- `river.won.crate.1`: Hooked it! Over the rail, dripping.
- `river.won.crate.2`: Boat hook and a heave: it’s aboard!
- `river.won.crate.3`: Landed! Heavier than it looks.
- `river.won.crate.4`: Finders keepers! Up she comes.
- `river.won.crate.5`: Out of the river and onto the deck!
- `river.won.sawyer.1`: You time the nod! Over it as it dips.
- `river.won.sawyer.2`: Past it between nods!
- `river.won.sawyer.3`: It bows, and you slip by!
- `river.won.sawyer.4`: Too slow on the nod, old tree!
- `river.won.deadhead.1`: You spot the swirl and swing wide!
- `river.won.deadhead.2`: Wide of it! It sulks off downstream.
- `river.won.deadhead.3`: It bobs up astern. Too late!
- `river.won.deadhead.4`: Missed you by a hand’s breadth!
- `river.won.driftPile.1`: You thread the brush! Not a twig in the wheel.
- `river.won.driftPile.2`: Through a gap in the jumble!
- `river.won.driftPile.3`: Poles out, fended off, and past!
- `river.won.driftPile.4`: The barn door swings by, waving!
- `river.won.rapids.1`: She gains! A little further up.
- `river.won.rapids.2`: A boat’s length gained!
- `river.won.rapids.3`: She claws up another yard!
- `river.won.rapids.4`: The wheel bites! Up she goes.
- `river.purse`: Purse
- `river.strength`: Strength
- `river.coal`: Coal
- `river.coalLoads`: {n} of {max} loads
- `river.continue`: Continue

### ship

- `ship.title`: The Best Intentions
- `ship.bunker`: Coal bunker
- `ship.strength`: Ship’s strength
- `ship.strengthNote`: What the crew make each morning
- `ship.crew`: Crew
- `ship.hires`: Hired hands
- `ship.daysLeft`: {n} days left
- `ship.dayLeft`: Last day
- `ship.rehire`: Re-hire (${wage})
- `ship.noHires`: None. Moline Mercantile has hands for hire.
- `ship.repairs`: Needs repair
- `ship.noRepairs`: Nothing. She’s sound.
- `ship.vessel`: The vessel
- `ship.bridge`: The bridge: yours, Captain.
- `ship.tomorrow`: Tap to move someone. It shows in tomorrow’s strength.
- `ship.station.furnace`: Furnace
- `ship.station.engine`: Engine
- `ship.station.galley`: Galley
- `ship.station.deck`: Deck
- `ship.part.boiler`: Boiler
- `ship.part.engine`: Engine
- `ship.part.kitchen`: Kitchen
- `ship.part.rooms`: Passenger rooms
- `ship.part.rudder`: Rudder
- `ship.part.paddles`: Paddles
- `ship.rooms.0`: Storage
- `ship.rooms.1`: Cabin
- `ship.rooms.2`: Luxury
- `ship.open`: The Best Intentions

### river

- `river.proxy`: I see
- `river.pushAgain`: Push again
- `river.turnBack`: Turn back
- `river.go`: Go
- `river.back`: Back
- `river.slot.morning`: Morning
- `river.slot.afternoon`: Afternoon
- `river.slot.evening`: Evening
- `river.menu`: Menu
- `river.pause`: Pause
- `river.skip`: Skip
- `river.aye`: Aye
- `river.port`: Port
- `river.starboard`: Starboard
- `river.salvage`: Salvage aboard: ${n}
- `river.islandAhead`: Island ahead, Captain! Port or starboard?
- `river.namedAhead`: {name} ahead, Captain! Port or starboard?
- `river.castOff`: Cast off
- `river.council`: The morning council
- `river.buy`: Buy
- `river.owned`: Aboard
- `river.needCoal`: {n} loads of coal needed to cast off.
- `river.snags`: Aboard, besides
- `river.oddJob`: Nearly broke: Willie finds an odd job unloading barrels. ${n}.
- `river.troublesTaken`: Taken on: {list}.
- `river.absorbed`: Fixed: {list}.
- `river.done`: That’s as far as the river goes, for now.
- `river.backToTitle`: To the title

### place

- `place.muscatine`: Muscatine
- `place.triCities`: the Tri-Cities
- `place.leClaire`: LeClaire
- `place.davenport`: Davenport

### item

- `item.coal.name`: A load of coal
- `item.coal.desc`: Buy one, at what they’re asking.
- `item.food.name`: A proper supper
- `item.food.desc`: Better than beans: +4 strength tomorrow morning.
- `item.hammocks.name`: Hammocks
- `item.hammocks.desc`: The crew sleep better: +3 strength every morning.
- `item.sparePole.name`: A spare pole
- `item.sparePole.desc`: Replaces a Broken Pole, or saves you from the next.
- `item.sellCoal.name`: A load of coal
- `item.sellCoal.desc`: Sell one. Coal’s short while the strike’s on.
- `item.sellSalvage.name`: Salvage
- `item.sellSalvage.desc`: What was fished out of the river, all of it.
- `item.fireman.name`: A second fireman
- `item.fireman.desc`: A second shovel at the furnace, for today and tomorrow.
- `item.boilerOverhaul.name`: Boiler overhaul
- `item.boilerOverhaul.desc`: Boiler 2. Twice the work from the furnace.
- `item.engineOverhaul.name`: Engine overhaul
- `item.engineOverhaul.desc`: Engine 2. Twice the work from the engine room.
- `item.stove.name`: A proper stove
- `item.stove.desc`: Kitchen 1. Whoever’s in the galley can cook at last.
- `item.cook.name`: Mrs. Pfund, cook
- `item.cook.desc`: Needs a kitchen. Takes the galley, for today and tomorrow.

### joker

- `joker.0`: the Barrel of Rotten Eggs
- `joker.1`: the In-Laws
- `joker.2`: the Layabout Nephew
- `joker.3`: the Unionized Coal Shoveller
- `joker.4`: the Stinking Hides
- `joker.5`: the Travelling Preacher
- `joker.6`: the Mail Run
- `joker.7`: the Runaway Mule
- `joker.8`: The Sandbar
- `joker.9`: the Fog Bank
- `joker.10`: the Crate of Live Chickens
- `joker.11`: the Unpaid Coal Bill
- `joker.generic`: a snag

### money

- `money.button`: {n} button
- `money.buttons`: {n} buttons

### joker

- `joker.12`: Grudging Respect
- `joker.13`: the Solemn Oath
- `joker.14`: the Broken Pole
- `joker.15`: the Twisted Crankshaft
- `joker.16`: the Broken Paddle
- `joker.17`: the Busted Boiler
- `joker.18`: Fatigue
- `joker.19`: the Broken Heart
- `joker.20`: the Dock Fee
- `joker.21`: Pamphlet Distribution
- `joker.22`: the Strike Support Button
- `joker.23`: On the Rocks
- `joker.24`: the Stove-in Plank
- `joker.25`: the Fouled Rudder
- `joker.26`: the Fouled Wheel
- `joker.27`: the Sprung Plank
- `joker.28`: Scraped Paint
