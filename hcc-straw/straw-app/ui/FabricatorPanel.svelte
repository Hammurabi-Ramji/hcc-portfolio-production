<script>
  import { onMount } from 'svelte';
  let { invoke, notify } = $props();
  let templates = $state([]); let template = $state('education_saas'); let outputDir = $state(''); let busy = $state(false); let result = $state(null);
  onMount(() => { invoke('fabricator_templates').then(value => templates = value).catch(e => notify(String(e),true)); });
  async function generate() {
    busy = true; result = null;
    try { result = await invoke('fabricator_generate',{template,outputDir}); notify(`Created ${result.files} source files.`); }
    catch(e) { notify(String(e),true); }
    finally { busy = false; }
  }
</script>
<section class="panel"><h2>Sovereign fabricator</h2><p class="muted">Generate the shared Rust core with workflows, SQLx WAL storage, documents, vectors, and a loopback API. Domain integrations are added separately.</p><div class="row"><label>Template<select bind:value={template} disabled={busy}>{#each templates as name (name)}<option value={name}>{name.replaceAll('_',' ')}</option>{/each}</select></label><label>New output directory<input bind:value={outputDir} disabled={busy}></label></div><button disabled={busy || !outputDir.trim()} onclick={generate}>Generate source bundle</button>{#if result}<p>Created {result.files} files in {result.outputDir}. Run the instructions in its README.</p>{/if}</section>
