<script lang="ts">
  import Portrait from '../ui/portrait/Portrait.svelte';
  import { EFFECTS, FACES, MOODS, type Effect, type FaceId, type MoodBlend } from '../ui/portrait/faces';

  /**
   * The portraits (development only): every face we have, side by side, in
   * each mood and at the sizes the table uses. Add a face to faces.ts and it
   * appears here.
   */
  const everyone = Object.keys(FACES) as FaceId[];

  let nerves = $state(0);
  let size = $state(110);
  const blended: MoodBlend = $derived({ neutral: 1 - nerves, nervous: nerves });
  const rigs = $state<Record<string, Portrait>>({});
  const act = (effect: Effect) => everyone.forEach((id) => rigs[id]?.play(effect));
</script>

<main style="--size: {size}px">
  <header>
    <h1>Portraits</h1>
    <label>Size <input type="range" min="60" max="200" step="10" bind:value={size} /></label>
    <label>Nerves <input type="range" min="0" max="1" step="0.05" bind:value={nerves} /></label>
    {#each EFFECTS as effect}<button class="ghost" onclick={() => act(effect)}>{effect}</button>{/each}
  </header>

  <section class="live">
    {#each everyone as id (id)}
      <figure>
        <span class="frame"><Portrait {id} mood={blended} bind:this={rigs[id]} /></span>
        <figcaption>{id}</figcaption>
      </figure>
    {/each}
  </section>

  <section>
    <h2>Moods</h2>
    {#each everyone as id (id)}
      <div class="row">
        <h3>{id}{FACES[id].poker ? ' (keeps a straight face)' : ''}</h3>
        {#each MOODS as mood (mood)}
          <figure>
            <span class="frame"><Portrait {id} {mood} /></span>
            <figcaption>{mood}</figcaption>
          </figure>
        {/each}
      </div>
    {/each}
  </section>

  <section>
    <h2>At table sizes</h2>
    <div class="row">
      {#each everyone as id (id)}
        <span class="sizes">
          <span class="frame seat"><Portrait {id} /></span>
          <span class="frame mini"><Portrait {id} /></span>
          <span class="frame caption"><Portrait {id} /></span>
        </span>
      {/each}
    </div>
  </section>
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  h1,
  h2,
  h3 {
    margin: 0;
  }
  h2 {
    margin: 1.5rem 0 0.75rem;
  }
  h3 {
    width: 100%;
    font-size: 0.95rem;
  }
  .live,
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  figure {
    margin: 0;
    text-align: center;
  }
  figcaption {
    margin-top: 0.25rem;
    font-size: 0.8rem;
  }
  .frame {
    position: relative;
    display: block;
    width: var(--size);
    height: var(--size);
    border: 3px double var(--paper);
    border-radius: 50%;
    background: radial-gradient(circle, #444, #111);
  }
  .sizes {
    display: flex;
    gap: 0.4rem;
    align-items: flex-end;
  }
  .seat {
    width: 96px;
    height: 96px;
  }
  .mini {
    width: 38px;
    height: 38px;
    border-width: 2px;
  }
  .caption {
    width: 44px;
    height: 44px;
    border-width: 2px;
  }
</style>
