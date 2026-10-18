@echo off
setlocal
set CARGO=%USERPROFILE%\.cargo\bin\cargo.exe
cd /d "C:\IEDB\STRAW Stack\apps\api" || exit /b 91
"%CARGO%" test --offline --locked --test auth_http -- --nocapture
echo AUTH_TEST_EXIT=%ERRORLEVEL%
exit /b %ERRORLEVEL%
