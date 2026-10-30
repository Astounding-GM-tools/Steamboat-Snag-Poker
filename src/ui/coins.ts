/**
 * Coins in flight, between a purse and the pot. A coin's spot at the other end
 * is laid out already, hidden (`.landing`), and shows the moment the flying
 * coin lands on it, so the stacks fill coin by coin.
 */
import { clink } from './clink';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One coin from one spot on screen to another, in an arc; resolves when it
 * lands (with a clink). `stay` leaves it there, as a loose coin on the table,
 * and the caller removes it later.
 */
export function flyCoin(from: DOMRect, to: DOMRect, delay: number, { className = 'flying-coin', stay = false } = {}): Promise<HTMLElement | null> {
  const coin = document.createElement('span');
  coin.className = className;
  Object.assign(coin.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.append(coin);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = to.width / from.width;
  const anim = coin.animate(
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 24}px) scale(${(1 + scale) / 2 + 0.15})`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
    ],
    { duration: 520, delay, easing: 'ease-in-out', fill: 'backwards' },
  );
  return anim.finished.then(
    () => {
      clink();
      if (!stay) {
        coin.remove();
        return null;
      }
      Object.assign(coin.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, transform: 'none' });
      anim.cancel();
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

/** Where the n-th loose coin comes to rest on a purse: on its stacks in turn, each round half a coin higher. */
export function restingSpot(tops: DOMRect[], n: number): DOMRect | null {
  if (!tops.length) return null;
  const top = tops[n % tops.length];
  const step = top.height * 0.5;
  return new DOMRect(top.left, top.top - step * (1 + Math.floor(n / tops.length)), top.width, top.height);
}
