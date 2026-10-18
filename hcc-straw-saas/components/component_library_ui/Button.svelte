<script>
  export let type = "primary";
  export let size = "md";
  export let disabled = false;
</script>

<button class="btn {type} {size}" {disabled} on:click>
  <slot />
</button>

<style>
  .btn { border: none; border-radius: 4px; cursor: pointer; transition: opacity 0.2s; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .primary { background: #007bff; color: white; }
  .secondary { background: #6c757d; color: white; }
  .danger { background: #dc3545; color: white; }
  .sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
  .md { padding: 0.5rem 1rem; font-size: 1rem; }
  .lg { padding: 0.75rem 1.5rem; font-size: 1.25rem; }
</style>
