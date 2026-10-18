$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$env:PATH = (Join-Path $env:USERPROFILE '.cargo\bin') + ';' + $env:PATH
# Trunk 0.21.14 accepts only true/false for NO_COLOR (not the numeric string 1).
if ($env:NO_COLOR -eq '1') { $env:NO_COLOR = 'true' }
if (-not $env:NO_COLOR) { $env:NO_COLOR = 'true' }
Push-Location $appRoot
try {
    & (Join-Path $PSScriptRoot 'stage-sidecar.ps1') -Release
    & (Join-Path $PSScriptRoot 'stage-runtime-pack.ps1')
    # Keep desktop packaging separate from concurrent browser builds in dist.
    # Offline release WASM matches the packaged desktop profile (arbitration).
    & trunk build --offline --release --dist desktop-dist
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
} finally { Pop-Location }
