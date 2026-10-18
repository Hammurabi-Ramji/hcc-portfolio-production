# Radix App - Windows 11 Launcher

param([switch]$Debug)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RADIX APP - Enterprise ERP System                         ║" -ForegroundColor Cyan
Write-Host "║  Production Build - Windows 11                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Set-Location $scriptDir

try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "▶ Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "▶ Starting frontend application..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✓ Radix App launched successfully!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
