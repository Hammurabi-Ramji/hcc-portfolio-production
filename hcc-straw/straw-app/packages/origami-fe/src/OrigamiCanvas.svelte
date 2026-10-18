<script>
  // BSM-CODE: origami.canvas.blank(): the single universal surface. It owns no routes;
  // the host passes a path ("tasks", "tasks/12", "tasks/new") and the canvas asks the
  // bridge what shape lives there (origami.ask.shape()), then folds it.
  import NavFold from './NavFold.svelte';
  import ListFold from './ListFold.svelte';
  import EntityFold from './EntityFold.svelte';

  let { bridge, path = '', onnavigate = () => {} } = $props();

  const segments = $derived(path.replace(/^[#/]+/, '').split('/').filter(Boolean));
  const entityName = $derived(segments[0] ?? '');
  const entityId = $derived(segments[1] ?? null);

  let view = $state({ status: 'idle', schema: null, error: '' });

  $effect(() => {
    const name = entityName;
    if (!name) { view = { status: 'idle', schema: null, error: '' }; return; }
    let live = true;
    view = { status: 'loading', schema: null, error: '' };
    bridge.schema(name)
      .then(schema => { if (live) view = { status: 'ready', schema, error: '' }; })
      .catch(e => { if (live) view = { status: 'error', schema: null, error: String(e) }; });
    return () => { live = false; };
  });
</script>

<div class="origami-canvas">
  <NavFold {bridge} current={entityName} {onnavigate} />
  {#if view.status === 'idle'}
    <p class="muted">Choose an entity to begin.</p>
  {:else if view.status === 'loading'}
    <p class="muted" aria-busy="true">Folding...</p>
  {:else if view.status === 'error'}
    <p role="alert">{view.error}</p>
  {:else if entityId}
    <EntityFold {bridge} schema={view.schema} {entityId} {onnavigate} />
  {:else}
    <ListFold {bridge} schema={view.schema} {onnavigate} />
  {/if}
</div>

<style>
  .muted { opacity: 0.7; }
</style>
