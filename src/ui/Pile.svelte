<script lang="ts">
  /**
   * The pot as a heap of coins, one a dollar, nobody's in particular: it
   * starts in the middle and spills outwards in uneven stacks, every way,
   * as the table seen at a slant (back rows higher up, drawn behind).
   *
   * Every spot is laid out in advance, coin by coin: coin k goes on the stack
   * that's lowest, nearest the middle, with a little chance thrown in, so the
   * middle rises first and the heap spreads. A coin's spot never changes as
   * more come, so a flight can aim at it (`data-k`) while it's still hidden.
   */
  let { count, paid = false }: { count: number; paid?: boolean } = $props();

  const W = 18;
  const STEP = 2.6;
  const GAP = 17;
  const ROWS = 4;
  /** How far up each row further back sits. */
  const RISE = 7;
  const HEIGHT = 72;

  let width = $state(320);

  /** A fixed random number per index and purpose, so the heap is the same every time it's drawn. */
  function rand(k: number, salt: number): number {
    let h = Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 13;
    return ((h >>> 0) % 10000) / 10000;
  }

  /** The stacks' places: staggered rows inside an oval round the middle, each with a height it likes to stop at. */
  const slots = $derived.by(() => {
    const cx = width / 2;
    const rx = width / 2 - W / 2;
    const out: { x: number; row: number; dist: number; cap: number }[] = [];
    for (let row = 0; row < ROWS; row++) {
      const depth = (row - (ROWS - 1) / 2) / (ROWS / 2);
      const half = rx * Math.sqrt(Math.max(0, 1 - depth * depth * 0.6));
      for (let x = cx - Math.floor(half / GAP) * GAP + (row % 2 ? GAP / 2 : 0); x <= cx + half; x += GAP) {
        if (Math.abs(x - cx) > half) continue;
        const s = out.length;
        out.push({ x, row, dist: Math.abs(x - cx) / GAP + Math.abs(depth) * 1.5, cap: 5 + Math.floor(rand(s, 9) * 10) });
      }
    }
    return out;
  });

  /** Every coin's spot, in the order they arrive. */
  const coins = $derived.by(() => {
    const heights = slots.map(() => 0);
    return Array.from({ length: Math.max(0, count) }, (_, k) => {
      let best = -1;
      let bestScore = Infinity;
      slots.forEach((s, i) => {
        // Past its liking a stack can still grow, but reluctantly.
        const over = heights[i] >= s.cap ? 6 + heights[i] - s.cap : 0;
        // Nearness to the middle counts for more than height: it heaps up before it spreads.
        const score = heights[i] + over + s.dist * 2.4 + rand(k * 31 + i, 1) * 3;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      });
      const s = slots[best];
      const h = heights[best]++;
      return {
        k,
        x: s.x + (rand(k, 2) * 3 - 1.5),
        y: 4 + s.row * RISE + h * STEP,
        z: (ROWS - s.row) * 100 + h,
      };
    });
  });
</script>

<div class="pile" class:paid bind:clientWidth={width} style="height: {HEIGHT}px" aria-hidden="true">
  {#each coins as c (c.k)}
    <span class="coin" data-k={c.k} style="left: {c.x}px; bottom: {c.y}px; z-index: {c.z}"></span>
  {/each}
</div>

<style>
  .pile {
    position: relative;
    width: 100%;
    /* The coins' drawing order stays inside the heap: captions and the like still go over it. */
    isolation: isolate;
  }
  .coin {
    position: absolute;
    width: 18px;
    height: 6px;
    border-radius: 50%;
    background: linear-gradient(#fff, #a9a69e);
    border: 1px solid #111;
    transform: translateX(-50%);
  }
  .paid .coin {
    visibility: hidden;
  }
</style>
