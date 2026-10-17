<script lang="ts">
  import type { DealMode, JokerMode, RulesConfig } from '../engine';
  import { t } from '../i18n';

  interface Props {
    config: RulesConfig;
    seed: number;
    peek: boolean;
    onapply: (config: RulesConfig, seed: number) => void;
    onpeek: (peek: boolean) => void;
  }
  let { config, seed, peek, onapply, onpeek }: Props = $props();

  let open = $state(false);
  // svelte-ignore state_referenced_locally
  let draft = $state({ ...config });
  // svelte-ignore state_referenced_locally
  let seedText = $state(String(seed));

  const dealModes: DealMode[] = ['drip', 'draft', 'holdem'];
  const jokerModes: JokerMode[] = ['slot', 'shuffled'];
</script>

<div class="debug" class:open>
  <button class="toggle" onclick={() => (open = !open)} title={t('debug.title')}>⚙</button>
  {#if open}
    <div class="panel">
      <h3>{t('debug.title')}</h3>
      <label>{t('debug.dealMode')}
        <select bind:value={draft.dealMode}>
          {#each dealModes as m}<option value={m}>{t(`debug.deal.${m}`)}</option>{/each}
        </select>
      </label>
      <label>{t('debug.jokerMode')}
        <select bind:value={draft.jokerMode}>
          {#each jokerModes as m}<option value={m}>{t(`debug.joker.${m}`)}</option>{/each}
        </select>
      </label>
      {#if draft.jokerMode === 'slot'}
        <label>{t('debug.chance')} <input type="number" min="0" max="1" step="0.05" bind:value={draft.communityJokerChance} /></label>
      {:else}
        <label>{t('debug.everyMonths')} <input type="number" min="1" max="12" bind:value={draft.shuffledJokerEveryMonths} /></label>
      {/if}
      <label>{t('debug.totalJokers')} <input type="number" min="0" max="30" bind:value={draft.totalJokers} /></label>
      <label>{t('debug.drain')} <input type="number" min="0" max="20" bind:value={draft.drainPerJoker} /></label>
      <label>{t('debug.seed')} <input type="text" bind:value={seedText} /></label>
      <label class="check"><input type="checkbox" checked={peek} onchange={(e) => onpeek(e.currentTarget.checked)} /> {t('debug.peek')}</label>
      <button onclick={() => onapply($state.snapshot(draft), Number(seedText) || Date.now())}>{t('debug.apply')}</button>
    </div>
  {/if}
</div>

<style>
  .debug {
    position: fixed;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 60;
    filter: none;
  }
  .toggle {
    padding: 0.2em 0.5em;
    font-size: 1.3rem;
  }
  .panel {
    position: absolute;
    right: 0;
    bottom: 3rem;
    width: 280px;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  h3 {
    font-family: var(--title-font);
    font-weight: normal;
    margin: 0;
  }
  label {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
  }
  .check {
    justify-content: flex-start;
  }
  input[type='number'],
  input[type='text'],
  select {
    width: 110px;
    font-family: inherit;
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--ink);
  }
  button {
    font-size: 0.9rem;
  }
</style>
