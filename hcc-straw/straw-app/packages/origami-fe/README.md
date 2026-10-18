# origami-fe

Schema-driven Svelte 5 (runes) components shared by the STRAW fleet. One canvas asks the backend what shape lives at a path, then folds it into a list or a form. No hand-written per-entity UI.

**No package manager.** `straw-app` forbids Node/npm/pnpm (see the root README), so this is a source-only directory with no `package.json`. `tools/frontend-build` compiles `src/*.svelte` with the native Rust compiler and copies `src/*.js`; output is served at `/public/ui/origami-fe/`.

## Use from an app

```svelte
<script>
  import OrigamiCanvas from './origami-fe/OrigamiCanvas.svelte';
  import { createBridge } from './origami-fe/bridge.js';
  import { invokeCommand } from './commands.js';

  const bridge = createBridge(invokeCommand);
  let path = $state('tasks');
</script>
<OrigamiCanvas {bridge} {path} onnavigate={p => (path = p)} />
```

(`./origami-fe/...` resolves in the built output, not in `ui/`. The `.svelte` suffix is rewritten to `.js` at build time.) The host owns routing; paths are `entity`, `entity/<id>` and `entity/new`.

## Files

| File | BSM-CODE | Role |
|---|---|---|
| `OrigamiCanvas.svelte` | `origami.canvas.blank()` | Universal surface: path in, schema fetched, view folded |
| `FoldRenderer.svelte` | `origami.node.polymorphic()` | Recursive record form over a field list |
| `FieldFold.svelte` | `origami.fold.assemble()` | Field type to input; re-enters `FoldRenderer` for nested `json` |
| `RelationFold.svelte` | `origami.fold.relation()` | Select backed by the related entity's rows |
| `ListFold.svelte` | `origami.fold.list()` | Collection table |
| `EntityFold.svelte` | `origami.fold.detail()` | Load, validate, save, delete one record |
| `NavFold.svelte` | `origami.nav.assemble()` | Navigation from the entity list |
| `schema.js` | | Normalize and validate schemas and records (pure) |
| `bridge.js` | `origami.ask.shape()`, `origami.bridge.cache()` | The only transport door; RAM cache with TTL |
| `memory-invoke.js` | | In-RAM backend stand-in for demos and tests |

## Backend command contract

The host's `invoke(command, args)` must serve (Accordion.BE side, not yet implemented in Rust):

```
schema_entities()                      -> [{name, label}]
schema_get({entity})                   -> {entity, label, fields:[...], permissions, audit, soft_delete}
entity_list({entity})                  -> [{id, ...}]
entity_read({entity, id})              -> {id, ...}
entity_save({entity, id|null, record}) -> {id, ...}
entity_delete({entity, id})            -> void
```

Field types: `string text integer boolean datetime enum file coordinates relation json`. Unrecognized types render read-only rather than being guessed. Field names and entity names are validated before use. `file` fields carry metadata only (name, size, type); the bytes are the host's job.

## Guarantees checked by `cargo test -p frontend-build`

- Every component compiles in runes mode and parses as an ES module.
- Every relative import resolves inside the package; every bare import is in the app import map.
- No `localStorage`, `sessionStorage`, `indexedDB`, cookies or Cache API (`origami.trace.zero()`).

## Not done yet

- Mounting in `ui/App.svelte` (a route is a one-line addition once a backend serves the contract).
- The Rust side: schema endpoints generated from `.autarch.yaml`, specta types for the schema shape.
- WASM schema parser; the JS normalizer here is the interim.
- Native-validation note: browsers block submit on `required`/`min`/`max` before `validateRecord` runs; the validator still guards programmatic saves.
