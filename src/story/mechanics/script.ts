import type { SpeechLine } from '../../ui/Speech.svelte';
import type { JourneyState } from './journey';

/**
 * When a round's lines are spoken: before the deal (the deal waits for them),
 * as each street is dealt (`river` is when hands are made), and after the
 * verdict, when you move on from it (the showdown stays in view until then);
 * and `pat`, as you stand pat.
 */
export type Trigger = 'deal' | 'flop' | 'turn' | 'river' | 'verdict' | 'pat';

/** A round's conversation, by trigger. Each fires once. */
export type RoundScript = Partial<Record<Trigger, SpeechLine[]>>;

/** A story's rounds, the first first; `later` for every round after those. */
export interface Script {
  rounds: RoundScript[];
  later?: RoundScript;
}

/** What talk can turn on, hand by hand: the obstacle's pile, a seed for the day, who took on what this hand and fixed it, and the day. */
export interface TalkContext {
  hand: number;
  pile: number;
  seed: number;
  fixed: { id: string; snag: number }[];
  /** The day of the voyage. */
  day: number;
  /** This hand went to three of a kind or better. */
  trips: boolean;
  /** Lost at showdowns so far in this encounter, this hand included. */
  lost: number;
  /** You folded out of this hand. */
  foldedOut: boolean;
  /** You've been at this encounter before (the queue, day after day). */
  met: boolean;
  /** Which try at it this is (mornings on the bar). */
  attempt: number;
  /** The voyage as it stands: what's aboard, what's known. */
  journey: JourneyState;
}

/** An encounter's talk: set lines hand by hand, or worked out as the hand stands. */
export type Talk = Script | ((context: TalkContext) => RoundScript);

/** The lines for a round of a story. */
export function roundScript(script: Script | undefined, month: number): RoundScript | undefined {
  return script && (script.rounds[month - 1] ?? script.later);
}
