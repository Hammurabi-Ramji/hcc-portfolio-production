# ========================================
# HAMMURABI FRAMEWORK INSTALLER
# ========================================
# Quick install for Windows 11 + PowerShell 7+
# ========================================

#Requires -Version 7.0

param(
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "C:\HammurabiDev",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipToolCheck
)

$ErrorActionPreference = "Stop"

function Write-Header {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║              🏛️  HAMMURABI CODING COMPANY  🏛️                ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║          Hammurabi Framework v2.0 Installation               ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-RequiredTools {
    Write-Host "🔧 Checking required tools..." -ForegroundColor Yellow
    Write-Host ""
    
    $tools = @(
        @{Name="winget"; Check="winget --version"; Required=$true},
        @{Name="Git"; Check="git --version"; Install="winget install Git.Git"},
        @{Name="Python 3.11+"; Check="python --version"; Install="winget install Python.Python.3.11"},
        @{Name="Node.js"; Check="node --version"; Install="winget install OpenJS.NodeJS"},
        @{Name="VS Code"; Check="code --version"; Install="winget install Microsoft.VisualStudioCode"}
    )
    
    $missing = @()
    
    foreach ($tool in $tools) {
        try {
            $version = Invoke-Expression $tool.Check 2>&1
            Write-Host "  ✓ $($tool.Name): Found" -ForegroundColor Green
        } catch {
            if ($tool.Required) {
                Write-Host "  ❌ $($tool.Name): REQUIRED - Not Found" -ForegroundColor Red
                throw "Cannot proceed without $($tool.Name)"
            } else {
                Write-Host "  ⚠ $($tool.Name): Not Found" -ForegroundColor Yellow
                $missing += $tool
            }
        }
    }
    
    if ($missing.Count -gt 0 -and -not $SkipToolCheck) {
        Write-Host ""
        Write-Host "Missing tools detected. Install them? (Y/n)" -ForegroundColor Yellow
        $install = Read-Host
        
        if ($install -ne 'n') {
            foreach ($tool in $missing) {
                Write-Host "  Installing $($tool.Name)..." -ForegroundColor Cyan
                Invoke-Expression $tool.Install
            }
        }
    }
}

function Copy-FrameworkFiles {
    param([string]$SourcePath, [string]$DestPath)
    
    Write-Host ""
    Write-Host "📁 Installing framework files..." -ForegroundColor Yellow
    
    # Create directory structure
    $directories = @(
        "$DestPath",
        "$DestPath\Modules",
        "$DestPath\Templates",
        "$DestPath\Scripts",
        "$DestPath\Docs",
        "$DestPath\Projects"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✓ Created: $dir" -ForegroundColor Green
        }
    }
    
    # Copy module files
    $moduleSource = "$SourcePath\Modules\HammurabiDev.psm1"
    $moduleDest = "$DestPath\Modules\HammurabiDev.psm1"
    
    if (Test-Path $moduleSource) {
        Copy-Item -Path $moduleSource -Destination $moduleDest -Force
        Write-Host "  ✓ Installed: HammurabiDev.psm1" -ForegroundColor Green
    }
    
    # Copy documentation
    $docFiles = Get-ChildItem -Path "$SourcePath\*.md" -ErrorAction SilentlyContinue
    foreach ($doc in $docFiles) {
        Copy-Item -Path $doc.FullName -Destination "$DestPath\Docs\" -Force
    }
    Write-Host "  ✓ Installed: Documentation" -ForegroundColor Green
}

function Update-PowerShellProfile {
    param([string]$ModulePath)
    
    Write-Host ""
    Write-Host "📝 Configuring PowerShell profile..." -ForegroundColor Yellow
    
    $profileContent = @"

# ========================================
# HAMMURABI DEVELOPMENT FRAMEWORK
# ========================================

Import-Module "$ModulePath\Modules\HammurabiDev.psm1" -Force

# Quick aliases
Set-Alias -Name hproj -Value New-HammurabiProject
Set-Alias -Name hclaude -Value Invoke-ClaudePrompt
Set-Alias -Name hdeploy -Value Invoke-HammurabiDeploy
Set-Alias -Name htest -Value Test-HammurabiProject

Write-Host "🏛️  Hammurabi Framework v2.0 loaded" -ForegroundColor Cyan
Write-Host "   Type 'Get-HammurabiHelp' for available commands" -ForegroundColor Gray
"@

    if (-not (Test-Path $PROFILE)) {
        New-Item -ItemType File -Path $PROFILE -Force | Out-Null
    }
    
    $existing = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
    
    if ($existing -notlike "*HAMMURABI DEVELOPMENT FRAMEWORK*") {
        Add-Content -Path $PROFILE -Value $profileContent
        Write-Host "  ✓ Profile updated: $PROFILE" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Profile already configured" -ForegroundColor Gray
    }
}

function Initialize-GitConfig {
    Write-Host ""
    Write-Host "🔧 Configuring Git..." -ForegroundColor Yellow
    
    $gitName = git config --global user.name 2>$null
    $gitEmail = git config --global user.email 2>$null
    
    if (-not $gitName) {
        Write-Host "  Git user name not configured" -ForegroundColor Yellow
        $name = Read-Host "  Enter your name"
        git config --global user.name $name
    } else {
        Write-Host "  ✓ Git name: $gitName" -ForegroundColor Green
    }
    
    if (-not $gitEmail) {
        Write-Host "  Git email not configured" -ForegroundColor Yellow
        $email = Read-Host "  Enter your email"
        git config --global user.email $email
    } else {
        Write-Host "  ✓ Git email: $gitEmail" -ForegroundColor Green
    }
    
    git config --global core.editor "code --wait"
    git config --global init.defaultBranch "main"
    
    Write-Host "  ✓ Git configured" -ForegroundColor Green
}

function Show-NextSteps {
    param([string]$InstallPath)
    
    Write-Host ""
    Write-Host "✅ Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Close and reopen PowerShell (to load profile)" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Initialize the framework:" -ForegroundColor White
    Write-Host "   Initialize-HammurabiFramework" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Create your first project:" -ForegroundColor White
    Write-Host "   New-HammurabiProject -Name 'MyFirstApp' -Type 'API' -Stack 'Python'" -ForegroundColor Gray
    Write-Host "   (Alias: hproj)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "4. Get help:" -ForegroundColor White
    Write-Host "   Get-HammurabiHelp" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Documentation: $InstallPath\Docs\README.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🏛️ 'Write code that future generations will thank you for' 🏛️" -ForegroundColor Cyan
    Write-Host ""
}

# ========================================
# MAIN INSTALLATION PROCESS
# ========================================

try {
    Write-Header
    
    # Check if running as admin (optional but recommended)
    if (-not (Test-Administrator)) {
        Write-Warning "Not running as Administrator. Some installations may fail."
        Write-Host "Recommended: Right-click PowerShell → Run as Administrator" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continue anyway? (Y/n)"
        if ($continue -eq 'n') {
            exit 1
        }
    }
    
    # Check required tools
    if (-not $SkipToolCheck) {
        Install-RequiredTools
    }
    
    # Copy framework files
    $scriptDir = $PSScriptRoot
    Copy-FrameworkFiles -SourcePath $scriptDir -DestPath $InstallPath
    
    # Update PowerShell profile
    Update-PowerShellProfile -ModulePath $InstallPath
    
    # Configure Git
    Initialize-GitConfig
    
    # Show next steps
    Show-NextSteps -InstallPath $InstallPath
    
} catch {
    Write-Host ""
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "For help, visit:" -ForegroundColor Yellow
    Write-Host "  https://github.com/hammurabi-coding/hammurabi-framework/issues" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
