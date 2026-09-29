#!/bin/bash

# OpenClaw HCC Integration - Build & Package Script for macOS/Linux

echo ""
echo "========================================================"
echo "OpenClaw HCC Integration - Build Script"
echo "========================================================"
echo ""

# Create output directories
mkdir -p dist build

# Check if nexe is installed
if ! command -v nexe &> /dev/null; then
    echo "Installing nexe..."
    npm install -g nexe
fi

echo "[1/5] Building standalone executable..."
nexe bin/openclaw.js -o dist/openclaw -t linux-x64 -r "integrations/**/*" -r "data/**/*" -r ".env" -r "*.md"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build executable"
    exit 1
fi

echo "[2/5] Copying documentation..."
cp README.md dist/README.md
cp QUICK_REFERENCE.md dist/QUICK_REFERENCE.md
cp COMPLETION_REPORT.md dist/COMPLETION_REPORT.md
cp AUDIT_AND_FIXES_REPORT.md dist/AUDIT_AND_FIXES_REPORT.md
cp FIXES_SUMMARY.md dist/FIXES_SUMMARY.md
cp .env dist/.env.template
echo "✓ Documentation copied"

echo "[3/5] Creating data and logs directories..."
mkdir -p dist/data
mkdir -p dist/logs
chmod +x dist/openclaw
echo "✓ Directories created"

echo "[4/5] Creating install script..."
cat > dist/install.sh << 'EOF'
#!/bin/bash

echo ""
echo "OpenClaw HCC Integration - Installation"
echo ""

if [ "$EUID" -ne 0 ]; then 
   echo "ERROR: Please run as root (sudo ./install.sh)"
   exit 1
fi

INSTALL_DIR="/opt/openclaw"

echo "Installing to: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

echo "Copying files..."
cp -r . "$INSTALL_DIR/"

echo "Creating symlink..."
ln -sf "$INSTALL_DIR/openclaw" /usr/local/bin/openclaw

echo "Setting permissions..."
chmod +x "$INSTALL_DIR/openclaw"
chmod +x "$INSTALL_DIR/data"
chmod +x "$INSTALL_DIR/logs"

echo ""
echo "✓ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit $INSTALL_DIR/.env with your API credentials"
echo "2. Run: openclaw health"
echo "3. Run: openclaw schedule"
echo ""
EOF

chmod +x dist/install.sh
echo "✓ Install script created"

echo "[5/5] Creating package README..."
cat > dist/PACKAGE-README.txt << 'EOF'
OpenClaw HCC Integration - Linux Distribution Package

Quick Start:

1. Extract this folder
2. Run: sudo ./install.sh
3. Edit ~/.env with your API credentials
4. Run: openclaw health
5. Run: openclaw schedule

Commands:

- openclaw health      Check system health
- openclaw fda         Run FDA monitoring
- openclaw mantle      Run Mantle sync
- openclaw pharma      Run Pharma monitoring
- openclaw schedule    Start automated jobs
- openclaw test        Run tests
- openclaw help        Show help

Documentation:

- README.md                    Complete guide
- QUICK_REFERENCE.md          Quick start
- COMPLETION_REPORT.md        What was fixed
- AUDIT_AND_FIXES_REPORT.md   Technical details

Support:

Check logs/ directory for detailed error messages.
Review documentation for troubleshooting tips.
EOF

echo "✓ Package README created"

echo ""
echo "========================================================"
echo "Build Complete!"
echo "========================================================"
echo ""
echo "Distribution package created in: dist/"
echo ""
echo "Files included:"
echo "  - openclaw                (Main application)"
echo "  - *.md                    (Documentation)"
echo "  - .env.template           (Configuration template)"
echo "  - install.sh              (Installation script)"
echo "  - PACKAGE-README.txt      (Quick start guide)"
echo "  - data/                   (Data directory)"
echo "  - logs/                   (Logs directory)"
echo ""
echo "Next steps:"
echo "  1. Run: ./dist/install.sh (to install)"
echo "  2. Edit ~/.openclaw/.env with API credentials"
echo "  3. Run: openclaw health"
echo ""
echo "========================================================"
echo ""
