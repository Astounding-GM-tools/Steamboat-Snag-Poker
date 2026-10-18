import { it } from 'vitest';
import { DEFAULT_CONFIG, chooseAction, newGame, viewFor, Rng } from '../src/engine';

it('timing', () => {
  const rng = new Rng(1);
  for (const ai of ['sherlock', 'betty', 'willie'] as const) {
    let worst = 0, total = 0;
    for (let seed = 0; seed < 20; seed++) {
      const s = newGame(seed, DEFAULT_CONFIG);
      const t0 = performance.now();
      chooseAction(ai, viewFor(s.round!, 1), DEFAULT_CONFIG, rng);
      const dt = performance.now() - t0;
      worst = Math.max(worst, dt);
      total += dt;
    }
    console.error(`${ai}: avg ${(total / 20).toFixed(1)}ms, worst ${worst.toFixed(1)}ms (flop decision)`);
  }
});
