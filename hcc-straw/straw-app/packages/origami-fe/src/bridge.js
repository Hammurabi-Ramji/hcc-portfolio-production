// BSM-CODE: origami.ask.shape(), origami.bridge.cache(), origami.bridge.invalidate()
// The only door between Origami.FE and the Rust backend. `invoke(command, args)` is
// injected by the host app (the taurpc/Tauri `invokeCommand`), so the package has no
// transport dependency. Caches live in RAM only (origami.trace.zero()).
//
// Backend command contract (Accordion.BE side):
//   schema_entities()                       -> [{name, label}]
//   schema_get({entity})                    -> raw entity schema (see schema.js)
//   entity_list({entity})                   -> [{id, ...fields}]
//   entity_read({entity, id})               -> {id, ...fields}
//   entity_save({entity, id|null, record})  -> saved {id, ...fields}
//   entity_delete({entity, id})             -> void

import { assertEntityName, normalizeSchema } from './schema.js';

export function createBridge(invoke, { ttlMs = 30_000, now = () => Date.now() } = {}) {
  if (typeof invoke !== 'function') throw new Error('createBridge needs an invoke function');
  const cache = new Map();

  async function cached(key, load) {
    const hit = cache.get(key);
    if (hit && now() - hit.at < ttlMs) return hit.value;
    const value = await load();
    cache.set(key, { value, at: now() });
    return value;
  }

  return {
    entities: () => cached('entities', async () => {
      const rows = await invoke('schema_entities');
      if (!Array.isArray(rows)) throw new Error('schema_entities returned a non-list');
      return rows.map(r => ({ name: assertEntityName(r.name), label: r.label || r.name }));
    }),
    schema: entity => cached(`schema:${assertEntityName(entity)}`, async () =>
      normalizeSchema(await invoke('schema_get', { entity }))),
    list: entity => invoke('entity_list', { entity: assertEntityName(entity) }),
    read: (entity, id) => invoke('entity_read', { entity: assertEntityName(entity), id }),
    save: (entity, id, record) => invoke('entity_save', { entity: assertEntityName(entity), id: id ?? null, record }),
    remove: (entity, id) => invoke('entity_delete', { entity: assertEntityName(entity), id }),
    /** Call after the backend reports a schema change so the next navigation re-folds. */
    invalidate: () => cache.clear()
  };
}
