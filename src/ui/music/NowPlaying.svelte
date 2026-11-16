<script lang="ts">
  import { t } from '../../i18n';
  import { music } from './player.svelte';

  /**
   * The credit, as the band strikes up: one small line at the top of the screen, a while, then gone
   * (Options names the records for good). Taps go through it.
   */
  const SHOWN_MS = 9000;
  let shown = $state<string | null>(null);
  $effect(() => {
    const now = music.now;
    if (!now) return;
    shown = t('music.nowPlaying', { title: now.title, band: now.band, year: now.year });
    const timer = setTimeout(() => (shown = null), SHOWN_MS);
    return () => clearTimeout(timer);
  });
</script>

{#if shown}
  {#key shown}<div class="now-playing" aria-live="polite">{shown}</div>{/key}
{/if}

<style>
  .now-playing {
    position: fixed;
    left: 50%;
    top: calc(env(safe-area-inset-top, 0px) + 0.15rem);
    transform: translateX(-50%);
    z-index: 40;
    max-width: calc(100vw - 2rem);
    pointer-events: none;
    font-size: 0.7rem;
    font-style: italic;
    color: var(--grey);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    animation: now-playing 9s ease both;
  }
  @keyframes now-playing {
    0% {
      opacity: 0;
    }
    12%,
    85% {
      opacity: 0.85;
    }
    100% {
      opacity: 0;
    }
  }
</style>
