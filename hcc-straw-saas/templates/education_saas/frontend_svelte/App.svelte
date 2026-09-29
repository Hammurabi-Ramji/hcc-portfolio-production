<script>
  export let saasName = "My Modular SaaS";
  export let components = [];
</script>

<main>
  <h1>{saasName}</h1>
  <p>Welcome to your customized industry solution.</p>
  
  <section class="dashboard">
    <h2>Active Modules</h2>
    <ul>
      {#each components as component}
        <li>{component.replace('_', ' ').toUpperCase()} - <span class="status">ONLINE</span></li>
      {/each}
    </ul>
  </section>
</main>

<style>
  main { text-align: center; padding: 2rem; }
  .status { color: green; font-weight: bold; }
</style>
