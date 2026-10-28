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

const HOLD_MS = 1200;
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

const STILL = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Paper grain: smooth noise, stretched along the fibres (wider than tall), two octaves; 0..1. */
function grain(w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const octave = (cw: number, ch: number, weight: number) => {
    const gw = Math.ceil(w / cw) + 2;
    const gh = Math.ceil(h / ch) + 2;
    const g = Float32Array.from({ length: gw * gh }, () => Math.random());
    const smooth = (t: number) => t * t * (3 - 2 * t);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const gx = i / cw;
        const gy = j / ch;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = smooth(gx - x0);
        const fy = smooth(gy - y0);
        const at = (x: number, y: number) => g[y * gw + x];
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
        out[j * w + i] += (top + (bottom - top) * fy) * weight;
      }
  };
  octave(9, 3, 0.65);
  octave(3, 2, 0.35);
  return out;
}

/**
 * Ink soaking into the button: a canvas over it (painted at half resolution and
 * smoothed up, for soft, organic edges). Each spot wets according to its
 * distance from the press plus the paper's grain, so the ink runs ahead along
 * the fibres and leaves pale islands it fills in last. `wet(t)` paints the tide
 * at 0..1; at 1 the button is soaked through.
 */
function soak(button: HTMLButtonElement, x: number, y: number) {
  const SCALE = 2;
  const w = Math.max(1, Math.ceil(button.clientWidth / SCALE));
  const h = Math.max(1, Math.ceil(button.clientHeight / SCALE));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.className = 'soak';
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(w, h);
  const paper = grain(w, h);
  const px = x / SCALE;
  const py = y / SCALE;
  const far = Math.hypot(Math.max(px, w - px), Math.max(py, h - py)) || 1;
  const score = new Float32Array(w * h);
  let top = 0;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      score[k] = (Math.hypot(i - px, j - py) / far) * 0.7 + paper[k] * 0.5;
      top = Math.max(top, score[k]);
    }
  for (let k = 0; k < score.length; k++) score[k] /= top; // the last spot wets exactly at 1
  const wet = (t: number) => {
    const d = image.data;
    for (let k = 0; k < score.length; k++) {
      const a = Math.max(0, Math.min(1, (t * 1.08 - score[k]) / 0.08)); // a soft, wet edge
      d[k * 4] = 242;
      d[k * 4 + 1] = 239;
      d[k * 4 + 2] = 230;
      d[k * 4 + 3] = a * 255;
    }
    ctx.putImageData(image, 0, 0);
  };
  return { canvas, wet };
}

export function heavy(row: HTMLElement) {
  if (QUICK) return;
  let pressed: {
    button: HTMLButtonElement;
    timer: ReturnType<typeof setTimeout>;
    key?: string;
    ink: ReturnType<typeof soak>;
    began: number;
    frame: number;
  } | null = null;

  /** The row's buttons, left to right, that can be pressed now. */
  const buttons = () =>
    [...row.children].filter(
      (el): el is HTMLButtonElement => el instanceof HTMLButtonElement && !el.disabled && getComputedStyle(el).visibility !== 'hidden',
    );

  function start(button: HTMLButtonElement, x: number, y: number, key?: string) {
    if (pressed || button.disabled) return;
    button.classList.add('holding');
    const ink = soak(button, x, y);
    button.append(ink.canvas);
    // The print stays, and fades, whatever happens next.
    const print = fingerprint(x, y);
    button.append(print);
    const prints = button.querySelectorAll('.print');
    if (prints.length > MAX_PRINTS) prints[0].remove();
    print.addEventListener('animationend', () => print.remove());
    const began = performance.now();
    const press = { button, key, ink, began, frame: 0, timer: setTimeout(() => commit(button), HOLD_MS) };
    pressed = press;
    // The tide rises with the hold: quick at first, slowing as it soaks into the last corners.
    const rise = () => {
      if (pressed !== press) return;
      const p = Math.min(1, (performance.now() - began) / HOLD_MS);
      ink.wet(STILL ? 1 : 1 - (1 - p) ** 1.6);
      if (p < 1) press.frame = requestAnimationFrame(rise);
    };
    rise();
  }

  /** Let go: the ink lifts (drains back, if the hold wasn't finished), and its canvas goes. */
  function release(soaked = false) {
    if (!pressed) return;
    const { button, ink, began, frame, timer } = pressed;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    button.classList.remove('holding');
    pressed = null;
    if (soaked || STILL) {
      ink.canvas.classList.add('lift');
      setTimeout(() => ink.canvas.remove(), 350);
      return;
    }
    const from = 1 - (1 - Math.min(1, (performance.now() - began) / HOLD_MS)) ** 1.6;
    const t0 = performance.now();
    const drain = () => {
      const q = Math.min(1, (performance.now() - t0) / 300);
      ink.wet(from * (1 - q));
      if (q < 1) requestAnimationFrame(drain);
      else ink.canvas.remove();
    };
    drain();
  }

  function commit(button: HTMLButtonElement) {
    pressed?.ink.wet(1);
    release(true);
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
  const letGo = () => release();
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) row.addEventListener(type, letGo);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', letGo);
  return {
    destroy() {
      release();
      row.removeEventListener('pointerdown', down);
      row.removeEventListener('click', click, true);
      for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) row.removeEventListener(type, letGo);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', letGo);
    },
  };
}
