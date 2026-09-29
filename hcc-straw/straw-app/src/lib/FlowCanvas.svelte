<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap, type Node, type Edge } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import FlowNodeComponent from "./FlowNode.svelte";
  import NodeConfigPanel from "./NodeConfigPanel.svelte";
  import { schemas, schemasByKind, selectedNodeId, executionResult, running, nodeResultFor } from "./store";
  import { get } from "svelte/store";
  import { commands } from "./tauri";
  import type { FlowRecord, NodeSchema } from "./types";

  let { record }: { record: FlowRecord | null } = $props();

  // Show toast notification
  function showToast(message: string, type: "error" | "success" | "info" = "info") {
    const event = new CustomEvent("addToast", { detail: { message, type } });
    window.dispatchEvent(event);
  }

  const nodeTypes = { default: FlowNodeComponent };

  // ── State ───────────────────────────────────────────────────────────────────
  let flowName = $state(record?.name ?? "Untitled Flow");
  let flowId = $state<string | null>(record?.id ?? null);
  let isDirty = $state(false); // Track unsaved changes

  function parseDefinition(def: string): { nodes: Node[]; edges: Edge[] } {
    try {
      const parsed = JSON.parse(def);
      return { nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] };
    } catch { return { nodes: [], edges: [] }; }
  }

  const initial = parseDefinition(record?.definition ?? "{}");
  let nodes = $state<Node[]>(initial.nodes);
  let edges = $state<Edge[]>(initial.edges);

  // Use selectedNodeId store directly - no need for duplicate selectedId state
  let configOverrides = $state<Record<string, Record<string, string>>>({});

  // Mark flow as dirty when nodes/edges change
  $effect(() => {
    isDirty = true;
  });

  // ── Selected node ────────────────────────────────────────────────────────────
  // selectedNodeId is a Svelte store — subscribe reactively with $
  let selectedId = $state<string | null>(null);
  $effect(() => {
    const unsub = selectedNodeId.subscribe((v) => { selectedId = v; });
    return unsub;
  });

  let selectedSchema = $derived.by(() => {
    if (!selectedId) return null;
    const node = nodes.find((n) => n.id === selectedId);
    if (!node) return null;
    return (get(schemasByKind) as Record<string, NodeSchema>)[node.data.kind as string] ?? null;
  });

  let selectedConfig = $derived.by(() => {
    if (!selectedId) return {} as Record<string, string>;
    const node = nodes.find((n) => n.id === selectedId);
    return configOverrides[selectedId] ?? (node?.data?.config as Record<string, string>) ?? {};
  });

  // ── Node config update ──────────────────────────────────────────────────────
  // Now properly propagates changes back to nodes using Svelte 5 runes
  function updateConfig(nodeId: string, config: Record<string, string>) {
    configOverrides[nodeId] = config;
    const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex !== -1) {
      nodes[nodeIndex] = { ...nodes[nodeIndex], data: { ...nodes[nodeIndex].data, config } };
    }
  }

  // ── Node deletion ───────────────────────────────────────────────────────────
  function deleteNode() {
    if (!selectedId) return;
    // Remove node
    nodes = nodes.filter((n) => n.id !== selectedId);
    // Remove edges connected to this node
    edges = edges.filter((e) => e.source !== selectedId && e.target !== selectedId);
    selectedNodeId.set(null);
    showToast("Node deleted", "info");
  }

  // ── Add node ─────────────────────────────────────────────────────────────────
  let showPalette = $state(false);

  function addNode(schema: NodeSchema) {
    const id = crypto.randomUUID();
    const defaults: Record<string, string> = {};
    for (const f of schema.config_fields) {
      if (f.default) defaults[f.name] = f.default;
    }
    const newNode: Node = {
      id,
      type: "default",
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        kind: schema.kind,
        label: schema.label,
        category: schema.category,
        inputs: schema.inputs,
        outputs: schema.outputs,
        config: defaults,
      },
    };
    nodes = [...nodes, newNode];
    showPalette = false;
    selectedNodeId.set(id);
  }

  // ── Run ──────────────────────────────────────────────────────────────────────
  async function runFlow() {
    running.set(true);
    try {
      const flow = {
        nodes: nodes.map((n) => ({
          id: n.id,
          kind: n.data.kind as string,
          config: n.data.config as Record<string, string>,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          source_handle: e.sourceHandle ?? "",
          target: e.target,
          target_handle: e.targetHandle ?? "",
        })),
      };
      const result = await commands.runFlow(JSON.stringify(flow), flowId);
      executionResult.set(result);
      showToast(`Flow executed — ${result.order.length} nodes ran`, "success");
    } catch (e) {
      console.error(e);
      showToast(`Execution failed: ${String(e)}`, "error");
    } finally {
      running.set(false);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function saveFlow() {
    const definition = JSON.stringify({ nodes, edges });
    const id = await commands.saveFlow(flowId, flowName, definition);
    flowId = id;
    isDirty = false;
    showToast("Flow saved", "success");
  }

  // Save flow name on blur
  async function saveFlowName() {
    await saveFlow();
  }

  // Derived values — Svelte stores read with get() inside $derived are fine
  let result = $derived(get(executionResult));
  let isRunning = $derived(get(running));

  // Group schemas by category for palette
  let categorized = $derived.by(() => {
    const groups: Record<string, NodeSchema[]> = {};
    for (const s of get(schemas)) {
      (groups[s.category] ??= []).push(s);
    }
    return groups;
  });
</script>

<div class="canvas-root">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="flow-name-container">
      <span class="dirty-indicator" class:visible={isDirty}>●</span>
      <input class="flow-name" bind:value={flowName} placeholder="Flow name…" onblur={saveFlowName} />
    </div>
    <button class="btn-add" onclick={() => showPalette = !showPalette}>+ Add Node</button>
    {#if selectedId}
      <button class="btn-delete" onclick={deleteNode} title="Delete Node">🗑</button>
    {/if}
    <div class="spacer"></div>
    <button class="btn-save" onclick={saveFlow} disabled={!isDirty && flowName !== "Untitled Flow"}>Save</button>
    <button class="btn-run" onclick={runFlow} disabled={isRunning}>
      {isRunning ? "Running…" : "▶ Run"}
    </button>
  </div>

  <div class="canvas-body">
    <!-- Node palette -->
    {#if showPalette}
      <div class="palette">
        <div class="palette-header">
          <strong>Add Node</strong>
          <button onclick={() => showPalette = false}>✕</button>
        </div>
        {#each Object.entries(categorized) as [cat, catSchemas]}
          <div class="cat-label">{cat}</div>
          {#each catSchemas as s}
            <button class="palette-item" onclick={() => addNode(s)}>
              <span class="item-label">{s.label}</span>
              <span class="item-desc">{s.description}</span>
            </button>
          {/each}
        {/each}
      </div>
    {/if}

    <!-- Flow canvas -->
    <div class="flow-wrap">
      <SvelteFlow
        bind:nodes
        bind:edges
        {nodeTypes}
        fitView
        onnodeclick={(e) => selectedNodeId.set((e as unknown as { node: { id: string } }).node.id)}
      >
        <Controls />
        <Background />
        <MiniMap />
      </SvelteFlow>
    </div>

    <!-- Config panel -->
    {#if selectedId && selectedSchema}
      <NodeConfigPanel
        schema={selectedSchema}
        config={selectedConfig}
        result={result ? nodeResultFor(result, selectedId) : undefined}
        onclose={() => selectedNodeId.set(null)}
        onupdate={(newConfig) => { if (selectedId) updateConfig(selectedId, newConfig); }}
      />
    {/if}
  </div>
</div>

<style>
  .canvas-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #181825;
    color: #cdd6f4;
    font-family: Inter, system-ui, sans-serif;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #1e1e2e;
    border-bottom: 1px solid #313244;
  }

  .flow-name-container {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dirty-indicator {
    font-size: 10px;
    color: #f38ba8;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .dirty-indicator.visible {
    opacity: 1;
  }

  .flow-name {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 6px;
    padding: 5px 10px;
    color: #cdd6f4;
    font-size: 14px;
    font-weight: 500;
    width: 200px;
  }
  .flow-name:focus { outline: none; border-color: #89b4fa; }

  .spacer { flex: 1; }

  button {
    border: none; border-radius: 6px;
    padding: 6px 14px; font-size: 13px;
    cursor: pointer; font-weight: 500;
  }

  .btn-add { background: #313244; color: #cdd6f4; }
  .btn-add:hover { background: #45475a; }
  .btn-save { background: #45475a; color: #cdd6f4; }
  .btn-save:hover:not(:disabled) { background: #585b70; }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-run { background: #a6e3a1; color: #1e1e2e; }
  .btn-run:hover:not(:disabled) { background: #94e2d5; }
  .btn-run:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-delete { background: #f38ba820; color: #f38ba8; }
  .btn-delete:hover { background: #f38ba830; }

  .canvas-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .flow-wrap {
    flex: 1;
    height: 100%;
  }

  /* Palette */
  .palette {
    position: absolute;
    left: 16px;
    top: 16px;
    z-index: 10;
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 10px;
    width: 240px;
    max-height: 70vh;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 8px 32px #00000060;
  }

  .palette-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px 8px;
    border-bottom: 1px solid #313244;
  }
  .palette-header button { background: none; color: #6c7086; padding: 2px 6px; }
  .palette-header button:hover { color: #f38ba8; }

  .cat-label {
    font-size: 10px;
    text-transform: uppercase;
    color: #6c7086;
    letter-spacing: 0.08em;
    padding: 8px 8px 2px;
  }

  .palette-item {
    background: #313244;
    border-radius: 6px;
    padding: 8px 10px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: #cdd6f4;
    width: 100%;
  }
  .palette-item:hover { background: #45475a; }
  .item-label { font-size: 13px; font-weight: 500; }
  .item-desc { font-size: 11px; color: #6c7086; }

  :global(.svelte-flow) { background: #181825 !important; }
  :global(.svelte-flow__minimap) { background: #1e1e2e !important; }
  :global(.svelte-flow__controls button) {
    background: #313244 !important;
    border-color: #45475a !important;
    color: #cdd6f4 !important;
  }
</style>
