<script lang="ts">
  import { untrack } from 'svelte';
  import {
    BOAT,
    ITEMS,
    buy,
    canBuy,
    canCastOff,
    castOff,
    choose,
    closingLines,
    currentStep,
    handDone,
    leaveEncounter,
    lostAtThisShowdown,
    mySeatAt,
    newJourney,
    playEncounter,
    proceed,
    seatOf,
    snagDef,
    wonWithTrips,
    type Action,
    type JourneyState,
    type StoryLine,
  } from '../engine';
  import { t } from '../i18n';
  import { RIVER, RIVER_START, RIVER_TALK } from '../story/river';
  import { roundScript } from '../story/script';
  import Table, { type TableView } from './Table.svelte';
  import { called, snagTitle } from './format';
  import { loadJourney, saveJourney } from './storage';

  /**
   * The story (Steamboat to St. Louis): the voyage's steps one after another
   * (src/engine/journey.ts plays them, src/story/river.ts says what they are).
   * A caption is a title card to read; the morning council is the crew's
   * advice and the landing's trader; an encounter is played at the table, and
   * what came of it is read after. The voyage is saved at every step.
   */
  let { onmenu, fresh = false }: { onmenu: () => void; fresh?: boolean } = $props();

  let journey = $state.raw<JourneyState>(untrack(() => (!fresh && loadJourney()) || newJourney(Date.now() >>> 0, RIVER, RIVER_START)));
  $effect(() => {
    const j = journey;
    untrack(() => saveJourney(j));
  });

  const step = $derived(currentStep(journey, RIVER));
  const enc = $derived(journey.encounter);
  const playing = $derived(step?.type === 'encounter' && !!enc && !enc.outcome);

  /** Who's speaking, by what they're called aboard (none: the title card's own words). */
  function speaker(line: StoryLine): string | null {
    if (!line.who) return null;
    if (line.who === 'you') return t('character.captain.you');
    return called(line.who);
  }

  /** The table as last shown: one on its way out may still be finishing an animation, and reads it. */
  const last: { view: TableView | null } = { view: null };
  const view = $derived.by((): TableView | null => {
    if (!enc || enc.outcome) return null;
    const s = enc.session;
    const n = s.seated.length;
    const me = mySeatAt(enc);
    // Everyone else across the top, in seat order from the one after yours.
    const from = me >= 0 ? me : 0;
    const others = Array.from({ length: n - 1 }, (_, k) => (from + 1 + k) % n);
    return (last.view = {
      round: s.round!,
      config: s.config,
      hand: s.hand,
      ids: s.seated.map((i) => s.seats[i].id),
      me,
      chairs: s.seats.flatMap((p, i) => (i === 0 ? [] : [{ id: p.id, seat: seatOf(s, i) }])).sort((a, b) => others.indexOf(a.seat) - others.indexOf(b.seat)),
      start: enc.start,
      money: s.seated.map((i) => s.seats[i].money),
      phase: s.phase,
      currency: enc.def.stake === 'strength' ? 'buttons' : undefined,
      label: t('river.day', { day: journey.day + journey.nights }),
      ...(s.seats.some((p) => p.obstacle) ? { winLine: t('river.heldGround') } : {}),
      ending: s.phase === 'over' ? (s.seats[0].out ? 'lostAll' : 'wonAll') : undefined,
    });
  });

  function play(action: Action | null) {
    journey = playEncounter(journey, action);
  }
  function next() {
    if (!enc || enc.outcome || enc.session.phase === 'hand') return;
    const after = handDone(journey, RIVER);
    // Nothing to read after it (all said at the table): straight on.
    const outcome = after.encounter?.outcome;
    journey = outcome && step?.type === 'encounter' && !closingLines(after, step, outcome).length ? leaveEncounter(after, RIVER) : after;
  }
  /** The encounter's talk: its own for a second try (`sandbar:2`), if it has one. */
  function talkNow() {
    const id = enc!.def.id;
    const attempt = step?.type === 'encounter' ? (step.attempt ?? 1) : 1;
    const talk = RIVER_TALK[`${id}:${attempt}`] ?? RIVER_TALK[id];
    if (typeof talk !== 'function') return roundScript(talk, enc!.session.hand);
    const s = enc!.session;
    const obstacle = s.seats.findIndex((p) => p.obstacle);
    const round = s.round;
    const res = round?.result;
    const me = mySeatAt(enc!);
    const fixed = s.round?.result ? (s.settled?.absorbed ?? []).map((a) => ({ id: s.seats[s.seated[a.seat]].id, snag: a.snag })) : [];
    return talk({ hand: s.hand, pile: s.seats[obstacle]?.money ?? 0, seed: journey.rngState, fixed, day: journey.day + journey.nights, trips: res ? wonWithTrips(res) : false, lost: enc!.lostAtShowdown + (round ? lostAtThisShowdown(round, me) : 0), foldedOut: !!res?.byFolds && !!round?.seats[me]?.folded, met: journey.flags.includes(`met:${id}`) });
  }

  /** A reply at the table that decides what happens next. */
  function talked(effect: string) {
    if (step?.type === 'encounter' && step.choices?.[effect]) journey = choose(journey, RIVER, effect);
  }
  function onwards() {
    if (!step) return;
    if (step.type === 'caption') journey = proceed(journey, RIVER);
    else if (step.type === 'council' && canCastOff(journey, RIVER)) journey = castOff(journey, RIVER);
    else if (step.type === 'encounter' && enc?.outcome) journey = leaveEncounter(journey, RIVER);
  }
  function purchase(id: string) {
    if (canBuy(journey, RIVER, id)) journey = buy(journey, RIVER, id);
  }

  /** What the encounter left you: troubles taken on (against an obstacle). */
  const taken = $derived.by(() => {
    if (!enc?.outcome) return [] as string[];
    const obstacle = enc.def.rivals !== 'crew' && enc.def.rivals.some((r) => r.obstacle);
    return obstacle ? enc.session.seats[0].jokers.map((j) => snagTitle(j.index)) : [];
  });
  const carried = $derived(journey.snags.map((j) => snagTitle(j.index)));
  const troubles = $derived(journey.snags.filter((j) => snagDef(j.index).kind === 'trouble').length);
</script>

{#if journey.done || !step}
  <div class="page">
    <div class="panel intertitle">
      <h2>{t('river.done')}</h2>
    </div>
    <div class="dock"><button onclick={onmenu}>{t('river.backToTitle')}</button></div>
  </div>
{:else if playing && view}
  <!-- Encounters may follow one another with nothing between: each sits down at a table of its own. -->
  {#key `${journey.day}:${journey.step}:${journey.pending.length}`}
    <!-- Running aground: the whole picture lurches as the table comes up. -->
    <div class:jolt={step?.type === 'encounter' && step.jolt}>
      <Table table={view ?? last.view!} onplay={play} onnext={next} {onmenu} script={talkNow()} ontalk={talked} />
    </div>
  {/key}
{:else}
  <div class="page">
    <!-- Where the boat stands: the day, the place, the purse, the crew's strength, the coal. -->
    <div class="status" class:unseen={!journey.mornings}>
      <span class="day">{t('river.day', { day: journey.day + journey.nights })} · {t(`place.${journey.place}`)}</span>
      <span>{t('river.purse')} ${journey.purse}</span>
      <span>{t('river.strength')} {journey.strength}</span>
      <span>{t('river.coal')} {t('river.coalLoads', { n: journey.coal, max: BOAT.bunker })}</span>
    </div>

    <div class="panel intertitle">
      {#if step.type === 'caption'}
        {#if step.title}<h2>{step.title}</h2>{/if}
        {#each step.lines as line}
          {@const who = speaker(line)}
          <p class:said={!!who}>{#if who}<span class="who">{who}:</span>{' '}{/if}{line.text}</p>
        {/each}
      {:else if step.type === 'council'}
        <h2>{t('river.council')}</h2>
        {#each step.advice as line}
          <p class="said"><span class="who">{speaker(line)}:</span>{' '}{line.text}</p>
        {/each}
        <h3>{t('river.trader')}</h3>
        <ul class="trader">
          {#each step.trader as id}
            {@const item = ITEMS[id]}
            {@const owned = item.once && journey.upgrades.includes(id)}
            <li>
              <span class="item"><strong>{t(`item.${id}.name`)}</strong><small>{t(`item.${id}.desc`)}</small></span>
              <button class="ghost" disabled={!canBuy(journey, RIVER, id)} onclick={() => purchase(id)}>{owned ? t('river.owned') : `$${item.price}`}</button>
            </li>
          {/each}
        </ul>
        {#if !canCastOff(journey, RIVER)}<p class="warn">{t('river.needCoal', { n: step.coal })}</p>{/if}
      {:else if step.type === 'encounter' && enc?.outcome}
        {@const lines = closingLines(journey, step, enc.outcome)}
        {#if enc.oddJob}<p class="note">{t('river.oddJob', { n: enc.oddJob })}</p>{/if}
        {#each lines as line}
          {@const who = speaker(line)}
          <p class:said={!!who}>{#if who}<span class="who">{who}:</span>{' '}{/if}{line.text}</p>
        {/each}
        {#if taken.length}<p class="note">{t('river.troublesTaken', { list: taken.join(', ') })}</p>{/if}
        {#if enc.fixed.length}<p class="note">{t('river.absorbed', { list: enc.fixed.map(snagTitle).join(', ') })}</p>{/if}
      {/if}
      {#if carried.length && step.type !== 'caption'}
        <p class="carried" class:troubled={troubles > 0}>{t('river.snags')}: {carried.join(', ')}</p>
      {/if}
    </div>

    <div class="dock">
      <button class="ghost" onclick={onmenu}>{t('river.menu')}</button>
      <button disabled={step.type === 'council' && !canCastOff(journey, RIVER)} onclick={onwards}>
        {step.type === 'council' ? (step.leave ?? t('river.castOff')) : t('river.continue')}
      </button>
    </div>
  </div>
{/if}

<style>
  .jolt {
    animation: jolt 0.55s ease-out;
  }
  @keyframes jolt {
    0% {
      transform: translate(0, 0) rotate(0);
    }
    12% {
      transform: translate(-14px, 9px) rotate(-1.6deg);
    }
    30% {
      transform: translate(10px, -6px) rotate(1.1deg);
    }
    50% {
      transform: translate(-6px, 3px) rotate(-0.6deg);
    }
    72% {
      transform: translate(3px, -1px) rotate(0.3deg);
    }
    100% {
      transform: none;
    }
  }
  .page {
    min-height: 100svh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 1rem;
    max-width: 480px;
    margin: 0 auto;
    padding: 1rem;
    position: relative;
    z-index: 51;
  }
  .status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1rem;
    font-size: 0.85rem;
    color: var(--grey);
  }
  /* Before the first morning there's nothing to show yet; the row keeps its room. */
  .status.unseen {
    visibility: hidden;
  }
  .status .day {
    flex-basis: 100%;
    font-family: var(--title-font);
    color: var(--paper);
    font-size: 1rem;
  }
  .panel {
    align-self: center;
    box-shadow: none;
    padding: 1.5rem 1.25rem;
    text-align: left;
  }
  .panel h2 {
    text-align: center;
  }
  .panel h3 {
    font-family: var(--title-font);
    font-weight: normal;
    margin: 1.2rem 0 0.4rem;
  }
  .panel p {
    margin: 0 0 0.7rem;
    line-height: 1.4;
  }
  .panel p:not(.said) {
    text-align: center;
  }
  .who {
    font-family: var(--title-font);
  }
  .trader {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }
  .trader li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
    align-items: center;
  }
  .item {
    display: grid;
  }
  .item small {
    color: var(--grey);
  }
  .trader button {
    font-size: 0.95rem;
    padding: 0.3em 0.8em;
  }
  .warn,
  .note,
  .carried {
    color: var(--grey);
    font-size: 0.9rem;
  }
  .panel p.carried {
    margin-top: 1.1rem;
    text-align: left;
  }
  .carried.troubled {
    color: var(--paper);
  }
  .dock {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  .dock > :only-child {
    grid-column: 1 / -1;
  }
  .dock button {
    padding: 0.6em 0.5em;
  }
</style>
