<script>
  export let title = "The Future of SaaS";
  export let features = [
    { name: "Scalable", desc: "Built for growth from day one." },
    { name: "Secure", desc: "Enterprise-grade protection." },
    { name: "Modular", desc: "Choose only what you need." }
  ];
</script>

<div class="landing-page">
  <nav>
    <div class="logo">SaaSGen</div>
    <ul>
      <li>Features</li>
      <li>Pricing</li>
      <li>Contact</li>
    </ul>
  </nav>

  <hero>
    <h1>{title}</h1>
    <p>Empower your business with the most advanced modular SaaS framework.</p>
    <button class="cta">Get Started Free</button>
  </hero>

  <section class="features">
    {#each features as feature}
      <div class="feature-card">
        <h3>{feature.name}</h3>
        <p>{feature.desc}</p>
      </div>
    {/each}
  </section>

  <footer>
    <p>&copy; 2026 SaaSGen. All rights reserved.</p>
  </footer>
</div>

<style>
  .landing-page { font-family: sans-serif; }
  nav { display: flex; justify-content: space-between; padding: 1rem 5%; background: #fff; }
  hero { text-align: center; padding: 5rem 10%; background: #f0f4f8; }
  .cta { background: #0070f3; color: #fff; border: none; padding: 1rem 2rem; border-radius: 5px; font-size: 1.2rem; cursor: pointer; }
  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding: 5rem 10%; }
  .feature-card { padding: 2rem; border: 1px solid #eaeaea; border-radius: 10px; }
  footer { text-align: center; padding: 2rem; border-top: 1px solid #eaeaea; }
</style>
