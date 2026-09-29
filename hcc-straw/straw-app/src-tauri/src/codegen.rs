use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// ── Types for Code Generation Pipeline ────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeFile {
    pub path: String,
    pub language: String,
    pub content: String,
    pub is_new: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentPlan {
    pub title: String,
    pub description: String,
    pub project_type: String,
    pub language: String,
    pub framework: Option<String>,
    pub file_list: Vec<String>,
    pub steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreationRequest {
    pub user_prompt: String,
    pub model: String,
    pub api_url: String,
    pub temperature: f64,
    pub system_prompt: String,
    pub output_dir: String,
    pub existing_files: Option<Vec<CodeFile>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreationResult {
    pub project_name: String,
    pub files: Vec<CodeFile>,
    pub plan: IntentPlan,
    pub elapsed_ms: u64,
    pub output_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefinementRequest {
    pub file_path: String,
    pub instruction: String,
    pub model: String,
    pub api_url: String,
    pub temperature: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefinementResult {
    pub file_path: String,
    pub new_content: String,
    pub elapsed_ms: u64,
}

// ── Context builder for code generation ──────────────────────────────────────

fn build_code_gen_prompt(
    user_prompt: &str,
    existing_files: Option<&Vec<CodeFile>>,
    system_prompt: &str,
) -> String {
    let mut parts: Vec<String> = Vec::new();

    // System instruction
    parts.push(format!("System: {}", system_prompt));

    // Existing files context
    if let Some(files) = existing_files {
        if !files.is_empty() {
            parts.push("\n--- Existing Files ---\n".to_string());
            for file in files {
                parts.push(format!("File: {}\n```\n{}\n```\n", file.path, file.content));
            }
        }
    }

    // User request
    parts.push(format!("\nUser: {}\n\nPlease generate complete, working code for the requested project. Include all necessary files with full implementations.", user_prompt));

    parts.join("\n")
}

// ── File writing utilities ─────────────────────────────────────────────────────

fn create_parent_dirs(path: &Path) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

fn detect_language(path: &str) -> String {
    match path {
        p if p.ends_with(".rs") => "rust",
        p if p.ends_with(".ts") || p.ends_with(".tsx") => "typescript",
        p if p.ends_with(".svelte") => "svelte",
        p if p.ends_with(".js") || p.ends_with(".jsx") => "javascript",
        p if p.ends_with(".py") => "python",
        p if p.ends_with(".html") => "html",
        p if p.ends_with(".css") => "css",
        p if p.ends_with(".json") => "json",
        p if p.ends_with(".toml") => "toml",
        p if p.ends_with(".md") => "markdown",
        p if p.ends_with(".sql") => "sql",
        p if p.ends_with(".sh") || p.ends_with(".bash") => "shell",
        _ => "text",
    }.to_string()
}

fn write_files_to_disk(files: &[CodeFile], output_dir: &str) -> Result<(), String> {
    for file in files {
        let full_path = Path::new(output_dir).join(&file.path);
        create_parent_dirs(&full_path).map_err(|e| e.to_string())?;
        fs::write(&full_path, &file.content).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ── Main code generation ──────────────────────────────────────────────────────

pub fn generate_code(request: &CreationRequest) -> Result<CreationResult, String> {
    let start = std::time::Instant::now();

    // Build prompt
    let prompt = build_code_gen_prompt(&request.user_prompt, request.existing_files.as_ref(), &request.system_prompt);

    // Prepare request body
    let body = serde_json::json!({
        "model": request.model,
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": request.temperature,
        }
    });

    // Call LLM
    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| format!("Runtime error: {}", e))?;

    let response_text = runtime.block_on(async {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(180))
            .build()
            .map_err(|e| e.to_string())?;

        let response = client
            .post(&request.api_url)
            .header("Content-Type", "application/json")
            .body(body.to_string())
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("API error {}", response.status()));
        }

        response.text().await.map_err(|e| e.to_string())
    })?;

    let parsed: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|_| "Failed to parse JSON response".to_string())?;

    // Extract code blocks from LLM response
    let code_content = parsed
        .get("response")
        .and_then(|v| v.as_str())
        .ok_or("No response from AI")?;

    // Parse code blocks and create files
    let files = parse_code_blocks(code_content)?;

    // Determine project name from first file or prompt
    let project_name = files
        .first()
        .map(|f| {
            let path = Path::new(&f.path);
            path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("project")
                .to_string()
        })
        .unwrap_or_else(|| request.user_prompt.chars().take(30).collect());

    // Write files to disk
    write_files_to_disk(&files, &request.output_dir)?;

    let files_clone = files.clone();
    Ok(CreationResult {
        project_name: project_name.clone(),
        files,
        plan: IntentPlan {
            title: project_name,
            description: request.user_prompt.clone(),
            project_type: "project".to_string(),
            language: files_clone.first().map(|f| detect_language(&f.path)).unwrap_or("text".to_string()),
            framework: None,
            file_list: files_clone.iter().map(|f| f.path.clone()).collect(),
            steps: vec!["Code generated".to_string()],
        },
        elapsed_ms: start.elapsed().as_millis() as u64,
        output_dir: request.output_dir.clone(),
    })
}

fn parse_code_blocks(response: &str) -> Result<Vec<CodeFile>, String> {
    let mut files = Vec::new();
    let lines: Vec<&str> = response.lines().collect();
    let mut current_file: Option<(String, Vec<String>)> = None;

    for line in lines {
        if line.starts_with("```") {
            if let Some(lang) = line.strip_prefix("```") {
                let lang = lang.trim();
                if let Some((path, content)) = &mut current_file {
                    files.push(CodeFile {
                        path: path.clone(),
                        language: detect_language(path),
                        content: content.join("\n"),
                        is_new: true,
                    });
                }
                current_file = Some((
                    format!("{}.{}", "newfile", if lang.is_empty() { "txt" } else { lang }).to_lowercase(),
                    Vec::new()
                ));
            }
        } else if let Some((_, content)) = &mut current_file {
            content.push(line.to_string());
        }
    }

    // Save last file
    if let Some((path, content)) = current_file {
        files.push(CodeFile {
            path: path.clone(),
            language: detect_language(&path),
            content: content.join("\n"),
            is_new: true,
        });
    }

    if files.is_empty() {
        // If no code blocks, return the whole response as a single text file
        files.push(CodeFile {
            path: "output.txt".to_string(),
            language: "text".to_string(),
            content: response.to_string(),
            is_new: true,
        });
    }

    Ok(files)
}

// ── File refinement ───────────────────────────────────────────────────────────

pub fn refine_file(request: &RefinementRequest) -> Result<RefinementResult, String> {
    let start = std::time::Instant::now();

    let prompt = format!(
        "System: Refactor and improve code files.\n\nUser: For the file `{}` with this instruction: {}\n\nPlease provide the complete updated file content.",
        request.file_path, request.instruction
    );

    let body = serde_json::json!({
        "model": request.model,
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": request.temperature,
        }
    });

    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| format!("Runtime error: {}", e))?;

    let response_text = runtime.block_on(async {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .map_err(|e| e.to_string())?;

        let response = client
            .post(&request.api_url)
            .header("Content-Type", "application/json")
            .body(body.to_string())
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("API error {}", response.status()));
        }

        response.text().await.map_err(|e| e.to_string())
    })?;

    let parsed: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|_| "Failed to parse response".to_string())?;

    let new_content = parsed
        .get("response")
        .and_then(|v| v.as_str())
        .unwrap_or(&response_text)
        .to_string();

    Ok(RefinementResult {
        file_path: request.file_path.clone(),
        new_content,
        elapsed_ms: start.elapsed().as_millis() as u64,
    })
}
