//! Native successor to the SaaS controller: preserves its nine template names,
//! but generates the reviewed shared core and never deletes prior output.
#![forbid(unsafe_code)]
use std::path::Path;
use straw_engine::contract::CodeFile;
include!(concat!(env!("OUT_DIR"), "/sources.rs"));
pub const TEMPLATES: &[&str] = &[
    "healthcare_saas",
    "finance_saas",
    "ecommerce_saas",
    "marketing_saas",
    "education_saas",
    "real_estate_saas",
    "legal_saas",
    "logistics_saas",
    "creative_agency_saas",
];
#[derive(serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Bundle {
    pub template: String,
    pub output_dir: String,
    pub files: u32,
}
pub fn generate(template: &str, output: &Path) -> Result<Bundle, String> {
    if !TEMPLATES.contains(&template) {
        return Err("unknown template".into());
    }
    let mut files: Vec<CodeFile> = SOURCES
        .iter()
        .map(|(path, text)| file(path, text))
        .collect();
    files.push(file("Cargo.toml", include_str!("workspace.toml")));
    files.push(file("app/Cargo.toml", include_str!("app.toml")));
    files.push(file("app/src/main.rs", include_str!("service.rs")));
    files.push(file("README.md",&format!("# {template}\n\nReviewed STRAW core: SQLx SQLite WAL, immutable documents, exact vector search, workflows, and loopback Axum/Tower.\n\nRun `cargo run -p sovereign-app`. Data is `sovereign.db`; the service binds only 127.0.0.1:8741.\n\nThis is a core source bundle. Billing, remote integrations, and domain-specific features require separate implementation. The bundled SvelteCoder model remains in STRAW Desk; weights are not duplicated into generated services.\n")));
    use sha2::{Digest, Sha256};
    let provenance:Vec<_>=files.iter().map(|f|serde_json::json!({"path":f.path,"sha256":format!("{:x}",Sha256::digest(f.content.as_bytes()))})).collect();
    files.push(file("manifest.json",&serde_json::to_string_pretty(&serde_json::json!({"template":template,"status":"core_source_bundle","source":"STRAW hybrid shared core","files":provenance})).map_err(|e|e.to_string())?));
    let saved = straw_engine::codegen::save_files(output, &files, false)?;
    Ok(Bundle {
        template: template.into(),
        output_dir: output.display().to_string(),
        files: saved.len() as u32,
    })
}
fn file(path: &str, content: &str) -> CodeFile {
    CodeFile {
        id: path.into(),
        path: path.into(),
        content: content.into(),
        is_dirty: true,
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reviewed_source_bundle_is_complete_and_preserves_previous_output() {
        let d = tempfile::tempdir().unwrap();
        let result = generate("education_saas", d.path()).unwrap();
        assert!(result.files > 20);
        assert!(d.path().join("crates/engine/src/nodes/mod.rs").exists());
        assert!(d.path().join("crates/storage/src/schema.sql").exists());
        assert!(generate("education_saas", d.path()).is_err());
        assert!(generate("../escape", d.path()).is_err());
    }
}
