<script>
  export let tickets = [];
  
  function resolveTicket(id) {
    console.log(`Resolving ticket ${id}`);
  }
</script>

<div class="support-portal">
  <h2>Internal Support Portal</h2>
  <div class="ticket-list">
    {#each tickets as ticket}
      <div class="ticket-card {ticket.priority.toLowerCase()}">
        <div class="header">
          <span class="id">#{ticket.id}</span>
          <span class="priority">{ticket.priority}</span>
        </div>
        <p class="subject">{ticket.subject}</p>
        <p class="user">From: {ticket.userEmail}</p>
        <button on:click={() => resolveTicket(ticket.id)}>Mark as Resolved</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .support-portal { padding: 2rem; }
  .ticket-list { display: flex; flexDirection: column; gap: 1rem; }
  .ticket-card { padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; }
  .high { border-left: 5px solid red; }
  .medium { border-left: 5px solid orange; }
  .low { border-left: 5px solid green; }
  .header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-weight: bold; }
</style>
