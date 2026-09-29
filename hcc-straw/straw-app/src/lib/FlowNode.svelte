<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import { selectedNodeId, executionResult, nodeResultFor } from "./store";
  import { get } from "svelte/store";
  import { onMount } from "svelte";

  let { data, id }: { data: { kind: string; label: string; config: Record<string,string>; inputs: string[]; outputs: string[]; category: string }; id: string } = $props();

  const categoryColor: Record<string, string> = {
    "I/O":    "#89b4fa",
    "Text":   "#a6e3a1",
    "Logic":  "#fab387",
    "AI":     "#cba6f7",
    "Vector": "#89dceb",
  };

  const color = $derived(categoryColor[data.category] ?? "#6c7086");

  // Reactive bindings for store values
  let currentResult = $state(nodeResultFor(get(executionResult), id));
  let currentSelected = $state(get(selectedNodeId));

  onMount(() => {
    const u1 = executionResult.subscribe((r) => { currentResult = nodeResultFor(r, id); });
    const u2 = selectedNodeId.subscribe((s) => { currentSelected = s; });
    return () => { u1(); u2(); };
  });

  let hasError = $derived(!!currentResult?.error);
  let hasOutput = $derived(currentResult && !currentResult.error);
  let isSelected = $derived(currentSelected === id);

  function select() { selectedNodeId.set(id); }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="node"
  class:selected={isSelected}
  class:has-error={hasError}
  class:has-output={hasOutput}
  style="--accent: {color}"
  onclick={select}
>
  <div class="node-header" style="background: {color}20; border-bottom: 1px solid {color}40">
    <span class="category">{data.category}</span>
    <span class="node-label">{data.label}</span>
    {#if hasOutput}<span class="badge ok">✓</span>{/if}
    {#if hasError}<span class="badge err">!</span>{/if}
  </div>

  {#each data.inputs as input}
    <Handle type="target" position={Position.Left} id={input} style="background: {color}" />
  {/each}

  <div class="node-body">
    {#each Object.entries(data.config).slice(0, 2) as [k, v]}
      {#if v}
        <div class="config-preview">
          <span class="ck">{k}:</span>
          <span class="cv">{v.length > 24 ? v.slice(0,24)+"…" : v}</span>
        </div>
      {/if}
    {/each}
  </div>

  {#each data.outputs as output}
    <Handle type="source" position={Position.Right} id={output} style="background: {color}" />
  {/each}
</div>

<style>
  .node {
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 8px;
    min-width: 160px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .node:hover { border-color: var(--accent); }
  .node.selected { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent); }
  .node.has-error { border-color: #f38ba8; }
  .node.has-output { border-color: #a6e3a1; }
  .node-header {
    padding: 6px 10px;
    border-radius: 7px 7px 0 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .category { font-size: 9px; text-transform: uppercase; color: var(--accent); letter-spacing: 0.08em; }
  .node-label { font-size: 13px; font-weight: 600; color: #cdd6f4; flex: 1; }
  .badge {
    font-size: 10px; border-radius: 50%;
    width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .badge.ok { background: #a6e3a120; color: #a6e3a1; }
  .badge.err { background: #f38ba820; color: #f38ba8; }
  .node-body { padding: 6px 10px; }
  .config-preview { display: flex; gap: 4px; font-size: 11px; }
  .ck { color: #6c7086; }
  .cv { color: #cdd6f4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
