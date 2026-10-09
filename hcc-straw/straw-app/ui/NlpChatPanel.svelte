<script>
  let { invoke, notify } = $props();
  let messages = $state([]);
  let text = $state('');
  let attachments = $state([]);
  let pendingReads = $state([]);
  let busy = $state(false);
  let model = $state('llama3.2');
  let apiUrl = $state('http://127.0.0.1:11434/api/generate');
  let reads = Promise.resolve();
  async function attach(event) {
    const input = event.currentTarget;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    const tokens = files.map((file) => ({ name: file.name, token: crypto.randomUUID() }));
    pendingReads = [...pendingReads, ...tokens];
    const job = (async () => {
      const batch = [];
      for (const file of files) {
        if (file.size > 1024 * 1024 || !(file.type.startsWith('text/') || file.type === 'application/json')) {
          throw new Error('Choose a UTF-8 text or JSON document up to 1 MiB.');
        }
        const data = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
        batch.push({ name: file.name, mimeType: file.type, sizeBytes: new TextEncoder().encode(data).length, data });
      }
      attachments = [...attachments, ...batch];
    })();
    reads = reads.then(() => job, () => job).then(() => {}, () => {});
    try { await job; }
    catch (e) { notify(String(e), true); }
    finally {
      const finished = new Set(tokens.map((item) => item.token));
      pendingReads = pendingReads.filter((item) => !finished.has(item.token));
    }
  }
  async function send() {
    if (!text.trim() || busy) return;
    busy = true;
    try {
      await reads;
      const sent = JSON.parse(JSON.stringify(attachments));
      const pending = { role: 'user', text, attachments: sent };
      const requestMessages = [...messages, pending];
      const response = await invoke('nlp_send', { request: { messages: requestMessages, settings: { model, apiUrl, temperature: 0.7 } } });
      messages = [...requestMessages, { role: 'assistant', text: response, attachments: [] }];
      const captured = new Set(sent.map((item) => `${item.name}\0${item.data}`));
      attachments = attachments.filter((item) => !captured.has(`${item.name}\0${item.data}`));
      text = '';
      notify('Local model response received.');
    } catch (e) { notify(String(e), true); }
    finally { busy = false; }
  }
</script>
<section class="panel">
  <h2>AI chat</h2><p class="muted">Text context only. Images and audio are not accepted.</p>
  <div class="row"><label>Local model<input bind:value={model}></label><label>Endpoint<input class="endpoint" bind:value={apiUrl}></label></div>
  <div class="messages" aria-live="polite">
    {#each messages as message, index (index)}<article><strong>{message.role}</strong><p>{message.text}</p>{#each message.attachments as attachment, attachmentIndex (attachmentIndex)}<p class="muted">Document: {attachment.name}</p>{/each}</article>{/each}
  </div>
  <label>Your message<textarea rows="5" bind:value={text} disabled={busy}></textarea></label>
  <div class="row"><label>Attach text document<input type="file" accept="text/*,application/json" multiple onchange={attach} disabled={busy}></label><button disabled={busy || !text.trim()} onclick={send}>{busy?'Waiting for local model…':'Send'}</button></div>
  {#each pendingReads as item (item.token)}<div class="row"><span>{item.name} · reading…</span></div>{/each}
  {#each attachments as attachment, index (`${attachment.name}:${index}`)}<div class="row"><span>{attachment.name} · {attachment.sizeBytes} bytes</span><button onclick={() => attachments=attachments.filter((_,n) => n !== index)}>Remove</button></div>{/each}
</section>
<style>.endpoint { width:400px; }.messages { overflow:auto; max-height:45vh; display:flex; flex-direction:column; gap:18px; }article {padding:16px;border-left:2px solid #6c9eb8;}article p {white-space:pre-wrap;line-height:1.6;margin-top:8px;}</style>

