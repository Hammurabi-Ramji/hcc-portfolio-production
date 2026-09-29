<script lang="ts">
  import { onMount } from "svelte";
  import FlowCanvas from "$lib/FlowCanvas.svelte";
  import NlpChatPanel from "$lib/NlpChatPanel.svelte";
  import CodeGenPanel from "$lib/CodeGenPanel.svelte";
  import Toast from "$lib/Toast.svelte";
  import { commands } from "$lib/tauri";
  import { schemas } from "$lib/store";
  import type { FlowRecord } from "$lib/types";

  type AppMode = "flows" | "ai" | "create";

  let flows = $state<FlowRecord[]>([]);
  let activeFlow = $state<FlowRecord | null>(null);
  let loading = $state(true);
  let mode = $state<AppMode>("flows");

  function showToast(message: string, type: "error" | "success" | "info" = "info") {
    window.dispatchEvent(new CustomEvent("addToast", { detail: { message, type } }));
  }

  onMount(async () => {
    const [nodeSchemas, savedFlows] = await Promise.all([
      commands.getNodeSchemas(),
      commands.listFlows(),
    ]);
    schemas.set(nodeSchemas);
    flows = savedFlows;
    loading = false;
  });

  async function newFlow() {
    activeFlow = { id: "", name: "Untitled Flow", definition: "{}", created_at: "", updated_at: "" };
    mode = "flows";
    showToast("Created new flow", "info");
  }

  async function openFlow(record: FlowRecord) {
    const full = await commands.loadFlow(record.id);
    if (full) { activeFlow = full; mode = "flows"; }
  }

  async function deleteFlow(id: string) {
    await commands.deleteFlow(id);
    flows = flows.filter((f) => f.id !== id);
    if (activeFlow?.id === id) activeFlow = null;
    showToast("Flow deleted", "info");
  }

  function formatDate(iso: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
  }
</script>

<div class="app">
  <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="logo">⚡ Straw</span>
    </div>

    <!-- Mode toggle -->
    <div class="mode-toggle">
      <button class="mode-btn" class:active={mode === "flows"} onclick={() => mode = "flows"}>
        <span class="mode-icon">⛓</span> Flows
      </button>
      <button class="mode-btn ai-mode" class:active={mode === "ai"} onclick={() => mode = "ai"}>
        <span class="mode-icon">✦</span> AI Chat
      </button>
      <button class="mode-btn create-mode" class:active={mode === "create"} onclick={() => mode = "create"}>
        <span class="mode-icon">⚙</span> Create
      </button>
    </div>

    {#if mode === "flows"}
      <!-- Flows list -->
      <div class="section-header">
        <span class="section-label">Flows</span>
        <button class="new-btn" onclick={newFlow}>+ New</button>
      </div>

      {#if loading}
        <div class="empty">Loading…</div>
      {:else if flows.length === 0}
        <div class="empty">No flows yet.<br/>Click + New to start.</div>
      {:else}
        <ul class="flow-list">
          {#each flows as flow}
            <li class="flow-item" class:active={activeFlow?.id === flow.id}>
              <button class="flow-btn" onclick={() => openFlow(flow)}>
                <span class="flow-name">{flow.name}</span>
                <span class="flow-date">{formatDate(flow.updated_at)}</span>
              </button>
              <button class="del-btn" onclick={() => deleteFlow(flow.id)} title="Delete">✕</button>
            </li>
          {/each}
        </ul>
      {/if}
    {:else if mode === "ai"}
      <!-- AI Chat sidebar info -->
      <div class="ai-sidebar-info">
        <p>Multimodal AI chat with local LLM support.</p>
        <ul class="feature-list">
          <li>🔗 Fetch any URL</li>
          <li>📄 Upload documents</li>
          <li>🖼 Attach images</li>
          <li>🎙 Record audio</li>
        </ul>
      </div>
    {:else}
      <!-- Create sidebar info -->
      <div class="create-sidebar-info">
        <p>AI-powered code generation. Describe any project.</p>
        <ul class="feature-list">
          <li>⚙ Generate complete projects</li>
          <li>📝 Review & refine code</li>
          <li>🗂 Save to disk instantly</li>
          <li>🔄 Iterative refinement</li>
        </ul>
      </div>
    {/if}
  </aside>

  <!-- ── Main area ───────────────────────────────────────────────────── -->
  <main class="main">
    {#if mode === "create"}
      <CodeGenPanel />
    {:else if mode === "ai"}
      <NlpChatPanel />
    {:else if activeFlow !== null}
      {#key activeFlow.id}
        <FlowCanvas record={activeFlow} />
      {/key}
    {:else}
      <div class="welcome">
        <div class="welcome-icon">⚡</div>
        <h1>Straw Flow Editor</h1>
        <p>Build offline no-code pipelines with local AI, file I/O, and text transformations.</p>
        <div class="welcome-actions">
          <button class="start-btn" onclick={newFlow}>Create a Flow</button>
          <button class="ai-btn" onclick={() => mode = "ai"}>AI Chat ✦</button>
          <button class="create-btn" onclick={() => mode = "create"}>Create Code ⚙</button>
        </div>
      </div>
    {/if}
    <Toast />
  </main>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { background: #181825; color: #cdd6f4; font-family: Inter, system-ui, sans-serif; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  .sidebar {
    width: 220px; background: #1e1e2e;
    border-right: 1px solid #313244;
    display: flex; flex-direction: column; flex-shrink: 0;
  }
  .sidebar-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 14px 10px; border-bottom: 1px solid #313244;
  }
  .logo { font-size: 16px; font-weight: 700; color: #89b4fa; }

  .mode-toggle {
    display: flex; padding: 8px; gap: 4px;
    border-bottom: 1px solid #313244;
  }
  .mode-btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 5px; background: none; border: 1px solid transparent;
    border-radius: 6px; padding: 6px 4px;
    font-size: 12px; font-weight: 500; color: #6c7086; cursor: pointer;
    transition: all 0.15s;
  }
  .mode-btn:hover { background: #313244; color: #cdd6f4; }
  .mode-btn.active { background: #313244; color: #cdd6f4; border-color: #45475a; }
  .mode-btn.ai-mode.active { color: #cba6f7; border-color: #cba6f740; background: #cba6f710; }
  .mode-btn.create-mode.active { color: #f38ba8; border-color: #f38ba840; background: #f38ba810; }
  .mode-icon { font-size: 13px; }

  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px 6px;
  }
  .section-label {
    font-size: 10px; text-transform: uppercase;
    color: #6c7086; letter-spacing: 0.08em;
  }
  .new-btn {
    background: #89b4fa; color: #1e1e2e;
    border: none; border-radius: 6px;
    padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .new-btn:hover { background: #74c7ec; }

  .flow-list { list-style: none; padding: 4px; flex: 1; overflow-y: auto; }
  .flow-item {
    display: flex; align-items: stretch;
    border-radius: 6px; overflow: hidden; margin-bottom: 2px;
  }
  .flow-item.active { background: #313244; }
  .flow-item:hover { background: #26263a; }
  .flow-btn {
    flex: 1; background: none; border: none;
    padding: 8px 10px; text-align: left; cursor: pointer;
    display: flex; flex-direction: column; gap: 2px;
  }
  .flow-name { font-size: 13px; color: #cdd6f4; font-weight: 500; }
  .flow-date { font-size: 10px; color: #6c7086; }
  .del-btn {
    background: none; border: none; color: #6c7086;
    padding: 0 8px; cursor: pointer; font-size: 12px;
  }
  .del-btn:hover { color: #f38ba8; }

  .ai-sidebar-info {
    padding: 14px; display: flex; flex-direction: column; gap: 12px;
  }
  .ai-sidebar-info p { font-size: 12px; color: #6c7086; line-height: 1.5; }
  .feature-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .feature-list li { font-size: 12px; color: #45475a; }

  .create-sidebar-info {
    padding: 14px; display: flex; flex-direction: column; gap: 12px;
  }
  .create-sidebar-info p { font-size: 12px; color: #6c7086; line-height: 1.5; }

  .empty { padding: 16px 14px; color: #6c7086; font-size: 13px; line-height: 1.5; }

  .main { flex: 1; overflow: hidden; position: relative; }

  .welcome {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; gap: 16px; color: #cdd6f4;
  }
  .welcome-icon { font-size: 48px; }
  .welcome h1 { font-size: 24px; font-weight: 700; }
  .welcome p { color: #6c7086; font-size: 14px; text-align: center; max-width: 360px; }
  .welcome-actions { display: flex; gap: 10px; margin-top: 8px; }
  .start-btn {
    background: #89b4fa; color: #1e1e2e;
    border: none; border-radius: 8px;
    padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .start-btn:hover { background: #74c7ec; }
  .ai-btn {
    background: #cba6f720; color: #cba6f7;
    border: 1px solid #cba6f740; border-radius: 8px;
    padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .ai-btn:hover { background: #cba6f730; }
  .create-btn {
    background: #f38ba820; color: #f38ba8;
    border: 1px solid #f38ba840; border-radius: 8px;
    padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .create-btn:hover { background: #f38ba830; }
</style>
