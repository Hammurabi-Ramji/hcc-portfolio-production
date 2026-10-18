<script>
  import { onMount } from 'svelte';
  import EdubaArchive from './EdubaArchive.svelte';
  let { invoke, notify } = $props();
  let documents = $state([]);
  let id = $state('');
  let expected = $state(null);
  let text = $state('');
  let busy = $state(false);
  let dirty = $state(false);
  let selected = $state(null);
  onMount(() => { refresh(); });
  async function refresh() { try { documents = await invoke('document_list'); } catch (e) { notify(String(e),true); } }
  function open(document) {
    if (dirty && !window.confirm('Discard unsaved document changes?')) return;
    id = document.documentId; expected = document.id; text = document.text; selected = document; dirty = false;
  }
  function create() {
    if (dirty && !window.confirm('Discard unsaved document changes?')) return;
    id = crypto.randomUUID(); expected = null; text = ''; selected = null; dirty = false;
  }
  async function save() {
    busy = true;
    try { selected = await invoke('document_save', {id,expected,text}); expected = selected.id; dirty = false; await refresh(); notify('Saved immutable document revision.'); }
    catch (e) { notify(String(e),true); }
    finally { busy = false; }
  }
</script>
<section class="panel">
  <h2>Documents</h2>
  <p class="muted">Each save creates an immutable revision. A stale editor must reload before saving over a newer revision.</p>
  <div class="row"><button disabled={busy} onclick={create}>New document</button><button disabled={busy} onclick={refresh}>Refresh</button></div>
  <div class="documents">
    <nav aria-label="Saved documents">{#each documents as document (document.documentId)}<button disabled={busy} class:active={document.documentId === id} onclick={() => open(document)}>{document.text.split('\n')[0].slice(0,48) || 'Untitled'}</button>{/each}</nav>
    {#if id}<div class="editor"><label>Document text<textarea rows="18" bind:value={text} disabled={busy} oninput={() => dirty = true}></textarea></label><button disabled={busy || !dirty} onclick={save}>Save revision</button>{#if selected}<small>Revision {selected.id}<br>SHA-256 {selected.digest}</small>{/if}</div>{:else}<p>Select or create a document.</p>{/if}
  </div>
</section>
<EdubaArchive {invoke} {notify} />
<style>.documents{display:flex;gap:20px;margin-top:16px;}nav{display:flex;flex-direction:column;gap:6px;width:220px;}nav button{text-align:left;} .editor{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;}textarea{width:100%;}small{overflow-wrap:anywhere;}</style>
