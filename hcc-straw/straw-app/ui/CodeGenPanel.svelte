<script>
  let { invoke, notify } = $props();
  let prompt = $state('');
  let outputDir = $state('');
  let model = $state('llama3.2');
  let apiUrl = $state('http://127.0.0.1:11434/api/generate');
  let files = $state([]);
  let selectedId = $state(null);
  let busy = $state(false);
  let instruction = $state('');
  const selected = $derived(files.find(f => f.id === selectedId));
  function settings() {return {model,apiUrl,temperature:0.7};}
  async function generate() {
    busy=true;
    try {
      const result=await invoke('generate_code',{request:{prompt,outputDir,settings:settings()}});
      files=result.files;selectedId=files[0]?.id ?? null;
      notify(`Saved ${files.length} generated files.`);
    } catch(e) {notify(String(e),true);} finally {busy=false;}
  }
  function edit(content) {files=files.map(f => f.id === selectedId ? {...f,content,isDirty:true} : f);}
  async function save() {
    busy=true;
    try {
      const saved=await invoke('file_save',{outputDir,file:JSON.parse(JSON.stringify(selected))});
      files=files.map(f => f.id === saved.id ? saved : f);notify('File saved.');
    } catch(e) {notify(String(e),true);} finally {busy=false;}
  }
  async function refine() {
    busy=true;
    try {
      const refined=await invoke('refine_code',{request:{file:JSON.parse(JSON.stringify(selected)),instruction,settings:settings()}});
      // Replace the visible file only after the explicit persistence command succeeds.
      const saved=await invoke('file_save',{outputDir,file:refined});
      files=files.map(f => f.id === saved.id ? saved : f);instruction='';notify('Refinement saved.');
    } catch(e) {notify(String(e),true);} finally {busy=false;}
  }
</script>
<section class="panel">
  <h2>Code generation</h2><p class="muted">Named files are checked before saving. Generation refuses to overwrite existing files.</p>
  <div class="row"><label>Local model<input bind:value={model} disabled={busy}></label><label>Endpoint<input class="endpoint" bind:value={apiUrl} disabled={busy}></label></div>
  <label>Output directory<input placeholder="Choose an absolute local project directory" bind:value={outputDir} disabled={busy || files.length > 0}></label>
  <label>Describe the project<textarea rows="4" bind:value={prompt} disabled={busy}></textarea></label>
  <div class="row"><button disabled={busy || !prompt.trim() || !outputDir.trim()} onclick={generate}>{busy?'Working…':'Generate and save'}</button><button disabled={busy} onclick={() => {files=[];selectedId=null;prompt='';outputDir='';}}>New project</button></div>
  {#if files.length}
    <div class="file-editor">
      <nav aria-label="Generated files">{#each files as file (file.id)}<button class:active={selectedId === file.id} onclick={() => selectedId=file.id}>{file.path}{file.isDirty?' *':''}</button>{/each}</nav>
      {#if selected}<div class="content"><h3>{selected.path}</h3><textarea aria-label="File content" rows="18" value={selected.content} oninput={e => edit(e.currentTarget.value)} disabled={busy}></textarea><div class="row"><span class="muted">{selected.isDirty?'Unsaved edits':'Saved to disk'}</span><button disabled={busy || !selected.isDirty} onclick={save}>Save file</button></div><label>Refinement instruction<input bind:value={instruction} disabled={busy}></label><button disabled={busy || !instruction.trim()} onclick={refine}>Refine and save</button></div>{/if}
    </div>
  {/if}
</section>
<style>.endpoint{width:400px;}.file-editor{display:flex;gap:20px;}nav{display:flex;flex-direction:column;gap:6px;width:220px;}nav button{text-align:left;overflow-wrap:anywhere;}.content{flex:1;display:flex;flex-direction:column;gap:14px;min-width:0;}.content textarea{font:13px/1.5 ui-monospace,monospace;width:100%;}</style>

