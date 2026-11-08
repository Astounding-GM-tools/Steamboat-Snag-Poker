/**
 * An obstacle's routine, honed like a comedian's: the lines it has, sorted by
 * the job they do, so each can be judged on its own and only the good ones
 * kept. Sandy has one; the Rapids' stages, the Deadheads and the Fog Bank can
 * too. Its talk function decides when (which hand, which trigger); these
 * decide what.
 */
import { Rng } from '../../engine/rng';
import type { SpeechLine } from '../../ui/Speech.svelte';

/** A line the Captain answers on the buttons; an answer may get a comeback, or simply deal. */
export interface Round {
  text: string | string[];
  answers: { label: string; comeback?: string }[];
}

export interface Routine {
  /** Who says it all. */
  who: string;
  /** The first time you meet. */
  opening: string | string[];
  /** Each morning after: in order, and the last one repeats (one good one beats three middling). */
  mornings: string[];
  /** Before a round, now and then, in rotation. */
  rounds: Round[];
  /** The one-liners, at random, never twice in a day. When they run out, silence: no filler. Aim for a dozen. Two parts are a setup and its punchline, a beat apart. */
  quips: (string | string[])[];
  /** Said at the start of the day's last round. */
  lastCall?: string;
  /** When you've cleared it. */
  cleared?: string;
  /** When it has beaten you for the day. */
  beaten?: string;
}

const line = (who: string, text: string | string[]): SpeechLine => ({ size: 'scene', who, text });

/** The morning line for this attempt (the second day is the first morning). */
export function morningLine(r: Routine, attempt: number): SpeechLine {
  return line(r.who, r.mornings[Math.min(attempt - 2, r.mornings.length - 1)]);
}

/** The round for the nth time it comes up, with its answers, and the comebacks they get. */
export function roundLines(r: Routine, n: number): SpeechLine[] {
  const round = r.rounds[n % r.rounds.length];
  const lines: SpeechLine[] = [
    { ...line(r.who, round.text), replies: round.answers.map((a, i) => ({ label: a.label, ...(a.comeback ? { go: `answer-${i}` } : { end: true }) })) },
  ];
  round.answers.forEach((a, i) => {
    if (a.comeback) lines.push({ ...line(r.who, a.comeback), id: `answer-${i}`, branch: true });
  });
  return lines;
}

/**
 * The one-liner for a slot in the day (0, 1, 2…), from one shuffle of the
 * voyage: never twice in a day, each day starting somewhere new. Null once the
 * day has had them all.
 */
export function quipFor(r: Routine, seed: number, attempt: number, slot: number): string | string[] | null {
  if (slot < 0 || slot >= r.quips.length) return null;
  const order = new Rng(seed).shuffle(r.quips);
  return order[((attempt - 1) * 5 + slot) % order.length];
}
