/**
 * The Sandbar alone, re-simulated for tuning (docs/playtest-2026-11-17.md): how often a captain clears it on
 * the first try, by the strength they bring and the pile, the hands and the ante it's given.
 *   npm run sim -- scripts/sandbar-tuning.sim.ts
 */
import { appendFileSync } from 'node:fs';
import { it } from 'vitest';
import { chooseAction, viewFor } from '../src/engine/ai';
import { Rng } from '../src/engine/rng';
import { RIVER, RIVER_START } from '../src/story/river';
import { sandbar } from '../src/story/characters/sandy';
import { handDone, jumpTo, myMoveOwed, mySeatAt, newJourney, playEncounter, type EncounterDef } from '../src/story/mechanics';
import type { AiId } from '../src/engine/characters';

const N = Number(process.env.SANDBAR_N ?? 400);
const OUT = process.env.SANDBAR_OUT ?? 'sandbar-tuning.txt';

function firstTry(def: EncounterDef, strength: number, ai: AiId, seed: number): { cleared: boolean; left: number } {
  let s = newJourney(seed, RIVER, RIVER_START);
  s = jumpTo({ ...s, strength }, RIVER, [{ type: 'encounter', encounter: def, solved: [], stuck: true }]);
  const rng = new Rng(seed * 31 + 7);
  while (!s.encounter!.outcome) {
    const e = s.encounter!;
    if (e.session.phase === 'hand') s = playEncounter(s, myMoveOwed(s) ? chooseAction(ai, viewFor(e.session.round!, mySeatAt(e), e.session.config), e.session.config, rng) : null);
    else s = handDone(s, RIVER);
  }
  const e = s.encounter!;
  return { cleared: e.outcome === 'solved', left: e.session.seats.find((p) => p.id === 'sandbar')!.money };
}

it('sandbar tuning', () => {
  const pile = (def: EncounterDef, money: number): EncounterDef => ({ ...def, rivals: (def.rivals as Exclude<EncounterDef['rivals'], 'crew'>).map((r) => ({ ...r, money })) });
  const variants: [string, EncounterDef][] = [
    ['as built (pile 20, 4 hands, ante 2-3)', sandbar],
    ['pile 24', pile(sandbar, 24)],
    ['pile 28', pile(sandbar, 28)],
    ['3 hands', { ...sandbar, hands: 3 }],
    ['5 hands', { ...sandbar, hands: 5 }],
    ['ante from 1 (antePast 0)', { ...sandbar, rules: { ...sandbar.rules, antePast: 0 } }],
  ];
  const lines: string[] = [];
  for (const ai of ['careful', 'loose', 'stubborn', 'swashbuckler'] as AiId[])
    for (const strength of [18, 15, 12, 9])
      for (const [name, def] of variants) {
        if (ai !== 'careful' && name !== variants[0][0]) continue;
        let c = 0, left = 0;
        for (let k = 0; k < N; k++) {
          const r = firstTry(def, strength, ai, 1000 + k);
          if (r.cleared) c++;
          else left += r.left;
        }
        lines.push(`${ai}\t${strength}\t${name}\t${((100 * c) / N).toFixed(0)}%\tleft ${(left / Math.max(1, N - c)).toFixed(1)}`);
      }
  appendFileSync(OUT, lines.join('\n') + '\n');
});
