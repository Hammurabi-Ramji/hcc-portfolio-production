// crucible:allow-file(completeness)
//! Gate 2: Completeness. BSM-CODE: gate.completeness()
//!
//! Zero placeholder markers in source. Matching is case-insensitive and on
//! word boundaries. `placeholder` used as an API/markup name (`placeholder=`,
//! `placeholder:`, `::placeholder`, `.placeholder`) is not a marker.

use std::path::Path;
use std::sync::LazyLock;

use regex::Regex;

use crate::scan::{file_allows, has_extension, line_allows, source_files};
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

const GATE: &str = "completeness";
const EXTENSIONS: &[&str] = &["rs", "ts", "tsx", "js", "jsx", "mjs", "svelte", "md", "html", "css", "sql"];

static MARKERS: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?i)\b(TBD|FIXME|TODO|STUB|HACK|UNIMPLEMENTED|NOT[ _]IMPLEMENTED|PLACEHOLDER)\b|\.\.\.\s*rest follows",
    )
    .expect("static completeness regex")
});

fn is_api_use_of_placeholder(line: &str, start: usize, end: usize) -> bool {
    let before = &line[..start];
    let after = line[end..].trim_start();
    before.ends_with("::")
        || before.ends_with('.')
        || before.ends_with('-')
        || after.starts_with('=')
        || (after.starts_with(':') && !after.starts_with("::"))
}

pub fn run(root: &Path) -> Result<GateResult, CrucibleError> {
    let files = source_files(root, |p| has_extension(p, EXTENSIONS))?;
    let mut violations = Vec::new();
    let mut suppressed = 0usize;

    for file in &files {
        if file_allows(&file.content, GATE) {
            suppressed += 1;
            continue;
        }
        for (idx, line) in file.content.lines().enumerate() {
            let mut hits = Vec::new();
            for m in MARKERS.find_iter(line) {
                if m.as_str().eq_ignore_ascii_case("placeholder")
                    && is_api_use_of_placeholder(line, m.start(), m.end())
                {
                    continue;
                }
                hits.push(m.as_str().to_owned());
            }
            if hits.is_empty() {
                continue;
            }
            if line_allows(line, GATE) {
                suppressed += 1;
                continue;
            }
            for marker in hits {
                violations.push(Violation {
                    file: file.rel.clone(),
                    line: Some(idx + 1),
                    message: format!("placeholder marker '{marker}'"),
                });
            }
        }
    }

    let mut details = format!("{} placeholder markers found", violations.len());
    if suppressed > 0 {
        details.push_str(&format!(" ({suppressed} suppressed)"));
    }
    Ok(GateResult {
        gate: GateName::Completeness,
        status: if violations.is_empty() { GateStatus::Pass } else { GateStatus::Fail },
        details,
        violations,
    })
}
