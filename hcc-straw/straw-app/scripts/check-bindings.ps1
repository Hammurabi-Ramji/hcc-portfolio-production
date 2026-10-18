$ErrorActionPreference = 'Stop'
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$scratch = Join-Path $appRoot ('target\binding-check-' + [guid]::NewGuid().ToString('N'))
Push-Location $appRoot
try {
    & (Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe') run --offline --locked -p straw-stack --bin bindings -- $scratch
    if ($LASTEXITCODE -ne 0) { throw 'Binding export failed.' }
    foreach ($name in @('bindings.ts','bindings.js')) {
        $expected = Get-Content -Raw -LiteralPath (Join-Path $appRoot "ui\$name")
        $actual = Get-Content -Raw -LiteralPath (Join-Path $scratch $name)
        if ($expected -cne $actual) { throw "Contract drift in $name. Run cargo run -p straw-stack --bin bindings." }
    }
    Write-Output 'Specta bindings match the command registry.'
} finally { Pop-Location }
