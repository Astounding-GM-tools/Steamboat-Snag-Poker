<script lang="ts">
  import { untrack } from 'svelte';
  import { dollars } from './format';

  /**
   * A captain's money as coins on the table, one coin a dollar. It reads at a
   * glance: under $10 a few coins lie loose and the moths circle; under $50 a
   * small uneven pile; from $50, neat stacks of ten (the odd dollars in a short
   * stack on the left of the row); and every further $100 starts a new row in
   * front, staggered and filling in from the right, until the chip leader's
   * purse looks like a bank.
   */
  let {
    amount,
    size = 'big',
    showAmount = true,
    focus = 50,
    label,
  }: {
    amount: number;
    size?: 'big' | 'small';
    showAmount?: boolean;
    /** Where a small pile (and the moths) sits, in % across the purse; neat rows always fill from the right. */
    focus?: number;
    label?: string;
  } = $props();

  const DEPLETED = 10;
  const NEAT = 50;
  const ROW = 100;
  const MAX_ROWS = 4;
  const STACK = 10;

  const n = $derived(Math.max(0, Math.min(amount, ROW * MAX_ROWS)));
  const mood = $derived(amount < DEPLETED ? 'depleted' : amount < NEAT ? 'low' : 'rich');

  /** Coin size in px: width, how much each coin adds to a stack, and the step between stacks. */
  const dims = $derived(size === 'big' ? { w: 20, step: 3.2, gap: 22, rise: 9 } : { w: 13, step: 2, gap: 14, rise: 5 });

  /** A fixed random number per coin and purpose, so a coin keeps its place. */
  function rand(k: number, salt: number): number {
    let h = Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 13;
    return ((h >>> 0) % 10000) / 10000;
  }

  interface Coin {
    /** Order the coin arrived in (for the drop-in animation). */
    i: number;
    /** Offset from the centre of the purse in px (or, for neat rows, in from its right edge). */
    x: number;
    fromRight?: boolean;
    /** Height above the table, in px. */
    y: number;
    flat?: boolean;
    tilt?: number;
  }

  const coins = $derived.by((): Coin[] => {
    const { w, step, gap, rise } = dims;
    const out: Coin[] = [];
    if (mood === 'depleted') {
      // A handful of loose coins lying about.
      for (let i = 0; i < n; i++) {
        out.push({ i, x: (rand(i, 1) * 2 - 1) * w * 4.5, y: 0, flat: true, tilt: Math.round(rand(i, 2) * 40 - 20) });
      }
      return out;
    }
    if (mood === 'low') {
      // A few uneven stacks huddled in the middle, tallest towards the centre.
      const k = Math.min(6, Math.max(2, Math.ceil(n / 9)));
      const weights = Array.from({ length: k }, (_, s) => 0.6 + rand(s + n, 3));
      const total = weights.reduce((a, b) => a + b, 0);
      const heights = weights.map((wt) => Math.floor((wt / total) * n));
      heights[0] += n - heights.reduce((a, b) => a + b, 0);
      heights.sort((a, b) => b - a);
      const order = heights.map((_, s) => (s % 2 ? -1 : 1) * Math.ceil(s / 2)).map((slot, s) => ({ slot, h: heights[s] }));
      let i = 0;
      for (const { slot, h } of order.sort((a, b) => a.slot - b.slot)) {
        for (let c = 0; c < h; c++, i++) {
          out.push({ i, x: slot * (w - 3) + (rand(i, 4) * 3 - 1.5), y: c * step });
        }
      }
      return out;
    }
    // Rows of neat stacks; each row holds $100 and fills in from the right.
    const rows = Math.ceil(n / ROW);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      const inRow = r < rows - 1 ? ROW : n - ROW * (rows - 1);
      const full = Math.floor(inRow / STACK);
      const odd = inRow % STACK;
      const stagger = r % 2 ? gap / 2 : 0; // every other row shifts in by half a stack
      const lift = (rows - 1 - r) * rise; // rows behind sit higher up
      const stacks = [...(odd ? [odd] : []), ...Array(full).fill(STACK)];
      stacks.forEach((h, s) => {
        const fromEdge = (stacks.length - 1 - s) * gap + w / 2 + 1 + stagger;
        for (let c = 0; c < h; c++, i++) out.push({ i, x: fromEdge, y: lift + c * step, fromRight: true });
      });
    }
    return out;
  });

  // Coins that just arrived drop in; when the purse shrinks they simply go.
  let freshFrom = $state(Infinity);
  let last: number | null = null;
  $effect(() => {
    const now = n;
    untrack(() => {
      if (last !== null && now > last) {
        freshFrom = last;
        setTimeout(() => (freshFrom = Infinity), 900);
      }
      last = now;
    });
  });
</script>

<div class="purse {mood} {size}" aria-label={label ? `${label} ${dollars(amount)}` : dollars(amount)}>
  {#if showAmount}<span class="amount">{dollars(amount)}</span>{/if}
  <div class="coins" aria-hidden="true" style="--w: {dims.w}px; --focus: {focus}%">
    {#each coins as c (c.i)}
      <span
        class="coin"
        class:flat={c.flat}
        class:fresh={c.i >= freshFrom}
        style="left: {c.fromRight ? `calc(100% - ${c.x}px)` : `calc(var(--focus) + ${c.x}px)`}; bottom: {c.y}px; --tilt: {c.tilt ?? 0}deg; --d: {Math.max(0, c.i - freshFrom) * 0.02}s"
      ></span>
    {/each}
    {#if mood === 'depleted'}
      {#each [0, 1, 2] as m}
        <svg class="moth m{m}" viewBox="0 0 24 16">
          <g class="wings">
            <path d="M12 7 C8 0 1 1 1 5 C1 9 7 10 12 8 Z" />
            <path d="M12 7 C16 0 23 1 23 5 C23 9 17 10 12 8 Z" />
            <path d="M12 8 C9 10 5 15 8 15 C10 15 11 12 12 9 Z" />
            <path d="M12 8 C15 10 19 15 16 15 C14 15 13 12 12 9 Z" />
          </g>
          <ellipse class="body" cx="12" cy="9" rx="1.2" ry="4" />
        </svg>
      {/each}
    {/if}
  </div>
</div>

<style>
  .purse {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
  }
  /* Room for three figures, so the coins never move when the amount changes. */
  .amount {
    flex: none;
    min-width: 4.2ch;
    font-family: var(--title-font);
    font-size: 1.6rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .depleted .amount {
    color: var(--grey);
  }
  .coins {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 72px;
  }
  .small .coins {
    height: 40px;
  }
  /* Short phones: a lower purse; tall stacks may rise into the gap above. */
  @media (max-height: 740px) {
    .big .coins {
      height: 56px;
    }
  }
  /* A silver dollar lying flat, seen at an angle; stacked, each one shows its rim. */
  .coin {
    position: absolute;
    display: block;
    width: var(--w);
    height: calc(var(--w) * 0.34);
    border-radius: 50%;
    background: linear-gradient(#fff, #a9a69e);
    border: 1px solid #111;
    transform: translateX(-50%);
  }
  .coin.flat {
    transform: translateX(-50%) rotate(var(--tilt));
  }
  .fresh {
    animation: drop 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) var(--d) both;
  }
  @keyframes drop {
    from { transform: translate(-50%, -40px); opacity: 0; }
    to { transform: translateX(-50%); opacity: 1; }
  }

  /* An empty purse: the moths come out. */
  .moth {
    position: absolute;
    width: 18px;
    height: 12px;
    animation: flutter 4.5s ease-in-out infinite;
  }
  .small .moth {
    width: 12px;
    height: 8px;
  }
  .moth .wings {
    fill: #cfcbc1;
    stroke: #6d6a63;
    stroke-width: 0.6;
    transform-origin: 12px 8px;
    animation: flap 0.16s ease-in-out infinite alternate;
  }
  .moth .body {
    fill: #6d6a63;
  }
  .moth.m0 { left: calc(var(--focus) - 60px); bottom: 55%; }
  .moth.m1 { left: calc(var(--focus) - 10px); bottom: 75%; animation-duration: 3.7s; animation-delay: -1.4s; }
  .moth.m2 { left: calc(var(--focus) + 35px); bottom: 40%; animation-duration: 5.2s; animation-delay: -2.6s; }
  @keyframes flutter {
    0% { transform: translate(0, 0) rotate(-8deg); }
    25% { transform: translate(22px, -8px) rotate(10deg); }
    50% { transform: translate(8px, 10px) rotate(-4deg); }
    75% { transform: translate(-20px, -4px) rotate(12deg); }
    100% { transform: translate(0, 0) rotate(-8deg); }
  }
  @keyframes flap {
    to { transform: scaleX(0.35); }
  }
  @media (prefers-reduced-motion: reduce) {
    .moth,
    .moth .wings,
    .fresh {
      animation: none;
    }
  }
</style>
