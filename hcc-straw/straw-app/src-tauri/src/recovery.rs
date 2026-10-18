use crate::{blocking, consume, error::ApiError, Operation};
use std::{path::Path, sync::Arc};
use straw_security::{
    recovery::{self, RecoveryReport},
    Security,
};
use tauri::State;
use tauri_plugin_dialog::DialogExt;

#[derive(serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryVerification {
    pub report: RecoveryReport,
    pub matches_current_vault: Option<bool>,
}

#[tauri::command]
#[specta::specta]
pub async fn recovery_pick(
    app: tauri::AppHandle,
    create: bool,
) -> Result<Option<String>, ApiError> {
    blocking(move || {
        let title = if create {
            "Choose a parent folder for a new core recovery copy"
        } else {
            "Choose an existing core recovery copy"
        };
        app.dialog()
            .file()
            .set_title(title)
            .blocking_pick_folder()
            .map(|file| {
                let path = file.into_path().map_err(|e| e.to_string())?;
                let path = if create {
                    path.join(format!("straw-core-{}", straw_engine::flow::FlowId::mint()))
                } else {
                    path
                };
                path.to_str()
                    .map(str::to_owned)
                    .ok_or_else(|| "Choose a UTF-8 folder name".to_owned())
            })
            .transpose()
    })
    .await
}
#[tauri::command]
#[specta::specta]
pub async fn recovery_create(
    security: State<'_, Arc<Security>>,
    output_dir: String,
    grant: String,
) -> Result<RecoveryReport, ApiError> {
    let security = security.inner().clone();
    blocking(move || create(&security, output_dir, grant)).await
}
pub(super) fn create(
    security: &Security,
    output_dir: String,
    grant: String,
) -> Result<RecoveryReport, String> {
    let path = recovery::new_directory(Path::new(&output_dir))?;
    consume(security, grant, &Operation::CoreBackup { output_dir })?;
    security.create_recovery_copy(path)
}
#[tauri::command]
#[specta::specta]
pub async fn recovery_verify(
    security: State<'_, Arc<Security>>,
    directory: String,
) -> Result<RecoveryVerification, ApiError> {
    let security = security.inner().clone();
    blocking(move || {
        let report = recovery::verify_directory(Path::new(&directory))?;
        let matches_current_vault = security
            .status()
            .ok()
            .and_then(|s| s.checkpoint)
            .map(|c| c.public_key == report.public_key);
        Ok(RecoveryVerification {
            report,
            matches_current_vault,
        })
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn recovery_ipc_returns_verified_identity_and_stays_available_while_locked() {
        use crate::command_tests::Desk;
        use serde_json::json;
        let desk = Desk::new();
        desk.initialize();
        let test_root = desk.dir.path().canonicalize().unwrap();
        let output = test_root.join("core-copy").to_str().unwrap().to_owned();
        let operation = Operation::CoreBackup {
            output_dir: output.clone(),
        };
        let grant = desk.grant(&operation);
        let args = json!({"outputDir":output,"grant":grant});
        let report = desk.ok("recovery_create", args.clone());
        assert!(report["databaseBytes"].as_u64().unwrap() > 0);
        desk.ok("vault_lock", json!({}));
        let verified = desk.ok("recovery_verify", json!({"directory":output}));
        assert_eq!(verified["matchesCurrentVault"], true);
        assert_eq!(verified["report"]["head"], report["head"]);
        desk.refuses(
            "recovery_create",
            json!({"outputDir":test_root.join("locked-copy").to_str().unwrap(),"grant":grant}),
            "vault_locked",
        );
        assert!(!desk.dir.path().join("locked-copy").exists());
    }
    #[test]
    fn backup_approval_binds_destination_and_is_single_use() {
        let dir = tempfile::tempdir().unwrap();
        let store = straw_storage::Store::open(dir.path().join("live.db"), "").unwrap();
        let security = Security::open(store, dir.path().join("head.json")).unwrap();
        security
            .initialize(zeroize::Zeroizing::new("native recovery passphrase".into()))
            .unwrap();
        let approved = dir.path().join("approved").to_str().unwrap().to_owned();
        let other = dir.path().join("other").to_str().unwrap().to_owned();
        let operation = Operation::CoreBackup {
            output_dir: approved.clone(),
        };
        let grant = security
            .issue(
                operation.permissions(),
                straw_security::digest(&operation).unwrap(),
            )
            .unwrap()
            .id;
        assert!(create(&security, other.clone(), grant.clone()).is_err());
        assert!(!Path::new(&other).exists());
        create(&security, approved.clone(), grant.clone()).unwrap();
        assert!(create(
            &security,
            dir.path().join("replay").to_str().unwrap().into(),
            grant
        )
        .is_err());
        assert!(recovery::verify_directory(Path::new(&approved)).is_ok());
    }
}
