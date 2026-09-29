<script>
  export let users = [];
  export let metrics = { revenue: 0, activeUsers: 0 };
  
  function handleAction(userId, action) {
    console.log(`Performing ${action} on user ${userId}`);
  }
</script>

<div class="admin-dashboard">
  <header>
    <h1>Admin Control Center</h1>
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total Revenue</h3>
        <p>${metrics.revenue.toLocaleString()}</p>
      </div>
      <div class="metric-card">
        <h3>Active Users</h3>
        <p>{metrics.activeUsers}</p>
      </div>
    </div>
  </header>

  <section class="user-management">
    <h2>User Management</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each users as user}
          <tr>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td><span class="status {user.status.toLowerCase()}">{user.status}</span></td>
            <td>
              <button on:click={() => handleAction(user.id, 'deactivate')}>Deactivate</button>
              <button on:click={() => handleAction(user.id, 'delete')}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</div>

<style>
  .admin-dashboard { padding: 2rem; background: #f4f7f6; }
  .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .metric-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
  .status.active { color: green; font-weight: bold; }
  .status.inactive { color: red; }
</style>
