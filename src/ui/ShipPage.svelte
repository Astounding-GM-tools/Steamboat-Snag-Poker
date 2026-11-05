<script lang="ts">
  import { BOAT, CREW, STATIONS, morningStrength, snagDef, type BoatParts, type JourneyState, type Station } from '../engine';
  import { t } from '../i18n';
  import { called, snagTitle } from './format';

  /**
   * The Best Intentions: the state of the boat. Her coal, her crew and what
   * who stands where, the hands on hire (and whether to keep them), what wants
   * repairing, and her own features, each rated 0 to 2.
   */
  let {
    journey,
    onrehire,
    onstation,
    onclose,
  }: { journey: JourneyState; onrehire: (id: string, on: boolean) => void; onstation: (id: string, station: Station) => void; onclose: () => void } = $props();

  const parts = Object.keys(BOAT.parts) as (keyof BoatParts)[];
  const repairs = $derived(journey.snags.filter((j) => snagDef(j.index).kind === 'trouble'));
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
  <p class="note">{t('ship.bridge')}</p>
  <table>
    <thead><tr><th></th>{#each STATIONS as station}<th>{t(`ship.station.${station}`)}</th>{/each}</tr></thead>
    <tbody>
      {#each journey.crew as id}
        <tr>
          <td>{called(id)}</td>
          {#each STATIONS as station}
            <td>
              <button class="post" class:here={journey.stations[id] === station} aria-pressed={journey.stations[id] === station} onclick={() => onstation(id, station)}>{pips(CREW[id].ratings[station])}</button>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="note">{t('ship.tomorrow')}</p>

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
    vertical-align: middle;
  }
  .pips {
    letter-spacing: 0.1em;
  }
  /* A station: the hand's rating there, boxed where they stand. */
  .post {
    font: inherit;
    letter-spacing: 0.08em;
    color: var(--grey);
    background: none;
    border: 1px solid transparent;
    outline: none;
    padding: 0.1em 0.3em;
  }
  .post.here {
    color: var(--ink);
    background: var(--paper);
  }
  .hire {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.92rem;
  }
  input {
    accent-color: var(--paper);
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
