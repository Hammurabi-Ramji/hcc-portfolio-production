$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$env:PATH = (Join-Path $env:USERPROFILE '.cargo\bin') + ';' + $env:PATH
# Trunk 0.21.14 accepts only true/false for NO_COLOR (not the numeric string 1).
if ($env:NO_COLOR -eq '1') { $env:NO_COLOR = 'true' }
if (-not $env:NO_COLOR) { $env:NO_COLOR = 'true' }
Push-Location $appRoot
try {
    & (Join-Path $PSScriptRoot 'stage-sidecar.ps1') -Release
    & trunk serve
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dev server failed.' }
} finally { Pop-Location }
