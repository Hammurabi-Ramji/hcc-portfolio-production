> **Historical record (May 2026).** Not the sovereign STRAW or Eduba path. Eduba is the append-only SQLite archival ledger in `straw-app/crates/eduba-ledger` and `straw-app/crates/eduba-server`. Build and run the sovereign desktop from `straw-app/` with `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. `apps/web` is the quarantined legacy Next.js tree. Current instructions: `straw-app/README.md`.

# NLP-AI-Code-Creation - Quick Reference Card

## 🎯 Three-Panel Interface

```
┌─────────────────┬─────────────────┬─────────────────┐
│  NLP Chat       │  Code Gen       │  Flow Canvas    │
│  (Multimodal)   │  (Creator)      │  (Executor)     │
├─────────────────┼─────────────────┼─────────────────┤
│ • Chat with AI  │ • Generate      │ • Visual nodes  │
│ • Attach files  │   code files    │ • Connect edges │
│ • Upload images │ • Refine code   │ • Configure     │
│ • Fetch URLs    │ • View diff     │ • Execute       │
│ • Record audio  │ • Plan project  │ • Save flows    │
└─────────────────┴─────────────────┴─────────────────┘
```

## ⚡ Quick Commands

### Start Application
```powershell
cd straw-app
cargo tauri dev
```

### Ollama Setup
```bash
# Install
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama2

# Run server
ollama serve
```

## 📝 Workflow Cheat Sheet

### 1️⃣ Build Web App
```
NLP: "Build Svelte 5 app with auth"
    ↑ Attach design screenshot
    ↓
Code Gen: Review plan → Generate files → Refine
    ↓
Flow: read_file → transform → write_file
    ↓
Result: Working app + automation pipeline
```

### 2️⃣ Process Data
```
NLP: Upload CSV + "Process this data"
    ↓
Code Gen: historical sample only; Python and Node.js are not the build path
    ↓
Flow: csv_parse → filter → join → write
    ↓
Result: Automated data pipeline
```

### 3️⃣ Create Tool
```
NLP: "CLI tool requirements"
    ↓
Code Gen: Rust/TS code + Cargo.toml
    ↓
Flow: manifest read → parallel process → log
    ↓
Result: Production-ready CLI
```

## 🎨 Node Types

### I/O (Blue)
- `read_file` - Read file content
- `write_file` - Write content to file
- `text_input` - Static text source
- `http_request` - HTTP API calls

### Text (Green)
- `transform` - String operations (split, join, replace)
- `template` - String templating
- `csv_parse` - CSV to table
- `join_text` - List to string

### Logic (Orange)
- `filter` - Split into passed/rejected
- `conditional` - If/else branching

### AI (Purple)
- `llm_prompt` - Ollama AI integration

## 🔧 Configuration Quick Reference

### NLP Chat Settings
```
Model: llama3.2
API URL: http://127.0.0.1:11434/api/generate
Temperature: 0.7 stored as the string "0.7"
Attachments: UTF-8 text and JSON only
```

### Code Gen Settings
```
Output Dir: C:\hcc-straw\output
Model: llama2 (default)
Temperature: 0.7
System Prompt: "You are an expert software developer..."
```

### Flow Node Config Examples

**text_input:**
```json
{
  "text": "Hello, World!"
}
```

**csv_parse:**
```json
{
  "delimiter": ",",
  "has_header": true
}
```

**conditional:** no config object. Connect the `condition` input. The selected branch carries the value; the other branch is skipped.

**llm_prompt:**
```json
{
  "model": "llama3.2",
  "api_url": "http://127.0.0.1:11434/api/generate",
  "temperature": "0.7",
  "system_prompt": "Be helpful and concise"
}
```

## 🎯 Common Patterns

### Pattern A: File Processing Pipeline
```
read_file (input.txt)
    ↓
transform (split_lines)
    ↓
filter (condition)
    ↓
join_text (separator: ", ")
    ↓
write_file (output.txt)
```

### Pattern B: AI-Augmented Workflow
```
text_input (user request)
    ↓
llm_prompt (analyze)
    ↓
conditional (decision)
    ↓
write_file (result)
```

### Pattern C: Data Transformation
```
read_file (data.csv)
    ↓
csv_parse (parse)
    ↓
transform (filter rows)
    ↓
template (format JSON)
    ↓
write_file (output.json)
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Ollama not running" | Run `ollama serve` |
| "Unknown node kind" | Rebuild: `cargo build --release` |
| "Cannot write file" | Check `tauri.conf.json` permissions |
| "Store not updating" | Check Svelte 5 runes syntax |
| "Flow not executing" | Verify all inputs connected |

## 📚 Key Files

### Frontend (Svelte)
```
src/lib/
├── NlpChatPanel.svelte     # AI chat UI
├── CodeGenPanel.svelte     # Code gen UI
├── FlowCanvas.svelte       # Flow editor
├── store.ts                # Reactive state
├── types.ts                # TypeScript types
└── tauri.ts                # Tauri commands
```

### Backend (Rust)
```
src-tauri/src/
├── nodes/
│   ├── mod.rs              # Node registry
│   ├── read_file.rs        # File reader
│   ├── write_file.rs       # File writer
│   ├── csv_parse.rs        # CSV parser
│   └── ...                 # All node types
└── commands.rs             # API endpoints
```

### Output
```
output/
├── NLP_AI_CODE_CREATION_GUIDE.md  # This guide
├── QUICK_REFERENCE.md              # This file
├── COMPLETION_SUMMARY.md           # Project status
└── [generated files...]            # User creations
```

## 🚀 Pro Tips

1. **Start Simple** - Build basic flows first, then add complexity
2. **Test Incrementally** - Validate each node before running full flow
3. **Use Templates** - Save frequently-used configurations
4. **Iterate with NLP** - Chat about issues, then refine in Code Gen
5. **Version Flows** - Save multiple versions for experimentation

## 🎓 Learning Resources

- **[NLP_AI_CODE_CREATION_GUIDE.md](./NLP_AI_CODE_CREATION_GUIDE.md)** - Full implementation guide
- **[COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)** - Project status
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - How to test nodes
- **[SKILL.md](skill:nlp-ai-code-creation)** - Skill documentation

---

**Quick Start Command:**
```powershell
cd straw-app
cargo tauri dev
```

Wire fields are camelCase. A current graph sample is `current-text-transform-graph.json`. The May demo is archived under `historical/` and does not load.

**Need Help?** Check `[NLP_AI_CODE_CREATION_GUIDE.md](./NLP_AI_CODE_CREATION_GUIDE.md)` for detailed workflows.

**Version:** 1.0.0 | **Updated:** May 23, 2026
