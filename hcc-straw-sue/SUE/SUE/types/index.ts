// ──────────────────────────────────────────────────────────────
// SUE - SHARED TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────

export interface ExtensionMessage {
  type: string;
  key?: string;
  value?: unknown;
  credentials?: AuthCredentials;
  task?: AgentTask | Record<string, unknown>;
  taskId?: string;
  status?: TaskStatus;
  targetId?: string;
  tabs?: TabInfo[];
  messages?: ChatMessage[];
  project?: Project;
  projectId?: string | number;
  note?: Note;
  noteId?: string | number;
  [key: string]: unknown;
}

export interface AuthCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface Session {
  session_id: string;
  token: string;
  user_id: number | null;
  username?: string | null;
  created_at: number;
  expires_at: number;
  last_activity?: number;
  is_active?: boolean;
}

export type TaskStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';

export interface AgentTask {
  id: string;
  task_type: string;
  content: string;
  priority: number;
  created_at: number;
  status: TaskStatus;
  completed_at?: number;
  result?: unknown;
}

export interface TabInfo {
  tab_id: number;
  url: string;
  title: string;
  is_active?: boolean;

  // Compatibility alias for existing JS helpers that still use camelCase.
  tabId?: number;
}

export interface PageContext {
  url: string;
  title: string;
  domain: string;
  path: string;
  selected_text?: string | null;
  selection_range?: SelectionRange | null;
  page_elements?: ElementInfo[];
}

export interface TabSession {
  session_id: string;
  tabs: TabInfo[];
  created_at: number;
  last_active: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type AiTier = 'Local' | 'Premium';

export interface ChatRequest {
  messages: ChatMessage[];
  tier: AiTier;
}

export interface Project {
  id: string | number;
  name: string;
  schema_yaml?: string;
  description?: string;
  created_at: number;
  updated_at: number;
  status: 'active' | 'archived' | 'completed';
}

export interface Note {
  id: string | number;
  title?: string;
  content?: string;
  body?: string;
  created_at: number;
  updated_at: number;
  tags?: string[];
}

export interface CloudService {
  id?: string;
  name: string;
  status: 'Connected' | 'Not signed in' | 'disconnected' | 'error' | 'pending';
  type: 'koofr' | 'icedrive' | 'degoo' | 'other';
  storageUsed?: number;
  storageTotal?: number;
  lastSync?: number;
  login_url?: string;
  integration_mode?: string;
  capabilities?: string[];
  limitations?: string[];
  connected?: boolean;
  cookie_count?: number;
}

export interface CloudStorageStatus {
  koofr_connected: boolean;
  ice_drive_mounted: boolean;
  degoo_archived: boolean;
}

export interface MemoryObject {
  id: string;
  url: string;
  title: string;
  content_text?: string | null;
  content_images: string[];
  content_videos: string[];
  captured_at: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Pattern {
  id: string;
  pattern_type: string;
  data: Record<string, unknown>;
  created_at: number;
  associated_memories: string[];
}

export interface RamemoryExperience {
  id: string;
  title: string;
  description: string;
  base_memories: string[];
  generated_elements: Record<string, unknown>;
  created_at: number;
  last_accessed: number;
  experience_type: string;
}

export interface RamemoryConfig {
  enabled: boolean;
  local_embedding_model?: string | null;
  default_experience_type: string;
}

export interface SelectionRange {
  start_offset: number;
  end_offset: number;
  text: string;
}

export interface ElementInfo {
  tag_name: string;
  id?: string | null;
  class_name?: string | null;
  role?: string | null;
  accessible_name?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StorageKey {
  VAULT_KEY: string;
  CURRENT_SESSION: string;
  USER_SETTINGS: string;
  AGENT_TASKS: string;
  PROJECTS: string;
  CLOUD_SERVICES: string;
  LAST_PAGE_INFO: string;
  RUNTIME_HEALTH: string;
  LAST_CLOUD_SNAPSHOT: string;
  LAST_VECTOR_COMPACT: string;
}

export const STORAGE_KEYS: StorageKey = {
  VAULT_KEY: 'vault_key',
  CURRENT_SESSION: 'current_session',
  USER_SETTINGS: 'user_settings',
  AGENT_TASKS: 'agent_tasks',
  PROJECTS: 'projects',
  CLOUD_SERVICES: 'cloud_services',
  LAST_PAGE_INFO: 'sue_last_page_info',
  RUNTIME_HEALTH: 'sue_runtime_health',
  LAST_CLOUD_SNAPSHOT: 'sue_last_cloud_snapshot',
  LAST_VECTOR_COMPACT: 'sue_last_vector_compact',
};

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

export type ErrorCategory = 'NETWORK' | 'STORAGE' | 'AUTH' | 'VALIDATION' | 'UI' | 'SYSTEM';

export interface ErrorConfig {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  retryable: boolean;
}
