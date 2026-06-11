-- ========================================================================
-- Radix Labs Unified ERP - Production Database Schema Initialization
-- ========================================================================
-- This script creates all required tables, indexes, views, and triggers
-- for production deployment. Ensure all data integrity constraints.
-- ========================================================================
-- PRAGMA Settings (Performance & Safety)
-- ========================================================================
PRAGMA foreign_keys = ON;

PRAGMA journal_mode = WAL;

PRAGMA synchronous = NORMAL;

PRAGMA cache_size = -64000;

PRAGMA temp_store = MEMORY;

-- ========================================================================
-- 1. CORE AUTHENTICATION & USERS
-- ========================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    role TEXT NOT NULL DEFAULT 'viewer',
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    two_fa_enabled BOOLEAN DEFAULT 0,
    two_fa_secret TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT,
    is_system_role BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ========================================================================
-- 2. DOCUMENT MANAGEMENT SYSTEM
-- ========================================================================
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT NOT NULL,
    category TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_hash TEXT UNIQUE,
    mime_type TEXT,
    status TEXT DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    approved_at DATETIME,
    approved_by TEXT,
    FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT,
    change_description TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id),
    UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS electronic_signatures (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    document_version INTEGER NOT NULL,
    signer_id TEXT NOT NULL,
    signature_value TEXT NOT NULL,
    signature_timestamp DATETIME NOT NULL,
    signature_method TEXT DEFAULT 'sha256',
    reason TEXT,
    status TEXT DEFAULT 'active',
    revoked_at DATETIME,
    revoked_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (signer_id) REFERENCES users (id),
    UNIQUE (document_id, document_version, signer_id)
);

CREATE TABLE IF NOT EXISTS document_access_log (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS document_tags (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    UNIQUE (document_id, tag)
);

CREATE TABLE IF NOT EXISTS document_comments (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ========================================================================
-- 3. MANUFACTURING & PRODUCTION
-- ========================================================================
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    scheduled_start DATETIME,
    scheduled_end DATETIME,
    actual_start DATETIME,
    actual_end DATETIME,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (assigned_to) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS production_plans (
    id TEXT PRIMARY KEY,
    plan_name TEXT NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT DEFAULT 'draft',
    created_by TEXT NOT NULL,
    approved_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (approved_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS bill_of_materials (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    component_id TEXT NOT NULL,
    component_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    specification TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- ========================================================================
-- 4. QUALITY ASSURANCE & TESTING
-- ========================================================================
CREATE TABLE IF NOT EXISTS quality_controls (
    id TEXT PRIMARY KEY,
    work_order_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    test_method TEXT NOT NULL,
    result TEXT NOT NULL,
    passed BOOLEAN,
    specification_limit TEXT,
    actual_value REAL,
    notes TEXT,
    tested_by TEXT NOT NULL,
    test_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_orders (id) ON DELETE CASCADE,
    FOREIGN KEY (tested_by) REFERENCES users (id)
);

-- ========================================================================
-- 5. REGULATORY AFFAIRS & COMPLIANCE
-- ========================================================================
CREATE TABLE IF NOT EXISTS regulatory_submissions (
    id TEXT PRIMARY KEY,
    submission_number TEXT NOT NULL UNIQUE,
    submission_type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    agency TEXT,
    product_name TEXT,
    submission_date DATETIME,
    approval_date DATETIME,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (assigned_to) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS compliance_regulations (
    id TEXT PRIMARY KEY,
    regulation_name TEXT NOT NULL,
    regulation_code TEXT UNIQUE,
    description TEXT,
    applicable_to TEXT,
    effective_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_compliance (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    regulation_id TEXT NOT NULL,
    compliance_status TEXT DEFAULT 'pending',
    verified_by TEXT,
    verified_at DATETIME,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (regulation_id) REFERENCES compliance_regulations (id),
    UNIQUE (document_id, regulation_id)
);

-- ========================================================================
-- 6. LEARNING MANAGEMENT SYSTEM
-- ========================================================================
CREATE TABLE IF NOT EXISTS training_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    training_name TEXT NOT NULL,
    training_date DATETIME NOT NULL,
    duration_minutes INTEGER,
    result TEXT,
    passed BOOLEAN,
    score REAL,
    trainer_id TEXT,
    notes TEXT,
    certification_number TEXT,
    expiry_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users (id)
);

-- ========================================================================
-- 7. WORKFLOWS & APPROVALS
-- ========================================================================
CREATE TABLE IF NOT EXISTS document_workflows (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATETIME,
    completed_at DATETIME,
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES document_workflows (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users (id)
);

-- ========================================================================
-- 8. REPORTING & ANALYTICS
-- ========================================================================
CREATE TABLE IF NOT EXISTS report_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL UNIQUE,
    description TEXT,
    template_config TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS generated_reports (
    id TEXT PRIMARY KEY,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    generated_by TEXT NOT NULL,
    data_json TEXT,
    file_path TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (generated_by) REFERENCES users (id)
);

-- ========================================================================
-- 9. SYSTEM & CONFIGURATION
-- ========================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    data_type TEXT DEFAULT 'string',
    is_secure BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    changes TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ========================================================================
-- 10. CACHING & OPTIMIZATION
-- ========================================================================
CREATE TABLE IF NOT EXISTS search_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    search_query TEXT NOT NULL,
    result_count INTEGER,
    search_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    preferences_json TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    notification_type TEXT,
    related_resource_id TEXT,
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS query_cache (
    id TEXT PRIMARY KEY,
    query_hash TEXT NOT NULL UNIQUE,
    query_text TEXT,
    result_json TEXT,
    ttl INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

CREATE TABLE IF NOT EXISTS background_jobs (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,
    job_status TEXT DEFAULT 'pending',
    job_data TEXT,
    result_data TEXT,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    scheduled_for DATETIME
);

CREATE TABLE IF NOT EXISTS application_logs (
    id TEXT PRIMARY KEY,
    log_level TEXT NOT NULL,
    logger TEXT,
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_id TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ========================================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================================
-- Users indexes
CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_role ON users (role);

CREATE INDEX idx_users_active ON users (is_active);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);

CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);

-- Documents indexes
CREATE INDEX idx_documents_owner_id ON documents (owner_id);

CREATE INDEX idx_documents_type ON documents (document_type);

CREATE INDEX idx_documents_status ON documents (status);

CREATE INDEX idx_documents_category ON documents (category);

-- Access logs indexes
CREATE INDEX idx_document_access_log_document_id ON document_access_log (document_id);

CREATE INDEX idx_document_access_log_user_id ON document_access_log (user_id);

CREATE INDEX idx_document_access_log_timestamp ON document_access_log (timestamp);

-- Work orders indexes
CREATE INDEX idx_work_orders_status ON work_orders (status);

CREATE INDEX idx_work_orders_assigned_to ON work_orders (assigned_to);

CREATE INDEX idx_work_orders_created_by ON work_orders (created_by);

-- Quality controls indexes
CREATE INDEX idx_quality_controls_work_order_id ON quality_controls (work_order_id);

CREATE INDEX idx_quality_controls_tested_by ON quality_controls (tested_by);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications (user_id);

CREATE INDEX idx_notifications_is_read ON notifications (is_read);

-- Training records indexes
CREATE INDEX idx_training_records_user_id ON training_records (user_id);

CREATE INDEX idx_training_records_training_date ON training_records (training_date);

-- Regulatory submissions indexes
CREATE INDEX idx_regulatory_submissions_status ON regulatory_submissions (status);

CREATE INDEX idx_regulatory_submissions_assigned_to ON regulatory_submissions (assigned_to);

-- Cache indexes
CREATE INDEX idx_query_cache_expires_at ON query_cache (expires_at);

CREATE INDEX idx_background_jobs_status ON background_jobs (job_status);

-- ========================================================================
-- TRIGGERS FOR AUDIT & INTEGRITY
-- ========================================================================
-- Auto-update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_users_timestamp AFTER
UPDATE ON users BEGIN
UPDATE users
SET
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = NEW.id;

END;

CREATE TRIGGER IF NOT EXISTS update_documents_timestamp AFTER
UPDATE ON documents BEGIN
UPDATE documents
SET
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = NEW.id;

END;

CREATE TRIGGER IF NOT EXISTS update_work_orders_timestamp AFTER
UPDATE ON work_orders BEGIN
UPDATE work_orders
SET
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = NEW.id;

END;

-- ========================================================================
-- INITIAL DATA SETUP
-- ========================================================================
-- Create default roles
INSERT
OR IGNORE INTO roles (
    id,
    name,
    description,
    permissions,
    is_system_role
)
VALUES
    (
        'admin',
        'Administrator',
        'Full system access and configuration',
        '["*"]',
        1
    ),
    (
        'manager',
        'Manager',
        'Department management and reporting',
        '["read", "create", "update", "report"]',
        1
    ),
    (
        'operator',
        'Operator',
        'Production and operational tasks',
        '["read", "create", "update"]',
        1
    ),
    (
        'viewer',
        'Viewer',
        'Read-only access',
        '["read"]',
        1
    );

-- Create system settings
INSERT
OR IGNORE INTO system_settings (id, setting_key, setting_value, data_type)
VALUES
    (
        'db_version',
        'database_version',
        '1.0.0',
        'string'
    ),
    (
        'db_initialized',
        'initialized_at',
        CURRENT_TIMESTAMP,
        'datetime'
    ),
    ('fda_compliance', 'enabled', 'true', 'boolean');

-- ========================================================================
-- VIRTUAL TABLES FOR FULL-TEXT SEARCH
-- ========================================================================
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5 (document_id, title, description, content);

CREATE VIRTUAL TABLE IF NOT EXISTS audit_logs_fts USING fts5 (log_id, action, resource_type, message);

-- ========================================================================
-- VIEWS FOR COMMON QUERIES
-- ========================================================================
CREATE VIEW IF NOT EXISTS active_users AS
SELECT
    id,
    username,
    email,
    first_name,
    last_name,
    full_name,
    role,
    department
FROM
    users
WHERE
    is_active = 1
ORDER BY
    last_name,
    first_name;

CREATE VIEW IF NOT EXISTS recent_documents AS
SELECT
    id,
    title,
    document_type,
    status,
    owner_id,
    updated_at
FROM
    documents
WHERE
    status IN ('active', 'draft')
ORDER BY
    updated_at DESC
LIMIT
    50;

CREATE VIEW IF NOT EXISTS pending_work_orders AS
SELECT
    id,
    order_number,
    product_name,
    quantity,
    status,
    priority,
    created_at
FROM
    work_orders
WHERE
    status IN ('pending', 'in_progress')
ORDER BY
    priority DESC,
    created_at ASC;

-- ========================================================================
-- END OF SCHEMA INITIALIZATION
-- ========================================================================
COMMIT;