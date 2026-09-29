import { invoke } from "@tauri-apps/api/core";
import type {
  FlowRecord, NodeSchema, ExecutionResult,
  NlpRequest, NlpResponse,
  CreationRequest, CreationResult, RefinementRequest, RefinementResult,
} from "./types";

export const commands = {
  listFlows: (): Promise<FlowRecord[]> =>
    invoke("list_flows"),

  loadFlow: (id: string): Promise<FlowRecord | null> =>
    invoke("load_flow", { id }),

  saveFlow: (id: string | null, name: string, definition: string): Promise<string> =>
    invoke("save_flow", { id, name, definition }),

  deleteFlow: (id: string): Promise<void> =>
    invoke("delete_flow", { id }),

  runFlow: (flowJson: string, flowId: string | null): Promise<ExecutionResult> =>
    invoke("run_flow", { flowJson, flowId }),

  getNodeSchemas: (): Promise<NodeSchema[]> =>
    invoke("get_node_schemas"),

  // ── NLP / Multimodal ──────────────────────────────────────────────────────
  nlpSend: (request: NlpRequest): Promise<NlpResponse> =>
    invoke("nlp_send", { request }),

  nlpFetchUrl: (url: string): Promise<string> =>
    invoke("nlp_fetch_url", { url }),

  // ── Code Generation ───────────────────────────────────────────────────────
  generateCode: (request: CreationRequest): Promise<CreationResult> =>
    invoke("generate_code", { request }),

  refineFile: (request: RefinementRequest): Promise<RefinementResult> =>
    invoke("refine_file", { request }),
};
