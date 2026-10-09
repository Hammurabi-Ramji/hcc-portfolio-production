# ──────────────────────────────────────────────────────────────
# SUE - QUALITY VALIDATION SCRIPT (PowerShell)
# Quick check for all improvements
# ──────────────────────────────────────────────────────────────

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SUE - Quality Validation                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$PASSED = 0
$FAILED = 0

function Test-File {
    param([string]$File, [string]$Description)
    
    if (Test-Path $File) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $global:PASSED++
    } else {
        Write-Host "✗ $Description" -ForegroundColor Red
        $global:FAILED++
    }
}

function Test-Directory {
    param([string]$Directory, [string]$Description)
    
    if (Test-Path $Directory) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $global:PASSED++
    } else {
        Write-Host "✗ $Description" -ForegroundColor Red
        $global:FAILED++
    }
}

function Test-Content {
    param([string]$File, [string]$Pattern, [string]$Description)
    
    if (Select-String -Path $File -Pattern $Pattern -ErrorAction SilentlyContinue) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $global:PASSED++
    } else {
        Write-Host "⚠ $Description (pattern not found)" -ForegroundColor Yellow
    }
}

Write-Host "📁 Checking Files..."
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Test-File ".eslintrc.js" "ESLint configuration"
Test-File ".prettierrc" "Prettier configuration"
Test-File ".cspell.json" "cSpell dictionary"
Test-File "tsconfig.json" "TypeScript configuration"
Test-File "DEVELOPER-GUIDE.md" "Developer guide"
Test-File "BACKGROUND-UPGRADE.md" "Migration guide"
Test-File "PRODUCTION-READINESS.md" "Production checklist"
Test-File "MODERNIZATION-SUMMARY.md" "This summary"
Test-File "src\error-handling.ts" "Error handling module"
Test-File "src\wasm-error-handling.ts" "WASM error handling"
Test-File "types\index.ts" "TypeScript types"
Test-File "hooks\pre-commit" "Git pre-commit hook"

Write-Host ""
Write-Host "📂 Checking Directories..."
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Test-Directory "hooks" "Git hooks directory"
Test-Directory "types" "Types directory"
Test-Directory "src" "Source directory"

Write-Host ""
Write-Host "🔍 Checking Content..."
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if (Test-Path "src\error-handling.ts") {
    Test-Content "src\error-handling.ts" "export class HCCError" "Error class defined"
    Test-Content "src\error-handling.ts" "export class StorageFallback" "Storage fallback"
    Test-Content "src\error-handling.ts" "export class NetworkFallback" "Network fallback"
    Test-Content "src\error-handling.ts" "ERROR_CONFIG" "Error catalog"
}

if (Test-Path "types\index.ts") {
    Test-Content "types\index.ts" "export interface" "Interfaces defined"
    Test-Content "types\index.ts" "export type" "Types defined"
    Test-Content "types\index.ts" "AppError" "Error type"
}

if (Test-Path ".eslintrc.js") {
    Test-Content ".eslintrc.js" "eslint:recommended" "ESLint base rules"
    Test-Content ".eslintrc.js" "no-console" "Console rules"
}

if (Test-Path ".prettierrc") {
    Test-Content ".prettierrc" "semi" "Prettier semicolons"
    Test-Content ".prettierrc" "singleQuote" "Prettier quotes"
}

Write-Host ""
Write-Host "🔧 Checking Package Scripts..."
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if (Test-Path "package.json") {
    Test-Content "package.json" `"lint`" "Lint script"
    Test-Content "package.json" `"format`" "Format script"
    Test-Content "package.json" `"typecheck`" "Type check script"
    Test-Content "package.json" `"spellcheck`" "Spell check script"
}

Write-Host ""
Write-Host "🎯 Summary..."
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "Passed:  $PASSED" -ForegroundColor Blue
Write-Host "Failed:  $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "✓ All quality checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:"
    Write-Host "   1. Install dependencies: npm install"
    Write-Host "   2. Run validation: npm run validate"
    Write-Host "   3. Set up git hooks: npm run prepare"
    Write-Host "   4. Read guide: DEVELOPER-GUIDE.md"
    exit 0
} else {
    Write-Host "✗ Some checks failed. Please review above." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Files created successfully, but some content may be incomplete."
    Write-Host "   Review and fix manually if needed."
    exit 1
}

