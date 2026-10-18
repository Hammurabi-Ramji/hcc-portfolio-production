<script>
  let { invoke, notify } = $props();
  let project = $state('');
  let busy = $state(false);
  let report = $state(null);
  let error = $state('');
  const labels = { sovereign_certified: 'All nine checks passed', pass_with_warnings: 'Passed with warnings — no certificate', blocked: 'Blocked — no certificate', incomplete: 'Checks incomplete — no certificate' };
  async function choose() {
    try { const selected = await invoke('validation_pick_project'); if (selected) { project = selected; report = null; error = ''; } }
    catch (e) { error = e.message; }
  }
  async function validate() {
    busy = true; report = null; error = '';
    try {
      report = await invoke('validation_run', { project });
      if (report.receipt) notify(`Certificate recorded at ledger #${report.receipt.seq}.`);
    } catch (e) { error = e.message; }
    finally { busy = false; }
  }
</script>

<section class="panel">
  <h2>Validate a project</h2>
  <p class="muted">Choose a local project. Unlock the Vault, then approve running its build, tests and checks. A certificate is recorded only when all nine checks pass.</p>
  <div class="row"><button disabled={busy} onclick={choose}>Choose project folder</button><button disabled={busy || !project} onclick={validate}>{busy ? 'Checking project…' : 'Run nine checks…'}</button></div>
  {#if project}<p class="path">{project}</p>{/if}
  {#if busy}<p role="status" aria-live="polite">Builds and tests can take several minutes. Keep the app open while they run.</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
  {#if report}
    <h3>{labels[report.result] ?? report.result}</h3>
    {#if report.certificateError}<p role="alert">The checks passed, but recording the certificate failed: {report.certificateError}</p>{/if}
    {#if report.receipt}<p role="status">Certificate saved at ledger #{report.receipt.seq}. Open Ledger to read it.</p>{/if}
    <div class="checks">
      {#each report.gates as gate (gate.gate)}
        <details open={gate.status === 'fail'}>
          <summary><strong>{gate.gate}</strong> · {gate.status.toUpperCase()}</summary>
          <p>{gate.details}</p>
          {#each gate.violations as issue}<p class="issue">{issue.file}{issue.line ? `:${issue.line}` : ''} — {issue.message}</p>{/each}
        </details>
      {/each}
    </div>
    <p class="muted">The certificate records these checks and a fingerprint of the source and configuration. It does not guarantee that all defects have been found.</p>
  {/if}
</section>

<style>
  .path, .issue, details p { overflow-wrap: anywhere; }
  .checks { display: grid; gap: 8px; }
  details { border: 1px solid #44505d; padding: 12px; border-radius: 5px; }
  summary { cursor: pointer; text-transform: capitalize; }
  details p { margin-top: 10px; white-space: pre-wrap; }
</style>
