@echo off
setlocal enabledelayedexpansion

title OpenClaw HCC Integration - Uninstall

echo.
echo ========================================================
echo OpenClaw HCC Integration - Uninstall
echo ========================================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run as Administrator
    pause
    exit /b 1
)

set "INSTALL_DIR=%ProgramFiles%\OpenClaw"

echo Uninstalling from: !INSTALL_DIR!
echo.

REM Remove from PATH
echo Removing from PATH...
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH ^| findstr /i path') do set "OLD_PATH=%%b"
if not "!OLD_PATH!"=="" (
    set "NEW_PATH=!OLD_PATH:!INSTALL_DIR!=!"
    set "NEW_PATH=!NEW_PATH:;;=;!"
    reg add "HKCU\Environment" /v PATH /t REG_EXPAND_SZ /d "!NEW_PATH!" /f >nul
)

REM Remove shortcuts
echo Removing shortcuts...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\OpenClaw" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\OpenClaw"
)
if exist "%USERPROFILE%\Desktop\OpenClaw.lnk" (
    del /q "%USERPROFILE%\Desktop\OpenClaw.lnk"
)

REM Remove installation directory
if exist "!INSTALL_DIR!" (
    echo Removing files...
    rmdir /s /q "!INSTALL_DIR!"
)

REM Remove registry entries
echo Cleaning up registry...
reg delete "HKCU\Software\OpenClaw" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenClaw" /f >nul 2>&1

echo.
echo ✓ Uninstall complete!
echo.
pause
