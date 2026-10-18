# ──────────────────────────────────────────────────────────────
# SUE EXTENSION SKILL
# ──────────────────────────────────────────────────────────────

**Purpose:** Create, configure, and manage the HCC Browser Sidebar Extension

**When to use:**
- User wants to build a browser extension sidebar for HCC
- User needs to integrate Leptos WASM with Chrome/Firefox
- User wants sovereign AI chat, cloud status, project management in browser
- User asks to "create HCC sidebar extension" or "build browser extension"

## WORKFLOW

### 1. Initialize Workspace
```bash
# Run setup script (if not already done)
bash setup.sh

# OR manually create workspace structure
mkdir -p sue/{sue-core/src,sue-view/src,icons,mcp,skills}
```

### 2. Build Extension
```bash
# Development build
wasm-pack build --dev --target web --watch

# Production build
wasm-pack build --release --target web

# Bundle with webpack (optional)
npm run bundle
```

### 3. Load in Browser

**Chrome:**
1. Navigate to: `chrome://extensions`
2. Enable: "Developer mode" (top right)
3. Click: "Load unpacked"
4. Select: `./pkg/` or `./dist/`
5. Click extension icon in toolbar
6. Sidebar appears on right side

**Firefox:**
1. Navigate to: `about:debugging#/runtime/this-firefox`
2. Click: "Load Temporary Add-on"
3. Select: `manifest.json` from project root
4. Sidebar appears in browser action menu

### 4. Connect to Local Services

**Start HCC API:**
```bash
cd /SUE/hcc-api
cargo run
# Runs on http://localhost:8080
```

**Start Ollama:**
```bash
# Pull model (if not already pulled)
ollama pull qwen3-coder
ollama pull qwen3-embedding:8b

# Start server
ollama serve
# Runs on http://localhost:11434
```

### 5. Test Features

**Dashboard:**
- View project count
- Check cloud storage status
- See recent activity

**AI Chat:**
- Send messages to local Ollama
- Receive AI responses
- View chat history

**Projects:**
- Create new projects
- List all projects
- Delete projects

**Cloud Status:**
- Koofr: Connected ✓
- IceDrive: Mounted ✓
- Degoo: Archive ✓

## FILES TO MODIFY

### `manifest.json`
- Change `name`, `version`, `description`
- Add/remove permissions if needed
- Update icon paths

### `sue-view/src/main.rs`
- Add new Leptos components
- Modify UI styles
- Add new API endpoints

### `styles.css`
- Customize dark theme colors
- Adjust sidebar width
- Modify responsive breakpoints

### `background.js`
- Add new storage keys
- Extend message handlers
- Modify service worker behavior

### `.env`
- Set local API endpoints
- Configure Ollama URL
- Add Koofr/Venice credentials (optional)

## COMMON TASKS

### Add New View
1. Create new component in `sue-view/src/main.rs`
2. Add route in `<Routes>` section
3. Add navigation button in `<nav>` section
4. Export component from module

### Connect to New API
1. Add endpoint to `fetch()` call in main.rs
2. Update `manifest.json` host_permissions if external
3. Test with `curl http://localhost:PORT/api/endpoint`

### Customize Theme
1. Edit `:root` variables in `styles.css`
2. Change `--bg-primary`, `--text-primary`, etc.
3. Modify component styles

### Deploy to Store
1. Run `npm run package` for production build
2. Zip `dist/` folder
3. Upload to Chrome Web Store / Firefox Add-ons
4. Fill store listing, privacy policy
5. Submit for review

## ERROR PATTERNS

### "WASM bundle not loading"
- Check `web_accessible_resources` in `manifest.json`
- Verify WASM file exists: `ls pkg/hcc_sidebar_view_bg.wasm`
- Ensure paths match in `manifest.json`

### "Storage access denied"
- Browser blocking in incognito mode
- Add to `manifest.json`:
```json
{
  "incognito": "split"
}
```

### "CORS errors on API calls"
- HCC API must allow extension origin
- In `hcc-api/src/main.rs`, add:
```rust
.layer(CorsLayer::permissive()) // or configure specific origins
```

### "Sidebar not appearing"
- Verify `manifest_version: 3`
- Check `sidebar_action` section in `manifest.json`
- Ensure icon files exist at specified paths

## DEBUGGING

### View Extension Logs
```bash
# Chrome background page
chrome://extensions → Inspect views → background page

# Sidebar console
Right-click sidebar → Inspect → Console tab
```

### WASM Debugging
```bash
# Enable debug symbols
wasm-pack build --dev --target web -- --features hydrate

# View logs in browser console
console.log("Debug message");
```

### Network Requests
```bash
# Monitor HCC API calls
cd /SUE/hcc-api
cargo run  # See logs in terminal

# Monitor Ollama calls
ollama serve  # See logs in terminal
```

## SECURITY CHECKLIST

- [x] Zero external telemetry
- [x] Vault key stored in extension storage only
- [x] No localStorage access from content script
- [x] No document.cookie access
- [x] No IndexedDB access
- [x] No sendBeacon calls
- [x] Only localhost endpoints (11434, 8080)
- [x] CORS enforced to localhost only
- [x] Extension sandbox isolates all code

## INTEGRATION POINTS

### HCC Web (Leptos)
- Shared `Project` type
- Reuse `#[server]` functions via REST
- Same SQLite schema

### HCC Desktop (Dioxus)
- Shared core libraries
- Same `hcc-core` patterns
- Optional file sync

### HCC API (Axum)
- Calls `http://localhost:8080/api/v1/*`
- Session cookies via `HttpOnly`
- Same authentication

### AI Stack (Ollama/Venice)
- Connects to `http://localhost:11434`
- Uses `qwen3-embedding:8b` for RAG
- Venice API via stored key

### Cloud Storage (Koofr/IceDrive/Degoo)
- Koofr REST API from browser
- IceDrive via local rclone mount
- Degoo upload to local path

## EXTENSION API REFERENCE

### chrome.storage.local
```javascript
// Get
chrome.storage.local.get('key', (result) => console.log(result.key));

// Set
chrome.storage.local.set({ key: 'value' }, () => console.log('Saved'));

// Clear
chrome.storage.local.clear(() => console.log('Cleared'));
```

### chrome.runtime.sendMessage
```javascript
// Send to background
chrome.runtime.sendMessage({ type: 'STORE_GET', key: 'vault_key' }, (response) => {
    console.log(response);
});
```

### chrome.tabs.query
```javascript
// Get current tab
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    console.log(tab.url);
});
```

## PERFORMANCE OPTIMIZATION

### WASM Size
- Use `wasm-pack build --release` for production
- Enable LTO: `lto = true` in `Cargo.toml`
- Strip symbols: `strip = true` in profile

### Memory Usage
- Limit chat history to 50 messages
- Lazy-load images/components
- Use `ResizeObserver` for sidebar resizing

### Load Time
- Preload WASM in background
- Defer non-critical JS
- Cache API responses

## NEXT ACTIONS

1. **Customize UI** — Modify `styles.css` for branding
2. **Add Features** — Extend Leptos components
3. **Test Locally** — Load in Chrome/Firefox
4. **Deploy** — Submit to Chrome Web Store / Firefox Add-ons
5. **Document** — Update README.md with usage examples

---

*Skill created by R.K. Girdhari | Hammurabi Coding Company*
*"Keep the faith, the good exists."*

