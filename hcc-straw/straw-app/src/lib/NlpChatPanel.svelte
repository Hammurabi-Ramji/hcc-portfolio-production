<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { get } from "svelte/store";
  import {
    nlpMessages, nlpThinking, nlpModel, nlpApiUrl,
    nlpSystemPrompt, nlpTemperature, nlpAttachments, micActive
  } from "./store";
  import { commands } from "./tauri";
  import type { NlpMessage, NlpAttachment, NlpRequest } from "./types";

  // ── Local reactive state ──────────────────────────────────────────────────
  let messages = $state<NlpMessage[]>([]);
  let thinking = $state(false);
  let attachments = $state<NlpAttachment[]>([]);
  let isMicActive = $state(false);
  let model = $state("llama2");
  let apiUrl = $state("http://localhost:11434/api/generate");
  let systemPrompt = $state("You are a helpful assistant. When given URLs, documents, images or audio transcripts, analyse them as part of the conversation.");
  let temperature = $state(0.7);
  let showSettings = $state(false);

  // ── Input state ───────────────────────────────────────────────────────────
  let textInput = $state("");
  let urlInput = $state("");
  let showUrlInput = $state(false);
  let fileInputEl: HTMLInputElement;
  let imageInputEl: HTMLInputElement;
  let messagesEndEl: HTMLDivElement;
  let textareaEl: HTMLTextAreaElement;

  // ── MediaRecorder for microphone ──────────────────────────────────────────
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  // ── Store subscriptions ───────────────────────────────────────────────────
  const unsubs = [
    nlpMessages.subscribe(v  => { messages = v; }),
    nlpThinking.subscribe(v  => { thinking = v; }),
    nlpAttachments.subscribe(v => { attachments = v; }),
    micActive.subscribe(v    => { isMicActive = v; }),
    nlpModel.subscribe(v     => { model = v; }),
    nlpApiUrl.subscribe(v    => { apiUrl = v; }),
    nlpSystemPrompt.subscribe(v => { systemPrompt = v; }),
    nlpTemperature.subscribe(v  => { temperature = v; }),
  ];

  onDestroy(() => unsubs.forEach(u => u()));

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  $effect(() => {
    if (messages.length > 0) {
      tick().then(() => messagesEndEl?.scrollIntoView({ behavior: "smooth" }));
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function newId() { return crypto.randomUUID(); }
  function now()   { return new Date().toISOString(); }

  function toast(msg: string, type: "error" | "success" | "info" = "info") {
    window.dispatchEvent(new CustomEvent("addToast", { detail: { message: msg, type } }));
  }

  function removeAttachment(id: string) {
    nlpAttachments.update(a => a.filter(x => x.id !== id));
  }

  function clearAll() {
    nlpMessages.set([]);
    nlpAttachments.set([]);
    textInput = "";
  }

  // ── URL fetch ─────────────────────────────────────────────────────────────
  async function addUrl() {
    const raw = urlInput.trim();
    if (!raw) return;
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    toast(`Fetching ${url}…`, "info");

    try {
      const content = await commands.nlpFetchUrl(url);
      const att: NlpAttachment = {
        id: newId(), kind: "url", name: url,
        data: content, mimeType: "text/plain",
        sizeBytes: content.length,
      };
      nlpAttachments.update(a => [...a, att]);
      urlInput = "";
      showUrlInput = false;
      toast("URL content loaded", "success");
    } catch (e) {
      toast(`Failed to fetch URL: ${String(e)}`, "error");
    }
  }

  // ── File / document upload ────────────────────────────────────────────────
  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    for (const file of Array.from(input.files)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        let data = "";
        let isBase64 = false;

        if (typeof result === "string") {
          // text file — strip data URL prefix
          data = result.includes(",") ? result.split(",")[1] || result : result;
          isBase64 = result.startsWith("data:");
        }

        // Decode text files to plain text for context
        let finalData = data;
        if (!isBase64 || file.type.startsWith("text/")) {
          try { finalData = atob(data); } catch { finalData = data; }
        }

        const att: NlpAttachment = {
          id: newId(), kind: "document", name: file.name,
          data: finalData, mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        };
        nlpAttachments.update(a => [...a, att]);
      };

      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
    input.value = "";
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  async function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    for (const file of Array.from(input.files)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        // Store full base64 data URL
        const att: NlpAttachment = {
          id: newId(), kind: "image", name: file.name,
          data: result, mimeType: file.type,
          sizeBytes: file.size,
        };
        nlpAttachments.update(a => [...a, att]);
      };
      reader.readAsDataURL(file);
    }
    input.value = "";
  }

  // ── Microphone ────────────────────────────────────────────────────────────
  async function toggleMic() {
    if (!isMicActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunks, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const att: NlpAttachment = {
              id: newId(), kind: "audio",
              name: `Recording ${new Date().toLocaleTimeString()}`,
              data: dataUrl,
              mimeType: "audio/webm",
              sizeBytes: blob.size,
            };
            nlpAttachments.update(a => [...a, att]);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        micActive.set(true);
        toast("Recording… click mic to stop", "info");
      } catch (err) {
        toast("Microphone access denied", "error");
      }
    } else {
      mediaRecorder?.stop();
      micActive.set(false);
      toast("Recording saved", "success");
    }
  }

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = "auto";
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 160) + "px";
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function send() {
    const text = textInput.trim();
    const atts = get(nlpAttachments);

    if (!text && atts.length === 0) return;
    if (thinking) return;

    const userMsg: NlpMessage = {
      id: newId(), role: "user", text,
      attachments: [...atts],
      timestamp: now(),
    };

    nlpMessages.update(m => [...m, userMsg]);
    nlpAttachments.set([]);
    textInput = "";
    if (textareaEl) { textareaEl.style.height = "auto"; }

    // Add thinking placeholder
    const placeholderId = newId();
    const placeholder: NlpMessage = {
      id: placeholderId, role: "assistant", text: "",
      attachments: [], timestamp: now(), thinking: true,
    };
    nlpMessages.update(m => [...m, placeholder]);
    nlpThinking.set(true);

    try {
      const currentMessages = get(nlpMessages).filter(m => !m.thinking);
      const request: NlpRequest = {
        messages: currentMessages,
        model: get(nlpModel),
        system_prompt: get(nlpSystemPrompt),
        api_url: get(nlpApiUrl),
        temperature: get(nlpTemperature),
      };

      const response = await commands.nlpSend(request);

      const assistantMsg: NlpMessage = {
        id: placeholderId, role: "assistant",
        text: response.text,
        attachments: [], timestamp: now(),
        thinking: false,
      };

      nlpMessages.update(msgs =>
        msgs.map(m => m.id === placeholderId ? assistantMsg : m)
      );
      toast(`Response in ${response.elapsed_ms}ms`, "success");
    } catch (err) {
      nlpMessages.update(msgs =>
        msgs.map(m => m.id === placeholderId
          ? { ...m, text: "", error: String(err), thinking: false }
          : m
        )
      );
      toast(`AI error: ${String(err)}`, "error");
    } finally {
      nlpThinking.set(false);
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── Format helpers ────────────────────────────────────────────────────────
  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function attachIcon(kind: string): string {
    return kind === "image" ? "🖼" : kind === "url" ? "🔗" : kind === "audio" ? "🎙" : "📄";
  }

  function formatBytes(n?: number): string {
    if (!n) return "";
    if (n < 1024) return `${n}B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
    return `${(n / (1024 * 1024)).toFixed(1)}MB`;
  }
</script>

<!-- Hidden file inputs -->
<input bind:this={fileInputEl}  type="file" accept=".txt,.md,.csv,.json,.pdf,.docx" multiple style="display:none" onchange={handleFileUpload} />
<input bind:this={imageInputEl} type="file" accept="image/*" multiple style="display:none" onchange={handleImageUpload} />

<div class="nlp-root">
  <!-- ── Header ──────────────────────────────────────────────────────── -->
  <div class="nlp-header">
    <div class="nlp-header-left">
      <span class="nlp-icon">✦</span>
      <span class="nlp-title">AI Chat</span>
      <span class="model-badge">{model}</span>
    </div>
    <div class="nlp-header-right">
      {#if messages.length > 0}
        <button class="hbtn" onclick={clearAll} title="Clear conversation">🗑</button>
      {/if}
      <button class="hbtn" class:active={showSettings} onclick={() => showSettings = !showSettings} title="Settings">⚙</button>
    </div>
  </div>

  <!-- ── Settings Panel ─────────────────────────────────────────────── -->
  {#if showSettings}
    <div class="settings-panel">
      <label>
        <span>Model</span>
        <input type="text" bind:value={model} onchange={() => nlpModel.set(model)} placeholder="llama2" />
      </label>
      <label>
        <span>API URL</span>
        <input type="text" bind:value={apiUrl} onchange={() => nlpApiUrl.set(apiUrl)} placeholder="http://localhost:11434/api/generate" />
      </label>
      <label>
        <span>System Prompt</span>
        <textarea rows="3" bind:value={systemPrompt} onchange={() => nlpSystemPrompt.set(systemPrompt)}></textarea>
      </label>
      <label>
        <span>Temperature <strong>{temperature}</strong></span>
        <input type="range" min="0" max="2" step="0.1"
          bind:value={temperature}
          onchange={() => nlpTemperature.set(temperature)} />
      </label>
    </div>
  {/if}

  <!-- ── Messages ───────────────────────────────────────────────────── -->
  <div class="messages">
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <p>Start a conversation.</p>
        <p class="hint">Add a URL, upload a document, attach an image, or just type.</p>
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        <div class="message {msg.role}" class:thinking={msg.thinking}>
          <div class="msg-avatar">{msg.role === "user" ? "You" : "AI"}</div>
          <div class="msg-body">
            <!-- Attachments -->
            {#if msg.attachments.length > 0}
              <div class="msg-attachments">
                {#each msg.attachments as att}
                  <div class="msg-att">
                    {#if att.kind === "image" && att.data.startsWith("data:")}
                      <img src={att.data} alt={att.name} class="att-thumb" />
                    {:else}
                      <span class="att-icon">{attachIcon(att.kind)}</span>
                    {/if}
                    <span class="att-name">{att.name.length > 28 ? att.name.slice(0,28)+"…" : att.name}</span>
                    {#if att.sizeBytes}<span class="att-size">{formatBytes(att.sizeBytes)}</span>{/if}
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Text / thinking -->
            {#if msg.thinking}
              <div class="thinking-dots">
                <span></span><span></span><span></span>
              </div>
            {:else if msg.error}
              <div class="msg-error">⚠ {msg.error}</div>
            {:else}
              <div class="msg-text">{msg.text}</div>
            {/if}

            <div class="msg-time">{formatTime(msg.timestamp)}</div>
          </div>
        </div>
      {/each}
    {/if}
    <div bind:this={messagesEndEl}></div>
  </div>

  <!-- ── Pending Attachments Tray ────────────────────────────────────── -->
  {#if attachments.length > 0}
    <div class="att-tray">
      {#each attachments as att}
        <div class="tray-item">
          {#if att.kind === "image" && att.data.startsWith("data:")}
            <img src={att.data} alt={att.name} class="tray-thumb" />
          {:else}
            <span class="tray-icon">{attachIcon(att.kind)}</span>
          {/if}
          <span class="tray-name">{att.name.length > 18 ? att.name.slice(0,18)+"…" : att.name}</span>
          <button class="tray-remove" onclick={() => removeAttachment(att.id)}>✕</button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- ── URL Input Popup ─────────────────────────────────────────────── -->
  {#if showUrlInput}
    <div class="url-popup">
      <input
        type="url"
        placeholder="https://example.com"
        bind:value={urlInput}
        onkeydown={(e) => { if (e.key === "Enter") addUrl(); if (e.key === "Escape") showUrlInput = false; }}
        class="url-field"
      />
      <button class="url-go" onclick={addUrl}>Fetch</button>
      <button class="url-cancel" onclick={() => { showUrlInput = false; urlInput = ""; }}>✕</button>
    </div>
  {/if}

  <!-- ── Input Bar ───────────────────────────────────────────────────── -->
  <div class="input-bar" class:thinking>
    <!-- Tool buttons -->
    <div class="tool-row">
      <button class="tool-btn" title="Add URL" onclick={() => { showUrlInput = !showUrlInput; }}>🔗</button>
      <button class="tool-btn" title="Upload document" onclick={() => fileInputEl.click()}>📄</button>
      <button class="tool-btn" title="Attach image" onclick={() => imageInputEl.click()}>🖼</button>
      <button class="tool-btn mic-btn" class:mic-active={isMicActive} title={isMicActive ? "Stop recording" : "Start microphone"} onclick={toggleMic}>
        {isMicActive ? "⏹" : "🎙"}
      </button>
      {#if isMicActive}
        <span class="rec-badge">● REC</span>
      {/if}
    </div>

    <!-- Text + send -->
    <div class="input-row">
      <textarea
        bind:this={textareaEl}
        class="msg-input"
        placeholder={thinking ? "Thinking…" : "Ask anything… Shift+Enter for new line"}
        bind:value={textInput}
        onkeydown={onKeydown}
        oninput={autoResize}
        rows="1"
        disabled={thinking}
      ></textarea>
      <button
        class="send-btn"
        class:ready={textInput.trim().length > 0 || attachments.length > 0}
        onclick={send}
        disabled={thinking || (textInput.trim().length === 0 && attachments.length === 0)}
        title="Send (Enter)"
      >
        {thinking ? "…" : "▶"}
      </button>
    </div>
  </div>
</div>

<style>
  .nlp-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #181825;
    color: #cdd6f4;
    font-family: Inter, system-ui, sans-serif;
    overflow: hidden;
  }

  /* ── Header ── */
  .nlp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #1e1e2e;
    border-bottom: 1px solid #313244;
    flex-shrink: 0;
  }
  .nlp-header-left { display: flex; align-items: center; gap: 8px; }
  .nlp-icon { color: #cba6f7; font-size: 16px; }
  .nlp-title { font-size: 14px; font-weight: 700; color: #cdd6f4; }
  .model-badge {
    font-size: 10px; background: #313244; color: #89b4fa;
    border-radius: 10px; padding: 2px 8px; font-weight: 500;
  }
  .nlp-header-right { display: flex; gap: 4px; }
  .hbtn {
    background: none; border: none; color: #6c7086;
    font-size: 14px; cursor: pointer; padding: 4px 6px;
    border-radius: 4px;
  }
  .hbtn:hover, .hbtn.active { background: #313244; color: #cdd6f4; }

  /* ── Settings ── */
  .settings-panel {
    background: #1e1e2e;
    border-bottom: 1px solid #313244;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }
  .settings-panel label { display: flex; flex-direction: column; gap: 4px; }
  .settings-panel span { font-size: 10px; text-transform: uppercase; color: #6c7086; letter-spacing: 0.06em; }
  .settings-panel input[type="text"],
  .settings-panel textarea {
    background: #313244; border: 1px solid #45475a;
    border-radius: 6px; padding: 6px 8px;
    color: #cdd6f4; font-size: 12px; width: 100%; box-sizing: border-box;
  }
  .settings-panel input[type="range"] { width: 100%; accent-color: #cba6f7; }
  .settings-panel textarea { resize: vertical; font-family: monospace; }

  /* ── Messages ── */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: #313244; border-radius: 2px; }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    padding: 40px;
  }
  .empty-icon { font-size: 32px; color: #313244; }
  .empty-state p { color: #45475a; font-size: 14px; margin: 0; }
  .empty-state .hint { font-size: 12px; color: #313244; }

  /* ── Individual message ── */
  .message {
    display: flex;
    gap: 10px;
    max-width: 100%;
  }
  .message.user { flex-direction: row-reverse; }
  .message.user .msg-body {
    background: #313244;
    border-radius: 14px 14px 4px 14px;
    align-items: flex-end;
  }
  .message.assistant .msg-body {
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 14px 14px 14px 4px;
    align-items: flex-start;
  }

  .msg-avatar {
    font-size: 9px; text-transform: uppercase;
    color: #6c7086; padding-top: 10px;
    white-space: nowrap; flex-shrink: 0;
    letter-spacing: 0.05em;
  }

  .msg-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 14px;
    max-width: calc(100% - 52px);
    word-break: break-word;
  }

  .msg-text {
    font-size: 13px;
    line-height: 1.6;
    color: #cdd6f4;
    white-space: pre-wrap;
  }
  .msg-error { font-size: 12px; color: #f38ba8; }
  .msg-time { font-size: 10px; color: #45475a; }

  /* ── Thinking animation ── */
  .thinking-dots {
    display: flex; gap: 4px; padding: 4px 0;
  }
  .thinking-dots span {
    width: 6px; height: 6px;
    background: #6c7086; border-radius: 50%;
    animation: bounce 1.2s infinite;
  }
  .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
  .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-6px); opacity: 1; }
  }

  /* ── Attachment chips in message ── */
  .msg-attachments {
    display: flex; flex-wrap: wrap; gap: 6px;
  }
  .msg-att {
    display: flex; align-items: center; gap: 4px;
    background: #181825; border: 1px solid #45475a;
    border-radius: 6px; padding: 4px 8px;
    font-size: 11px;
  }
  .att-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; }
  .att-icon { font-size: 14px; }
  .att-name { color: #89b4fa; }
  .att-size { color: #6c7086; }

  /* ── Attachment tray ── */
  .att-tray {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 12px;
    background: #1e1e2e;
    border-top: 1px solid #313244;
    flex-shrink: 0;
  }
  .tray-item {
    display: flex; align-items: center; gap: 4px;
    background: #313244; border-radius: 8px;
    padding: 4px 8px; font-size: 11px;
    max-width: 180px;
  }
  .tray-thumb { width: 28px; height: 28px; object-fit: cover; border-radius: 4px; }
  .tray-icon { font-size: 14px; }
  .tray-name { color: #cdd6f4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tray-remove {
    background: none; border: none; color: #6c7086;
    cursor: pointer; font-size: 11px; padding: 0 2px; flex-shrink: 0;
  }
  .tray-remove:hover { color: #f38ba8; }

  /* ── URL popup ── */
  .url-popup {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    background: #1e1e2e;
    border-top: 1px solid #313244;
    flex-shrink: 0;
    align-items: center;
  }
  .url-field {
    flex: 1;
    background: #313244; border: 1px solid #45475a;
    border-radius: 6px; padding: 6px 10px;
    color: #cdd6f4; font-size: 13px;
  }
  .url-field:focus { outline: none; border-color: #89b4fa; }
  .url-go {
    background: #89b4fa; color: #1e1e2e;
    border: none; border-radius: 6px;
    padding: 6px 12px; font-size: 12px;
    font-weight: 600; cursor: pointer;
  }
  .url-go:hover { background: #74c7ec; }
  .url-cancel {
    background: none; border: none;
    color: #6c7086; cursor: pointer; font-size: 14px; padding: 4px;
  }
  .url-cancel:hover { color: #f38ba8; }

  /* ── Input bar ── */
  .input-bar {
    border-top: 1px solid #313244;
    background: #1e1e2e;
    flex-shrink: 0;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .input-bar.thinking { opacity: 0.75; }

  .tool-row {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .tool-btn {
    background: none; border: none;
    font-size: 15px; cursor: pointer;
    padding: 4px 6px; border-radius: 6px;
    color: #6c7086; transition: background 0.15s, color 0.15s;
  }
  .tool-btn:hover { background: #313244; color: #cdd6f4; }
  .mic-btn { font-size: 16px; }
  .mic-btn.mic-active {
    color: #f38ba8;
    background: #f38ba820;
    animation: pulse 1s infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 #f38ba840; }
    50% { box-shadow: 0 0 0 6px transparent; }
  }
  .rec-badge {
    font-size: 10px; color: #f38ba8;
    font-weight: 700; letter-spacing: 0.05em;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .input-row {
    display: flex;
    gap: 6px;
    align-items: flex-end;
  }
  .msg-input {
    flex: 1;
    background: #313244; border: 1px solid #45475a;
    border-radius: 10px; padding: 8px 12px;
    color: #cdd6f4; font-size: 13px;
    font-family: inherit;
    resize: none; overflow-y: hidden;
    line-height: 1.5;
    min-height: 36px;
  }
  .msg-input:focus { outline: none; border-color: #cba6f7; }
  .msg-input::placeholder { color: #45475a; }
  .msg-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .send-btn {
    width: 38px; height: 38px;
    border-radius: 10px;
    border: none; cursor: pointer;
    font-size: 14px; font-weight: 700;
    background: #313244; color: #6c7086;
    transition: background 0.15s, color 0.15s, transform 0.1s;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .send-btn.ready { background: #cba6f7; color: #1e1e2e; }
  .send-btn.ready:hover { background: #b4befe; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
</style>
