<script>
  let { notify } = $props();
  let flows = $state([]);
  let selected = $state(null);
  let busy = $state(false);
  let connected = $state(false);
  let error = $state('');
  const localOrigin = window.location.origin === 'http://127.0.0.1:8081';
  async function load() {
    busy = true; error = ''; selected = null; flows = []; connected = false;
    try {
      if (!localOrigin) throw new Error('Desktop access requires serving this PWA at http://127.0.0.1:8081.');
      const response = await fetch('http://127.0.0.1:8741/flows', { method:'GET', mode:'cors', credentials:'omit', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Desktop API returned ${response.status}.`);
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.every(row => typeof row?.id === 'string' && typeof row.name === 'string' && typeof row.updatedAt === 'string' && Array.isArray(row.definition?.nodes) && Array.isArray(row.definition?.edges))) throw new Error('Desktop API returned an invalid flow list.');
      flows = rows; connected = true;
    } catch (e) { error = String(e); notify(error, true); }
    finally { busy = false; }
  }
</script>
<section class="panel">
  <h2>Desktop flows</h2>
  <p class="muted">View saved workflows from STRAW Desk running on this computer. Access starts only when you press the button. Editing, execution, chat, and file generation run in the desktop application.</p>
  <div><button disabled={busy || !localOrigin} onclick={load}>{busy ? 'Loading…' : connected ? 'Refresh desktop flows' : 'Load desktop flows'}</button></div>
  {#if !localOrigin}<p class="muted">For desktop access, serve this PWA at http://127.0.0.1:8081.</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
  {#if connected && !flows.length}<p>No saved flows were returned by the desktop engine.</p>{/if}
  {#each flows as flow (flow.id)}<button class="flow" onclick={() => selected = flow}>{flow.name} · {flow.definition.nodes.length} nodes</button>{/each}
  {#if selected}
    <h3>{selected.name}</h3>
    <p class="muted">Read-only snapshot · {selected.updatedAt}</p>
    <pre>{JSON.stringify(selected.definition, null, 2)}</pre>
  {/if}
</section>
<style>
  .flow { text-align:left; } pre { padding:16px; overflow:auto; background:#10151b; max-height:400px; font-size:12px; }
</style>
