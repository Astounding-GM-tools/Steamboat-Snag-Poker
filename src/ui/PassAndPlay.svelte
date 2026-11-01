<script lang="ts">
  import { untrack } from 'svelte';
  import { nextSessionHand, newSession, seatOf, submit, waitingFor, type Action, type SessionPlayer, type TableSession } from '../engine';
  import { t } from '../i18n';
  import Table, { type TableView } from './Table.svelte';
  import { name } from './format';

  /**
   * Pass-and-play: a table of people (and AIs) on one device. Each person
   * sees the table from their own seat; when their move is made and someone
   * else still owes one, the screen asks for the phone to be passed, and the
   * next person confirms before their cards show. When the last move is in,
   * whoever holds the phone sees the street play out, and moves first on the
   * next one. The game is a table session (session.ts): the same that a
   * server could hold, one seat per person.
   */
  let { players, onmenu }: { players: SessionPlayer[]; onmenu: () => void } = $props();

  let session = $state.raw<TableSession>(newSession(Date.now() >>> 0, untrack(() => players)));
  /** Whose seat the table is shown from (an index into the session's seats). */
  let viewer = $state(untrack(() => session.seated[waitingFor(session)[0] ?? 0]));
  /** The phone is being passed to this seat: their cards stay hidden until they say it's them. */
  let passing = $state<number | null>(null);
  /** The table taken over mid-hand by the next person: shown as it stands. Each handover draws it afresh. */
  let taken = $state(false);
  let handover = $state(0);
  /** Every seat's money when the hand began. */
  let startMoney = $state(untrack(() => session.seats.map((p) => p.money)));

  const view = $derived.by((): TableView => {
    const n = session.seats.length;
    // Everyone else across the top, in seat order from the one after yours round the table (the broke still in their chairs).
    const others = Array.from({ length: n - 1 }, (_, k) => (viewer + 1 + k) % n);
    return {
      round: session.round!,
      config: session.config,
      hand: session.hand,
      ids: session.seated.map((i) => session.seats[i].id),
      me: seatOf(session, viewer),
      chairs: others.map((i) => ({ id: session.seats[i].id, seat: seatOf(session, i) })),
      start: session.seated.map((i) => startMoney[i]),
      money: session.seated.map((i) => session.seats[i].money),
      phase: session.phase,
      asItStands: taken,
    };
  });

  /** Your move (or none, when you're out of the hand): kept; if someone else still owes one, the phone goes to them. */
  function play(action: Action | null) {
    const played = session.round!.history.length;
    if (action) session = submit(session, view.me, action);
    // The street played out (the last move was in): the one holding the phone sees it, and moves first on the next.
    if (action && session.round!.history.length > played) return;
    const owed = waitingFor(session);
    if (owed.length) passing = session.seated[owed[0]];
  }

  function taken_over() {
    if (passing === null) return;
    viewer = passing;
    passing = null;
    taken = true;
    handover++;
  }

  /** After the verdict: the next hand, from the same seat (the phone stays where it is). */
  function next() {
    if (session.phase !== 'handEnd') return;
    session = nextSessionHand(session);
    startMoney = session.seats.map((p) => p.money);
    // Out of money, the one holding the phone hands it on.
    if (session.seats[viewer].out) {
      const owed = waitingFor(session);
      if (owed.length) passing = session.seated[owed[0]];
    }
  }

  function again() {
    session = newSession(Date.now() >>> 0, players);
    startMoney = session.seats.map((p) => p.money);
    viewer = session.seated[waitingFor(session)[0] ?? 0];
    passing = null;
    taken = false;
    handover++;
  }

  const over = $derived(session.phase === 'over');
  const winner = $derived(session.seats.find((p) => !p.out));
  const label = (i: number) => name(session.seats[i].id);
</script>

{#snippet ending()}
  <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
  <button onclick={again}>{t('hr.again')}</button>
{/snippet}

<div class="pass-and-play">
  {#key handover}
    <Table table={view} onplay={play} onnext={next} {onmenu} buttons={over ? ending : undefined} />
  {/key}

  {#if over && winner}
    <div class="notice"><p class="big">{t('pass.wins', { name: name(winner.id) })}</p></div>
  {/if}

  {#if passing !== null}
    <!-- Nobody sees the next person's cards before they've taken the phone. -->
    <div class="pass">
      <p class="small">{t('pass.passTo')}</p>
      <p class="big">{label(passing)}</p>
      <button onclick={taken_over}>{t('pass.itsMe', { name: label(passing) })}</button>
    </div>
  {/if}
</div>

<style>
  .pass-and-play {
    position: relative;
  }
  .pass {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-content: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
    background: #0c0c0b;
  }
  .pass .small {
    margin: 0;
    color: var(--grey);
  }
  .pass .big {
    margin: 0;
    font-family: var(--title-font);
    font-size: 2rem;
  }
  .notice {
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 30%;
    max-width: calc(480px - 2rem);
    margin-inline: auto;
    padding: 1rem;
    z-index: 60;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    outline: 1px solid var(--paper);
    outline-offset: 4px;
    text-align: center;
  }
  .notice .big {
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.4rem;
  }
</style>
