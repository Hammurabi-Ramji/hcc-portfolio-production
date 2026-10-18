// crucible:allow-file(portability)
//! Gate 4: Reproducibility. BSM-CODE: gate.reproducibility()
//!
//! * A lockfile must govern every manifest (Cargo.lock, or pnpm/npm/yarn for package.json).
//! * Explicit floating requirements (`^`, `~`, `*`, ranges, git without a rev) FAIL.
//! * Bare Cargo versions like "1.2" are implicit-caret: reproducible only through
//!   the lockfile, so they WARN. Pin with "=1.2.3" to clear the warning.

use std::path::{Path, PathBuf};
use std::sync::LazyLock;

use regex::Regex;
use toml::Value;

use crate::scan::{all_files, rel_string};
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

static EXACT_SEMVER: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$").expect("static regex")
});
static BARE_CARGO: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^\d+(\.\d+){0,2}$").expect("static regex"));

#[derive(Debug, PartialEq, Eq)]
pub enum Req {
    Exact,
    Implicit,
    Floating,
}

pub fn classify_cargo(req: &str) -> Req {
    let req = req.trim();
    if req.starts_with('=') {
        Req::Exact
    } else if BARE_CARGO.is_match(req) {
        Req::Implicit
    } else {
        Req::Floating
    }
}

pub fn classify_npm(req: &str) -> Req {
    let req = req.trim();
    if ["workspace:", "file:", "link:", "portal:"].iter().any(|p| req.starts_with(p)) || EXACT_SEMVER.is_match(req) {
        Req::Exact
    } else {
        Req::Floating
    }
}

struct Findings {
    floating: Vec<Violation>,
    implicit: Vec<Violation>,
    structural: Vec<Violation>,
}

fn note(list: &mut Vec<Violation>, file: &str, message: String) {
    list.push(Violation { file: file.to_owned(), line: None, message });
}

fn cargo_tables(doc: &Value) -> Vec<(&'static str, &toml::Table)> {
    const KINDS: [&str; 3] = ["dependencies", "dev-dependencies", "build-dependencies"];
    let mut out: Vec<(&'static str, &toml::Table)> = Vec::new();
    let mut scopes: Vec<&Value> = vec![doc];
    if let Some(targets) = doc.get("target").and_then(Value::as_table) {
        scopes.extend(targets.values());
    }
    for scope in scopes {
        for kind in KINDS {
            if let Some(t) = scope.get(kind).and_then(Value::as_table) {
                out.push((kind, t));
            }
        }
    }
    if let Some(t) = doc.get("workspace").and_then(|w| w.get("dependencies")).and_then(Value::as_table) {
        out.push(("workspace.dependencies", t));
    }
    out
}

fn check_cargo(rel: &str, text: &str, findings: &mut Findings) {
    let doc: Value = match toml::from_str(text) {
        Ok(d) => d,
        Err(e) => {
            note(&mut findings.structural, rel, format!("unparseable Cargo.toml: {}", e.message()));
            return;
        }
    };
    for (table, deps) in cargo_tables(&doc) {
        for (name, spec) in deps {
            let version = match spec {
                Value::String(v) => Some(v.as_str()),
                Value::Table(t) => {
                    if t.get("workspace").and_then(Value::as_bool) == Some(true) {
                        continue;
                    }
                    if t.contains_key("git") && !t.contains_key("rev") {
                        note(&mut findings.floating, rel, format!("[{table}] '{name}' git dependency is not pinned to a rev"));
                        continue;
                    }
                    t.get("version").and_then(Value::as_str)
                }
                _ => None,
            };
            let Some(version) = version else { continue };
            match classify_cargo(version) {
                Req::Exact => {}
                Req::Implicit => note(
                    &mut findings.implicit,
                    rel,
                    format!("[{table}] '{name}' = \"{version}\" is pinned only by the lockfile"),
                ),
                Req::Floating => note(
                    &mut findings.floating,
                    rel,
                    format!("[{table}] '{name}' = \"{version}\" is a floating requirement"),
                ),
            }
        }
    }
}

fn check_npm(rel: &str, text: &str, findings: &mut Findings) {
    let doc: serde_json::Value = match serde_json::from_str(text) {
        Ok(d) => d,
        Err(e) => {
            note(&mut findings.structural, rel, format!("unparseable package.json: {e}"));
            return;
        }
    };
    for table in ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] {
        let Some(deps) = doc.get(table).and_then(|d| d.as_object()) else { continue };
        for (name, req) in deps {
            let req = req.as_str().unwrap_or_default();
            if classify_npm(req) == Req::Floating {
                note(&mut findings.floating, rel, format!("[{table}] '{name}' = \"{req}\" is a floating requirement"));
            }
        }
    }
}

fn has_lock(root: &Path, manifest: &Path, names: &[&str]) -> bool {
    let mut dir = manifest.parent();
    while let Some(d) = dir {
        if names.iter().any(|n| d.join(n).is_file()) {
            return true;
        }
        if d == root {
            break;
        }
        dir = d.parent();
    }
    false
}

pub fn run(root: &Path) -> Result<GateResult, CrucibleError> {
    let files = all_files(root)?;
    let by_name = |name: &str| -> Vec<PathBuf> {
        files.iter().filter(|p| p.file_name().and_then(|n| n.to_str()) == Some(name)).cloned().collect()
    };
    let cargo = by_name("Cargo.toml");
    let npm = by_name("package.json");
    let mut findings = Findings { floating: vec![], implicit: vec![], structural: vec![] };

    if cargo.is_empty() && npm.is_empty() {
        return Ok(GateResult {
            gate: GateName::Reproducibility,
            status: GateStatus::Fail,
            details: "no Cargo.toml or package.json found".into(),
            violations: vec![Violation { file: ".".into(), line: None, message: "nothing to verify".into() }],
        });
    }

    for manifest in &cargo {
        let rel = rel_string(root, manifest);
        let text = std::fs::read_to_string(manifest).map_err(|source| CrucibleError::Io { path: manifest.clone(), source })?;
        if !has_lock(root, manifest, &["Cargo.lock"]) {
            note(&mut findings.structural, &rel, "no Cargo.lock governs this manifest".into());
        }
        check_cargo(&rel, &text, &mut findings);
    }
    for manifest in &npm {
        let rel = rel_string(root, manifest);
        let text = std::fs::read_to_string(manifest).map_err(|source| CrucibleError::Io { path: manifest.clone(), source })?;
        if !has_lock(root, manifest, &["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]) {
            note(&mut findings.structural, &rel, "no lockfile governs this manifest".into());
        }
        check_npm(&rel, &text, &mut findings);
    }

    let (nf, ni, ns) = (findings.floating.len(), findings.implicit.len(), findings.structural.len());
    let status = if nf + ns > 0 {
        GateStatus::Fail
    } else if ni > 0 {
        GateStatus::Warn
    } else {
        GateStatus::Pass
    };
    let details = match status {
        GateStatus::Pass => format!("{} manifest(s), lockfile present, all versions pinned", cargo.len() + npm.len()),
        _ => format!("{ns} lockfile problem(s), {nf} floating, {ni} lockfile-pinned only"),
    };
    let mut violations = findings.structural;
    violations.extend(findings.floating);
    violations.extend(findings.implicit);
    Ok(GateResult { gate: GateName::Reproducibility, status, details, violations })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cargo_requirement_classes() {
        assert_eq!(classify_cargo("=1.2.3"), Req::Exact);
        assert_eq!(classify_cargo("1"), Req::Implicit);
        assert_eq!(classify_cargo("1.2"), Req::Implicit);
        assert_eq!(classify_cargo("1.2.3"), Req::Implicit);
        for floating in ["^1.2", "~1.2", "*", ">=1, <2", "1.*"] {
            assert_eq!(classify_cargo(floating), Req::Floating, "{floating}");
        }
    }

    #[test]
    fn npm_requirement_classes() {
        assert_eq!(classify_npm("1.2.3"), Req::Exact);
        assert_eq!(classify_npm("1.2.3-rc.1"), Req::Exact);
        assert_eq!(classify_npm("workspace:*"), Req::Exact);
        for floating in ["^1.2.3", "~1.2.3", "*", "latest", ">=1", "1.x", "1"] {
            assert_eq!(classify_npm(floating), Req::Floating, "{floating}");
        }
    }
}
