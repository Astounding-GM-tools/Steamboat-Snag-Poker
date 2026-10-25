/** Frames per second for the looping animations: a silent film's hand-cranked rate. */
const FPS = 18;

/**
 * Plays every endlessly looping CSS animation (film grain, flicker, the title scene, moths, shakes)
 * at FPS instead of the display's refresh rate. Each loop is paused and stepped by hand, so its
 * easing and timing are unchanged; the page just redraws 18 times a second rather than 60 or 120,
 * which keeps an idle screen from draining the battery. One-off animations (deals, coins) stay smooth.
 */
export function filmCadence() {
  const started = new WeakMap<Animation, number>();
  setInterval(() => {
    if (document.hidden) return;
    // Not document.timeline: it only moves when a frame is drawn, and with every loop paused none is.
    const now = performance.now();
    for (const anim of document.getAnimations()) {
      if (anim.effect?.getComputedTiming().iterations !== Infinity) continue;
      let t0 = started.get(anim);
      if (t0 === undefined) {
        t0 = now - ((anim.currentTime as number | null) ?? 0);
        started.set(anim, t0);
        anim.pause();
      }
      anim.currentTime = now - t0;
    }
  }, 1000 / FPS);
}
