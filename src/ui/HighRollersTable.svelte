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
  import Pile from './Pile.svelte';
  import Purse from './Purse.svelte';
  import { dollars, tagName } from './format';
  import { handLabel } from './handNames';
  import { heavy } from './heavy';
  import { flyCoin, flyInto, reducedMotion, restingSpot, stackTops } from './coins';
  import { onDestroy, untrack } from 'svelte';

  /**
   * High Rollers: four captains at one table, until two are left (see
   * docs/high-rollers.md). Your side and the river are the duel's; your three
   * rivals share the top, a third each: a name, a purse, three cards, snags
   * and discards. Everyone moves at once, in secret; after the Flop and the
   * Turn the rivals' moves are replayed one at a time, in seat order (left,
   * across, right, and round to you), and you press Next as you take each in.
   * At the showdown your hand comes first, then theirs, the chip leader last.
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
  /** The rivals in their places across the top: seat order, left to right (you sit at seat 0, at the bottom). */
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
  const focus = $derived(view === 'replay' ? queue[at]?.seat : view === 'reveal' && revealOrder[revealed] !== me ? revealOrder[revealed] : undefined);

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
    if (isJoker(card) && !composing) return; // Snags can't be thrown away
    if (tapped.includes(card.id)) tapped = tapped.filter((id) => id !== card.id);
    else if (!composing || tapped.length < 5) tapped = [...tapped, card.id]; // A hand is five cards at most
  }

  /**
   * Your move (or none, if you're out of the hand): the street resolves, and
   * the rivals' moves are replayed in seat order from the first. Not on the
   * River: everyone just plays a hand, so it's straight to the showdown.
   */
  function play(action: Action | null) {
    before = round;
    const river = composing;
    game = playHighRollers(game, action);
    tapped = [];
    const r = game.round!;
    const moves = r.history.at(-1)!.actions;
    const order = Array.from({ length: r.seats.length }, (_, k) => (r.first + k) % r.seats.length);
    queue = river ? [] : order.filter((s) => s !== me && moves[s]).map((s) => ({ seat: s, action: moves[s]! }));
    at = 0;
    boardShown = before.community.length;
    if (queue.length) view = 'replay';
    else afterReplay();
  }

  function go() {
    if (!mine) return;
    play(composing ? { type: 'compose', cardIds: tappedCards.map((c) => c.id), jokers: tappedSnags.length } : { type: 'draw', cardIds: tappedCards.map((c) => c.id) });
  }

  function next() {
    if (view === 'replay') {
      if (at + 1 < queue.length) at++;
      else afterReplay();
    } else if (view === 'reveal') {
      if (revealed + 1 < revealOrder.length) revealed++;
      else view = 'verdict';
    } else if (view === 'verdict') {
      if (game.phase === 'over') {
        // The placings go over the table: no loose coins on top of them.
        clearResting();
        view = 'over';
      }
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
    // A new table starts at the same hand number: its coins start afresh.
    flownHand = paidHand = -1;
    game = newHighRollers(Date.now() >>> 0);
    startMoney = game.players.map((p) => p.money);
    tapped = [];
    boardShown = 3;
    view = 'choose';
  }

  // --- Showing it ---------------------------------------------------------
  const shownTo = (seat: number) => view === 'verdict' || view === 'over' || (view === 'reveal' && revealOrder.includes(seat) && revealOrder.indexOf(seat) <= revealed);
  /** What a rival did, in a word or two. */
  function moveText(action: Action): string {
    if (action.type === 'fold') return t('hr.move.fold');
    if (action.type === 'draw' && action.cardIds.length) return t('hr.move.swap', { n: action.cardIds.length });
    const fee = tableFee(game.config, round.month, (round.history.at(-1)?.street ?? 0) + 1);
    return fee ? t('hr.move.call', { amount: dollars(fee) }) : t('hr.move.check');
  }
  /** Settled purses show only at the verdict; until then, what each had at the start of the hand, less what's in the pot. */
  const settled = $derived(view === 'verdict' || view === 'over');
  const purse = (seat: number) => (settled ? captain(seat).money : startMoney[game.seated[seat]] - seen(seat).bets[seat]);
  /** What each seat has in the pot, as far as the table has seen. */
  const shownBets = $derived(round.seats.map((_, s) => seen(s).bets[s]));
  const potCount = $derived(shownBets.reduce((a, b) => a + b, 0));

  // --- Coins in flight -------------------------------------------------------
  // Each purse pours into the one pile: a seat's coins leave from where they
  // stood in its purse and land on the pile's next spots. At the verdict the
  // pile flies to the winner: their own coins back to the spots they left, the
  // rest to rest on top of their stacks until the next hand.
  let rootEl = $state<HTMLElement>();
  let pileEl = $state<HTMLElement>();
  /** Whose each coin in the pile is, in the order they landed. */
  let owners: number[] = [];
  let flown: number[] = [];
  let flownHand = -1;
  /** Counts hands (across tables), so a late coin knows its hand is gone. */
  let handSerial = 0;
  let paidHand = -1;
  let resting: HTMLElement[] = [];
  const MAX_FLYERS = 40;
  const purseEl = (seat: number) => rootEl?.querySelector<HTMLElement>(`[data-purse="${seat}"]`) ?? null;
  /** Purses show at most $400: a richer one's first coins aren't drawn. */
  const offset = (seat: number) => Math.max(0, (startMoney[game.seated[seat]] ?? 0) - 400);
  function clearResting() {
    for (const c of resting) c.remove();
    resting = [];
  }
  onDestroy(clearResting);

  /** A seat paid dollars a..b into the pot. */
  function payIn(seat: number, a: number, b: number) {
    const purse = purseEl(seat);
    for (let k = a; k < b; k++) {
      const spot = pileEl?.querySelector<HTMLElement>(`[data-k="${owners.length}"]`);
      owners.push(seat);
      const src = purse?.querySelector(`[data-d="${k - offset(seat)}"]`);
      if (spot && src && k < a + MAX_FLYERS && !reducedMotion()) flyInto(src, spot, (k - a) * 45);
    }
  }

  function payOut(winners: number[]) {
    if (!pileEl || reducedMotion()) return;
    const hand = handSerial;
    const tops: Record<number, DOMRect[]> = {};
    const piled: Record<number, number> = {};
    const seenOf = new Map<number, number>();
    let shared = 0;
    const coins = [...pileEl.querySelectorAll<HTMLElement>('[data-k]')];
    coins.forEach((c, i) => {
      const owner = owners[Number(c.dataset.k)];
      // Which of the owner's own coins this is: the n-th it paid in.
      const own = seenOf.get(owner) ?? 0;
      seenOf.set(owner, own + 1);
      if (i < coins.length - MAX_FLYERS * 2) return;
      const to = winners.includes(owner) ? owner : winners[shared++ % winners.length];
      const purse = purseEl(to);
      if (!purse) return;
      const delay = (i - Math.max(0, coins.length - MAX_FLYERS * 2)) * 14;
      const home = to === owner ? purse.querySelector<HTMLElement>(`[data-d="${own - offset(owner)}"]`) : null;
      if (home) {
        flyInto(c, home, delay);
        return;
      }
      tops[to] ??= stackTops(purse);
      const spot = restingSpot(tops[to], (piled[to] = (piled[to] ?? 0) + 1) - 1);
      // One that lands after the table has moved on to the next hand just goes.
      if (spot) flyCoin(c.getBoundingClientRect(), spot, delay, { restIn: purse }).then((coin) => coin && (handSerial === hand ? resting.push(coin) : coin.remove()));
    });
  }

  $effect(() => {
    const bets = shownBets;
    const hand = game.hand;
    const winners = settled ? round.result?.winners : undefined;
    untrack(() => {
      if (hand !== flownHand) {
        clearResting();
        flownHand = hand;
        handSerial++;
        flown = bets.map(() => 0);
        owners = [];
      }
      // In seat order from the first, so the pile fills the way the table played.
      for (let j = 0; j < bets.length; j++) {
        const s = (round.first + j) % bets.length;
        if (bets[s] > flown[s]) payIn(s, flown[s], bets[s]);
      }
      flown = [...bets];
      if (winners && paidHand !== hand) {
        paidHand = hand;
        payOut(winners);
      }
    });
  });
  /** The street the board shows (a new card waits for the replay to end). */
  const streetName = $derived(STREETS[Math.min(boardShown - 3, 2)]);
  const who = (s: number) => (s === me ? t('character.captain.you') : tagName(captain(s).id));
  const verdictText = $derived.by(() => {
    const res = round.result;
    if (!res) return '';
    // You get your own line ("You take the pot!"), not your name in theirs.
    const line = (key: string, s: number) => (s === me ? t(`${key}.you`) : t(key, { name: who(s) }));
    if (res.byFolds) return line('hr.byFolds', res.winners[0]);
    const wins = res.winners.length > 1 ? t('hr.split', { names: res.winners.map(who).join(' & ') }) : line('hr.wins', res.winners[0]);
    return res.weakest !== null && res.dumped.length ? `${wins} ${line('hr.snagsTo', res.weakest)}` : wins;
  });
  const handName = (seat: number) => {
    const h = round.result?.hands[seat];
    return h ? handLabel(h) : null;
  };
  /** A rival's line under their cards: the move being shown, their hand at the showdown, or that they're out of it. */
  function rivalLine(seat: number): string {
    if (view === 'replay' && focus === seat) return moveText(queue[at].action);
    if (shownTo(seat) && handName(seat)) return handName(seat)!.call;
    return seen(seat).seats[seat].folded ? t('hr.folded') : '';
  }
  const played = (cards: (Card | null)[]) => cards.filter((c): c is Card => c !== null);
  const myPlayed = $derived(mine ? played(mine.slots).filter((c) => !isJoker(c)) : []);
  const myPlayedSnags = $derived(new Set(mine ? played(mine.slots).filter(isJoker).map((c) => c.id) : []));
  /**
   * A seat's snags. At the showdown, as they stood before the River was
   * played (those played lift out of the fan); at the verdict, those it owns
   * now (a winner's played snags have gone to the weakest hand).
   */
  const snagsOf = (seat: number) => (view === 'reveal' && before ? before : seen(seat)).seats[seat].jokers;
  const mySnags = $derived(mine ? snagsOf(me) : []);
  const myCall = $derived(preview ? handLabel(preview) : mine && shownTo(me) ? handName(me) : null);
</script>

<div class="hr" bind:this={rootEl}>
  <!-- The rivals across the top, a third of the width each, in seat order. -->
  <div class="rivals">
    {#each rivals as seat (captain(seat).id)}
      {@const p = captain(seat)}
      {@const s = seen(seat).seats[seat]}
      {@const cards = played(s.slots).filter((c) => !isJoker(c))}
      {@const snags = snagsOf(seat)}
      <div class="rival" class:focus={focus === seat} class:folded={s.folded}>
        <div class="who">
          {#if round.first === seat}<span class="button" title={t('hr.first')}></span>{/if}
          <span class="tag">{tagName(p.id)}</span>
          {#if snags.length}
            <div class="snag-fan tiny" style="--n: {snags.length}">
              {#each snags as card (card.id)}<CardView {card} lifted={shownTo(seat) && s.slots.some((c) => c?.id === card.id)} />{/each}
              {#if snags.length > 1}<span class="snag-count">×{snags.length}</span>{/if}
            </div>
          {/if}
        </div>
        <div class="rival-purse" data-purse={seat}><Purse amount={purse(seat)} start={startMoney[game.seated[seat]] ?? p.money} size="tiny" showAmount={false} focus={30} label={tagName(p.id)} /></div>
        <div class="rival-cards">
          <div class="rival-hand">
            {#if s.folded}
              {#each s.hand as _, i (i)}<CardView faceDown faded />{/each}
            {:else if shownTo(seat) && cards.length}
              {#each cards as card (card.id)}<CardView {card} />{/each}
              {#each s.hand as card (card.id)}<CardView {card} faded />{/each}
            {:else}
              {#each Array.from({ length: cards.length + s.hand.length }) as _, i (i)}<CardView faceDown />{/each}
            {/if}
          </div>
          <DiscardChips cards={s.discarded} flop={s.flopDiscards} title={tagName(p.id)} />
        </div>
        <p class="line">{rivalLine(seat)}</p>
      </div>
    {/each}
  </div>

  <!-- The river: the street, the pot and the board. -->
  <div class="felt">
    <p class="street">{t(`street.${streetName}`)}</p>
    <div class="pot-band">
      <div bind:this={pileEl}><Pile count={potCount} paid={settled} /></div>
      {#if settled}<p class="outcome" class:won={round.result?.winners.includes(me)} aria-live="polite">{verdictText}</p>{/if}
    </div>
    <div class="community">
      {#each Array.from({ length: 5 }) as _, i}
        <CardView card={i < boardShown ? (round.community[i] ?? null) : null} />
      {/each}
    </div>
  </div>

  <!-- Your side, as in a duel: your money nearest the pot, then your cards, your snags and your discards. -->
  <div class="mine">
    <div class="my-purse" data-purse={me}>
      {#if mine}
        <Purse amount={purse(me)} start={startMoney[game.seated[me]] ?? captain(me).money} showAmount={false} focus={18} label={t('character.captain.you')} />
        {#if round.first === me}<span class="button own" title={t('hr.first')}></span>{/if}
        {#if myCall}<p class="my-hand">{myCall.lingo ?? myCall.call}</p>{/if}
      {:else}
        <p class="my-hand">{t('hr.youAreOut')}</p>
      {/if}
    </div>
    <div class="hand-row">
      {#if mine}
        <div class="hand-cell">
          {#each myPlayed as card (card.id)}<CardView {card} used />{/each}
          {#each mine.hand as card (card.id)}
            <CardView
              {card}
              selected={composing && tapped.includes(card.id)}
              toss={!composing && tapped.includes(card.id)}
              faded={mine.folded || (shownTo(me) && myPlayed.length > 0)}
              onclick={view === 'choose' && meIn ? () => tap(card) : undefined}
            />
          {/each}
        </div>
        <div class="fan-cell">
          {#if mySnags.length}
            <!-- However many snags you carry, the fan never grows past its width. -->
            <div class="snag-fan" style="--n: {mySnags.length}">
              {#each mySnags as card (card.id)}
                <CardView
                  {card}
                  selected={tapped.includes(card.id)}
                  used={myPlayedSnags.has(card.id)}
                  lifted={shownTo(me) && myPlayedSnags.has(card.id)}
                  onclick={view === 'choose' && meIn && composing ? () => tap(card) : undefined}
                />
              {/each}
              {#if mySnags.length > 2}<span class="snag-count">×{mySnags.length}</span>{/if}
            </div>
          {/if}
        </div>
        <div class="discard-cell"><DiscardChips tall cards={mine.discarded} flop={mine.flopDiscards} title={t('draw.yourDiscards')} /></div>
      {/if}
    </div>
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
          <span>{p.id === HUMAN_ID ? t('character.captain.you') : tagName(p.id)}</span>
          <span>{i === 0 ? t('hr.winner') : i === 1 ? t('hr.runnerUp') : t('table.out')}</span>
          <span>{dollars(Math.max(0, p.money))}</span>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  /*
   * The duel's screen grid: 12 columns (a card is two and a gap wide), the
   * table kept to the bottom so the buttons sit where they always do.
   */
  .hr {
    --gap: 0.5rem;
    container-type: inline-size;
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gap);
    row-gap: clamp(0.5rem, 2vh, 1.4rem);
    align-content: end;
    width: 100%;
    max-width: 480px;
    min-height: 100svh;
    margin: 0 auto;
    padding: 1rem 1rem 0.75rem;
  }
  .hr > :not(.placings) {
    --col: calc((100cqw - 11 * var(--gap)) / 12);
    --card-w: calc(2 * var(--col) + var(--gap));
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
  }
  .felt > *,
  .mine > * {
    grid-column: 1 / -1;
  }
  .hr :global(.card:not(.huge)) {
    --w: var(--card-w) !important;
  }

  /* The rivals: four columns each, every one the same fixed height, so nothing moves. */
  .rival {
    grid-column: span 4;
    container-type: inline-size;
    display: grid;
    grid-template-rows: 26px auto auto 1.9rem;
    row-gap: 3px;
    padding: 3px 4px 0;
    margin: -4px -4px 0;
    border: 1px solid transparent;
    border-radius: 4px;
    min-width: 0;
    transition:
      border-color 0.2s,
      background 0.2s;
  }
  .rival.focus {
    border-color: var(--paper);
    background: rgba(242, 239, 230, 0.06);
  }
  .rival.folded .who,
  .rival.folded :global(.purse) {
    opacity: 0.5;
  }
  .who {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    min-width: 0;
  }
  .tag {
    font-family: var(--title-font);
    font-size: 0.85rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The dealer's button: who acts (and draws) first this hand. */
  .button {
    flex: none;
    align-self: center;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--paper);
    box-shadow:
      0 0 0 2px #0c0c0b,
      0 0 0 3px var(--grey);
  }
  .button.own {
    position: absolute;
    top: 4px;
    right: 4px;
  }
  /* Three small cards, and their discards in a column beside them. */
  .rival-cards {
    --small-w: calc((100cqw - 32px) / 3);
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }
  .rival-hand {
    display: flex;
    gap: 2px;
    flex: none;
    width: calc(100cqw - 28px);
  }
  .rival .rival-hand :global(.card:not(.huge)) {
    --w: var(--small-w) !important;
  }
  .rival .snag-fan :global(.card:not(.huge)) {
    --w: 18px !important;
  }
  .rival-cards :global(.discards) {
    --h: calc(var(--small-w) * 1.4);
    width: 20px;
  }
  .rival-cards :global(.discards .chip) {
    font-size: 0.55rem;
    border-radius: 2px;
  }
  .rival-cards :global(.discards .suit) {
    display: none;
  }
  /* Winnings come to rest on it, placed from here. */
  .rival-purse {
    position: relative;
  }
  .line {
    margin: 0;
    font-size: 0.7rem;
    line-height: 1.25;
    text-align: center;
    overflow: hidden;
  }
  .rival.folded .line {
    color: var(--grey);
  }

  /* The river: the street, the pot, the board. */
  .felt {
    text-align: center;
    background: repeating-linear-gradient(0deg, transparent 0 18px, rgba(255, 255, 255, 0.03) 18px 20px);
  }
  .street {
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.3rem;
  }
  .pot-band {
    position: relative;
    margin: 0.2rem 0 0.5rem;
  }
  .outcome {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    font-family: var(--title-font);
    font-size: 1.1rem;
    line-height: 1.2;
    color: var(--grey);
    text-wrap: balance;
    /* Once the coins are on their way. */
    animation: outcome 0.4s ease-out 0.6s backwards;
  }
  .outcome.won {
    color: var(--paper);
  }
  @keyframes outcome {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
  }
  .community {
    display: flex;
    justify-content: center;
    gap: var(--gap);
  }

  /* Your side: the duel's rows (cards in columns 1–6, the snag fan 7–10, the discards 11–12). */
  .mine {
    row-gap: 0.4rem;
  }
  .my-purse {
    position: relative;
    min-height: 72px;
  }
  :global(.short) .my-purse {
    min-height: 56px;
  }
  .my-hand {
    position: absolute;
    top: 0.8rem;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    font-style: italic;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow:
      0 0 3px #000,
      0 0 6px #000;
    pointer-events: none;
  }
  .hand-row {
    display: grid;
    grid-template-columns: subgrid;
    align-items: end;
    height: calc(var(--card-w) * 1.4 + 14px);
  }
  .hand-cell {
    grid-column: 1 / 7;
    display: flex;
    gap: var(--gap);
    align-items: flex-end;
  }
  .fan-cell {
    grid-column: 7 / 11;
    display: flex;
    align-items: flex-end;
  }
  .discard-cell {
    grid-column: 11 / 13;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
  /* However many snags, the fan keeps to its four columns. */
  .snag-fan {
    --fan: calc(4 * var(--col) + 3 * var(--gap));
    position: relative;
    display: flex;
    max-width: var(--fan);
  }
  .snag-fan :global(.card + .card) {
    margin-left: min(3px, calc((var(--fan) - var(--card-w) * var(--n)) / (var(--n) - 1)));
  }
  /* A rival's fan: little snags, overlapping, beside the purse. */
  .snag-fan.tiny {
    --fan: 32px;
    flex: none;
    margin-left: auto;
  }
  .snag-fan.tiny :global(.card + .card) {
    margin-left: min(2px, calc((var(--fan) - 18px * var(--n)) / (var(--n) - 1)));
  }
  .snag-count {
    position: absolute;
    top: -6px;
    right: -6px;
    z-index: 4;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--ink);
    border: 1px solid var(--grey);
    font-family: var(--title-font);
    font-size: 0.75rem;
    line-height: 1.3;
  }
  .tiny .snag-count {
    font-size: 0.6rem;
    padding: 0 3px;
  }

  .actions {
    position: relative;
    z-index: 51;
  }
  .actions > button:first-child {
    grid-column: 1 / 7;
  }
  .actions > button:last-child {
    grid-column: 7 / 13;
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
    z-index: 60;
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
