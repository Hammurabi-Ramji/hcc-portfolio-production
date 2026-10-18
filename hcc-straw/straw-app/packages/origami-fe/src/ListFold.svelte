<script>
  // BSM-CODE: origami.fold.list(): entity collection -> table.
  import { listColumns } from './schema.js';

  let { bridge, schema, onnavigate = () => {} } = $props();

  let rows = $state([]);
  let status = $state('loading');
  let failure = $state('');
  const columns = $derived(listColumns(schema));

  $effect(() => {
    const entity = schema.entity;
    let live = true;
    status = 'loading';
    bridge.list(entity)
      .then(list => { if (live) { rows = list; status = 'ready'; } })
      .catch(e => { if (live) { failure = String(e); status = 'error'; } });
    return () => { live = false; };
  });

  function show(field, row) {
    const v = row[field.name];
    if (v === null || v === undefined || v === '') return '';
    if (field.type === 'boolean') return v ? 'Yes' : 'No';
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
</script>

<section class="fold-list">
  <header>
    <h2>{schema.label}</h2>
    <button type="button" onclick={() => onnavigate(`${schema.entity}/new`)}>New {schema.label}</button>
  </header>
  {#if status === 'loading'}<p class="muted" aria-busy="true">Loading...</p>
  {:else if status === 'error'}<p role="alert">{failure}</p>
  {:else if rows.length === 0}<p class="muted">No {schema.label} records yet.</p>
  {:else}
    <table>
      <thead><tr>{#each columns as column (column.name)}<th scope="col">{column.label}</th>{/each}</tr></thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr>
            {#each columns as column, i (column.name)}
              <td>{#if i === 0}<button type="button" class="link" onclick={() => onnavigate(`${schema.entity}/${row.id}`)}>{show(column, row) || row.id}</button>{:else}{show(column, row)}{/if}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  header { display: flex; justify-content: space-between; align-items: center; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid rgba(128, 128, 128, 0.3); }
  .link { background: none; border: none; padding: 0; color: inherit; text-decoration: underline; cursor: pointer; font: inherit; }
  .muted { opacity: 0.7; }
</style>
