# ============================================================
#  SUE Release Builder  —  build-release.ps1
#  Produces: release\SUE-v5.0.0-Windows.zip
#
#  Run from the repo root:  .\build-release.ps1
#  Prerequisites:
#    - Rust + cargo          (rustup.rs)
#    - wasm-pack             (cargo install wasm-pack)
#    - Node.js 18+           (nodejs.org)
#    - pnpm                  (npm i -g pnpm)
#    - @vercel/pkg           (npm i -g @vercel/pkg)  ← only needed to rebuild exes
# ============================================================

$ErrorActionPreference = "Stop"
$version  = "5.0.0"
$releaseDir   = "release"
$pkgDir   = "$releaseDir\SUE-v${version}-Windows"

$GREEN  = "`e[32m"
$YELLOW = "`e[33m"
$CYAN   = "`e[36m"
$BOLD   = "`e[1m"
$RESET  = "`e[0m"

function Step($msg)  { Write-Host "`n${CYAN}▸${RESET} ${BOLD}$msg${RESET}" }
function Ok($msg)    { Write-Host "  ${GREEN}✓${RESET} $msg" }
function Warn($msg)  { Write-Host "  ${YELLOW}!${RESET} $msg" }
function Die($msg)   { Write-Host "`n${BOLD}[FAIL]${RESET} $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
Write-Host "${BOLD}║       SUE Release Builder  v${version}                    ║${RESET}"
Write-Host "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

# ──────────────────────────────────────────────────────────────────────────────
# 0. Prerequisite checks
# ──────────────────────────────────────────────────────────────────────────────
Step "Checking prerequisites"

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Die "cargo not found. Install Rust from https://rustup.rs"
}
Ok "cargo $(cargo --version)"

if (-not (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
    Warn "wasm-pack not found — attempting install via cargo..."
    cargo install wasm-pack
}
Ok "wasm-pack $(wasm-pack --version)"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Die "Node.js not found. Install from https://nodejs.org"
}
Ok "node $(node --version)"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Warn "pnpm not found — installing..."
    npm install -g pnpm
}
Ok "pnpm $(pnpm --version)"

# ──────────────────────────────────────────────────────────────────────────────
# 1. Install Node dependencies
# ──────────────────────────────────────────────────────────────────────────────
Step "Installing Node dependencies"
pnpm install --frozen-lockfile
Ok "node_modules ready"

# ──────────────────────────────────────────────────────────────────────────────
# 2. Build Rust / WASM  (the most time-consuming step — ~3-5 min first time)
# ──────────────────────────────────────────────────────────────────────────────
Step "Building Rust WASM  (this takes a few minutes first run)"
Push-Location sue-view
try {
    wasm-pack build --release --target web --no-opt
    Ok "WASM compiled → sue-view/pkg/"
} finally {
    Pop-Location
}

# ──────────────────────────────────────────────────────────────────────────────
# 3. Webpack bundle  (copies all JS/CSS/HTML/icons to dist/)
# ──────────────────────────────────────────────────────────────────────────────
Step "Bundling extension (webpack)"
pnpm run bundle
Ok "dist/ assembled"

# ──────────────────────────────────────────────────────────────────────────────
# 4. Build backend executables  (skip if already up-to-date)
# ──────────────────────────────────────────────────────────────────────────────
Step "Building backend executables"

$pkgCmd = Get-Command pkg -ErrorAction SilentlyContinue
if (-not $pkgCmd) {
    $pkgCmd = Get-Command npx -ErrorAction SilentlyContinue
    $pkgPrefix = "npx --yes @vercel/pkg"
} else {
    $pkgPrefix = "pkg"
}

$apiExe  = "installer\assets\sue-api.exe"
$hostExe = "installer\assets\sue-host.exe"

if (-not (Test-Path $apiExe) -or ((Get-Item $apiExe).LastWriteTime -lt (Get-Item "local-api-server.js").LastWriteTime)) {
    Warn "Rebuilding sue-api.exe..."
    Invoke-Expression "$pkgPrefix local-api-server.js --target node18-win-x64 --output $apiExe"
    Ok "sue-api.exe rebuilt"
} else {
    Ok "sue-api.exe is up-to-date"
}

if (-not (Test-Path $hostExe) -or ((Get-Item $hostExe).LastWriteTime -lt (Get-Item "native-host\host.js").LastWriteTime)) {
    Warn "Rebuilding sue-host.exe..."
    Invoke-Expression "$pkgPrefix native-host\host.js --target node18-win-x64 --output $hostExe"
    Copy-Item $hostExe "native-host\sue-host.exe" -Force
    Ok "sue-host.exe rebuilt"
} else {
    Ok "sue-host.exe is up-to-date"
}

# ──────────────────────────────────────────────────────────────────────────────
# 5. Compile the installer executable
# ──────────────────────────────────────────────────────────────────────────────
Step "Compiling installer (SUE-Setup.exe)"

New-Item -ItemType Directory -Force $releaseDir | Out-Null
Push-Location installer
try {
    Invoke-Expression "$pkgPrefix . --output ..\$releaseDir\SUE-Setup.exe"
    Ok "SUE-Setup.exe → $releaseDir\SUE-Setup.exe ($([Math]::Round((Get-Item "..\$releaseDir\SUE-Setup.exe").Length / 1MB, 1)) MB)"
} finally {
    Pop-Location
}

# ──────────────────────────────────────────────────────────────────────────────
# 6. Assemble the release package directory
# ──────────────────────────────────────────────────────────────────────────────
Step "Assembling release package"

if (Test-Path $pkgDir) { Remove-Item -Recurse -Force $pkgDir }
New-Item -ItemType Directory -Force "$pkgDir\extension" | Out-Null

# Copy entire extension (dist/) into extension/ subfolder
Copy-Item -Recurse "dist\*" "$pkgDir\extension\" -Force
Ok "dist/ → $pkgDir\extension\ ($((Get-ChildItem "$pkgDir\extension" -Recurse -File).Count) files)"

# Copy installer
Copy-Item "$releaseDir\SUE-Setup.exe" "$pkgDir\SUE-Setup.exe" -Force
Ok "SUE-Setup.exe copied"

# Copy docs
Copy-Item "$releaseDir\README.txt"    "$pkgDir\README.txt"    -ErrorAction SilentlyContinue
Copy-Item "$releaseDir\INSTALL.txt"   "$pkgDir\INSTALL.txt"   -ErrorAction SilentlyContinue
Ok "Docs copied"

# ──────────────────────────────────────────────────────────────────────────────
# 7. Create the ZIP
# ──────────────────────────────────────────────────────────────────────────────
Step "Creating ZIP archive"

$zipPath = "$releaseDir\SUE-v${version}-Windows.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path $pkgDir -DestinationPath $zipPath -CompressionLevel Optimal

$sizeMB = [Math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Ok "Created: $zipPath  ($sizeMB MB)"

# ──────────────────────────────────────────────────────────────────────────────
# 8. Verify the ZIP
# ──────────────────────────────────────────────────────────────────────────────
Step "Verifying ZIP contents"

$entries = (Get-ChildItem $pkgDir -Recurse -File).Count + 1  # +1 for the SUE-Setup.exe at root
Ok "$entries files in package"

$requiredFiles = @(
    "$pkgDir\SUE-Setup.exe",
    "$pkgDir\extension\manifest.json",
    "$pkgDir\extension\background.js",
    "$pkgDir\extension\learn-engine.js",
    "$pkgDir\extension\sue-runtime.wasm",
    "$pkgDir\extension\sue-runtime.js"
)
$allOk = $true
foreach ($f in $requiredFiles) {
    if (Test-Path $f) { Ok (Split-Path $f -Leaf) } else { Warn "MISSING: $f"; $allOk = $false }
}

if (-not $allOk) {
    Die "Some required files are missing. Check the build output above."
}

# ──────────────────────────────────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
Write-Host "${GREEN}${BOLD}║   Build complete! ✓                                  ║${RESET}"
Write-Host "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
Write-Host ""
Write-Host "  Release ZIP : ${YELLOW}$(Resolve-Path $zipPath)${RESET}"
Write-Host "  Size        : ${sizeMB} MB"
Write-Host ""
Write-Host "  Distribute $zipPath to users."
Write-Host "  They unzip it, double-click SUE-Setup.exe, and follow the prompt."
Write-Host ""
