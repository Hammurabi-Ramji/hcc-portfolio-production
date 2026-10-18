<script>
  // BSM-CODE: origami.fold.relation(): select backed by the related entity's rows.
  import { onMount } from 'svelte';

  let { field, uid, value = $bindable(null), bridge = null, disabled = false } = $props();

  let rows = $state([]);
  let query = $state('');
  let failure = $state('');

  const label = row => String(row[field.displayField] ?? row.id);
  const visible = $derived(
    rows.filter(r => query === '' || label(r).toLowerCase().includes(query.toLowerCase()) || String(r.id) === String(value))
  );

  onMount(() => {
    let live = true;
    if (!bridge) { failure = 'No data bridge available'; return; }
    bridge.list(field.to)
      .then(list => { if (live) rows = list; })
      .catch(e => { if (live) failure = String(e); });
    return () => { live = false; };
  });
</script>

<div class="relation">
  {#if rows.length > 8}
    <input type="search" placeholder="Search {field.to}" aria-label="Search {field.label}" bind:value={query} {disabled}>
  {/if}
  <select id={uid} {disabled} value={value ?? ''} onchange={e => (value = e.currentTarget.value === '' ? null : e.currentTarget.value)}>
    <option value="">(none)</option>
    {#each visible as row (row.id)}<option value={String(row.id)}>{label(row)}</option>{/each}
  </select>
  {#if failure}<small role="alert">{failure}</small>{/if}
</div>

<style>
  .relation { display: grid; gap: 4px; }
</style>
