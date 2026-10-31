<script lang="ts">
  import { untrack } from 'svelte';
  import { dollars } from './format';

  /**
   * A captain's money as coins on the table, one coin a dollar. It reads at a
   * glance: under $10 a few coins lie loose and the moths circle; under $50 a
   * small uneven pile; from $50, neat stacks of ten from the left (the odd
   * dollars in a short stack first); and every further $100 starts a new row
   * in front, staggered, until the chip leader's purse looks like a bank.
   *
   * The picture is laid out once a round, from the purse at the start of it
   * (`start`). During the round coins only leave it, from the left (the side
   * facing the pot): the front row first, the active stack top down, so the
   * emptied stacks show what has gone in. Spent coins keep their place,
   * hidden, so the table can fly them to the pot from where they stood. A
   * winnings-swollen purse is laid out afresh when the next round begins.
   *
   * Or, with `keep` (a High Rollers purse), it keeps its shape: the stacks are
   * remembered from hand to hand (`keep` changes with each). Coins paid in
   * (`paid`) leave as above; coins won (`won`) land on the stacks' tops, a
   * few rounds over, and then in new stacks of ten beside them, each on a
   * spot laid out in advance (`data-g`) for a flight to land on. No tidying
   * up: the next hand starts from exactly that.
   */
  let {
    amount,
    start = amount,
    size = 'big',
    showAmount = true,
    focus = 50,
    label,
    keep,
    paid = 0,
    won = 0,
  }: {
    amount: number;
    /** The purse at the start of the round, which sets the picture. */
    start?: number;
    size?: 'big' | 'small' | 'tiny';
    showAmount?: boolean;
    /** Where a small pile (and the moths) sits, in % across the purse; neat rows start at the left. */
    focus?: number;
    label?: string;
    /** Keep the stacks as they are from hand to hand: a key that changes with each hand. */
    keep?: unknown;
    /** Kept stacks: coins paid out this hand. */
    paid?: number;
    /** Kept stacks: coins won this hand. */
    won?: number;
  } = $props();

  const DEPLETED = 10;
  const NEAT = 50;
  const ROW = 100;
  const MAX_ROWS = 4;
  const STACK = 10;

  const n = $derived(Math.max(0, Math.min(start, ROW * MAX_ROWS)));
  const mood = $derived(start < DEPLETED ? 'depleted' : start < NEAT ? 'low' : 'rich');
  /** Dollars gone into the pot this round: coins with a lower `d` than this are spent. */
  const spent = $derived(Math.max(0, n - Math.max(0, amount)));

  /** Coin size in px: width, how much each coin adds to a stack, the step between stacks, and how far back rows rise. */
  const dims = $derived(
    size === 'big' ? { w: 20, step: 3.2, gap: 22, rise: 9 } : size === 'small' ? { w: 13, step: 2, gap: 14, rise: 5 } : { w: 9, step: 1.4, gap: 9.6, rise: 5 },
  );

  /** A fixed random number per coin and purpose, so a coin keeps its place. */
  function rand(k: number, salt: number): number {
    let h = Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 13;
    return ((h >>> 0) % 10000) / 10000;
  }

  interface Coin {
    /** Spending order: coin 0 is the first to go into the pot. */
    d: number;
    /** Left edge offset in px: from the purse's left edge (neat rows) or from the focus point. */
    x: number;
    /** Height above the table, in px. */
    y: number;
    fromLeft?: boolean;
    flat?: boolean;
    tilt?: number;
    /** Drawing order of rows: back rows first. */
    z?: number;
  }

  /** Stacks (lists of coin heights) to coins, spent from the first stack, top down. */
  function spendOrder(stacks: { x: number; y0: number; h: number; fromLeft?: boolean }[], step: number, from: number): Coin[] {
    const out: Coin[] = [];
    let d = from;
    for (const s of stacks) {
      for (let c = s.h - 1; c >= 0; c--) out.push({ d: d++, x: s.x, y: s.y0 + c * step, fromLeft: s.fromLeft });
    }
    return out;
  }

  const coins = $derived.by((): Coin[] => {
    const { w, step, gap, rise } = dims;
    if (mood === 'depleted') {
      // A handful of loose coins lying about, spent from the left.
      return Array.from({ length: n }, (_, i) => ({ x: (rand(i, 1) * 2 - 1) * w * 4.5, y: 0, flat: true, tilt: Math.round(rand(i, 2) * 40 - 20) }))
        .sort((a, b) => a.x - b.x)
        .map((c, d) => ({ ...c, d }));
    }
    if (mood === 'low') {
      // A few uneven stacks huddled together, tallest towards the middle.
      const k = Math.min(6, Math.max(2, Math.ceil(n / 9)));
      const weights = Array.from({ length: k }, (_, s) => 0.6 + rand(s + n, 3));
      const total = weights.reduce((a, b) => a + b, 0);
      const heights = weights.map((wt) => Math.floor((wt / total) * n));
      heights[0] += n - heights.reduce((a, b) => a + b, 0);
      heights.sort((a, b) => b - a);
      const stacks = heights
        .map((h, s) => ({ slot: (s % 2 ? -1 : 1) * Math.ceil(s / 2), h }))
        .sort((a, b) => a.slot - b.slot)
        .map(({ slot, h }, s) => ({ x: slot * (w - 3) + (rand(s, 4) * 3 - 1.5), y0: 0, h }));
      return spendOrder(stacks, step, 0);
    }
    // Rows of neat stacks from the left, $100 a row; the front row is spent first.
    const rows = Math.ceil(n / ROW);
    const out: Coin[] = [];
    let d = 0;
    for (let r = rows - 1; r >= 0; r--) {
      const inRow = r < rows - 1 ? ROW : n - ROW * (rows - 1);
      const heights = [...(inRow % STACK ? [inRow % STACK] : []), ...Array(Math.floor(inRow / STACK)).fill(STACK)];
      const stagger = r % 2 ? gap / 2 : 0; // every other row shifts by half a stack
      const lift = (rows - 1 - r) * rise; // rows behind sit higher up
      const row = spendOrder(
        heights.map((h, s) => ({ x: s * gap + w / 2 + 1 + stagger, y0: lift, h, fromLeft: true })),
        step,
        d,
      );
      d += row.length;
      out.push(...row.map((c) => ({ ...c, z: r })));
    }
    return out;
  });
  // --- Kept stacks -------------------------------------------------------
  /** A stack on the table: x in px from the purse's left edge, its row's lift, its height in coins; a loose coin lies flat at a tilt. */
  interface Stack {
    x: number;
    lift: number;
    h: number;
    tilt?: number;
  }
  /** Rounds of winnings a purse's own stacks take before the rest start new stacks; and how tall those grow. */
  const LAYERS = 4;
  const NEW_STACK = 10;
  let width = $state(0);
  let kept = $state.raw<Stack[] | null>(null);

  /** Spending order: the front row first, left to right. */
  const inOrder = (stacks: Stack[]) => [...stacks].sort((a, b) => a.lift - b.lift || a.x - b.x);

  /** The neat picture, as stacks in px. */
  function asStacks(): Stack[] {
    const at = new Map<string, Stack>();
    for (const c of coins) {
      const x = c.fromLeft ? c.x : (width * focus) / 100 + c.x;
      // A stack is its place and its row (rows two apart line up); its lift is its bottom coin's height.
      const key = c.flat ? `loose ${c.d}` : `${Math.round(x)} ${c.z ?? 0}`;
      const s = at.get(key);
      if (s) {
        s.h++;
        s.lift = Math.min(s.lift, c.y);
      } else at.set(key, { x, lift: c.y, h: 1, tilt: c.flat ? c.tilt : undefined });
    }
    return [...at.values()];
  }

  /** Takes `n` coins off, in spending order (each stack top down). */
  function without(stacks: Stack[], n: number): Stack[] {
    let left = n;
    return inOrder(stacks)
      .map((s) => {
        const take = Math.min(s.h, left);
        left -= take;
        return { ...s, h: s.h - take };
      })
      .filter((s) => s.h > 0);
  }

  /** Where `n` won coins land on these stacks: their tops in turn for a few rounds, then new stacks beside them, then rows behind. */
  function landing(stacks: Stack[], n: number): { x: number; y: number; lift: number }[] {
    const { w, step, gap, rise } = dims;
    const out: { x: number; y: number; lift: number }[] = [];
    const tops = [...stacks].sort((a, b) => a.x - b.x);
    for (let layer = 0; layer < LAYERS && out.length < n; layer++)
      for (const s of tops) if (out.length < n) out.push({ x: s.x, y: s.lift + (s.h + layer) * step, lift: s.lift });
    const room = Math.max(w, width) - w / 2;
    let x = tops.length ? Math.max(...tops.map((s) => s.x)) + gap : w / 2 + 1;
    let lift = 0;
    while (out.length < n) {
      if (x > room) {
        // No more room beside: a row further back, a little higher.
        lift += rise;
        x = w / 2 + 1 + (lift / rise) % 2 * (gap / 2);
      }
      for (let c = 0; c < NEW_STACK && out.length < n; c++) out.push({ x, y: lift + c * step, lift });
      x += gap;
    }
    return out;
  }

  /** The stacks after a hand: what was paid gone, what was won added where it landed. */
  function settle(stacks: Stack[], paid: number, won: number): Stack[] {
    const left = without(stacks, paid);
    const spots = landing(left, won);
    const merged = left.map((s) => ({ ...s }));
    for (const spot of spots) {
      const s = merged.find((m) => Math.abs(m.x - spot.x) < 0.5 && m.lift === spot.lift);
      if (s) {
        s.h++;
        s.tilt = undefined;
      } else merged.push({ x: spot.x, lift: spot.lift, h: 1 });
    }
    return merged;
  }

  // The stacks as they stood when the hand began; settled when the next one does (with what was paid and won in this one).
  let keptFor: unknown = undefined;
  let lastPaid = 0;
  let lastWon = 0;
  $effect.pre(() => {
    const hand = keep;
    if (hand === undefined || !width) return;
    untrack(() => {
      if (!kept) kept = asStacks();
      else if (hand !== keptFor) {
        kept = settle(kept, lastPaid, lastWon);
        // Money that changed hands away from the table (a lesson's buttons handed out, say): lay the purse out afresh.
        if (start <= ROW * MAX_ROWS && kept.reduce((a, s) => a + s.h, 0) !== Math.max(0, start)) kept = asStacks();
      }
      keptFor = hand;
    });
  });
  $effect.pre(() => {
    lastPaid = paid;
    lastWon = won;
  });

  /** Kept stacks as coins: in spending order (`d`), the first `paid` spent; then the winnings' spots (`g`). */
  const keptCoins = $derived.by(() => {
    if (!kept) return null;
    const out: (Coin & { g?: number; spent?: boolean })[] = [];
    let d = 0;
    for (const s of inOrder(kept))
      for (let c = s.h - 1; c >= 0; c--) out.push({ d: d++, x: s.x, y: s.lift + c * dims.step, fromLeft: true, flat: s.tilt !== undefined && s.h === 1, tilt: s.tilt, z: -s.lift });
    for (const c of out) c.spent = c.d < paid;
    landing(without(kept, paid), won).forEach((spot, g) => out.push({ d: d + g, g, x: spot.x, y: spot.y, fromLeft: true, z: -spot.lift }));
    return out;
  });
  const keptTotal = $derived(kept ? kept.reduce((a, s) => a + s.h, 0) - paid + won : 0);

  /** Back rows first, then each stack from the bottom up. */
  const drawn = $derived([...(keptCoins ?? coins)].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.y - b.y));
  const moths = $derived(keptCoins ? keptTotal < DEPLETED : mood === 'depleted');
</script>

<div class="purse {mood} {size}" aria-label={label ? `${label} ${dollars(amount)}` : dollars(amount)}>
  <div class="coins" aria-hidden="true" style="--w: {dims.w}px; --focus: {focus}%" bind:clientWidth={width}>
    {#each drawn as c (c.d)}
      {@const g = 'g' in c ? (c.g as number | undefined) : undefined}
      <span
        class="coin"
        class:flat={c.flat}
        class:spent={keptCoins ? 'spent' in c && !!c.spent : c.d < spent}
        data-d={g === undefined ? c.d : undefined}
        data-g={g}
        style="left: {c.fromLeft ? `${c.x}px` : `calc(var(--focus) + ${c.x}px)`}; bottom: {c.y}px; --tilt: {c.tilt ?? 0}deg"
      ></span>
    {/each}
    {#if moths}
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
  {#if showAmount}<span class="amount">{dollars(amount)}</span>{/if}
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
  /* Four at a table: a rival's purse fits a third of the screen ($100 a row of ten stacks). */
  .tiny .coins {
    height: 40px;
  }
  /* Short phones: a lower purse; tall stacks may rise into the gap above. */
  /* Short screens (decided once at load, so hiding browser bars never changes it). */
  :global(.short) .big .coins {
    height: 56px;
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
  /* Gone into the pot; it keeps its place so its flight can start from there. */
  .spent {
    visibility: hidden;
  }

  /* An empty purse: the moths come out. */
  .moth {
    position: absolute;
    width: 18px;
    height: 12px;
    animation: flutter 4.5s ease-in-out infinite;
  }
  .small .moth,
  .tiny .moth {
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
    .moth .wings {
      animation: none;
    }
  }
</style>
