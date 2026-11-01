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
export function flyCoin(
  from: DOMRect,
  to: DOMRect,
  delay: number,
  { className = 'flying-coin', restIn, duration = 520 }: { className?: string; restIn?: HTMLElement; duration?: number } = {},
): Promise<HTMLElement | null> {
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
    { duration, delay, easing: 'ease-in-out', fill: 'backwards' },
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
export function flyInto(from: Element, spot: HTMLElement, delay: number, className?: string, duration?: number) {
  spot.classList.add('landing');
  return flyCoin(from.getBoundingClientRect(), spot.getBoundingClientRect(), delay, { className, duration }).then(() => spot.classList.remove('landing'));
}

/** Every coin in the air lands at once (a tap to hurry the table along). */
export function landAll() {
  for (const a of document.getAnimations()) {
    const target = (a.effect as KeyframeEffect | null)?.target;
    if (target instanceof HTMLElement && target.classList.contains('flying-coin')) a.finish();
  }
}
