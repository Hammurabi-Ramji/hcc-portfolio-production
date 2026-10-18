use std::{path::Path, sync::Arc};
use tauri::State;
use tauri_plugin_dialog::DialogExt;
use straw_accordion::Json;
use straw_security::Security;
use crucible::{composite_status, gates::{self, Context}, CompositeStatus, GateStatus};
use crate::{blocking, consume, error::ApiError, Operation};

#[tauri::command]
#[specta::specta]
pub async fn validation_pick_project(app: tauri::AppHandle) -> Result<Option<String>, ApiError> {
    blocking(move || {
        app.dialog().file().set_title("Choose a project to validate").blocking_pick_folder()
            .map(|file| file.into_path().map(|p| p.to_string_lossy().into_owned()).map_err(|e| e.to_string()))
            .transpose()
    }).await
}

#[tauri::command]
#[specta::specta]
pub async fn validation_run(security: State<'_, Arc<Security>>, project: String, grant: String) -> Result<Json, ApiError> {
    let security = security.inner().clone();
    blocking(move || run(&security, &project, grant)).await
}

fn run(security: &Arc<Security>, project: &str, grant: String) -> Result<Json, String> {
    let path = Path::new(project).canonicalize().map_err(|e| format!("Cannot open project: {e}"))?;
    if !path.is_dir() { return Err("Choose a project folder".into()); }
    consume(security, grant, &Operation::Validate { project: project.into() })?;
    let before = crucible::evidence::snapshot(&path).map_err(|e| e.to_string())?;
    let mut gates = gates::run_all(&path, &Context::system()).map_err(|e| e.to_string())?;
    if before != crucible::evidence::snapshot(&path).map_err(|e| e.to_string())? {
        gates[0].status = GateStatus::Fail;
        gates[0].details = "Source changed during validation; run again against stable inputs".into();
    }
    let result = composite_status(&gates);
    let mut receipt = serde_json::Value::Null;
    let mut certificate_error = None;
    if result == CompositeStatus::SovereignCertified {
        match crucible::mint::mint_unlocked(security.clone(), &path, &gates) {
            Ok(minted) => receipt = serde_json::json!({"seq": minted.seq, "digest": minted.digest, "entryHash": minted.entry_hash, "signer": minted.public_key}),
            Err(error) => certificate_error = Some(error.to_string()),
        }
    }
    Ok(Json(serde_json::json!({"project": path.to_string_lossy(), "result": result, "gates": gates, "source": before, "receipt": receipt, "certificateError": certificate_error})))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn project_validation_permission_is_bound_to_the_selected_folder() {
        let first = Operation::Validate { project: "project-a".into() };
        let second = Operation::Validate { project: "project-b".into() };
        assert_ne!(straw_security::digest(&first).unwrap(), straw_security::digest(&second).unwrap());
        assert_eq!(first.permissions(), vec![straw_security::Permission::Validate, straw_security::Permission::Carve]);
        assert!(first.summary().contains("execute this project's code"));
    }

    #[test]
    fn real_project_checks_and_certificate_share_the_existing_signer() {
        let fixture = tempfile::tempdir().unwrap();
        let project = fixture.path().join("project");
        std::fs::create_dir_all(project.join("src")).unwrap();
        for (name, text) in [
            ("Cargo.toml", "[package]\nname = \"straw-validation-fixture\"\nversion = \"0.1.0\"\nedition = \"2021\"\n[workspace]\n"),
            ("Cargo.lock", "version = 4\n[[package]]\nname = \"straw-validation-fixture\"\nversion = \"0.1.0\"\n"),
            (".gitignore", ".env\n/target/\n"),
            ("README.md", "Keep the faith, the good exists.\n"),
            ("src/lib.rs", "pub fn twice(value: u32) -> u32 { value * 2 }\n#[cfg(test)] mod tests { #[test] fn doubles() { assert_eq!(super::twice(3), 6); } }\n"),
            (".autarch.yaml", "files: [Cargo.toml, Cargo.lock, src/lib.rs, README.md]\n"),
        ] { std::fs::write(project.join(name), text).unwrap(); }
        let security = Arc::new(Security::open(straw_storage::Store::open(fixture.path().join("vault.db"), "").unwrap(), fixture.path().join("checkpoint.json")).unwrap());
        security.initialize(zeroize::Zeroizing::new("strong integration passphrase".into())).unwrap();
        let signer = security.status().unwrap().checkpoint.unwrap().public_key;
        let operation = Operation::Validate { project: project.to_string_lossy().into_owned() };
        let grant = security.issue(operation.permissions(), straw_security::digest(&operation).unwrap()).unwrap();
        let report = run(&security, &project.to_string_lossy(), grant.id.clone()).unwrap().0;
        assert_eq!(report["result"], "sovereign_certified", "{report}");
        assert_eq!(report["receipt"]["signer"], signer);
        assert_eq!(security.precedents().unwrap().len(), 1);
        assert!(security.status().unwrap().unlocked);
        assert!(run(&security, &project.to_string_lossy(), grant.id).is_err());
    }
}
