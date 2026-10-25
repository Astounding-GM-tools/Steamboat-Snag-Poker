import type { SpeechLine } from '../ui/Speech.svelte';

/**
 * When a round's lines are spoken: before the deal (the deal waits for them),
 * as each street is dealt (`river` is when hands are made), and after the
 * verdict, when you move on from it (the showdown stays in view until then).
 */
export type Trigger = 'deal' | 'flop' | 'turn' | 'river' | 'verdict';

/** A round's conversation, by trigger. Each fires once. */
export type RoundScript = Partial<Record<Trigger, SpeechLine[]>>;

/** A story's rounds, the first first; `later` for every round after those. */
export interface Script {
  rounds: RoundScript[];
  later?: RoundScript;
}

/** The lines for a round of a story. */
export function roundScript(script: Script | undefined, month: number): RoundScript | undefined {
  return script && (script.rounds[month - 1] ?? script.later);
}
