<script lang="ts">
  import { untrack } from 'svelte';
  import { dollars } from './format';

  /**
   * A captain's money as coins on the felt: tall stacks of silver dollars ($10
   * a stack) behind, and a little heap of loose change in front. New coins drop
   * in when the purse grows; when it shrinks, they simply go.
   */
  let { amount, align = 'left', label }: { amount: number; align?: 'left' | 'right'; label?: string } = $props();

  const MAX_STACKS = 12;
  const shown = $derived(Math.max(0, amount));
  const stacks = $derived(Math.min(MAX_STACKS, Math.floor(shown / 10)));
  const loose = $derived(stacks >= MAX_STACKS ? 0 : shown % 10);

  // Coins that just arrived get a drop-in animation.
  let fresh = $state(0);
  let last: number | null = null;
  $effect(() => {
    const now = shown;
    untrack(() => {
      if (last !== null && now > last) {
        fresh = Math.min(10, now - last);
        setTimeout(() => (fresh = 0), 900);
      }
      last = now;
    });
  });
  const coinIndex = (stack: number, coin: number) => stack * 10 + coin;
  const total = $derived(stacks * 10 + loose);
  const isFresh = (i: number) => i >= total - fresh;
</script>

<div class="pile {align}" class:broke={amount <= 0} aria-label={label ? `${label} ${dollars(amount)}` : dollars(amount)}>
  <div class="coins">
    <div class="stacks">
      {#each Array.from({ length: stacks }) as _, s (s)}
        <div class="stack">
          {#each Array.from({ length: 10 }) as _, c (c)}
            <span class="dollar" class:fresh={isFresh(coinIndex(s, c))} style="--d: {c * 0.04}s"></span>
          {/each}
        </div>
      {/each}
    </div>
    {#if loose}
      <div class="loose">
        {#each Array.from({ length: loose }) as _, c (c)}
          <span class="change" class:fresh={isFresh(stacks * 10 + c)} style="--d: {c * 0.05}s"></span>
        {/each}
      </div>
    {/if}
  </div>
  <span class="amount">{dollars(amount)}</span>
</div>

<style>
  .pile {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }
  .pile.right {
    flex-direction: row-reverse;
  }
  .coins {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    min-height: 30px;
  }
  .stacks {
    display: flex;
    gap: 2px;
    align-items: flex-end;
  }
  .stack {
    display: flex;
    flex-direction: column-reverse;
  }
  .dollar {
    display: block;
    width: 22px;
    height: 6px;
    margin-top: -3px;
    border-radius: 50%;
    background: linear-gradient(#fff, #a9a69e);
    border: 1px solid #111;
  }
  .loose {
    display: flex;
    flex-wrap: wrap;
    width: 40px;
    gap: 1px;
    align-items: flex-end;
  }
  .change {
    display: block;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fff, #8d8a83);
    border: 1px solid #111;
  }
  .fresh {
    animation: drop 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) var(--d) both;
  }
  @keyframes drop {
    from { transform: translateY(-40px); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  .amount {
    font-family: var(--title-font);
    font-size: 1.15rem;
  }
  .broke .amount {
    color: var(--grey);
    text-decoration: line-through;
  }
</style>
