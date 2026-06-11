@echo off
setlocal enabledelayedexpansion

REM SUE Ecosystem v5.0.0 - Build Script
REM This script creates the Windows executable installer

title SUE Ecosystem Installer Builder

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   SUE ECOSYSTEM v5.0.0 - INSTALLER BUILDER                ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found

REM Check pnpm
echo Checking pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  pnpm not found. Installing globally...
    call npm install -g pnpm
)
echo ✅ pnpm found

REM Check pkg
echo Checking pkg (executable builder)...
pnpm list -g pkg >nul 2>&1
if errorlevel 1 (
    echo Installing pkg globally...
    call npm install -g pkg
)
echo ✅ pkg found

REM Navigate to installer directory
cd /d "%~dp0installer"

REM Install installer dependencies
echo.
echo Installing installer dependencies...
call pnpm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Installer dependencies installed

REM Build executable
echo.
echo Building executable (SUE-Ecosystem-v5.0.0.exe)...
echo This may take 2-3 minutes...
echo.

call pnpm run build

if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              ✅ BUILD SUCCESSFUL!                          ║
echo ║                                                            ║
echo ║   Executable: ..\release\SUE-Ecosystem-v5.0.0.exe         ║
echo ║                                                            ║
echo ║   Next steps:                                              ║
echo ║   1. Distribute SUE-Ecosystem-v5.0.0.exe to users         ║
echo ║   2. Users run the executable                             ║
echo ║   3. Follow installation wizard                           ║
echo ║   4. Start services with docker-compose                  ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
pause
