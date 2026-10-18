#![cfg(feature = "stele")]
//! Minting a verdict into the vault ledger and verifying the chain afterwards.

use std::path::{Path, PathBuf};

use crucible::mint::{mint, open_vault, read_passphrase, verify_stele};
use crucible::{GateName, GateResult, GateStatus};
use straw_security::{Permission, Security};
use straw_storage::Store;
use zeroize::Zeroizing;

const PASS: &str = "a strong test passphrase";

fn all_pass() -> Vec<GateResult> {
    GateName::ALL
        .iter()
        .map(|g| GateResult { gate: *g, status: GateStatus::Pass, details: "ok".into(), violations: vec![] })
        .collect()
}

/// The application's vault: created and used by the app, not by Crucible.
struct App {
    dir: tempfile::TempDir,
}

impl App {
    fn new(initialize: bool) -> Self {
        let dir = tempfile::tempdir().unwrap();
        let app = App { dir };
        if initialize {
            app.security().initialize(Zeroizing::new(PASS.into())).unwrap();
        }
        app
    }
    fn db(&self) -> PathBuf {
        self.dir.path().join("straw.db")
    }
    fn anchor(&self) -> PathBuf {
        self.dir.path().join("straw-checkpoint.json")
    }
    fn security(&self) -> Security {
        Security::open(Store::open(self.db(), "").unwrap(), self.anchor()).unwrap()
    }
    fn project(&self) -> PathBuf {
        let project = self.dir.path().join("proj");
        std::fs::create_dir_all(&project).unwrap();
        std::fs::write(project.join(".autarch.yaml"), "files: []\n").unwrap();
        project
    }
}

fn mint_into(app: &App, project: &Path, pass: &str) -> Result<crucible::mint::Minted, crucible::mint::MintError> {
    mint(&app.db(), &app.anchor(), Zeroizing::new(pass.into()), project, &all_pass())
}

#[test]
fn verdicts_join_the_apps_one_chain_under_the_apps_one_signer() {
    let app = App::new(true);
    let project = app.project();

    let first = mint_into(&app, &project, PASS).unwrap();
    // The app keeps working in the same ledger between verdicts.
    let security = app.security();
    security.unlock(Zeroizing::new(PASS.into())).unwrap();
    security.issue(vec![Permission::Assist], "0".repeat(64)).unwrap();
    drop(security);
    let second = mint_into(&app, &project, PASS).unwrap();

    // initialize=0, verdict=1, grant=2, verdict=3
    assert_eq!((first.seq, second.seq), (1, 3));
    assert_ne!(first.digest, second.digest);
    assert_eq!(first.public_key, second.public_key, "the same vault signer both times");

    let status = app.security().status().unwrap();
    assert!(!status.quarantined);
    let head = status.checkpoint.unwrap();
    assert_eq!(head.public_key, first.public_key, "no second key exists");
    assert_eq!(head.sequence, 3);

    let (count, tip) = verify_stele(&app.db(), &app.anchor()).unwrap();
    assert_eq!(count, 2);
    assert_eq!(tip.as_deref(), Some(second.entry_hash.as_str()));
}

#[test]
fn a_wrong_passphrase_writes_nothing() {
    let app = App::new(true);
    let before = app.security().status().unwrap().checkpoint.unwrap();
    let err = mint_into(&app, &app.project(), "not the passphrase").unwrap_err();
    assert!(err.to_string().contains("cannot unlock"), "{err}");
    assert_eq!(app.security().status().unwrap().checkpoint.unwrap(), before);
}

#[test]
fn crucible_never_creates_the_identity_that_signs_for_the_app() {
    let missing = App::new(false);
    let err = mint_into(&missing, &missing.project(), PASS).unwrap_err();
    assert!(err.to_string().contains("not found"), "{err}");

    // A database that exists but was never initialized (the app opened it, nobody set a passphrase).
    let blank = App::new(false);
    drop(blank.security());
    let err = mint_into(&blank, &blank.project(), PASS).unwrap_err();
    assert!(err.to_string().contains("not initialized"), "{err}");
}

#[test]
fn a_tampered_ledger_is_refused_before_anything_is_written() {
    let app = App::new(true);
    mint_into(&app, &app.project(), PASS).unwrap();
    let anchor = app.anchor();
    let old = std::fs::read(&anchor).unwrap();
    mint_into(&app, &app.project(), PASS).unwrap();
    std::fs::write(&anchor, old).unwrap(); // roll the anchor back
    assert!(open_vault(&app.db(), &anchor).err().unwrap().to_string().contains("quarantined"));
    assert!(mint_into(&app, &app.project(), PASS).is_err());
    assert!(verify_stele(&app.db(), &anchor).is_err());
}

#[test]
fn the_verdict_body_carries_the_gate_report_and_manifest_digest() {
    let app = App::new(true);
    let minted = mint_into(&app, &app.project(), PASS).unwrap();
    let scribe = straw_stele::Scribe::new(std::sync::Arc::new(app.security()));
    let bodies = scribe
        .replay(Vec::new(), |mut acc, v| {
            acc.push((v.precedent.core().body.clone(), v.precedent.judgment().rationale.clone()));
            Ok(acc)
        })
        .unwrap();
    let (body, rationale) = &bodies[0];
    let body: serde_json::Value = serde_json::from_str(body).unwrap();
    assert_eq!(body["report"]["result"], "sovereign_certified");
    assert_eq!(body["report"]["gates"].as_array().unwrap().len(), 9);
    assert_eq!(body["manifest_sha256"].as_str().unwrap().len(), 64);
    assert!(rationale.starts_with("RESULT: SOVEREIGN CERTIFIED"));
    assert_eq!(minted.digest.len(), 64);
}

#[test]
fn the_passphrase_comes_from_a_file_without_its_newline() {
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("pass");
    std::fs::write(&file, format!("{PASS}\r\n")).unwrap();
    assert_eq!(read_passphrase(Some(&file)).unwrap().as_str(), PASS);
    assert!(read_passphrase(Some(&dir.path().join("absent"))).is_err());
}

#[test]
fn partial_duplicate_warned_and_failed_reports_cannot_be_carved() {
    let app = App::new(true);
    let before = app.security().status().unwrap().checkpoint.unwrap();
    let mut warned = all_pass();
    warned[6].status = GateStatus::Warn;
    let mut failed = all_pass();
    failed[2].status = GateStatus::Fail;
    for report in [vec![], vec![all_pass()[0].clone()], vec![all_pass()[0].clone(); 9], warned, failed] {
        assert!(mint(&app.db(), &app.anchor(), Zeroizing::new(PASS.into()), &app.project(), &report).is_err());
        assert_eq!(app.security().status().unwrap().checkpoint.as_ref(), Some(&before));
    }
}

#[test]
fn desktop_mint_reuses_the_open_signer_and_retains_the_unlocked_session() {
    let app = App::new(true);
    let security = std::sync::Arc::new(app.security());
    security.unlock(Zeroizing::new(PASS.into())).unwrap();
    let signer = security.status().unwrap().checkpoint.unwrap().public_key;
    let receipt = crucible::mint::mint_unlocked(security.clone(), &app.project(), &all_pass()).unwrap();
    assert_eq!(receipt.public_key, signer);
    assert!(security.status().unwrap().unlocked);
    let records = security.precedents().unwrap();
    let body: serde_json::Value = serde_json::from_str(&records[0].record.body).unwrap();
    assert_eq!(body["source"]["sha256"].as_str().unwrap().len(), 64);
}
