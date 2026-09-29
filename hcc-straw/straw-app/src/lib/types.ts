// ── Node system ──────────────────────────────────────────────────────────────

export interface SchemaField {
  name: string;
  label: string;
  field_type: "text" | "textarea" | "number" | "bool" | "select";
  default?: string;
  options?: string[];
  required: boolean;
}

export interface NodeSchema {
  kind: string;
  label: string;
  description: string;
  category: string;
  inputs: string[];
  outputs: string[];
  config_fields: SchemaField[];
}

// ── Flow graph ───────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string;
  kind: string;
  config: Record<string, string>;
}

export interface FlowEdge {
  id: string;
  source: string;
  source_handle: string;
  target: string;
  target_handle: string;
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// ── Persistence ──────────────────────────────────────────────────────────────

export interface FlowRecord {
  id: string;
  name: string;
  definition: string;
  created_at: string;
  updated_at: string;
}

// ── Execution ─────────────────────────────────────────────────────────────────

export type NodeValue =
  | { type: "Text";   value: string }
  | { type: "Number"; value: number }
  | { type: "Bool";   value: boolean }
  | { type: "List";   value: NodeValue[] }
  | { type: "Table";  value: Record<string, string>[] }
  | { type: "Null" };

export interface NodeResult {
  node_id: string;
  outputs: Record<string, NodeValue>;
  error?: string;
}

export interface ExecutionResult {
  results: NodeResult[];
  order: string[];
}

// ── NLP / Multimodal AI Input ─────────────────────────────────────────────────

export type AttachmentKind = "image" | "document" | "url" | "audio";

export interface NlpAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;          // display name / filename / URL
  data: string;          // base64 for binary; raw text for URLs
  mimeType: string;
  sizeBytes?: number;
}

export type MessageRole = "user" | "assistant" | "system";

export interface NlpMessage {
  id: string;
  role: MessageRole;
  text: string;
  attachments: NlpAttachment[];
  timestamp: string;    // ISO-8601
  thinking?: boolean;   // assistant is still streaming
  error?: string;
}

export interface NlpRequest {
  messages: NlpMessage[];
  model: string;
  system_prompt: string;
  api_url: string;
  temperature: number;
}

export interface NlpResponse {
  text: string;
  model: string;
  elapsed_ms: number;
}

// ── Code Generation Pipeline ──────────────────────────────────────────────────

export type GenStage =
  | "idle"
  | "parsing_intent"
  | "planning"
  | "generating"
  | "refining"
  | "writing"
  | "complete"
  | "error";

export type FileLanguage =
  | "rust" | "typescript" | "svelte" | "javascript"
  | "python" | "html" | "css" | "json" | "toml"
  | "markdown" | "sql" | "shell" | "text";

export interface CodeFile {
  id: string;
  path: string;           // relative path within project, e.g. "src/main.rs"
  language: FileLanguage;
  content: string;
  original_content?: string; // snake_case matches Rust serde serialization
  is_new: boolean;
  is_dirty: boolean;
}

export interface ProjectScaffold {
  name: string;
  description: string;
  rootDir: string;        // absolute path on disk
  language: string;       // primary language
  framework?: string;
  files: CodeFile[];
  commands: {             // runnable commands
    build?: string;
    run?: string;
    test?: string;
    install?: string;
  };
}

export interface IntentPlan {
  title: string;
  description: string;
  project_type: string;   // snake_case matches Rust
  language: string;
  framework?: string;
  file_list: string[];
  steps: string[];
}

export interface CreationRequest {
  user_prompt: string;    // snake_case matches Rust serde
  model: string;
  api_url: string;
  temperature: number;
  system_prompt: string;
  output_dir: string;
  existing_files?: CodeFile[];
}

export interface CreationResult {
  project_name: string;
  files: CodeFile[];
  plan: IntentPlan;
  elapsed_ms: number;
  output_dir: string;
}

export interface RefinementRequest {
  file_path: string;
  instruction: string;
  model: string;
  api_url: string;
  temperature: number;
}

export interface RefinementResult {
  file_path: string;
  new_content: string;
  elapsed_ms: number;
}

export interface DiffHunk {
  lineStart: number;
  lineEnd: number;
  original: string;
  replacement: string;
  accepted: boolean | null; // null = pending
}
