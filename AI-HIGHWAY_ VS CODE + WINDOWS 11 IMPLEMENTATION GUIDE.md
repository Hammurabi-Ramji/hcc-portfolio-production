# AI-HIGHWAY: VS CODE + WINDOWS 11 IMPLEMENTATION GUIDE
## Step-by-Step Build Instructions from Scratch

**Target Platform:** Windows 11 Professional
**IDE:** Visual Studio Code
**Development Model:** Solo Developer
**Timeline:** 11 weeks (full-time) or 22 weeks (part-time)

---

### 1. ENVIRONMENT SETUP (WEEK 1)

#### A. Terminal & Shell
*   Install **PowerShell 7 (Core)**.
*   Configure **Windows Terminal** as the default terminal emulator.
*   Set execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`.

#### B. Core Tools
*   Install **Git for Windows**.
*   Install **Node.js (LTS)** and **pnpm**.
*   Install **Rust** via rustup.
*   Install **Python 3.11+**.

#### C. IDE Configuration
*   Install **Visual Studio Code**.
*   Essential Extensions:
    *   Rust Analyzer
    *   Python (Microsoft)
    *   ESLint / Prettier
    *   Tauri
    *   SQLite Viewer

---

### 2. LOCAL AI NODE (WEEK 2)

#### A. Ollama Installation
*   Download and install **Ollama for Windows**.
*   Pull essential models:
    *   `ollama pull llama3` (General purpose)
    *   `ollama pull codellama` (Coding)
    *   `ollama pull nomic-embed-text` (Embeddings)

#### B. API Access
*   Verify local API: `curl http://localhost:11434/api/tags`.
*   Configure environment variables for local LLM access.

---

### 3. PROJECT SCAFFOLDING (WEEK 3)

#### A. The AI Highway CLI
*   Create a PowerShell module for automated project creation.
*   Template types: `web-static`, `web-db-user`, `mobile-app`.

#### B. Database Initialization
*   Setup **SQLite** with **Drizzle ORM**.
*   Define base schemas for user auth and project management.

---

### 4. CORE MODULE DEVELOPMENT (WEEKS 4-8)

*   **Week 4:** RAMemory (Vector store integration).
*   **Week 5:** RamGenie (Prompt engineering engine).
*   **Week 6:** R@Made (UI component fabricator).
*   **Week 7:** B-Mad (Audit and security gates).
*   **Week 8:** RamGames (Simulation and testing).

---

### 5. INTEGRATION & DEPLOYMENT (WEEKS 9-11)

#### A. Millennium Falcon Integration
*   Convert standalone modules into MCP-compliant services.
*   Establish the "Unified Cockpit" UI in Tauri.

#### B. Production Deployment
*   Setup **ZAP Hosting** vServer.
*   Configure **NSSM** for background service management.
*   Deploy via automated PowerShell scripts.

---

**"The jump to hyperspace is only a command away."**
