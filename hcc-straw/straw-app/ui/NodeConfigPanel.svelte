<script>
  let { schema, node, onupdate, ondelete } = $props();
</script>
<section class="config">
  <h3>{schema.label}</h3><p class="muted">{schema.description}</p>
  {#each schema.configFields as field (field.name)}
    <label>{field.label}
      {#if field.fieldType === 'select'}
        <select value={node.config[field.name] ?? field.default ?? ''} onchange={e => onupdate(field.name,e.currentTarget.value)}>
          {#each field.options ?? [] as option}<option value={option}>{option}</option>{/each}
        </select>
      {:else if field.fieldType === 'textarea'}
        <textarea rows="4" value={node.config[field.name] ?? field.default ?? ''} oninput={e => onupdate(field.name,e.currentTarget.value)}></textarea>
      {:else}
        <input type="text" value={node.config[field.name] ?? field.default ?? ''} oninput={e => onupdate(field.name,e.currentTarget.value)}>
      {/if}
    </label>
  {/each}
  <button onclick={ondelete}>Delete node</button>
</section>
<style>.config { display:flex; flex-direction:column; gap:15px; padding:18px; width:280px; flex-shrink:0; border-left:1px solid #37414e; overflow:auto; }</style>

