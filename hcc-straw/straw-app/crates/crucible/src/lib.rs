//! Crucible: the Nine Gates validation engine.
//!
//! All nine gates must run exactly once and pass before a run is certified.

pub mod exec;
pub mod gates;
#[cfg(feature = "stele")]
pub mod mint;
pub mod report;
pub mod scan;
pub mod evidence;

use std::fmt;
use std::path::PathBuf;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum CrucibleError {
    #[error("{0} is not a directory")]
    NotADirectory(PathBuf),
    #[error("cannot read {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("directory walk failed: {0}")]
    Walk(#[from] walkdir::Error),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GateName {
    Structure,
    Completeness,
    Security,
    Reproducibility,
    Portability,
    Compilation,
    Tests,
    Lint,
    Philosophy,
}

impl GateName {
    pub const ALL: [GateName; 9] = [
        GateName::Structure,
        GateName::Completeness,
        GateName::Security,
        GateName::Reproducibility,
        GateName::Portability,
        GateName::Compilation,
        GateName::Tests,
        GateName::Lint,
        GateName::Philosophy,
    ];

    pub fn number(self) -> u8 {
        Self::ALL.iter().position(|g| *g == self).map_or(0, |i| i as u8 + 1)
    }

    pub fn as_str(self) -> &'static str {
        match self {
            GateName::Structure => "structure",
            GateName::Completeness => "completeness",
            GateName::Security => "security",
            GateName::Reproducibility => "reproducibility",
            GateName::Portability => "portability",
            GateName::Compilation => "compilation",
            GateName::Tests => "tests",
            GateName::Lint => "lint",
            GateName::Philosophy => "philosophy",
        }
    }

    pub fn bsm_code(self) -> String {
        format!("gate.{}()", self.as_str())
    }

    /// Every gate is implemented; kept so callers can ask without special-casing.
    pub fn implemented(self) -> bool {
        GateName::ALL.contains(&self)
    }
}

impl fmt::Display for GateName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for GateName {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.trim().to_ascii_lowercase();
        GateName::ALL
            .iter()
            .copied()
            .find(|g| g.as_str() == s || g.number().to_string() == s)
            .ok_or_else(|| format!("unknown gate '{s}' (expected a name or 1-9)"))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GateStatus {
    Pass,
    Warn,
    Fail,
    Skipped,
}

impl fmt::Display for GateStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            GateStatus::Pass => "PASS",
            GateStatus::Warn => "WARN",
            GateStatus::Fail => "FAIL",
            GateStatus::Skipped => "SKIP",
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Violation {
    /// Path relative to the validated project root, `/`-separated.
    pub file: String,
    pub line: Option<usize>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GateResult {
    pub gate: GateName,
    pub status: GateStatus,
    pub details: String,
    pub violations: Vec<Violation>,
}

impl GateResult {
    pub fn skipped(gate: GateName) -> Self {
        GateResult {
            gate,
            status: GateStatus::Skipped,
            details: "gate did not run".to_owned(),
            violations: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CompositeStatus {
    SovereignCertified,
    PassWithWarnings,
    Blocked,
    /// No gate failed, but at least one gate did not run.
    Incomplete,
}

impl fmt::Display for CompositeStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            CompositeStatus::SovereignCertified => "SOVEREIGN CERTIFIED",
            CompositeStatus::PassWithWarnings => "PASS WITH WARNINGS",
            CompositeStatus::Blocked => "BLOCKED",
            CompositeStatus::Incomplete => "INCOMPLETE",
        })
    }
}

pub fn composite_status(results: &[GateResult]) -> CompositeStatus {
    if results.iter().any(|r| r.status == GateStatus::Fail) {
        CompositeStatus::Blocked
    } else if results.len() != GateName::ALL.len()
        || GateName::ALL.iter().any(|gate| results.iter().filter(|r| r.gate == *gate).count() != 1)
        || results.iter().any(|r| r.status == GateStatus::Skipped) {
        CompositeStatus::Incomplete
    } else if results.iter().any(|r| r.status == GateStatus::Warn) {
        CompositeStatus::PassWithWarnings
    } else {
        CompositeStatus::SovereignCertified
    }
}

#[cfg(test)]
mod certification_tests {
    use super::*;
    fn passed(gate: GateName) -> GateResult {
        GateResult { gate, status: GateStatus::Pass, details: "passed".into(), violations: vec![] }
    }
    #[test]
    fn certification_requires_every_distinct_gate() {
        assert_eq!(composite_status(&[]), CompositeStatus::Incomplete);
        assert_eq!(composite_status(&[passed(GateName::Structure)]), CompositeStatus::Incomplete);
        assert_eq!(composite_status(&vec![passed(GateName::Structure); 9]), CompositeStatus::Incomplete);
        assert_eq!(composite_status(&GateName::ALL.map(passed)), CompositeStatus::SovereignCertified);
    }
}
