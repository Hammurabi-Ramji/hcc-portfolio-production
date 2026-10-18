<script>
  import { onMount } from 'svelte';
  let { invoke, notify, status } = $props();
  let sourcePath=$state(''); let owners=$state([]); let ownerId=$state('');
  let preview=$state(null); let legacyKey=$state(''); let imports=$state([]);
  let busy=$state(false); let revealed=$state(null); let timer;
  function clear() { revealed=null; clearTimeout(timer); }
  function storedTime(value) { return value?.kind === 'null' ? 'Not recorded' : value?.value ?? 'Not recorded'; }
  $effect(() => { if(!status?.unlocked) { clear(); legacyKey=''; } });
  async function refresh() { try { imports=await invoke('credentials_list'); } catch(e) { notify(String(e),true); } }
  onMount(() => { refresh(); return () => { clearTimeout(timer); legacyKey=''; revealed=null; }; });
  async function choose() {
    busy=true; preview=null; owners=[]; ownerId=''; legacyKey=''; clear();
    try { const path=await invoke('credentials_pick_source'); if(path) { sourcePath=path; owners=await invoke('credentials_owners',{sourcePath}); } }
    catch(e) { notify(String(e),true); } finally { busy=false; }
  }
  async function review() {
    busy=true; preview=null; legacyKey='';
    try { preview=await invoke('credentials_preview',{sourcePath,ownerId}); }
    catch(e) { notify(String(e),true); } finally { busy=false; }
  }
  async function migrate() {
    busy=true; clear();
    try { await invoke('credentials_import',{sourcePath:preview.sourcePath,ownerId:preview.ownerId,digest:preview.digest,legacyKey});
      legacyKey=''; await refresh(); notify('Credentials imported into the encrypted vault.'); }
    catch(e) { notify(String(e),true); } finally { legacyKey=''; busy=false; }
  }
  async function reveal(batch,id) {
    busy=true; clear();
    try { const text=await invoke('credentials_reveal',{digest:batch.digest,credentialId:id});
      const current=await invoke('vault_status');
      if(current.unlocked && !current.quarantined && status?.unlocked) {
        try { revealed=JSON.parse(text); } catch { throw new Error('Credential response could not be displayed.'); }
        timer=setTimeout(clear,30000);
      }
    } catch(e) { notify(String(e),true); } finally { busy=false; }
  }
</script>
<section>
  <h3>Digital Hands credentials</h3>
  <p class="muted">Choose a local database and one account owner. The source stays intact. STRAW copies credentials into an immutable encrypted archive, without copying account passwords, sessions or AI settings.</p>
  <button disabled={busy || status?.quarantined} onclick={choose}>Choose Digital Hands database</button>
  {#if sourcePath}<p class="path">{sourcePath}</p>{/if}
  {#if owners.length}
    <label>Source owner<select bind:value={ownerId} disabled={busy} onchange={() => { preview=null; legacyKey=''; }}><option value="">Choose an owner</option>{#each owners as owner}<option value={owner.id}>Owner {owner.id} · {owner.count} credentials</option>{/each}</select></label>
    <button disabled={busy || !ownerId} onclick={review}>Preview selected owner</button>
  {/if}
  {#if preview}
    <p>{preview.credentialIds.length} credentials · owner {preview.ownerId}</p><p class="path">Source SHA-256: {preview.digest}</p>
    <label>Digital Hands installation SECRET_KEY<input type="password" autocomplete="off" spellcheck="false" bind:value={legacyKey} disabled={busy || !status?.unlocked || status?.quarantined}></label>
    <p class="muted">Use the original installation key, not the account password. Enter it here only. It is cleared after each attempt and is never saved. Unlock STRAW’s vault above before importing. Up to 1,000 credentials and 256 KiB of source fields per owner are supported.</p>
    <button disabled={busy || !status?.unlocked || status?.quarantined || !legacyKey} onclick={migrate}>Approve encrypted import</button>
  {/if}
  <h4>Encrypted imports</h4><button disabled={busy} onclick={refresh}>Refresh imports</button>
  {#each imports as batch (batch.digest)}
    <details><summary>Owner {batch.ownerId} · {batch.credentialIds.length} credentials · ledger {batch.sequence}</summary>
      <p class="path">{batch.sourcePath}<br>{batch.digest}</p>
      <div class="ids">{#each batch.credentialIds as id}<button disabled={busy || !status?.unlocked || status?.quarantined} onclick={() => reveal(batch,id)}>Reveal credential {id}</button>{/each}</div>
    </details>
  {/each}
  {#if revealed}
    <p role="status">Revealed text clears after 30 seconds, when this vault is locked, or when you clear it.</p>
    <button onclick={clear}>Clear revealed credential</button>
    <dl class="secret">
      <dt>Service</dt><dd><pre>{revealed.service}</pre></dd>
      <dt>Username</dt><dd><pre>{revealed.username}</pre></dd>
      <dt>Password</dt><dd><pre>{revealed.password}</pre></dd>
      <dt>Notes</dt><dd><pre>{revealed.notes ?? 'Not recorded'}</pre></dd>
      <dt>Website</dt><dd><pre>{revealed.url ?? 'Not recorded'}</pre></dd>
      <dt>Original credential / owner</dt><dd>{revealed.id} / {revealed.owner_id}</dd>
      <dt>Created · original stored value</dt><dd>{storedTime(revealed.created_at)}</dd>
      <dt>Updated · original stored value</dt><dd>{storedTime(revealed.updated_at)}</dd>
    </dl>
  {/if}
  <p class="muted">Imported secrets are available only through desktop approval. They are never attached to AI requests automatically. Browser memory cannot guarantee erasure of text that has been displayed.</p>
</section>
<style>section{margin-top:24px;border-top:1px solid #444;padding-top:16px;}label{display:block;margin:12px 0;}input,select{max-width:100%;}pre{white-space:pre-wrap;overflow-wrap:anywhere;}.path{overflow-wrap:anywhere;}.ids{display:flex;flex-wrap:wrap;gap:8px;}details{margin:12px 0;}</style>
