> **Historical record (May 2026).** Not the sovereign STRAW or Eduba path. Eduba is the append-only SQLite archival ledger in `straw-app/crates/eduba-ledger` and `straw-app/crates/eduba-server`. Build and run the sovereign desktop from `straw-app/` with `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. `apps/web` is the quarantined legacy Next.js tree. Current instructions: `straw-app/README.md`.

# NLP-AI-Code-Generation Engines - Implementation Guide

## Overview

This document describes the complete code generation and execution engines that power the NLP-AI-Code-Creation skill. These engines enable the automated pipeline from natural language requirements to executable workflows.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   NLP Engine    │────▶│ Code Generation  │────▶│ Flow Executor   │
│  (Multimodal)   │     │     (CodeGen)    │     │   (FlowCanvas)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Chat + Attachments     Generate Code Files      Visual Workflows
   URL Fetching           Intent Planning         Node Execution
   Document Parsing       File Creation           Pipeline Automation
```

## Engine Components

### 1. NLP Engine (`src/nlp.rs`)

**Purpose:** Handle multimodal AI conversations with documents, images, URLs, and audio.

**Key Functions:**

```rust
pub fn send_nlp(request: &NlpRequest) -> Result<NlpResponse, String>
pub fn fetch_url_content(url: &str) -> Result<String, String>
```

**Features:**
- ✅ Multi-turn conversation context
- ✅ Attachment processing (documents, images, URLs, audio)
- ✅ URL content fetching with HTML stripping
- ✅ Base64 image data handling
- ✅ Streaming support (configurable)
- ✅ Configurable model parameters (temperature, model)

**Usage:**
```typescript
// Frontend call via Tauri
const response = await commands.nlpSend({
  messages: [/* conversation history */],
  model: "llama2",
  system_prompt: "You are an expert developer...",
  api_url: "http://localhost:11434/api/generate",
  temperature: 0.7,
});
```

### 2. Code Generation Engine (`src/codegen.rs`)

**Purpose:** Convert natural language requirements into production-ready code files.

**Key Functions:**

```rust
pub fn generate_code(request: &CreationRequest) -> Result<CreationResult, String>
pub fn refine_file(request: &RefinementRequest) -> Result<RefinementResult, String>
```

**Features:**
- ✅ Intent extraction from natural language
- ✅ Multi-file project generation
- ✅ Existing file context for refinement
- ✅ Automatic language detection from file extensions
- ✅ Code block parsing from LLM responses
- ✅ File system writing with directory creation
- ✅ Progress tracking and error handling

**Workflow:**

1. **Build Prompt** - Combine user request with existing files and system prompt
2. **Call LLM** - Send to Ollama/API with configuration
3. **Parse Response** - Extract code blocks and file structures
4. **Write Files** - Create files in output directory
5. **Return Result** - Provide file list and metadata

**Example Request:**
```typescript
const result = await commands.generateCode({
  user_prompt: "Create a Svelte 5 authentication component",
  model: "llama2",
  api_url: "http://localhost:11434/api/generate",
  temperature: 0.7,
  system_prompt: "You are an expert Svelte developer...",
  output_dir: "C:\\hcc-straw\\output",
  existing_files: [/* optional refinement context */],
});
```

**Example Response:**
```typescript
{
  project_name: "auth-component",
  files: [
    {
      path: "src/lib/AuthProvider.svelte",
      language: "svelte",
      content: "<!-- full component code -->",
      is_new: true,
    },
    // ... more files
  ],
  plan: {
    title: "Authentication Provider",
    description: "Create a Svelte 5 authentication component",
    project_type: "component",
    language: "svelte",
    file_list: ["src/lib/AuthProvider.svelte"],
    steps: ["Component generation complete"],
  },
  elapsed_ms: 2847,
  output_dir: "C:\\hcc-straw\\output",
}
```

### 3. Flow Execution Engine (`src/dag.rs`)

**Purpose:** Execute visual workflow definitions (DAG-based) with node-based processing.

**Key Components:**

```rust
pub struct Flow {
  nodes: Vec<FlowNode>,
  edges: Vec<FlowEdge>,
}

pub fn run_flow(flow: &Flow) -> ExecutionResult
```

**Features:**
- ✅ Directed Acyclic Graph (DAG) execution
- ✅ Topological sorting for execution order
- ✅ 11 built-in node types
- ✅ Custom node registration
- ✅ Node configuration via UI
- ✅ Data flow between nodes
- ✅ Error handling and logging

**Node Types:**

| Category | Nodes | Purpose |
|----------|-------|---------|
| **I/O** | `read_file`, `write_file`, `text_input`, `http_request` | File and network operations |
| **Text** | `transform`, `template`, `csv_parse`, `join_text` | Text processing |
| **Logic** | `filter`, `conditional` | Branching and filtering |
| **AI** | `llm_prompt` | Local AI integration |

**Execution Flow:**

```rust
// 1. Parse flow JSON
let flow: Flow = serde_json::from_str(flow_json)?;

// 2. Topological sort nodes
let order = dag::topological_sort(&flow)?;

// 3. Execute each node in order
let mut results: HashMap<String, NodeValue> = HashMap::new();
for node_id in order {
  let node = &flow.nodes.iter().find(|n| n.id == node_id).unwrap();
  let output = nodes::execute(node, &results)?;
  results.insert(node_id, output);
}

// 4. Return execution result
ExecutionResult {
  results,
  order,
}
```

## Integration Points

### Frontend Integration (`src/lib/tauri.ts`)

```typescript
export const commands = {
  // NLP
  nlpSend: (request: NlpRequest) => invoke<NlpResponse>("nlp_send", { request }),
  nlpFetchUrl: (url: string) => invoke<string>("nlp_fetch_url", { url }),
  
  // Code Generation
  generateCode: (request: CreationRequest) => 
    invoke<CreationResult>("generate_code", { request }),
  refineFile: (request: RefinementRequest) => 
    invoke<RefinementResult>("refine_file", { request }),
  
  // Flow Execution
  runFlow: (flowJson: string, flowId: string | null) => 
    invoke<ExecutionResult>("run_flow", { flowJson, flowId }),
};
```

### State Management (`src/lib/store.ts`)

```typescript
// NLP State
export const nlpMessages = writable<NlpMessage[]>([]);
export const nlpAttachments = writable<NlpAttachment[]>([]);

// Code Generation State
export const codeGenStage = writable<GenStage>("idle");
export const codeGenFiles = writable<CodeFile[]>([]);
export const codeGenPlan = writable<IntentPlan | null>(null);

// Flow State
export const schemas = writable<NodeSchema[]>([]);
export const executionResult = writable<ExecutionResult | null>(null);
```

## Configuration

### Ollama Setup

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama2        # General purpose
ollama pull codellama     # Code generation
ollama pull starcoder     # Code completion

# Start server
ollama serve
```

### App Configuration

**Default Settings:**
- **Output Directory:** `C:\hcc-straw\output`
- **API URL:** `http://localhost:11434/api/generate`
- **Default Model:** `llama2`
- **Temperature:** `0.7`
- **Timeout:** 180 seconds for code generation, 120s for NLP

**Customizable via UI:**
- Model selection (llama2, codellama, starcoder)
- API endpoint
- Temperature (0-2)
- System prompts

## Performance Characteristics

| Operation | Avg. Time | Dependencies |
|-----------|-----------|--------------|
| NLP Chat Response | 2-5s | Ollama running |
| Code Generation | 10-30s | Depends on file count |
| Flow Execution | <1s | Node complexity |
| File I/O | <100ms | Disk speed |

**Optimization Strategies:**
- ✅ Async HTTP requests (reqwest with tokio)
- ✅ Connection pooling
- ✅ Timeout configuration
- ✅ Error recovery with retries
- ✅ Stream processing for large files

## Security Considerations

### Input Validation
- ✅ Validate all user input before processing
- ✅ Sanitize file paths to prevent directory traversal
- ✅ Rate limit API calls
- ✅ Validate JSON structure before parsing

### File System Access
- ✅ Output directory restricted to configured path
- ✅ File permissions checked before write
- ✅ Absolute paths used to prevent confusion
- ✅ Parent directories created safely

### API Security
- ✅ Localhost-only by default (configurable)
- ✅ Timeout protection
- ✅ User-Agent identification
- ✅ Error message sanitization

## Testing Guide

### Unit Tests

```bash
cd straw-app/src-tauri
cargo test
```

### Integration Tests

1. **Ledger and workspace tests** from `straw-app/`: `cargo test --workspace --offline --locked`. There is no Node script path.

### Manual Testing

1. **Build the desktop** from `straw-app/` with `trunk build` and `cargo tauri build`.

2. **Test NLP Chat:**
   - Open "AI Chat" panel
   - Send message with attachment
   - Verify response

3. **Test Code Generation:**
   - Open "AI Code Generator" panel
   - Enter prompt: "Create a Rust CLI tool"
   - Verify generated files in output directory

4. **Test Flow Execution:**
   - Open "Flow Canvas"
   - Create simple flow: `text_input` → `write_file`
   - Run and verify output

## Troubleshooting

### Common Issues

**1. "Ollama not running"**
```
Error: Failed to call LLM API
```
**Solution:**
```bash
ollama serve
```

**2. "LLM API returned error 500"**
- Check if model is installed: `ollama list`
- Pull model if needed: `ollama pull llama2`
- Verify API URL: `http://localhost:11434/api/generate`

**3. "Failed to write file"**
- Check output directory permissions
- Verify path is within allowed directories
- Ensure parent directories exist

**4. "Flow execution failed"**
- Verify all nodes have required inputs connected
- Check node configuration values
- Review execution logs in console

## Future Enhancements

### Planned Features

1. **WASM Node Integration**
   - Add WASM compute nodes for hash, regex, encryption
   - Compile WASM modules for performance

2. **Flow Version Control**
   - Save flow history
   - Compare flow versions
   - Rollback to previous versions

3. **Cloud Sync**
   - Sync flows to cloud storage
   - Share flows between devices
   - Version control integration

4. **Collaborative Editing**
   - Real-time flow editing
   - Multi-user support
   - Conflict resolution

5. **Enhanced Code Generation**
   - Multi-step planning
   - Architecture diagrams
   - Automated testing generation
   - Documentation generation

## API Reference

### NLP Engine

#### `nlp_send`
Send a message to the LLM and get a response.

**Request:**
```typescript
{
  messages: NlpMessage[],
  model: string,
  system_prompt: string,
  api_url: string,
  temperature: number,
}
```

**Response:**
```typescript
{
  text: string,
  model: string,
  elapsed_ms: number,
}
```

#### `nlp_fetch_url`
Fetch content from a URL and strip HTML tags.

**Request:**
```typescript
{
  url: string,
}
```

**Response:**
```typescript
{
  content: string, // Stripped text content
}
```

### Code Generation Engine

#### `generate_code`
Generate code files from a natural language prompt.

**Request:**
```typescript
{
  user_prompt: string,
  model: string,
  api_url: string,
  temperature: number,
  system_prompt: string,
  output_dir: string,
  existing_files?: CodeFile[],
}
```

**Response:**
```typescript
{
  project_name: string,
  files: CodeFile[],
  plan: IntentPlan,
  elapsed_ms: number,
  output_dir: string,
}
```

#### `refine_file`
Refine an existing file based on instructions.

**Request:**
```typescript
{
  file_path: string,
  instruction: string,
  model: string,
  api_url: string,
  temperature: number,
}
```

**Response:**
```typescript
{
  file_path: string,
  new_content: string,
  elapsed_ms: number,
}
```

### Flow Executor

#### `run_flow`
Execute a flow definition.

**Request:**
```typescript
{
  flowJson: string, // JSON flow definition
  flowId: string | null,
}
```

**Response:**
```typescript
{
  results: NodeResult[],
  order: string[], // Execution order
}
```

## Conclusion

The NLP-AI-Code-Creation engines provide a complete pipeline from natural language requirements to executable workflows. The integration of NLP chat, code generation, and flow execution creates a powerful development assistant that can:

1. **Understand** your requirements through multimodal chat
2. **Generate** production-ready code files
3. **Automate** workflows with visual flow execution
4. **Iterate** through refinement and feedback loops

This architecture enables developers of all skill levels to build complex applications through natural language interaction, while providing power users with fine-grained control over the generation and execution process.

---

**Version:** 1.0.0  
**Created:** May 23, 2026  
**Maintained by:** Hammurabi Coding Company
