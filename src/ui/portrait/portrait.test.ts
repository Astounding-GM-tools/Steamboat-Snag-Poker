import { describe, expect, it } from 'vitest';
import { FACES } from './faces';
import { hat, type HatSpec } from './hats';

const head = { width: 28, top: 12, jaw: 86, chin: 22, bottom: 90 };
/** The head's edge at height y, as hats.ts works it out (its left side). */
function edgeAt(y: number) {
  const k = (46 - y) / (3 * (46 - head.top));
  const t = (1 - Math.sqrt(1 - 4 * k)) / 2;
  return 50 - head.width + 2 * head.width * (3 * t * t - 2 * t * t * t);
}
const start = (d: string) => d.match(/^M(-?[\d.]+) (-?[\d.]+)/)!.slice(1).map(Number);

describe('hats', () => {
  const kinds: HatSpec['kind'][] = ['beanie', 'flat', 'soft', 'bowler', 'top', 'porkpie', 'boater'];
  it.each(kinds)('a %s opens onto the head at its band, a little outside the head', (kind) => {
    const [x, y] = start(hat(head, { kind, band: 32 })[0].d);
    expect(y).toBe(32);
    expect(x).toBeLessThan(edgeAt(32));
    expect(x).toBeGreaterThan(edgeAt(32) - 3);
  });

  it("an officer's cap opens onto the head above its band (the band goes round it)", () => {
    const [x, y] = start(hat(head, { kind: 'officer', band: 32 })[0].d);
    expect(y).toBe(27);
    expect(x).toBeGreaterThan(edgeAt(27) - 3);
  });

  it('a tilted hat turns about the middle of the head', () => {
    for (const part of hat(head, { kind: 'bowler', band: 32, tilt: 8 })) expect(part.tilt).toEqual([8, 50, 52]);
  });

  it('room for hair widens the opening', () => {
    const [x] = start(hat(head, { kind: 'officer', band: 32, fit: 6 })[0].d);
    const [plain] = start(hat(head, { kind: 'officer', band: 32 })[0].d);
    expect(x).toBeLessThan(plain);
  });
});

describe('the cast', () => {
  it.each(Object.entries(FACES))('%s draws: every path is numbers, its eyes on its head', (_, face) => {
    for (const part of face.parts ?? []) expect(part.d).not.toMatch(/NaN|undefined/);
    expect(face.blink).toBeGreaterThan(0);
    expect(face.temper).toBeGreaterThanOrEqual(0);
    if ('width' in face.head) expect(face.eyes.gap + face.eyes.rx).toBeLessThan(face.head.width);
  });
});
