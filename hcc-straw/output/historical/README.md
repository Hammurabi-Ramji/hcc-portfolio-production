# Historical output samples

Sovereign STRAW and Eduba are not built from this folder. Eduba is the append-only SQLite archival ledger in `straw-app/crates/eduba-ledger` and `straw-app/crates/eduba-server`. From `straw-app/`: `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, Python, Playwright, or Vite. `apps/web` is the quarantined legacy Next.js tree.

`demo-nlp-to-code-flow.json` is the May 2026 demo. The current engine rejects it: node ids are not UUIDs, edges use `source_handle` instead of `sourceHandle`, edges carry an unknown `id`, and the document root is not a graph.

The current graph fixture is `output/current-text-transform-graph.json`. It is a camelCase graph with UUID node ids, `sourceHandle`/`targetHandle`, and the `text_input` to `transform` ports. Attach it to a flow created by `flow_new`; the engine does not import this old demo format.
