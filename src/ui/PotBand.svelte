<script lang="ts">
  import Pile from './Pile.svelte';

  /**
   * The pot in the middle of the felt (its coins carry `data-k`, where the
   * payments land), and the outcome over it once the hand is decided. With no
   * pot (the first lessons) it stays, empty, so the table keeps its shape.
   */
  interface Props {
    count: number;
    /** Paid out: the coins have gone to the winner. */
    paid: boolean;
    outcome?: string | null;
    /** You won: the outcome in full light. */
    won?: boolean;
    /** A longer verdict (names, who went broke): smaller, and it may wrap. */
    wordy?: boolean;
    el?: HTMLElement;
  }
  let { count, paid, outcome, won = false, wordy = false, el = $bindable() }: Props = $props();
</script>

<div class="pot-band" bind:this={el}>
  <Pile {count} {paid} />
  {#if outcome}<p class="outcome" class:won class:wordy aria-live="polite">{outcome}</p>{/if}
</div>

<style>
  .pot-band {
    grid-column: 1 / -1;
    position: relative;
    margin: 0.2rem 0 0.5rem;
  }
  .outcome {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.6rem;
    letter-spacing: 0.06em;
    color: var(--grey);
    animation: outcome 0.4s ease-out 0.8s backwards;
  }
  .outcome.won {
    font-size: 2rem;
    color: var(--paper);
  }
  .outcome.wordy {
    font-size: 1.1rem;
    letter-spacing: normal;
    line-height: 1.2;
    text-wrap: balance;
    animation-delay: 0.6s;
  }
  .outcome.wordy.won {
    font-size: 1.1rem;
  }
  @keyframes outcome {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .outcome {
      animation: none;
    }
  }
</style>
