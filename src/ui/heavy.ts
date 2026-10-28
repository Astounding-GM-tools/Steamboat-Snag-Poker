/**
 * Heavy buttons: a choice has to be meant. On a row of action buttons, a press
 * must be held to commit (HOLD_MS): the button soaks up ink from where the
 * finger presses, like thin paper on an inkpad, and a stylised fingerprint is
 * left there, fading slowly, a patina on the controls. Let go early and the ink
 * drains away; nothing happens.
 *
 * Keys: hold ← for the left (black) button, → or Space or Return for the right
 * (white) one. A click that isn't a pointer press (a screen reader, a script,
 * the keyboard on a focused button) goes through at once: not everyone can hold.
 * In development, `?quick` in the address turns holding off.
 */

const HOLD_MS = 700;
/** Fingerprints a button keeps before the oldest is wiped off. */
const MAX_PRINTS = 5;
const QUICK = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('quick');
const SVG = 'http://www.w3.org/2000/svg';

/** A stylised fingerprint: broken concentric ridges round a little whorl, never quite the same twice. */
function fingerprint(x: number, y: number): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '-20 -24 40 48');
  svg.setAttribute('class', 'print');
  svg.style.left = `${x}px`;
  svg.style.top = `${y}px`;
  svg.style.setProperty('--turn', `${Math.round(Math.random() * 50 - 25)}deg`);
  for (let i = 0; i < 7; i++) {
    const ridge = document.createElementNS(SVG, 'ellipse');
    ridge.setAttribute('rx', String(2.4 + i * 2.5));
    ridge.setAttribute('ry', String(3.2 + i * 3));
    // Broken ridges: each ring is a dash pattern of its own.
    const len = 6 + Math.random() * 14;
    ridge.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${(1.5 + Math.random() * 3).toFixed(1)}`);
    ridge.setAttribute('stroke-dashoffset', String(Math.round(Math.random() * 20)));
    svg.append(ridge);
  }
  return svg;
}

export function heavy(row: HTMLElement) {
  if (QUICK) return;
  let pressed: { button: HTMLButtonElement; timer: ReturnType<typeof setTimeout>; key?: string } | null = null;

  /** The row's buttons, left to right, that can be pressed now. */
  const buttons = () =>
    [...row.children].filter(
      (el): el is HTMLButtonElement => el instanceof HTMLButtonElement && !el.disabled && getComputedStyle(el).visibility !== 'hidden',
    );

  function start(button: HTMLButtonElement, x: number, y: number, key?: string) {
    if (pressed || button.disabled) return;
    button.style.setProperty('--x', `${x}px`);
    button.style.setProperty('--y', `${y}px`);
    button.style.setProperty('--hold', `${HOLD_MS}ms`);
    // Far enough to reach the farthest corner from the press: the button is full exactly as the hold commits.
    const w = button.clientWidth;
    const h = button.clientHeight;
    // (Plus a margin for the ink's ragged edge.)
    button.style.setProperty('--reach', `${Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 10}px`);
    button.classList.add('holding');
    // The print stays, and fades, whatever happens next.
    const print = fingerprint(x, y);
    button.append(print);
    const prints = button.querySelectorAll('.print');
    if (prints.length > MAX_PRINTS) prints[0].remove();
    print.addEventListener('animationend', () => print.remove());
    pressed = { button, key, timer: setTimeout(() => commit(button), HOLD_MS) };
  }

  function release() {
    if (!pressed) return;
    clearTimeout(pressed.timer);
    pressed.button.classList.remove('holding');
    pressed = null;
  }

  function commit(button: HTMLButtonElement) {
    release();
    button.classList.add('committed');
    setTimeout(() => button.classList.remove('committed'), 250);
    navigator.vibrate?.(12);
    button.click(); // not a pointer click: it goes through
  }

  function down(e: PointerEvent) {
    const button = (e.target as Element).closest('button');
    if (!button || button.parentElement !== row || e.button !== 0) return;
    const r = button.getBoundingClientRect();
    start(button, e.clientX - r.left, e.clientY - r.top);
  }

  // A pointer's own click never acts: only a finished hold does (or a click that isn't a pointer's).
  function click(e: MouseEvent) {
    if (e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function keydown(e: KeyboardEvent) {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const focus = document.activeElement;
    // Space and Return belong to whatever has focus, unless that's nothing or this row.
    const free = !focus || focus === document.body || row.contains(focus);
    const list = buttons();
    const button =
      e.key === 'ArrowLeft' ? (list.length > 1 ? list[0] : undefined) : e.key === 'ArrowRight' || ((e.key === ' ' || e.key === 'Enter') && free) ? list.at(-1) : undefined;
    if (!button) return;
    e.preventDefault();
    start(button, button.clientWidth / 2, button.clientHeight / 2, e.key);
  }
  function keyup(e: KeyboardEvent) {
    if (pressed?.key === e.key) release();
  }

  row.classList.add('heavy');
  row.addEventListener('pointerdown', down);
  row.addEventListener('click', click, true);
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) row.addEventListener(type, release);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', release);
  return {
    destroy() {
      release();
      row.removeEventListener('pointerdown', down);
      row.removeEventListener('click', click, true);
      for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) row.removeEventListener(type, release);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', release);
    },
  };
}
