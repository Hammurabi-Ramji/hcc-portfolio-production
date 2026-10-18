$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'file-hash.ps1')
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$packRoot = Join-Path $appRoot 'src-tauri\resources\models\svelte-coder'
$runtimePack = Join-Path $appRoot 'target\release\models\svelte-coder'
$manifest = Get-Content -Raw -LiteralPath (Join-Path $packRoot 'manifest.json') | ConvertFrom-Json
foreach ($entry in @(@($manifest.gguf,$manifest.ggufSha256),@($manifest.tokenizer,$manifest.tokenizerSha256))) {
    $actual = Get-StrawFileHash -LiteralPath (Join-Path $packRoot $entry[0])
    if ($actual -cne $entry[1]) { throw "Pack integrity mismatch: $($entry[0])" }
}
New-Item -ItemType Directory -Force -Path $runtimePack | Out-Null
foreach ($entry in @(@($manifest.gguf,$manifest.ggufSha256),@($manifest.tokenizer,$manifest.tokenizerSha256))) {
    Copy-StrawFile -Source (Join-Path $packRoot $entry[0]) -Destination (Join-Path $runtimePack $entry[0]) -ExpectedSha256 $entry[1]
}
foreach ($name in @('manifest.json','NOTICE.md','LICENSE','LICENSE-APACHE')) {
    Copy-StrawFile -Source (Join-Path $packRoot $name) -Destination (Join-Path $runtimePack $name)
}
Write-Output 'Staged verified runtime pack for the unbundled Windows executable.'
