//! Gate 3: Security. BSM-CODE: gate.security()
//!
//! * No private keys, cloud access keys, or hardcoded credential assignments.
//! * No non-loopback `http://` URLs (HTTPS enforced).
//! * `.env` files must be excluded by a `.gitignore` on the path to the git root.
//!
//! Violation messages name the pattern and location only; matched secret
//! values are never echoed.

use std::fs;
use std::path::Path;
use std::sync::LazyLock;

use regex::Regex;

use crate::scan::{
    all_files, file_allows, has_extension, is_lockfile, line_allows, rel_string, source_files,
};
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

const GATE: &str = "security";
const EXTENSIONS: &[&str] = &[
    "rs", "ts", "tsx", "js", "jsx", "mjs", "svelte", "html", "css", "sql", "toml", "yaml", "yml",
    "json", "env",
];

static PRIVATE_KEY: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"-----BEGIN [A-Z ]*PRIVATE KEY-----").expect("static regex"));
static AWS_KEY: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\bAKIA[0-9A-Z]{16}\b").expect("static regex"));
static CREDENTIAL: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r#"(?i)\b(?:api[_-]?key|secret[_-]?key|secret|access[_-]?token|auth[_-]?token|token|password|passwd|private[_-]?key)\b["']?\s*[:=]\s*["']([^"'\s]{8,})["']"#,
    )
    .expect("static regex")
});
static HTTP_URL: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"http://([A-Za-z0-9._\-\[\]:]+)").expect("static regex"));

/// Hosts where plain HTTP is not a transport-security finding.
fn http_host_exempt(host: &str) -> bool {
    let host = host.split(':').next().unwrap_or(host).to_ascii_lowercase();
    let host = host.trim_matches(|c| c == '[' || c == ']');
    host.is_empty()
        || host == "localhost"
        || host == "0.0.0.0"
        || host == "127.0.0.1"
        || host == "1"
        || host.ends_with(".localhost")
        || host.ends_with(".test")
        || host == "www.w3.org"
        || host == "json-schema.org"
        || host == "example.com"
        || host == "example.org"
        || host == "example.net"
}

/// A value that references configuration rather than embedding a secret.
fn is_reference(value: &str) -> bool {
    value.starts_with('$') || value.starts_with('{') || value.starts_with('<')
        || value.starts_with("process.env")
}

fn ignores_env(gitignore: &str) -> bool {
    gitignore.lines().map(str::trim).any(|l| {
        matches!(l, ".env" | "/.env" | "**/.env" | ".env*" | "/.env*" | "*.env" | ".env/")
    })
}

/// Whether a `.gitignore` between `root` and the enclosing git root excludes `.env`.
fn env_is_ignored(root: &Path) -> bool {
    let mut dir = Some(root);
    while let Some(d) = dir {
        if let Ok(text) = fs::read_to_string(d.join(".gitignore")) {
            if ignores_env(&text) {
                return true;
            }
        }
        if d.join(".git").exists() {
            break;
        }
        dir = d.parent();
    }
    false
}

fn is_env_file(path: &Path) -> bool {
    path.file_name().and_then(|n| n.to_str()) == Some(".env")
}

fn is_env_template(path: &Path) -> bool {
    path.file_name()
        .and_then(|n| n.to_str())
        .is_some_and(|n| n.starts_with(".env.") && n.len() > 5)
}

pub fn run(root: &Path) -> Result<GateResult, CrucibleError> {
    let files = source_files(root, |p| {
        !is_lockfile(p) && !is_env_file(p) && (has_extension(p, EXTENSIONS) || is_env_template(p))
    })?;

    let mut violations = Vec::new();
    let mut secrets = 0usize;
    let mut insecure = 0usize;
    let mut suppressed = 0usize;

    for file in &files {
        if file_allows(&file.content, GATE) {
            suppressed += 1;
            continue;
        }
        for (idx, line) in file.content.lines().enumerate() {
            let mut findings: Vec<(&str, bool)> = Vec::new();
            if PRIVATE_KEY.is_match(line) {
                findings.push(("private key block in source", true));
            }
            if AWS_KEY.is_match(line) {
                findings.push(("AWS access key id in source", true));
            }
            if CREDENTIAL
                .captures_iter(line)
                .any(|c| c.get(1).is_some_and(|v| !is_reference(v.as_str())))
            {
                findings.push(("hardcoded credential assignment", true));
            }
            if HTTP_URL.captures_iter(line).any(|c| !http_host_exempt(&c[1])) {
                findings.push(("non-HTTPS URL", false));
            }
            if findings.is_empty() {
                continue;
            }
            if line_allows(line, GATE) {
                suppressed += 1;
                continue;
            }
            for (message, is_secret) in findings {
                if is_secret {
                    secrets += 1;
                } else {
                    insecure += 1;
                }
                violations.push(Violation {
                    file: file.rel.clone(),
                    line: Some(idx + 1),
                    message: message.to_owned(),
                });
            }
        }
    }

    // .env hygiene: a present .env must be ignored; with none present, a missing rule only warns.
    let env_files: Vec<_> = all_files(root)?.into_iter().filter(|p| is_env_file(p)).collect();
    let ignored = env_is_ignored(root);
    let mut warn = false;
    if !ignored {
        if env_files.is_empty() {
            warn = true;
            violations.push(Violation {
                file: ".gitignore".to_owned(),
                line: None,
                message: "no .env exclusion rule found".to_owned(),
            });
        } else {
            for p in &env_files {
                violations.push(Violation {
                    file: rel_string(root, p),
                    line: None,
                    message: ".env file present and not excluded by .gitignore".to_owned(),
                });
            }
        }
    }

    let env_failures = if warn { 0 } else { env_files.len() * usize::from(!ignored) };
    let failed = secrets + insecure + env_failures > 0;
    let status = if failed {
        GateStatus::Fail
    } else if warn {
        GateStatus::Warn
    } else {
        GateStatus::Pass
    };

    let details = if violations.is_empty() {
        "No secrets in source".to_owned()
    } else {
        let mut d = format!(
            "{secrets} secret(s), {insecure} non-HTTPS URL(s), {} .env issue(s)",
            violations.len() - secrets - insecure
        );
        if suppressed > 0 {
            d.push_str(&format!(" ({suppressed} suppressed)"));
        }
        d
    };

    Ok(GateResult { gate: GateName::Security, status, details, violations })
}
