/**
 * Tauri IPC Mock — injected via addInitScript before every page load.
 * Intercepts __TAURI_INTERNALS__.invoke so the frontend works
 * without a real Tauri backend.
 */
const _flows = [];
let _flowCounter = 0;

const MOCK_SCHEMAS = [
  { kind: 'text_input',   label: 'Text Input',   description: 'Static text', category: 'I/O',   inputs: [],        outputs: ['text'],              config_fields: [{ name: 'text', label: 'Text', field_type: 'textarea', default: 'Hello', required: false }] },
  { kind: 'write_file',   label: 'Write File',   description: 'Write file',  category: 'I/O',   inputs: ['text'],  outputs: ['path'],              config_fields: [{ name: 'path', label: 'Path', field_type: 'text', default: 'output/out.txt', required: true }] },
  { kind: 'read_file',    label: 'Read File',    description: 'Read file',   category: 'I/O',   inputs: [],        outputs: ['text'],              config_fields: [{ name: 'path', label: 'Path', field_type: 'text', default: 'input.txt', required: true }] },
  { kind: 'transform',    label: 'Transform',    description: 'Transform',   category: 'Text',  inputs: ['text'],  outputs: ['text'],              config_fields: [{ name: 'operation', label: 'Op', field_type: 'select', default: 'uppercase', options: ['uppercase','lowercase','trim','split_lines'], required: true }] },
  { kind: 'filter',       label: 'Filter',       description: 'Filter',      category: 'Logic', inputs: ['list'],  outputs: ['passed','rejected'], config_fields: [{ name: 'condition', label: 'Condition', field_type: 'text', default: '', required: false }] },
  { kind: 'template',     label: 'Template',     description: 'Template',    category: 'Text',  inputs: ['vars'],  outputs: ['text'],              config_fields: [{ name: 'template', label: 'Template', field_type: 'textarea', default: 'Hello {{name}}', required: true }] },
  { kind: 'http_request', label: 'HTTP Request', description: 'HTTP',        category: 'I/O',   inputs: [],        outputs: ['body'],              config_fields: [{ name: 'url', label: 'URL', field_type: 'text', default: 'https://example.com', required: true }] },
  { kind: 'csv_parse',    label: 'CSV Parse',    description: 'CSV',         category: 'Text',  inputs: ['csv'],   outputs: ['table'],             config_fields: [{ name: 'delimiter', label: 'Delimiter', field_type: 'text', default: ',', required: false }] },
  { kind: 'join_text',    label: 'Join Text',    description: 'Join',        category: 'Text',  inputs: ['list'],  outputs: ['text'],              config_fields: [{ name: 'separator', label: 'Sep', field_type: 'text', default: '\\n', required: false }] },
  { kind: 'conditional',  label: 'Conditional',  description: 'If/else',     category: 'Logic', inputs: ['condition'], outputs: ['true_branch','false_branch'], config_fields: [] },
  { kind: 'llm_prompt',   label: 'LLM Prompt',   description: 'AI call',     category: 'AI',    inputs: ['prompt'], outputs: ['response'],         config_fields: [{ name: 'model', label: 'Model', field_type: 'text', default: 'llama2', required: true }] },
];

window.__TAURI_MOCK__ = true;

window.__TAURI_INTERNALS__ = {
  invoke: async function(cmd, args) {
    switch (cmd) {
      case 'get_node_schemas':
        return MOCK_SCHEMAS;
      case 'list_flows':
        return _flows.slice();
      case 'save_flow': {
        const id = (args && args.id) || ('flow-' + (++_flowCounter));
        const now = new Date().toISOString();
        const i = _flows.findIndex(function(f) { return f.id === id; });
        const rec = { id: id, name: (args && args.name) || 'Untitled', definition: (args && args.definition) || '{}', created_at: now, updated_at: now };
        if (i >= 0) _flows[i] = rec; else _flows.push(rec);
        return id;
      }
      case 'load_flow': {
        return _flows.find(function(f) { return f.id === (args && args.id); }) || null;
      }
      case 'delete_flow': {
        const idx = _flows.findIndex(function(f) { return f.id === (args && args.id); });
        if (idx >= 0) _flows.splice(idx, 1);
        return null;
      }
      case 'run_flow': {
        var flow; try { flow = JSON.parse((args && args.flow_json) || '{}'); } catch(e) { flow = {nodes:[],edges:[]}; }
        var results = (flow.nodes || []).map(function(n) { return { node_id: n.id, outputs: { text: { type: 'Text', value: '[mock:' + n.kind + ']' } }, error: null }; });
        return { results: results, order: (flow.nodes || []).map(function(n) { return n.id; }) };
      }
      case 'nlp_send':
        return { text: 'Mock AI response: I can help you build that!', model: (args && args.request && args.request.model) || 'llama2', elapsed_ms: 42 };
      case 'nlp_fetch_url':
        return 'Mock content fetched from: ' + ((args && args.url) || '');
      case 'generate_code':
        return {
          project_name: 'mock-project',
          files: [
            { id: 'f1', path: 'src/main.rs', language: 'rust', content: 'fn main() {\n    println!("Hello, World!");\n}', is_new: true, is_dirty: false },
            { id: 'f2', path: 'Cargo.toml',  language: 'toml', content: '[package]\nname = "mock-project"', is_new: true, is_dirty: false },
          ],
          plan: { title: 'Mock Project', description: 'mock', project_type: 'cli-tool', language: 'rust', framework: null, file_list: ['src/main.rs','Cargo.toml'], steps: ['done'] },
          elapsed_ms: 123,
          output_dir: 'C:\\mock\\output',
        };
      case 'refine_file':
        return { file_path: (args && args.request && args.request.file_path) || 'src/main.rs', new_content: '// Refined\nfn main() { println!("Refined!"); }', elapsed_ms: 88 };
      default:
        console.warn('[TAURI MOCK] unknown command:', cmd);
        return null;
    }
  },
  convertFileSrc: function(s) { return s; },
  transformCallback: function(cb) { return cb; },
};
