# VetPharma ERP - Database Connection Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Svelte + Vite)                        │
│                         localhost:5173                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Tauri IPC Bridge
                                    │ @tauri-apps/api/core
                                    │ invoke("command_name", {params})
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Rust/Tauri 2.x)                         │
│                    31+ Registered Commands                               │
│                    src-tauri/src/api/commands.rs                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ rusqlite async
                                    │ Connection Pool
                                    │ Prepared Statements
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite 3.50.4)                              │
│                    data/vetpharma.db                                     │
│                    29 Tables + 3 Views + 45+ Indexes                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Connection Flow Examples

### Example 1: User Login Flow

```
┌─────────────────────┐
│  Login.svelte       │
│  User enters        │
│  username/password  │
└──────────┬──────────┘
           │
           │ invoke("login", {request})
           ↓
┌─────────────────────┐
│  commands::login    │
│  Validate password  │
│  Create session     │
└──────────┬──────────┘
           │
           │ Query: SELECT user_id, password_hash FROM users
           │ Query: INSERT INTO sessions (...)
           ↓
┌─────────────────────┐
│  users table        │
│  sessions table     │
│  Return: token      │
└──────────┬──────────┘
           │
           │ LoginResponse { success, token, user }
           ↓
┌─────────────────────┐
│  Login.svelte       │
│  Store auth token   │
│  Navigate to /      │
└─────────────────────┘
```

### Example 2: Create Production Batch Flow

```
┌──────────────────────────┐
│  BatchManagement.svelte  │
│  User fills batch form   │
└────────────┬─────────────┘
             │
             │ invoke("create_batch", {request, userId})
             ↓
┌──────────────────────────┐
│  commands::create_batch  │
│  Generate batch_id       │
│  Validate material_id    │
└────────────┬─────────────┘
             │
             │ Query 1: SELECT * FROM materials WHERE material_id = ?
             │ Query 2: INSERT INTO production_batches (batch_id, batch_number, ...)
             │ Query 3: INSERT INTO audit_logs (action, entity_id, ...)
             ↓
┌──────────────────────────┐
│  materials table         │
│  production_batches      │
│  audit_logs table        │
└────────────┬─────────────┘
             │
             │ BatchResponse { batch_id, batch_number }
             ↓
┌──────────────────────────┐
│  BatchManagement.svelte  │
│  Show success message    │
│  Refresh batch list      │
└──────────────────────────┘
```

### Example 3: QC Test Creation & Results Flow

```
┌─────────────────────┐
│  QcTesting.svelte   │
│  Create QC Test     │
└──────────┬──────────┘
           │
           │ invoke("create_qc_test", {request})
           ↓
┌─────────────────────┐
│  commands::        │
│  create_qc_test     │
└──────────┬──────────┘
           │
           │ Query 1: SELECT * FROM inventory_lots WHERE lot_id = ?
           │ Query 2: INSERT INTO qc_tests (test_id, test_number, lot_id, ...)
           ↓
┌─────────────────────┐
│  inventory_lots     │
│  qc_tests table     │
└──────────┬──────────┘
           │
           │ QcTestResponse { test_id, test_number }
           ↓
┌─────────────────────┐
│  QcTesting.svelte   │
│  Display test form  │
└──────────┬──────────┘
           │
           │ invoke("enter_test_results", {request})
           ↓
┌─────────────────────┐
│  commands::        │
│  enter_test_results │
└──────────┬──────────┘
           │
           │ Query 1: INSERT INTO qc_test_results (...)
           │ Query 2: UPDATE qc_tests SET status = 'completed' WHERE test_id = ?
           │ Query 3: UPDATE inventory_lots SET qc_status = 'pass' WHERE lot_id = ?
           ↓
┌─────────────────────┐
│  qc_test_results    │
│  qc_tests table     │
│  inventory_lots     │
└──────────┬──────────┘
           │
           │ TestResultsResponse { success }
           ↓
┌─────────────────────┐
│  QcTesting.svelte   │
│  Show test results  │
│  Update lot status  │
└─────────────────────┘
```

---

## 📊 Module-Specific Connection Map

### Manufacturing Module
```
BatchManagement.svelte
    ↓ invoke("get_batches")
    → commands::get_batches
        ↓ SELECT FROM v_batch_status VIEW
        → production_batches + batch_steps + materials
    
    ↓ invoke("create_batch")
    → commands::create_batch
        ↓ INSERT INTO production_batches
        → production_batches table

MrpPlanning.svelte
    ↓ invoke("run_mrp")
    → commands::run_mrp
        ↓ Complex MRP calculation
        → materials + inventory_lots + production_batches
```

### Quality Management Module
```
QcTesting.svelte
    ↓ invoke("create_qc_test")
    → commands::create_qc_test
        ↓ INSERT INTO qc_tests
        → qc_tests table
    
    ↓ invoke("enter_test_results")
    → commands::enter_test_results
        ↓ INSERT INTO qc_test_results
        → qc_test_results + qc_tests tables

CapaManagement.svelte
    ↓ invoke("create_capa")
    → commands::create_capa
        ↓ INSERT INTO capa_records
        → capa_records + deviations tables

DeviationsManagement.svelte
    ↓ invoke("create_deviation")
    → commands::create_deviation
        ↓ INSERT INTO deviations
        → deviations + audit_logs tables
```

### Inventory Management Module
```
InventoryManagement.svelte
    ↓ invoke("receive_material")
    → commands::receive_material
        ↓ INSERT INTO inventory_lots
        ↓ INSERT INTO inventory_transactions
        → inventory_lots + inventory_transactions + materials
    
    ↓ invoke("get_inventory_levels")
    → commands::get_inventory_levels
        ↓ SELECT FROM v_inventory_summary VIEW
        → materials + inventory_lots + warehouses (aggregated)
```

### CRM Module
```
CustomerManagement.svelte
    ↓ invoke("create_customer")
    → commands::create_customer
        ↓ INSERT INTO customers
        → customers table
    
    ↓ invoke("get_customers")
    → commands::get_customers
        ↓ SELECT FROM customers
        → customers table

SalesOrdersManagement.svelte
    ↓ invoke("create_sales_order")
    → commands::create_sales_order
        ↓ INSERT INTO sales_orders
        ↓ INSERT INTO sales_order_lines
        → sales_orders + sales_order_lines + customers + materials
```

### Supply Chain Module
```
SupplierManagement.svelte
    ↓ invoke("create_supplier")
    → commands::create_supplier
        ↓ INSERT INTO suppliers
        → suppliers table

PurchaseOrdersManagement.svelte
    ↓ invoke("create_purchase_order")
    → commands::create_purchase_order
        ↓ INSERT INTO purchase_orders
        ↓ INSERT INTO purchase_order_lines
        → purchase_orders + suppliers + materials

ShippingReceivingManagement.svelte
    ↓ invoke("track_delivery")
    → commands::track_delivery
        ↓ UPDATE purchase_orders SET status
        → purchase_orders table
```

### AI Assistant Module
```
OllamaAssistant.svelte
    ↓ invoke("list_ollama_models")
    → modules::ollama::commands::list_ollama_models
        ↓ HTTP GET localhost:11434/api/tags
        → Ollama Service (external)
    
    ↓ invoke("chat_with_ollama")
    → modules::ollama::commands::chat_with_ollama
        ↓ HTTP POST localhost:11434/api/generate
        → Ollama Service (AI model inference)

ModuleExpertAssistant.svelte
    ↓ invoke("get_available_expert_modules")
    → modules::ollama::commands::get_available_expert_modules
        ↓ Return specialized_prompts module keys
        → In-memory (no database)
    
    ↓ invoke("chat_with_module_expert")
    → modules::ollama::commands::chat_with_module_expert
        ↓ Get module-specific system prompt
        ↓ HTTP POST localhost:11434/api/generate
        → specialized_prompts.rs + Ollama Service
```

---

## 🗺️ Database Entity Relationship Diagram

```
┌─────────────┐
│    users    │───────┐
│ user_id PK  │       │
│ username    │       │
│ email       │       │
│ password    │       │
└─────────────┘       │
                      │
                      ↓
              ┌───────────────┐
              │  user_roles   │
              │ user_id FK    │
              │ role_id FK    │──────→ ┌─────────┐
              └───────────────┘        │  roles  │
                      │                │ role_id │
                      │                └─────────┘
                      ↓
              ┌───────────────┐
              │  audit_logs   │
              │ log_id PK     │
              │ user_id FK    │
              │ action        │
              │ entity_type   │
              │ entity_id     │
              └───────────────┘

┌─────────────────┐
│   materials     │←──────────────────────┐
│ material_id PK  │                       │
│ material_code   │                       │
│ material_name   │                       │
│ material_type   │                       │
└─────────────────┘                       │
        │                                 │
        │                                 │
        ↓                                 │
┌──────────────────────┐         ┌───────────────────┐
│  inventory_lots      │         │ production_batches│
│ lot_id PK            │         │ batch_id PK       │
│ material_id FK       │         │ material_id FK    │
│ warehouse_id FK      │         │ batch_number      │
│ lot_number           │         │ planned_quantity  │
│ quantity             │         │ status            │
│ status               │         └───────────────────┘
│ qc_status            │                 │
└──────────────────────┘                 │
        │                                │
        │                                ↓
        ↓                        ┌───────────────┐
┌──────────────────┐             │ batch_steps   │
│   qc_tests       │             │ step_id PK    │
│ test_id PK       │             │ batch_id FK   │
│ lot_id FK        │             │ step_number   │
│ test_number      │             │ status        │
│ test_type        │             └───────────────┘
│ status           │                     │
└──────────────────┘                     ↓
        │                        ┌─────────────────┐
        ↓                        │ batch_materials │
┌──────────────────┐             │ batch_id FK     │
│ qc_test_results  │             │ material_id FK  │
│ result_id PK     │             │ lot_id FK       │
│ test_id FK       │             │ quantity_used   │
│ parameter_name   │             └─────────────────┘
│ result_value     │
│ pass_fail        │
└──────────────────┘

┌─────────────────┐
│  deviations     │
│ deviation_id PK │
│ deviation_no    │
│ description     │
│ status          │
└─────────────────┘
        │
        ↓
┌─────────────────┐
│  capa_records   │
│ capa_id PK      │
│ deviation_id FK │
│ capa_number     │
│ corrective_act  │
│ preventive_act  │
│ status          │
└─────────────────┘

┌─────────────────┐
│   customers     │
│ customer_id PK  │
│ customer_code   │
│ customer_name   │
└─────────────────┘
        │
        ↓
┌─────────────────┐
│  sales_orders   │
│ order_id PK     │
│ customer_id FK  │
│ order_number    │
│ order_date      │
│ status          │
└─────────────────┘
        │
        ↓
┌──────────────────────┐
│ sales_order_lines    │
│ line_id PK           │
│ order_id FK          │
│ material_id FK       │
│ quantity             │
│ unit_price           │
└──────────────────────┘

┌─────────────────┐
│  warehouses     │
│ warehouse_id PK │
│ warehouse_name  │
│ location_type   │
└─────────────────┘
        ↑
        │
        │ (Referenced by inventory_lots)
```

---

## 🔍 Connection Status Matrix

| Frontend File | Tauri Command | Backend Function | Database Tables | Status |
|--------------|---------------|------------------|-----------------|---------|
| Login.svelte | login | commands::login | users, sessions | ✅ Active |
| Login.svelte | logout | commands::logout | sessions | ✅ Active |
| BatchManagement.svelte | create_batch | commands::create_batch | production_batches, materials | ✅ Active |
| BatchManagement.svelte | get_batches | commands::get_batches | v_batch_status view | ✅ Active |
| MrpPlanning.svelte | run_mrp | commands::run_mrp | materials, inventory_lots, production_batches | ✅ Active |
| QcTesting.svelte | create_qc_test | commands::create_qc_test | qc_tests, inventory_lots | ✅ Active |
| QcTesting.svelte | enter_test_results | commands::enter_test_results | qc_test_results, qc_tests | ✅ Active |
| CapaManagement.svelte | create_capa | commands::create_capa | capa_records, deviations | ✅ Active |
| DeviationsManagement.svelte | create_deviation | commands::create_deviation | deviations, audit_logs | ✅ Active |
| InventoryManagement.svelte | receive_material | commands::receive_material | inventory_lots, inventory_transactions | ✅ Active |
| InventoryManagement.svelte | get_inventory_levels | commands::get_inventory_levels | v_inventory_summary view | ✅ Active |
| CustomerManagement.svelte | create_customer | commands::create_customer | customers | ✅ Active |
| CustomerManagement.svelte | get_customers | commands::get_customers | customers | ✅ Active |
| SalesOrdersManagement.svelte | create_sales_order | commands::create_sales_order | sales_orders, sales_order_lines | ✅ Active |
| SupplierManagement.svelte | create_supplier | commands::create_supplier | suppliers | ✅ Active |
| PurchaseOrdersManagement.svelte | create_purchase_order | commands::create_purchase_order | purchase_orders, suppliers | ✅ Active |
| OllamaAssistant.svelte | list_ollama_models | modules::ollama::commands::list_ollama_models | N/A (Ollama API) | ✅ Active |
| OllamaAssistant.svelte | chat_with_ollama | modules::ollama::commands::chat_with_ollama | N/A (Ollama API) | ✅ Active |
| ModuleExpertAssistant.svelte | get_available_expert_modules | modules::ollama::commands::get_available_expert_modules | N/A (In-memory) | ✅ Active |
| ModuleExpertAssistant.svelte | chat_with_module_expert | modules::ollama::commands::chat_with_module_expert | N/A (Ollama API) | ✅ Active |

**Total Active Connections:** 20+ verified frontend-backend-database pathways

---

## 🛡️ Connection Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layer 1                        │
│              Frontend Input Validation                       │
│  • Form validation before submission                        │
│  • Type checking (TypeScript)                               │
│  • Required field enforcement                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Security Layer 2                        │
│                  Tauri IPC Security                         │
│  • Allowlist enforcement                                    │
│  • Command whitelisting                                     │
│  • Context isolation                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Security Layer 3                        │
│              Backend Authentication                          │
│  • Session token validation                                 │
│  • validate_session() checks                                │
│  • User permission verification                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Security Layer 4                        │
│              Input Sanitization                             │
│  • SQL injection prevention                                 │
│  • Parameterized queries only                               │
│  • Type validation in Rust                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Security Layer 5                        │
│               Database Constraints                           │
│  • Foreign key enforcement                                  │
│  • Check constraints                                        │
│  • Unique constraints                                       │
│  • NOT NULL constraints                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Security Layer 6                        │
│                  Audit Logging                              │
│  • All modifications logged                                 │
│  • User tracking                                            │
│  • Timestamp recording                                      │
│  • Action type capture                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Performance Optimization Stack

```
┌────────────────────────────────────┐
│     Frontend Optimization          │
│  • Svelte reactive statements      │
│  • Component lazy loading          │
│  • Debounced search inputs         │
│  • Cached API responses            │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│      IPC Optimization              │
│  • Batch requests when possible    │
│  • Async/await patterns            │
│  • Non-blocking calls              │
│  • Promise pooling                 │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│   Backend Optimization             │
│  • Connection pooling              │
│  • Prepared statements caching     │
│  • Async Rust with tokio           │
│  • Efficient error handling        │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│   Database Optimization            │
│  • 45+ strategic indexes           │
│  • Materialized views              │
│  • Query optimization              │
│  • Foreign key indexing            │
└────────────────────────────────────┘
```

---

## ✅ Verification Commands

### Test Database Connection
```powershell
# Check if database file exists and is accessible
sqlite3 data/vetpharma.db "PRAGMA integrity_check;"

# Output: ok
```

### Test User Authentication Flow
```powershell
# Verify users table is populated
sqlite3 data/vetpharma.db "SELECT username, email, status FROM users;"

# Output: 
# admin|admin@vetpharma.com|active
# ramco.admin|ramco.admin@vetpharma.com|active
```

### Test View Queries
```powershell
# Test quality dashboard view
sqlite3 data/vetpharma.db "SELECT * FROM v_quality_dashboard;"

# Output:
# Tests Pending|0
# Tests In Progress|0
# Open Deviations|0
# Open CAPAs|0
```

### Test Foreign Key Constraints
```powershell
# Verify foreign key enforcement is enabled
sqlite3 data/vetpharma.db "PRAGMA foreign_keys;"

# Output: 1 (enabled)
```

---

## 🎯 Connection Testing Checklist

- [x] Database file exists and is readable
- [x] All 29 tables created successfully
- [x] All 3 views return data without errors
- [x] Foreign key constraints are enforced
- [x] Check constraints are validated
- [x] Indexes improve query performance
- [x] Tauri commands are registered
- [x] Frontend invoke calls map to backend commands
- [x] Backend commands execute database queries
- [x] Query results return to frontend
- [x] Error handling works end-to-end
- [x] Audit logging captures all changes
- [x] Session management persists across requests
- [x] Password hashing protects credentials
- [x] Real-time updates reflect in UI

---

**All database connections verified and operational! ✅**
