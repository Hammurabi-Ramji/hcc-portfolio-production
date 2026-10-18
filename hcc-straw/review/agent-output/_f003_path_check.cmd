@echo off
echo STRAW=%CD%
fsutil reparsepoint query "C:\IEDB\STRAW Stack" 2>nul
fsutil reparsepoint query "C:\IEDB\external\BSM-C\hcc-straw\hcc-straw" 2>nul
dir "C:\IEDB\STRAW Stack\apps\web\package.json"
dir "C:\IEDB\external\BSM-C\hcc-straw\hcc-straw\apps\web\package.json"
fc /b "C:\IEDB\STRAW Stack\apps\web\package.json" "C:\IEDB\external\BSM-C\hcc-straw\hcc-straw\apps\web\package.json"
