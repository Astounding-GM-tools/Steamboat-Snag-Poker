<script lang="ts">
  import {
    HUMAN_ID,
    STREETS,
    bestHand,
    discardCost,
    isJoker,
    mySeat,
    newHighRollers,
    nextHighRollersHand,
    placings,
    playHighRollers,
    tableCanFold,
    tableComposing,
    tableFee,
    type Action,
    type Card,
    type HighRollersState,
    type TableRound,
  } from '../engine';
  import { t } from '../i18n';
  import CardView from './CardView.svelte';
  import DiscardChips from './DiscardChips.svelte';
  import Purse from './Purse.svelte';
  import { dollars, name, shortName } from './format';
  import { handLabel } from './handNames';
  import { heavy } from './heavy';

  /**
   * High Rollers: four captains at one table, until two are left (see
   * docs/high-rollers.md). Your three rivals sit across the top as a rotating
   * trinity: compact, until it's one's turn to be shown, when that one expands.
   * Everyone moves at once, in secret; after each street the rivals' moves are
   * replayed one at a time, in seat order, and you press Next as you take each
   * in. At the showdown your hand comes first, then theirs, the chip leader last.
   */
  let { onmenu }: { onmenu: () => void } = $props();

  let game = $state.raw<HighRollersState>(newHighRollers(Date.now() >>> 0));
  let tapped = $state<string[]>([]);

  const round = $derived(game.round!);
  const me = $derived(mySeat(game));
  const mine = $derived(me >= 0 ? round.seats[me] : null);
  const meIn = $derived(!!mine && !mine.folded);
  const composing = $derived(tableComposing(round));
  /** A seat's captain. */
  const captain = (seat: number) => game.players[game.seated[seat]];
  /** The rivals, in their places across the top. */
  const rivals = $derived(round.seats.map((_, s) => s).filter((s) => s !== me));

  // --- What's being shown -------------------------------------------------
  /**
   * 'choose': your move. 'replay': the rivals' moves, one at a time (`queue`,
   * `at`). 'reveal': the showdown, one hand at a time. 'verdict': who won, and
   * where the snags went. 'over': the placings.
   */
  let view = $state<'choose' | 'replay' | 'reveal' | 'verdict' | 'over'>('choose');
  let queue = $state<{ seat: number; action: Action }[]>([]);
  let at = $state(0);
  /** The table as it stood before the street: a rival's seat is shown from it until its move comes up in the replay. */
  let before = $state.raw<TableRound | null>(null);
  const shownYet = (seat: number) => view !== 'replay' || !before || seat === me || queue.findIndex((q) => q.seat === seat) <= at;
  /** A seat as it should be seen just now. */
  const seen = (seat: number) => (shownYet(seat) ? round : before!);
  /** Board cards on show: a new street's card waits until the replay is done. */
  let boardShown = $state(3);
  /** The showdown's order (you first, the chip leader last), and how far it has got. */
  let revealOrder = $state<number[]>([]);
  let revealed = $state(0);
  /** Purses at the start of the hand (the chip leader is judged on these). */
  let startMoney = $state<number[]>([]);
  $effect.pre(() => {
    if (!startMoney.length) startMoney = game.players.map((p) => p.money);
  });

  /** The rival in focus: the one whose move or hand is being shown. */
  const focus = $derived(
    view === 'replay' ? queue[at]?.seat : view === 'reveal' ? (revealOrder[revealed] !== me ? revealOrder[revealed] : undefined) : undefined,
  );

  // --- Your move ----------------------------------------------------------
  const tappedCards = $derived(mine ? mine.hand.filter((c) => tapped.includes(c.id)) : []);
  const tappedSnags = $derived(mine ? mine.jokers.filter((c) => tapped.includes(c.id)) : []);
  const cost = $derived(
    meIn && !composing ? tableFee(game.config, round.month, round.street + 1) + discardCost(mine!.discarded.length, tappedCards.length) : 0,
  );
  const preview = $derived(
    meIn && composing && tapped.length ? bestHand([...tappedCards, ...tappedSnags], round.community, { min: tapped.length, max: tapped.length }) : null,
  );
  const goLabel = $derived(
    composing
      ? t('draw.play')
      : tappedCards.length
        ? `${t('draw.discard', { n: tappedCards.length })} · ${dollars(cost)}`
        : cost
          ? `${t('draw.call')} · ${dollars(cost)}`
          : t('draw.check'),
  );

  function tap(card: Card) {
    if (view !== 'choose' || !meIn) return;
    if (isJoker(card) && !composing) return;
    tapped = tapped.includes(card.id) ? tapped.filter((id) => id !== card.id) : [...tapped, card.id];
  }

  /** Your move (or none, if you're out of the hand): the street resolves, and the replay begins. */
  function play(action: Action | null) {
    before = round;
    game = playHighRollers(game, action);
    tapped = [];
    const r = game.round!;
    const moves = r.history.at(-1)!.actions;
    const order = Array.from({ length: r.seats.length }, (_, k) => (r.first + k) % r.seats.length);
    queue = order.filter((s) => s !== me && moves[s]).map((s) => ({ seat: s, action: moves[s]! }));
    at = 0;
    boardShown = before.community.length;
    if (queue.length) view = 'replay';
    else afterReplay();
  }

  function go() {
    if (!mine) return;
    play(
      composing
        ? { type: 'compose', cardIds: tappedCards.map((c) => c.id), jokers: tappedSnags.length }
        : { type: 'draw', cardIds: tappedCards.map((c) => c.id) },
    );
  }

  function next() {
    if (view === 'replay') {
      if (at + 1 < queue.length) at++;
      else afterReplay();
    } else if (view === 'reveal') {
      if (revealed + 1 < revealOrder.length) revealed++;
      else view = 'verdict';
    } else if (view === 'verdict') {
      if (game.phase === 'over') view = 'over';
      else nextHand();
    }
  }

  function afterReplay() {
    boardShown = round.community.length;
    const res = round.result;
    if (!res) {
      // On to the next street: your move, or (folded) on we go without you.
      if (meIn) view = 'choose';
      else play(null);
      return;
    }
    if (res.byFolds) {
      view = 'verdict';
      return;
    }
    // The showdown: you first (if you're in), then the rest, the chip leader last.
    const inHand = round.seats.map((_, s) => s).filter((s) => !round.seats[s].folded);
    const others = inHand.filter((s) => s !== me).sort((a, b) => startMoney[game.seated[a]] - startMoney[game.seated[b]]);
    revealOrder = [...(inHand.includes(me) ? [me] : []), ...others];
    revealed = 0;
    view = 'reveal';
  }

  function nextHand() {
    game = nextHighRollersHand(game);
    startMoney = game.players.map((p) => p.money);
    boardShown = 3;
    view = 'choose';
    if (!meIn) play(null);
  }

  function again() {
    game = newHighRollers(Date.now() >>> 0);
    startMoney = game.players.map((p) => p.money);
    tapped = [];
    boardShown = 3;
    view = 'choose';
  }

  // --- Showing it ---------------------------------------------------------
  const shownTo = (seat: number) => view === 'verdict' || view === 'over' || (view === 'reveal' && revealOrder.indexOf(seat) <= revealed && revealOrder.includes(seat));
  /** What a rival did, in a word or two. */
  function moveText(action: Action): string {
    if (action.type === 'fold') return t('hr.move.fold');
    if (action.type === 'compose') return t('hr.move.play');
    const fee = tableFee(game.config, round.month, (round.history.at(-1)?.street ?? 0) + 1);
    if (action.type === 'draw' && action.cardIds.length) return t('hr.move.swap', { n: action.cardIds.length });
    return fee ? t('hr.move.call', { amount: dollars(fee) }) : t('hr.move.check');
  }
  /** Settled purses show only at the verdict; until then, what each had at the start of the hand, less what's in the pot. */
  const settled = $derived(view === 'verdict' || view === 'over');
  const purse = (seat: number) => (settled ? captain(seat).money : startMoney[game.seated[seat]] - seen(seat).bets[seat]);
  const pot = $derived(round.seats.reduce((a, _, seat) => a + seen(seat).bets[seat], 0));
  /** The street the board shows (a new card waits for the replay to end). */
  const streetName = $derived(STREETS[Math.min(boardShown - 3, 2)]);
  const verdictText = $derived.by(() => {
    const res = round.result;
    if (!res) return '';
    const who = (s: number) => (s === me ? t('character.captain.you') : shortName(captain(s).id));
    if (res.byFolds) return t('hr.byFolds', { name: who(res.winners[0]), amount: dollars(res.pot) });
    const wins = res.winners.length > 1 ? t('hr.split', { names: res.winners.map(who).join(' & ') }) : t('hr.wins', { name: who(res.winners[0]), amount: dollars(res.pot) });
    return res.weakest !== null && res.dumped.length ? `${wins} ${t('hr.snagsTo', { name: who(res.weakest) })}` : wins;
  });
  const handName = (seat: number) => {
    const h = round.result?.hands[seat];
    return h ? handLabel(h) : null;
  };
</script>

<div class="hr">
  <!-- The rivals across the top: compact, the one in focus expanded. -->
  <div class="rivals" style="--n: {rivals.length}">
    {#each rivals as seat (captain(seat).id)}
      {@const p = captain(seat)}
      {@const s = seen(seat).seats[seat]}
      {@const played = s.slots.filter((c): c is Card => c !== null)}
      <div class="rival" class:focus={focus === seat} class:folded={s.folded} class:first={round.first === seat}>
        <div class="who">
          <span class="portrait">{name(p.id)[0]}</span>
          <span class="nick">{shortName(p.id)}</span>
          <span class="money">{dollars(purse(seat))}{#if s.jokers.length}<span class="snags"> · 🪵{s.jokers.length}</span>{/if}</span>
        </div>
        {#if focus === seat || shownTo(seat)}
          <div class="detail">
            <div class="cards">
              {#if shownTo(seat) && played.length}
                {#each played as card (card.id)}<CardView {card} />{/each}
                {#each s.hand as card (card.id)}<CardView {card} faded />{/each}
              {:else if !s.folded}
                <!-- Face down: the cards they hold, or (on the River) the cards they've played. -->
                {#each played.length ? played : s.hand, i (i)}<CardView faceDown />{/each}
              {/if}
            </div>
          </div>
          {#if view === 'replay' && focus === seat}<p class="move">{moveText(queue[at].action)}</p>{/if}
          {#if shownTo(seat) && handName(seat)}<p class="move">{handName(seat)?.call}</p>{/if}
        {/if}
        {#if s.discarded.length}<DiscardChips cards={s.discarded} flop={s.flopDiscards} title={name(p.id)} />{/if}
        {#if s.folded}<p class="state">{t('hr.folded')}</p>{/if}
      </div>
    {/each}
  </div>

  <!-- The river: the hand, the street, the board and the pot. -->
  <div class="felt">
    <div class="head">
      <span class="hand-no">{t('hr.hand', { n: round.month })}</span>
      <span class="street">{t(`street.${streetName}`)}</span>
      <span class="pot">{pot ? t('hr.pot', { amount: dollars(pot) }) : ''}</span>
    </div>
    <div class="board">
      {#each Array.from({ length: 5 }) as _, i}
        <CardView card={i < boardShown ? (round.community[i] ?? null) : null} />
      {/each}
    </div>
    <p class="verdict">{view === 'verdict' ? verdictText : ''}</p>
  </div>

  <!-- You: your money, your cards. -->
  <div class="me">
    {#if mine}
      <div class="my-purse">
        <Purse amount={purse(me)} start={captain(me).money} showAmount={false} focus={18} label={t('character.captain.you')} />
        {#if preview}<p class="call">{handLabel(preview).call}</p>{:else if shownTo(me) && handName(me)}<p class="call">{handName(me)?.call}</p>{/if}
      </div>
      <div class="my-hand">
        {#each mine.hand as card (card.id)}
          <CardView {card} selected={tapped.includes(card.id)} faded={mine.folded} onclick={view === 'choose' && meIn ? () => tap(card) : undefined} />
        {/each}
        {#each mine.slots.filter((c): c is Card => c !== null) as card (card.id)}<CardView {card} used />{/each}
        {#each mine.jokers as card (card.id)}
          <CardView {card} selected={tapped.includes(card.id)} onclick={view === 'choose' && meIn && composing ? () => tap(card) : undefined} />
        {/each}
        {#if mine.discarded.length}<DiscardChips cards={mine.discarded} flop={mine.flopDiscards} title={t('character.captain.you')} />{/if}
      </div>
    {:else}
      <p class="call">{t('hr.youAreOut')}</p>
    {/if}
  </div>

  <!-- The two buttons. Call, Swap and Play hand are held (heavy); the rest are light taps. -->
  <div class="actions" use:heavy>
    {#if view === 'choose' && meIn}
      <button class="ghost" onclick={() => play({ type: 'fold' })} disabled={!tableCanFold(round, me)}>{t('draw.fold')}</button>
      <button onclick={go} data-heavy={composing || tappedCards.length > 0 || cost > 0 ? 'true' : undefined}>{goLabel}</button>
    {:else if view === 'over'}
      <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
      <button onclick={again}>{t('hr.again')}</button>
    {:else}
      <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
      <button onclick={next}>{t('show.next')}</button>
    {/if}
  </div>

  {#if view === 'over'}
    <!-- The placings: the two left standing both made it; the bigger purse wins. -->
    <ol class="placings">
      {#each placings(game) as p, i (p.id)}
        <li class:me={p.id === HUMAN_ID}>
          <span>{p.id === HUMAN_ID ? t('character.captain.you') : shortName(p.id)}</span>
          <span>{i === 0 ? t('hr.winner') : i === 1 ? t('hr.runnerUp') : t('table.out')}</span>
          <span>{dollars(Math.max(0, p.money))}</span>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .hr {
    --gap: 0.5rem;
    container-type: inline-size;
    position: relative;
    display: grid;
    grid-template-rows: auto auto auto auto;
    align-content: end;
    row-gap: clamp(0.5rem, 2vh, 1.4rem);
    width: 100%;
    max-width: 480px;
    min-height: 100svh;
    margin: 0 auto;
    padding: 1rem 1rem 0.75rem;
  }
  .hr :global(.card:not(.huge)) {
    --w: calc((100cqw - 11 * var(--gap)) / 6 + var(--gap)) !important;
  }
  /* The trinity: three columns; the one in focus takes half the width. */
  .rivals {
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    gap: var(--gap);
    /* The row sits just above the board; the three line up along their tops. */
    align-content: end;
    align-items: start;
    min-height: 13rem;
    transition: grid-template-columns 0.3s;
  }
  .rivals:has(.focus) {
    grid-template-columns: repeat(var(--n), 0.7fr);
  }
  .rival {
    display: grid;
    gap: 0.3rem;
    justify-items: center;
    text-align: center;
    padding: 0.3rem;
    border: 1px solid transparent;
    min-width: 0;
  }
  .rival.focus {
    grid-column: span 1;
    border-color: var(--paper);
    background: rgba(242, 239, 230, 0.05);
  }
  .rivals:has(.focus) .rival.focus {
    transform: scale(1.04);
  }
  .rival.folded .who {
    opacity: 0.45;
  }
  .who {
    display: grid;
    justify-items: center;
    gap: 0.1rem;
    min-width: 0;
  }
  .portrait {
    display: grid;
    place-items: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    border: 2px solid var(--paper);
    font-family: var(--title-font);
    font-size: 1.5rem;
  }
  .first .portrait {
    box-shadow: 0 0 0 3px #0c0c0b, 0 0 0 4px var(--grey);
  }
  .nick {
    font-family: var(--title-font);
    font-size: 0.85rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .money {
    font-size: 0.8rem;
    color: var(--grey);
  }
  .detail {
    display: grid;
    justify-items: center;
    gap: 0.2rem;
  }
  .detail .cards {
    display: flex;
    gap: 2px;
  }
  .detail :global(.card:not(.huge)) {
    --w: 1.9rem !important;
  }
  .move,
  .state {
    margin: 0;
    font-size: 0.8rem;
  }
  .state {
    color: var(--grey);
  }
  .felt {
    display: grid;
    gap: 0.4rem;
  }
  .head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: baseline;
    gap: 0.5rem;
  }
  .hand-no {
    font-size: 0.8rem;
    color: var(--grey);
  }
  .street {
    font-family: var(--title-font);
    font-size: 1.2rem;
  }
  .pot {
    text-align: right;
    font-size: 0.85rem;
  }
  .board {
    display: flex;
    justify-content: center;
    gap: var(--gap);
  }
  .board :global(.card:not(.huge)) {
    --w: calc((100cqw - 6 * var(--gap)) / 5.6) !important;
  }
  .verdict {
    min-height: 1.3em;
    margin: 0;
    text-align: center;
    font-size: 0.95rem;
  }
  .me {
    display: grid;
    gap: 0.4rem;
  }
  .my-purse {
    position: relative;
    min-height: 56px;
  }
  .call {
    margin: 0;
    text-align: center;
    font-style: italic;
  }
  .my-purse .call {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }
  .my-hand {
    display: flex;
    gap: var(--gap);
    align-items: end;
    min-height: calc((100cqw - 11 * var(--gap)) / 6 * 1.4 + 1rem);
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap);
    position: relative;
    z-index: 51;
  }
  .actions button {
    padding-top: 0.6em;
    padding-bottom: 0.6em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .placings {
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 30%;
    margin: 0;
    padding: 1rem;
    list-style: none;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    outline: 1px solid var(--paper);
    outline-offset: 4px;
    z-index: 20;
  }
  .placings li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.75rem;
    padding: 0.3rem 0;
  }
  .placings li.me {
    font-weight: bold;
  }
</style>
