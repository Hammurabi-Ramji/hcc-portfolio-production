// crucible:allow-file(security)
//! Gate 9: Philosophy. BSM-CODE: gate.philosophy()
//!
//! Sovereignty: no dependency that phones home or needs a subscription.
//! Cargo.lock is checked in full, so transitive telemetry is caught as well as
//! direct dependencies. A missing sovereignty declaration in the README only
//! WARNs; a forbidden dependency FAILS.

use std::collections::BTreeSet;
use std::path::Path;
use std::sync::LazyLock;

use regex::Regex;

use crate::scan::{all_files, rel_string};
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

/// Exact crate or package names that report usage or require a service account.
const FORBIDDEN_EXACT: &[&str] = &[
    "segment", "mixpanel", "mixpanel-browser", "amplitude", "amplitude-js", "bugsnag", "rollbar", "newrelic",
    "dogstatsd", "posthog-rs", "posthog-js", "posthog-node", "statsig", "optimizely", "logrocket", "hotjar",
    "analytics", "react-ga", "react-ga4", "firebase", "launchdarkly-server-sdk",
];
/// Name prefixes (`sentry` matches `sentry-core`; `@sentry/` matches the scope).
const FORBIDDEN_PREFIX: &[&str] = &[
    "sentry-", "opentelemetry-", "datadog-", "newrelic-", "launchdarkly-", "@sentry/", "@datadog/",
    "@amplitude/", "@segment/", "@opentelemetry/", "@vercel/analytics", "@vercel/speed-insights",
    "@firebase/", "@hotjar/", "@launchdarkly/", "@microsoft/applicationinsights",
];
const FORBIDDEN_SCOPE_EXACT: &[&str] = &["sentry", "opentelemetry", "datadog", "tracing-opentelemetry"];

const DECLARATIONS: &[&str] = &["keep the faith, the good exists", "see a need, code a seed", "bsm-c"];

static LOCK_NAME: LazyLock<Regex> = LazyLock::new(|| Regex::new(r#"(?m)^name = "([^"]+)""#).expect("static regex"));

// package-lock: `node_modules/<name>`; pnpm-lock: `<name>@<version>` keys.
static JS_LOCK_NAME: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:node_modules/|[\s'/])((?:@[A-Za-z0-9_.-]+/)?[A-Za-z0-9_.-]+)(?:@\d|")"#).expect("static regex")
});

pub fn is_forbidden(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    FORBIDDEN_EXACT.contains(&name.as_str())
        || FORBIDDEN_SCOPE_EXACT.contains(&name.as_str())
        || FORBIDDEN_PREFIX.iter().any(|p| name.starts_with(p))
}

fn npm_names(text: &str) -> Vec<String> {
    let Ok(doc) = serde_json::from_str::<serde_json::Value>(text) else { return Vec::new() };
    ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]
        .iter()
        .filter_map(|t| doc.get(t).and_then(|d| d.as_object()))
        .flat_map(|d| d.keys().cloned())
        .collect()
}

pub fn run(root: &Path) -> Result<GateResult, CrucibleError> {
    let mut found: BTreeSet<(String, String)> = BTreeSet::new();
    for path in all_files(root)? {
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else { continue };
        let names: Vec<String> = match name {
            "Cargo.lock" | "pnpm-lock.yaml" | "package-lock.json" => {
                let Ok(text) = std::fs::read_to_string(&path) else { continue };
                if name == "Cargo.lock" {
                    LOCK_NAME.captures_iter(&text).map(|c| c[1].to_owned()).collect()
                } else {
                    JS_LOCK_NAME.captures_iter(&text).map(|c| c[1].to_owned()).collect()
                }
            }
            "package.json" => npm_names(&std::fs::read_to_string(&path).unwrap_or_default()),
            _ => continue,
        };
        let rel = rel_string(root, &path);
        for n in names.into_iter().filter(|n| is_forbidden(n)) {
            found.insert((rel.clone(), n));
        }
    }

    let mut violations: Vec<Violation> = found
        .into_iter()
        .map(|(file, name)| Violation { file, line: None, message: format!("forbidden dependency '{name}' (telemetry or subscription SDK)") })
        .collect();
    let forbidden = violations.len();

    let readme = std::fs::read_to_string(root.join("README.md")).unwrap_or_default().to_ascii_lowercase();
    let declared = DECLARATIONS.iter().any(|d| readme.contains(d));
    if !declared {
        violations.push(Violation {
            file: "README.md".into(),
            line: None,
            message: "no sovereignty declaration found (BSM-C branding or doctrine line)".into(),
        });
    }

    let status = if forbidden > 0 {
        GateStatus::Fail
    } else if !declared {
        GateStatus::Warn
    } else {
        GateStatus::Pass
    };
    let details = match (forbidden, declared) {
        (0, true) => "No forbidden dependencies; declaration present".to_owned(),
        (0, false) => "No forbidden dependencies; README declaration missing".to_owned(),
        (n, _) => format!("{n} forbidden dependenc{}", if n == 1 { "y" } else { "ies" }),
    };
    Ok(GateResult { gate: GateName::Philosophy, status, details, violations })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn forbids_telemetry_and_subscription_sdks() {
        for bad in ["sentry", "sentry-core", "@sentry/browser", "opentelemetry-otlp", "posthog-js", "firebase", "@datadog/browser-rum"] {
            assert!(is_forbidden(bad), "{bad}");
        }
        for ok in ["serde", "tauri", "tracing", "segment-tree", "analytics-free", "rust-embed"] {
            assert!(!is_forbidden(ok), "{ok}");
        }
    }
}
