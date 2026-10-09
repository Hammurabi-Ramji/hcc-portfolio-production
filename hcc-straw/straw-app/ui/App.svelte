<script>
  import { onMount } from 'svelte';
  import initCompute, { fibonacci } from 'wasm-frontend';
  import FlowCanvas from './FlowCanvas.svelte';
  import NlpChatPanel from './NlpChatPanel.svelte';
  import CodeGenPanel from './CodeGenPanel.svelte';
  import Toast from './Toast.svelte';
  import PwaStatus from './PwaStatus.svelte';
  import BrowserFlows from './BrowserFlows.svelte';
  import { readRoute, navigate, watchRoute } from './routes.js';

  const desktop = Boolean(window.__TAURI__?.core?.invoke);
  const siteSurface = document.documentElement.dataset.surface === 'site';
  let mode = $state(readRoute());
  let flows = $state([]);
  let active = $state(null);
  let ready = $state(false);
  let startupError = $state('');
  let toast = $state(null);
  let computeReady = $state(false);
  let computeInput = $state(10);
  let computeResult = $state('');
  let timer;
  function notify(message, error = false) {
    clearTimeout(timer); toast = { message, error };
    timer = setTimeout(() => { toast = null; }, 7000);
  }
  async function invoke(command, args = {}) {
    if (!window.__TAURI__?.core?.invoke) throw new Error('Open STRAW Desk to use the local engine.');
    return window.__TAURI__.core.invoke(command, args);
  }
  onMount(() => {
    let live = true;
    const stopRouting = watchRoute(route => mode = route);
    initCompute().then(() => { if (live) computeReady = true; }).catch(e => notify(`Compute initialization failed: ${e}`, true));
    if (desktop) (async () => {
      try {
        await invoke('initialize_db');
        const saved = await invoke('flow_list');
        if (live) { flows = saved; ready = true; }
      } catch (e) { if (live) startupError = String(e); }
    })();
    return () => { live = false; stopRouting(); clearTimeout(timer); };
  });
  async function newFlow() {
    try { active = await invoke('flow_new'); navigate('flows'); notify('New flow identity minted.'); }
    catch (e) { notify(String(e), true); }
  }
  function saved(row) {
    flows = [row, ...flows.filter(f => f.id !== row.id)];
    active = row;
  }
  async function removeFlow(id) {
    try {
      await invoke('flow_delete', { id });
      flows = flows.filter(f => f.id !== id);
      if (active?.id === id) active = null;
      notify('Flow deleted.');
    } catch (e) { notify(String(e), true); }
  }
  function compute() {
    try {
      if (!Number.isInteger(computeInput) || computeInput < 0 || computeInput > 46) throw new Error('Choose an integer from 0 to 46.');
      computeResult = `fibonacci(${computeInput}) = ${fibonacci(computeInput)} · WebAssembly`;
    } catch (e) { notify(String(e), true); }
  }
</script>

<div class="desk">
  <aside class="sidebar">
    <h1>STRAW Desk</h1>
    <p class="muted">Local automation workspace</p>
    <nav aria-label="Workspace">
      {#each (desktop ? [['modules','Modules'],['flows','Flows'],['chat','AI chat'],['code','Code generation']] : [['modules','Modules'],['flows','Desktop flows']]) as [value,label]}
        <button class:active={mode === value} onclick={() => navigate(value)}>{label}</button>
      {/each}
    </nav>
    {#if desktop}
    <div class="row spread"><h2>Saved flows</h2><button disabled={!ready} onclick={newFlow}>New</button></div>
    <ul class="flow-list">
      {#each flows as flow (flow.id)}
        <li><button class:active={active?.id === flow.id} onclick={() => { active = flow; navigate('flows'); }}>{flow.name}</button><button aria-label={`Delete ${flow.name}`} onclick={() => removeFlow(flow.id)}>×</button></li>
      {/each}
    </ul>
    <p class="muted">{ready ? 'Local engine ready' : startupError || 'Opening local engine…'}</p>
    <p class="muted small">API · 127.0.0.1:8741<br>Storage · SQLite</p>
    {:else}
    <p class="muted">Browser workspace<br>WASM compute runs locally.</p>
    <p class="muted small">Desktop access is read-only and starts on request.</p>
    {/if}
  </aside>
  <main>
    {#if siteSurface}<PwaStatus />{/if}
    <div class="view" hidden={mode !== 'modules'}>
      <section class="panel modules">
        <h2>Your local workspace</h2>
        <p class="muted">{desktop ? 'Build workflows, use a local model, and generate files with the desktop engine.' : 'Use WebAssembly compute offline after the shell is cached. View saved flows when STRAW Desk is running on this computer.'}</p>
        <div class="module-grid">
          <article><h3>WebAssembly compute</h3><p class="muted">Calculate Fibonacci values from 0 to 46 entirely in the browser.</p><button onclick={() => document.getElementById('compute-input')?.focus()}>Use compute</button></article>
          <article><h3>{desktop ? 'Workflows' : 'Desktop flows'}</h3><p class="muted">{desktop ? 'Connect nodes, persist workflows, and inspect execution history.' : 'Request a read-only snapshot from the local desktop engine.'}</p><button onclick={() => navigate('flows')}>Open flows</button></article>
          <article><h3>Local AI and files</h3><p class="muted">{desktop ? 'Chat with your local model or generate files in a chosen directory.' : 'Chat, file writes, workflow editing, and execution are available in the desktop app.'}</p>{#if desktop}<div class="row"><button onclick={() => navigate('chat')}>AI chat</button><button onclick={() => navigate('code')}>Code generation</button></div>{/if}</article>
        </div>
      </section>
    </div>
    {#if desktop}
    <div class="view" hidden={mode !== 'flows'}>
      {#if active}
        {#key active.id}<FlowCanvas record={active} persisted={flows.some(f => f.id === active.id)} {invoke} {notify} onsaved={saved} />{/key}
      {:else}
        <section class="welcome"><h2>Build a local workflow</h2><p>Connect file, text, logic, and local model nodes. Save and run against the desktop engine.</p><button disabled={!ready} onclick={newFlow}>Create a flow</button></section>
      {/if}
    </div>
    <div class="view" hidden={mode !== 'chat'}>
      <NlpChatPanel {invoke} {notify} />
    </div>
    <div class="view" hidden={mode !== 'code'}>
      <CodeGenPanel {invoke} {notify} />
    </div>
    {:else}
      <div class="view" hidden={mode !== 'flows'}><BrowserFlows {notify} /></div>
      {#if mode === 'chat' || mode === 'code'}<section class="panel"><h2>Desktop feature</h2><p>Open STRAW Desk to use the local model and write files.</p><div><button onclick={() => navigate('modules')}>Back to modules</button></div></section>{/if}
    {/if}
    <section class="compute" aria-label="WebAssembly compute">
      <strong>WASM compute</strong>
      <label>Fibonacci input <input id="compute-input" aria-label="Fibonacci input" type="number" min="0" max="46" step="1" bind:value={computeInput}></label>
      <button disabled={!computeReady} onclick={compute}>Compute in WASM</button>
      <output data-compute-result>{computeResult}</output>
    </section>
  </main>
  <Toast value={toast} />
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin:0; font-family:system-ui,sans-serif; background:#151a20; color:#e6e9ed; }
  :global(button), :global(input), :global(select), :global(textarea) { font:inherit; }
  :global(button) { padding:8px 12px; border:1px solid #44505d; background:#28323d; color:inherit; border-radius:5px; cursor:pointer; }
  :global(button:hover:not(:disabled)), :global(button.active) { background:#354859; border-color:#79aac6; }
  :global(button:disabled) { opacity:.45; cursor:default; }
  :global(input), :global(select), :global(textarea) { background:#10151b; color:inherit; border:1px solid #44505d; border-radius:4px; padding:8px; max-width:100%; }
  :global(label) { display:flex; flex-direction:column; gap:6px; font-size:13px; }
  :global(h1), :global(h2), :global(h3), :global(p) { margin:0; }
  :global(h1) { font-size:21px; } :global(h2) { font-size:18px; } :global(h3) { font-size:15px; }
  :global(.muted) { color:#a3afbd; font-size:13px; line-height:1.5; }
  :global(.small) { font-size:12px; }
  :global(.row) { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  :global(.spread) { justify-content:space-between; }
  :global(.panel) { padding:24px; display:flex; flex-direction:column; gap:18px; min-height:0; }
  .desk { display:flex; height:100vh; }
  .sidebar { display:flex; flex-direction:column; gap:20px; width:260px; padding:22px 18px; border-right:1px solid #37414e; }
  nav { display:flex; flex-direction:column; gap:6px; }
  .flow-list { flex:1; overflow:auto; padding:0; margin:0; list-style:none; }
  li { display:flex; gap:4px; margin-bottom:6px; } li button:first-child { flex:1; text-align:left; overflow:hidden; }
  main { flex:1; display:flex; flex-direction:column; min-width:0; overflow:auto; }
  .view:not([hidden]) { display:flex; flex:1; flex-direction:column; }
  .welcome { flex:1; max-width:700px; margin:auto; padding:50px; display:flex; flex-direction:column; align-items:flex-start; gap:20px; }
  .compute { margin-top:auto; display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding:14px 24px; border-top:1px solid #37414e; font-size:13px; }
  .compute label { flex-direction:row; align-items:center; } .compute input { width:70px; }
  .module-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px; }
  article { display:flex; flex-direction:column; align-items:flex-start; gap:16px; padding:20px; border:1px solid #37414e; border-radius:6px; }
  @media(max-width:700px) { .desk { flex-direction:column; height:auto; min-height:100vh; } .sidebar { width:auto; padding:16px; border-right:0; border-bottom:1px solid #37414e; gap:12px; } nav { flex-direction:row; flex-wrap:wrap; } .flow-list { max-height:140px; } main { flex:1; min-height:65vh; } }
</style>

