//! Svelte 5 rune conformance suite for the native `rsvelte_core` compiler (D9 gate).
//!
//! Scope — what this suite proves, and what it does not:
//!
//! * **Specified behaviour.** Each rune compiles in runes mode to the client
//!   runtime call upstream Svelte 5 specifies, and each invalid placement is
//!   rejected with the upstream error code (`https://svelte.dev/e/<code>`).
//! * **Compiler↔runtime ABI.** Every `$.name` the compiler emits must be
//!   exported by the vendored browser runtime (`third-party/svelte`, 5.57.1).
//!   A missing export is a load-time `TypeError` in the shipped page.
//! * **Not differential.** Output is not byte-compared against the reference
//!   JavaScript compiler: no reference snapshots exist on the sovereign path
//!   (the pinned rsvelte checkout ships its upstream submodules empty).
//!   Differential conformance stays Specified until reference outputs are
//!   vendored as fixtures.
//!
//! Every failure is a hard test failure (fail-closed); nothing is skipped.

use std::collections::BTreeSet;
use std::path::Path;

use rsvelte_core::{compile, CompileOptions, CssMode, GenerateMode};

/// Compile exactly as `frontend-build` does for the shipped UI.
fn compile_client(name: &str, source: &str) -> Result<String, String> {
    let result = compile(
        source,
        CompileOptions {
            filename: Some(format!("{name}.svelte")),
            generate: GenerateMode::Client,
            runes: Some(true),
            css: CssMode::Injected,
            dev: false,
            disclose_version: false,
            enable_sourcemap: false,
            ..Default::default()
        },
    )
    .map_err(|e| format!("{e:?}"))?;
    if !result.metadata.runes {
        return Err(format!("{name}: not compiled in runes mode"));
    }
    Ok(result.js.code)
}

/// A rune fixture and the runtime calls its client output must contain.
struct Positive {
    rune: &'static str,
    source: &'static str,
    must_contain: &'static [&'static str],
    must_not_contain: &'static [&'static str],
}

const POSITIVE: &[Positive] = &[
    Positive {
        rune: "$state",
        source: "<script>let count = $state(0);</script><button onclick={() => count++}>{count}</button>",
        must_contain: &["$.state(0)", "$.get(count)", "$.update(count)"],
        must_not_contain: &["$state"],
    },
    Positive {
        rune: "$state (deep proxy)",
        source: "<script>let o = $state({ a: 1 });</script><button onclick={() => o.a++}>{o.a}</button>",
        must_contain: &["$.proxy("],
        must_not_contain: &["$state"],
    },
    Positive {
        rune: "$state.raw (no proxy)",
        source: "<script>let o = $state.raw({ a: 1 });</script><button onclick={() => (o = { a: o.a + 1 })}>{o.a}</button>",
        must_contain: &["$.state(", "$.set(o"],
        must_not_contain: &["$.proxy(", "$state"],
    },
    Positive {
        rune: "$derived",
        source: "<script>let n = $state(1); let d = $derived(n * 2);</script><button onclick={() => n++}>{d}</button>",
        must_contain: &["$.derived(() => $.get(n) * 2)", "$.get(d)"],
        must_not_contain: &["$derived"],
    },
    Positive {
        rune: "$derived.by",
        source: "<script>let n = $state(1); let d = $derived.by(() => n * 3);</script><button onclick={() => n++}>{d}</button>",
        must_contain: &["$.derived(", "$.get(n) * 3"],
        must_not_contain: &["$derived"],
    },
    Positive {
        rune: "$effect",
        source: "<script>let n = $state(1); $effect(() => { document.title = String(n); });</script><button onclick={() => n++}>{n}</button>",
        must_contain: &["$.user_effect(", "$.push($$props, true)", "$.pop()"],
        must_not_contain: &["$effect", "$.user_pre_effect("],
    },
    Positive {
        rune: "$effect.pre",
        source: "<script>let n = $state(1); $effect.pre(() => { document.title = String(n); });</script><button onclick={() => n++}>{n}</button>",
        must_contain: &["$.user_pre_effect("],
        must_not_contain: &["$effect"],
    },
    Positive {
        rune: "$props",
        source: "<script>let { label = 'x' } = $props();</script><p>{label}</p>",
        must_contain: &["$.prop($$props, 'label',", "label()"],
        must_not_contain: &["$props()"],
    },
    Positive {
        rune: "$bindable",
        source: "<script>let { value = $bindable(0) } = $props();</script><button onclick={() => value++}>{value}</button>",
        must_contain: &["$.prop($$props, 'value',", "$.update_prop(value)"],
        must_not_contain: &["$bindable", "$props()"],
    },
    Positive {
        rune: "$inspect (stripped in production)",
        source: "<script>let n = $state(1); $inspect(n);</script><button onclick={() => n++}>{n}</button>",
        must_contain: &["$.state(1)"],
        must_not_contain: &["inspect"],
    },
];

/// Invalid rune usage and the upstream error code it must produce.
const NEGATIVE: &[(&str, &str, &str)] = &[
    (
        "$state outside an initializer",
        "<script>let x = 1 + $state(0);</script>{x}",
        "state_invalid_placement",
    ),
    (
        "$props called twice",
        "<script>let a = $props(); let b = $props();</script>{a}{b}",
        "props_duplicate",
    ),
    (
        "$bindable outside $props",
        "<script>let v = $bindable(0);</script>{v}",
        "bindable_invalid_location",
    ),
    (
        "$effect without an argument",
        "<script>$effect();</script>",
        "rune_invalid_arguments_length",
    ),
    (
        "$derived without an argument",
        "<script>let d = $derived();</script>{d}",
        "rune_invalid_arguments_length",
    ),
];

#[test]
fn each_rune_compiles_to_its_specified_runtime_call() {
    let mut failures = Vec::new();
    for (i, case) in POSITIVE.iter().enumerate() {
        match compile_client(&format!("Rune{i}"), case.source) {
            Err(e) => failures.push(format!("{}: compile failed: {e}", case.rune)),
            Ok(code) => {
                for needle in case.must_contain {
                    if !code.contains(needle) {
                        failures.push(format!("{}: missing `{needle}`", case.rune));
                    }
                }
                for needle in case.must_not_contain {
                    if code.contains(needle) {
                        failures.push(format!("{}: unexpected `{needle}`", case.rune));
                    }
                }
            }
        }
    }
    assert!(
        failures.is_empty(),
        "rune divergences:\n{}",
        failures.join("\n")
    );
}

#[test]
fn each_invalid_rune_use_fails_with_the_upstream_error_code() {
    let mut failures = Vec::new();
    for (i, (label, source, code)) in NEGATIVE.iter().enumerate() {
        match compile_client(&format!("Invalid{i}"), source) {
            Ok(_) => failures.push(format!("{label}: compiled, expected `{code}`")),
            Err(e) => {
                let expected = format!("code: \"{code}\"");
                if !e.contains(&expected) {
                    failures.push(format!("{label}: expected `{code}`, got {e}"));
                }
            }
        }
    }
    assert!(
        failures.is_empty(),
        "error-code divergences:\n{}",
        failures.join("\n")
    );
}

/// Exported names of the vendored runtime's `svelte/internal/client` entry.
/// Fails closed on `export *`, which this parser cannot enumerate.
fn runtime_exports(index_js: &str) -> BTreeSet<String> {
    assert!(
        !index_js.contains("export *"),
        "runtime index uses `export *`; exports cannot be enumerated"
    );
    let mut names = BTreeSet::new();
    let mut rest = index_js;
    while let Some(start) = rest.find("export {") {
        let after = &rest[start + "export {".len()..];
        let end = after.find('}').expect("unterminated export list");
        for item in after[..end].split(',') {
            let item = item.trim();
            if item.is_empty() {
                continue;
            }
            let exported = item.rsplit(" as ").next().unwrap_or(item).trim();
            names.insert(exported.to_string());
        }
        rest = &after[end..];
    }
    for line in index_js.lines() {
        for prefix in [
            "export function ",
            "export const ",
            "export let ",
            "export var ",
        ] {
            if let Some(tail) = line.trim_start().strip_prefix(prefix) {
                let name: String = tail
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '_' || *c == '$')
                    .collect();
                names.insert(name);
            }
        }
    }
    names
}

/// Every `$.name` reference in compiled output.
fn runtime_calls(code: &str) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    let bytes = code.as_bytes();
    let mut i = 0;
    while i + 2 < bytes.len() {
        let preceded_by_ident = i > 0 && {
            let p = bytes[i - 1];
            p.is_ascii_alphanumeric() || p == b'_' || p == b'$'
        };
        if bytes[i] == b'$' && bytes[i + 1] == b'.' && !preceded_by_ident {
            let name: String = code[i + 2..]
                .chars()
                .take_while(|c| c.is_ascii_alphanumeric() || *c == '_')
                .collect();
            if !name.is_empty() {
                names.insert(name);
            }
        }
        i += 1;
    }
    names
}

#[test]
fn every_emitted_runtime_call_is_exported_by_the_vendored_runtime() {
    let index = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../third-party/svelte/src/internal/client/index.js");
    let index_js = std::fs::read_to_string(&index)
        .unwrap_or_else(|e| panic!("cannot read {}: {e}", index.display()));
    let exports = runtime_exports(&index_js);
    assert!(
        exports.len() > 50,
        "implausibly few runtime exports: {}",
        exports.len()
    );

    let mut used = BTreeSet::new();
    for (i, case) in POSITIVE.iter().enumerate() {
        let code = compile_client(&format!("Abi{i}"), case.source)
            .unwrap_or_else(|e| panic!("{}: {e}", case.rune));
        used.extend(runtime_calls(&code));
    }
    // The shipped UI components are part of the ABI surface too.
    let ui = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../ui");
    let mut shipped = 0;
    for entry in std::fs::read_dir(&ui).expect("ui directory") {
        let path = entry.expect("ui entry").path();
        if path.extension().is_some_and(|e| e == "svelte") {
            let source = std::fs::read_to_string(&path).expect("read component");
            let stem = path
                .file_stem()
                .expect("stem")
                .to_string_lossy()
                .into_owned();
            let code = compile_client(&stem, &source)
                .unwrap_or_else(|e| panic!("{}: {e}", path.display()));
            used.extend(runtime_calls(&code));
            shipped += 1;
        }
    }
    assert!(shipped > 0, "no shipped .svelte components found under ui/");

    let missing: Vec<_> = used.difference(&exports).collect();
    assert!(
        missing.is_empty(),
        "compiler emits runtime calls the vendored runtime does not export: {missing:?}"
    );
}

#[test]
fn export_parser_handles_renames_and_declarations() {
    let src = "export { a, b as c } from './x.js';\nexport {\n  d,\n  e as f\n} from './y.js';\nexport function g() {}\nexport const h = 1;";
    let names: Vec<_> = runtime_exports(src).into_iter().collect();
    assert_eq!(names, ["a", "c", "d", "f", "g", "h"]);
}

#[test]
fn call_scanner_ignores_member_access_on_other_identifiers() {
    let names: Vec<_> = runtime_calls("$.get(x); a$.no(); $$props.y; $.set(x, 1)")
        .into_iter()
        .collect();
    assert_eq!(names, ["get", "set"]);
}
