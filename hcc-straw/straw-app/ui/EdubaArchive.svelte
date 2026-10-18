<script>
  import { onMount } from 'svelte';
  let { invoke, notify } = $props();
  let archives = $state([]);
  let preview = $state(null);
  let busy = $state(false);
  const groups = ['learners','courses','lessons','enrollments','submissions'];
  onMount(() => { refresh(); });
  async function refresh() {
    try { archives = await invoke('eduba_list'); }
    catch(e) { notify(String(e),true); }
  }
  async function choose() {
    busy = true; preview = null;
    try {
      const sourcePath = await invoke('eduba_pick_source');
      if(sourcePath) preview = await invoke('eduba_preview',{sourcePath});
    } catch(e) { notify(String(e),true); }
    finally { busy = false; }
  }
  async function importArchive() {
    busy = true;
    try {
      await invoke('eduba_import',{sourcePath:preview.sourcePath,digest:preview.digest});
      preview = null; await refresh(); notify('Eduba archive saved. Original records remain in their source.');
    } catch(e) { preview = null; notify(String(e),true); }
    finally { busy = false; }
  }
  async function exportArchive(archive) {
    busy = true;
    try {
      const outputPath = await invoke('eduba_pick_export');
      if(outputPath) { await invoke('eduba_export',{digest:archive.digest,outputPath}); notify('Eduba archive exported.'); }
    } catch(e) { notify(String(e),true); }
    finally { busy = false; }
  }
</script>
<section class="panel">
  <h2>Eduba archives</h2>
  <p>Keep a permanent copy of learner, course, lesson, enrollment and submission records from an Eduba database or a previously exported archive. IDs, relationships and timestamps are preserved.</p>
  <p class="muted">Archives and JSON exports are readable plaintext. They are separate from the encrypted vault and are never added to model prompts. Other database tables, including credential tables, are excluded; record text is copied as written. Unlock your vault before approving an import or export.</p>
  <div class="row"><button disabled={busy} onclick={choose}>Choose source and preview</button><button disabled={busy} onclick={refresh}>Refresh archives</button></div>
  {#if preview}
    <article>
      <h3>Review this copy</h3><p class="path">{preview.sourcePath}</p>
      <dl>{#each groups as group}<div><dt>{group}</dt><dd>{preview.counts[group]}</dd></div>{/each}</dl>
      <small>{preview.bytes.toLocaleString()} bytes · SHA-256 {preview.digest}</small>
      <p>This creates a permanent archive. Existing Eduba data is read without upgrading its schema.</p>
      <button disabled={busy} onclick={importArchive}>Approve import</button>
    </article>
  {/if}
  {#each archives as archive (archive.digest)}
    <article>
      <p class="path">{archive.sourcePath}</p>
      <dl>{#each groups as group}<div><dt>{group}</dt><dd>{archive.counts[group]}</dd></div>{/each}</dl>
      <small>Imported {new Date(Number(archive.importedAt)*1000).toLocaleString()} · SHA-256 {archive.digest}</small>
      <button disabled={busy} onclick={() => exportArchive(archive)}>Export JSON copy</button>
    </article>
  {:else}<p class="muted">No Eduba archives saved yet. Preview a local source to begin.</p>{/each}
  <small>Up to 10,000 records and 16 MiB per archive. The latest 100 archives are shown. Export to a new .json file; existing files are never overwritten.</small>
</section>
<style>article{margin-top:16px;padding:16px;border:1px solid #5b6474;border-radius:8px;}dl{display:flex;flex-wrap:wrap;gap:16px;}dt{text-transform:capitalize;}dd{margin:4px 0;}small,.path{display:block;overflow-wrap:anywhere;}article button{margin-top:12px;}</style>
