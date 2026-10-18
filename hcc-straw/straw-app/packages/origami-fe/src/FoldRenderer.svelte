<script>
  // BSM-CODE: origami.node.polymorphic(): the recursive node. FieldFold re-enters this
  // component for json fields that declare nested `fields`.
  import FieldFold from './FieldFold.svelte';

  let { schema, record = $bindable({}), errors = {}, bridge = null, disabled = false } = $props();
</script>

<div class="fold-container">
  {#each schema.fields as field (field.name)}
    <FieldFold {field} bind:value={record[field.name]} error={errors[field.name] ?? ''} {bridge} {disabled} />
  {/each}
</div>
