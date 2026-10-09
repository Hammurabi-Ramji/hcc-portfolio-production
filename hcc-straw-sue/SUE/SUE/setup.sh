#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# SUE EXTENSION SETUP
# One-time setup for development environment
# ──────────────────────────────────────────────────────────────

echo "────────────────────────────────────────────────────────────"
echo "SUE Extension Setup"
echo "Hammurabi Coding Company | Sovereign by Design"
echo "────────────────────────────────────────────────────────────"

# 1. Check Rust installation
echo ""
echo "Step 1: Checking Rust installation..."
if ! command -v cargo &> /dev/null; then
    echo "⚠️  Rust not found. You'll need to install it manually."
    echo "   Visit: https://www.rust-lang.org/tools/install"
    echo "   Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
else
    echo "✅ Rust installed: $(rustc --version)"
fi

# 2. Add WASM target
echo ""
echo "Step 2: Adding WASM target..."
rustup target add wasm32-unknown-unknown
echo "✅ WASM target added"

# 3. Install wasm-pack
echo ""
echo "Step 3: Installing wasm-pack..."
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
else
    echo "✅ wasm-pack installed: $(wasm-pack --version)"
fi

# 4. Install Node.js dependencies (optional, for webpack)
echo ""
echo "Step 4: Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Skipping npm setup."
    echo "   You can build without webpack: wasm-pack build --release"
else
    echo "✅ Node.js: $(node --version)"
    if [ -f "package.json" ]; then
        echo "Installing npm dependencies..."
        npm install
        echo "✅ npm dependencies installed"
    fi
fi

# 5. Setup Ollama embeddings (optional)
echo ""
echo "Step 5: Setting up Ollama embeddings..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. Skipping embedding model setup."
else
    if [ -f "scripts/setup-ollama-embeddings.ps1" ] && command -v pwsh &> /dev/null; then
        pwsh -NoProfile -File ./scripts/setup-ollama-embeddings.ps1 -Run || {
            echo "⚠️  Embedding setup via PowerShell reported an issue. You can retry manually later."
        }
    else
        echo "Pulling default embedding model (mxbai-embed-small-v1)..."
        ollama pull mxbai-embed-small-v1 || echo "⚠️  Failed to pull embedding model."
    fi
fi

# 6. Create icons placeholder
echo ""
echo "Step 6: Creating icon placeholders..."
mkdir -p icons
# Create simple SVG icons
cat > icons/icon16.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <rect width="16" height="16" fill="#4a9eed" rx="3"/>
  <text x="8" y="12" font-size="10" text-anchor="middle" fill="white" font-family="Arial">HCC</text>
</svg>
EOF

# Convert SVG to PNG (requires ImageMagick or similar)
# If you don't have ImageMagick, download icons from: https://hammurabicoding.com/icons
echo "⚠️  SVG icons created. Convert to PNG with:"
echo "   convert icon16.svg icon16.png"
echo "   (Or download icons from HCC branding)"

# 7. Create .env file (DO NOT COMMIT)
echo ""
echo "Step 7: Creating .env file..."
cat > .env << 'EOF'
# SUE Environment Variables
# DO NOT COMMIT THIS FILE

# Local HCC API endpoint
HCC_API_URL=http://localhost:8080

# Local Ollama endpoint
OLLAMA_URL=http://localhost:11434

# Koofr API (optional)
# KOOFR_EMAIL=your@email.com
# KOOFR_APP_PASSWORD=your-app-password

# Venice.AI API key (optional, for premium AI)
# VENICE_API_KEY=your-venice-key
EOF

echo "✅ .env created (add your local endpoints)"

# 8. Verify workspace structure
echo ""
echo "Step 8: Verifying workspace structure..."
EXPECTED_FILES=(
    "Cargo.toml"
    "manifest.json"
    "sue.html"
    "styles.css"
    "background.js"
    "content.js"
    "sue-core/src/lib.rs"
    "sue-view/src/main.rs"
)

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

# 9. Summary
echo ""
echo "────────────────────────────────────────────────────────────"
echo "Setup Complete!"
echo "────────────────────────────────────────────────────────────"
echo ""
echo "Next steps:"
echo "1. Build the extension:"
echo "   wasm-pack build --dev --target web"
echo ""
echo "2. Load in browser:"
echo "   Chrome: chrome://extensions → Load unpacked → ./pkg/"
echo "   Firefox: about:debugging → Load Temporary Add-on"
echo ""
echo "3. Configure local HCC API:"
echo "   cd /SUE/hcc-api && cargo run"
echo ""
echo "4. Configure Ollama:"
echo "   ollama pull llama3.2:3b"
echo "   ollama pull mxbai-embed-small-v1"
echo "   ollama serve"
echo ""
echo "────────────────────────────────────────────────────────────"
echo "Need help? Check README.md for troubleshooting"
echo "────────────────────────────────────────────────────────────"

