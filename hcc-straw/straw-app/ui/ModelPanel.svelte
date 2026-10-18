<script>
  import { onMount } from 'svelte';
  let { invoke, notify, onselect } = $props();
  let status = $state(null);
  let busy = $state(false);
  let provider = $state('ollama');
  let base = $state('http://127.0.0.1:11434');
  let models = $state([]);
  let shared = $state(false);
  async function control(action) {
    busy = true;
    try { status = await invoke('model_control', { action }); }
    catch (error) { notify(String(error), true); }
    finally { busy = false; }
  }
  onMount(() => { control('status'); });
  async function scan() {
    busy = true; models = [];
    try { models = await invoke('model_scan', { provider, base }); if (!models.length) notify('No loaded local models found.'); }
    catch (error) { notify(String(error), true); }
    finally { busy = false; }
  }
  async function select(model) {
    busy = true;
    try { await invoke('model_select', { provider: model.provider, base, id: model.id }); onselect({model:model.id,apiUrl:model.endpoint,temperature:0.2}); notify(`Selected ${model.id}`); }
    catch (error) { notify(String(error), true); }
    finally { busy = false; }
  }
  async function sharing() {
    busy = true;
    try { await invoke('loopback_set', {enabled:!shared}); shared = !shared; }
    catch (error) { notify(String(error), true); }
    finally { busy = false; }
  }
</script>
<section class="panel">
  <h2>Local models</h2>
  <h3>SvelteCoder · Qwen3 4B · Q4_K_M</h3>
  <p class="muted">Bundled GGUF, CPU inference. Load verifies the model and tokenizer; Warm prepares inference. No download is needed.</p>
  <p>State: <strong>{status?.phase || 'checking'}</strong> · context: {status?.contextTokens || 8192} tokens</p>
  <div class="row">
    <button disabled={busy || status?.phase !== 'cold'} onclick={() => control('load')}>Load bundled model</button>
    <button disabled={busy || status?.phase !== 'loaded'} onclick={() => control('warm')}>Warm</button>
    <button disabled={busy || status?.phase !== 'warmed'} onclick={() => onselect({model:'rockypod/svelte-coder-4b',apiUrl:'candle://bundled',temperature:0.2})}>Use for chat and code</button>
    <button disabled={busy || !status || status.phase === 'cold'} onclick={() => control('unload')}>Unload</button>
  </div>
  <h3>Discover a local service</h3>
  <div class="row"><label>Provider<select bind:value={provider} disabled={busy} onchange={() => { models = []; base = provider === 'ollama' ? 'http://127.0.0.1:11434' : 'http://127.0.0.1:8082'; }}><option value="ollama">Ollama</option><option value="llama_cpp">llama.cpp</option></select></label><label>Local address<input bind:value={base} disabled={busy}></label><button disabled={busy} onclick={scan}>Scan models</button></div>
  <p class="muted">Start the local service first. Selecting an installed Ollama model loads it into memory. llama.cpp serves the model chosen when its server starts.</p>
  {#each models as model (model.id)}<div class="row"><span>{model.id}</span><button disabled={busy} onclick={() => select(model)}>Load and select</button></div>{/each}
  <h3>Browser workflow sharing</h3>
  <p class="muted">The local browser API starts disabled. Enable it to let the local PWA read saved workflow snapshots.</p>
  <button disabled={busy} onclick={sharing}>{shared ? 'Disable sharing' : 'Enable sharing'}</button>
  {#if busy}<p role="status">Working… Model loading and CPU warm-up may take a moment.</p>{/if}
</section>
