# 🏛️ Hammurabi Development Framework v2.0

**The Complete Solo Developer Toolchain for Windows 11 + VS Code + Cheapname**

> *"Write code that future generations will thank you for"*  
> — The Code of Hammurabi

---

## **WHAT IS THIS?**

The **Hammurabi Development Framework** is a production-ready PowerShell module that orchestrates your entire solo development workflow from project inception to Cheapname deployment. It embodies the **Solo Developer Framework v2.0** and **The Code of Hammurabi** into a single, cohesive toolchain.

### **What It Does**

- ✅ **Project Scaffolding**: Generate complete project structures with one command
- ✅ **Claude.ai Integration**: Pre-built prompt templates for effective AI collaboration
- ✅ **Automated Testing**: Run comprehensive test suites with coverage tracking
- ✅ **Cheapname Deployment**: Automated SSH deployment with rollback
- ✅ **Quality Tracking**: Enforce Code of Hammurabi standards
- ✅ **VS Code Integration**: Automatic workspace configuration
- ✅ **Git Workflow**: Structured branching and commit conventions

### **Who It's For**

- Solo developers building production applications
- Windows 11 users with VS Code as their primary IDE
- Developers deploying to **Cheapname shared hosting** (or similar)
- Those following **digital sovereignty** and **offline-first** principles
- Believers in **lifetime licensing** over subscriptions

---

## **QUICK START (5 Minutes)**

> **Important:** this framework requires **PowerShell 7+**. The module and installer will not load correctly under Windows PowerShell 5.1.

### **Step 1: Install Framework**

```powershell
# Open PowerShell 7+ (pwsh) before running these commands
# Clone repository
git clone https://github.com/hammurabi-coding/hammurabi-framework.git C:\HammurabiDevFramework

# Navigate to module
cd C:\HammurabiDevFramework

# Run installation script
.\Install-HammurabiFramework.ps1

# Restart PowerShell
```

### **Step 2: Initialize Framework**

```powershell
# Import module
Import-Module C:\HammurabiDevFramework\Modules\HammurabiDev.psm1

# Initialize framework
Initialize-HammurabiFramework

# Follow prompts to configure:
# - Cheapname SSH credentials
# - Your developer info
# - Quality standards
```

### **Step 3: Create Your First Project**

```powershell
# Create new project
New-HammurabiProject -Name "MyFirstAPI" -Type "API" -Stack "Python" -Hosting "Cheapname"

# Navigate to project
cd C:\HammurabiDev\Projects\MyFirstAPI

# Open in VS Code
code .

# Setup environment
.\scripts\setup.ps1

# Run tests
.\scripts\test.ps1

# Start development server
.\scripts\dev.ps1
```

**Done!** You now have a production-ready project structure following The Code of Hammurabi.

---

## **CORE FEATURES**

### **1. Project Management**

```powershell
# Create new project with full scaffolding
New-HammurabiProject -Name "PaymentAPI" -Type "API" -Stack "Python" -Hosting "Cheapname"
# Alias: hproj

# Generates:
# ├── PROJECT_INTAKE.md       # Project documentation
# ├── SCOPE.md                # Scope definition
# ├── README.md               # Complete README
# ├── .gitignore              # Stack-specific ignore rules
# ├── src/                    # Source code directory
# ├── tests/                  # Test suites (unit, integration, e2e)
# ├── docs/                   # Documentation
# ├── scripts/                # Automation scripts
# ├── .vscode/                # VS Code configuration
# └── .github/workflows/      # CI/CD pipeline
```

### **2. Claude.ai Integration**

```powershell
# Generate Claude prompt templates
Invoke-ClaudePrompt -Type standup -ProjectName "MyAPI"
Invoke-ClaudePrompt -Type review
Invoke-ClaudePrompt -Type cheapname-db
Invoke-ClaudePrompt -Type cheapname-deploy
# Alias: hclaude

# Available prompts:
# - standup: Daily standup template
# - review: Code review request
# - arch: Architecture review
# - debug: Debugging session
# - deploy: Deployment validation
# - cheapname-db: Database design for Cheapname
# - cheapname-deploy: Cheapname deployment validation
# - cheapname-perf: Performance optimization for Cheapname
```

**Templates copied to clipboard automatically!** Just paste into Claude.ai.

### **3. Automated Testing**

```powershell
# Run comprehensive test suite
Test-HammurabiProject -Type all
# Alias: htest

# Run specific test types
Test-HammurabiProject -Type unit
Test-HammurabiProject -Type coverage
Test-HammurabiProject -Type security
Test-HammurabiProject -Type performance

# Enforces Code of Hammurabi standards:
# - Production: 90%+ coverage
# - Internal Tools: 70%+ coverage
# - MVPs: 50%+ coverage
# - Performance: <200ms P95
# - Security: 0 critical CVEs
```

### **4. Cheapname Deployment**

```powershell
# Deploy to Cheapname
Invoke-HammurabiDeploy -Environment production
# Alias: hdeploy

# Automated workflow:
# 1. Pre-deployment validation (tests, coverage, git status)
# 2. Git push to repository
# 3. SSH to Cheapname
# 4. Pull latest code
# 5. Install dependencies
# 6. Run database migrations
# 7. Restart application
# 8. Health check
# 9. Rollback on failure
```

### **5. Quality Enforcement**

All projects enforce **The Code of Hammurabi**:

- ✅ **Clarity**: Self-documenting code, meaningful names
- ✅ **Testing**: Tiered coverage requirements
- ✅ **Security**: Automated scanning, vulnerability patching
- ✅ **Performance**: <200ms P95 target
- ✅ **Documentation**: Complete and current
- ✅ **Simplicity**: Merchant-understandable architecture
- ✅ **Ownership**: Collective code ownership

---

## **FRAMEWORK PHILOSOPHY**

### **The Seven Tiers of Hammurabi's Ziggurat**

Like the ancient ziggurat of Babylon, our framework is built in seven tiers:

```
        /\
       /  \    Tier 7: Observability (Enlightenment)
      /    \   
     /      \  Tier 6: Security (Protection)
    /        \
   /          \ Tier 5: Frontend (Presentation)
  /            \
 /   Tier 4:    \ API Layer (Communication)
/______________\
/\          /\
/  \        /  \  Tier 3: Business Logic (Processing)
/    \      /    \
/      \    /      \ Tier 2: Data Layer (Persistence)
/________\/__________\
/\                  /\
/  \                /  \ Tier 1: Infrastructure (Foundation)
/____\______________/____\
```

### **Core Principles**

1. **Digital Sovereignty**: Own your infrastructure, control your data
2. **Offline-First**: Function without constant internet connectivity
3. **Lifetime Licensing**: Pay once, use forever (no subscriptions)
4. **Windows-Native**: PowerShell, VS Code, Windows 11 optimized
5. **Solo-Optimized**: No team overhead, async-first, automation-heavy
6. **Cheapname-Targeted**: Budget-conscious hosting, shared hosting constraints
7. **Code of Hammurabi**: Quality standards enforced automatically

---

## **PROJECT WORKFLOW**

### **Phase 1: Intake & Project Initialization**

```powershell
# Create project
New-HammurabiProject -Name "MyApp" -Type "API" -Stack "Python"

# Fill out intake documents
code PROJECT_INTAKE.md
code SCOPE.md

# Define success criteria:
# - Functionality: 3-5 core features
# - Performance: <200ms P95
# - Reliability: 99.5% uptime
# - Cost: $10/month budget
# - Timeline: 2-4 weeks
```

### **Phase 2: Environment Setup**

```powershell
# Run setup script
.\scripts\setup.ps1

# Creates:
# - Python virtual environment
# - Installs dependencies
# - Configures git hooks
# - Sets up pre-commit checks
```

### **Phase 3: Research & Architecture**

```powershell
# Generate architecture review prompt
Invoke-ClaudePrompt -Type arch -ProjectName "MyApp"

# Paste into Claude.ai
# Get architectural validation
# Document decisions in docs/ARCHITECTURE.md
```

### **Phase 4: Solo Development Workflow**

```powershell
# Daily standup
Invoke-ClaudePrompt -Type standup -ProjectName "MyApp"

# Code in 90-min focused blocks
# Write tests first (TDD)
# Commit every 15-20 minutes

git checkout -b feature/auth-system
# ... code ...
git add src/auth.py tests/test_auth.py
git commit -m "feat(auth): Add JWT token validation

- Added JWTBearer dependency
- Validates token signature and expiry
- Returns 401 on invalid token
- Tests: test_auth.py::test_invalid_token PASS"

# Request code review from Claude
Invoke-ClaudePrompt -Type review
# Paste code into Claude
# Implement feedback
```

### **Phase 5: Testing & Validation**

```powershell
# Run comprehensive test suite
Test-HammurabiProject -Type all

# Check coverage
Test-HammurabiProject -Type coverage

# Security scan
Test-HammurabiProject -Type security

# Generate validation report
# Review against Code of Hammurabi standards
# Sign off for production
```

### **Phase 6: Deployment to Cheapname**

```powershell
# Validate deployment readiness
Invoke-ClaudePrompt -Type cheapname-deploy
# Paste deployment script
# Get Claude's validation

# Deploy to production
Invoke-HammurabiDeploy -Environment production

# Monitor health check
# Verify live URL
# Archive project as successful
```

---

## **CHEAPNAME-SPECIFIC FEATURES**

The framework is optimized for **Cheapname shared hosting**:

### **Deployment Constraints**

- ✅ No Docker support → Uses SSH + cPanel
- ✅ Python 3.11 via cPanel Python Selector
- ✅ MySQL 5.7 (included with hosting)
- ✅ SSH access for deployments
- ✅ No systemd → Uses `touch passenger_wsgi.py` restart
- ✅ Budget-conscious: $10/month total cost

### **Database Design**

```powershell
# Generate Cheapname-specific database review
Invoke-ClaudePrompt -Type cheapname-db -ProjectName "MyApp"

# Validates:
# - MySQL 5.7 compatibility
# - Shared hosting resource limits
# - Index optimization for shared CPU
# - Connection pool constraints (~100 max)
```

### **Performance Optimization**

```powershell
# Generate Cheapname performance review
Invoke-ClaudePrompt -Type cheapname-perf -ProjectName "MyApp"

# Optimizes for:
# - Limited shared hosting resources
# - No Redis budget
# - In-memory caching strategies
# - Query optimization for MySQL 5.7
# - <200ms P95 target
```

---

## **CONFIGURATION**

### **Global Configuration**

Located at: `C:\HammurabiDev\config.json`

```json
{
  "version": "2.0.0",
  "developer": {
    "name": "R.K. Girdhari",
    "company": "Hammurabi Coding Company",
    "location": "Eau Claire, Wisconsin"
  },
  "hosting": {
    "provider": "Cheapname",
    "type": "Shared Hosting",
    "sshHost": "ssh.cheapname.com",
    "sshUser": "your-username"
  },
  "standards": {
    "testCoverageProduction": 90,
    "testCoverageInternal": 70,
    "testCoverageMVP": 50,
    "performanceTarget": 200
  },
  "tools": {
    "editor": "VS Code",
    "shell": "PowerShell 7+",
    "vcs": "Git",
    "ai": "Claude.ai"
  }
}
```

### **Per-Project Configuration**

Each project has:
- `PROJECT_INTAKE.md`: Project definition
- `SCOPE.md`: Scope boundaries
- `.env.example`: Environment variables template
- `.vscode/settings.json`: VS Code workspace config

---

## **COST TRACKING**

### **Claude.ai Token Management**

The framework helps you track Claude usage:

```powershell
# Track Claude spending per project
Invoke-ClaudePrompt -Type help

# Expected costs per project:
# Phase 1 Intake:        ~5,000 tokens  → $0.015
# Phase 2 Environment:   ~8,000 tokens  → $0.024
# Phase 3 Architecture:  ~15,000 tokens → $0.045
# Phase 4 Development:   ~45,000 tokens → $0.135
# Phase 5 Testing:       ~20,000 tokens → $0.060
# Phase 6 Deployment:    ~12,000 tokens → $0.036
# ─────────────────────────────────────────────
# TOTAL:                 ~105,000 tokens → $0.315 per project
```

**Budget**: ~$1.00/month for 3 projects

---

## **ADVANCED USAGE**

### **Custom Project Templates**

Create your own project templates in `C:\HammurabiDev\Templates\`:

```powershell
# Create custom template
New-Item -ItemType Directory -Path "C:\HammurabiDev\Templates\MyStack"

# Add template files
# - PROJECT_INTAKE.template.md
# - SCOPE.template.md
# - src/
# - tests/
# - scripts/

# Use custom template
New-HammurabiProject -Name "MyApp" -Template "MyStack"
```

### **Multi-Environment Deployments**

```powershell
# Deploy to staging
Invoke-HammurabiDeploy -Environment staging

# Test in staging
# Verify functionality

# Deploy to production
Invoke-HammurabiDeploy -Environment production

# Rollback if needed
# (backup created automatically during deployment)
```

### **Automated Quality Checks**

```powershell
# Run pre-commit quality checks
.\scripts\quality.ps1

# Checks:
# - Linting (pylint, flake8)
# - Type checking (mypy)
# - Security scanning (bandit)
# - Test coverage (pytest-cov)
# - Code formatting (black, isort)
```

---

## **TROUBLESHOOTING**

### **Framework Not Loading**

```powershell
# Verify module path
Get-Module -ListAvailable | Where-Object { $_.Name -eq "HammurabiDev" }

# Manually import
Import-Module C:\HammurabiDevFramework\Modules\HammurabiDev.psm1 -Force

# Check PowerShell profile
notepad $PROFILE
```

### **Deployment Failing**

```powershell
# Verify Cheapname SSH connection
ssh -l your-username ssh.cheapname.com

# Test deployment script manually
.\scripts\deploy.ps1 -Environment staging -DryRun

# Check deployment logs
# Located in: C:\HammurabiDev\Logs\deploy-YYYYMMDD.log
```

### **Tests Failing**

```powershell
# Run tests with verbose output
pytest tests/ -v --tb=long

# Check coverage report
pytest tests/ --cov=src --cov-report=html
# Open: htmlcov/index.html

# Run specific test
pytest tests/unit/test_auth.py::test_login_success -v
```

---

## **CONTRIBUTING**

The Hammurabi Framework is open-source and contributions are welcome!

### **Code of Hammurabi Compliance**

All contributions must follow **The Code of Hammurabi**:

1. **Clarity**: Self-documenting code
2. **Testing**: 90%+ coverage for core modules
3. **Security**: No vulnerabilities introduced
4. **Performance**: <200ms P95
5. **Documentation**: Complete inline docs

### **Pull Request Process**

1. Fork repository
2. Create feature branch: `git checkout -b feature/name`
3. Write tests first (TDD)
4. Implement feature
5. Run quality checks: `.\scripts\quality.ps1`
6. Submit PR with:
   - Clear description
   - Test coverage report
   - Documentation updates

---

## **DOCUMENTATION**

- [Installation Guide](INSTALL.md)
- [Quick Start Guide](QUICKSTART.md)
- [The Code of Hammurabi](CODE_OF_HAMMURABI.md)
- [Solo Developer Framework v2.0](SOLO_DEVELOPER_FRAMEWORK.md)
- [Hammurabi's Style v2.1 (Claude.ai)](HAMMURABI_STYLE.md)
- [Cheapname Deployment Guide](CHEAPNAME_DEPLOYMENT.md)
- [API Reference](API_REFERENCE.md)
- [FAQ](FAQ.md)

---

## **SUPPORT**

- **GitHub Issues**: [Report bugs](https://github.com/hammurabi-coding/hammurabi-framework/issues)
- **Discussions**: [Ask questions](https://github.com/hammurabi-coding/hammurabi-framework/discussions)
- **Email**: support@hammurabi-coding.com

---

## **LICENSE**

**Lifetime License** - MIT

Copyright (c) 2026 Hammurabi Coding Company

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---

## **ACKNOWLEDGMENTS**

Built with:
- PowerShell 7+
- Visual Studio Code
- Claude.ai (Anthropic)
- The wisdom of ancient Babylon

Inspired by:
- **The Code of Hammurabi** (1750 BC)
- Digital sovereignty movement
- Solo developer philosophy
- Lifetime licensing principles

---

**🏛️ "Write code that future generations will thank you for" 🏛️**

*— Hammurabi Coding Company*
