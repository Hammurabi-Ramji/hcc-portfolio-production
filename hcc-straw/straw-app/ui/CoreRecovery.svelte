<script>
  let {invoke,notify,status}=$props();
  let busy=$state(false); let report=$state(null); let matches=$state(null);
  async function createCopy() {
    busy=true; report=null; matches=null;
    try { const outputDir=await invoke('recovery_pick',{create:true}); if(!outputDir)return;
      report=await invoke('recovery_create',{outputDir}); matches=true;
      notify('Core recovery copy created and verified.');
    } catch(e) {notify(String(e),true);} finally {busy=false;}
  }
  async function verifyCopy() {
    busy=true; report=null; matches=null;
    try {const directory=await invoke('recovery_pick',{create:false}); if(!directory)return;
      const result=await invoke('recovery_verify',{directory}); report=result.report; matches=result.matchesCurrentVault;
      notify('Recovery copy passed signature, database and ledger checks.');
    } catch(e) {notify(String(e),true);} finally {busy=false;}
  }
</script>
<section>
  <h3>Core recovery copies</h3>
  <p>Keep a verified copy of your workflows, documents, archives and encrypted vault before making major changes.</p>
  <p class="muted">Ordinary documents and metadata stay readable. Records, model files and generated projects need separate backups. Keep the vault passphrase separately; it is never included.</p>
  <div class="row"><button disabled={busy || !status?.unlocked || status?.quarantined} onclick={createCopy}>Create recovery copy</button><button disabled={busy} onclick={verifyCopy}>Verify existing copy</button></div>
  {#if report}
    <p>Signature, database integrity and ledger checks passed.</p>
    {#if matches === true}<p>Signing identity matches this vault.</p>{:else if matches === false}<p role="alert">This copy belongs to a different vault. Do not use it to recover this vault.</p>{:else}<p>Compare its full signing key with a trusted receipt before using it for recovery.</p>{/if}
    <p class="path">{report.directory}</p>
    <p>{(report.databaseBytes / 1048576).toFixed(2)} MiB · ledger position {report.sequence} · {new Date(Number(report.createdAt)*1000).toLocaleString()}</p>
    <details><summary>Verification details</summary><p class="path">Signing key: {report.publicKey}<br>Ledger head: {report.head}</p></details>
  {/if}
  <p class="muted">Verification does not restore or replace live data. Recovery requires closing STRAW and preserving the existing data first. Failed copies may leave an incomplete folder; use a new folder for a retry. Maximum core database size: 256 MiB.</p>
</section>
<style>section{margin-top:24px;border-top:1px solid #444;padding-top:16px;}.path{overflow-wrap:anywhere;}</style>
