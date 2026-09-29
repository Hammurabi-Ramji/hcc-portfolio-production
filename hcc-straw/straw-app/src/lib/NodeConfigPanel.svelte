<script lang="ts">
  import type { NodeSchema, SchemaField } from "./types";
  import { displayValue } from "./store";
  import type { NodeResult } from "./types";

  let { schema, config = {}, result, onclose, onupdate }: {
    schema: NodeSchema;
    config: Record<string, string>;
    result?: NodeResult;
    onclose: () => void;
    onupdate?: (config: Record<string, string>) => void;
  } = $props();

  function fieldValue(field: SchemaField): string {
    return config[field.name] ?? field.default ?? "";
  }

  function update(name: string, value: string) {
    const newConfig = { ...config, [name]: value };
    if (onupdate) onupdate(newConfig);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <span class="label">{schema.label}</span>
    <button class="close" onclick={onclose}>✕</button>
  </div>
  <p class="desc">{schema.description}</p>

  <div class="fields">
    {#each schema.config_fields as field}
      <label>
        <span>{field.label}{field.required ? " *" : ""}</span>
        {#if field.field_type === "select"}
          <select value={fieldValue(field)} onchange={(e) => update(field.name, (e.target as HTMLSelectElement).value)}>
            {#each field.options ?? [] as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {:else if field.field_type === "textarea"}
          <textarea
            rows="4"
            value={fieldValue(field)}
            oninput={(e) => update(field.name, (e.target as HTMLTextAreaElement).value)}
          ></textarea>
        {:else if field.field_type === "number"}
          <input
            type="number"
            value={fieldValue(field)}
            oninput={(e) => update(field.name, (e.target as HTMLInputElement).value)}
          />
        {:else if field.field_type === "bool"}
          <input
            type="checkbox"
            checked={fieldValue(field) === "true"}
            onchange={(e) => update(field.name, String((e.target as HTMLInputElement).checked))}
          />
        {:else}
          <input
            type="text"
            value={fieldValue(field)}
            oninput={(e) => update(field.name, (e.target as HTMLInputElement).value)}
          />
        {/if}
      </label>
    {/each}
  </div>

  {#if result}
    <div class="outputs">
      <strong>Last output</strong>
      {#if result.error}
        <div class="error">{result.error}</div>
      {:else}
        {#each Object.entries(result.outputs) as [key, val]}
          <div class="output-row">
            <span class="key">{key}</span>
            <span class="val">{displayValue(val)}</span>
          </div>
        {/each}
        {#if result.outputs && Object.keys(result.outputs).length === 0}
          <div class="empty-output">(no output)</div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .panel {
    background: #1e1e2e;
    border-left: 1px solid #313244;
    padding: 16px;
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    font-size: 13px;
    color: #cdd6f4;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .label { font-weight: 600; font-size: 14px; }
  .close {
    background: none; border: none; color: #6c7086;
    cursor: pointer; font-size: 16px; padding: 0;
  }
  .close:hover { color: #f38ba8; }
  .desc { color: #6c7086; font-size: 12px; margin: 0; }
  .fields { display: flex; flex-direction: column; gap: 10px; }
  label { display: flex; flex-direction: column; gap: 4px; }
  label span { color: #89b4fa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  input, select, textarea {
    background: #313244; border: 1px solid #45475a;
    border-radius: 6px; padding: 6px 8px;
    color: #cdd6f4; font-size: 13px; width: 100%;
    box-sizing: border-box;
  }
  input:focus, select:focus, textarea:focus {
    outline: none; border-color: #89b4fa;
  }
  textarea { resize: vertical; font-family: monospace; }
  .outputs {
    border-top: 1px solid #313244;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .outputs strong { font-size: 11px; color: #a6e3a1; text-transform: uppercase; }
  .output-row { display: flex; flex-direction: column; gap: 2px; }
  .key { font-size: 11px; color: #89dceb; }
  .val {
    font-family: monospace; font-size: 12px;
    background: #181825; padding: 4px 6px;
    border-radius: 4px; word-break: break-all;
    max-height: 80px; overflow-y: auto;
  }
  .error { color: #f38ba8; font-size: 12px; }
  .empty-output { color: #6c7086; font-size: 12px; font-style: italic; }
</style>
