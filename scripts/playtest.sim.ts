/**
 * The playtest bot, run: plays chapter one many times with each persona and writes every run's record
 * (src/story/sim/playtest.ts) as JSON, for the report (docs/playtest-2026-11-17.md).
 *   npm run sim -- scripts/playtest.sim.ts
 *   PLAYTEST_SEEDS=200 PLAYTEST_FROM=1 PLAYTEST_PERSONAS=careful,novice PLAYTEST_OUT=runs.json npm run sim -- scripts/playtest.sim.ts
 *   PLAYTEST_TYPING=1: the old rule, the river quiet while Willie types (the UI until 2026-11-17).
 *   PLAYTEST_TUNE='{"sandbar":{"money":24}}': encounters changed, to try a tuning.
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { RIVER } from '../src/story/river';
import { ITEMS } from '../src/story/mechanics';
import { PERSONAS, playVoyage, tuned, type PersonaId, type RunRecord, type Tuning } from '../src/story/sim/playtest';

const SEEDS = Number(process.env.PLAYTEST_SEEDS ?? 50);
const FROM = Number(process.env.PLAYTEST_FROM ?? 1);
const NAMES = (process.env.PLAYTEST_PERSONAS ?? 'careful,loose,novice,reckless,savvy').split(',') as PersonaId[];
const OUT = process.env.PLAYTEST_OUT ?? 'playtest-runs.json';
const TYPING = process.env.PLAYTEST_TYPING === '1';
/** Tuning to try, as JSON by encounter id: PLAYTEST_TUNE='{"sandbar":{"money":24},"longReach":{"money":45}}'. */
const TUNE: Tuning | null = process.env.PLAYTEST_TUNE ? JSON.parse(process.env.PLAYTEST_TUNE) : null;
/** River tuning to try: PLAYTEST_FLOOR=9 (no debris at or below that strength; the game's is DEBRIS_FLOOR). */
const FLOOR = process.env.PLAYTEST_FLOOR ? Number(process.env.PLAYTEST_FLOOR) : undefined;
const DAYS = Number(process.env.PLAYTEST_DAYS ?? 40);
const story = TUNE ? tuned(RIVER, TUNE) : RIVER;
/** A shop price to try: PLAYTEST_PRICE='{"boilerOverhaul":30}' (ITEMS is plain data, changed for this run only). */
if (process.env.PLAYTEST_PRICE) for (const [id, price] of Object.entries(JSON.parse(process.env.PLAYTEST_PRICE) as Record<string, number>)) ITEMS[id].price = price;

it('playtest', { timeout: 6 * 3_600_000 }, () => {
  const runs: RunRecord[] = [];
  for (const name of NAMES) {
    const t0 = performance.now();
    for (let seed = FROM; seed < FROM + SEEDS; seed++) runs.push(playVoyage(seed, PERSONAS[name], { typing: TYPING, story, debrisFloor: FLOOR, maxDays: DAYS }));
    console.error(`${name}: ${SEEDS} voyages, ${((performance.now() - t0) / SEEDS).toFixed(0)} ms each`);
  }
  writeFileSync(OUT, JSON.stringify(runs));
});
