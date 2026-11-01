import type { Action, ArrangedHand } from '../engine';
import type { SpeechLine } from '../ui/Speech.svelte';
import type { RoundScript } from './script';

/**
 * Morag's lesson on the hands: one round of the tutorial (offered after round
 * two, skippable), the deck openly rigged, her cards face up, climbing the
 * ladder street by street. The Flop shows the weak hands (high card, a pair,
 * her two pair); she rifles the deck for cards that suit you, and herself;
 * the Turn pairs the board and shows the middling ones (your flush over her
 * straight, her three twos); you give up the flush to hunt the house; the
 * River shows the big ones (your full house and four of a kind over her full
 * house). See docs/tutorial.md.
 *
 *   The Flop 2♥ 3♣ 4♥. You A♥ 7♠ 4♣; Morag 2♠ 4♦ K♣.
 *   Swaps: you 7♠ 4♣ for 5♥ 6♥; she 4♦ K♣ for 5♠ 6♣.
 *   The Turn 2♦. You swap 5♥ 6♥ for 3♦ 3♠.
 *   The River 3♥. You lay 3♦ 3♠ (four threes); she lays 2♠ (twos full of threes).
 */
const STAND_PAT: Action = { type: 'draw', cardIds: [] };

/** The rigged deal, in the order the cards come off the deck: the Flop, the hole cards (you first), the Flop's swaps (yours, then hers), the Turn, your Turn swap, the River. */
export const handsDeal: ArrangedHand = {
  deck: ['2h', '3c', '4h', 'Ah', '2s', '7s', '4d', '4c', 'Kc', '5h', '6h', '5s', '6c', '2d', '3d', '3s', '3h'],
  opponent: [{ type: 'draw', cardIds: ['4d', 'Kc'] }, STAND_PAT, { type: 'compose', cardIds: ['2s'], jokers: 0 }],
};

const M = 'morag';
/** Her lines sit between her cards and the board: both in view, and yours below. Room for four rows or so: one thought a line. */
const say = (line: Omit<SpeechLine, 'who' | 'size'> & Partial<SpeechLine>): SpeechLine => ({ size: 'scene', who: M, at: 'band', ...line });

/**
 * The lesson's lines. Where the answer is a card, you tap it and the button
 * names what it makes (`names`): shown, not played. After the hand, `after`
 * (the tutorial's way on to the snags).
 */
export function handsRound(after: SpeechLine[]): RoundScript {
  return {
    flop: [
      say({ text: 'Hands it is, then. I’ll rig the deck, and I’ll play open: you see my cards, I see yours.', show: true, replies: [{ label: 'Yes, ma’am' }] }),
      say({ text: 'We share the cards in the middle. See your ace?', names: ['Ah'], replies: [{ label: 'High card' }] }),
      say({ text: 'That’s the high card. If you play that and I play my king, you win.' }),
      say({ text: 'But I can play my deuce instead, and have a pair. Any pair beats any high card. So what do you do?', names: ['4c'], replies: [{ label: 'Pair' }] }),
      say({ text: 'Right: you play the four. Your pair of fours beats my pair of deuces.', replies: [{ label: 'Ducks!' }] }),
      say({ text: 'Exactly: a pair of deuces is called ducks. Well done.' }),
      say({ text: 'But I have a four too. And two pair beats one pair. So what do you do?', replies: [{ label: 'Swap?' }] }),
      say({ text: 'That’s right. These are all weak hands.' }),
      say({ size: 'aside', text: 'Let me rifle the deck for something that suits you better. Throw away the seven and the four.', require: ['7s', '4c'] }),
    ],
    turn: [
      say({ text: 'And for me… a five, a six. That will do nicely.' }),
      say({ text: 'Oh, another deuce. With my deuce, I can count three alike.' }),
      say({ text: 'We call that three of a kind, or trips, and it beats two pair.' }),
      say({ text: 'But I can do better. Now I can count from two to six, do you see it? Two, three, four in the middle, and five and six in my hand.' }),
      say({ text: 'When the cards run in a row like that, it’s called a straight.', replies: [{ label: 'Right.' }] }),
      say({ text: 'And so can you, because an ace can also count as a one and start a run.', names: ['Ah', '5h'], replies: [{ label: 'Straight' }] }),
      say({ text: 'Exactly. That straight is called the wheel, and since its highest card is a five, it doesn’t beat my straight.' }),
      say({ text: 'So you must try something else.', names: ['Ah', '5h', '6h'], replies: [{ label: 'Flush' }] }),
      say({ text: 'That’s right! Five cards of the same suit are called a flush, and a flush beats any straight.', replies: [{ label: 'I win?' }] }),
      say({ text: 'Not yet. See the pair on the board?', replies: [{ label: 'Ducks' }] }),
      say({ text: 'With a pair in the middle, someone could easily have a full house: a pair and a three of a kind together.' }),
      say({ text: 'A full house beats every hand we have now, pretty as they are.', replies: [{ label: 'I lose?' }] }),
      say({ text: 'Most likely, unless you give up the hand you’ve got. A flush is a decent hand, but often not good enough with a pair in the middle.' }),
      // She deals you the threes without a word: yours to notice.
      say({ size: 'aside', text: 'Throw away the five and the six. I’ll find you something better still.', require: ['5h', '6h'] }),
    ],
    river: [
      say({ text: 'Oh! Two pair on the board now. Do you see them?', replies: [{ label: 'Crabs over ducks' }] }),
      say({ text: 'Very good! So everyone at the table has two pair now. Tap one of your threes. What do you have now?', names: ['3'], replies: [{ label: 'Full house!' }] }),
      say({ text: 'Exactly! And so do I: ducks full of crabs. Whose hand is stronger?', replies: [{ label: 'Yours', go: 'weaker' }, { label: 'Mine', go: 'stronger' }] }),
      say({ id: 'weaker', branch: true, text: 'No: mine is weaker. Your house has three threes; mine only three deuces. The bigger three wins.', replies: [{ label: 'I win?', go: 'better' }] }),
      say({ id: 'stronger', branch: true, text: 'You are right: your house is stronger.', replies: [{ label: 'I win?', go: 'better' }] }),
      say({ id: 'better', branch: true, text: 'You do, but you have an even stronger hand waiting for you. Do you see it?', names: ['3', '3'], replies: [{ label: 'Four of a kind' }] }),
      say({ text: 'Exactly. Four alike, also called quads, is the strongest hand on this board.', replies: [{ label: 'Strongest?' }] }),
      say({ text: 'Well, there are also straight flushes: all the numbers in a row, and in the same suit. Exceedingly rare, so it does not pay to chase them.' }),
      // How it works has them all, best first: she points at the "?" (over your side, so it stays in view), and the lesson goes on once it's been opened and closed.
      say({ at: 'low', text: 'And those are the hands. In case you forget, they’re ranked in How it works: open the question mark and see.', require: 'help' }),
      say({ size: 'aside', text: 'Now play your four threes.', require: ['3', '3'] }),
    ],
    verdict: [say({ text: 'Four threes beat my full house. Now you know your hands.', replies: [{ label: 'Thank you, ma’am' }] }), ...after],
  };
}
