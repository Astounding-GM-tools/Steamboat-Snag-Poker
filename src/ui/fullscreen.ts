/**
 * Full screen on a phone: the browser's own bars (Android Chrome's address
 * bar above, its toolbar below) take room the table needs, and can push the
 * two buttons off the bottom of the screen. A browser only goes full screen
 * when asked in answer to a tap, so the first tap does it, and the first tap
 * after it dropped out (the phone slept, the app was switched away) does it
 * again. Not on a computer, where a click shouldn't take the whole screen;
 * and not when the player has turned it off (Options).
 */
import { settings } from './settings.svelte';

/** A phone or tablet: a finger, not a mouse. */
const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/** Full screen is possible here (iPhone Safari, for one, has no full screen for pages). */
export const canFullscreen = () => typeof document !== 'undefined' && !!document.fullscreenEnabled && touch();

function enter(e?: Event) {
  if (!settings.fullscreen || !canFullscreen() || document.fullscreenElement) return;
  // The tap that turns it off doesn't turn it on first.
  if (e?.target instanceof Element && e.target.closest('[data-no-fullscreen]')) return;
  document.documentElement
    .requestFullscreen({ navigationUI: 'hide' })
    // A portrait game: where the browser allows it (Android, in full screen), the screen stays upright.
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('portrait'))
    .catch(() => {});
}

/** From now on, a tap goes full screen when it isn't. */
export function keepFullscreen() {
  document.addEventListener('pointerup', enter, { capture: true });
}

/** Turned on or off in Options (a tap, so it may go full screen at once). */
export function setFullscreen(on: boolean) {
  settings.fullscreen = on;
  if (on) enter();
  else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
