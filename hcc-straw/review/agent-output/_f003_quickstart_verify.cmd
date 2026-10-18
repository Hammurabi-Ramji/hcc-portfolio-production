@echo off
setlocal EnableExtensions
cd /d "C:\IEDB\STRAW Stack\apps\web" || exit /b 91
echo === package scripts ===
node -e "const p=require('./package.json'); const s=Object.keys(p.scripts).sort(); console.log(s.join(',')); if(s.indexOf('format')!==-1) process.exit(2); if(!['dev','build','start','lint','type-check'].every(k=>s.indexOf(k)!==-1)) process.exit(5);"
if errorlevel 1 exit /b %ERRORLEVEL%
echo === env template ===
findstr /C:"NEXT_PUBLIC_APP_URL=http://localhost:3000" .env.example || exit /b 6
findstr /C:"STRAW_API_PORT=3001" .env.example || exit /b 7
findstr /C:"STRAW_WEB_ORIGIN=http://localhost:3000" .env.example || exit /b 8
echo === config consumer ===
findstr /C:"NEXT_PUBLIC_APP_URL" utils\config.ts || exit /b 9
echo === no stale apps/.env.example path in quick start/readme ===
findstr /C:"apps/.env.example" QUICK_START.md README.md >nul && exit /b 3
echo === format not listed as an available script block item ===
findstr /R /C:"^npm run format" QUICK_START.md README.md >nul && exit /b 4
echo QUICKSTART_VERIFY_OK
exit /b 0
