> **Historical record (May 2026).** Not the sovereign STRAW or Eduba path. Eduba is the append-only SQLite archival ledger in `straw-app/crates/eduba-ledger` and `straw-app/crates/eduba-server`. Build and run the sovereign desktop from `straw-app/` with `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. `apps/web` is the quarantined legacy Next.js tree. Current instructions: `straw-app/README.md`.

# Straw Flow - Quick Node Reference

## 🆕 New Nodes

### 1. Text Input (I/O - Blue)
**Purpose**: Provide static text as a flow source

**Config**:
- `text` (textarea) - Static text content (default: "Hello, World!")

**Output**: `text`

**Example Use Case**: 
- Start a flow with sample data
- Provide constant values to templates

---

### 2. Parse CSV (Text - Green)
**Purpose**: Convert CSV text into a structured table

**Input**: `csv`

**Config**:
- `delimiter` (select) - , ; or tab (default: ,)
- `has_header` (bool) - First row is headers (default: true)

**Output**: `table`

**Example Use Case**:
```csv
name,age,city
Alice,30,New York
Bob,25,Los Angeles
```

---

### 3. Join Text (Text - Green)
**Purpose**: Combine a list of text items into one string

**Input**: `list`

**Config**:
- `separator` (text) - String between items (default: newline)

**Output**: `text`

**Example Use Case**:
- Rejoin filtered lines
- Combine multi-line results

---

### 4. Conditional (Logic - Orange)
**Purpose**: Branch flow based on boolean condition

**Input**: `condition`

**Outputs**:
- `true_branch` - Passed through if condition is true
- `false_branch` - Passed through if condition is false

**Logic**:
- `true`/`false` strings → boolean
- `1`/`0` numbers → boolean
- Any non-zero number → true

**Example Use Case**:
```
text_input → filter → conditional → (true_branch | false_branch) → separate nodes
```

---

### 5. LLM Prompt (AI - Purple)
**Purpose**: Send prompt to local LLM (Ollama) or API

**Input**: `prompt`

**Config**:
- `model` (text) - Model name (default: "llama2")
- `system_prompt` (textarea) - System instructions (default: "You are a helpful assistant.")
- `api_url` (text) - API endpoint (default: "http://localhost:11434/api/generate")
- `temperature` (number) - Creativity 0-1 (default: 0.7)

**Output**: `response`

**Example Use Case**:
```
text_input → llm_prompt → write_file
```

**Setup**:
1. Install Ollama: https://ollama.ai
2. Pull model: `ollama pull llama2`
3. Run: `ollama serve`
4. Use in Straw Flow!

---

## 📊 Complete Node List (11 Total)

| Category | Node | Input | Output |
|----------|------|-------|--------|
| **I/O** | read_file | - | content |
| **I/O** | write_file | content | path |
| **I/O** | **text_input** | - | text |
| **I/O** | http_request | body | response, status |
| **Text** | transform | text | result |
| **Text** | template | vars | output |
| **Text** | **csv_parse** | csv | table |
| **Text** | **join_text** | list | text |
| **Logic** | filter | input | passed, rejected |
| **Logic** | **conditional** | condition | true_branch, false_branch |
| **AI** | **llm_prompt** | prompt | response |

---

## 🎯 Example Flows

### Flow 1: Text Processing Pipeline
```
text_input (static text)
    ↓
transform (split_lines)
    ↓
filter (contains "apple")
    ↓
join_text
    ↓
write_file
```

### Flow 2: CSV Analysis
```
read_file (data.csv)
    ↓
csv_parse
    ↓
transform (word_count on each row)
    ↓
filter (longer_than 5)
    ↓
write_file
```

### Flow 3: AI Content Generator
```
text_input (prompt)
    ↓
llm_prompt (model: "llama2")
    ↓
transform (uppercase)
    ↓
write_file
```

### Flow 4: Conditional Router
```
conditional (from text_input or filter)
    ├─ true_branch → write_file (approved)
    └─ false_branch → write_file (rejected)
```

---

## 💡 Tips

1. **text_input** - Great for testing flows without needing files
2. **csv_parse** - Works with any CSV (comma, semicolon, tab)
3. **join_text** - Use separator `\n` for multi-line output
4. **conditional** - Type coerces booleans intelligently
5. **llm_prompt** - Requires Ollama running locally

---

## 🔄 Migration from Old Version

**Before**: 6 nodes (no text_input, csv_parse, join_text, conditional, llm_prompt)

**After**: 11 nodes. The heading that said 14 counted the same 11 rows.

**Old flows**: the current engine does not import the previous graph format. See `straw-app/README.md`. `output/historical/demo-nlp-to-code-flow.json` is rejected. `output/current-text-transform-graph.json` is a current graph.

---

**Last Updated**: May 23, 2026
