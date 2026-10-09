#!/bin/bash
# ──────────────────────────────────────────────────────────────
# SUE - QUALITY VALIDATION SCRIPT
# Quick check for all improvements
# ──────────────────────────────────────────────────────────────

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     SUE - Quality Validation                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

check_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description"
    ((FAILED++))
  fi
}

check_directory() {
  local dir=$1
  local description=$2
  
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description"
    ((FAILED++))
  fi
}

check_content() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} $description (pattern not found)"
  fi
}

echo "📁 Checking Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file ".eslintrc.js" "ESLint configuration"
check_file ".prettierrc" "Prettier configuration"
check_file ".cspell.json" "cSpell dictionary"
check_file "tsconfig.json" "TypeScript configuration"
check_file "DEVELOPER-GUIDE.md" "Developer guide"
check_file "BACKGROUND-UPGRADE.md" "Migration guide"
check_file "src/error-handling.ts" "Error handling module"
check_file "src/wasm-error-handling.ts" "WASM error handling"
check_file "types/index.ts" "TypeScript types"

echo ""
echo "📂 Checking Directories..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_directory "hooks" "Git hooks directory"
check_directory "types" "Types directory"
check_directory "src" "Source directory"

echo ""
echo "🔍 Checking Content..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "src/error-handling.ts" ]; then
  check_content "src/error-handling.ts" "export class HCCError" "Error class defined"
  check_content "src/error-handling.ts" "export class StorageFallback" "Storage fallback"
  check_content "src/error-handling.ts" "export class NetworkFallback" "Network fallback"
  check_content "src/error-handling.ts" "ERROR_CONFIG" "Error catalog"
fi

if [ -f "types/index.ts" ]; then
  check_content "types/index.ts" "export interface" "Interfaces defined"
  check_content "types/index.ts" "export type" "Types defined"
  check_content "types/index.ts" "AppError" "Error type"
fi

if [ -f ".eslintrc.js" ]; then
  check_content ".eslintrc.js" "eslint:recommended" "ESLint base rules"
  check_content ".eslintrc.js" "no-console" "Console rules"
fi

if [ -f ".prettierrc" ]; then
  check_content ".prettierrc" "semi" "Prettier semicolons"
  check_content ".prettierrc" "singleQuote" "Prettier quotes"
fi

echo ""
echo "🔧 Checking Package Scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
  check_content "package.json" "\"lint\"" "Lint script"
  check_content "package.json" "\"format\"" "Format script"
  check_content "package.json" "\"typecheck\"" "Type check script"
  check_content "package.json" "\"spellcheck\"" "Spell check script"
fi

echo ""
echo "🎯 Summary..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Passed:${NC}  $PASSED"
echo -e "${RED}Failed:${NC}  $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All quality checks passed!${NC}"
  echo ""
  echo "💡 Next steps:"
  echo "   1. Install dependencies: npm install"
  echo "   2. Run validation: npm run validate"
  echo "   3. Set up git hooks: npm run prepare"
  echo "   4. Read guide: DEVELOPER-GUIDE.md"
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Please review above.${NC}"
  echo ""
  echo "💡 Files created successfully, but some content may be incomplete."
  echo "   Review and fix manually if needed."
  exit 1
fi

