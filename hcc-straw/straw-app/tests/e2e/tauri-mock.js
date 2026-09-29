/**
 * Tauri IPC Mock
 *
 * Injected into every page via Playwright's addInitScript.
 * Intercepts all window.__TAURI_INTERNALS__ calls so the app
 * runs in a plain Chromium browser without a Tauri backend.
 *
 * Each command returns the minimal shape the frontend expects.
 */

// Flows store for stateful create/delete/load tests
const _flows = [];
let _flowCounter = 0;

const MOCK_SCHEMAS = [
  { kind: 'text_input',   label: 'Text Input',   description: 'Static text source', category: 'I/O',    inputs: [],       outputs: ['text'],   config_fields: [{ name: 'text', label: 'Text', field_type: 'textarea', default: 'Hello', required: false }] },
  { kind: 'write_file',   label: 'Write File',   description: 'Write text to file', category: 'I/O',    inputs: ['text'], outputs: ['path'],   config_fields: [{ name: 'path', label: 'Path', field_type: 'text',     default: 'output/out.txt', required: true }] },
  { kind: 'read_file',    label: 'Read File',    description: 'Read a file',        category: 'I/O',    inputs: [],       outputs: ['text'],   config_fields: [{ name: 'path', label: 'Path', field_type: 'text',     default: 'input.txt', required: true }] },
  { kind: 'transform',    label: 'Transform',    description: 'Transform text',     category: 'Text',   inputs: ['text'], outputs: ['text'],   config_fields: [{ name: 'operation', label: 'Operation', field_type: 'select', default: 'uppercase', options: ['uppercase','lowercase','trim','split_lines'], required: true }] },
  { kind: 'filter',       label: 'Filter',       description: 'Filter list',        category: 'Logic',  inputs: ['list'], outputs: ['passed','rejected'], config_fields: [{ name: 'condition', label: 'Condition', field_type: 'text', default: '', required: false }] },
  { kind: 'template',     label: 'Template',     description: 'String template',    category: 'Text',   inputs: ['vars'], outputs: ['text'],   config_fields: [{ name: 'template', label: 'Template', field_type: 'textarea', default: 'Hello {{name}}', required: true }] },
  { kind: 'http_request', label: 'HTTP Request', description: 'HTTP call',          category: 'I/O',    inputs: [],       outputs: ['body'],   config_fields: [{ name: 'url', label: 'URL', field_type: 'text', default: 'https://example.com', required: true }] },
  { kind: 'csv_parse',    label: 'CSV Parse',    description: 'Parse CSV',          category: 'Text',   inputs: ['csv'],  outputs: ['table'], config_fields: [{ name: 'delimiter', label: 'Delimiter', field_type: 'text', default: ',', required: false }] },
  { kind: 'join_text',    label: 'Join Text',    description: 'Join list',          category: 'Text',   inputs: ['list'], outputs: ['text'],  config_fields: [{ name: 'separator', label: 'Separator', field_type: 'text', default: '\\n', required: false }] },
  { kind: 'conditional',  label: 'Conditional',  description: 'If/else branch',     category: 'Logic',  inputs: ['condition'], outputs: ['true_branch','false_branch'], config_fields: [] },
  { kind: 'llm_prompt',   label: 'LLM Prompt',   description: 'Call local LLM',     category: 'AI',     inputs: ['prompt'], outputs: ['response'], config_fields: [{ name: 'model', label: 'Model', field_type: 'text', default: 'llama2', required: true }, { name: 'api_url', label: 'API URL', field_type: 'text', default: 'http://localhost:11434/api/generate', required: true }] },
];

window.__TAURI_MOCK__ = true;

// Intercept the invoke mechanism Tauri uses
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args) => {
    switch (cmd) {
      case 'get_node_schemas':
        return MOCK_SCHEMAS;

      case 'list_flows':
        return [..._flows];

      case 'save_flow': {
        const id = args.id || ('flow-' + (++_flowCounter));
        const now = new Date().toISOString();
        const existing = _flows.findIndex(f => f.id === id);
        const record = { id, name: args.name, definition: args.definition, created_at: now, updated_at: now };
        if (existing >= 0) _flows[existing] = record;
        else _flows.push(record);
        return id;
      }

      case 'load_flow': {
        const f = _flows.find(f => f.id === args.id);
        return f || null;
      }

      case 'delete_flow': {
        const idx = _flows.findIndex(f => f.id === args.id);
        if (idx >= 0) _flows.splice(idx, 1);
        return null;
      }

      case 'run_flow': {
        // Return a successful mock execution result
        let flow;
        try { flow = JSON.parse(args.flow_json); } catch { flow = { nodes: [], edges: [] }; }
        const results = (flow.nodes || []).map(n => ({
          node_id: n.id,
          outputs: { text: { type: 'Text', value: `[mock output of ${n.kind}]` } },
          error: null,
        }));
        return { results, order: (flow.nodes || []).map(n => n.id) };
      }

      case 'nlp_send':
        return {
          text: 'Mock AI response: I can help you build that! Here is a sample response from the mock LLM.',
          model: args.request?.model || 'llama2',
          elapsed_ms: 42,
        };

      case 'nlp_fetch_url':
        return `Mock content fetched from: ${args.url}`;

      case 'generate_code':
        return {
          project_name: 'mock-project',
          files: [
            { id: 'f1', path: 'src/main.rs', language: 'rust', content: 'fn main() {\n    println!("Hello, World!");\n}', is_new: true, is_dirty: false },
            { id: 'f2', path: 'Cargo.toml', language: 'toml', content: '[package]\nname = "mock-project"\nversion = "0.1.0"', is_new: true, is_dirty: false },
          ],
          plan: {
            title: 'Mock Project',
            description: args.request?.user_prompt || 'Mock project',
            project_type: 'cli-tool',
            language: 'rust',
            framework: null,
            file_list: ['src/main.rs', 'Cargo.toml'],
            steps: ['Generate main.rs', 'Generate Cargo.toml'],
          },
          elapsed_ms: 123,
          output_dir: 'C:\\mock\\output',
        };

      case 'refine_file':
        return {
          file_path: args.request?.file_path || 'src/main.rs',
          new_content: '// Refined by mock AI\nfn main() {\n    println!("Refined!");\n}',
          elapsed_ms: 88,
        };

      default:
        console.warn('[TAURI MOCK] Unknown command:', cmd, args);
        return null;
    }
  },
  convertFileSrc: (src) => src,
  transformCallback: (cb) => cb,
};
