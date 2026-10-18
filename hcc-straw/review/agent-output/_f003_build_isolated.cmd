@echo off
setlocal
set NEXT_TELEMETRY_DISABLED=1
set npm_config_offline=true
set NEXT_DIST_DIR=.next-f003
cd /d "C:\IEDB\STRAW Stack\apps\web" || exit /b 91
if exist .next-f003 rmdir /s /q .next-f003
call npm.cmd run build
echo BUILD_EXIT=%ERRORLEVEL%
exit /b %ERRORLEVEL%
