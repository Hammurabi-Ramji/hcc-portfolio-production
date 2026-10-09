use sha2::{Digest, Sha256};
use base64::Engine;
use std::{
    fs,
    path::{Path, PathBuf},
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn files(root: &Path, directory: &Path, output: &mut Vec<PathBuf>) -> Result<()> {
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        if kind.is_symlink() {
            return Err("linked assets are not allowed in the offline shell".into());
        }
        let path = entry.path();
        if entry.file_name().to_string_lossy().starts_with('.') {
            continue;
        }
        if kind.is_dir() {
            files(root, &path, output)?;
        } else if kind.is_file() && path != root.join("precache-manifest.js") {
            output.push(path);
        }
    }
    Ok(())
}

fn manifest(root: &Path) -> Result<String> {
    let mut paths = Vec::new();
    files(root, root, &mut paths)?;
    paths.sort();
    let mut hash = Sha256::new();
    let mut urls = vec!["/".to_string()];
    for path in paths {
        let relative = path
            .strip_prefix(root)?
            .to_str()
            .ok_or("asset path must be UTF-8")?
            .replace('\\', "/");
        if !relative
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"/.-_".contains(&b))
        {
            return Err(format!("asset path is not a portable URL: {relative}").into());
        }
        let data = fs::read(&path)?;
        hash.update((relative.len() as u64).to_le_bytes());
        hash.update(relative.as_bytes());
        hash.update((data.len() as u64).to_le_bytes());
        hash.update(&data);
        urls.push(format!("/{relative}"));
    }
    let cache = format!("straw-shell-{:x}", hash.finalize());
    Ok(format!(
        "self.SHELL_CACHE={};\nself.SHELL_URLS={};\n",
        serde_json::to_string(&cache)?,
        serde_json::to_string(&urls)?
    ))
}

pub fn write_manifest(root: &Path) -> Result<()> {
    let index = root.join("index.html");
    let html = fs::read_to_string(&index)?;
    let imports = html.split("<script type=\"importmap\">").nth(1)
        .and_then(|s| s.split("</script>").next()).ok_or("PWA is missing its import map")?;
    let digest = base64::engine::general_purpose::STANDARD.encode(Sha256::digest(imports.as_bytes()));
    let csp = format!("default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-{digest}'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:8741; worker-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'");
    if !html.contains("__STRAW_CSP__") { return Err("PWA CSP placeholder is missing".into()); }
    fs::write(&index, html.replace("__STRAW_CSP__", &csp))?;
    let text = manifest(root)?;
    fs::write(root.join("precache-manifest.js"), text)?;
    verify(root)
}

pub fn verify(root: &Path) -> Result<()> {
    for required in [
        "index.html",
        "wasm-frontend.js",
        "wasm-frontend_bg.wasm",
        "manifest.webmanifest",
        "sw.js",
        "icon.svg",
        "public/ui/main.js",
        "public/ui/routes.js",
        "public/ui/vendor/licenses/svelte-LICENSE.md",
    ] {
        if !root.join(required).is_file() {
            return Err(format!("offline shell is missing {required}").into());
        }
    }
    let html = fs::read_to_string(root.join("index.html"))?;
    if html.contains("__STRAW_CSP__") || !html.contains("Content-Security-Policy") || !html.contains("script-src 'self' 'wasm-unsafe-eval' 'sha256-") {
        return Err("PWA script policy was not finalized".into());
    }
    let imports = html.find("<script type=\"importmap\">").ok_or("PWA is missing its import map")?;
    let modules = html.find("<script type=\"module\"").ok_or("PWA is missing its application module")?;
    if imports > modules || html.contains("TrunkApplicationStarted") {
        return Err("import map must precede modules and WASM initialization must be owned by the UI".into());
    }
    if fs::read_to_string(root.join("precache-manifest.js"))? != manifest(root)? {
        return Err("offline cache manifest does not match the built asset contents".into());
    }
    let app: serde_json::Value =
        serde_json::from_slice(&fs::read(root.join("manifest.webmanifest"))?)?;
    if app["start_url"] != "/#/modules" || app["scope"] != "/" || app["display"] != "standalone" {
        return Err("PWA manifest routing or scope is invalid".into());
    }
    let mut paths = Vec::new();
    files(root, root, &mut paths)?;
    println!(
        "Verified static PWA: {} content-versioned assets, manifest, worker, licenses, and WASM.",
        paths.len()
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cache_version_tracks_content_and_ignores_creation_order_and_prior_manifest() {
        let a = tempfile::tempdir().unwrap();
        let b = tempfile::tempdir().unwrap();
        fs::write(a.path().join("index.html"), "shell").unwrap();
        fs::write(a.path().join("compute.wasm"), [0, 1, 2]).unwrap();
        fs::write(b.path().join("compute.wasm"), [0, 1, 2]).unwrap();
        fs::write(b.path().join("index.html"), "shell").unwrap();
        let original = manifest(a.path()).unwrap();
        assert_eq!(original, manifest(b.path()).unwrap());
        fs::write(a.path().join("precache-manifest.js"), "old cache").unwrap();
        assert_eq!(original, manifest(a.path()).unwrap());
        fs::write(a.path().join("compute.wasm"), [0, 1, 3]).unwrap();
        assert_ne!(original, manifest(a.path()).unwrap());
        assert!(original.contains("/index.html") && original.contains("/compute.wasm"));
    }
}
