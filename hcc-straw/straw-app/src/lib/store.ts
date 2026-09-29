import { writable, derived } from "svelte/store";
import type {
  NodeSchema, ExecutionResult, NodeResult,
  NlpMessage, NlpAttachment,
  GenStage, CodeFile, IntentPlan, CreationResult, ProjectScaffold,
} from "./types";

export const schemas = writable<NodeSchema[]>([]);
export const schemasByKind = derived(schemas, ($s) =>
  Object.fromEntries($s.map((s) => [s.kind, s]))
);

export const executionResult = writable<ExecutionResult | null>(null);
export const running = writable(false);
export const selectedNodeId = writable<string | null>(null);

export function nodeResultFor(result: ExecutionResult | null, nodeId: string): NodeResult | undefined {
  return result?.results.find((r) => r.node_id === nodeId);
}

export function displayValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "type" in (v as object)) {
    const nv = v as { type: string; value?: unknown };
    if (nv.type === "Text") return String(nv.value);
    if (nv.type === "Number") return String(nv.value);
    if (nv.type === "Bool") return String(nv.value);
    if (nv.type === "Null") return "(null)";
    if (nv.type === "List") return `[${(nv.value as unknown[]).length} items]`;
    if (nv.type === "Table") return `[${(nv.value as unknown[]).length} rows]`;
  }
  return JSON.stringify(v);
}

// ── NLP / Multimodal AI State ─────────────────────────────────────────────────

export const nlpMessages    = writable<NlpMessage[]>([]);
export const nlpThinking    = writable(false);
export const nlpModel       = writable("llama2");
export const nlpApiUrl      = writable("http://localhost:11434/api/generate");
export const nlpSystemPrompt = writable("You are a helpful assistant. When you receive URLs, documents, or images, analyse them as part of the conversation.");
export const nlpTemperature = writable(0.7);
export const nlpAttachments = writable<NlpAttachment[]>([]);
export const micActive      = writable(false);

// ── Code Generation Pipeline State ───────────────────────────────────────────

export const codeGenStage      = writable<GenStage>("idle");
export const codeGenPlan       = writable<IntentPlan | null>(null);
export const codeGenFiles      = writable<CodeFile[]>([]);
export const codeGenActiveFile = writable<string | null>(null);   // file id
export const codeGenResult     = writable<CreationResult | null>(null);
export const codeGenError      = writable<string | null>(null);
export const codeGenOutputDir  = writable<string>("");
export const codeGenPrompt     = writable<string>("");
export const codeGenProgress   = writable<{ current: number; total: number; label: string }>({
  current: 0, total: 0, label: "",
});
export const codeGenModel      = writable("llama2");
export const codeGenApiUrl     = writable("http://localhost:11434/api/generate");
export const codeGenSystemPrompt = writable("You are an expert software developer. Generate complete, production-ready code files.");
export const codeGenTemperature  = writable(0.7);
