// crucible:allow-file(portability)
// crucible:allow-file(completeness)
//! Gate 5: Portability. BSM-CODE: gate.portability()
//!
//! No hardcoded OS-specific absolute paths in source or config: Windows drive
//! paths (`C:\...`) and Unix roots (`/home/`, `/usr/`, `/etc/`, `/Users/`, ...).
//! Windows 11 and Linux must both work from the same artifact.

use std::path::Path;
use std::sync::LazyLock;

use regex::Regex;

use crate::scan::{file_allows, has_extension, is_lockfile, line_allows, source_files};
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

const GATE: &str = "portability";
const EXTENSIONS: &[&str] = &[
    "rs", "ts", "tsx", "js", "jsx", "mjs", "svelte", "html", "css", "sql", "toml", "yaml", "yml", "json", "ps1", "sh",
];

static WINDOWS_DRIVE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)\b[a-z]:\\{1,2}[A-Za-z0-9_$%.]").expect("static regex"));
static UNIX_ROOT: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:^|[\s"'(=:,\[])/(?:home|Users|usr|etc|var|opt|root|mnt|srv)/"#).expect("static regex")
});

pub fn run(root: &Path) -> Result<GateResult, CrucibleError> {
    let files = source_files(root, |p| !is_lockfile(p) && has_extension(p, EXTENSIONS))?;
    let mut violations = Vec::new();
    let mut suppressed = 0usize;

    for file in &files {
        if file_allows(&file.content, GATE) {
            suppressed += 1;
            continue;
        }
        for (idx, line) in file.content.lines().enumerate() {
            let message = if WINDOWS_DRIVE.is_match(line) {
                "hardcoded Windows drive path"
            } else if UNIX_ROOT.is_match(line) {
                "hardcoded Unix absolute path"
            } else {
                continue;
            };
            if line_allows(line, GATE) {
                suppressed += 1;
                continue;
            }
            violations.push(Violation { file: file.rel.clone(), line: Some(idx + 1), message: message.to_owned() });
        }
    }

    let mut details = if violations.is_empty() {
        "No hardcoded paths".to_owned()
    } else {
        format!("{} hardcoded path(s)", violations.len())
    };
    if suppressed > 0 {
        details.push_str(&format!(" ({suppressed} suppressed)"));
    }
    Ok(GateResult {
        gate: GateName::Portability,
        status: if violations.is_empty() { GateStatus::Pass } else { GateStatus::Fail },
        details,
        violations,
    })
}
