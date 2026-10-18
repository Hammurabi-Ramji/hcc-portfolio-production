@echo off
REM ──────────────────────────────────────────────────────────────
REM HCC SIDEBAR EXTENSION SETUP
REM Windows batch script for development environment
REM ──────────────────────────────────────────────────────────────

echo.
echo ─────────────────────────────────────────────────────────────
echo HCC Sidebar Extension Setup
echo Hammurabi Coding Company | Sovereign by Design
echo ─────────────────────────────────────────────────────────────
echo.

REM Check Rust
echo Step 1: Checking Rust installation...
where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo ^⚠^  Rust not found. You'll need to install it manually.
    echo    Visit: https://www.rust-lang.org/tools/install
) else (
    echo ✅ Rust installed:
    rustc --version
)

echo.
echo Step 2: Adding WASM target...
rustup target add wasm32-unknown-unknown
echo ✅ WASM target added

echo.
echo Step 3: Installing wasm-pack...
where wasm-pack >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing wasm-pack...
    curl -L https://rustwasm.github.io/wasm-pack/installer/init.ps1 -o init.ps1
    powershell -ExecutionPolicy Bypass -File init.ps1
    del init.ps1
) else (
    echo ✅ wasm-pack installed:
    wasm-pack --version
)

echo.
echo Step 4: Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Node.js not found. Skipping npm setup.
    echo    You can build without webpack: wasm-pack build --release
) else (
    echo ✅ Node.js:
    node --version
    if exist package.json (
        echo Installing npm dependencies...
        call npm install
        echo ✅ npm dependencies installed
    )
)

echo.
echo Step 5: Setting up Ollama embeddings...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama not found. Skipping embedding model setup.
) else (
    if exist "scripts\setup-ollama-embeddings.ps1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\setup-ollama-embeddings.ps1" -Run
        if %errorlevel% neq 0 (
            echo ⚠️  Embedding setup reported an issue. You can retry later:
            echo    powershell -NoProfile -File .\scripts\setup-ollama-embeddings.ps1 -Run
        ) else (
            echo ✅ Ollama embedding setup complete
        )
    ) else (
        echo ⚠️  scripts\setup-ollama-embeddings.ps1 not found. Skipping embedding setup.
    )
)

echo.
echo Step 6: Verifying workspace structure...
setlocal
set FILES=Cargo.toml manifest.json sue.html styles.css background.js content.js

set FOUND=0
set MISSING=0

for %%F in (%FILES%) do (
    if exist "%%F" (
        echo ✅ %%F
        set /a FOUND+=1
    ) else (
        echo ❌ Missing: %%F
        set /a MISSING+=1
    )
)
endlocal

echo.
echo ─────────────────────────────────────────────────────────────
echo Setup Complete!
echo ─────────────────────────────────────────────────────────────
echo.
echo Next steps:
echo 1. Build the extension:
echo    wasm-pack build --dev --target web
echo.
echo 2. Load in browser:
echo    Chrome: chrome://extensions → Load unpacked → ./pkg/
echo.
echo 3. Configure local SUE API:
echo    cd /SUE/hcc-api && cargo run
echo.
echo 4. Configure Ollama:
echo    ollama pull llama3.2:3b
echo    ollama pull mxbai-embed-small-v1
echo    ollama serve
echo.
echo ─────────────────────────────────────────────────────────────

pause
