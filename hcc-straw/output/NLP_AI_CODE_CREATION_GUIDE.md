> **Historical record (May 2026).** Not the sovereign STRAW or Eduba path. Eduba is the append-only SQLite archival ledger in `straw-app/crates/eduba-ledger` and `straw-app/crates/eduba-server`. Build and run the sovereign desktop from `straw-app/` with `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. `apps/web` is the quarantined legacy Next.js tree. Current instructions: `straw-app/README.md`.

# NLP-AI-Code-Creation Integration - Implementation Guide

## Overview

This guide provides step-by-step instructions for leveraging the integrated NLP-AI-Code-Creation pipeline in the STRAW-stack application.

## Quick Start

### Prerequisites

1. **Ollama** installed and running (for local LLM):
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull a model
   ollama pull llama2
   
   # Start server
   ollama serve
   ```

2. **Build the sovereign STRAW app** from `straw-app/` with `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No npm install.

### First Use Flow

1. **Open NLP Chat Panel**
   - Click "AI Chat" in the sidebar
   - Type a local generation prompt. A sample that asks for a Python file is historical text, not the supported build path.
   - Attach a sample CSV file (optional)
   - Send message

2. **Switch to Code Generation**
   - Click "AI Code Generator" in the sidebar
   - The AI will analyze your NLP conversation
   - Review the generated `IntentPlan`
   - Click "Generate" if files aren't auto-generated

3. **Review Generated Files**
   - Click on each file to view content
   - Refine with instructions: "Add error handling for empty files"
   - Delete unwanted files with 🗑 button

4. **Create Workflow in Flow Canvas**
   - Click "Flow Canvas" in the sidebar
   - Create new flow: "CSV Processing Pipeline"
   - Add nodes: `read_file` → `csv_parse` → `filter` → `write_file`
   - Connect nodes and configure
   - Run the flow

## Detailed Workflows

### Workflow 1: Build a Web Application

**Goal:** Create a complete Svelte 5 application with authentication

#### Step 1: NLP Requirements Gathering

**In NLP Chat Panel:**

```
User: "I need a Svelte 5 application with the following features:
- User authentication (login/logout)
- Dashboard with statistics
- Data table with filtering
- Dark mode toggle

Here's a reference design I have: [uploads screenshot.png]

Technology preferences:
- Svelte 5 with runes
- Tailwind CSS for styling
- LocalStorage for auth (no backend yet)
- TypeScript"
```

**Attachments:**
- Upload design mockup (screenshot.png)
- Upload requirements document (if any)

**Expected AI Response:**
- Confirms understanding of requirements
- Suggests file structure
- Asks clarifying questions if needed

#### Step 2: Code Generation

**In Code Generation Panel:**

1. **Review IntentPlan**
   ```
   Title: "Auth Dashboard App"
   Type: web-app
   Language: typescript
   Framework: svelte
   Files:
   - src/app.svelte
   - src/routes/+page.svelte
   - src/lib/AuthProvider.svelte
   - src/lib/Dashboard.svelte
   - src/lib/DataTable.svelte
   - src/tailwind.config.js
   - src/app.css
   ```

2. **Click "Generate"**
   - AI generates all files
   - Progress bar shows status
   - Files appear in left panel

3. **Review and Refine**
   - Click each file to review code
   - Refine with specific instructions:
     ```
     "Add loading states to AuthProvider"
     "Make DataTable sortable"
     "Add responsive breakpoints to Dashboard"
     ```

#### Step 3: Create Execution Flow

**In Flow Canvas:**

1. **Create Flow Structure**
   ```
   Node 1: text_input
     - Config: "Building Svelte app with auth..."
     - Output: text
   
   Node 2: llm_prompt
     - Config:
       - Model: "llama2"
       - API URL: "http://localhost:11434/api/generate"
       - Temperature: 0.7
     - Input: prompt (from text_input)
     - Output: response
   
   Node 3: write_file
     - Config:
       - Path: "output/app_summary.md"
     - Input: text (from llm_prompt)
   ```

2. **Connect Nodes**
   - Drag from text_output → llm_prompt prompt input
   - Drag from llm_response → write_file text input

3. **Configure Node Parameters**
   - Select each node
   - Adjust config in right panel
   - Save flow as "App Generation Pipeline"

4. **Execute Flow**
   - Click "Run Flow" button
   - Observe execution in console
   - Check output file in `output/`

### Workflow 2: Data Processing Pipeline

**Goal:** Automate CSV data transformation and reporting

#### Step 1: Prepare Data in NLP

**In NLP Chat Panel:**

```
User: "I need to process sales data from these CSV files. 
Here's what I need:
- Filter out rows where status != 'completed'
- Group by product category
- Calculate total revenue per category
- Export to JSON

Sample data: [uploads sales_data.csv]"
```

**Analysis:**
- AI reads CSV content
- Confirms data structure
- Suggests processing steps

#### Step 2: Generate Processing Script

**In Code Generation Panel:**

1. **Prompt:** a historical sample only. Python is not the supported build path for STRAW or Eduba.

2. **Sample names from that old guide:**
   - `process_sales.py` - sample generated text
   - `config.json` - sample generated text
   - `requirements.txt` - sample generated text, not a STRAW or Eduba dependency

3. **Refinement:**
   ```
   "Add command-line arguments for input/output paths"
   "Add error handling for missing files"
   "Include a summary report section"
   ```

#### Step 3: Build Flow Automation

**In Flow Canvas:**

1. **Create Nodes:**
   ```
   Node 1: read_file
     - Config: Path = "data/sales_data.csv"
     - Output: text (file content)
   
   Node 2: csv_parse
     - Config:
       - Has header: true
       - Delimiter: ","
     - Input: csv (from read_file)
     - Output: table
   
   Node 3: transform (custom)
     - Config:
       - Operation: "filter"
       - Condition: "status == 'completed'"
     - Input: table (from csv_parse)
     - Output: table
   
   Node 4: transform (group_by)
     - Config:
       - Group by: "category"
       - Aggregate: "sum(revenue)"
     - Input: table (from transform)
     - Output: table
   
   Node 5: template
     - Config:
       - Template: JSON format string
     - Input: table (from group_by)
     - Output: text
   
   Node 6: write_file
     - Config:
       - Path: "output/summary.json"
     - Input: text (from template)
   ```

2. **Execute and Verify**
   - Run flow
   - Check `output/summary.json`
   - Validate results

### Workflow 3: Iterative Project Development

**Goal:** Build a complex project through multiple refinement cycles

#### Cycle 1: Initial Scaffolding

**NLP:**
```
"Create a Rust CLI tool that:
- Reads markdown files
- Converts to HTML
- Supports custom templates
- Outputs to specified directory"
```

**Code Gen:**
- Generate `src/main.rs`
- Generate `src/convert.rs`
- Generate `Cargo.toml`

#### Cycle 2: Feature Enhancement

**NLP:**
```
"This is good, but I also need:
- Support for code syntax highlighting
- Table of contents generation
- Custom CSS theming"
```

**Code Gen:**
- Refine `src/convert.rs`: Add syntax highlighting
- Add `src/toc.rs`: Table of contents
- Add `src/themes/`: Theme files

#### Cycle 3: Performance Optimization

**NLP:**
```
"The tool is slow on large files. Optimize it by:
- Using parallel processing for multiple files
- Streaming output instead of buffering
- Caching parsed markdown"
```

**Code Gen:**
- Refine `src/main.rs`: Add parallel processing
- Update `Cargo.toml`: Add `rayon` dependency
- Add `src/cache.rs`: Caching logic

#### Cycle 4: Flow Automation

**Flow Canvas:**
```
Node 1: text_input (batch mode)
  - Config: "processing_batch"
  
Node 2: read_file (manifest)
  - Config: Path = "input/manifest.txt"
  
Node 3: transform (split_lines)
  - Input: text (from read_file)
  - Output: list
  
Node 4: llm_prompt (status check)
  - Input: prompt (from split_lines)
  - Output: response
  
Node 5: write_file (log)
  - Config: Path = "output/processing.log"
  - Input: text (from response)
```

## Advanced Usage

### Pattern 1: Cross-Panel State Sharing

**Scenario:** Pass NLP conversation context to code generation

**Implementation:**

```typescript
// In CodeGenerationPanel.svelte
$effect(() => {
  const messages = get(nlpMessages);
  const attachments = get(nlpAttachments);
  
  // Pre-process attachments into context string
  const context = attachments.map(att => {
    if (att.kind === 'document') {
      return `Document: ${att.name}\nContent:\n${att.data}`;
    }
    if (att.kind === 'image') {
      return `Image: ${att.name} (base64 data)`;
    }
    return '';
  }).join('\n\n');
  
  // Pass to code generation prompt
  codeGenPrompt.set(`Context from NLP:\n${context}\n\nUser Request:`);
});
```

### Pattern 2: Flow Node Generation from Code

**Scenario:** Generated code includes flow node implementation

**Example:**

```rust
// Generated in code gen: src-nodes/ai_processor.rs
use tauri::Command;

#[derive(Serialize)]
struct AiProcessorOutput {
    processed_text: String,
    confidence: f64,
}

#[command]
fn ai_processor(text: String) -> Result<AiProcessorOutput, String> {
    // Call Ollama API
    let response = call_ollama(&text)?;
    
    Ok(AiProcessorOutput {
        processed_text: response.text,
        confidence: response.confidence,
    })
}
```

**Usage in Flow:**
1. Add `ai_processor` node to canvas
2. Configure API endpoint
3. Connect to other nodes
4. Execute flow

### Pattern 3: Real-time Progress Updates

**Scenario:** Show generation progress to user

**Implementation:**

```typescript
// In CodeGenPanel.svelte
$effect(() => {
  const unsubscribe = codeGenProgress.subscribe(progress => {
    if (progress.label) {
      // Update UI with progress
      progressLabel.set(progress.label);
      progressBar.set((progress.current / progress.total) * 100);
    }
  });
  
  return unsubscribe;
});
```

### Pattern 4: Error Recovery Workflow

**Scenario:** Handle failed generation gracefully

**Flow:**

```
Node 1: llm_prompt (generation attempt)
  - Input: prompt
  - Output: response (or error)

Node 2: conditional (error check)
  - Condition: response contains "error"
  - true_branch: retry with different parameters
  - false_branch: proceed to next step

Node 3: write_file (error log)
  - Config: Path = "output/errors.log"
  - Input: error details
```

## Debugging Tips

### Common Issues and Solutions

#### Issue 1: NLP Messages Not Appearing in Code Gen

**Symptom:** Code generation panel doesn't show conversation context

**Solution:**
1. Check store subscription in `CodeGenPanel.svelte`
2. Verify `nlpMessages` is populated
3. Clear browser cache and reload

#### Issue 2: Code Generation Fails

**Symptom:** "Generation failed" error

**Solution:**
1. Check Ollama is running: `ollama list`
2. Verify model is available: `ollama pull llama2`
3. Test API: `curl http://localhost:11434/api/generate -d '{"model":"llama2","prompt":"test"}'`
4. Check browser console for errors

#### Issue 3: Flow Node Not Found

**Symptom:** "Unknown node kind" error

**Solution:**
1. Verify node is registered in `src-tauri/src/nodes/mod.rs`
2. Check `Cargo.toml` dependencies
3. Rebuild: `cargo build --release`
4. Restart Tauri app

#### Issue 4: File Permissions Error

**Symptom:** Cannot write to output directory

**Solution:**
1. Check `tauri.conf.json` file permissions
2. Verify output directory exists
3. Run app with proper permissions
4. Check `capabilities/default.json`

## Performance Optimization

### Tips for Large Projects

1. **Chunk Code Generation**
   - Generate files in batches
   - Use `existingFiles` for incremental updates
   - Avoid generating entire project at once

2. **Lazy Load Flows**
   - Load flow nodes on-demand
   - Cache frequently used nodes
   - Use pagination for large node lists

3. **Optimize NLP Context**
   - Summarize long conversations
   - Remove old messages from context
   - Use attachment metadata instead of full content

### Resource Usage

| Component | Memory | CPU | Notes |
|-----------|--------|-----|-------|
| NLP Chat | ~50MB | Low | Depends on attachment size |
| Code Gen | ~100MB | High | During generation |
| Flow Canvas | ~30MB | Low | Static rendering |
| Flow Execution | Variable | Variable | Depends on nodes |

## Security Considerations

### Input Validation

- **Validate file uploads** before processing
- **Sanitize user input** in NLP messages
- **Check file paths** to prevent directory traversal
- **Limit attachment size** (max 10MB recommended)

### API Security

- **Use environment variables** for API keys
- **Validate Ollama URLs** (allow localhost only by default)
- **Implement rate limiting** for AI calls
- **Log all AI interactions** for audit trail

### File System Access

- **Restrict output directory** to `output/` subfolder
- **Validate all file paths** before write
- **Use absolute paths** to prevent path confusion
- **Backup important files** before overwriting

## Next Steps

### Learning Path

1. **Beginner:**
   - Read this guide
   - Try Workflow 1 (Web App)
   - Experiment with NLP chat
   - Review generated code

2. **Intermediate:**
   - Build Workflow 2 (Data Pipeline)
   - Create custom flow nodes
   - Integrate external APIs
   - Add error handling

3. **Advanced:**
   - Extend with WASM nodes
   - Build custom Tauri commands
   - Optimize performance
   - Create production deployments

### Resources

- **[SKILL.md](../SKILL.md)** - Full skill documentation
- **STRAY-stack README** - App architecture
- **Tauri Docs** - Backend development
- **Svelte 5 Docs** - Frontend development

---

**Last Updated:** May 23, 2026  
**Version:** 1.0.0  
**Maintained by:** Hammurabi Coding Company
