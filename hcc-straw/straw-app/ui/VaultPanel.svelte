<script>
  import { onMount } from 'svelte';
  import CredentialImport from './CredentialImport.svelte';
  import CoreRecovery from './CoreRecovery.svelte';
  let { invoke, notify } = $props();
  let status = $state(null); let password = $state(''); let id = $state(''); let value = $state(''); let revealed = $state(''); let busy = $state(false);
  async function refresh() {try {status=await invoke('vault_status');}catch(e){notify(String(e),true);}}
  onMount(() => {refresh();});
  async function unlock() {
    busy=true;
    try {status=await invoke(status?.created?'vault_unlock':'vault_initialize',{password});notify('Vault unlocked. Operation grants are available.');}
    catch(e){notify(String(e),true);}finally{password='';busy=false;}
  }
  async function lock() {busy=true;try {await invoke('vault_lock');revealed='';value='';await refresh();}catch(e){notify(String(e),true);}finally{busy=false;}}
  async function save() {busy=true;try {await invoke('vault_put',{id,value});value='';revealed='';await refresh();notify('Encrypted vault item saved.');}catch(e){notify(String(e),true);}finally{busy=false;}}
  async function reveal() {busy=true;try{revealed=await invoke('vault_get',{id});await refresh();}catch(e){notify(String(e),true);}finally{busy=false;}}
</script>
<section class="panel"><h2>Vault and grants</h2><p class="muted">Vault items are encrypted locally. A native approval dialog issues a single-use grant for AI, file exports, workflow execution, or revealing a vault item. Vault contents are never attached to AI requests automatically.</p>
  {#if status?.quarantined}<p role="alert">Ledger quarantined: the database and signed checkpoint failed verification. Writes and protected operations are blocked. Restore a matching verified database and checkpoint from your backup.</p>{/if}
  <p>Vault: <strong>{status?.unlocked?'unlocked':status?.created?'locked':'not initialized'}</strong></p>
  {#if !status?.unlocked}<div class="row"><label>Passphrase (at least 12 bytes)<input type="password" autocomplete="off" bind:value={password} disabled={busy || status?.quarantined}></label><button disabled={busy || !status || status.quarantined || password.length<12} onclick={unlock}>{status?.created?'Unlock':'Create vault'}</button></div>{:else}<button disabled={busy} onclick={lock}>Lock vault</button>{/if}
  <p class="muted">Keep your passphrase and a backup of both the database and checkpoint. No passphrase recovery service is provided.</p>
  <h3>Vault item</h3><label>Item identity<input bind:value={id} disabled={busy || !status?.unlocked}></label><label>Secret value<textarea rows="4" bind:value={value} disabled={busy || !status?.unlocked}></textarea></label><div class="row"><button disabled={busy || !status?.unlocked || !id || !value} onclick={save}>Encrypt and save</button><button disabled={busy || !status?.unlocked || !id} onclick={reveal}>Reveal once</button><button disabled={!revealed} onclick={() => revealed=''}>Clear revealed text</button></div>
  {#if revealed}<pre class="secret">{revealed}</pre>{/if}
  {#if status?.checkpoint}<h3>Signed ledger checkpoint</h3><p>Sequence {status.checkpoint.sequence} · SHA-256 {status.checkpoint.head}</p><details><summary>Public verification receipt</summary><pre>{JSON.stringify(status.checkpoint,null,2)}</pre></details>{/if}
  <button disabled={busy} onclick={refresh}>Refresh integrity status</button>
  <CredentialImport {invoke} {notify} {status} />
  <CoreRecovery {invoke} {notify} {status} />
</section>
<style>textarea{width:100%;}pre{white-space:pre-wrap;overflow-wrap:anywhere;} .secret{user-select:text;}label{display:block;margin-bottom:12px;}</style>
