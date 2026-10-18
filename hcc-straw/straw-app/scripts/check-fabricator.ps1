$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'file-hash.ps1')
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = Join-Path $appRoot ('target\fabricator-check-' + [guid]::NewGuid().ToString('N'))
# A generated workspace has packages with the same names as the source tree.
# Sharing its target directory can reuse another workspace's test executable.
# Give each verification its own artifacts so copied sources are compiled.
$isolatedTarget = Join-Path $appRoot ('target\fabricator-build-' + [guid]::NewGuid().ToString('N'))
$cargoExe = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'
Push-Location $appRoot
try {
    & $cargoExe run --offline --locked -p straw-fabricator -- generate education_saas $outputRoot
    if ($LASTEXITCODE -ne 0) { throw 'Fabricator generation failed.' }
    $manifest = Get-Content -Raw -LiteralPath (Join-Path $outputRoot 'manifest.json') | ConvertFrom-Json
    foreach ($entry in $manifest.files) {
        $actual = Get-StrawFileHash -LiteralPath (Join-Path $outputRoot $entry.path)
        if ($actual -cne $entry.sha256) { throw "Generated provenance mismatch: $($entry.path)" }
    }
    & $cargoExe test --workspace --offline --manifest-path (Join-Path $outputRoot 'Cargo.toml') --target-dir $isolatedTarget
    if ($LASTEXITCODE -ne 0) { throw 'Generated standalone core checks failed.' }
    & $cargoExe check --offline --locked --manifest-path (Join-Path $outputRoot 'Cargo.toml') --target-dir $isolatedTarget -p sovereign-app
    if ($LASTEXITCODE -ne 0) { throw 'Generated service compilation failed.' }
    Write-Output "Generated provenance and standalone service verified: $outputRoot"
} finally { Pop-Location }
