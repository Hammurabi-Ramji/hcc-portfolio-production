<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get, writable, type Writable } from "svelte/store";
  import {
    codeGenStage, codeGenPlan, codeGenFiles, codeGenActiveFile,
    codeGenResult, codeGenError, codeGenOutputDir, codeGenPrompt,
    codeGenProgress, codeGenModel, codeGenApiUrl, codeGenSystemPrompt, codeGenTemperature,
  } from "./store";
  import { commands } from "./tauri";
  import type {
    GenStage, CodeFile, IntentPlan, CreationRequest,
    RefinementRequest, FileLanguage,
  } from "./types";

  // ── Local state ────────────────────────────────────────────────────────────
  let promptInput = $state("");
  let outputDir = $state("C:\\hcc-straw\\output");
  let model = $state("llama2");
  let apiUrl = $state("http://localhost:11434/api/generate");
  let temperature = $state(0.7);
  let showPlan = $state(false);
  let selectedFile = $state<CodeFile | null>(null);
  let refineInstruction = $state("");
  let fileTreeEl: HTMLDivElement;

  // ── Store subscriptions ───────────────────────────────────────────────────
  let stage = $state<"idle" | "parsing_intent" | "planning" | "generating" | "refining" | "writing" | "complete" | "error">("idle");
  let plan = $state<IntentPlan | null>(null);
  let files = $state<CodeFile[]>([]);
  let result = $state<CreationResult | null>(null);
  let error = $state<string | null>(null);
  let progress = $state<{ current: number; total: number; label: string }>({
    current: 0, total: 0, label: "",
  });
  let prompt = $state("");

  $effect(() => {
    const unsub1 = codeGenStage.subscribe(v => {
      stage = v as any;
    });
    const unsub2 = codeGenPlan.subscribe(v => { plan = v; });
    const unsub3 = codeGenFiles.subscribe(v => { files = v; });
    const unsub4 = codeGenResult.subscribe(v => { result = v; });
    const unsub5 = codeGenError.subscribe(v => { error = v; });
    const unsub6 = codeGenOutputDir.subscribe(v => { outputDir = v; });
    const unsub7 = codeGenPrompt.subscribe(v => { prompt = v; });
    const unsub8 = codeGenProgress.subscribe(v => { progress = v; });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); };
  });

  onMount(() => {
    // Auto-scroll to bottom of file list
    fileTreeEl?.scrollTo({ top: fileTreeEl.scrollHeight });
  });

  function newId() { return crypto.randomUUID(); }
  function toast(msg: string, type: "error" | "success" | "info" = "info") {
    window.dispatchEvent(new CustomEvent("addToast", { detail: { message: msg, type } }));
  }

  function getLanguageIcon(lang: FileLanguage): string {
    return lang === "rust" ? "🦀" : lang === "typescript" ? "🔷" : lang === "svelte" ? "🎭" : lang === "javascript" ? "JS" : lang === "python" ? "🐍" : lang === "html" ? "🌐" : lang === "css" ? "🎨" : "📄";
  }

  // ── Generate Code ───────────────────────────────────────────────────────────
  async function generate() {
    if (!prompt.trim()) return;

    codeGenStage.set("parsing_intent");
    codeGenError.set(null);
    progress = { current: 1, total: 5, label: "Analyzing request..." };

    try {
      const request: CreationRequest = {
        user_prompt: prompt,
        model: get(codeGenModel),
        api_url: get(codeGenApiUrl),
        temperature: get(codeGenTemperature),
        system_prompt: get(codeGenSystemPrompt),
        output_dir: outputDir,
        existing_files: files.length > 0 ? files : undefined,
      };

      progress = { current: 2, total: 5, label: "Generating files..." };
      codeGenStage.set("generating");

      const res = await commands.generateCode(request);

      progress = { current: 5, total: 5, label: "Done" };
      codeGenFiles.set(res.files);
      codeGenPlan.set(res.plan);
      codeGenResult.set(res);
      codeGenStage.set("complete");

      toast(`Generated ${res.files.length} files in ${res.elapsed_ms}ms`, "success");
    } catch (err) {
      codeGenError.set(String(err));
      codeGenStage.set("error");
      toast(`Generation failed: ${String(err)}`, "error");
    }
  }

  // ── Refine File ─────────────────────────────────────────────────────────────
  async function refine(file: CodeFile) {
    if (!refineInstruction.trim()) return;

    codeGenStage.set("refining");
    progress = { current: 1, total: 1, label: "Refining..." };

    try {
      const request: RefinementRequest = {
        file_path: file.path,
        instruction: refineInstruction,
        model: model,
        api_url: apiUrl,
        temperature: temperature,
      };

      const res = await commands.refineFile(request);

      // Update file content
      files = files.map(f =>
        f.id === file.id ? { ...f, content: res.new_content, isDirty: true } : f
      );
      codeGenFiles.set(files);
      refineInstruction = "";

      toast(`Refined ${file.path}`, "success");
    } catch (err) {
      toast(`Refinement failed: ${String(err)}`, "error");
    }
  }

  function setSelectedFile(file: CodeFile) {
    selectedFile = file;
    codeGenActiveFile.set(file.id);
  }

  function deleteFile(fileId: string) {
    files = files.filter(f => f.id !== fileId);
    codeGenFiles.set(files);
    if (selectedFile?.id === fileId) selectedFile = null;
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function getFileLanguage(file: CodeFile): FileLanguage {
    const langMap: Record<string, FileLanguage> = {
      ".rs": "rust", ".ts": "typescript", ".tsx": "typescript", ".svelte": "svelte",
      ".js": "javascript", ".jsx": "javascript", ".py": "python",
      ".html": "html", ".css": "css", ".json": "json", ".toml": "toml",
      ".md": "markdown", ".sql": "sql", ".sh": "shell",
    };
    const ext = file.path.substring(file.path.lastIndexOf("."));
    return langMap[ext] || "text";
  }

  function clearAll() {
    codeGenFiles.set([]);
    codeGenResult.set(null);
    codeGenPlan.set(null);
    prompt = "";
    selectedFile = null;
  }
</script>

<div class="codegen-root">
  <!-- ── Header ──────────────────────────────────────────────────────── -->
  <div class="header">
    <div class="header-left">
      <span class="icon">⚙</span>
      <span class="title">AI Code Generator</span>
      {#if result}
        <span class="project-name">{result.projectName}</span>
      {/if}
    </div>
    <div class="header-right">
      {#if files.length > 0}
        <button class="hbtn" onclick={clearAll} title="Clear all">🗑</button>
      {/if}
      <button class="hbtn" class:active={showPlan} onclick={() => showPlan = !showPlan}>📋 Plan</button>
    </div>
  </div>

  <!-- ── Plan Panel ─────────────────────────────────────────────────── -->
  {#if plan && (showPlan || files.length === 0)}
    <div class="plan-panel">
      <div class="plan-title">{plan.title}</div>
      <p class="plan-desc">{plan.description}</p>
      <div class="plan-meta">
        <span>Type: {plan.project_type}</span>
        <span>Language: {plan.language}</span>
        {#if plan.framework}<span>Framework: {plan.framework}</span>{/if}
        <span>{plan.file_list.length} files</span>
      </div>
      <div class="plan-steps">
        {#each plan.steps as step, i (i)}
          <div class="step">{i + 1}. {step}</div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ── Progress ───────────────────────────────────────────────────── -->
  {#if stage !== "idle" && stage !== "complete" && stage !== "error"}
    <div class="progress-bar">
      <div class="progress-label">{progress.label}</div>
      <div class="progress-track">
        <div class="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
      </div>
    </div>
  {/if}

  <!-- ── Error ───────────────────────────────────────────────────────── -->
  {#if error}
    <div class="error-box">⚠ {error}</div>
  {/if}

  <!-- ── Main Content ───────────────────────────────────────────────── -->
  <div class="content">
    <!-- ── Left: Prompt & File Tree ─────────────────────────────────── -->
    <div class="left-panel">
      <!-- ── Prompt Input ──────────────────────────────────────────── -->
      <div class="prompt-section">
        <textarea
          class="prompt-input"
          placeholder="Describe what you want to build... (e.g., 'Create a Svelte 5 app with authentication')"
          bind:value={prompt}
          rows="4"
        ></textarea>
        <div class="prompt-actions">
          <select class="model-select" bind:value={model}>
            <option value="llama2">llama2</option>
            <option value="codellama">codellama</option>
            <option value="starcoder">starcoder</option>
          </select>
          <button class="generate-btn" onclick={generate} disabled={stage === "generating"}>
            {stage === "generating" ? "..." : "Generate"}
          </button>
        </div>
      </div>

      <!-- ── File Tree ─────────────────────────────────────────────── -->
      <div class="file-tree-section">
        <div class="section-header">
          <span>Generated Files ({files.length})</span>
          {#if files.length > 0}
            <span class="file-info">{formatBytes(files.reduce((sum, f) => sum + f.content.length, 0))} total</span>
          {/if}
        </div>
        <div bind:this={fileTreeEl} class="file-tree">
          {#if files.length === 0}
            <div class="empty-tree">No files generated yet. Describe your project above.</div>
          {:else}
            <div class="file-tree">
              {#each files as file (file.id)}
                <div class="file-item" class:selected={selectedFile?.id === file.id}>
                  <button
                    class="file-left"
                    type="button"
                    onclick={() => setSelectedFile(file)}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFile(file); } }}
                  >
                    <span class="file-icon">{getLanguageIcon(getFileLanguage(file))}</span>
                    <span class="file-path">{file.path}</span>
                    <span class="file-size">{formatBytes(file.content.length)}</span>
                  </button>
                  <div class="file-right">
                    {#if file.is_dirty}
                      <span class="dirty-dot"></span>
                    {/if}
                    <button class="delete-file" onclick={() => deleteFile(file.id)} title="Delete">×</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- ── Right: Code Editor & Refinement ─────────────────────────── -->
    <div class="right-panel">
      {#if selectedFile}
        <div class="code-section">
          <div class="code-header">
            <span class="code-filename">{selectedFile.path}</span>
            <span class="code-lang">{getFileLanguage(selectedFile).toUpperCase()}</span>
          </div>
          <pre class="code-content"><code>{selectedFile.content}</code></pre>

          <!-- Refinement Input -->
          <div class="refine-section">
            <label for="refine-input" class="sr-only">Refine this file:</label>
            <input
              id="refine-input"
              type="text"
              class="refine-input"
              placeholder="e.g., Add error handling, refactor to TypeScript, optimize performance..."
              bind:value={refineInstruction}
            />
            <button class="refine-btn" onclick={() => refine(selectedFile)} disabled={!refineInstruction.trim()}>
              Refine
            </button>
          </div>
        </div>
      {:else}
        <div class="no-file-selected">
          <span class="icon">📄</span>
          <p>Select a file to view and refine its code</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .codegen-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #181825;
    color: #cdd6f4;
    font-family: Inter, system-ui, sans-serif;
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #1e1e2e;
    border-bottom: 1px solid #313244;
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 8px; }
  .icon { color: #f38ba8; font-size: 16px; }
  .title { font-size: 14px; font-weight: 700; color: #cdd6f4; }
  .project-name { font-size: 12px; background: #313244; padding: 2px 8px; border-radius: 10px; color: #89b4fa; }
  .header-right { display: flex; gap: 4px; }
  .hbtn {
    background: none; border: none; color: #6c7086;
    font-size: 14px; cursor: pointer; padding: 4px 6px;
    border-radius: 4px;
  }
  .hbtn:hover, .hbtn.active { background: #313244; color: #cdd6f4; }

  /* ── Plan Panel ── */
  .plan-panel {
    background: #1e1e2e;
    border-bottom: 1px solid #313244;
    padding: 12px 14px;
  }
  .plan-title { font-size: 14px; font-weight: 700; color: #cba6f7; }
  .plan-desc { font-size: 12px; color: #6c7086; margin: 6px 0; }
  .plan-meta { display: flex; gap: 12px; font-size: 11px; color: #45475a; flex-wrap: wrap; margin-bottom: 8px; }
  .plan-steps { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #6c7086; }

  /* ── Progress ── */
  .progress-bar {
    padding: 8px 14px;
    background: #1e1e2e;
    border-bottom: 1px solid #313244;
  }
  .progress-label { font-size: 11px; color: #6c7086; margin-bottom: 6px; }
  .progress-track {
    height: 6px;
    background: #313244;
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #cba6f7, #89b4fa);
    transition: width 0.3s;
  }

  /* ── Error ── */
  .error-box {
    background: #f38ba820;
    color: #f38ba8;
    padding: 10px 14px;
    font-size: 12px;
    border-bottom: 1px solid #f38ba840;
  }

  /* ── Main Content ── */
  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* ── Left Panel ── */
  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    border-right: 1px solid #313244;
  }

  /* Prompt Section */
  .prompt-section {
    padding: 12px;
    border-bottom: 1px solid #313244;
  }
  .prompt-input {
    width: 100%;
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 6px;
    padding: 10px;
    color: #cdd6f4;
    font-size: 13px;
    font-family: inherit;
    resize: none;
  }
  .prompt-input:focus { outline: none; border-color: #cba6f7; }
  .prompt-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .model-select {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 6px;
    padding: 6px 8px;
    color: #cdd6f4;
    font-size: 12px;
  }
  .generate-btn {
    background: #cba6f7;
    color: #1e1e2e;
    border: none;
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .generate-btn:hover:not(:disabled) { background: #b4befe; }
  .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* File Tree */
  .file-tree-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6c7086;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #313244;
  }
  .file-info { font-size: 11px; color: #45475a; }
  .file-tree {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  .empty-tree {
    font-size: 12px;
    color: #6c7086;
    text-align: center;
    padding: 40px;
  }
  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: #1e1e2e;
    border-radius: 6px;
    margin-bottom: 4px;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .file-item:hover { background: #26263a; }
  .file-item.selected {
    border-color: #cba6f7;
    background: #cba6f710;
  }
  .file-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow: hidden;
    /* reset button styles */
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
  }
  .file-icon { font-size: 14px; flex-shrink: 0; }
  .file-path {
    font-size: 12px;
    color: #cdd6f4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .file-size {
    font-size: 10px;
    color: #6c7086;
    flex-shrink: 0;
  }
  .file-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dirty-dot {
    width: 6px;
    height: 6px;
    background: #f38ba8;
    border-radius: 50%;
  }
  .delete-file {
    background: none;
    border: none;
    color: #6c7086;
    cursor: pointer;
    font-size: 16px;
    padding: 2px;
  }
  .delete-file:hover { color: #f38ba8; }

  /* ── Right Panel ── */
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 400px;
    overflow: hidden;
    background: #1e1e2e;
  }
  .no-file-selected {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #6c7086;
  }
  .no-file-selected .icon { font-size: 48px; opacity: 0.5; }

  /* Code Section */
  .code-section {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #181825;
    border-bottom: 1px solid #313244;
    font-size: 12px;
  }
  .code-filename { color: #cdd6f4; font-weight: 500; }
  .code-lang {
    background: #313244;
    color: #89b4fa;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    text-transform: uppercase;
  }
  .code-content {
    flex: 1;
    overflow: auto;
    padding: 12px;
    font-family: "Fira Code", "JetBrains Mono", monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #cdd6f4;
    white-space: pre;
  }

  /* Refine Section */
  .refine-section {
    padding: 12px;
    border-top: 1px solid #313244;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .refine-section label {
    font-size: 11px;
    color: #6c7086;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .refine-input {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 6px;
    padding: 8px 12px;
    color: #cdd6f4;
    font-size: 12px;
  }
  .refine-input:focus { outline: none; border-color: #cba6f7; }
  .refine-btn {
    background: #cba6f7;
    color: #1e1e2e;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    align-self: flex-start;
  }
  .refine-btn:hover:not(:disabled) { background: #b4befe; }
  .refine-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Accessibility helpers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
