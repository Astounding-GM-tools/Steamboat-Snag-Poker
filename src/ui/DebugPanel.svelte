<script lang="ts">
  import { PRESETS, type JokerMode, type RulesConfig, type Schedule } from '../engine';
  import { t } from '../i18n';

  interface Props {
    config: RulesConfig;
    seed: number;
    peek: boolean;
    onapply: (config: RulesConfig, seed: number) => void;
    onpeek: (peek: boolean) => void;
    /** Opens the hand log; absent when no voyage is in progress. */
    onlog?: () => void;
  }
  let { config, seed, peek, onapply, onpeek, onlog }: Props = $props();

  let open = $state(false);
  // svelte-ignore state_referenced_locally
  let draft = $state(structuredClone(config));
  // svelte-ignore state_referenced_locally
  let seedText = $state(String(seed));
  // svelte-ignore state_referenced_locally
  let communityText = $state(config.communitySchedule.join(','));
  // svelte-ignore state_referenced_locally
  let dealText = $state(config.dealSchedule.join(','));

  const jokerModes: JokerMode[] = ['slot', 'shuffled'];

  function choosePreset(name: string) {
    draft = structuredClone(PRESETS[name]);
    communityText = draft.communitySchedule.join(',');
    dealText = draft.dealSchedule.join(',');
  }

  const parseSchedule = (text: string, fallback: Schedule): Schedule => {
    const n = text.split(',').map((x) => Math.max(0, Math.floor(Number(x.trim()))));
    return n.length === 3 && n.every(Number.isFinite) ? (n as Schedule) : fallback;
  };

  function apply() {
    const c = $state.snapshot(draft) as RulesConfig;
    c.communitySchedule = parseSchedule(communityText, c.communitySchedule);
    c.dealSchedule = parseSchedule(dealText, c.dealSchedule);
    onapply(c, Number(seedText) || Date.now() >>> 0);
  }
</script>

<div class="debug">
  <button class="toggle" onclick={() => (open = !open)} title={t('debug.title')}>⚙</button>
  {#if open}
    <div class="panel">
      <h3>{t('debug.title')}</h3>
      <label>{t('debug.preset')}
        <select value={draft.preset in PRESETS ? draft.preset : ''} onchange={(e) => choosePreset(e.currentTarget.value)}>
          {#if !(draft.preset in PRESETS)}<option value="">{t('preset.custom')}</option>{/if}
          {#each Object.keys(PRESETS) as name}<option value={name}>{name}</option>{/each}
        </select>
      </label>
      <div class="fields" oninput={() => (draft.preset = 'custom')} role="group">
        <label>{t('debug.community')} <input type="text" bind:value={communityText} /></label>
        <label>{t('debug.deal')} <input type="text" bind:value={dealText} /></label>
        <label>{t('debug.slots')} <input type="number" min="1" max="5" bind:value={draft.slotCount} /></label>
        <label>{t('debug.ownMin')} <input type="number" min="0" max="5" bind:value={draft.ownCards.min} /></label>
        <label>{t('debug.ownMax')} <input type="number" min="0" max="5" bind:value={draft.ownCards.max} /></label>
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
        <label>{t('debug.loserPays')} <input type="number" min="0" max="1" step="0.25" bind:value={draft.loserPays} /></label>
      </div>
      <label>{t('debug.seed')} <input type="text" bind:value={seedText} /></label>
      <label class="check"><input type="checkbox" checked={peek} onchange={(e) => onpeek(e.currentTarget.checked)} /> {t('debug.peek')}</label>
      <button onclick={apply}>{t('debug.apply')}</button>
      {#if onlog}<button class="ghost" onclick={onlog}>{t('log.open')}</button>{/if}
    </div>
  {/if}
</div>

<style>
  .debug {
    position: fixed;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 60;
  }
  .toggle {
    padding: 0.2em 0.5em;
    font-size: 1.3rem;
  }
  .panel {
    position: absolute;
    right: 0;
    bottom: 3rem;
    width: 300px;
    max-height: 80vh;
    overflow: auto;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
    width: 120px;
    font-family: inherit;
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--ink);
  }
  button {
    font-size: 0.9rem;
  }
</style>
