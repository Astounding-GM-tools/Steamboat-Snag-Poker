/**
 * Pot mode (draw style): there are no fixed payouts. Everyone antes in, pays a
 * small fee to see the Turn and the River, and pays for every card they throw
 * away; the winner takes the pot.
 */
import type { RulesConfig } from './config';

/** The table ante for a crossing: ceil(crossing / anteEvery), not counting the crossings in `antePast`. */
export function baseAnte(config: RulesConfig, month: number): number {
  return Math.ceil((month - (config.antePast ?? 0)) / (config.anteEvery || 3));
}

/** A captain's ante: the table ante (times the stakes) plus upkeep for every snag they carry (not raised by the stakes). */
export function anteFor(config: RulesConfig, month: number, jokers: number, stakes = 1): number {
  return baseAnte(config, month) * stakes + jokers * config.drainPerJoker;
}

/** Fee to see the next street (1 = Turn, 2 = River): the table ante (times the stakes) over a divisor. */
export function streetFee(config: RulesConfig, month: number, nextStreet: number, stakes = 1, divisors = config.streetFeeDivisors ?? [3, 2]): number {
  const divisor = divisors[nextStreet - 1];
  return divisor ? Math.floor((baseAnte(config, month) * stakes) / divisor) : 0;
}

/** Throwing away cards gets dearer: the k-th card in a crossing costs $k. */
export function discardCost(alreadyDiscarded: number, count: number): number {
  let cost = 0;
  for (let i = 1; i <= count; i++) cost += alreadyDiscarded + i;
  return cost;
}
