<script lang="ts">
  /**
   * The First Mate's Log, open: a typed sheet over the river, a page a day (docs/log.md). The
   * river goes on behind it, and the two buttons stay below it, so a fork can still be answered.
   * What's there is simply there; a line written while it's open types itself out at the foot.
   * Records are terse; musings are set apart, a little larger.
   */
  import { untrack } from 'svelte';
  import type { LogEntry } from '../story/mechanics';
  import { t } from '../i18n';
  import TypedLine from './TypedLine.svelte';

  interface Props {
    entries: LogEntry[];
    /** Today, in the heading's count: the page it opens on. */
    today: number;
    onclose: () => void;
  }
  let { entries, today, onclose }: Props = $props();

  const days = $derived([...new Set(entries.map((e) => e.day))].sort((a, b) => a - b));
  let day = $state(untrack(() => today));
  // A new day begun while it's open: turn to it.
  $effect(() => {
    day = today;
  });
  const page = $derived(entries.filter((e) => e.day === day));
  const at = $derived(days.indexOf(day));
  /** How many lines were on the page when it was opened (or turned to): any after are new, and type themselves. */
  let known = $state(untrack(() => entries.filter((e) => e.day === today).length));
  $effect(() => {
    void day;
    known = untrack(() => entries.filter((e) => e.day === day).length);
  });

  let sheet = $state<HTMLElement>();
  // Keep the foot of the page in view as lines arrive.
  $effect(() => {
    void page.length;
    sheet?.scrollTo({ top: sheet.scrollHeight, behavior: 'smooth' });
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="log" role="dialog" tabindex="-1" aria-label={t('log.title')} onclick={(e) => e.stopPropagation()}>
  <header>
    <button class="turn" disabled={at <= 0} onclick={() => (day = days[at - 1])} aria-label={t('log.earlier')}>‹</button>
    <h2>{t('log.page', { day })}</h2>
    <button class="turn" disabled={at < 0 || at >= days.length - 1} onclick={() => (day = days[at + 1])} aria-label={t('log.later')}>›</button>
    <button class="close" onclick={onclose} aria-label={t('log.close')}>×</button>
  </header>
  <div class="sheet" bind:this={sheet}>
    {#if !page.length}
      <p class="empty">{t('log.empty')}</p>
    {/if}
    {#each page as entry, i (i)}
      <p class:musing={entry.kind === 'musing'}>
        {#if i >= known}<TypedLine text={entry.text} fresh wrap />{:else}{entry.text}{/if}
      </p>
    {/each}
  </div>
</div>

<style>
  .log {
    position: absolute;
    inset: 4.2rem 0.6rem 5.4rem;
    z-index: 30;
    display: grid;
    grid-template-rows: auto 1fr;
    background: #ece4cf;
    color: #1d1a14;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.5),
      0 10px 40px rgba(0, 0, 0, 0.7);
    font-family: 'Special Elite', monospace;
    animation: up 0.25s ease-out;
  }
  @keyframes up {
    from {
      opacity: 0;
      translate: 0 16px;
    }
  }
  header {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.6rem 0.4rem;
    border-bottom: 1px solid rgba(29, 26, 20, 0.5);
  }
  h2 {
    margin: 0;
    text-align: center;
    font-family: 'Special Elite', monospace;
    font-size: 1rem;
    font-weight: normal;
    letter-spacing: 0.04em;
  }
  header button {
    background: none;
    border: none;
    outline: none;
    color: #1d1a14;
    font-size: 1.3rem;
    line-height: 1;
    padding: 0.2rem 0.5rem;
  }
  header button:disabled {
    opacity: 0.25;
  }
  /* Ruled paper: the lines sit under the type. */
  .sheet {
    overflow-y: auto;
    padding: 0.6rem 1rem 1.2rem;
    line-height: 1.6rem;
    background-image: repeating-linear-gradient(transparent 0 calc(1.6rem - 1px), rgba(60, 90, 140, 0.18) calc(1.6rem - 1px) 1.6rem);
    background-position: 0 0.6rem;
    background-attachment: local;
  }
  p {
    margin: 0 0 0 0;
    font-size: 0.92rem;
  }
  .musing {
    margin: 0.8rem 0;
    font-size: 1rem;
  }
  .empty {
    opacity: 0.55;
    font-style: italic;
  }
  @media (prefers-reduced-motion: reduce) {
    .log {
      animation: none;
    }
  }
</style>
