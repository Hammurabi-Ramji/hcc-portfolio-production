<script>
  // BSM-CODE: origami.nav.assemble() / origami.route.zero(): navigation derived from the entity list.
  let { bridge, current = '', onnavigate = () => {} } = $props();

  let entities = $state([]);
  let failure = $state('');

  $effect(() => {
    let live = true;
    bridge.entities()
      .then(list => { if (live) entities = list; })
      .catch(e => { if (live) failure = String(e); });
    return () => { live = false; };
  });
</script>

<nav aria-label="Entities">
  {#each entities as entity (entity.name)}
    <button type="button" aria-current={entity.name === current ? 'page' : undefined} onclick={() => onnavigate(entity.name)}>{entity.label}</button>
  {/each}
  {#if failure}<small role="alert">{failure}</small>{/if}
</nav>

<style>
  nav { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  button[aria-current='page'] { font-weight: 700; text-decoration: underline; }
</style>
