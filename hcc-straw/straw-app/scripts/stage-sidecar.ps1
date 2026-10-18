param([switch]$Release)
$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$cargoExe = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'
$buildArguments = @('build','--offline','--locked','-p','straw-inference','--features','worker','--bin','straw-infer')
$profileName = 'debug'
if ($Release) { $buildArguments += '--release'; $profileName = 'release' }
Push-Location $appRoot
try {
    & $cargoExe @buildArguments
    if ($LASTEXITCODE -ne 0) { throw 'Sidecar build failed.' }
    $rustcExe = Join-Path $env:USERPROFILE '.cargo\bin\rustc.exe'
    $hostLine = & $rustcExe -vV | Select-String '^host: '
    $hostTriple = $hostLine.ToString().Substring(6)
    $exeSuffix = if ($hostTriple -match 'windows') { '.exe' } else { '' }
    $binaryRoot = Join-Path $appRoot 'src-tauri\binaries'
    New-Item -ItemType Directory -Force -Path $binaryRoot | Out-Null
    $sourceBinary = Join-Path $appRoot "target\$profileName\straw-infer$exeSuffix"
    Copy-Item -LiteralPath $sourceBinary -Destination (Join-Path $binaryRoot "straw-infer-$hostTriple$exeSuffix") -Force
    # In development the supervisor resolves beside the application executable.
    if ($profileName -ne 'debug') { Copy-Item -LiteralPath $sourceBinary -Destination (Join-Path $appRoot "target\debug\straw-infer$exeSuffix") -Force }
    Write-Output "Staged sidecar for $hostTriple."
} finally { Pop-Location }
