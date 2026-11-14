/**
 * Every snag's nature, in one place (see docs/story.md, "Where snags go").
 * A snag card is only an index (`jokerCard(i)`, named by `joker.<i>` in the
 * dictionary); what it is, when it helps and who fixes it is read from here,
 * generically: nothing elsewhere asks "is this the mule?". A new snag is a
 * new row.
 *
 * The League uses none of this: there a snag is a snag. The story reads it.
 */
import type { JokerCard } from '../../engine/cards';

export type SnagKind =
  /** Volunteers on the river: people and animals. */
  | 'person'
  | 'animal'
  /** Never help: things, obligations, and what the river leaves broken. */
  | 'object'
  | 'duty'
  | 'trouble';

export interface SnagDef {
  index: number;
  kind: SnagKind;
  /**
   * Its temper, against an obstacle: the hands of the day (1, 2, 3…) it
   * volunteers in, giving back any pot lost then. `'random'`: one hand,
   * drawn each day. Missing: it never helps.
   */
  helps?: { from: number; to: number } | 'random';
  /** The crew member who fixes it: handed to anyone at the deck game, it ends up with them, and it's gone. */
  fixer?: string;
  /** Where it belongs: stopping there resolves it. */
  address?: string;
}

/** The set, by index. The first twelve are the League's snags too, then the lessons' two; the troubles follow. */
export const SNAGS: SnagDef[] = [
  { index: 0, kind: 'object' }, // the Barrel of Rotten Eggs
  { index: 1, kind: 'person', helps: { from: 1, to: 1 } }, // the In-Laws: supportive, elderly, tuckered out after the first
  { index: 2, kind: 'person', helps: { from: 1, to: 1 } }, // the Layabout Nephew: helps first, then finds somewhere to lie down
  { index: 3, kind: 'person', helps: { from: 3, to: 6 } }, // the Unionized Coal Shoveller: slow to start, home at the whistle
  { index: 4, kind: 'object' }, // the Stinking Hides
  { index: 5, kind: 'person', helps: { from: 3, to: 3 } }, // the Travelling Preacher: on the third (the Trinity)
  { index: 6, kind: 'duty' }, // the Mail Run
  { index: 7, kind: 'animal', helps: { from: 6, to: 8 }, address: 'podunk' }, // the Runaway Mule: won't go first, then sticks it out
  { index: 8, kind: 'object' }, // the Sandbar (a League snag; in the story an obstacle)
  { index: 9, kind: 'object' }, // the Fog Bank (likewise)
  { index: 10, kind: 'animal', helps: 'random' }, // the Crate of Live Chickens
  { index: 11, kind: 'duty' }, // the Unpaid Coal Bill
  // Morag's lessons' own: reputations, lived down by passing them on.
  { index: 12, kind: 'duty' }, // Grudging Respect
  { index: 13, kind: 'duty' }, // the Solemn Oath
  // Troubles: what the river leaves behind, to be fixed.
  { index: 14, kind: 'trouble', fixer: 'lars' }, // the Broken Pole
  { index: 15, kind: 'trouble', fixer: 'gus' }, // the Twisted Crankshaft
  { index: 16, kind: 'trouble', fixer: 'lars' }, // the Broken Paddle
  { index: 17, kind: 'trouble', fixer: 'gus' }, // the Busted Boiler
  { index: 18, kind: 'trouble', fixer: 'willie' }, // Fatigue
  { index: 19, kind: 'trouble', fixer: 'willie' }, // the Broken Heart
  // Bills and the like: the story's own duties.
  { index: 20, kind: 'duty' }, // the Dock Fee
  { index: 21, kind: 'duty' }, // Pamphlet Distribution
  { index: 22, kind: 'duty' }, // the Strike Support Button
  // More troubles.
  { index: 23, kind: 'trouble' }, // On the Rocks (a scraped hull): no trade of its own, whoever gets it mends it
  // What the debris on the river leaves her with (a sawyer, a deadhead, a drift pile), one at a time.
  { index: 24, kind: 'trouble', fixer: 'lars' }, // a Stove-in Plank
  { index: 25, kind: 'trouble', fixer: 'willie' }, // a Fouled Rudder: the man at the wheel clears it
  { index: 26, kind: 'trouble', fixer: 'lars' }, // a Fouled Wheel: the paddlewheel, choked with brush
  { index: 27, kind: 'trouble', fixer: 'gus' }, // a Sprung Plank: Gus caulks it, grumbling
  { index: 28, kind: 'trouble', fixer: 'willie' }, // Scraped Paint: Willie and a brush
];

export const TROUBLE = {
  brokenPole: 14,
  twistedCrankshaft: 15,
  brokenPaddle: 16,
  bustedBoiler: 17,
  fatigue: 18,
  brokenHeart: 19,
  onTheRocks: 23,
  stoveInPlank: 24,
  fouledRudder: 25,
  fouledWheel: 26,
  sprungPlank: 27,
  scrapedPaint: 28,
} as const;

/** What a piece of debris can do to her: one of these, if it gets the better of the hand. */
export const DEBRIS_TROUBLES = [TROUBLE.stoveInPlank, TROUBLE.fouledRudder, TROUBLE.fouledWheel, TROUBLE.sprungPlank, TROUBLE.scrapedPaint] as const;

export const DOCK_FEE = 20;
export const PAMPHLETS = 21;
export const STRIKE_BUTTON = 22;

export function snagDef(index: number): SnagDef {
  return SNAGS[index] ?? { index, kind: 'object' };
}

/** Every trouble (by index). Handed to anyone in the crew, it gets to whoever fixes it. */
export const TROUBLES = SNAGS.filter((s) => s.kind === 'trouble').map((s) => s.index);

/** Does this snag volunteer in this hand of the day? (`random`: the hand drawn for it today.) */
export function helpsIn(snag: JokerCard, hand: number, randomHand: number): boolean {
  const h = snagDef(snag.index).helps;
  if (!h) return false;
  return h === 'random' ? hand === randomHand : hand >= h.from && hand <= h.to;
}

/** The hands of the day covered by any of these snags (one volunteer is enough for a hand). */
export function coveredHands(snags: JokerCard[], hands: number, randomHand: number): number[] {
  return Array.from({ length: hands }, (_, k) => k + 1).filter((hand) => snags.some((s) => helpsIn(s, hand, randomHand)));
}
