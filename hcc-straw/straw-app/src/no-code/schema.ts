import { sqliteTable, text, integer, real, blob, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// WORKFLOWS TABLE
// ============================================================================

export const workflows = sqliteTable(
  'workflows',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    
    // Workflow definition stored as JSON
    nodes_json: text('nodes_json').notNull(), // JSON: WorkflowNode[]
    edges_json: text('edges_json').notNull(), // JSON: WorkflowEdge[]
    
    // Metadata
    status: text('status', { 
      enum: ['draft', 'active', 'archived'] 
    }).notNull().default('draft'),
    
    version: integer('version').notNull().default(1),
    owner_id: text('owner_id').notNull(),
    
    // Timestamps
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    last_executed_at: text('last_executed_at'),
    
    // Statistics
    total_executions: integer('total_executions').notNull().default(0),
    successful_executions: integer('successful_executions').notNull().default(0),
    failed_executions: integer('failed_executions').notNull().default(0),
    
    // Configuration
    tags: text('tags'), // JSON: string[]
    metadata: text('metadata'), // JSON for custom fields
  },
  (table) => ({
    ownerIdIdx: index('idx_workflows_owner_id').on(table.owner_id),
    statusIdx: index('idx_workflows_status').on(table.status),
    createdAtIdx: index('idx_workflows_created_at').on(table.created_at),
  })
);

// ============================================================================
// WORKFLOW VERSIONS TABLE
// ============================================================================

export const workflowVersions = sqliteTable(
  'workflow_versions',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    version_number: integer('version_number').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    
    // Complete workflow definition snapshot
    nodes_json: text('nodes_json').notNull(),
    edges_json: text('edges_json').notNull(),
    
    // Change tracking
    change_summary: text('change_summary'),
    changed_by: text('changed_by'),
    
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdIdx: index('idx_workflow_versions_workflow_id').on(table.workflow_id),
    versionNumberIdx: index('idx_workflow_versions_version_number').on(table.version_number),
  })
);

// ============================================================================
// WORKFLOW EXECUTIONS TABLE
// ============================================================================

export const workflowExecutions = sqliteTable(
  'workflow_executions',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    // Execution metadata
    status: text('status', {
      enum: ['running', 'completed', 'failed', 'cancelled']
    }).notNull().default('running'),
    
    // Input and output
    input_data: text('input_data'), // JSON: Record<string, any>
    output_data: text('output_data'), // JSON: Record<string, any>
    
    // Error tracking
    error_message: text('error_message'),
    error_node_id: text('error_node_id'),
    error_stacktrace: text('error_stacktrace'),
    
    // Performance metrics
    started_at: text('started_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    completed_at: text('completed_at'),
    duration_ms: integer('duration_ms'),
    
    // Execution context
    triggered_by: text('triggered_by', {
      enum: ['manual', 'schedule', 'webhook', 'api']
    }).notNull().default('manual'),
    
    trigger_id: text('trigger_id'), // Reference to the trigger that started this
    
    // Audit
    user_id: text('user_id'),
    request_id: text('request_id'),
  },
  (table) => ({
    workflowIdIdx: index('idx_executions_workflow_id').on(table.workflow_id),
    statusIdx: index('idx_executions_status').on(table.status),
    startedAtIdx: index('idx_executions_started_at').on(table.started_at),
    userIdIdx: index('idx_executions_user_id').on(table.user_id),
  })
);

// ============================================================================
// EXECUTION NODES TABLE (Detailed node-level execution)
// ============================================================================

export const executionNodes = sqliteTable(
  'execution_nodes',
  {
    id: text('id').primaryKey().notNull(),
    execution_id: text('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
    node_id: text('node_id').notNull(),
    
    // Node metadata
    node_name: text('node_name').notNull(),
    node_type: text('node_type', {
      enum: ['input', 'logic', 'output']
    }).notNull(),
    
    // Execution details
    status: text('status', {
      enum: ['pending', 'running', 'completed', 'failed', 'skipped']
    }).notNull().default('pending'),
    
    input_data: text('input_data'), // JSON
    output_data: text('output_data'), // JSON
    error_message: text('error_message'),
    
    // Timing
    started_at: text('started_at'),
    completed_at: text('completed_at'),
    duration_ms: integer('duration_ms'),
    
    // Ordering
    sequence: integer('sequence').notNull(),
  },
  (table) => ({
    executionIdIdx: index('idx_execution_nodes_execution_id').on(table.execution_id),
    nodeIdIdx: index('idx_execution_nodes_node_id').on(table.node_id),
  })
);

// ============================================================================
// WORKFLOW TEMPLATES TABLE
// ============================================================================

export const workflowTemplates = sqliteTable(
  'workflow_templates',
  {
    id: text('id').primaryKey().notNull(),
    
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'), // e.g., "data-processing", "automation", "reporting"
    
    // Template definition
    nodes_json: text('nodes_json').notNull(),
    edges_json: text('edges_json').notNull(),
    
    // Metadata
    author_id: text('author_id').notNull(),
    is_public: integer('is_public', { mode: 'boolean' }).notNull().default(false),
    
    // Usage tracking
    usage_count: integer('usage_count').notNull().default(0),
    rating: real('rating'), // 0-5 stars
    reviews_count: integer('reviews_count').notNull().default(0),
    
    // Tags and categorization
    tags: text('tags'), // JSON: string[]
    preview_image_url: text('preview_image_url'),
    
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    categoryIdx: index('idx_templates_category').on(table.category),
    isPublicIdx: index('idx_templates_is_public').on(table.is_public),
    authorIdIdx: index('idx_templates_author_id').on(table.author_id),
  })
);

// ============================================================================
// WORKFLOW SCHEDULES TABLE
// ============================================================================

export const workflowSchedules = sqliteTable(
  'workflow_schedules',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    // Schedule definition
    cron_expression: text('cron_expression').notNull(), // e.g., "0 9 * * MON-FRI"
    timezone: text('timezone').notNull().default('UTC'),
    
    // Configuration
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    name: text('name').notNull(),
    description: text('description'),
    
    // Input defaults
    default_input: text('default_input'), // JSON
    
    // Execution context
    last_run_at: text('last_run_at'),
    next_run_at: text('next_run_at'),
    last_execution_id: text('last_execution_id').references(() => workflowExecutions.id),
    
    // Failure handling
    retry_on_failure: integer('retry_on_failure', { mode: 'boolean' }).notNull().default(true),
    max_retries: integer('max_retries').notNull().default(3),
    
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdIdx: index('idx_schedules_workflow_id').on(table.workflow_id),
    isActiveIdx: index('idx_schedules_is_active').on(table.is_active),
    nextRunAtIdx: index('idx_schedules_next_run_at').on(table.next_run_at),
  })
);

// ============================================================================
// WORKFLOW WEBHOOKS TABLE
// ============================================================================

export const workflowWebhooks = sqliteTable(
  'workflow_webhooks',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    // Webhook configuration
    url: text('url').notNull(),
    method: text('method', { 
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] 
    }).notNull().default('POST'),
    
    // Authentication
    secret_token: text('secret_token'), // HMAC secret for validation
    headers_json: text('headers_json'), // JSON: Record<string, string>
    
    // Trigger configuration
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    events: text('events'), // JSON: string[] - which events trigger this
    
    // Retry policy
    max_retries: integer('max_retries').notNull().default(3),
    retry_delay_ms: integer('retry_delay_ms').notNull().default(1000),
    
    // Usage stats
    total_invocations: integer('total_invocations').notNull().default(0),
    successful_invocations: integer('successful_invocations').notNull().default(0),
    last_invoked_at: text('last_invoked_at'),
    
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdIdx: index('idx_webhooks_workflow_id').on(table.workflow_id),
    isActiveIdx: index('idx_webhooks_is_active').on(table.is_active),
  })
);

// ============================================================================
// WORKFLOW AUDIT LOG TABLE
// ============================================================================

export const workflowAuditLog = sqliteTable(
  'workflow_audit_log',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    // Action details
    action: text('action', {
      enum: ['created', 'updated', 'deleted', 'deployed', 'executed', 'scheduled', 'shared']
    }).notNull(),
    
    description: text('description'),
    
    // Change tracking
    old_values: text('old_values'), // JSON
    new_values: text('new_values'), // JSON
    
    // Context
    user_id: text('user_id').notNull(),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    
    timestamp: text('timestamp').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdIdx: index('idx_audit_log_workflow_id').on(table.workflow_id),
    userIdIdx: index('idx_audit_log_user_id').on(table.user_id),
    actionIdx: index('idx_audit_log_action').on(table.action),
    timestampIdx: index('idx_audit_log_timestamp').on(table.timestamp),
  })
);

// ============================================================================
// WORKFLOW SHARING TABLE (Collaborative access)
// ============================================================================

export const workflowSharing = sqliteTable(
  'workflow_sharing',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    // Shared with
    shared_with_user_id: text('shared_with_user_id'),
    shared_with_group_id: text('shared_with_group_id'),
    shared_with_email: text('shared_with_email'),
    
    // Permissions
    permission: text('permission', {
      enum: ['view', 'edit', 'execute', 'admin']
    }).notNull().default('view'),
    
    // Sharing context
    shared_by: text('shared_by').notNull(),
    share_message: text('share_message'),
    
    expires_at: text('expires_at'), // Optional expiration
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdIdx: index('idx_sharing_workflow_id').on(table.workflow_id),
    sharedWithUserIdx: index('idx_sharing_shared_with_user_id').on(table.shared_with_user_id),
    sharedWithGroupIdx: index('idx_sharing_shared_with_group_id').on(table.shared_with_group_id),
  })
);

// ============================================================================
// WORKFLOW STATISTICS TABLE (For analytics and dashboards)
// ============================================================================

export const workflowStatistics = sqliteTable(
  'workflow_statistics',
  {
    id: text('id').primaryKey().notNull(),
    workflow_id: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    
    // Time period
    date: text('date').notNull(), // YYYY-MM-DD
    hour: integer('hour'), // 0-23, optional for hourly stats
    
    // Metrics
    execution_count: integer('execution_count').notNull().default(0),
    success_count: integer('success_count').notNull().default(0),
    failure_count: integer('failure_count').notNull().default(0),
    
    // Performance
    avg_duration_ms: real('avg_duration_ms'),
    min_duration_ms: integer('min_duration_ms'),
    max_duration_ms: integer('max_duration_ms'),
    
    // Error tracking
    most_common_error: text('most_common_error'),
    error_count: integer('error_count').notNull().default(0),
    
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    workflowIdDateIdx: index('idx_stats_workflow_id_date').on(table.workflow_id, table.date),
    workflowIdHourIdx: index('idx_stats_workflow_id_hour').on(table.workflow_id, table.hour),
  })
);

// ============================================================================
// MIGRATION: Create initial schema
// ============================================================================

/**
 * Initial migration for workflow database schema
 * 
 * Usage with Drizzle Kit:
 * npx drizzle-kit generate:sqlite --schema ./src/db/schema.ts
 * npx drizzle-kit push:sqlite
 */

export const schema = {
  workflows,
  workflowVersions,
  workflowExecutions,
  executionNodes,
  workflowTemplates,
  workflowSchedules,
  workflowWebhooks,
  workflowAuditLog,
  workflowSharing,
  workflowStatistics,
};
