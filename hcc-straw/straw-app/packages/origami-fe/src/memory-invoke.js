// In-RAM stand-in for the Accordion.BE command contract. For demos, component
// tests and offline development; nothing is persisted.

export function createMemoryInvoke(schemas, seed = {}) {
  const tables = new Map(Object.entries(seed).map(([name, rows]) => [name, rows.map(r => ({ ...r }))]));
  let nextId = 1000;

  function table(entity) {
    if (!schemas[entity]) throw new Error(`Unknown entity: ${entity}`);
    if (!tables.has(entity)) tables.set(entity, []);
    return tables.get(entity);
  }

  const handlers = {
    schema_entities: () => Object.values(schemas).map(s => ({ name: s.entity, label: s.label || s.entity })),
    schema_get: ({ entity }) => {
      if (!schemas[entity]) throw new Error(`Unknown entity: ${entity}`);
      return structuredClone(schemas[entity]);
    },
    entity_list: ({ entity }) => structuredClone(table(entity)),
    entity_read: ({ entity, id }) => {
      const row = table(entity).find(r => String(r.id) === String(id));
      if (!row) throw new Error(`${entity} ${id} not found`);
      return structuredClone(row);
    },
    entity_save: ({ entity, id, record }) => {
      const rows = table(entity);
      const clean = structuredClone(record);
      if (id === null || id === undefined) {
        const row = { ...clean, id: String(nextId++) };
        rows.push(row);
        return structuredClone(row);
      }
      const at = rows.findIndex(r => String(r.id) === String(id));
      if (at < 0) throw new Error(`${entity} ${id} not found`);
      rows[at] = { ...clean, id: rows[at].id };
      return structuredClone(rows[at]);
    },
    entity_delete: ({ entity, id }) => {
      const rows = table(entity);
      const at = rows.findIndex(r => String(r.id) === String(id));
      if (at < 0) throw new Error(`${entity} ${id} not found`);
      rows.splice(at, 1);
    }
  };

  return async function invoke(command, args = {}) {
    const handler = handlers[command];
    if (!handler) throw new Error(`Unknown command: ${command}`);
    return handler(args);
  };
}
