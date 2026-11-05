<script lang="ts">
  import { BOAT, CREW, crewButtons, morningStrength, snagDef, type BoatParts, type JourneyState } from '../engine';
  import { t } from '../i18n';
  import { called, snagTitle } from './format';

  /**
   * The Best Intentions: the state of the boat. Her coal, her crew and what
   * they make, the hands on hire (and whether to keep them), what wants
   * repairing, and her own features, each rated 0 to 2.
   */
  let { journey, onrehire, onclose }: { journey: JourneyState; onrehire: (id: string, on: boolean) => void; onclose: () => void } = $props();

  const parts = Object.keys(BOAT.parts) as (keyof BoatParts)[];
  const skills = ['strength', 'cook', 'know'] as const;
  const repairs = $derived(journey.snags.filter((j) => snagDef(j.index).kind === 'trouble'));
  const own = $derived(journey.crew.filter((id) => !CREW[id]?.temporary));
  const pips = (tier: number) => '●'.repeat(tier) + '○'.repeat(2 - tier);
</script>

<div class="ship">
  <h2>{t('ship.title')}</h2>

  <h3>{t('ship.bunker')}</h3>
  <div class="meter" role="meter" aria-valuenow={journey.coal} aria-valuemin="0" aria-valuemax={BOAT.bunker}>
    <span class="fill" style="width: {(journey.coal / BOAT.bunker) * 100}%"></span>
    <span class="count">{journey.coal} / {BOAT.bunker}</span>
  </div>

  <h3>{t('ship.strength')}: {morningStrength(journey)}</h3>
  <p class="note">{t('ship.strengthNote')}</p>

  <h3>{t('ship.crew')}</h3>
  <table>
    <thead><tr><th></th>{#each skills as skill}<th>{t(`ship.skill.${skill}`)}</th>{/each}</tr></thead>
    <tbody>
      {#each journey.crew as id}
        <tr>
          <td>{called(id)}<small> {crewButtons(id)}</small></td>
          {#each skills as skill}<td class="pips">{pips(CREW[id].skills[skill])}</td>{/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <h3>{t('ship.hires')}</h3>
  {#each journey.hires as hire (hire.id)}
    <label class="hire">
      <span>{called(hire.id)} <small>{hire.days > 1 ? t('ship.daysLeft', { n: hire.days }) : t('ship.dayLeft')}</small></span>
      <span><input type="checkbox" checked={hire.rehire} onchange={(e) => onrehire(hire.id, e.currentTarget.checked)} /> {t('ship.rehire', { wage: CREW[hire.id].wage })}</span>
    </label>
  {:else}
    <p class="note">{t('ship.noHires')}</p>
  {/each}

  <h3>{t('ship.repairs')}</h3>
  {#if repairs.length}
    <ul>{#each repairs as snag}<li>{snagTitle(snag.index)}</li>{/each}</ul>
  {:else}
    <p class="note">{t('ship.noRepairs')}</p>
  {/if}

  <h3>{t('ship.vessel')}</h3>
  <table>
    <tbody>
      {#each parts as part}
        <tr>
          <td>{t(`ship.part.${part}`)}</td>
          <td class="pips">{pips(journey.parts[part])}</td>
          <td class="note">{part === 'rooms' ? t(`ship.rooms.${journey.parts.rooms}`) : ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <button onclick={onclose}>{t('draw.close')}</button>
</div>

<style>
  .ship {
    position: fixed;
    inset: 0;
    z-index: 60;
    overflow: auto;
    display: grid;
    align-content: start;
    gap: 0.35rem;
    padding: 1rem 1rem 1.5rem;
    max-width: 480px;
    margin: 0 auto;
    background: #0c0c0b;
  }
  h2 {
    margin: 0 0 0.25rem;
    font-family: var(--title-font);
    font-weight: normal;
    text-align: center;
  }
  h3 {
    margin: 0.7rem 0 0.1rem;
    font-family: var(--title-font);
    font-weight: normal;
    font-size: 1.05rem;
  }
  .note,
  small {
    margin: 0;
    color: var(--grey);
    font-size: 0.85rem;
  }
  .meter {
    position: relative;
    height: 1.4rem;
    border: 1px solid var(--paper);
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--paper);
  }
  .count {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 0.85rem;
    mix-blend-mode: difference;
    color: var(--paper);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  th {
    font-weight: normal;
    color: var(--grey);
    font-size: 0.75rem;
    text-align: left;
  }
  td {
    padding: 0.12rem 0;
  }
  .pips {
    letter-spacing: 0.1em;
  }
  .hire {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.92rem;
  }
  ul {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 0.92rem;
  }
  button {
    margin-top: 1rem;
    padding: 0.6em;
  }
</style>
