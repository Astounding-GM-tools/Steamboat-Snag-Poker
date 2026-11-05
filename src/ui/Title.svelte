<script lang="ts">
  import { t } from '../i18n';
  import BoatScene from './BoatScene.svelte';
  import HowTo from './HowTo.svelte';
  import Options from './Options.svelte';
  import { heavy } from './heavy';

  interface Props {
    /** Month of the voyage in progress, if any. */
    savedMonth: number | null;
    onstart: () => void;
    oncontinue: () => void;
    /** Morag's lessons. */
    ontutorial: () => void;
    /** The story (its first days): the one in progress, or with `afresh`, a new one. */
    onstory: (afresh?: boolean) => void;
    /** A story voyage is in progress. */
    storySaved: boolean;
    /** In development: scenes of the story to jump to. */
    scenes: string[];
    onscene: (scene: number) => void;
  }
  let { savedMonth, onstart, oncontinue, ontutorial, onstory, storySaved, scenes, onscene }: Props = $props();
  let showHowTo = $state(false);
  let showOptions = $state(false);
  /** How many taglines the language file has (title.tagline.0 … n-1); one is picked per visit. */
  const TAGLINES = 12;
  const tagline = Math.floor(Math.random() * TAGLINES);

  let confirmAbandon = $state(false);

  function newVoyage() {
    if (savedMonth) confirmAbandon = true;
    else onstart();
  }
</script>

<div class="title">
  <div class="stage">
  {#if showHowTo}<HowTo />{/if}
  {#if showOptions}<Options />{/if}
  <!-- A stern-wheeler steaming to the right: the wheel at the back turns so its
       lower paddles push the water astern; smoke trails back from three stacks
       that puff as they breathe; the river laps up over the hull. -->
  <BoatScene />

  <div class="intertitle menu">
    <button class="ghost icon help" onclick={() => (showHowTo = true)} aria-label={t('title.howTo')}>?</button>
    <!-- Options: the gear as text (an iPhone would draw the emoji in colour). -->
    <button class="ghost icon gear" onclick={() => (showOptions = true)} aria-label={t('options.title')}>{'\u2699\uFE0E'}</button>
    <h1 class="game-title">
      <span class="line-1">{t('title.line1')}</span>
      <span class="line-2">{t('title.line2')}</span>
    </h1>
    <p class="tagline">{t(`title.tagline.${tagline}`)}</p>
  </div>
  </div>

  <!-- The same two buttons, in the same places, as at the table: black left, white right. -->
  <div class="dock">
    <!-- The tutorial takes the free black button: for new players, and on How to play for everyone. -->
    <div class="actions" use:heavy>
      {#if showOptions}
        <button onclick={() => (showOptions = false)}>{t('draw.close')}</button>
      {:else if showHowTo}
        <button class="ghost" onclick={() => ((showHowTo = false), ontutorial())}>{t('title.tutorial')}</button>
        <button onclick={() => (showHowTo = false)}>{t('draw.close')}</button>
      {:else}
        <!-- One button for each thing to do, stacked; the likeliest (white) nearest the thumb: Continue, if there's a
             voyage to pick up, else League. (Story will come in above League.) -->
        <div class="menu">
          <button class="ghost" onclick={ontutorial}>{t('title.tutorial')}</button>
          {#if scenes.length}
            <select class="scenes" onchange={(e) => onscene(Number(e.currentTarget.value))}>
              <option selected disabled>Jump to scene (dev)</option>
              {#each scenes as label, i}<option value={i}>{label}</option>{/each}
            </select>
          {/if}
          <!-- In development only: throw the story in progress away (the dev server, your phone on it too). -->
          {#if import.meta.env.DEV && storySaved}<button class="ghost" onclick={() => onstory(true)}>Restart Story (dev)</button>{/if}
          <button class="ghost" onclick={() => onstory()}>{storySaved ? t('title.storyContinue') : t('title.story')}</button>
          {#if savedMonth}
            <button class="ghost" onclick={newVoyage}>{t('title.league')}</button>
            <button onclick={oncontinue}>{t('title.continue')}</button>
          {:else}
            <button onclick={onstart}>{t('title.league')}</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  {#if confirmAbandon}
    <div class="overlay">
      <div class="intertitle">
        <h2>{t('title.abandon')}</h2>
        <p>{t('title.abandonBody', { month: savedMonth ?? 0 })}</p>
        <div class="buttons">
          <button onclick={() => ((confirmAbandon = false), onstart())}>{t('title.abandonYes')}</button>
          <button class="ghost" onclick={() => (confirmAbandon = false)}>{t('title.abandonNo')}</button>
        </div>
      </div>
    </div>
  {/if}


</div>

<style>
  /*
   * The same screen grid as the table (Table.svelte): 12 columns, capped at a big
   * phone's width, anchored to the bottom with the same padding, so the two
   * buttons sit exactly where the table's do. The boat and the title card share
   * the room above.
   */
  .title {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: 1fr auto;
    column-gap: 0.5rem;
    row-gap: clamp(0.6rem, 2.5vh, 1.75rem);
    width: 100%;
    max-width: 480px;
    min-height: 100svh;
    margin: 0 auto;
    padding: 1rem 1rem 0.75rem;
  }
  :global(.short) .title {
    row-gap: 0.4rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  .stage {
    grid-column: 1 / -1;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 1rem;
  }
  .dock {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    /* Above the title card's spotlight shadow, and the film's vignette and grain: the buttons must read clearly. */
    position: relative;
    z-index: 51;
  }
  .actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
  }
  .actions > :first-child {
    grid-column: 1 / 7;
  }
  .actions > :last-child {
    grid-column: 7 / 13;
  }
  /* The menu: full-width buttons, one above another. */
  .actions > .menu {
    grid-column: 1 / -1;
    display: grid;
    gap: 0.6rem;
  }
  .actions button {
    padding-top: 0.6em;
    padding-bottom: 0.6em;
    white-space: nowrap;
  }
  .actions button:not(.ghost) {
    outline-offset: -2px;
  }
  @media (max-width: 600px) {
    .actions button {
      font-size: 1.15rem;
      padding-left: 0.5em;
      padding-right: 0.5em;
    }
  }
  .scenes {
    font: inherit;
    padding: 0.4em;
    background: var(--ink);
    color: var(--paper);
    border: 1px solid var(--paper);
  }
  .tagline {
    font-style: italic;
    color: var(--grey);
  }
  .menu {
    position: relative;
  }
  /* How it works, tucked into the corner of the menu card. */
  .gear {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    padding: 0 0.45em;
    font-size: 1rem;
    border-radius: 50%;
  }
  .help {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    padding: 0 0.55em;
    font-size: 1rem;
    border-radius: 50%;
  }
  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1.5rem 0 1rem;
  }
  .menu {
    padding-bottom: 1.5rem;
  }
  .game-title {
    line-height: 1;
    margin-bottom: 0.4em;
  }
  .game-title span {
    display: block;
  }
  /* "Steamboat" is a word shorter, so it runs a size larger to line up with "Snag Poker". */
  .line-1 {
    font-size: 1.06em;
    letter-spacing: 0.02em;
  }
  .line-2 {
    margin-top: 0.08em;
  }
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 20;
  }
</style>
