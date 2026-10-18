// BSM-CODE: origami.ask.shape() support. Pure schema logic, no DOM, no storage.
// The backend (Accordion.BE) sends snake_case; this module normalizes to camelCase
// and refuses anything it cannot render safely rather than guessing.

export const FIELD_TYPES = Object.freeze([
  'string', 'text', 'integer', 'boolean', 'datetime', 'enum', 'file', 'coordinates', 'relation', 'json'
]);

export const ENTITY_NAME = /^[a-z][a-z0-9_-]{0,63}$/i;
const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

export function humanize(name) {
  return String(name).replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function assertEntityName(name) {
  if (typeof name !== 'string' || !ENTITY_NAME.test(name)) throw new Error(`Invalid entity name: ${String(name).slice(0, 40)}`);
  return name;
}

export function normalizeField(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !FIELD_NAME.test(raw.name)) {
    throw new Error('Schema field has an invalid name');
  }
  const type = FIELD_TYPES.includes(raw.type) ? raw.type : 'unknown';
  const field = {
    name: raw.name,
    type,
    label: typeof raw.label === 'string' && raw.label ? raw.label : humanize(raw.name),
    required: raw.required === true,
    searchable: raw.searchable === true,
    readonly: raw.auto === true || raw.readonly === true,
    default: raw.default,
    min: typeof raw.min === 'number' ? raw.min : undefined,
    max: typeof raw.max === 'number' ? raw.max : undefined,
    values: Array.isArray(raw.values) ? raw.values.map(String) : [],
    to: typeof raw.to === 'string' ? raw.to : '',
    displayField: typeof raw.display_field === 'string' && raw.display_field ? raw.display_field : 'name',
    fields: Array.isArray(raw.fields) ? raw.fields.map(normalizeField) : null
  };
  if (type === 'enum' && field.values.length === 0) throw new Error(`Enum field '${field.name}' declares no values`);
  if (type === 'relation') assertEntityName(field.to);
  if (field.fields) {
    const seen = new Set();
    for (const f of field.fields) {
      if (seen.has(f.name)) throw new Error(`Duplicate nested field '${f.name}'`);
      seen.add(f.name);
    }
  }
  return field;
}

export function normalizeSchema(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.fields)) throw new Error('Invalid entity schema');
  const entity = assertEntityName(raw.entity);
  const fields = raw.fields.map(normalizeField);
  const seen = new Set();
  for (const f of fields) {
    if (seen.has(f.name)) throw new Error(`Duplicate field '${f.name}' in ${entity}`);
    seen.add(f.name);
  }
  return {
    entity,
    label: typeof raw.label === 'string' && raw.label ? raw.label : humanize(entity),
    fields,
    relations: Array.isArray(raw.relations) ? raw.relations : [],
    permissions: raw.permissions && typeof raw.permissions === 'object' ? raw.permissions : null,
    audit: raw.audit === true,
    softDelete: raw.soft_delete === true
  };
}

function defaultFor(field) {
  if (field.default !== undefined) return structuredClone(field.default);
  switch (field.type) {
    case 'string': case 'text': case 'datetime': return '';
    case 'boolean': return false;
    case 'enum': return field.values[0];
    case 'json': return field.fields ? defaultRecord(field.fields) : null;
    default: return null;
  }
}

export function defaultRecord(fields) {
  const record = {};
  for (const field of fields) record[field.name] = defaultFor(field);
  return record;
}

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

/** Returns {fieldName: message}; an empty object means the record is valid. */
export function validateRecord(fields, record) {
  const errors = {};
  for (const field of fields) {
    if (field.readonly) continue;
    const value = record?.[field.name];
    if (field.type === 'json' && field.fields && value && typeof value === 'object') {
      const nested = validateRecord(field.fields, value);
      if (Object.keys(nested).length) errors[field.name] = 'Fix the highlighted nested fields';
      continue;
    }
    if (isBlank(value) && !(field.type === 'boolean')) {
      if (field.required) errors[field.name] = `${field.label} is required`;
      continue;
    }
    if (field.type === 'integer') {
      if (!Number.isInteger(value)) errors[field.name] = `${field.label} must be a whole number`;
      else if (field.min !== undefined && value < field.min) errors[field.name] = `${field.label} must be at least ${field.min}`;
      else if (field.max !== undefined && value > field.max) errors[field.name] = `${field.label} must be at most ${field.max}`;
    } else if (field.type === 'enum' && !field.values.includes(String(value))) {
      errors[field.name] = `${field.label} must be one of: ${field.values.join(', ')}`;
    } else if (field.type === 'coordinates') {
      const ok = value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
        && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;
      if (!ok) errors[field.name] = `${field.label} needs a latitude (-90..90) and longitude (-180..180)`;
    }
  }
  return errors;
}

/** Columns shown in list views: scalar fields first, capped, never json/file blobs. */
export function listColumns(schema, max = 6) {
  return schema.fields.filter(f => !['json', 'file', 'unknown', 'text'].includes(f.type)).slice(0, max);
}
