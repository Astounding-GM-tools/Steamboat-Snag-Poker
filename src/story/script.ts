import type { SpeechLine } from '../ui/Speech.svelte';

/**
 * When a round's lines are spoken: before the deal (the deal waits for them),
 * as each street is dealt (`river` is when hands are made), and after the
 * verdict, when you move on from it (the showdown stays in view until then).
 */
export type Trigger = 'deal' | 'flop' | 'turn' | 'river' | 'verdict';

/** A round's conversation, by trigger. Each fires once. */
export type RoundScript = Partial<Record<Trigger, SpeechLine[]>>;

/** A story's rounds, the first first. */
export type Script = RoundScript[];
