@echo off
setlocal enabledelayedexpansion

title OpenClaw HCC Integration - Build & Package

echo.
echo ========================================================
echo OpenClaw HCC Integration - Build Script
echo ========================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Please run Command Prompt as Administrator and try again.
    pause
    exit /b 1
)

REM Create output directory
if not exist "dist" mkdir dist
if not exist "build" mkdir build

echo [1/5] Building standalone executable...
REM Using nexe for simpler Node.js executable bundling
REM Install: npm install -g nexe
nexe bin/openclaw.js -o dist/openclaw.exe -t win-x64 -r "integrations/**/*" -r "data/**/*" -r ".env" -r "*.md"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to build executable
    echo Installing required tools...
    npm install -g nexe
    echo Retrying build...
    nexe bin/openclaw.js -o dist/openclaw.exe -t win-x64
    
    if %errorlevel% neq 0 (
        echo FATAL: Build failed. Exiting.
        pause
        exit /b 1
    )
)

echo [2/5] Copying documentation...
copy README.md dist/README.md >nul
copy QUICK_REFERENCE.md dist/QUICK_REFERENCE.md >nul
copy COMPLETION_REPORT.md dist/COMPLETION_REPORT.md >nul
copy AUDIT_AND_FIXES_REPORT.md dist/AUDIT_AND_FIXES_REPORT.md >nul
copy FIXES_SUMMARY.md dist/FIXES_SUMMARY.md >nul
copy .env dist/.env.template >nul
echo ✓ Documentation copied

echo [3/5] Creating data and logs directories...
if not exist "dist\data" mkdir dist\data
if not exist "dist\logs" mkdir dist\logs
echo ✓ Directories created

echo [4/5] Creating installer batch file...
(
    echo @echo off
    echo setlocal enabledelayedexpansion
    echo echo.
    echo echo OpenClaw HCC Integration - Installation
    echo echo.
    echo.
    echo REM Check for admin rights
    echo net session ^>nul 2^>^&1
    echo if %%errorlevel%% neq 0 ^(
    echo     echo ERROR: Please run as Administrator
    echo     pause
    echo     exit /b 1
    echo ^)
    echo.
    echo if "%%1"=="" ^(
    echo     set "INSTALL_DIR=%%ProgramFiles%%\OpenClaw"
    echo ^) else ^(
    echo     set "INSTALL_DIR=%%1"
    echo ^)
    echo.
    echo echo Installing to: !INSTALL_DIR!
    echo if not exist "!INSTALL_DIR!" mkdir "!INSTALL_DIR!"
    echo.
    echo echo Copying files...
    echo xcopy /E /I /Y "." "!INSTALL_DIR!" ^>nul
    echo.
    echo echo Adding to PATH...
    echo setx PATH "!INSTALL_DIR!;%%PATH%%" >nul
    echo.
    echo echo Creating shortcuts...
    echo powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%%USERPROFILE%%\Desktop\OpenClaw.lnk'); $Shortcut.TargetPath = '!INSTALL_DIR!\openclaw.exe'; $Shortcut.Save()" 2^>nul
    echo.
    echo echo.
    echo echo Installation complete!
    echo echo.
    echo echo Next steps:
    echo echo 1. Edit the .env file with your API credentials
    echo echo 2. Run: openclaw health
    echo echo 3. Run: openclaw schedule
    echo echo.
    echo pause
) > dist\INSTALL.bat
echo ✓ Installer created

echo [5/5] Creating README for package...
(
    echo # OpenClaw HCC Integration - Windows Distribution Package
    echo.
    echo ## Quick Start
    echo.
    echo 1. Extract this folder to your desired location
    echo 2. Right-click INSTALL.bat and select "Run as Administrator"
    echo 3. Edit .env.template with your API credentials
    echo 4. Rename .env.template to .env
    echo 5. Run: openclaw health
    echo.
    echo ## Commands
    echo.
    echo - openclaw health      - Check system health
    echo - openclaw fda         - Run FDA monitoring
    echo - openclaw mantle      - Run Mantle sync
    echo - openclaw pharma      - Run Pharma monitoring
    echo - openclaw schedule    - Start automated jobs
    echo - openclaw test        - Run tests
    echo - openclaw help        - Show help
    echo.
    echo ## Documentation
    echo.
    echo - README.md                      - Complete guide
    echo - QUICK_REFERENCE.md             - Quick start
    echo - COMPLETION_REPORT.md           - What was fixed
    echo - AUDIT_AND_FIXES_REPORT.md      - Technical details
    echo.
    echo ## Support
    echo.
    echo Check logs/ directory for detailed error messages.
    echo Review documentation for troubleshooting tips.
    echo.
) > dist\PACKAGE-README.txt
echo ✓ Package README created

echo.
echo ========================================================
echo Build Complete!
echo ========================================================
echo.
echo Distribution package created in: dist/
echo.
echo Files included:
echo   - openclaw.exe               (Main application^)
echo   - *.md                       (Documentation^)
echo   - .env.template              (Configuration template^)
echo   - INSTALL.bat                (Installation script^)
echo   - PACKAGE-README.txt         (Quick start guide^)
echo   - data/                      (Data directory^)
echo   - logs/                      (Logs directory^)
echo.
echo Next steps:
echo   1. Zip the dist/ folder for distribution
echo   2. Users extract and run INSTALL.bat
echo   3. Users edit .env with API credentials
echo   4. Users run: openclaw health
echo.
echo ========================================================
echo.
pause
