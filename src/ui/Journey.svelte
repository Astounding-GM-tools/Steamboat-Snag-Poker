<script lang="ts">
  import { untrack } from 'svelte';
  import {
    BOAT,
    ITEMS,
    Rng,
    chooseLane,
    passIsland,
    writeLog,
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
    pushAgain,
    setRehire,
    setStation,
    turnBack,
    snagDef,
    wonWithTrips,
    type JourneyState,
    type StoryLine,
  } from '../story/mechanics';
  import { seatOf, type Action } from '../engine';
  import { t } from '../i18n';
  import { RIVER, RIVER_START, RIVER_TALK } from '../story/river';
  import { roundScript } from '../story/mechanics/script';
  import BoatScene from './BoatScene.svelte';
  import RiverBackdrop from './map/RiverBackdrop.svelte';
  import { voyage } from './map/tuning.svelte';
  import { loadLeg } from './map/legs';
  import TypedLine from './TypedLine.svelte';
  import LogView from './LogView.svelte';
  import { CHOICE_RECORDS, ENCOUNTER_RECORDS, UNDER_WAY_AGAIN, castOffRecord, islandRecord, tradeRecord } from '../story/log';
  import { islandKey, sides, type Island, type Pt, type TravelSidecar } from './map/route';
  import { heavy } from './heavy';
  import ShipPage from './ShipPage.svelte';
  import Speech, { autoMs, type SpeechLine } from './Speech.svelte';
  import Table, { type TableView } from './Table.svelte';
  import { called, snagTitle } from './format';
  import { loadJourney, saveJourney } from './storage';

  /**
   * The story (Steamboat to St. Louis): the voyage's steps one after another
   * (src/story/mechanics plays them, src/story/chapters says what they are).
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

  /** How often she moves while steaming (ms): thirty times a second is smooth at a riverboat's pace. */
  const STEP_MS = 1000 / 30;

  /** Development only: she steams the leg over and over, with nothing to stop her (no islands, chatter or encounters): something running while we work. */
  const endless = $derived(import.meta.env.DEV && journey.flags.includes('dev:endless'));

  /** Which way she's bound: up the river to Dubuque, then down (chapter one is all northbound). */
  const bound = $derived(journey.flags.includes('southbound') ? 'southbound' : 'northbound');
  /** The log's latest line, under the heading: typed out as it's written. */
  const lastEntry = $derived(journey.log?.at(-1)?.text ?? null);
  /** How much of the log has been seen typed (or was there already when the voyage was opened): what's beyond is typed out when it shows. */
  let seenLog = $state(untrack(() => journey.log?.length ?? 0));
  const freshEntry = $derived((journey.log?.length ?? 0) > seenLog);
  const typed = () => (seenLog = journey.log?.length ?? 0);
  /** The log open over the river (the header opens it). */
  let logOpen = $state(false);
  /** The voyage's heading: "Day 2: Muscatine, northbound". */
  const heading = $derived(t('river.heading', { day: journey.mornings, place: t(`place.${journey.place}`), bound: t(`river.${bound}`) }));

  /** Out on the river (or setting out on it): the map is beneath the felt. */
  const onRiver = $derived(!!journey.river || step?.type === 'steam');
  const leg = $derived(journey.river?.leg ?? (step?.type === 'steam' ? step.leg : ''));
  /** Where she is on the leg's map, as she steams. */
  let boatT = $state(untrack(() => journey.river?.t ?? 0));
  /** Skip held: she races on to wherever she's bound, or till something stops her. */
  let racing = $state(false);
  $effect(() => {
    if (step?.type !== 'steam') {
      if (journey.river) boatT = journey.river.t;
      return;
    }
    const to = step.to;
    racing = false;
    // Willie logs her getting under way (once: a reload mid-stretch doesn't log it again).
    untrack(() => {
      const line = steamFrom === 0 ? castOffRecord(t(`place.${journey.place}`), t(`river.${bound}`)) : UNDER_WAY_AGAIN;
      if (journey.log?.at(-1)?.text !== line) journey = writeLog(journey, line);
    });
    let last = performance.now(), raf = 0;
    const tick = (now: number) => {
      if (now - last < STEP_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const dir = Math.sign(to - boatT);
      boatT += dir * Math.min(Math.abs(to - boatT), (dt / voyage.legSeconds) * (racing ? voyage.race : 1));
      // Endless (development): back to where she started, and round again.
      if (boatT === to && endless) boatT = steamFrom;
      if (boatT === to) journey = proceed(journey, RIVER);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  /** A table just come up on the river: its things slide in over the map (and only then: a jolt after mustn't replay it). */
  let arriving = $state(false);
  $effect(() => {
    void shownKey;
    if (!untrack(() => onRiver && !lifting)) return;
    arriving = true;
    const timer = setTimeout(() => (arriving = false), 2000);
    return () => clearTimeout(timer);
  });

  /** Something hit her mid-talk (a line's `jolt`): the table and the map lurch together. */
  let jolted = $state(false);
  let overEl = $state<HTMLElement>();
  /** The same lurch as `.jolt`, played on top of whatever the parts are doing (a CSS animation put in place of theirs would restart theirs after: a caption popped in again). */
  const LURCH: Keyframe[] = [
    { transform: 'none' },
    { transform: 'translate(-14px, 9px) rotate(-1.6deg)', offset: 0.12 },
    { transform: 'translate(10px, -6px) rotate(1.1deg)', offset: 0.3 },
    { transform: 'translate(-6px, 3px) rotate(-0.6deg)', offset: 0.5 },
    { transform: 'translate(3px, -1px) rotate(0.3deg)', offset: 0.72 },
    { transform: 'none' },
  ];
  function jolt() {
    // Everything but the rivals' row: a face changing as it's hit is worth seeing steady.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      for (const el of overEl?.querySelectorAll<HTMLElement>('.table > :not(.rivals)') ?? []) el.animate(LURCH, { duration: 550, easing: 'ease-out', composite: 'add' });
    jolted = false;
    requestAnimationFrame(() => {
      jolted = true;
      setTimeout(() => (jolted = false), 600);
    });
  }

  /** Where this stretch of river began (the boat's spot when the step came up). */
  const steamFrom = $derived(step?.type === 'steam' ? (journey.river?.t ?? 0) : 0);
  /** The crew's chatter on this stretch: evenly spaced along it, each up until a little before the next (or her arrival). */
  const chatterAt = $derived.by(() => {
    if (step?.type !== 'steam' || !step.chatter?.length) return [];
    const n = step.chatter.length, to = step.to, from = steamFrom;
    const gap = (voyage.chatterGap / voyage.legSeconds) * Math.sign(to - from);
    const starts = step.chatter.map((_, i) => from + ((i + 1) * (to - from)) / (n + 1));
    // Each line's caption made once: a new one every frame (as she moves) would start its words over and over.
    return step.chatter.map(({ who, text }, i) => ({
      speech: { size: 'aside', who: who ?? 'willie', text, auto: false } satisfies SpeechLine as SpeechLine,
      start: starts[i],
      end: (i + 1 < n ? starts[i + 1] : to) - gap,
    }));
  });
  /** Chatter tapped away, by its place on the stretch. */
  let hushed = $state<number[]>([]);
  $effect(() => {
    void step;
    hushed = [];
  });
  const chatterNow = $derived.by((): SpeechLine | null => {
    if (racing) return null;
    const between = (x: number, a: number, b: number) => (a <= b ? x >= a && x < b : x <= a && x > b);
    const k = chatterAt.findIndex((c) => between(boatT, c.start, c.end));
    return k < 0 || hushed.includes(k) ? null : chatterAt[k].speech;
  });
  const chatterIndex = $derived(chatterNow ? chatterAt.findIndex((c) => c.speech === chatterNow) : -1);

  // --- Islands: port or starboard ------------------------------------------------
  /** Opening what came aboard round an island: Willie first, and sometimes someone else has a word. */
  const SALVAGE_WORDS: { who: string; text: string | string[] }[][] = [
    [{ who: 'willie', text: 'Some good stuff in here, Captain.' }],
    [{ who: 'willie', text: 'What do you know, a box full of chocolates.' }],
    [{ who: 'willie', text: ['Crate of stamped steel spoons, more than we’ll ever need.', 'We can unload this at any mercantile dock.'] }],
    [
      { who: 'willie', text: 'Yay, beans! They will keep us fed for a full month!' },
      { who: 'gus', text: 'More beans? Why oh why could it not be pork chops and cabbage.' },
    ],
  ];
  /** What each of those was, as the log has it. */
  const SALVAGE_FOUND = ['odds and ends, some good', 'a box of chocolates', 'stamped steel spoons', 'beans, a month of them'];
  /** What's said about the last salvage, a line at a time: each up till it's answered, or a while has passed. */
  let salvageTalk = $state<SpeechLine[]>([]);
  const salvageSaid = $derived(salvageTalk[0] ?? null);
  const nextSalvageLine = () => (salvageTalk = salvageTalk.slice(1));
  $effect(() => {
    const said = salvageSaid;
    if (!said) return;
    // Closes by itself (its countdown on the speaker's portrait), or with Aye.
    const timer = setTimeout(() => {
      if (salvageSaid === said) nextSalvageLine();
    }, autoMs(said) ?? 7000);
    return () => clearTimeout(timer);
  });
  let legData = $state<TravelSidecar | null>(null);
  $effect(() => {
    const id = leg;
    if (!id) return;
    loadLeg(id).then((s) => {
      if (leg === id) legData = s;
    });
  });
  /** The islands on this stretch, in the order she meets them, each with what's adrift on one of its passages. */
  const isles = $derived.by(() => {
    if (step?.type !== 'steam' || !legData?.islands || endless) return [];
    const from = steamFrom, to = step.to, up = to >= from;
    return legData.islands
      .filter((i) => (up ? i.from_t >= from && i.to_t <= to : i.to_t <= from && i.from_t >= to))
      .sort((a, b) => (up ? a.from_t - b.from_t : b.from_t - a.from_t))
      .map((island) => {
        const key = islandKey(leg, island);
        // Where the crates are, and how many: the same each time this voyage comes by.
        let h = journey.seed;
        for (const ch of key) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
        const rng = new Rng(h);
        const side: 'left' | 'right' = rng.int(2) ? 'left' : 'right';
        return { island, key, up, prize: { side, crates: 1 + rng.int(2) }, word: rng.int(SALVAGE_WORDS.length) };
      });
  });
  const lanes = $derived(journey.lanes ?? {});
  const passed = $derived(journey.passed ?? []);
  /** The island she's coming up to (within warning) or rounding: the view leans towards it till she's past. */
  const islandNear = $derived.by(() => {
    if (step?.type !== 'steam') return null;
    const warn = voyage.forkWarning / voyage.legSeconds;
    const next = isles.find((i) => !passed.includes(i.key));
    if (!next) return null;
    const gap = next.up ? next.island.from_t - boatT : boatT - next.island.to_t;
    return gap < warn ? next : null;
  });
  /** That island, its way not yet chosen and the fork still ahead: the call goes up. */
  const forkAhead = $derived.by(() => {
    const near = islandNear;
    if (!near || racing || lanes[near.key]) return null;
    return (near.up ? near.island.from_t > boatT : near.island.to_t < boatT) ? near : null;
  });
  /** Willie's call, made once per island (a new one every frame would start its words over). */
  const forkCalls = new Map<string, SpeechLine>();
  const forkLine = $derived.by((): SpeechLine | null => {
    if (!forkAhead) return null;
    let l = forkCalls.get(forkAhead.key);
    if (!l) {
      const name = forkAhead.island.name;
      l = { size: 'aside', who: 'willie', auto: false, text: name ? t('river.namedAhead', { name }) : t('river.islandAhead') };
      forkCalls.set(forkAhead.key, l);
    }
    return l;
  });
  function steer(way: 'port' | 'starboard') {
    if (!forkAhead) return;
    journey = chooseLane(journey, forkAhead.key, sides(forkAhead.island, forkAhead.up)[way].side);
  }
  /** Where along an island the last of its crates drifts (as a fraction of the island, from the fork). */
  const LAST_CRATE = 0.65;
  // The last crate picked up, or round the island empty-handed: what was adrift along her way is aboard.
  $effect(() => {
    const t = boatT;
    const done = isles.find((i) => {
      if (passed.includes(i.key)) return false;
      const took = lanes[i.key] ?? i.island.passages.find((p) => p.kind === 'main')!.side;
      const span = i.island.to_t - i.island.from_t;
      const at = took === i.prize.side ? (i.prize.crates > 1 ? LAST_CRATE : 0.35) : 1;
      return i.up ? t >= i.island.from_t + at * span : t <= i.island.to_t - at * span;
    });
    if (!done) return;
    const took = lanes[done.key] ?? done.island.passages.find((p) => p.kind === 'main')!.side;
    const crates = took === done.prize.side ? done.prize.crates : 0;
    const { port } = sides(done.island, done.up);
    const way = took === port.side ? 'port' : 'starboard';
    untrack(() => {
      journey = writeLog(passIsland(journey, done.key, crates), islandRecord(done.island.name, way, crates, crates ? SALVAGE_FOUND[done.word] : undefined));
      if (crates) salvageTalk = SALVAGE_WORDS[done.word].map(({ who, text }) => ({ size: 'aside', who, text, auto: true }));
    });
  });
  /** The middle of an island (between its two passages' midpoints): where the view looks as she comes up to it. */
  function islandMid(island: Island): Pt {
    const m = (px: Pt[]) => px[Math.floor(px.length / 2)];
    const [a, b] = island.passages.map((p) => m(p.px));
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
  /** Crates adrift on the passages ahead: a few along the middle of the way that has them. */
  const crates = $derived(
    isles
      .filter((i) => !passed.includes(i.key))
      .flatMap(({ island, prize, key, up }) => {
        const px = island.passages.find((p) => p.side === prize.side)!.px;
        const took = lanes[key] ?? island.passages.find((p) => p.kind === 'main')!.side;
        const mid = (k: number): Pt => {
          const i = Math.min(px.length - 2, Math.floor(k * (px.length - 1)));
          const f = k * (px.length - 1) - i;
          return [px[i][0] + f * (px[i + 1][0] - px[i][0]), px[i][1] + f * (px[i + 1][1] - px[i][1])];
        };
        return Array.from({ length: prize.crates }, (_, k) => 0.35 + ((LAST_CRATE - 0.35) * k) / Math.max(1, prize.crates - 1))
          // Gone as she reaches each one, going that way.
          .filter((k) => !(took === prize.side && (up ? boatT > island.from_t + k * (island.to_t - island.from_t) : boatT < island.from_t + k * (island.to_t - island.from_t))))
          .map(mid);
      }),
  );

  /** Leaving a table for the river: the table's things slide off every which way as the felt lifts. */
  let lifting = $state(false);
  let wasPlaying = false;
  $effect.pre(() => {
    const p = playing, steaming = step?.type === 'steam';
    untrack(() => {
      if (wasPlaying && !p && steaming) {
        lifting = true;
        setTimeout(() => (lifting = false), 1500);
      }
      wasPlaying = p;
    });
  });
  /** The table's key: kept as it was while it slides away, so it isn't dealt afresh. */
  let tableKey = '';
  const shownKey = $derived.by(() => {
    const k = `${journey.day}:${journey.step}:${journey.pending.length}`;
    if (playing) tableKey = k;
    return tableKey;
  });

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
      ...(s.seats.some((p) => p.obstacle) ? { winLine: t(s.seats.some((p) => p.steady) ? 'river.gainedGround' : 'river.heldGround') } : {}),
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
    journey = outcome && step?.type === 'encounter' && !closingLines(after, step, outcome).length ? leave(after) : after;
  }
  /** Up from the table: Willie logs how it went, and on. */
  function leave(j: JourneyState): JourneyState {
    const e = j.encounter;
    const record = e?.outcome ? ENCOUNTER_RECORDS[e.def.id]?.[e.outcome] : undefined;
    return leaveEncounter(record ? writeLog(j, record) : j, RIVER);
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
      journey,
    });
  }

  /** A reply at the table that decides what happens next. */
  function talked(effect: string) {
    if (step?.type !== 'encounter' || !step.choices?.[effect]) return;
    const record = CHOICE_RECORDS[effect];
    journey = choose(record ? writeLog(journey, record) : journey, RIVER, effect);
  }
  function onwards() {
    if (!step) return;
    if (step.type === 'caption') journey = proceed(journey, RIVER);
    else if (step.type === 'council' && canCastOff(journey, RIVER)) journey = castOff(journey, RIVER);
    else if (step.type === 'encounter' && enc?.outcome) journey = leave(journey);
  }
  function purchase(id: string) {
    if (canBuy(journey, RIVER, id)) journey = writeLog(buy(journey, RIVER, id), tradeRecord(t(`item.${id}.name`), ITEMS[id].price));
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

{#if onRiver && leg}
  <RiverBackdrop {leg} t={boatT} {lanes} {crates} ahead={islandNear && !racing ? islandMid(islandNear.island) : null} mode={step?.type === 'steam' ? 'steam' : 'play'} jolt={jolted || (step?.type === 'encounter' && !!step.jolt)} />
{/if}
{#if journey.done || !step}
  <div class="page">
    <div class="panel intertitle">
      <h2>{t('river.done')}</h2>
    </div>
    <div class="dock"><button onclick={onmenu}>{t('river.backToTitle')}</button></div>
  </div>
{:else if (playing && view) || lifting}
  <!-- Encounters may follow one another with nothing between: each sits down at a table of its own. -->
  {#key shownKey}
    <!-- Running aground: the whole picture lurches as the table comes up. On the river, the table's things slide in over the map, and off it again. -->
    <div class="over" class:river={onRiver} bind:this={overEl} class:jolt={step?.type === 'encounter' && step.jolt} class:lifting class:arriving inert={lifting}>
      <Table table={view ?? last.view!} onplay={play} onnext={next} {onmenu} script={talkNow()} ontalk={talked} onjolt={jolt} />
    </div>
  {/key}
{:else if step.type === 'steam'}
  <!-- Under way: the map is the picture; Pause for the menu, or hold Skip to race on. -->
  <div class="page steaming">
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="status opens" role="button" tabindex="0" aria-label={t('log.open')} onclick={() => (logOpen = !logOpen)}>
      <span class="day">{heading}</span>
      {#if lastEntry}<TypedLine text={lastEntry} fresh={freshEntry} ontyped={typed} />{/if}
      {#if journey.salvage}<span>{t('river.salvage', { n: journey.salvage })}</span>{/if}
    </div>
    {#if logOpen && journey.log?.length}<LogView entries={journey.log} today={Math.max(1, journey.mornings)} onclose={() => (logOpen = false)} />{/if}
    {#if forkLine && !logOpen}
      <!-- An island ahead: the call goes up, and the two buttons are the helm till she's chosen (or she keeps to the main channel). -->
      {#key forkLine}
        <div class="chatter"><Speech line={forkLine} name={called('willie')} opponent={false} top={0} bottom={0} /></div>
      {/key}
    {:else if salvageSaid && !logOpen}
      {#key salvageSaid}
        <div class="chatter"><Speech line={salvageSaid} name={called(salvageSaid.who)} opponent={false} top={0} bottom={0} onnext={nextSalvageLine} /></div>
      {/key}
    {:else if chatterNow && !logOpen}
      <!-- The crew passing the time as she steams: it closes by itself before the next, or with a tap. -->
      {#key chatterIndex}
        <div class="chatter"><Speech line={chatterNow} name={called(chatterNow.who)} opponent={false} top={0} bottom={0} onnext={() => (hushed = [...hushed, chatterIndex])} /></div>
      {/key}
    {/if}
    <div class="dock" use:heavy>
      {#if forkAhead}
        <button class="ghost" onclick={() => steer('port')}>{t('river.port')}</button>
        <button onclick={() => steer('starboard')}>{t('river.starboard')}</button>
      {:else if salvageSaid || chatterNow}
        <!-- The crew talking: the white button answers them (and closes it), it doesn't skip the river. -->
        <button class="ghost" onclick={onmenu}>{t('river.pause')}</button>
        <button onclick={() => (salvageSaid ? nextSalvageLine() : (hushed = [...hushed, chatterIndex]))}>{t('river.aye')}</button>
      {:else}
        <button class="ghost" onclick={onmenu}>{t('river.pause')}</button>
        <button data-heavy="true" disabled={racing} onclick={() => (racing = true)}>{t('river.skip')}</button>
      {/if}
    </div>
  </div>
{:else}
  <div class="page">
    <!-- Where the boat stands: the day, the place, the purse, the crew's strength, the coal. -->
    {#if shipOpen}<ShipPage {journey} onrehire={(id, on) => (journey = setRehire(journey, id, on))} onstation={(id, station) => (journey = setStation(journey, id, station))} onclose={() => (shipOpen = false)} />{/if}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="status opens" class:unseen={!journey.mornings} role="button" tabindex="0" aria-label={t('log.open')} onclick={() => journey.log?.length && (logOpen = !logOpen)}>
      <span class="day">{heading}{#if step.type === 'hub'} · {t(`river.slot.${journey.time}`)}{/if}</span>
      {#if lastEntry}<TypedLine text={lastEntry} fresh={freshEntry} ontyped={typed} />{/if}
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

    {#if step.type === 'hub' || step.type === 'council' || step.type === 'caption' || step.type === 'fork'}
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
      {:else if step.type === 'fork'}
        {#each step.lines as line}
          {@const who = speaker(line)}
          <p class:said={!!who}>{#if who}<span class="who">{who}:</span>{' '}{/if}{line.text}</p>
        {/each}
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

    {#if logOpen && journey.log?.length}<LogView entries={journey.log} today={Math.max(1, journey.mornings)} onclose={() => (logOpen = false)} />{/if}
    <div class="dock">
      {#if step.type === 'fork'}
        <button class="ghost" onclick={() => (journey = turnBack(journey, RIVER))}>{t('river.turnBack')}</button>
        <button onclick={() => (journey = pushAgain(journey, RIVER))}>{t('river.pushAgain')}</button>
      {:else if journey.submenu}
        <button class="ghost" onclick={() => (journey = closeMenu(journey))}>{t('river.back')}</button>
      {:else}
        <button class="ghost" onclick={onmenu}>{t('river.menu')}</button>
      {/if}
      {#if step.type !== 'hub' && step.type !== 'fork'}
        <button disabled={step.type === 'council' && !canCastOff(journey, RIVER)} onclick={onwards}>
          {step.type === 'council' ? (step.leave ?? t('river.castOff')) : t('river.continue')}
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .over {
    position: relative;
    z-index: 1;
  }
  /* On the river, the board comes in when the round begins, not under the talk before it. */
  .river :global(.table > .felt) {
    transition:
      translate 0.8s ease-out,
      opacity 0.8s ease-out;
  }
  .river :global(.table.preamble > .felt) {
    translate: -120vw 0;
    opacity: 0;
  }
  .lifting :global(.table > .rivals) {
    animation: off-top 1.1s ease-in both;
  }
  .lifting :global(.table > .felt) {
    animation: off-left 1.1s ease-in 0.15s both;
  }
  .lifting :global(.table > .mine) {
    animation: off-right 1.1s ease-in 0.3s both;
  }
  .lifting :global(.table > .actions) {
    animation: off-bottom 0.9s ease-in 0.05s both;
  }
  .lifting :global(.table > :not(.rivals, .felt, .mine, .actions)) {
    animation: fade-out 0.5s both;
  }
  .arriving :global(.table > .rivals) {
    animation: off-top 0.8s ease-out 0.7s reverse both;
  }
  .arriving :global(.table > .felt) {
    animation: off-left 0.8s ease-out 0.8s reverse both;
  }
  .arriving :global(.table > .mine) {
    animation: off-right 0.8s ease-out 0.9s reverse both;
  }
  .arriving :global(.table > .actions) {
    animation: off-bottom 0.7s ease-out 1s reverse both;
  }
  @keyframes off-top {
    to {
      transform: translate(-6vw, -110vh) rotate(-9deg);
    }
  }
  @keyframes off-left {
    to {
      transform: translate(-120vw, 4vh) rotate(6deg);
    }
  }
  @keyframes off-right {
    to {
      transform: translate(120vw, 6vh) rotate(-5deg);
    }
  }
  @keyframes off-bottom {
    to {
      transform: translateY(60vh);
    }
  }
  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .over :global(.table > *) {
      animation: none !important;
    }
  }
  /* Low on the screen, over the river below the boat, clear of her. */
  .chatter {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 6.5rem;
  }
  .chatter :global(.speech) {
    top: auto !important;
    bottom: 0;
  }
  /* The heading opens the log. */
  .opens {
    cursor: pointer;
  }
  .steaming .dock {
    animation: fade-in 0.6s ease 0.4s both;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
  /* Everything but the rivals' row: a face changing as it's hit is worth seeing steady. */
  .jolt :global(.table > :not(.rivals)) {
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
  /* A container, like the table: a caption here (the crew's chatter, a word of advice) is sized by the page, not the screen. */
  .page {
    container-type: inline-size;
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
  .page > :global(*) {
    --u: clamp(1rem, 3.7cqw, 1.7rem);
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
