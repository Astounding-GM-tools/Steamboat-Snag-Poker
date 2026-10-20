<script lang="ts">
  import { untrack } from 'svelte';
  import { dollars } from './format';

  /**
   * The pot on the felt. Whenever a captain pays in, a coin flies in from their
   * side of the table (you from below, the opponent from above) with the amount.
   */
  let { bets }: { bets: [number, number] } = $props();

  interface Flyer {
    id: number;
    from: 'me' | 'them';
    amount: number;
  }

  const pot = $derived(bets[0] + bets[1]);
  const coins = $derived(Math.min(24, Math.ceil(pot / 2)));
  let flyers = $state<Flyer[]>([]);
  let last: [number, number] | null = null;
  let nextId = 0;

  $effect(() => {
    const now: [number, number] = [bets[0], bets[1]];
    untrack(() => {
      // A new crossing starts lower than the last pot: treat the antes as fresh payments.
      const prev = last && now[0] >= last[0] && now[1] >= last[1] ? last : [0, 0];
      last = now;
      const fresh: Flyer[] = [];
      if (now[0] > prev[0]) fresh.push({ id: nextId++, from: 'me', amount: now[0] - prev[0] });
      if (now[1] > prev[1]) fresh.push({ id: nextId++, from: 'them', amount: now[1] - prev[1] });
      if (!fresh.length) return;
      flyers = [...flyers, ...fresh];
      setTimeout(() => (flyers = flyers.filter((f) => !fresh.includes(f))), 1100);
    });
  });
</script>

<div class="pot" aria-label="Pot {dollars(pot)}">
  <div class="stack">
    {#each Array.from({ length: coins }) as _, i (i)}<span class="coin"></span>{/each}
  </div>
  <span class="amount">{dollars(pot)}</span>
  {#each flyers as f (f.id)}
    <span class="flyer {f.from}"><span class="coin"></span>+{dollars(f.amount)}</span>
  {/each}
</div>

<style>
  .pot {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    min-width: 56px;
  }
  .stack {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    min-height: 40px;
  }
  .coin {
    display: block;
    width: 34px;
    height: 8px;
    margin-top: -3px;
    border-radius: 50%;
    background: linear-gradient(var(--paper), #9a978f);
    border: 1px solid #111;
  }
  .amount {
    font-family: var(--title-font);
    font-size: 1.2rem;
  }
  .flyer {
    position: absolute;
    left: 50%;
    top: 30%;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--title-font);
    font-size: 0.9rem;
    pointer-events: none;
    animation: fly 1s ease-in forwards;
  }
  .flyer.me {
    --from: 220px;
  }
  .flyer.them {
    --from: -220px;
  }
  @keyframes fly {
    0% { transform: translate(-50%, var(--from)) scale(1.4); opacity: 0; }
    20% { opacity: 1; }
    80% { transform: translate(-50%, 0) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -10px) scale(0.8); opacity: 0; }
  }
</style>
