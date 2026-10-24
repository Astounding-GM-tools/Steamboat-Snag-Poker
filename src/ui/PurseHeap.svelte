<script lang="ts">
  import { untrack } from 'svelte';
  import { dollars } from './format';

  /**
   * The Captain's purse: the amount, and a big untidy heap of coins of every
   * size beside it. It is a feeling more than a count: a fat heap when you're in
   * the money, a few coins when you're struggling, and when it gets thin, the
   * comic-strip signs of an empty purse (cobwebs, a lost button, pocket lint,
   * and at the very end, flies). Those are the only low-funds warning.
   */
  let { amount, label }: { amount: number; label?: string } = $props();

  /** Below this the purse looks thin; below DIRE it looks empty. */
  const SERIOUS = 40;
  const DIRE = 10;
  const MAX_PIECES = 90;
  const shown = $derived(Math.max(0, amount));
  const count = $derived(Math.min(MAX_PIECES, Math.ceil(shown / 2.5)));
  const mood = $derived(amount < DIRE ? 'dire' : amount < SERIOUS ? 'serious' : 'fine');

  /** A fixed random number per coin and purpose, so a coin never moves once it lands. */
  function rand(k: number, salt: number): number {
    let h = Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 13;
    return ((h >>> 0) % 10000) / 10000;
  }

  const KINDS = ['big', 'big', 'mid', 'mid', 'mid', 'small', 'small', 'upright'] as const;
  /** A heap fills its mound as coins arrive: the first coins lie flat, later ones pile higher. */
  const FULL_HEAP = 30;
  /** The mound widens as it grows, so coins always overlap like a real heap. */
  const spread = $derived(Math.min(100, 28 + count * 1.6));
  const pieces = $derived(
    Array.from({ length: count }, (_, k) => {
      const x = (rand(k, 1) + rand(k, 2)) / 2; // bunched towards the middle
      const mound = 1 - Math.abs(2 * x - 1) ** 1.6;
      const fill = Math.min(1, Math.sqrt((k + 1) / FULL_HEAP));
      return {
        k,
        kind: KINDS[Math.floor(rand(k, 3) * KINDS.length)],
        x: x * spread,
        y: mound * fill * rand(k, 4) ** 0.6 * 58, // all through the mound, a little top-heavy
        tilt: Math.round(rand(k, 5) * 50 - 25),
      };
    }).sort((a, b) => a.y - b.y || a.k - b.k), // the top of the heap is drawn last
  );

  // Coins that just arrived drop in; when the purse shrinks they simply go.
  let freshFrom = $state(Infinity);
  let last: number | null = null;
  $effect(() => {
    const now = count;
    untrack(() => {
      if (last !== null && now > last) {
        freshFrom = last;
        setTimeout(() => (freshFrom = Infinity), 900);
      }
      last = now;
    });
  });
</script>

<div class="purse {mood}" aria-label={label ? `${label} ${dollars(amount)}` : dollars(amount)}>
  <span class="amount">{dollars(amount)}</span>
  <div class="heap" aria-hidden="true">
    {#if mood !== 'fine'}
      <svg class="web" viewBox="0 0 40 40">
        <path d="M0 0 L40 40 M0 0 L20 40 M0 0 L40 20 M0 0 L8 40 M0 0 L40 8" />
        <path d="M0 12 Q6 6 12 0 M0 22 Q11 11 22 0 M0 32 Q16 16 32 0" />
      </svg>
      <svg class="button" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" />
        <circle cx="7" cy="7" r="1.6" /><circle cx="13" cy="7" r="1.6" /><circle cx="7" cy="13" r="1.6" /><circle cx="13" cy="13" r="1.6" />
      </svg>
      <svg class="lint" viewBox="0 0 30 12"><path d="M1 8 C5 1 8 11 12 5 S19 1 22 7 S27 10 29 4" /></svg>
    {/if}
    {#if mood === 'dire'}
      {#each [0, 1, 2] as f}
        <svg class="fly f{f}" viewBox="0 0 12 10"><ellipse class="wing" cx="4" cy="3" rx="3" ry="2" /><ellipse class="wing" cx="8" cy="3" rx="3" ry="2" /><ellipse cx="6" cy="6" rx="2.2" ry="3" /></svg>
      {/each}
    {/if}
    {#each pieces as p (p.k)}
      <span
        class="coin {p.kind}"
        class:fresh={p.k >= freshFrom}
        style="left: {p.x}%; bottom: {p.y}px; --tilt: {p.tilt}deg; --d: {(p.k - (freshFrom === Infinity ? 0 : freshFrom)) * 0.04}s"
      ></span>
    {/each}
  </div>
</div>

<style>
  .purse {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
  }
  /* Room for three figures, so the heap never moves when the amount changes. */
  .amount {
    flex: none;
    min-width: 4.2ch;
    font-family: var(--title-font);
    font-size: 1.6rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .serious .amount {
    color: var(--grey);
  }
  .dire .amount {
    color: var(--grey);
    text-decoration: underline wavy var(--grey);
    text-underline-offset: 5px;
  }
  .heap {
    position: relative;
    flex: 1;
    height: 72px;
    min-width: 0;
  }
  @media (max-height: 740px) {
    .heap {
      height: 56px;
    }
  }
  .coin {
    position: absolute;
    display: block;
    transform: translateX(-50%) rotate(var(--tilt));
    border: 1px solid #111;
  }
  /* Coins lying flat, seen at an angle: big silver dollars down to small change. */
  .big {
    width: 28px;
    height: 9px;
    border-radius: 50%;
    background: linear-gradient(#fff, #a9a69e);
  }
  .mid {
    width: 21px;
    height: 7px;
    border-radius: 50%;
    background: linear-gradient(#e9e6dd, #8d8a83);
  }
  .small {
    width: 14px;
    height: 5px;
    border-radius: 50%;
    background: linear-gradient(#d6d3cb, #7a776f);
  }
  /* The odd coin standing on its edge, face out. */
  .upright {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fff, #8d8a83);
  }
  .fresh {
    animation: drop 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) var(--d) both;
  }
  @keyframes drop {
    from { transform: translate(-50%, -50px) rotate(var(--tilt)); opacity: 0; }
    to { transform: translateX(-50%) rotate(var(--tilt)); opacity: 1; }
  }

  /* An emptying purse. */
  .web {
    position: absolute;
    left: 0;
    top: 0;
    width: 40px;
    height: 40px;
    fill: none;
    stroke: var(--grey);
    stroke-width: 0.6;
    opacity: 0.7;
  }
  .button {
    position: absolute;
    left: 58%;
    bottom: 0;
    width: 14px;
    height: 14px;
    fill: #6d6a63;
    stroke: #111;
    stroke-width: 1;
  }
  .button circle + circle {
    fill: #111;
    stroke: none;
  }
  .lint {
    position: absolute;
    left: 30%;
    bottom: 1px;
    width: 26px;
    height: 10px;
    fill: none;
    stroke: var(--grey);
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .fly {
    position: absolute;
    width: 9px;
    height: 8px;
    fill: var(--grey);
    animation: buzz 3.2s ease-in-out infinite;
  }
  .fly .wing {
    fill: var(--paper);
    opacity: 0.6;
    animation: flap 0.08s linear infinite alternate;
  }
  .fly.f0 { left: 20%; bottom: 30px; }
  .fly.f1 { left: 50%; bottom: 44px; animation-duration: 2.6s; animation-delay: -1s; }
  .fly.f2 { left: 70%; bottom: 22px; animation-duration: 3.8s; animation-delay: -2s; }
  @keyframes buzz {
    0% { transform: translate(0, 0); }
    20% { transform: translate(18px, -10px); }
    40% { transform: translate(6px, 8px) scaleX(-1); }
    60% { transform: translate(-16px, -6px) scaleX(-1); }
    80% { transform: translate(-6px, 10px); }
    100% { transform: translate(0, 0); }
  }
  @keyframes flap {
    to { opacity: 0.15; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fly,
    .fly .wing,
    .fresh {
      animation: none;
    }
  }
</style>
