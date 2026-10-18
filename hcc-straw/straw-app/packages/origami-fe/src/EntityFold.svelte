<script>
  // BSM-CODE: origami.fold.detail(): load one record (or a blank one), validate, save.
  import FoldRenderer from './FoldRenderer.svelte';
  import { defaultRecord, validateRecord } from './schema.js';

  let { bridge, schema, entityId, onnavigate = () => {} } = $props();

  const creating = $derived(entityId === 'new');
  let record = $state({});
  let errors = $state({});
  let status = $state('loading');
  let message = $state('');
  let busy = $state(false);

  $effect(() => {
    const { entity, fields } = schema;
    const id = entityId;
    let live = true;
    errors = {};
    message = '';
    if (id === 'new') {
      record = defaultRecord(fields);
      status = 'ready';
      return;
    }
    status = 'loading';
    bridge.read(entity, id)
      .then(row => { if (live) { record = row; status = 'ready'; } })
      .catch(e => { if (live) { message = String(e); status = 'error'; } });
    return () => { live = false; };
  });

  async function save() {
    errors = validateRecord(schema.fields, record);
    if (Object.keys(errors).length) { message = 'Fix the highlighted fields.'; return; }
    busy = true;
    try {
      await bridge.save(schema.entity, creating ? null : entityId, $state.snapshot(record));
      onnavigate(schema.entity);
    } catch (e) {
      message = String(e);
    } finally {
      busy = false;
    }
  }

  async function remove() {
    busy = true;
    try {
      await bridge.remove(schema.entity, entityId);
      onnavigate(schema.entity);
    } catch (e) {
      message = String(e);
    } finally {
      busy = false;
    }
  }
</script>

<section class="fold-detail">
  <h2>{creating ? `New ${schema.label}` : schema.label}</h2>
  {#if status === 'loading'}<p aria-busy="true">Loading...</p>
  {:else if status === 'error'}<p role="alert">{message}</p>
  {:else}
    <form onsubmit={e => { e.preventDefault(); save(); }}>
      <FoldRenderer {schema} bind:record {errors} {bridge} disabled={busy} />
      {#if message}<p role="alert">{message}</p>{/if}
      <div class="row">
        <button type="submit" disabled={busy}>Save</button>
        <button type="button" disabled={busy} onclick={() => onnavigate(schema.entity)}>Cancel</button>
        {#if !creating}<button type="button" disabled={busy} onclick={remove}>Delete</button>{/if}
      </div>
    </form>
  {/if}
</section>

<style>
  .row { display: flex; gap: 8px; }
</style>
