use crucible::{gates::structure, GateStatus};

#[test]
fn published_gate_identifiers_and_skipped_results_are_consistent() {
    use crucible::{GateName, GateResult};
    for (index, gate) in GateName::ALL.into_iter().enumerate() {
        assert_eq!(gate.number(), index as u8 + 1);
        assert!(gate.implemented());
        assert_eq!(gate.to_string(), gate.as_str());
        assert_eq!(gate.bsm_code(), format!("gate.{}()", gate.as_str()));
        assert_eq!(
            format!(" {} ", gate.as_str().to_uppercase())
                .parse::<GateName>()
                .unwrap(),
            gate
        );
        let skipped = GateResult::skipped(gate);
        assert_eq!(skipped.status, GateStatus::Skipped);
        assert_eq!(skipped.details, "gate did not run");
    }
}
use std::{fs, path::Path};

#[test]
fn duplicate_normalized_paths_and_directories_disguised_as_files_cannot_pass() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/coverage-structure");
    fs::create_dir_all(&root).unwrap();
    let dir = tempfile::tempdir_in(root).unwrap();
    fs::write(dir.path().join("real.rs"), "pub fn real() {}\n").unwrap();
    fs::create_dir(dir.path().join("folder")).unwrap();
    for (manifest, reason) in [
        ("files: [real.rs, ./real.rs]", "duplicate declared path"),
        ("files: [folder]", "not a file"),
        ("files: [", "invalid manifest"),
    ] {
        fs::write(dir.path().join(".autarch.yaml"), manifest).unwrap();
        let result = structure::run(dir.path()).unwrap();
        assert_eq!(result.status, GateStatus::Fail);
        assert!(
            result.violations.iter().any(|v| v.message.contains(reason)),
            "{result:?}"
        );
    }
    fs::write(
        dir.path().join(".autarch.yaml"),
        "files: [real.rs, folder/]",
    )
    .unwrap();
    assert_eq!(structure::run(dir.path()).unwrap().status, GateStatus::Pass);
}
