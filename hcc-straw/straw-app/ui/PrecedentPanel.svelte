<script>
  let { invoke, notify, active = false } = $props();
  let rows = $state([]);
  let loaded = $state(false);
  let busy = $state(false);
  let failure = $state('');

  let vault = $state(null);
  let title = $state('');
  let rationale = $state('');
  let body = $state('');
  let review = $state(null);
  const TITLE_MAX = 200;
  const RATIONALE_MAX = 1000;
  const BODY_MAX = 100000;

  const ready = $derived(
    vault?.unlocked && !vault?.quarantined &&
    title.trim() && title.length <= TITLE_MAX &&
    rationale.trim() && rationale.length <= RATIONALE_MAX &&
    new TextEncoder().encode(body).length <= BODY_MAX
  );

  async function carve() {
    busy = true;
    try {
      // A native dialog asks for approval; the grant is bound to exactly these values.
      const receipt = await invoke('precedent_carve', $state.snapshot(review));
      notify(`Precedent carved at ledger #${receipt.seq}.`);
      title = ''; rationale = ''; body = '';
      review = null;
      await refresh();
    } catch (e) {
      notify(String(e?.message ?? e), true);
      busy = false;
    }
  }

  async function refresh() {
    busy = true;
    try {
      vault = await invoke('vault_status');
      rows = await invoke('precedent_list');
      failure = '';
    } catch (e) {
      rows = [];
      failure = String(e?.message ?? e);
      notify(failure, true);
    } finally {
      busy = false;
      loaded = true;
    }
  }

  // The ledger is re-verified on every read, so reload whenever the view is shown.
  $effect(() => {
    if (active) refresh();
  });

  const short = (hex) => (hex ? `${hex.slice(0, 12)}…` : '');
  const when = (iso) => (iso ? iso.replace('T', ' ').replace(/\.\d+Z$/, 'Z') : '');
  // Crucible verdicts carry a JSON report; show it formatted, anything else as written.
  function pretty(body) {
    try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
  }
</script>

<section class="panel">
  <h2>Ledger precedents</h2>
  <p class="muted">Precedents are carved into the same signed ledger as vault events and grants, under the one vault signer. Each read re-verifies the whole chain; if verification fails nothing is shown.</p>
  <div class="row"><button disabled={busy} onclick={refresh}>{busy ? 'Working…' : 'Re-verify and refresh'}</button></div>
  <h3>Carve a precedent</h3>
  <p class="muted">A carved precedent is permanent: it can never be edited or removed. The vault signer signs it, so the vault must be unlocked, and a native dialog asks you to approve the exact text once.</p>
  {#if vault && !vault.unlocked}<p role="status">The vault is {vault.created ? 'locked' : 'not initialized'}. Use <strong>Vault and grants</strong> to {vault.created ? 'unlock' : 'create'} it before carving.</p>{/if}
  {#if vault?.quarantined}<p role="alert">The ledger is quarantined; carving is blocked until the database and checkpoint match again.</p>{/if}
  {#if review}
    <section class="review" aria-label="Review permanent precedent">
      <h3>Review before carving</h3>
      <dl><dt>Title</dt><dd>{review.title}</dd><dt>Rationale</dt><dd>{review.rationale}</dd></dl>
      <pre>{review.body || '(empty body)'}</pre>
      <p>This exact text will be permanent.</p>
      <div class="row"><button disabled={busy || !vault?.unlocked || vault?.quarantined} onclick={carve}>Approve and carve…</button><button disabled={busy} onclick={() => review = null}>Back to editing</button></div>
    </section>
  {:else}
    <label>Title<input bind:value={title} maxlength={TITLE_MAX} disabled={busy || !vault?.unlocked || vault?.quarantined}></label>
    <label>Rationale<input bind:value={rationale} maxlength={RATIONALE_MAX} disabled={busy || !vault?.unlocked || vault?.quarantined}></label>
    <label>Body<textarea rows="6" bind:value={body} disabled={busy || !vault?.unlocked || vault?.quarantined}></textarea></label>
    <div class="row"><button disabled={busy || !ready} onclick={() => review = { title: title.trim(), body, rationale: rationale.trim() }}>Review precedent</button></div>
  {/if}
  <h3>Carved precedents</h3>
  {#if failure}
    <p role="alert">{failure}</p>
  {:else if loaded && rows.length === 0}
    <p class="muted">No precedents carved yet. A SOVEREIGN CERTIFIED Crucible run adds one.</p>
  {:else}
    <ol class="precedents" reversed>
      {#each [...rows].reverse() as row (row.id)}
        <li>
          <details>
            <summary><strong>{row.title}</strong> <span class="muted">· ledger #{row.seq} · {when(row.createdAt)} · {short(row.digest)}</span></summary>
            <dl>
              <dt>Rationale</dt><dd>{row.rationale}</dd>
              <dt>Author · judge</dt><dd>{row.author} · {row.judge} · judged {when(row.judgedAt)}</dd>
              <dt>Rules version</dt><dd>{row.rulesVersion}</dd>
              <dt>Precedent SHA-256</dt><dd><code>{row.digest}</code></dd>
              <dt>Signed entry hash</dt><dd><code>{row.entryHash}</code></dd>
              <dt>Vault signer</dt><dd><code>{row.signer}</code></dd>
            </dl>
            <pre>{pretty(row.body)}</pre>
          </details>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  label { display: block; margin-bottom: 12px; }
  input, textarea { width: 100%; box-sizing: border-box; }
  .precedents { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 8px; }
  details { border: 1px solid rgba(128, 128, 128, 0.35); border-radius: 6px; padding: 8px 12px; }
  summary { cursor: pointer; overflow-wrap: anywhere; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 10px 0; }
  dt { opacity: 0.7; }
  dd { margin: 0; overflow-wrap: anywhere; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 24rem; overflow: auto; }
  code { user-select: text; }
</style>
