<script lang="ts">
  import { CATEGORIES, ROSTER, type OpponentOdds, type Player } from '../engine';
  import { t } from '../i18n';
  import { dollars, name } from './format';

  /**
   * A captain's portrait card: who they are, how they play, where they come
   * from, and (mid-round) Willie's reckoning of what they could be holding.
   */
  let { captain, odds = null, onclose }: { captain: Player; odds?: OpponentOdds | null; onclose: () => void } = $props();
  const id = $derived(captain.id);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  /**
   * US rule of thumb: works from 1923 on enter the public domain 95 years after
   * publication (on 1 January of the 96th year); older ones are long since free.
   */
  const firstSeen = $derived(ROSTER.find((c) => c.id === id)?.firstSeen);
  const publicDomain = $derived(
    !firstSeen ? '' : firstSeen >= 1923 ? t('captain.pdSince', { year: firstSeen + 96 }) : t('captain.pdLongAgo'),
  );
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="intertitle card" role="dialog" aria-label={name(id)} tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <div class="oval">{name(id)[0]}</div>
    <h2>{name(id)}</h2>
    <p class="boat">{t(`character.${id}.boat`)}</p>
    <p class="purse">{dollars(captain.money)}{captain.jokers.length ? ` · ${'🃏'.repeat(captain.jokers.length)}` : ''}</p>
    {#if odds}
      <section class="reckoning">
        <h3>{t('willie.hintTitle')}</h3>
        <p>{t('draw.oddsTitle', { name: name(id) })}</p>
        {#each [...CATEGORIES].reverse() as cat}
          {#if odds.categories[cat] >= 0.005}
            <div class="bar">
              <span>{t(`hand.${cat}`)}</span>
              <span class="track"><span class="fill" style="width: {odds.categories[cat] * 100}%"></span></span>
              <span class="num">{pct(odds.categories[cat])}</span>
            </div>
          {/if}
        {/each}
        <p class="beats">{t('draw.oddsBeats', { pct: pct(odds.beatsYou) })}</p>
      </section>
    {/if}
    <dl>
      <dt>{t('captain.style')}</dt>
      <dd>{t(`character.${id}.blurb`)}</dd>
      <dt>{t('captain.source')}</dt>
      <dd>{t(`character.${id}.source`)}{#if publicDomain}<br />{publicDomain}{/if}</dd>
      <dt>{t('captain.trivia')}</dt>
      <dd>{t(`character.${id}.trivia`)}</dd>
    </dl>
    <button onclick={onclose}>{t('willie.ok')}</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 45;
  }
  .card {
    width: min(480px, 100%);
    max-height: 90vh;
    overflow: auto;
  }
  .oval {
    width: 110px;
    height: 140px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    border: 4px double var(--paper);
    display: grid;
    place-items: center;
    font-family: var(--title-font);
    font-size: 4rem;
    background: radial-gradient(circle, #444, #111);
  }
  h2 {
    margin-bottom: 0.1rem;
  }
  .boat {
    margin: 0;
    font-style: italic;
    color: var(--grey);
  }
  .purse {
    margin: 0.4rem 0 0.8rem;
  }
  .reckoning {
    text-align: left;
    border: 1px dashed var(--grey);
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.4rem;
  }
  .reckoning h3 {
    font-family: var(--title-font);
    font-weight: normal;
    margin: 0 0 0.3rem;
    text-align: center;
  }
  .reckoning p {
    margin: 0.2rem 0 0.4rem;
    color: var(--grey);
    font-size: 0.9rem;
  }
  .reckoning .beats {
    color: var(--paper);
    font-weight: bold;
    margin-top: 0.5rem;
  }
  .bar {
    display: grid;
    grid-template-columns: 8.5rem 1fr 2.8rem;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.85rem;
  }
  .track {
    height: 8px;
    background: #222;
    border: 1px solid var(--dim);
  }
  .track .fill {
    display: block;
    height: 100%;
    background: var(--paper);
  }
  .num {
    text-align: right;
  }
  dl {
    text-align: left;
    margin: 0;
  }
  dt {
    font-family: var(--title-font);
    letter-spacing: 0.08em;
    margin-top: 0.6rem;
  }
  dd {
    margin: 0.15rem 0 0;
    color: var(--grey);
    line-height: 1.4;
  }
  button {
    margin-top: 1rem;
  }
</style>
