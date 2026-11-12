/**
 * Gaylord Montague, Esquire. He keeps his own calendar: a week at Davenport's
 * noon table, on behalf of captains who'd rather not, and Bettendorf until he
 * leaves. See docs/story.md, "Gaylord's week".
 */
import { Rng, type RoundScript, type TalkContext } from '../mechanics';
import type { SpeechLine } from '../../ui/Speech.svelte';
import { FLAG } from '../flags';
import { aside, say } from '../lines';
import { GAYLORD_FEE, GAYLORD_FIRST_HIRE, GAYLORD_LAST_DAY, GAYLORD_LAST_HIRE, LOAN } from '../numbers';

/** Ellie and Gaylord's week at the noon table: it goes on whether you're there or not. */
export function quarrel(day: number): SpeechLine[] {
  if (day <= 3)
    return [
      say('ellie', 'You again, Mr. Montague.'),
      say('gaylord', 'A different captain, Miss Sawyer. I merely sit in his chair.'),
      say('ellie', 'Where is he, then?'),
      say('gaylord', 'At breakfast. He has every confidence in me.'),
    ];
  if (day === 4)
    return [
      say('ellie', 'One more hand of this, Montague, and you’ll be swimming to St. Louis.'),
      say('gaylord', 'River Code, Miss Sawyer. It’s silent on the matter of representation.'),
      say('ellie', 'It’s silent on the matter of drowning, too.'),
    ];
  if (day === 5)
    return [
      say('ellie', 'That’s enough. You’re finished at this table.'),
      say('gaylord', 'I signed those captains in good faith, Miss Sawyer. Their companies have lawyers.'),
      say('ellie', 'How many more contracts have you signed?'),
      say('gaylord', 'Three more.'),
      say('ellie', ['This week only. Show up with a new client next week and I change the game to Bingo.', 'Code says game. It doesn’t say poker. You a professional bingo player, Gaylord? I’ll bring my auntie down from Cordova. She’s a cracking bingoist.']),
      say('gaylord', '…This week only.'),
    ];
  if (day <= GAYLORD_LAST_DAY)
    return day === GAYLORD_LAST_DAY
      ? [say('ellie', 'Last one, Montague.'), say('gaylord', 'And a pleasure, as ever.'), say('ellie', 'I’ve told my auntie to stand down.')]
      : [say('ellie', `${GAYLORD_LAST_DAY - day + 1} more, Montague.`), say('gaylord', 'I can count, Miss Sawyer. It’s rather the point of me.')];
  return day <= GAYLORD_LAST_DAY + 2 ? [say('ellie', 'Captains only, today. Just how I like it. Anyone for bingo? No? Good.')] : [];
}

/** Over breakfast: he only brings up what he'd offer you. */
export function breakfastTalk({ day, journey }: TalkContext): RoundScript {
  const { flags, purse } = journey;
  const client = flags.includes(FLAG.gaylordsClient);
  const pass = { label: 'Good day', effect: 'pass', end: true };
  const owes = flags.includes(FLAG.owesGaylord);
  const canHire = day >= GAYLORD_FIRST_HIRE && day <= GAYLORD_LAST_HIRE && !owes && !client && flags.includes(FLAG.heardOfPilot) && purse >= GAYLORD_FEE;
  if (canHire)
    return {
      deal: [
        {
          ...say('gaylord', ['I’m all but booked this week, Captain: I’ve the last day left, and no other.', 'Ten dollars covers my breakfast, my room and the morning’s entry. The winnings are mine; the boat up the rapids is yours. Watch and learn.']),
          replies: [pass, { label: 'Done', effect: 'hire', end: true }],
        },
      ],
    };
  if (flags.includes(FLAG.beatGaylord) && !owes && !client)
    return {
      deal: [
        {
          ...say('gaylord', ['Fearless and audacious. I see myself in you, Captain.', `${LOAN} dollars now. Double back when we next meet, shall we say two weeks? It doubles again if the third week begins.`]),
          replies: [pass, { label: 'Done', effect: 'take', end: true }],
        },
      ],
    };
  return { deal: [{ ...say('gaylord', 'The eggs are adequate, Captain. Good morning.'), replies: [pass] }] };
}

/** Gaylord in your seat, saying what he's about. */
const SHOPTALK = {
  flop: ['Never fall in love with a pair, Captain.', 'Note who stands pat. It’s the only honest thing a man does at this table.', 'I don’t play the cards. I play the price of the cards.'],
  turn: ['Now we see who came to play and who came to pay.', 'A fee to see the River. Cheap, for what it tells me.', 'Patience. It’s the only edge that doesn’t wear down.'],
  river: ['Lay it down gently. You want them to think you’re sorry.', 'There. Never show more than you must.', 'The best hand is the one they believe.'],
};
export function hiredTalk({ hand, seed }: TalkContext): RoundScript {
  const pick = (lines: string[], k: number) => ({ size: 'aside' as const, who: 'gaylord', text: new Rng(seed + hand + k).pick(lines) });
  return {
    ...(hand === 1 ? { deal: [say('gaylord', 'Here to watch and learn, I see. Well, wish me luck.'), say('ellie', 'A captain who can’t be bothered to play his own seat. Lovely.')] } : {}),
    flop: [pick(SHOPTALK.flop, 1)],
    turn: [pick(SHOPTALK.turn, 2)],
    river: [pick(SHOPTALK.river, 3)],
  };
}

/** Gaylord at the saloon: the week, as it goes, and after. */
export function gaylordAtTheSaloon(day: number, client: boolean): SpeechLine[] {
  if (day < GAYLORD_FIRST_HIRE) return [];
  if (client && day > GAYLORD_LAST_HIRE) return [say('gaylord', 'Still afloat, Captain? Somebody must be playing your hand for you.')];
  if (day <= GAYLORD_LAST_HIRE)
    return [say('gaylord', 'Gaylord Montague Esquire, Captain. I play at Davenport of a noon, on behalf of those who’d rather not. You’ll find me at breakfast.')];
  if (day <= GAYLORD_LAST_DAY) return [say('gaylord', 'Bingo, Captain. She said bingo. To me.')];
  return [
    say('gaylord', ['You missed a fine week at Davenport. She threatened me with her aunt, you know.', 'A cracking bingoist, I’m told. I shan’t be going back.']),
    say('gaylord', ['My clients? Pitiful men, lacking the skill and courage even to lose convincingly at poker. Bah, good riddance.', 'They’ll come back down past here soon enough, and then I will fleece them again, and they deserve it, the parasites.']),
  ];
}
