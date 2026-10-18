<script>
  // BSM-CODE: origami.fold.assemble(): schema field type -> input component.
  import { untrack } from 'svelte';
  import RelationFold from './RelationFold.svelte';
  import FoldRenderer from './FoldRenderer.svelte';
  import { defaultRecord } from './schema.js';

  let { field, value = $bindable(), error = '', bridge = null, disabled = false } = $props();

  const uid = `fold-${Math.random().toString(36).slice(2, 10)}`;
  const locked = $derived(disabled || field.readonly);
  const nested = $derived(field.type === 'json' && field.fields);
  let jsonText = $state(untrack(() => JSON.stringify(value ?? null, null, 2)));
  let jsonError = $state('');

  $effect(() => {
    if (nested && (value === null || value === undefined || typeof value !== 'object')) {
      value = defaultRecord(field.fields);
    }
  });

  function editJson(event) {
    jsonText = event.currentTarget.value;
    try {
      value = jsonText.trim() === '' ? null : JSON.parse(jsonText);
      jsonError = '';
    } catch (e) {
      jsonError = 'Not valid JSON yet';
    }
    event.currentTarget.setCustomValidity(jsonError);
  }

  function toLocalDate(raw) {
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function pickFile(event) {
    const file = event.currentTarget.files?.[0];
    value = file ? { name: file.name, size: file.size, type: file.type } : null;
  }

  function setCoordinate(axis, raw) {
    const next = { lat: value?.lat ?? null, lng: value?.lng ?? null };
    next[axis] = raw === '' ? null : Number(raw);
    value = next;
  }
</script>

<div class="fold-field" class:invalid={error || jsonError}>
  {#if field.type === 'boolean'}
    <label class="inline"><input id={uid} type="checkbox" bind:checked={value} disabled={locked}> {field.label}</label>
  {:else}
    <label for={uid}>{field.label}{#if field.required}<span class="req" aria-hidden="true"> *</span>{/if}</label>

    {#if field.type === 'string'}
      <input id={uid} type="text" bind:value required={field.required} disabled={locked}>
    {:else if field.type === 'text'}
      <textarea id={uid} rows="4" bind:value disabled={locked}></textarea>
      <small class="muted">{(value ?? '').length} characters</small>
    {:else if field.type === 'integer'}
      <input id={uid} type="number" step="1" min={field.min} max={field.max} bind:value required={field.required} disabled={locked}>
    {:else if field.type === 'datetime'}
      <input id={uid} type="datetime-local" value={toLocalDate(value)} onchange={e => value = e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : ''} required={field.required} disabled={locked}>
    {:else if field.type === 'enum'}
      <select id={uid} bind:value disabled={locked}>
        {#if !field.required}<option value="">(none)</option>{/if}
        {#each field.values as option (option)}<option value={option}>{option}</option>{/each}
      </select>
    {:else if field.type === 'file'}
      <input id={uid} type="file" onchange={pickFile} disabled={locked}>
      {#if value?.name}<small class="muted">{value.name} ({value.size} bytes)</small>{/if}
    {:else if field.type === 'coordinates'}
      <div class="row">
        <input id={uid} type="number" step="any" min="-90" max="90" placeholder="Latitude" aria-label="{field.label} latitude" value={value?.lat ?? ''} oninput={e => setCoordinate('lat', e.currentTarget.value)} disabled={locked}>
        <input type="number" step="any" min="-180" max="180" placeholder="Longitude" aria-label="{field.label} longitude" value={value?.lng ?? ''} oninput={e => setCoordinate('lng', e.currentTarget.value)} disabled={locked}>
      </div>
    {:else if field.type === 'relation'}
      <RelationFold {field} {uid} bind:value {bridge} disabled={locked} />
    {:else if nested}
      <fieldset class="nested">
        {#if value && typeof value === 'object'}
          <FoldRenderer schema={{ entity: field.name, fields: field.fields }} bind:record={value} {bridge} disabled={locked} />
        {/if}
      </fieldset>
    {:else if field.type === 'json'}
      <textarea id={uid} rows="5" spellcheck="false" value={jsonText} oninput={editJson} disabled={locked}></textarea>
    {:else}
      <pre class="muted" id={uid}>{JSON.stringify(value ?? null, null, 2)}</pre>
      <small class="muted">Unsupported field type shown read-only.</small>
    {/if}
  {/if}

  {#if error || jsonError}<small class="err" role="alert">{error || jsonError}</small>{/if}
</div>

<style>
  .fold-field { display: grid; gap: 4px; margin-bottom: 12px; }
  .fold-field.invalid input, .fold-field.invalid textarea, .fold-field.invalid select { border-color: #c0392b; }
  label.inline { display: flex; align-items: center; gap: 8px; }
  .row { display: flex; gap: 8px; }
  .row input { flex: 1; }
  .req { color: #c0392b; }
  .err { color: #c0392b; }
  .muted { opacity: 0.7; }
  textarea { width: 100%; font-family: inherit; }
  fieldset.nested { border: 1px solid rgba(128, 128, 128, 0.4); padding: 8px 12px; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }
</style>
