@echo off
setlocal
set NEXT_TELEMETRY_DISABLED=1
set npm_config_offline=true
cd /d "C:\IEDB\STRAW Stack\apps\web" || exit /b 91
if exist .next rmdir /s /q .next
call npm.cmd run type-check
echo TYPECHECK_EXIT=%ERRORLEVEL%
if errorlevel 1 exit /b %ERRORLEVEL%
call npm.cmd run lint
echo LINT_EXIT=%ERRORLEVEL%
if errorlevel 1 exit /b %ERRORLEVEL%
call npm.cmd run build
echo BUILD_EXIT=%ERRORLEVEL%
exit /b %ERRORLEVEL%
