/**
 * Coins in flight, between a purse and the pot. A coin's spot at the other end
 * is laid out already, hidden (`.landing`), and shows the moment the flying
 * coin lands on it, so the stacks fill coin by coin.
 */
import { clink } from './clink';
import { flight } from './flight.svelte';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One coin from one spot on screen to another, in an arc; resolves when it
 * lands (with a clink). With `restIn` it stays, as a loose coin on that
 * element (a purse): placed inside it, so it moves with the table if the page
 * scrolls, and sits under whatever is drawn over the table. The caller
 * removes it later.
 */
export function flyCoin(from: DOMRect, to: DOMRect, delay: number, { className = 'flying-coin', restIn }: { className?: string; restIn?: HTMLElement } = {}): Promise<HTMLElement | null> {
  const coin = document.createElement('span');
  coin.className = className;
  Object.assign(coin.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.append(coin);
  flight.coins++;
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = to.width / from.width;
  // Where it comes to rest, measured from its resting place now: the two move together.
  const home = restIn?.getBoundingClientRect();
  const anim = coin.animate(
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 24}px) scale(${(1 + scale) / 2 + 0.15})`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
    ],
    { duration: 520, delay, easing: 'ease-in-out', fill: 'backwards' },
  );
  const landed = anim.finished.finally(() => flight.coins--);
  return landed.then(
    () => {
      clink();
      if (!restIn || !home) {
        coin.remove();
        return null;
      }
      coin.classList.add('resting');
      Object.assign(coin.style, { left: `${to.left - home.left}px`, top: `${to.top - home.top}px`, width: `${to.width}px`, height: `${to.height}px`, transform: 'none' });
      anim.cancel();
      restIn.append(coin);
      return coin;
    },
    () => {
      coin.remove();
      return null;
    },
  );
}

/** A coin flies to a spot that is laid out but hidden until it lands. */
export function flyInto(from: Element, spot: HTMLElement, delay: number, className?: string) {
  spot.classList.add('landing');
  return flyCoin(from.getBoundingClientRect(), spot.getBoundingClientRect(), delay, { className }).then(() => spot.classList.remove('landing'));
}

/** The tops of a purse's stacks, left to right: where winnings come to rest. */
export function stackTops(purse: HTMLElement): DOMRect[] {
  const tops = new Map<number, DOMRect>();
  for (const c of purse.querySelectorAll<HTMLElement>('[data-d]:not(.spent)')) {
    const r = c.getBoundingClientRect();
    const key = Math.round(r.left);
    if (!tops.has(key) || r.top < tops.get(key)!.top) tops.set(key, r);
  }
  return [...tops.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}

/** Layers of loose coins a purse's own stacks take before the rest start stacks of their own. */
const LAYERS = 6;
const NEW_STACK = 10;

/**
 * Where the n-th loose coin comes to rest on a purse (`purse`: its box on the
 * screen): on its stacks in turn, each round half a coin higher; after a few
 * rounds, in new stacks of ten beside them, and then in a row in front, so a
 * big pot spreads out on the table instead of towering.
 */
export function restingSpot(tops: DOMRect[], n: number, purse?: DOMRect): DOMRect | null {
  if (!tops.length) return null;
  const { width: w, height: h } = tops[0];
  const step = h * 0.5;
  if (n < tops.length * LAYERS || !purse) {
    const top = tops[n % tops.length];
    return new DOMRect(top.left, top.top - step * (1 + Math.floor(n / tops.length)), w, h);
  }
  const k = n - tops.length * LAYERS;
  const stack = Math.floor(k / NEW_STACK);
  const gap = w * 1.1;
  const floor = purse.bottom - h;
  // Beside the purse's own stacks while there's room; then a row in front, from the left.
  const beside = Math.floor((purse.right - w - tops[tops.length - 1].left) / gap);
  const left = stack < beside ? tops[tops.length - 1].left + (stack + 1) * gap : purse.left + ((stack - beside) % Math.max(1, Math.floor(purse.width / gap))) * gap;
  const front = stack < beside ? 0 : h * 0.8;
  return new DOMRect(left, floor + front - step * (k % NEW_STACK), w, h);
}
