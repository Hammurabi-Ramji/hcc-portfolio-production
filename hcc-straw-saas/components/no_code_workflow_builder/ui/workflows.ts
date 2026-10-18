// src/samples/workflows.ts

import type { WorkflowDefinition } from '../types';

/**
 * Invoice Processing Workflow
 * Automatically extract vendor, date, and amount from invoices,
 * then route high-value invoices for manual approval
 */
export const invoiceProcessingWorkflow: WorkflowDefinition = {
  id: 'workflow-invoice-processing',
  name: 'Invoice Processing',
  description: 'Automatically extract and process invoice data',
  status: 'active',
  version: 1,
  nodes: [
    {
      id: 'node-file-input',
      label: 'File Picker',
      node_type: 'input',
      description: 'Upload invoice PDF',
      config: {
        file_type: 'pdf',
      },
      position: { x: 80, y: 60 },
    },
    {
      id: 'node-parse-pdf',
      label: 'Transform',
      node_type: 'logic',
      description: 'Extract vendor, date, amount',
      config: {
        transform_type: 'extract_invoice_data',
      },
      position: { x: 80, y: 200 },
    },
    {
      id: 'node-check-amount',
      label: 'If/Then',
      node_type: 'logic',
      description: 'Check if amount > 500',
      config: {
        condition: 'amount > 500',
      },
      position: { x: 320, y: 140 },
    },
    {
      id: 'node-save-db',
      label: 'Save to DB',
      node_type: 'output',
      description: 'Store in database',
      config: {
        table: 'invoices',
      },
      position: { x: 320, y: 280 },
    },
    {
      id: 'node-send-approval',
      label: 'Send Email',
      node_type: 'output',
      description: 'Alert accounting for approval',
      config: {
        to: 'accounting@company.com',
        subject: 'Invoice Approval Required',
      },
      position: { x: 560, y: 140 },
    },
  ],
  edges: [
    {
      source: 'node-file-input',
      target: 'node-parse-pdf',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-parse-pdf',
      target: 'node-check-amount',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-check-amount',
      target: 'node-send-approval',
      source_port: 'true',
      target_port: 'in',
    },
    {
      source: 'node-check-amount',
      target: 'node-save-db',
      source_port: 'false',
      target_port: 'in',
    },
  ],
};

/**
 * Data Synchronization Workflow
 * Sync data between two databases with conflict resolution
 */
export const dataSyncWorkflow: WorkflowDefinition = {
  id: 'workflow-data-sync',
  name: 'Data Synchronization',
  description: 'Sync data between two databases',
  status: 'active',
  version: 1,
  nodes: [
    {
      id: 'node-source-db',
      label: 'Text Input',
      node_type: 'input',
      description: 'Source database query',
      config: {
        query: 'SELECT * FROM users WHERE updated_at > ?',
      },
      position: { x: 80, y: 60 },
    },
    {
      id: 'node-fetch-dest',
      label: 'Text Input',
      node_type: 'input',
      description: 'Destination database query',
      config: {
        query: 'SELECT * FROM users WHERE updated_at > ?',
      },
      position: { x: 80, y: 180 },
    },
    {
      id: 'node-merge-data',
      label: 'Merge',
      node_type: 'logic',
      description: 'Merge source and destination',
      config: {
        merge_strategy: 'latest_wins',
      },
      position: { x: 320, y: 120 },
    },
    {
      id: 'node-resolve-conflicts',
      label: 'Transform',
      node_type: 'logic',
      description: 'Resolve conflicts',
      config: {
        conflict_strategy: 'manual_review',
      },
      position: { x: 500, y: 120 },
    },
    {
      id: 'node-sync-to-dest',
      label: 'Save to DB',
      node_type: 'output',
      description: 'Write to destination DB',
      config: {
        database: 'destination',
        table: 'users',
      },
      position: { x: 680, y: 120 },
    },
  ],
  edges: [
    {
      source: 'node-source-db',
      target: 'node-merge-data',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-fetch-dest',
      target: 'node-merge-data',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-merge-data',
      target: 'node-resolve-conflicts',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-resolve-conflicts',
      target: 'node-sync-to-dest',
      source_port: 'out',
      target_port: 'in',
    },
  ],
};

/**
 * Email Campaign Workflow
 * Send personalized emails from CSV list
 */
export const emailCampaignWorkflow: WorkflowDefinition = {
  id: 'workflow-email-campaign',
  name: 'Email Campaign',
  description: 'Send personalized bulk email from CSV',
  status: 'active',
  version: 1,
  nodes: [
    {
      id: 'node-csv-input',
      label: 'File Picker',
      node_type: 'input',
      description: 'Upload recipient CSV',
      config: {
        file_type: 'csv',
      },
      position: { x: 80, y: 60 },
    },
    {
      id: 'node-parse-csv',
      label: 'Transform',
      node_type: 'logic',
      description: 'Parse CSV rows',
      config: {
        delimiter: ',',
        has_header: true,
      },
      position: { x: 80, y: 180 },
    },
    {
      id: 'node-loop-recipients',
      label: 'Loop',
      node_type: 'logic',
      description: 'For each recipient',
      config: {
        batch_size: 100,
      },
      position: { x: 280, y: 120 },
    },
    {
      id: 'node-send-email',
      label: 'Send Email',
      node_type: 'output',
      description: 'Send personalized email',
      config: {
        template_id: 'campaign-email-v1',
        from: 'campaigns@company.com',
      },
      position: { x: 480, y: 120 },
    },
    {
      id: 'node-export-log',
      label: 'Export CSV',
      node_type: 'output',
      description: 'Log delivery results',
      config: {
        include_fields: ['email', 'sent_at', 'status'],
      },
      position: { x: 680, y: 120 },
    },
  ],
  edges: [
    {
      source: 'node-csv-input',
      target: 'node-parse-csv',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-parse-csv',
      target: 'node-loop-recipients',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-loop-recipients',
      target: 'node-send-email',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-send-email',
      target: 'node-export-log',
      source_port: 'out',
      target_port: 'in',
    },
  ],
};

/**
 * Report Generation Workflow
 * Query data, generate charts, and send scheduled reports
 */
export const reportGenerationWorkflow: WorkflowDefinition = {
  id: 'workflow-report-generation',
  name: 'Report Generation',
  description: 'Generate and distribute daily reports',
  status: 'active',
  version: 1,
  nodes: [
    {
      id: 'node-db-query',
      label: 'Text Input',
      node_type: 'input',
      description: 'Query sales data',
      config: {
        query: 'SELECT date, amount, region FROM sales WHERE date = CURDATE()',
      },
      position: { x: 80, y: 60 },
    },
    {
      id: 'node-aggregate',
      label: 'Transform',
      node_type: 'logic',
      description: 'Aggregate by region',
      config: {
        groupBy: 'region',
        aggregations: ['sum', 'count', 'avg'],
      },
      position: { x: 280, y: 60 },
    },
    {
      id: 'node-generate-pdf',
      label: 'Transform',
      node_type: 'logic',
      description: 'Generate PDF report',
      config: {
        template: 'sales-report',
        include_charts: true,
      },
      position: { x: 480, y: 60 },
    },
    {
      id: 'node-email-report',
      label: 'Send Email',
      node_type: 'output',
      description: 'Email report to team',
      config: {
        to: 'sales-team@company.com',
        subject: 'Daily Sales Report',
      },
      position: { x: 680, y: 60 },
    },
    {
      id: 'node-save-archive',
      label: 'Save to DB',
      node_type: 'output',
      description: 'Archive report',
      config: {
        table: 'reports',
        type: 'daily_sales',
      },
      position: { x: 680, y: 180 },
    },
  ],
  edges: [
    {
      source: 'node-db-query',
      target: 'node-aggregate',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-aggregate',
      target: 'node-generate-pdf',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-generate-pdf',
      target: 'node-email-report',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-generate-pdf',
      target: 'node-save-archive',
      source_port: 'out',
      target_port: 'in',
    },
  ],
};

/**
 * Data Validation Workflow
 * Validate CSV or JSON data against rules
 */
export const dataValidationWorkflow: WorkflowDefinition = {
  id: 'workflow-data-validation',
  name: 'Data Validation',
  description: 'Quality assurance checks',
  status: 'draft',
  version: 1,
  nodes: [
    {
      id: 'node-file-upload',
      label: 'File Picker',
      node_type: 'input',
      description: 'Upload CSV or JSON',
      config: {
        accept_types: ['csv', 'json'],
      },
      position: { x: 80, y: 60 },
    },
    {
      id: 'node-validate-schema',
      label: 'Transform',
      node_type: 'logic',
      description: 'Validate against schema',
      config: {
        schema_id: 'customer-schema-v1',
      },
      position: { x: 280, y: 60 },
    },
    {
      id: 'node-check-errors',
      label: 'If/Then',
      node_type: 'logic',
      description: 'Are there errors?',
      config: {
        condition: 'error_count > 0',
      },
      position: { x: 480, y: 60 },
    },
    {
      id: 'node-export-errors',
      label: 'Export CSV',
      node_type: 'output',
      description: 'Export error report',
      config: {
        include_fields: ['row', 'field', 'error'],
      },
      position: { x: 680, y: 0 },
    },
    {
      id: 'node-save-valid',
      label: 'Save to DB',
      node_type: 'output',
      description: 'Save validated data',
      config: {
        table: 'validated_customers',
      },
      position: { x: 680, y: 120 },
    },
  ],
  edges: [
    {
      source: 'node-file-upload',
      target: 'node-validate-schema',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-validate-schema',
      target: 'node-check-errors',
      source_port: 'out',
      target_port: 'in',
    },
    {
      source: 'node-check-errors',
      target: 'node-export-errors',
      source_port: 'true',
      target_port: 'in',
    },
    {
      source: 'node-check-errors',
      target: 'node-save-valid',
      source_port: 'false',
      target_port: 'in',
    },
  ],
};

/**
 * All sample workflows
 */
export const allSampleWorkflows = [
  invoiceProcessingWorkflow,
  dataSyncWorkflow,
  emailCampaignWorkflow,
  reportGenerationWorkflow,
  dataValidationWorkflow,
];
