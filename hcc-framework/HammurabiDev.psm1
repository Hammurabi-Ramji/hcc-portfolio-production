# ========================================
# HAMMURABI DEVELOPMENT FRAMEWORK v2.0
# PowerShell Module for Solo Full-Stack Development
# ========================================
# Author: R.K. Girdhari (Hammurabi Coding Company)
# Philosophy: Digital Sovereignty, Offline-First, Lifetime Licensing
# Stack: Windows 11 + VS Code + PowerShell + Cheapname
# ========================================

#Requires -Version 7.0

# Module Configuration
$Script:ModuleRoot = $PSScriptRoot
$Script:FrameworkVersion = "2.0.0"
$Script:HammurabiRoot = "C:\HammurabiDev"
$Script:ProjectsRoot = "$HammurabiRoot\Projects"
$Script:TemplatesRoot = "$ModuleRoot\..\Templates"
$Script:ConfigPath = "$HammurabiRoot\config.json"

# ========================================
# CORE: INITIALIZATION & SETUP
# ========================================

function Initialize-HammurabiFramework {
    <#
    .SYNOPSIS
    Initialize the Hammurabi Development Framework on a new system.
    
    .DESCRIPTION
    Sets up the complete development environment following The Code of Hammurabi:
    - Creates project directories
    - Installs essential tools
    - Configures VS Code
    - Sets up PowerShell profile
    - Validates Cheapname connection
    
    .EXAMPLE
    Initialize-HammurabiFramework
    #>
    [CmdletBinding()]
    param()
    
    Write-HammurabiHeader
    Write-Host "🏛️  Initializing Hammurabi Development Framework v$FrameworkVersion" -ForegroundColor Cyan
    Write-Host ""
    
    # Create directory structure
    Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow
    $directories = @(
        $HammurabiRoot,
        $ProjectsRoot,
        "$HammurabiRoot\Templates",
        "$HammurabiRoot\Archives",
        "$HammurabiRoot\Logs",
        "$HammurabiRoot\Docs"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✓ Created: $dir" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Exists: $dir" -ForegroundColor Gray
        }
    }
    
    # Create default configuration
    Write-Host ""
    Write-Host "⚙️  Creating configuration..." -ForegroundColor Yellow
    
    $config = @{
        version = $FrameworkVersion
        developer = @{
            name = "R.K. Girdhari"
            company = "Hammurabi Coding Company"
            location = "Eau Claire, Wisconsin"
        }
        hosting = @{
            provider = "Cheapname"
            type = "Shared Hosting"
            sshHost = ""
            sshUser = ""
        }
        standards = @{
            testCoverageProduction = 90
            testCoverageInternal = 70
            testCoverageMVP = 50
            performanceTarget = 200
        }
        tools = @{
            editor = "VS Code"
            shell = "PowerShell 7+"
            vcs = "Git"
            ai = "Claude.ai"
        }
    }
    
    $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath
    Write-Host "  ✓ Configuration saved: $ConfigPath" -ForegroundColor Green
    
    # Check for required tools
    Write-Host ""
    Write-Host "🔧 Validating required tools..." -ForegroundColor Yellow
    
    $tools = @(
        @{ Name = "Git"; Command = "git"; Install = "winget install Git.Git" },
        @{ Name = "Python 3.11+"; Command = "python"; Install = "winget install Python.Python.3.11" },
        @{ Name = "Node.js"; Command = "node"; Install = "winget install OpenJS.NodeJS" },
        @{ Name = "VS Code"; Command = "code"; Install = "winget install Microsoft.VisualStudioCode" }
    )
    
    foreach ($tool in $tools) {
        try {
            $version = & $tool.Command --version 2>$null
            Write-Host "  ✓ $($tool.Name): $version" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $($tool.Name): NOT FOUND" -ForegroundColor Red
            Write-Host "     Install: $($tool.Install)" -ForegroundColor Yellow
        }
    }
    
    # Setup PowerShell profile
    Write-Host ""
    Write-Host "📝 Configuring PowerShell profile..." -ForegroundColor Yellow
    Add-HammurabiProfile
    
    Write-Host ""
    Write-Host "✅ Framework initialized successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Restart PowerShell to load profile" -ForegroundColor White
    Write-Host "  2. Run: New-HammurabiProject -Name 'MyFirstApp'" -ForegroundColor White
    Write-Host "  3. Read docs: $HammurabiRoot\Docs\README.md" -ForegroundColor White
}

function Add-HammurabiProfile {
    <#
    .SYNOPSIS
    Adds Hammurabi framework functions to PowerShell profile.
    #>
    
    $profileContent = @"
# ========================================
# HAMMURABI DEVELOPMENT FRAMEWORK
# ========================================

Import-Module "$ModuleRoot\HammurabiDev.psm1" -Force

# Quick aliases
Set-Alias -Name hproj -Value New-HammurabiProject
Set-Alias -Name hclaude -Value Invoke-ClaudePrompt
Set-Alias -Name hdeploy -Value Invoke-HammurabiDeploy
Set-Alias -Name htest -Value Test-HammurabiProject

Write-Host "🏛️  Hammurabi Framework v$FrameworkVersion loaded" -ForegroundColor Cyan
Write-Host "   Type 'Get-HammurabiHelp' for available commands" -ForegroundColor Gray
"@

    if (-not (Test-Path $PROFILE)) {
        New-Item -ItemType File -Path $PROFILE -Force | Out-Null
    }
    
    $existing = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
    
    if ($existing -notlike "*HAMMURABI DEVELOPMENT FRAMEWORK*") {
        Add-Content -Path $PROFILE -Value "`n$profileContent"
        Write-Host "  ✓ Profile configured: $PROFILE" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Profile already configured" -ForegroundColor Gray
    }
}

# ========================================
# PROJECT: CREATION & MANAGEMENT
# ========================================

function New-HammurabiProject {
    <#
    .SYNOPSIS
    Create a new project following the Solo Developer Framework.
    
    .DESCRIPTION
    Generates a complete project structure with:
    - Project intake documentation
    - VS Code workspace configuration
    - Git repository initialization
    - Testing framework setup
    - Deployment automation
    
    .PARAMETER Name
    Project name (alphanumeric, no spaces)
    
    .PARAMETER Type
    Project type: Web, API, Desktop, Library, Fullstack
    
    .PARAMETER Stack
    Technology stack: Python, JavaScript, TypeScript, CSharp, Go
    
    .PARAMETER Hosting
    Target hosting: Cheapname, ZAP, Local, Cloud
    
    .EXAMPLE
    New-HammurabiProject -Name "MyAPI" -Type "API" -Stack "Python" -Hosting "Cheapname"
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidatePattern('^[a-zA-Z0-9_-]+$')]
        [string]$Name,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('Web', 'API', 'Desktop', 'Library', 'Fullstack')]
        [string]$Type,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('Python', 'JavaScript', 'TypeScript', 'CSharp', 'Go', 'Rust')]
        [string]$Stack,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('Cheapname', 'ZAP', 'Local', 'Cloud')]
        [string]$Hosting = 'Cheapname'
    )
    
    Write-Host "🏗️  Creating new Hammurabi project: $Name" -ForegroundColor Cyan
    Write-Host ""
    
    # Validate project doesn't exist
    $projectPath = "$ProjectsRoot\$Name"
    if (Test-Path $projectPath) {
        Write-Error "Project already exists: $projectPath"
        return
    }
    
    # Create project structure
    Write-Host "📁 Creating project structure..." -ForegroundColor Yellow
    
    $structure = @(
        "$projectPath",
        "$projectPath\.github\workflows",
        "$projectPath\src",
        "$projectPath\tests\unit",
        "$projectPath\tests\integration",
        "$projectPath\tests\e2e",
        "$projectPath\docs",
        "$projectPath\scripts",
        "$projectPath\infra",
        "$projectPath\.vscode"
    )
    
    foreach ($dir in $structure) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Generate intake documents
    Write-Host "📝 Generating intake documents..." -ForegroundColor Yellow
    
    $intake = @{
        Name = $Name
        Type = $Type
        Stack = $Stack
        Hosting = $Hosting
        Date = Get-Date -Format 'yyyy-MM-dd'
        Developer = "R.K. Girdhari"
        Company = "Hammurabi Coding Company"
    }
    
    # PROJECT_INTAKE.md
    $intakeContent = @"
# Project Intake Card

## Basic Info
- **Project Name**: $Name
- **Date Initiated**: $($intake.Date)
- **Solo Developer**: $($intake.Developer)
- **Type**: $Type
- **Stack**: $Stack
- **Hosting**: $Hosting

## Project Scope
- **Problem Statement**: [1-2 sentence description of what problem this solves]
- **Target Users**: [Who will use this?]
- **Primary Language/Stack**: $Stack
- **Hosting Tier**: $Hosting

## Success Criteria
- ✅ **Functionality**: [List 3-5 core features]
- ✅ **Performance**: < 200ms load time (P95)
- ✅ **Reliability**: 99.5% uptime target
- ✅ **Cost**: Budget constraints
- ✅ **Time to Deploy**: [Target timeline]

## Constraints
- **Runtime Environment**: Windows 11, VS Code, PowerShell
- **Hosting Limits**: $Hosting specific constraints
- **Budget**: Define budget limits
- **License**: [MIT / Proprietary / Open Source]

## Deliverables Checklist
- [ ] Source code (Git repository)
- [ ] Documentation (README, API docs)
- [ ] Test suite (unit, integration, e2e)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Live deployment
- [ ] Monitoring & logs

---
*Generated by Hammurabi Framework v$FrameworkVersion*
"@
    
    Set-Content -Path "$projectPath\PROJECT_INTAKE.md" -Value $intakeContent
    
    # SCOPE.md
    $scopeContent = @"
# Scope Card

| Item | Detail |
|------|--------|
| **Problem** | [Clear 1-2 sentence statement] |
| **Success Criteria** | • Metric 1: [measurable]<br>• Metric 2: [testable]<br>• Metric 3: [achievable] |
| **Out-of-Scope** | • [Feature not included]<br>• [Technology not used] |
| **Assumptions** | • [Assumption 1]<br>• [Assumption 2] |
| **Constraints** | **Hosting**: $Hosting<br>**Runtime**: $Stack<br>**Budget**: [Define] |
| **Delivery Timeline** | Design: 3 days<br>Dev: 10 days<br>Testing: 4 days<br>Deploy: 1 day |

---
*Generated by Hammurabi Framework v$FrameworkVersion*
"@
    
    Set-Content -Path "$projectPath\SCOPE.md" -Value $scopeContent
    
    # README.md
    $readmeContent = @"
# $Name

**Type**: $Type  
**Stack**: $Stack  
**Hosting**: $Hosting  
**Created**: $($intake.Date)  
**Developer**: $($intake.Developer)

## Overview

[Brief description of what this project does and why it exists]

## Quick Start

\`\`\`powershell
# Clone repository
git clone [repository-url]
cd $Name

# Setup environment
.\scripts\setup.ps1

# Run tests
.\scripts\test.ps1

# Start development server
.\scripts\dev.ps1
\`\`\`

## Architecture

[High-level architecture description or link to ARCHITECTURE.md]

## Testing

- **Unit Tests**: $($Script:Config.standards.testCoverageProduction)%+ coverage required
- **Integration Tests**: Key user flows
- **E2E Tests**: Critical paths

Run tests: \`.\scripts\test.ps1\`

## Deployment

Target: $Hosting

\`\`\`powershell
# Deploy to production
.\scripts\deploy.ps1 -Environment production
\`\`\`

## Documentation

- [Project Intake](PROJECT_INTAKE.md)
- [Scope Definition](SCOPE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Development Workflow

1. Create feature branch: \`git checkout -b feature/name\`
2. Develop with TDD (tests first)
3. Run quality checks: \`.\scripts\quality.ps1\`
4. Merge to main after review

## Code of Hammurabi Compliance

This project follows [The Code of Hammurabi](https://github.com/hammurabi-coding/code-of-hammurabi):

- ✅ Clarity: Self-documenting code
- ✅ Testing: $($Script:Config.standards.testCoverageProduction)%+ coverage
- ✅ Security: Automated scanning
- ✅ Performance: <$($Script:Config.standards.performanceTarget)ms P95
- ✅ Documentation: Complete and current

---
*Built with Hammurabi Framework v$FrameworkVersion*
"@
    
    Set-Content -Path "$projectPath\README.md" -Value $readmeContent
    
    # .gitignore
    $gitignoreContent = Get-GitIgnoreTemplate -Stack $Stack
    Set-Content -Path "$projectPath\.gitignore" -Value $gitignoreContent
    
    # VS Code settings
    $vscodeSettings = Get-VSCodeSettings -Stack $Stack
    Set-Content -Path "$projectPath\.vscode\settings.json" -Value $vscodeSettings
    
    # Initialize Git
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    Push-Location $projectPath
    git init | Out-Null
    git add . | Out-Null
    git commit -m "Initial commit: $Name project scaffolding" | Out-Null
    Pop-Location
    
    # Generate scripts
    Write-Host "📜 Generating automation scripts..." -ForegroundColor Yellow
    New-ProjectScripts -ProjectPath $projectPath -Stack $Stack -Hosting $Hosting
    
    # Open in VS Code
    Write-Host ""
    Write-Host "✅ Project created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Project location: $projectPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. cd $projectPath" -ForegroundColor White
    Write-Host "  2. Complete PROJECT_INTAKE.md and SCOPE.md" -ForegroundColor White
    Write-Host "  3. Run: .\scripts\setup.ps1" -ForegroundColor White
    Write-Host "  4. Open in VS Code: code ." -ForegroundColor White
    Write-Host ""
    
    # Ask to open in VS Code
    $open = Read-Host "Open project in VS Code now? (Y/n)"
    if ($open -ne 'n') {
        code $projectPath
    }
}

function New-ProjectScripts {
    <#
    .SYNOPSIS
    Generate automation scripts for a project.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProjectPath,
        
        [Parameter(Mandatory=$true)]
        [string]$Stack,
        
        [Parameter(Mandatory=$true)]
        [string]$Hosting
    )
    
    # setup.ps1
    $setupScript = Get-SetupScript -Stack $Stack
    Set-Content -Path "$ProjectPath\scripts\setup.ps1" -Value $setupScript
    
    # test.ps1
    $testScript = Get-TestScript -Stack $Stack
    Set-Content -Path "$ProjectPath\scripts\test.ps1" -Value $testScript
    
    # deploy.ps1
    $deployScript = Get-DeployScript -Stack $Stack -Hosting $Hosting
    Set-Content -Path "$ProjectPath\scripts\deploy.ps1" -Value $deployScript
    
    # dev.ps1
    $devScript = Get-DevScript -Stack $Stack
    Set-Content -Path "$ProjectPath\scripts\dev.ps1" -Value $devScript
    
    # quality.ps1
    $qualityScript = Get-QualityScript -Stack $Stack
    Set-Content -Path "$ProjectPath\scripts\quality.ps1" -Value $qualityScript
    
    Write-Host "  ✓ Generated automation scripts" -ForegroundColor Green
}

# ========================================
# CLAUDE: AI INTEGRATION
# ========================================

function Invoke-ClaudePrompt {
    <#
    .SYNOPSIS
    Generate and copy Claude.ai prompt templates to clipboard.
    
    .DESCRIPTION
    Quick access to Claude prompt templates following Hammurabi's Style v2.1.
    
    .PARAMETER Type
    Prompt type: standup, review, arch, debug, deploy, cheapname-db, cheapname-deploy, cheapname-perf
    
    .PARAMETER ProjectName
    Current project name (optional)
    
    .EXAMPLE
    Invoke-ClaudePrompt -Type standup -ProjectName "MyAPI"
    
    .EXAMPLE
    hclaude -Type review
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet(
            'standup', 'review', 'arch', 'debug', 'deploy', 
            'cheapname-db', 'cheapname-deploy', 'cheapname-perf', 
            'help'
        )]
        [string]$Type,
        
        [Parameter(Mandatory=$false)]
        [string]$ProjectName = (Split-Path -Leaf (Get-Location))
    )
    
    $templates = @{
        'standup' = @"
Daily Standup - $ProjectName - $(Get-Date -Format 'yyyy-MM-dd')

COMPLETED:
- 

TODAY'S PLAN:
1. 
2. 
3. 

BLOCKERS:
- 

QUESTIONS:
- 

---
*Following Solo Developer Framework Phase 4*
"@
        
        'review' = @"
CODE REVIEW: [Module Name]

PROJECT: $ProjectName
CONTEXT:
This module handles [responsibility].
Tests: [coverage]%

CODE:
``````python
[Paste code - max 400 lines]
``````

CHECKLIST:
- [ ] Is the code secure? (OWASP Top 10 compliant?)
- [ ] Is it testable? (Can I mock dependencies?)
- [ ] Are there performance issues? (<200ms target)
- [ ] Did I miss edge cases?

SPECIFIC FEEDBACK NEEDED:
[What you're concerned about]

---
*Following The Code of Hammurabi: Law 12 (Reviews)*
"@
        
        'arch' = @"
ARCHITECTURE REVIEW - $ProjectName

CONSTRAINTS:
- Hosting: Cheapname Shared Hosting
- Scale: [Expected users]
- Budget: `$10/month
- Timeline: [Timeline]
- Stack: [Your stack]

DESIGN:
[Describe architecture or paste Mermaid diagram]

QUESTIONS:
1. Will this handle my constraints?
2. Are there bottlenecks I'm missing?
3. Should I add [feature]?
4. Is this aligned with Code of Hammurabi (Law 8: Simplicity)?

---
*Following Solo Developer Framework Phase 3*
"@
        
        'debug' = @"
DEBUGGING: [Issue description]

PROJECT: $ProjectName

SYMPTOM:
[What's happening wrong]

EXPECTED:
[What should happen]

OCCURS:
[When/how often]

ERROR LOG:
``````
[Paste error trace]
``````

CODE:
``````python
[Relevant code snippet - keep it focused]
``````

I'VE TRIED:
1. [Attempt 1]
2. [Attempt 2]

HYPOTHESIS:
[What you think is wrong]

---
*Following Solo Developer Framework Phase 4*
"@
        
        'deploy' = @"
DEPLOYMENT VALIDATION - $ProjectName

PRE-DEPLOYMENT CHECKLIST:
- [ ] All tests passing (coverage: [X]%)
- [ ] No uncommitted changes
- [ ] Environment vars configured
- [ ] Database migrations tested
- [ ] Rollback strategy documented

DEPLOYMENT SCRIPT:
``````powershell
[Paste your deployment script]
``````

QUESTIONS:
1. Will this work on Cheapname?
2. Are there edge cases I'm missing?
3. Is rollback strategy sound?
4. Any security concerns?

READY TO DEPLOY?

---
*Following Solo Developer Framework Phase 6*
"@
        
        'cheapname-db' = @"
DATABASE DESIGN - Cheapname Shared Hosting

PROJECT: $ProjectName

CONSTRAINTS:
- MySQL 5.7 (Cheapname standard)
- Scale: [Expected users]
- Memory: Limited on shared hosting (~256MB)
- Connections: ~100 max per database
- Budget: `$0 (included with hosting)

SCHEMA:
``````sql
[Paste schema]
``````

KEY QUERIES:
1. [Most common query] (target: <100ms)
2. [Second query] (target: <200ms)

QUESTIONS:
1. Are my indexes correct for Cheapname MySQL 5.7?
2. Will this handle my scale on shared hosting?
3. Any MySQL 5.7 limitations I should know about?
4. Query optimization suggestions?

---
*Following Code of Hammurabi: Law 7 (Performance)*
"@
        
        'cheapname-deploy' = @"
CHEAPNAME DEPLOYMENT VALIDATION - $ProjectName

CONSTRAINTS:
- No Docker support on Cheapname
- Must use cPanel + SSH
- Python 3.11 available
- No systemd (use cPanel restart)

MY APPROACH:
1. Git push to GitHub
2. SSH to Cheapname
3. Git pull latest code
4. Install dependencies in venv
5. Run migrations
6. Restart app

DEPLOYMENT SCRIPT:
``````powershell
[Paste your deploy-cheapname.ps1 script]
``````

QUESTIONS:
1. Is this approach sound for Cheapname (no Docker)?
2. How do I restart the app? (touch passenger_wsgi.py?)
3. Should I use gunicorn or uvicorn + cPanel proxy?
4. Any Cheapname-specific gotchas?
5. Will rollback work if deployment fails?

---
*Following Solo Developer Framework Phase 6: Cheapname Deployment*
"@
        
        'cheapname-perf' = @"
PERFORMANCE OPTIMIZATION - Cheapname Shared Hosting

PROJECT: $ProjectName

CURRENT METRICS:
- Average response time: [Current ms]
- Target: <200ms (P95)
- Database queries: [Current count]
- Memory usage: [Current MB]

CONSTRAINTS:
- Cheapname shared hosting (limited CPU, memory)
- No Redis (would exceed `$10/month budget)
- MySQL 5.7
- Budget: `$10/month total

CURRENT APPROACH:
``````python
[Paste relevant code]
``````

QUESTIONS:
1. What's the bottleneck here?
2. Can I optimize with in-memory caching instead of Redis?
3. Are my database queries optimal?
4. Is CPU throttling the issue on Cheapname?
5. Any free optimizations I should try first?

---
*Following Code of Hammurabi: Law 7 (Performance)*
"@
        
        'help' = @"
AVAILABLE CLAUDE PROMPT TEMPLATES

Quick Prompts:
  standup           Daily standup template
  review            Code review request
  arch              Architecture review
  debug             Debugging session
  deploy            Deployment validation

Cheapname-Specific:
  cheapname-db      Database design for Cheapname
  cheapname-deploy  Cheapname deployment validation
  cheapname-perf    Performance optimization for Cheapname

Usage:
  Invoke-ClaudePrompt -Type standup -ProjectName "MyAPI"
  hclaude -Type review
  hclaude -Type cheapname-db -ProjectName "PaymentAPI"

Templates follow:
- Hammurabi's Style v2.1
- Solo Developer Framework v2.0
- The Code of Hammurabi

Tip: Prompts are copied to clipboard automatically!
"@
    }
    
    $template = $templates[$Type]
    
    if ($template) {
        $template | Set-Clipboard
        Write-Host "✅ " -NoNewline -ForegroundColor Green
        Write-Host "$Type prompt copied to clipboard!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Open Claude.ai in browser" -ForegroundColor White
        Write-Host "  2. Paste prompt (Ctrl+V)" -ForegroundColor White
        Write-Host "  3. Fill in [bracketed] sections" -ForegroundColor White
        Write-Host "  4. Submit to Claude" -ForegroundColor White
        Write-Host ""
        Write-Host "Prompt preview:" -ForegroundColor Gray
        Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
        Write-Host $template.Substring(0, [Math]::Min(300, $template.Length))... -ForegroundColor DarkGray
        Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
    } else {
        Write-Host $templates['help']
    }
}

# Alias for quick access
Set-Alias -Name hclaude -Value Invoke-ClaudePrompt

# ========================================
# TESTING: VALIDATION & QUALITY
# ========================================

function Test-HammurabiProject {
    <#
    .SYNOPSIS
    Run comprehensive test suite following The Code of Hammurabi.
    
    .DESCRIPTION
    Executes all tests and quality checks:
    - Unit tests
    - Integration tests
    - E2E tests
    - Code coverage
    - Security scanning
    - Performance benchmarks
    
    .PARAMETER Path
    Project path (defaults to current directory)
    
    .PARAMETER Type
    Test type: all, unit, integration, e2e, coverage, security, performance
    
    .EXAMPLE
    Test-HammurabiProject -Type all
    
    .EXAMPLE
    htest -Type coverage
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$false)]
        [string]$Path = (Get-Location),
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('all', 'unit', 'integration', 'e2e', 'coverage', 'security', 'performance')]
        [string]$Type = 'all'
    )
    
    Write-Host "🧪 Running Hammurabi test suite..." -ForegroundColor Cyan
    Write-Host "   Project: $Path" -ForegroundColor Gray
    Write-Host "   Type: $Type" -ForegroundColor Gray
    Write-Host ""
    
    Push-Location $Path
    
    try {
        # Detect stack
        $stack = Get-ProjectStack
        
        if (-not $stack) {
            Write-Error "Could not detect project stack. Ensure requirements.txt, package.json, or *.csproj exists."
            return
        }
        
        Write-Host "📦 Detected stack: $stack" -ForegroundColor Cyan
        Write-Host ""
        
        # Run tests based on stack
        switch ($stack) {
            'Python' { Test-PythonProject -Type $Type }
            'JavaScript' { Test-JavaScriptProject -Type $Type }
            'TypeScript' { Test-TypeScriptProject -Type $Type }
            'CSharp' { Test-CSharpProject -Type $Type }
        }
        
    } finally {
        Pop-Location
    }
}

function Test-PythonProject {
    param([string]$Type)
    
    Write-Host "🐍 Running Python test suite..." -ForegroundColor Yellow
    Write-Host ""
    
    if ($Type -eq 'all' -or $Type -eq 'unit') {
        Write-Host "📝 Unit Tests" -ForegroundColor Cyan
        & pytest tests/unit -v --tb=short
    }
    
    if ($Type -eq 'all' -or $Type -eq 'coverage') {
        Write-Host ""
        Write-Host "📊 Code Coverage" -ForegroundColor Cyan
        & pytest tests/ --cov=src --cov-report=term --cov-report=html --cov-fail-under=85
        Write-Host ""
        Write-Host "Coverage report: htmlcov/index.html" -ForegroundColor Gray
    }
    
    if ($Type -eq 'all' -or $Type -eq 'security') {
        Write-Host ""
        Write-Host "🔒 Security Scan" -ForegroundColor Cyan
        & bandit -r src/ -f json -o bandit-report.json
        & pip-audit
    }
    
    if ($Type -eq 'all' -or $Type -eq 'performance') {
        Write-Host ""
        Write-Host "⚡ Performance Tests" -ForegroundColor Cyan
        Write-Host "  (Not implemented - create tests/performance/)" -ForegroundColor Gray
    }
}

# ========================================
# DEPLOYMENT: CHEAPNAME AUTOMATION
# ========================================

function Invoke-HammurabiDeploy {
    <#
    .SYNOPSIS
    Deploy project to Cheapname hosting.
    
    .DESCRIPTION
    Automated deployment following Solo Developer Framework Phase 6:
    - Pre-deployment validation
    - Git push
    - SSH deployment
    - Database migrations
    - Health checks
    - Rollback on failure
    
    .PARAMETER Environment
    Target environment: staging, production
    
    .PARAMETER Path
    Project path (defaults to current directory)
    
    .EXAMPLE
    Invoke-HammurabiDeploy -Environment production
    
    .EXAMPLE
    hdeploy -Environment staging
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet('staging', 'production')]
        [string]$Environment,
        
        [Parameter(Mandatory=$false)]
        [string]$Path = (Get-Location)
    )
    
    Write-Host "🚀 Hammurabi Deployment Pipeline" -ForegroundColor Cyan
    Write-Host "   Environment: $Environment" -ForegroundColor Gray
    Write-Host "   Path: $Path" -ForegroundColor Gray
    Write-Host ""
    
    Push-Location $Path
    
    try {
        # Load config
        if (-not (Test-Path "$HammurabiRoot\config.json")) {
            Write-Error "Framework not initialized. Run: Initialize-HammurabiFramework"
            return
        }
        
        $config = Get-Content "$HammurabiRoot\config.json" | ConvertFrom-Json
        
        if (-not $config.hosting.sshHost -or -not $config.hosting.sshUser) {
            Write-Error "Cheapname credentials not configured. Update $HammurabiRoot\config.json"
            return
        }
        
        # Pre-deployment checks
        Write-Host "📋 Pre-Deployment Validation" -ForegroundColor Yellow
        
        # Check git status
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            Write-Error "Uncommitted changes detected. Commit before deploying."
            git status
            return
        }
        Write-Host "  ✓ No uncommitted changes" -ForegroundColor Green
        
        # Run tests
        Write-Host "  ⏳ Running tests..." -ForegroundColor Yellow
        $testResult = & pytest tests/ -q --tb=no 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Tests failed. Fix errors before deploying."
            return
        }
        Write-Host "  ✓ All tests passing" -ForegroundColor Green
        
        # Check coverage
        Write-Host "  ⏳ Checking coverage..." -ForegroundColor Yellow
        & pytest tests/ --cov=src --cov-report=term --cov-fail-under=85 -q > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Coverage below 85%. Continue? (Y/n)"
            $continue = Read-Host
            if ($continue -eq 'n') { return }
        } else {
            Write-Host "  ✓ Coverage >= 85%" -ForegroundColor Green
        }
        
        # Git push
        Write-Host ""
        Write-Host "📤 Pushing to repository..." -ForegroundColor Yellow
        git push origin main
        Write-Host "  ✓ Code pushed" -ForegroundColor Green
        
        # SSH deployment
        Write-Host ""
        Write-Host "🔧 Deploying to Cheapname..." -ForegroundColor Yellow
        
        $sshHost = $config.hosting.sshHost
        $sshUser = $config.hosting.sshUser
        $projectName = Split-Path -Leaf $Path
        
        $deployCommands = @"
set -e
echo "=== Cheapname Deployment ==="

cd ~/public_html/$projectName

# Backup current version
if [ -d src ]; then
    cp -r . ../backup_`$(date +%Y%m%d_%H%M%S)
    echo "✓ Backup created"
fi

# Pull latest code
git fetch origin
git checkout -f origin/main
echo "✓ Code updated"

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Run migrations
python3 -m alembic upgrade head
echo "✓ Migrations complete"

# Restart app
touch passenger_wsgi.py
echo "✓ App restarted"

echo "✅ Deployment complete!"
"@
        
        $deployCommands | ssh -l $sshUser $sshHost bash -s
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Deployment successful!" -ForegroundColor Green
            
            # Health check
            Write-Host ""
            Write-Host "🏥 Running health check..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            
            $healthUrl = "https://$sshHost/api/health"
            try {
                $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Host "  ✓ Health check passed" -ForegroundColor Green
                }
            } catch {
                Write-Warning "Health check failed. Verify manually: $healthUrl"
            }
            
            Write-Host ""
            Write-Host "🎉 Deployment complete!" -ForegroundColor Cyan
            Write-Host "   Live at: https://$sshHost" -ForegroundColor Gray
        } else {
            Write-Error "Deployment failed. Check logs on server."
        }
        
    } finally {
        Pop-Location
    }
}

# Alias
Set-Alias -Name hdeploy -Value Invoke-HammurabiDeploy

# ========================================
# UTILITIES: HELPER FUNCTIONS
# ========================================

function Write-HammurabiHeader {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║              🏛️  HAMMURABI CODING COMPANY  🏛️                ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║              Solo Developer Framework v$FrameworkVersion              ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "║          'Write code that future generations thank you for'  ║" -ForegroundColor Cyan
    Write-Host "║                                                               ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Get-HammurabiHelp {
    <#
    .SYNOPSIS
    Display help for Hammurabi Framework commands.
    #>
    
    Write-HammurabiHeader
    
    Write-Host "AVAILABLE COMMANDS" -ForegroundColor Yellow
    Write-Host ""
    
    $commands = @(
        @{ Name = "Initialize-HammurabiFramework"; Alias = ""; Description = "Setup framework on new system" },
        @{ Name = "New-HammurabiProject"; Alias = "hproj"; Description = "Create new project with full scaffolding" },
        @{ Name = "Invoke-ClaudePrompt"; Alias = "hclaude"; Description = "Generate Claude.ai prompt templates" },
        @{ Name = "Test-HammurabiProject"; Alias = "htest"; Description = "Run comprehensive test suite" },
        @{ Name = "Invoke-HammurabiDeploy"; Alias = "hdeploy"; Description = "Deploy to Cheapname hosting" },
        @{ Name = "Get-HammurabiHelp"; Alias = ""; Description = "Display this help" }
    )
    
    foreach ($cmd in $commands) {
        Write-Host "  $($cmd.Name)" -ForegroundColor Cyan -NoNewline
        if ($cmd.Alias) {
            Write-Host " ($($cmd.Alias))" -ForegroundColor Gray -NoNewline
        }
        Write-Host ""
        Write-Host "    $($cmd.Description)" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "QUICK START" -ForegroundColor Yellow
    Write-Host "  1. Initialize-HammurabiFramework" -ForegroundColor White
    Write-Host "  2. New-HammurabiProject -Name 'MyApp' -Type 'API' -Stack 'Python'" -ForegroundColor White
    Write-Host "  3. cd C:\HammurabiDev\Projects\MyApp" -ForegroundColor White
    Write-Host "  4. code ." -ForegroundColor White
    Write-Host ""
    
    Write-Host "DOCUMENTATION" -ForegroundColor Yellow
    Write-Host "  Framework: $HammurabiRoot\Docs\README.md" -ForegroundColor White
    Write-Host "  Code of Hammurabi: $ModuleRoot\..\Docs\CODE_OF_HAMMURABI.md" -ForegroundColor White
    Write-Host ""
}

function Get-ProjectStack {
    <#
    .SYNOPSIS
    Detect project technology stack.
    #>
    
    if (Test-Path "requirements.txt") { return "Python" }
    if (Test-Path "package.json") {
        $pkg = Get-Content "package.json" | ConvertFrom-Json
        if ($pkg.dependencies."typescript") { return "TypeScript" }
        return "JavaScript"
    }
    if (Test-Path "*.csproj") { return "CSharp" }
    if (Test-Path "go.mod") { return "Go" }
    if (Test-Path "Cargo.toml") { return "Rust" }
    
    return $null
}

# Template generators (simplified versions - expand as needed)

function Get-GitIgnoreTemplate {
    param([string]$Stack)
    
    $common = @"
# Hammurabi Framework
.vscode/
*.log
.env
.env.local
secrets.json

# OS
.DS_Store
Thumbs.db
"@
    
    switch ($Stack) {
        'Python' { $common + "`n`n__pycache__/`n*.py[cod]`nvenv/`n.pytest_cache/" }
        'JavaScript' { $common + "`n`nnode_modules/`ndist/`nbuild/" }
        'TypeScript' { $common + "`n`nnode_modules/`ndist/`nbuild/`n*.tsbuildinfo" }
        default { $common }
    }
}

function Get-VSCodeSettings {
    param([string]$Stack)
    
    @"
{
  "editor.formatOnSave": true,
  "editor.rulers": [80, 120],
  "files.exclude": {
    "**/__pycache__": true,
    "**/node_modules": true,
    "**/.venv": true
  }
}
"@
}

# Script generators (simplified - expand based on stack)

function Get-SetupScript {
    param([string]$Stack)
    
    switch ($Stack) {
        'Python' {
            @"
# Setup Python environment
Write-Host "Setting up Python environment..." -ForegroundColor Cyan

python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
pip install -r requirements-dev.txt

Write-Host "✅ Setup complete!" -ForegroundColor Green
"@
        }
        default { "# Setup script for $Stack" }
    }
}

function Get-TestScript {
    param([string]$Stack)
    
    switch ($Stack) {
        'Python' {
            @"
# Run Python tests
Write-Host "Running test suite..." -ForegroundColor Cyan

.\venv\Scripts\Activate.ps1
pytest tests/ -v --cov=src --cov-report=term --cov-report=html

Write-Host "Coverage report: htmlcov/index.html" -ForegroundColor Gray
"@
        }
        default { "# Test script for $Stack" }
    }
}

function Get-DeployScript {
    param([string]$Stack, [string]$Hosting)
    
    @"
# Deploy to $Hosting
# See Invoke-HammurabiDeploy for full implementation
param(
    [Parameter(Mandatory=`$true)]
    [ValidateSet('staging', 'production')]
    [string]`$Environment
)

Write-Host "Deploying to `$Environment..." -ForegroundColor Cyan
# Use: Invoke-HammurabiDeploy -Environment `$Environment
"@
}

function Get-DevScript {
    param([string]$Stack)
    
    switch ($Stack) {
        'Python' {
            @"
# Start development server
Write-Host "Starting development server..." -ForegroundColor Cyan

.\venv\Scripts\Activate.ps1
uvicorn src.main:app --reload --port 8000
"@
        }
        default { "# Dev script for $Stack" }
    }
}

function Get-QualityScript {
    param([string]$Stack)
    
    switch ($Stack) {
        'Python' {
            @"
# Run quality checks
Write-Host "Running quality checks..." -ForegroundColor Cyan

.\venv\Scripts\Activate.ps1

Write-Host "1. Linting..." -ForegroundColor Yellow
pylint src/

Write-Host "2. Type checking..." -ForegroundColor Yellow
mypy src/

Write-Host "3. Security scan..." -ForegroundColor Yellow
bandit -r src/

Write-Host "✅ Quality checks complete!" -ForegroundColor Green
"@
        }
        default { "# Quality script for $Stack" }
    }
}

# ========================================
# MODULE EXPORTS
# ========================================

Export-ModuleMember -Function @(
    'Initialize-HammurabiFramework',
    'New-HammurabiProject',
    'Invoke-ClaudePrompt',
    'Test-HammurabiProject',
    'Invoke-HammurabiDeploy',
    'Get-HammurabiHelp'
) -Alias @('hproj', 'hclaude', 'htest', 'hdeploy')

Write-Host "✅ Hammurabi Framework v$FrameworkVersion loaded" -ForegroundColor Green
