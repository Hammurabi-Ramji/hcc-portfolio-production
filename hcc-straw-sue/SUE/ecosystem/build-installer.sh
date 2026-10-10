#!/bin/bash
# SUE Ecosystem v5.0.0 - Build Script (macOS/Linux)

set -e

clear

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   SUE ECOSYSTEM v5.0.0 - INSTALLER BUILDER                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
node_version=$(node --version)
echo "✅ Node.js $node_version found"

# Check pnpm
echo "Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi
pnpm_version=$(pnpm --version)
echo "✅ pnpm $pnpm_version found"

# Check pkg
echo "Checking pkg..."
if ! npm list -g pkg &> /dev/null; then
    echo "Installing pkg..."
    npm install -g pkg
fi
echo "✅ pkg found"

# Navigate to installer directory
cd "$(dirname "$0")/installer"

# Install installer dependencies
echo ""
echo "Installing installer dependencies..."
pnpm install
echo "✅ Dependencies installed"

# Build executable
echo ""
echo "Building executable (SUE-Ecosystem-v5.0.0)..."
echo "This may take 2-3 minutes..."
echo ""

pnpm run build

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              ✅ BUILD SUCCESSFUL!                          ║"
echo "║                                                            ║"
echo "║   Executable: ../release/SUE-Ecosystem-v5.0.0             ║"
echo "║                                                            ║"
echo "║   Next steps:                                              ║"
echo "║   1. Distribute executable to users                       ║"
echo "║   2. Users run the installer                              ║"
echo "║   3. Follow installation wizard                           ║"
echo "║   4. Start services with docker-compose                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
