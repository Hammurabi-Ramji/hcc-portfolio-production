//! Gate 1: Structure. BSM-CODE: gate.structure()
//!
//! Every path declared under `files:` in `.autarch.yaml` must exist. A trailing
//! `/` requires a directory. Absolute paths and `..` components are rejected
//! so the manifest cannot probe outside the project.

use std::io;
use std::collections::HashSet;
use std::path::{Component, Path};

use serde::Deserialize;

use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

pub const MANIFEST: &str = ".autarch.yaml";

#[derive(Debug, Deserialize)]
struct Manifest {
    #[serde(default)]
    files: Vec<String>,
}

fn fail(details: String, message: String) -> GateResult {
    GateResult {
        gate: GateName::Structure,
        status: GateStatus::Fail,
        details,
        violations: vec![Violation { file: MANIFEST.to_owned(), line: None, message }],
    }
}

fn is_safe_relative(rel: &Path) -> bool {
    !rel.as_os_str().is_empty()
        && rel.components().all(|c| matches!(c, Component::Normal(_) | Component::CurDir))
}

pub fn run(root: &Path) -> Result<GateResult, CrucibleError> {
    let manifest_path = root.join(MANIFEST);
    let text = match std::fs::read_to_string(&manifest_path) {
        Ok(t) => t,
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            return Ok(fail("manifest not found".to_owned(), format!("{MANIFEST} not found")));
        }
        Err(source) => return Err(CrucibleError::Io { path: manifest_path, source }),
    };
    let manifest: Manifest = match serde_yaml::from_str(&text) {
        Ok(m) => m,
        Err(e) => {
            return Ok(fail("manifest unreadable".to_owned(), format!("invalid manifest: {e}")));
        }
    };
    if manifest.files.is_empty() {
        return Ok(fail(
            "manifest declares no files".to_owned(),
            "`files:` is missing or empty; nothing to verify".to_owned(),
        ));
    }

    let total = manifest.files.len();
    let mut violations = Vec::new();
    let mut declared = HashSet::new();
    for decl in &manifest.files {
        let wants_dir = decl.ends_with('/') || decl.ends_with('\\');
        let rel = Path::new(decl.trim_end_matches(['/', '\\']));
        let message = if !is_safe_relative(rel) {
            Some("unsafe or empty path (must be relative, no '..')")
        } else if !declared.insert(rel.components().filter_map(|c| match c {
            Component::Normal(name) => Some(name), _ => None,
        }).collect::<std::path::PathBuf>()) {
            Some("duplicate declared path")
        } else {
            let full = root.join(rel);
            if wants_dir {
                (!full.is_dir()).then_some("declared directory is missing")
            } else {
                (!full.is_file()).then_some("declared file is missing or is not a file")
            }
        };
        if let Some(message) = message {
            violations.push(Violation { file: decl.clone(), line: None, message: message.to_owned() });
        }
    }

    let present = total - violations.len();
    Ok(GateResult {
        gate: GateName::Structure,
        status: if violations.is_empty() { GateStatus::Pass } else { GateStatus::Fail },
        details: format!("{present}/{total} files present"),
        violations,
    })
}
