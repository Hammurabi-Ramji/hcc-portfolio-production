# AI-Highway for Coding (AHFC) - PowerShell Implementation Engine
# Version: 1.0.0
# Author: R.K. Girdhari / Hammurabi Coding Company
# License: CC-BY-4.0
# Purpose: Core module that manages interstate signs, enforces checkpoints, and triggers random reinforcement

<#
.SYNOPSIS
    Comprehensive PowerShell module implementing the AI-Highway for Coding framework.

.DESCRIPTION
    This module provides functions to:
    - Detect and enforce LIMIT signs (hard constraints)
    - Trigger WARNING signs (advisory alerts)
    - Guide developers with DIRECTION signs
    - Randomly inject INFO signs (educational nudges)
    - Schedule REST AREA signs (refactoring breaks)

.EXAMPLE
    Import-Module .\AHFC-Engine.ps1
    
    # Check code coverage gate before merge
    Test-LimitSign -SignName "LIMIT-001" -Coverage 82
    
    # Get guidance for current exit
    Get-DirectionSign -ExitNumber 5 -CurrentPhase "RED"
    
    # Random info sign (23% probability)
    Get-RandomInfoSign -SessionNumber 42

.NOTES
    Designed for solo developers using the Solo Developer Framework v2.0
    Integration points: GitHub Actions, VS Code, Pre-commit hooks
#>

param()

# ============================================================================
# SECTION 1: MODULE CONFIGURATION & INITIALIZATION
# ============================================================================

$ErrorActionPreference = 'Stop'
$VerbosePreference = 'Continue'

# Module metadata
$AHFC_VERSION = "1.0.0"
$AHFC_NAME = "AI-Highway for Coding"

# Define script root for relative paths
$script:ModuleRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Console color scheme for AHFC signs
$script:Colors = @{
    RedLimit        = 'Red'
    OrangeWarning   = 'Yellow'  # PowerShell doesn't have orange, so use yellow
    YellowDirection = 'Yellow'
    GreenInfo       = 'Green'
    BlueRest        = 'Cyan'    # PowerShell doesn't have true blue
    Neutral         = 'White'
    Success         = 'Green'
    Caution         = 'Yellow'
    Error           = 'Red'
}

Write-Verbose "[AHFC] Loading module: $AHFC_NAME v$AHFC_VERSION"

# ============================================================================
# SECTION 2: DATA STRUCTURES - SIGN REGISTRY
# ============================================================================

<#
    Each sign type has structured metadata:
    - Name: Unique identifier
    - Title: Human-readable title
    - Description: Full description
    - Severity: CRITICAL, HIGH, MEDIUM, LOW
    - TriggerCondition: How/when sign is triggered
    - AllowOverride: Can user override this sign
    - Message: Formatted message to display
#>

$script:LimitSigns = @(
    @{
        ID              = "LIMIT-001"
        Title           = "Code Coverage Threshold Block"
        Description     = "Deployment blocked when coverage falls below 85%"
        Severity        = "CRITICAL"
        Threshold       = 85
        TriggerLogic    = { param($Coverage) $Coverage -lt 85 }
        AllowOverride   = $false
        BlockMessage    = @"
╔════════════════════════════════════════╗
║  🛑 COVERAGE BELOW 85%                 ║
║  DEPLOYMENT BLOCKED                     ║
║════════════════════════════════════════╣
║  Current Coverage: {0}%                 ║
║  Required:        85%                   ║
║  Shortfall:       {1} percentage points ║
║                                        ║
║  Action: Add {2} more tests to reach   ║
║          85% coverage                   ║
║                                        ║
║  Learn: https://coverage.readthedocs   ║
╚════════════════════════════════════════╝
"@
    }
    
    @{
        ID              = "LIMIT-002"
        Title           = "Secret Detection Block"
        Description     = "Deployment blocked when secrets detected in source"
        Severity        = "CRITICAL"
        TriggerLogic    = { param($SecretsFound) $SecretsFound -gt 0 }
        AllowOverride   = $false
        BlockMessage    = @"
╔════════════════════════════════════════╗
║  ⚠️  SECRET DETECTED IN SOURCE CODE    ║
║  DEPLOYMENT BLOCKED                     ║
║════════════════════════════════════════╣
║  File: {0}                              ║
║  Type: {1}                              ║
║  Line: {2}                              ║
║                                        ║
║  Action (REQUIRED):                    ║
║  1. Remove secret from source          ║
║  2. Add entry to .gitignore            ║
║  3. Force push: git push -f             ║
║  4. Rotate exposed credential          ║
║                                        ║
║  Learn: https://cheatsheetseries.      ║
║  owasp.org/cheatsheets/...             ║
╚════════════════════════════════════════╝
"@
    }
    
    @{
        ID              = "LIMIT-003"
        Title           = "Linting Errors Block"
        Description     = "Merge blocked when linting errors detected"
        Severity        = "HIGH"
        TriggerLogic    = { param($ErrorCount) $ErrorCount -gt 0 }
        AllowOverride   = $true
        BlockMessage    = @"
╔════════════════════════════════════════╗
║  ❌ LINTING FAILED                     ║
║  MERGE BLOCKED                          ║
║════════════════════════════════════════╣
║  Errors:   {0}                          ║
║  Warnings: {1}                          ║
║                                        ║
║  Auto-fix:                             ║
║  python -m black . && isort .          ║
║  OR                                    ║
║  npx prettier --write .                ║
║                                        ║
║  Suppress (if justified):              ║
║  # pylint: disable=LINE_TOO_LONG       ║
║                                        ║
║  Learn: https://pep8.org/              ║
╚════════════════════════════════════════╝
"@
    }
)

$script:WarningsSigns = @(
    @{
        ID           = "WARNING-001"
        Title        = "Large Refactoring Ahead"
        Description  = "Large refactors should be broken into smaller PRs"
        Severity     = "MEDIUM"
        FileThreshold = 15
        LineThreshold = 400
        TriggerLogic = { param($Files, $Lines) $Files -gt 15 -or $Lines -gt 400 }
        WarningMessage = @"
╔════════════════════════════════════════╗
║  ⚠️  LARGE REFACTORING DETECTED        ║
╠════════════════════════════════════════╣
║  Files Changed: {0}                    ║
║  Lines Modified: {1}                   ║
║                                        ║
║  ⚡ RECOMMENDATION:                    ║
║  Break this into 3-4 smaller PRs       ║
║  for easier review and faster merge    ║
║                                        ║
║  Benefits:                             ║
║  • Faster code review                  ║
║  • Easier debugging if issues arise    ║
║  • Better git history                  ║
║                                        ║
║  Proceed anyway? (Y/N)                 ║
╚════════════════════════════════════════╝
"@
    }
    
    @{
        ID           = "WARNING-002"
        Title        = "N+1 Query Pattern"
        Description  = "Query inside loop detected - potential performance issue"
        Severity     = "MEDIUM"
        TriggerLogic = { param($Location) $Location -match "for|while" -and $_ -match "query|select" }
        WarningMessage = @"
╔════════════════════════════════════════╗
║  ⚠️  N+1 QUERY PATTERN DETECTED        ║
╠════════════════════════════════════════╣
║  Location: {0}                          ║
║                                        ║
║  Current: Loop executes query N times  ║
║  Better:  Single JOIN query            ║
║                                        ║
║  Performance impact:                   ║
║  Potential: {0}x slower                ║
║                                        ║
║  Resources:                            ║
║  • use-the-index-luke.com              ║
║  • Modern SQL book (Joe Celko)         ║
║                                        ║
║  Acknowledge? (Y/N)                    ║
╚════════════════════════════════════════╝
"@
    }
)

$script:DirectionSigns = @(
    @{
        ID           = "DIRECTION-001"
        ExitNumber   = 5
        Title        = "EXIT 5: TDD Development Loop"
        Phases       = @('RED', 'GREEN', 'REFACTOR')
        Description  = "Guide through RED-GREEN-REFACTOR cycle"
        CurrentPhase = ""
        NextSteps    = @(
            "RED:     Write failing test",
            "GREEN:   Write code to pass test",
            "REFACTOR: Improve code quality",
            "REPEAT:  Loop 3-5 times per day"
        )
    }
    
    @{
        ID           = "DIRECTION-002"
        ExitNumber   = 7
        Title        = "EXIT 7: Code Review Pathway"
        Description  = "Step-by-step code review checklist"
        Steps        = @(
            "SECURITY:    Run security scan (bandit, Snyk)",
            "TESTS:       Verify coverage >= 85%",
            "LINTING:     Confirm 0 linting errors",
            "PERFORMANCE: Check P99 latency < target",
            "DOCS:        Validate updated documentation"
        )
    }
)

$script:InfoSigns = @(
    @{
        ID      = "INFO-001"
        Title   = "Clean Code Principle"
        Topic   = "Code Clarity"
        Content = @"
Variable names are the most important tool
for code clarity.

✓ GOOD:  user_email_verified, order_total
✗ BAD:   x, data, temp, obj

Investment: 10 seconds naming → 10 minutes
of future savings when reading code.

Source: Robert C. Martin, Clean Code (p.254)
"@
        Probability = 0.23
    }
    
    @{
        ID      = "INFO-002"
        Title   = "TDD Benefits (Research-Backed)"
        Topic   = "Test-Driven Development"
        Content = @"
Studies show TDD reduces defects by 40-80%
while only increasing dev time by ~16%.

ROI: Higher quality + faster time-to-market

Key metrics:
• Defect reduction: 40-80%
• Development time: +15% (worth it)
• Maintenance cost: -20%

Source: Nagappan et al. (Microsoft Research, 2008)
"@
        Probability = 0.23
    }
    
    @{
        ID      = "INFO-003"
        Title   = "Single Responsibility Principle (SRP)"
        Topic   = "SOLID Principles"
        Content = @"
Each class/function should do exactly ONE thing.

Benefits:
• Easier to test
• Reusable across projects
• Maintainable long-term

Bad:   class UserManager { ... 500 lines ... }
Good:  class UserValidator { }
       class UserRepository { }
       class UserNotifier { }

Source: Robert C. Martin, SOLID Principles
"@
        Probability = 0.23
    }
)

$script:RestAreaSigns = @(
    @{
        ID             = "REST-001"
        Title          = "REST AREA: Refactoring Break"
        Description    = "Time to pause and clean up technical debt"
        CommitThreshold = 20
        DayThreshold   = 7
        Duration       = "2-4 hours"
        Activities     = @(
            "Consolidate duplicate code",
            "Improve variable naming",
            "Extract complex methods",
            "Simplify conditional logic",
            "Update documentation"
        )
        PostActivity   = "Run full test suite to ensure no regressions"
    }
    
    @{
        ID             = "REST-002"
        Title          = "REST AREA: Security Audit"
        Description    = "Time to review security posture"
        DayThreshold   = 28
        Duration       = "1-2 hours"
        Activities     = @(
            "Run security scanner (bandit, Snyk)",
            "Review access controls",
            "Check for hardcoded secrets",
            "Update vulnerable dependencies",
            "Document findings"
        )
    }
)

# ============================================================================
# SECTION 3: LIMIT SIGN FUNCTIONS (Hard Constraints)
# ============================================================================

<#
.SYNOPSIS
    Tests a LIMIT sign condition and blocks if violated.

.DESCRIPTION
    LIMIT signs are hard constraints that prevent merging/deployment.
    They cannot be overridden without explicit justification.

.PARAMETER SignID
    The ID of the limit sign (e.g., "LIMIT-001")

.PARAMETER Coverage
    Code coverage percentage (for coverage checks)

.EXAMPLE
    Test-LimitSign -SignID "LIMIT-001" -Coverage 82
    # Returns: BLOCKED - Coverage 82% below threshold 85%
#>
function Test-LimitSign {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("LIMIT-001", "LIMIT-002", "LIMIT-003")]
        [string]$SignID,
        
        [Parameter(Mandatory = $false)]
        [int]$Coverage = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$SecretsFound = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$LintErrors = 0
    )
    
    Write-Verbose "[LIMIT] Testing sign: $SignID"
    
    $sign = $script:LimitSigns | Where-Object { $_.ID -eq $SignID }
    
    if (-not $sign) {
        Write-Error "Sign $SignID not found in registry"
        return
    }
    
    # Evaluate trigger condition
    $isTriggered = $false
    
    switch ($SignID) {
        "LIMIT-001" { $isTriggered = & $sign.TriggerLogic $Coverage }
        "LIMIT-002" { $isTriggered = & $sign.TriggerLogic $SecretsFound }
        "LIMIT-003" { $isTriggered = & $sign.TriggerLogic $LintErrors }
    }
    
    if ($isTriggered) {
        Write-Host -ForegroundColor $script:Colors.RedLimit "╔════════════════════════════════════════╗"
        Write-Host -ForegroundColor $script:Colors.RedLimit "║  🛑 LIMIT SIGN TRIGGERED                ║"
        Write-Host -ForegroundColor $script:Colors.RedLimit "║  $($sign.Title.PadRight(37)) ║"
        Write-Host -ForegroundColor $script:Colors.RedLimit "║  Severity: $($sign.Severity.PadRight(28)) ║"
        Write-Host -ForegroundColor $script:Colors.RedLimit "╚════════════════════════════════════════╝"
        
        # Format message with context
        $message = $sign.BlockMessage -f $Coverage, (85 - $Coverage), (85 - $Coverage) / 5
        Write-Host -ForegroundColor $script:Colors.RedLimit $message
        
        return @{
            IsTriggered   = $true
            SignID        = $SignID
            Severity      = $sign.Severity
            AllowOverride = $sign.AllowOverride
            Message       = $message
        }
    }
    
    Write-Verbose "[LIMIT] Sign $SignID: Condition not triggered (PASS)"
    return @{
        IsTriggered   = $false
        SignID        = $SignID
        Status        = "PASS"
    }
}

# ============================================================================
# SECTION 4: WARNING SIGN FUNCTIONS (Advisory Alerts)
# ============================================================================

<#
.SYNOPSIS
    Tests a WARNING sign and alerts developer if condition is met.

.DESCRIPTION
    WARNING signs alert to hazards but don't block (yet).
    User can acknowledge and proceed with caution.
#>
function Test-WarningSign {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("WARNING-001", "WARNING-002")]
        [string]$SignID,
        
        [Parameter(Mandatory = $false)]
        [int]$FilesChanged = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$LinesModified = 0
    )
    
    Write-Verbose "[WARNING] Testing sign: $SignID"
    
    $sign = $script:WarningsSigns | Where-Object { $_.ID -eq $SignID }
    
    if (-not $sign) {
        Write-Error "Sign $SignID not found in registry"
        return
    }
    
    # Evaluate trigger condition
    $isTriggered = & $sign.TriggerLogic $FilesChanged $LinesModified
    
    if ($isTriggered) {
        Write-Host -ForegroundColor $script:Colors.OrangeWarning "╔════════════════════════════════════════╗"
        Write-Host -ForegroundColor $script:Colors.OrangeWarning "║  ⚠️  WARNING SIGN                        ║"
        Write-Host -ForegroundColor $script:Colors.OrangeWarning "║  $($sign.Title.PadRight(37)) ║"
        Write-Host -ForegroundColor $script:Colors.OrangeWarning "╚════════════════════════════════════════╝"
        
        $message = $sign.WarningMessage -f $FilesChanged, $LinesModified
        Write-Host -ForegroundColor $script:Colors.OrangeWarning $message
        
        $response = Read-Host "Proceed anyway?"
        
        if ($response -ne 'Y') {
            Write-Host -ForegroundColor $script:Colors.Caution "Stopped at warning. Address issues and retry."
            exit 1
        }
        
        return @{
            IsTriggered = $true
            SignID      = $SignID
            UserChoice  = $response
        }
    }
    
    return @{
        IsTriggered = $false
        SignID      = $SignID
        Status      = "PASS"
    }
}

# ============================================================================
# SECTION 5: DIRECTION SIGN FUNCTIONS (Guidance)
# ============================================================================

<#
.SYNOPSIS
    Provides guidance for the current development exit.

.DESCRIPTION
    DIRECTION signs guide developers through the correct pathway
    for their current task (e.g., EXIT 5: TDD loop).
#>
function Get-DirectionSign {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateRange(1, 11)]
        [int]$ExitNumber,
        
        [Parameter(Mandatory = $false)]
        [string]$CurrentPhase = ""
    )
    
    Write-Verbose "[DIRECTION] Getting guidance for Exit $ExitNumber, Phase: $CurrentPhase"
    
    $sign = $script:DirectionSigns | Where-Object { $_.ExitNumber -eq $ExitNumber }
    
    if (-not $sign) {
        Write-Error "Exit $ExitNumber not found in registry"
        return
    }
    
    Write-Host -ForegroundColor $script:Colors.YellowDirection "╔════════════════════════════════════════╗"
    Write-Host -ForegroundColor $script:Colors.YellowDirection "║  🟡 DIRECTION SIGN                     ║"
    Write-Host -ForegroundColor $script:Colors.YellowDirection "║  $($sign.Title.PadRight(37)) ║"
    Write-Host -ForegroundColor $script:Colors.YellowDirection "╚════════════════════════════════════════╝"
    
    if ($CurrentPhase) {
        Write-Host -ForegroundColor $script:Colors.Neutral "Current Phase: $CurrentPhase"
        Write-Host ""
    }
    
    Write-Host -ForegroundColor $script:Colors.Neutral "Next Steps:"
    foreach ($step in $sign.NextSteps) {
        Write-Host -ForegroundColor $script:Colors.Neutral "  $step"
    }
    
    return $sign
}

# ============================================================================
# SECTION 6: INFO SIGN FUNCTIONS (Educational Reinforcement)
# ============================================================================

<#
.SYNOPSIS
    Randomly injects educational INFO signs (spaced repetition).

.DESCRIPTION
    INFO signs appear with 23% probability per session.
    Based on spaced repetition psychology for improved retention.

.EXAMPLE
    Get-RandomInfoSign -SessionNumber 42
    # 23% chance of displaying random educational sign
#>
function Get-RandomInfoSign {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [int]$SessionNumber = 1
    )
    
    # Spaced repetition probability: 23% chance
    $randomValue = Get-Random -Minimum 0 -Maximum 100
    
    if ($randomValue -lt 23) {
        Write-Verbose "[INFO] Probability triggered (23%). Showing random INFO sign."
        
        $sign = $script:InfoSigns | Get-Random
        
        Write-Host -ForegroundColor $script:Colors.GreenInfo "╔════════════════════════════════════════╗"
        Write-Host -ForegroundColor $script:Colors.GreenInfo "║  ℹ️  DID YOU KNOW?                     ║"
        Write-Host -ForegroundColor $script:Colors.GreenInfo "║  $($sign.Title.PadRight(37)) ║"
        Write-Host -ForegroundColor $script:Colors.GreenInfo "╚════════════════════════════════════════╝"
        Write-Host ""
        Write-Host -ForegroundColor $script:Colors.GreenInfo $sign.Content
        Write-Host ""
        
        return $sign
    }
    
    Write-Verbose "[INFO] Probability not triggered this session ($randomValue < 23)."
    return $null
}

# ============================================================================
# SECTION 7: REST AREA SIGN FUNCTIONS (Refactoring Breaks)
# ============================================================================

<#
.SYNOPSIS
    Determines if a REST AREA is due based on commit count or time.

.DESCRIPTION
    REST AREA signs recommend breaks for refactoring or security audits.
    Triggered when:
    - Commits since last refactor > 20
    - Days since last refactor > 7
#>
function Test-RestAreaDue {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [int]$CommitsSinceRefactor = 0,
        
        [Parameter(Mandatory = $false)]
        [datetime]$LastRefactorDate = (Get-Date).AddDays(-1)
    )
    
    $commitThreshold = 20
    $dayThreshold = 7
    
    $daysSinceRefactor = [math]::Floor(
        (Get-Date) - $LastRefactorDate | Select-Object -ExpandProperty TotalDays
    )
    
    $isDue = ($CommitsSinceRefactor -gt $commitThreshold) -or ($daysSinceRefactor -gt $dayThreshold)
    
    if ($isDue) {
        Write-Verbose "[REST-AREA] Due for refactoring. Commits: $CommitsSinceRefactor, Days: $daysSinceRefactor"
        return $true
    }
    
    return $false
}

function Show-RestAreaSign {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [ValidateSet("REST-001", "REST-002")]
        [string]$SignID = "REST-001",
        
        [Parameter(Mandatory = $false)]
        [int]$CommitsSinceRefactor = 0
    )
    
    $sign = $script:RestAreaSigns | Where-Object { $_.ID -eq $SignID }
    
    Write-Host -ForegroundColor $script:Colors.BlueRest "╔════════════════════════════════════════╗"
    Write-Host -ForegroundColor $script:Colors.BlueRest "║  🔧 REST AREA                          ║"
    Write-Host -ForegroundColor $script:Colors.BlueRest "║  $($sign.Title.PadRight(37)) ║"
    Write-Host -ForegroundColor $script:Colors.BlueRest "╚════════════════════════════════════════╝"
    Write-Host ""
    
    if ($CommitsSinceRefactor -gt 0) {
        Write-Host -ForegroundColor $script:Colors.BlueRest "Commits since last refactor: $CommitsSinceRefactor"
    }
    
    Write-Host -ForegroundColor $script:Colors.BlueRest "Recommended duration: $($sign.Duration)"
    Write-Host ""
    
    Write-Host -ForegroundColor $script:Colors.Neutral "Activities:"
    foreach ($activity in $sign.Activities) {
        Write-Host -ForegroundColor $script:Colors.Neutral "  • $activity"
    }
    
    Write-Host ""
    Write-Host -ForegroundColor $script:Colors.BlueRest "After refactoring: Run full test suite"
    Write-Host ""
    
    return $sign
}

# ============================================================================
# SECTION 8: MASTER ORCHESTRATION (Complete AHFC Workflow)
# ============================================================================

<#
.SYNOPSIS
    Complete workflow orchestration for AHFC gates and signs.

.DESCRIPTION
    Coordinates all AHFC components for a complete development checkpoint.
    Used at merge/deploy gates.

.EXAMPLE
    Invoke-AHFCCheckpoint -ExitNumber 7 -Coverage 88 -LintErrors 0
#>
function Invoke-AHFCCheckpoint {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateRange(1, 11)]
        [int]$ExitNumber,
        
        [Parameter(Mandatory = $false)]
        [int]$Coverage = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$LintErrors = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$FilesChanged = 0,
        
        [Parameter(Mandatory = $false)]
        [int]$CommitsSinceRefactor = 0
    )
    
    Write-Host ""
    Write-Host -ForegroundColor $script:Colors.Neutral "═══════════════════════════════════════════════════════"
    Write-Host -ForegroundColor $script:Colors.Neutral "🛣️  AHFC CHECKPOINT - EXIT $ExitNumber"
    Write-Host -ForegroundColor $script:Colors.Neutral "═══════════════════════════════════════════════════════"
    Write-Host ""
    
    $gatesPass = 0
    $gatesFail = 0
    
    # GATE 1: Coverage (LIMIT-001)
    Write-Host -ForegroundColor $script:Colors.Neutral "[1/4] Testing Code Coverage Gate..."
    $coverageCheck = Test-LimitSign -SignID "LIMIT-001" -Coverage $Coverage
    
    if ($coverageCheck.IsTriggered) {
        $gatesFail++
    } else {
        Write-Host -ForegroundColor $script:Colors.Success "✓ Coverage gate PASSED ($Coverage% >= 85%)"
        $gatesPass++
    }
    
    # GATE 2: Linting (LIMIT-003)
    Write-Host ""
    Write-Host -ForegroundColor $script:Colors.Neutral "[2/4] Testing Linting Gate..."
    $lintCheck = Test-LimitSign -SignID "LIMIT-003" -LintErrors $LintErrors
    
    if ($lintCheck.IsTriggered) {
        $gatesFail++
    } else {
        Write-Host -ForegroundColor $script:Colors.Success "✓ Linting gate PASSED (0 errors)"
        $gatesPass++
    }
    
    # GATE 3: Large Refactor Warning (WARNING-001)
    Write-Host ""
    Write-Host -ForegroundColor $script:Colors.Neutral "[3/4] Checking for large refactors..."
    if ($FilesChanged -gt 0) {
        $warnCheck = Test-WarningSign -SignID "WARNING-001" -FilesChanged $FilesChanged -LinesModified 0
        if ($warnCheck.IsTriggered -and $warnCheck.UserChoice -ne 'Y') {
            $gatesFail++
        } else {
            $gatesPass++
        }
    } else {
        Write-Host -ForegroundColor $script:Colors.Success "✓ Large refactor check PASSED (within limits)"
        $gatesPass++
    }
    
    # GATE 4: Random INFO sign injection
    Write-Host ""
    Write-Host -ForegroundColor $script:Colors.Neutral "[4/4] Random knowledge injection..."
    $infoSign = Get-RandomInfoSign -SessionNumber $ExitNumber
    
    if ($infoSign) {
        Write-Host -ForegroundColor $script:Colors.Success "✓ Educational sign displayed"
    } else {
        Write-Host -ForegroundColor $script:Colors.Neutral "○ No INFO sign this session (try again later)"
    }
    $gatesPass++
    
    # REST AREA check
    Write-Host ""
    if (Test-RestAreaDue -CommitsSinceRefactor $CommitsSinceRefactor) {
        Write-Host -ForegroundColor $script:Colors.BlueRest "⏸️  REST AREA SUGGESTED"
        Show-RestAreaSign -CommitsSinceRefactor $CommitsSinceRefactor
    }
    
    # FINAL SUMMARY
    Write-Host ""
    Write-Host -ForegroundColor $script:Colors.Neutral "═══════════════════════════════════════════════════════"
    Write-Host -ForegroundColor $script:Colors.Neutral "CHECKPOINT SUMMARY"
    Write-Host -ForegroundColor $script:Colors.Neutral "═══════════════════════════════════════════════════════"
    
    if ($gatesFail -eq 0) {
        Write-Host -ForegroundColor $script:Colors.Success "✓ ALL GATES PASSED ($gatesPass/$($gatesPass + $gatesFail))"
        Write-Host -ForegroundColor $script:Colors.Success ""
        Write-Host -ForegroundColor $script:Colors.Success "Status: ✅ APPROVED FOR NEXT PHASE"
        Write-Host ""
        return $true
    } else {
        Write-Host -ForegroundColor $script:Colors.Error "✗ GATES FAILED ($gatesFail failed, $gatesPass passed)"
        Write-Host -ForegroundColor $script:Colors.Error ""
        Write-Host -ForegroundColor $script:Colors.Error "Status: ❌ BLOCKED - Address failures above"
        Write-Host ""
        return $false
    }
}

# ============================================================================
# SECTION 9: MODULE EXPORTS
# ============================================================================

# Export public functions
Export-ModuleMember -Function @(
    'Test-LimitSign',
    'Test-WarningSign',
    'Get-DirectionSign',
    'Get-RandomInfoSign',
    'Test-RestAreaDue',
    'Show-RestAreaSign',
    'Invoke-AHFCCheckpoint'
)

Write-Verbose "[AHFC] Module loaded successfully. Run Get-Command -Module AHFC to see available functions."
