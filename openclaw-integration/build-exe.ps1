# OpenClaw HCC Integration - Build Script for Windows EXE

Write-Host "🔨 Building OpenClaw HCC Integration..." -ForegroundColor Cyan
Write-Host ""

# Create dist directory
if (!(Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" -Force | Out-Null
    Write-Host "✓ Created dist directory" -ForegroundColor Green
}

# Build Windows executable
Write-Host ""
Write-Host "Building Windows executable..." -ForegroundColor Yellow
pkg bin/openclaw.js `
    --targets win-x64 `
    --output dist/openclaw.exe `
    --compress Brotli

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Windows EXE created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

# Copy required files
Write-Host ""
Write-Host "Copying configuration files..." -ForegroundColor Yellow
Copy-Item -Path ".env" -Destination "dist/.env" -Force
Copy-Item -Path "*.md" -Destination "dist/" -Force

# Create data and logs directories
New-Item -ItemType Directory -Path "dist/data" -Force | Out-Null
New-Item -ItemType Directory -Path "dist/logs" -Force | Out-Null
Write-Host "✓ Created data and logs directories" -ForegroundColor Green

# Create README for distribution
$readmeContent = @"
# OpenClaw HCC Integration - Windows Package

## Quick Start

1. Extract this folder
2. Edit `.env` with your API credentials:
   - HCC_FDA_API_URL
   - HCC_FDA_TOKEN
   - HCC_MANTLE_API_URL
   - HCC_MANTLE_TOKEN
   - HCC_PHARMA_API_URL
   - HCC_PHARMA_TOKEN

3. Run the application:
   ```
   openclaw.exe health
   openclaw.exe fda
   openclaw.exe schedule
   ```

## Available Commands

- `health` - Check system health
- `fda` - Run FDA monitoring
- `mantle` - Run Mantle sync
- `pharma` - Run Pharma monitoring
- `test` - Run test suite
- `schedule` - Start scheduled jobs
- `status` - Show job status
- `logs` - View log files
- `help` - Show help

## Documentation

See README.md for complete documentation.

## Troubleshooting

Check `logs/` directory for detailed error messages.
"@

Set-Content -Path "dist/PACKAGE-README.txt" -Value $readmeContent
Write-Host "✓ Created package README" -ForegroundColor Green

# Create installer batch file
$installerContent = @"
@echo off
setlocal enabledelayedexpansion

echo.
echo OpenClaw HCC Integration - Installation
echo.

REM Check if admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This installer must be run as Administrator.
    pause
    exit /b 1
)

REM Set installation directory
if "%1"=="" (
    set "INSTALL_DIR=%ProgramFiles%\OpenClaw"
) else (
    set "INSTALL_DIR=%1"
)

echo Installing to: !INSTALL_DIR!
echo.

REM Create installation directory
if not exist "!INSTALL_DIR!" mkdir "!INSTALL_DIR!"

REM Copy files
echo Copying files...
xcopy /E /I /Y "." "!INSTALL_DIR!" >nul

REM Add to PATH
echo Adding to PATH...
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH ^| findstr /i path') do set "OLD_PATH=%%b"
if "%OLD_PATH%"=="" (
    set "NEW_PATH=!INSTALL_DIR!"
) else (
    set "NEW_PATH=!INSTALL_DIR!;!OLD_PATH!"
)
reg add "HKCU\Environment" /v PATH /t REG_EXPAND_SZ /d "!NEW_PATH!" /f >nul

REM Create desktop shortcut
echo Creating shortcuts...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\OpenClaw.lnk'); $Shortcut.TargetPath = '!INSTALL_DIR!\openclaw.exe'; $Shortcut.WorkingDirectory = '!INSTALL_DIR!'; $Shortcut.Save()"

echo.
echo ✓ Installation complete!
echo.
echo Next steps:
echo 1. Edit !INSTALL_DIR!\.env with your API credentials
echo 2. Run: openclaw health
echo 3. Run: openclaw schedule (to start automated jobs)
echo.
pause
"@

Set-Content -Path "dist/INSTALL.bat" -Value $installerContent -Encoding ASCII
Write-Host "✓ Created installer script" -ForegroundColor Green

# Create startup shortcut for Windows
$shortcutContent = @"
[InternetShortcut]
URL=file:///
"@

Write-Host ""
Write-Host "=".PadRight(50, "=") -ForegroundColor Cyan
Write-Host "✓ Build Complete!" -ForegroundColor Green
Write-Host "=".PadRight(50, "=") -ForegroundColor Cyan
Write-Host ""
Write-Host "Distribution package created in: dist/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files included:" -ForegroundColor Cyan
Write-Host "  - openclaw.exe         (Main application)"
Write-Host "  - .env                 (Configuration template)"
Write-Host "  - *.md                 (Documentation)"
Write-Host "  - data/                (Data storage)"
Write-Host "  - logs/                (Application logs)"
Write-Host "  - INSTALL.bat          (Windows installer)"
Write-Host "  - PACKAGE-README.txt   (Quick start guide)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Zip dist/ folder for distribution"
Write-Host "  2. Users run INSTALL.bat to install"
Write-Host "  3. Edit .env with API credentials"
Write-Host "  4. Run: openclaw health"
Write-Host ""
