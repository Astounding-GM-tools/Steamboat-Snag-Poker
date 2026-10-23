<script lang="ts">
  import { CATEGORIES, type OpponentOdds, type Player } from '../engine';
  import { t } from '../i18n';
  import { bookmakerOdds, dollars, name, nickname } from './format';

  /**
   * A captain's portrait card: who they are, how they play, and (mid-round)
   * Willie's reckoning of what they could be holding.
   */
  let {
    captain,
    players,
    odds = null,
    onclose,
  }: { captain: Player; players: Player[]; odds?: OpponentOdds | null; onclose: () => void } = $props();
  const id = $derived(captain.id);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  /**
   * The bookmaker's rule of thumb for a tournament: your chance of taking it
   * all is your share of the money still on the river.
   */
  const riverChance = $derived.by(() => {
    const purse = (p: Player) => (p.status === 'active' ? Math.max(0, p.money) : 0);
    const total = players.reduce((sum, p) => sum + purse(p), 0);
    return total > 0 ? purse(captain) / total : 0;
  });
  // The player's own notes on this captain ("folds to any pressure"), kept in this browser.
  const notesKey = $derived(`wwr.notes.${captain.id}`);
  let notes = $state('');
  $effect(() => {
    try {
      notes = localStorage.getItem(notesKey) ?? '';
    } catch {
      notes = '';
    }
  });
  function saveNotes(text: string) {
    notes = text;
    try {
      if (text.trim()) localStorage.setItem(notesKey, text);
      else localStorage.removeItem(notesKey);
    } catch {
      /* storage unavailable */
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="intertitle card" role="dialog" aria-label={name(id)} tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <p class="purse">
      <span class="money">{dollars(captain.money)}</span>
      {#if captain.jokers.length}<span class="snags">{'🪵'.repeat(captain.jokers.length)}</span>{/if}
    </p>
    <div class="portrait">
      <div class="stamps left">
        {#if odds}
          <div class="stamp tilt-l">
            <span class="label">{t('captain.stampHand')}</span>
            <span class="value">{bookmakerOdds(odds.beatsYou)}</span>
            <span class="small">{pct(odds.beatsYou)}</span>
          </div>
        {/if}
      </div>
      <div class="oval">{name(id)[0]}</div>
      <div class="stamps right">
        <div class="stamp tilt-r">
          <span class="label">{t('captain.stampRiver')}</span>
          <span class="value">{bookmakerOdds(riverChance)}</span>
          <span class="small">{pct(riverChance)}</span>
        </div>
      </div>
      <div class="stamp seal">
        <span class="label">{t('captain.stampRecord')}</span>
        <span class="value">{captain.won ?? 0}–{captain.lost ?? 0}</span>
        <span class="small">{t('captain.vsYou', { won: captain.wonVsYou ?? 0, lost: captain.lostVsYou ?? 0 })}</span>
      </div>
    </div>
    <h2>{name(id)}</h2>
    {#if nickname(id)}<p class="aka">{t('captain.aka', { nick: nickname(id)! })}</p>{/if}
    <p class="boat">{t(`character.${id}.boat`)}</p>
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
      </section>
    {/if}
    <p class="blurb">{t(`character.${id}.blurb`)}</p>
    <dl>
      <dt><label for="captain-notes">{t('captain.notes')}</label></dt>
      <dd>
        <textarea
          id="captain-notes"
          rows="3"
          placeholder={t('captain.notesPlaceholder')}
          value={notes}
          oninput={(e) => saveNotes(e.currentTarget.value)}
        ></textarea>
      </dd>
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
    position: relative;
    width: min(480px, 100%);
    max-height: 90vh;
    overflow: auto;
  }
  .portrait {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 0.35rem;
    margin: 0.4rem 0 2.3rem;
  }
  .stamps {
    display: flex;
    align-items: center;
  }
  .stamps.left {
    justify-content: flex-end;
  }
  /* Old-fashioned rubber stamps: a double rule, small capitals, a slight tilt. */
  .stamp {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 4.2rem;
    padding: 0.25rem 0.35rem;
    border: 3px double var(--paper);
    outline: 1px solid var(--grey);
    outline-offset: 2px;
    font-family: var(--title-font);
    line-height: 1.1;
    opacity: 0.9;
  }
  .stamp .label {
    margin: 0;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    white-space: nowrap;
    text-transform: uppercase;
    color: var(--grey);
  }
  .stamp .value {
    font-size: 1rem;
    white-space: nowrap;
  }
  .stamp .small {
    font-size: 0.75rem;
    color: var(--grey);
  }
  .tilt-l {
    transform: rotate(-7deg);
  }
  .tilt-r {
    transform: rotate(6deg);
  }
  .seal {
    position: absolute;
    left: 50%;
    bottom: -2.1rem;
    min-width: 0;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    background: #111;
    transform: translateX(-50%) rotate(-3deg);
  }
  .seal .value {
    font-size: 1rem;
  }
  .oval {
    width: 110px;
    height: 140px;
    border-radius: 50%;
    border: 4px double var(--paper);
    display: grid;
    place-items: center;
    font-family: var(--title-font);
    font-size: 4rem;
    background: radial-gradient(circle, #444, #111);
  }
  /* On a phone the portrait gives way so the stamps fit beside it. */
  @media (max-width: 420px) {
    .oval {
      width: 84px;
      height: 108px;
      font-size: 3rem;
    }
  }
  h2 {
    margin-bottom: 0.1rem;
  }
  .aka {
    margin: 0 0 0.2rem;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
  }
  .boat {
    margin: 0;
    font-style: italic;
    color: var(--grey);
  }
  /* The purse sits in the top-left corner, big enough to read at a glance. */
  .purse {
    position: absolute;
    top: 0.9rem;
    left: 1rem;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  .purse .money {
    font-family: var(--title-font);
    font-size: 1.7rem;
    line-height: 1;
  }
  .purse .snags {
    font-size: 0.9rem;
    margin-top: 0.2rem;
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
  textarea {
    width: 100%;
    font-family: var(--body-font);
    font-size: 0.9rem;
    background: #1a1a18;
    color: var(--paper);
    border: 1px dashed var(--grey);
    padding: 0.4rem;
    resize: vertical;
  }
  .blurb {
    text-align: left;
    margin: 0.6rem 0 0;
    color: var(--grey);
    line-height: 1.4;
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
