<script>let { value } = $props();</script>
{#if value}<div role="status" class:error={value.error}>{value.message}</div>{/if}
<style>
  div { position:fixed; right:24px; bottom:95px; max-width:520px; padding:16px; border:1px solid #83ad9b; border-radius:6px; background:#1c322a; z-index:20; }
  .error { background:#382428; border-color:#ca8e95; }
</style>

