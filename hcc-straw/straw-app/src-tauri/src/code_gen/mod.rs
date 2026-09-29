//! Code Generation Command Handlers
//! 
//! This module provides Tauri commands for AI-driven code generation,
//! intent planning, and file creation/refinement.

use crate::types::{
    CreationRequest, CreationResult, RefinementRequest, RefinementResult,
    IntentPlan, CodeFile, FileLanguage, GenStage,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::Instant;
use tauri::State;

/// Code Generation Engine State
#[derive(Clone)]
pub struct CodeGenState {
    /// Output directory for generated files
    pub output_dir: String,
    /// LLM API URL
    pub api_url: String,
    /// Model name
    pub model: String,
    /// Temperature setting
    pub temperature: f64,
    /// System prompt for code generation
    pub system_prompt: String,
}

impl Default for CodeGenState {
    fn default() -> Self {
        Self {
            output_dir: "C:\\hcc-straw\\output".to_string(),
            api_url: "http://localhost:11434/api/generate".to_string(),
            model: "llama2".to_string(),
            temperature: 0.7,
            system_prompt: "You are an expert software developer. Generate complete, production-ready code files with proper structure, error handling, and documentation.".to_string(),
        }
    }
}

/// Parse the user request and extract intent
#[tauri::command]
pub fn parse_intent(request: CreationRequest) -> Result<IntentPlan, String> {
    // Analyze the request to determine project type, language, and structure
    let project_type = detect_project_type(&request.user_prompt);
    let language = detect_language(&request.user_prompt, &project_type);
    
    // Generate a basic plan
    let plan = IntentPlan {
        title: extract_project_name(&request.user_prompt),
        description: request.user_prompt.clone(),
        project_type,
        language,
        framework: detect_framework(&request.user_prompt, &project_type),
        fileList: vec![], // Will be populated by LLM
        estimated_files: estimate_file_count(&project_type),
        steps: generate_steps(&project_type),
    };

    Ok(plan)
}

/// Generate code based on the request
#[tauri::command]
pub async fn generate_code(request: CreationRequest) -> Result<CreationResult, String> {
    let start = Instant::now();
    
    // Step 1: Parse intent
    let plan = parse_intent(request.clone())?;
    
    // Step 2: Generate files using LLM
    let files = generate_files(&request, &plan).await?;
    
    // Step 3: Write files to disk
    write_files(&files, &request.output_dir).map_err(|e| e.to_string())?;
    
    let elapsed = start.elapsed();
    
    Ok(CreationResult {
        project_name: plan.title,
        files,
        plan,
        elapsed_ms: elapsed.as_millis() as u64,
        output_dir: request.output_dir,
    })
}

/// Refine an existing file
#[tauri::command]
pub async fn refine_file(request: RefinementRequest) -> Result<RefinementResult, String> {
    let start = Instant::now();
    
    // Read current file
    let current_content = fs::read_to_string(&request.file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    // Create refinement prompt
    let prompt = format!(
        "Refine the following code based on the instruction:\n\n\
        Instruction: {}\n\n\
        Current code:\n\
        ```\n{}\n```\n\n\
        Provide only the refined code without explanations.",
        request.instruction, current_content
    );
    
    // Call LLM to generate refined code
    let refined_code = call_llm(&prompt, &request.model, &request.api_url, request.temperature)
        .await?;
    
    Ok(RefinementResult {
        file_path: request.file_path,
        new_content: refined_code,
        elapsed_ms: start.elapsed().as_millis() as u64,
    })
}

/// Detect project type from request
fn detect_project_type(prompt: &str) -> String {
    let lower = prompt.to_lowercase();
    
    if lower.contains("web app") || lower.contains("website") || lower.contains("frontend") {
        "web-app".to_string()
    } else if lower.contains("cli") || lower.contains("command line") {
        "cli-tool".to_string()
    } else if lower.contains("library") || lower.contains("module") {
        "library".to_string()
    } else if lower.contains("script") || lower.contains("automation") {
        "script".to_string()
    } else if lower.contains("component") || lower.contains("widget") {
        "component".to_string()
    } else {
        "general".to_string()
    }
}

/// Detect programming language from request
fn detect_language(prompt: &str, project_type: &str) -> FileLanguage {
    let lower = prompt.to_lowercase();
    
    if lower.contains("rust") {
        "rust"
    } else if lower.contains("typescript") || lower.contains("ts") {
        "typescript"
    } else if lower.contains("svelte") {
        "svelte"
    } else if lower.contains("javascript") || lower.contains("js") {
        "javascript"
    } else if lower.contains("python") {
        "python"
    } else if lower.contains("java") {
        "java"
    } else if lower.contains("go") || lower.contains("golang") {
        "go"
    } else if lower.contains("node") {
        "javascript"
    } else {
        match project_type {
            "web-app" => "typescript",
            "cli-tool" => "rust",
            "library" => "rust",
            "script" => "python",
            _ => "rust",
        }
    }.to_string()
}

/// Extract project name from request
fn extract_project_name(prompt: &str) -> String {
    // Simple extraction - in production, use NLP
    let words: Vec<&str> = prompt.split_whitespace().collect();
    if words.len() > 0 {
        words[0].to_string()
    } else {
        "unnamed-project".to_string()
    }
}

/// Detect framework from request
fn detect_framework(prompt: &str, project_type: &str) -> Option<String> {
    let lower = prompt.to_lowercase();
    
    if lower.contains("next.js") || lower.contains("nextjs") {
        Some("next.js".to_string())
    } else if lower.contains("sveltekit") {
        Some("sveltekit".to_string())
    } else if lower.contains("express") {
        Some("express".to_string())
    } else if lower.contains("django") {
        Some("django".to_string())
    } else if lower.contains("flask") {
        Some("flask".to_string())
    } else {
        None
    }
}

/// Estimate file count based on project type
fn estimate_file_count(project_type: &str) -> usize {
    match project_type {
        "web-app" => 10,
        "cli-tool" => 5,
        "library" => 8,
        "script" => 1,
        "component" => 3,
        _ => 5,
    }
}

/// Generate basic steps for project creation
fn generate_steps(project_type: &str) -> Vec<String> {
    match project_type {
        "web-app" => vec![
            "Set up project structure and configuration".to_string(),
            "Create main application component".to_string(),
            "Implement routing and navigation".to_string(),
            "Add authentication/authorization".to_string(),
            "Create UI components and styles".to_string(),
            "Add state management".to_string(),
            "Implement API integration".to_string(),
            "Add error handling and validation".to_string(),
            "Write tests".to_string(),
            "Prepare for deployment".to_string(),
        ],
        "cli-tool" => vec![
            "Initialize project and dependencies".to_string(),
            "Create CLI argument parser".to_string(),
            "Implement core functionality".to_string(),
            "Add error handling".to_string(),
            "Create documentation".to_string(),
        ],
        _ => vec![
            "Analyze requirements".to_string(),
            "Design architecture".to_string(),
            "Implement core features".to_string(),
            "Add error handling".to_string(),
            "Write documentation".to_string(),
        ]
    }
}

/// Generate code files using LLM
async fn generate_files(request: &CreationRequest, plan: &IntentPlan) -> Result<Vec<CodeFile>, String> {
    // Create system prompt with context
    let system_prompt = format!(
        "{}\n\nProject type: {}\nLanguage: {}\nFramework: {:?}\n\n\
        Generate complete, production-ready code files. Each file should be fully functional, \
        well-documented, and follow best practices for the specified language and framework.",
        request.system_prompt,
        plan.project_type,
        plan.language,
        plan.framework
    );
    
    // Create user prompt
    let user_prompt = format!(
        "Create a {} project with the following requirements:\n\n{}\n\n\
        Expected structure:\n- {} files\n- Primary language: {}\n- Framework: {:?}\n\n\
        Generate ALL files in a single response. Use the following format for each file:\n\n\
        FILE: <path/to/file>\n\
        ```<language>\n<file content>\n```\n\n\
        Make sure all files are complete and ready to use.",
        plan.project_type,
        request.user_prompt,
        plan.estimated_files,
        plan.language,
        plan.framework
    );
    
    // Call LLM
    let response = call_llm(&user_prompt, &request.model, &request.api_url, request.temperature)
        .await?;
    
    // Parse response to extract files
    let files = parse_llm_response(&response, &request.user_prompt)?;
    
    Ok(files)
}

/// Call the LLM API to generate code
async fn call_llm(prompt: &str, model: &str, api_url: &str, temperature: f64) -> Result<String, String> {
    use reqwest::Client;
    
    let client = Client::new();
    
    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": temperature,
            "num_predict": 8192, // Generate sufficient tokens
        }
    });
    
    let response = client
        .post(api_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to call LLM API: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("LLM API returned error: {}", response.status()));
    }
    
    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse LLM response: {}", e))?;
    
    let text = result["response"]
        .as_str()
        .ok_or("Invalid LLM response format")?
        .to_string();
    
    Ok(text)
}

/// Parse LLM response to extract individual files
fn parse_llm_response(response: &str, context: &str) -> Result<Vec<CodeFile>, String> {
    let mut files = Vec::new();
    
    // Simple regex-like parsing for FILE: <path> markers
    let lines: Vec<&str> = response.lines().collect();
    let mut current_file: Option<(String, Vec<String>)> = None;
    
    for line in lines {
        if line.starts_with("FILE:") {
            // Save previous file if exists
            if let Some((path, content)) = current_file.take() {
                if let Some(file) = create_file_from_parts(&path, &content) {
                    files.push(file);
                }
            }
            
            // Start new file
            let path = line[5..].trim().to_string();
            current_file = Some((path, Vec::new()));
        } else if line.starts_with("```") {
            // Skip code fence markers
            continue;
        } else if let Some((ref mut path, ref mut content)) = current_file {
            content.push(line.to_string());
        }
    }
    
    // Save last file
    if let Some((path, content)) = current_file {
        if let Some(file) = create_file_from_parts(&path, &content) {
            files.push(file);
        }
    }
    
    if files.is_empty() {
        // Fallback: create a basic file if parsing failed
        let fallback = CodeFile {
            id: uuid::Uuid::new_v4().to_string(),
            path: "README.md".to_string(),
            language: "markdown".to_string().into(),
            content: format!(
                "# Project\n\nCreated based on: {}\n\nGenerated by NLP-AI-Code-Creation.",
                context
            ),
            original_content: None,
            is_new: true,
            is_dirty: false,
        };
        files.push(fallback);
    }
    
    Ok(files)
}

/// Create a CodeFile from path and content parts
fn create_file_from_parts(path: &str, content_parts: &[String]) -> Option<CodeFile> {
    let content = content_parts.join("\n");
    
    if content.is_empty() {
        return None;
    }
    
    let language = detect_file_language(path);
    
    Some(CodeFile {
        id: uuid::Uuid::new_v4().to_string(),
        path: path.to_string(),
        language,
        content,
        original_content: None,
        is_new: true,
        is_dirty: false,
    })
}

/// Detect file language from path
fn detect_file_language(path: &str) -> FileLanguage {
    if let Some(ext) = Path::new(path).extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        match ext.as_str() {
            "rs" => "rust",
            "ts" | "tsx" => "typescript",
            "svelte" => "svelte",
            "js" | "jsx" => "javascript",
            "py" => "python",
            "html" => "html",
            "css" => "css",
            "json" => "json",
            "toml" => "toml",
            "md" => "markdown",
            "sql" => "sql",
            "sh" => "shell",
            _ => "text",
        }.to_string()
        .into()
    } else {
        "text".to_string().into()
    }
}

/// Write files to disk
fn write_files(files: &[CodeFile], output_dir: &str) -> Result<(), std::io::Error> {
    for file in files {
        let file_path = Path::new(output_dir).join(&file.path);
        
        // Create parent directories if needed
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        // Write file content
        fs::write(&file_path, &file.content)?;
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_detect_project_type() {
        assert_eq!(detect_project_type("Create a web app"), "web-app");
        assert_eq!(detect_project_type("Build a CLI tool"), "cli-tool");
        assert_eq!(detect_project_type("Make a script"), "script");
    }
    
    #[test]
    fn test_detect_language() {
        assert_eq!(detect_language("in Rust", "general"), "rust".to_string());
        assert_eq!(detect_language("using TypeScript", "web-app"), "typescript".to_string());
        assert_eq!(detect_language("Python project", "general"), "python".to_string());
    }
}
