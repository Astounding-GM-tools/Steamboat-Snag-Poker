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
    closeMenu,
    closingLines,
    currentStep,
    goTo,
    handDone,
    hubOptions,
    leaveEncounter,
    lostAtThisShowdown,
    mySeatAt,
    newJourney,
    playEncounter,
    proceed,
    setRehire,
    setStation,
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
  import BoatScene from './BoatScene.svelte';
  import ShipPage from './ShipPage.svelte';
  import Speech, { autoMs, type SpeechLine } from './Speech.svelte';
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
      label: t('river.day', { day: journey.mornings }),
      ...(s.seats.some((p) => p.obstacle) ? { winLine: t('river.heldGround') } : {}),
      ...(enc.def.proxy ? { proxy: t('river.proxy') } : {}),
      ending: s.phase === 'over' ? (s.seats[0].out ? 'lostAll' : 'wonAll') : undefined,
    });
  });

  /** What's on a crew member's mind on this screen. */
  const advice = $derived.by((): StoryLine | null => {
    if (step?.type === 'hub') return RIVER.hubs?.[step.hub].advice(journey) ?? null;
    return step?.type === 'council' ? (step.advice[0] ?? null) : null;
  });
  const adviceWords = $derived(advice?.who ? `${advice.who}|${advice.text}` : null);
  let popped = $state<SpeechLine | null>(null);
  let shipOpen = $state(false);
  // It pops in when there's something new to say, and closes by itself.
  $effect(() => {
    if (!adviceWords) {
      popped = null;
      return;
    }
    const [who, text] = adviceWords.split('|');
    const line = { size: 'aside' as const, who, text };
    popped = line;
    const timer = setTimeout(() => (popped = null), autoMs(line) ?? 0);
    return () => clearTimeout(timer);
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
  /** What's said at this table, as the hand stands. */
  function talkNow() {
    const id = enc!.def.id;
    const talk = RIVER_TALK[id];
    if (!talk) return undefined;
    if (typeof talk !== 'function') return roundScript(talk, enc!.session.hand);
    const s = enc!.session;
    const obstacle = s.seats.findIndex((p) => p.obstacle);
    const round = s.round;
    const res = round?.result;
    const me = mySeatAt(enc!);
    const fixed = res ? (s.settled?.absorbed ?? []).map((a) => ({ id: s.seats[s.seated[a.seat]].id, snag: a.snag })) : [];
    return talk({
      hand: s.hand,
      pile: s.seats[obstacle]?.money ?? 0,
      seed: journey.seed,
      fixed,
      day: journey.mornings,
      trips: res ? wonWithTrips(res) : false,
      lost: enc!.lostAtShowdown + (round ? lostAtThisShowdown(round, me) : 0),
      foldedOut: !!res?.byFolds && !!round?.seats[me]?.folded,
      met: journey.flags.includes(`met:${id}`),
      attempt: step?.type === 'encounter' ? (step.attempt ?? 1) : 1,
    });
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
    {#if shipOpen}<ShipPage {journey} onrehire={(id, on) => (journey = setRehire(journey, id, on))} onstation={(id, station) => (journey = setStation(journey, id, station))} onclose={() => (shipOpen = false)} />{/if}
    <div class="status" class:unseen={!journey.mornings}>
      <span class="day">{t('river.day', { day: journey.mornings })} · {t(`place.${journey.place}`)} · {t(`river.slot.${journey.time}`)}</span>
      <span>{t('river.purse')} ${journey.purse}</span>
      <span>{t('river.strength')} {journey.strength}</span>
      <span>{t('river.coal')} {t('river.coalLoads', { n: journey.coal, max: BOAT.bunker })}</span>
      <button class="ghost wheel" aria-label={t('ship.open')} onclick={() => (shipOpen = true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2.5" />
          {#each [0, 45, 90, 135] as turn}<line x1="12" y1="2" x2="12" y2="22" transform="rotate({turn} 12 12)" />{/each}
        </svg>
      </button>
    </div>

    {#if step.type === 'hub' || step.type === 'council' || step.type === 'caption'}
      <div class="scene">
        <div class="boat"><BoatScene /></div>
        <!-- A word from the crew pops in over her, and goes by itself (or at a tap). -->
        {#if popped}<Speech line={popped} name={called(popped.who)} opponent={false} top={24} bottom={24} onnext={() => (popped = null)} />{/if}
      </div>
    {/if}

    <div class="panel intertitle">
      {#if step.type === 'hub'}
        <ul class="trader">
          {#each hubOptions(journey, RIVER) as { option, open } (option.id)}
            <li>
              <span class="item"><strong>{t(`hub.${option.id}.name`)}</strong><small>{t(`hub.${option.id}.desc`, { n: journey.coal, max: BOAT.bunker })}</small></span>
              <button class="ghost" disabled={!open} onclick={() => (journey = goTo(journey, RIVER, option.id))}>{option.cost ? `$${option.cost}` : !open && option.coal ? t('river.needsCoal', { n: option.coal }) : t('river.go')}</button>
            </li>
          {/each}
        </ul>
      {:else if step.type === 'caption'}
        {#if step.title}<h2>{step.title}</h2>{/if}
        {#each step.lines as line}
          {@const who = speaker(line)}
          <p class:said={!!who}>{#if who}<span class="who">{who}:</span>{' '}{/if}{line.text}</p>
        {/each}
      {:else if step.type === 'council'}
        <h2>{t(step.title ?? 'river.council')}</h2>
        <ul class="trader">
          {#each step.trader as id}
            {@const item = ITEMS[id]}
            {@const owned = item.once && journey.upgrades.includes(id)}
            <li>
              <span class="item"><strong>{t(`item.${id}.name`)}</strong><small>{t(`item.${id}.desc`)}</small></span>
              <button class="ghost" disabled={!canBuy(journey, RIVER, id)} onclick={() => purchase(id)}>{owned ? t('river.owned') : item.price < 0 ? `+$${-item.price}` : `$${item.price}`}</button>
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
      {#if journey.submenu}
        <button class="ghost" onclick={() => (journey = closeMenu(journey))}>{t('river.back')}</button>
      {:else}
        <button class="ghost" onclick={onmenu}>{t('river.menu')}</button>
      {/if}
      {#if step.type !== 'hub'}
        <button disabled={step.type === 'council' && !canCastOff(journey, RIVER)} onclick={onwards}>
          {step.type === 'council' ? (step.leave ?? t('river.castOff')) : t('river.continue')}
        </button>
      {/if}
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
    align-content: space-between;
    gap: 1rem;
    max-width: 480px;
    margin: 0 auto;
    padding: 1rem;
    position: relative;
    z-index: 51;
  }
  .status {
    padding-right: 3rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1rem;
    font-size: 0.85rem;
    color: var(--grey);
  }
  .scene {
    position: relative;
  }
  .boat {
    --boat-width: 100%;
    max-width: 280px;
    width: 100%;
    margin: 0 auto;
  }
  /* Before the first morning there's nothing to show yet; the row keeps its room. */
  .status.unseen {
    visibility: hidden;
  }
  /* The way into The Best Intentions: her paddle wheel, gently turning. */
  .wheel {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    width: 2.6rem;
    height: 2.6rem;
    padding: 0.2rem;
    border: none;
  }
  .wheel svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: var(--paper);
    stroke-width: 1.3;
    animation: wheel 9s linear infinite;
  }
  @keyframes wheel {
    to {
      transform: rotate(360deg);
    }
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
