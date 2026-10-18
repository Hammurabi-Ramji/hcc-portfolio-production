param([Parameter(Mandatory=$true)][string]$SourceDirectory)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'file-hash.ps1')
$appRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$destination = Join-Path $appRoot 'src-tauri\resources\models\svelte-coder'
$manifest = Get-Content -Raw -LiteralPath (Join-Path $destination 'manifest.json') | ConvertFrom-Json
$sourceRoot = (Resolve-Path -LiteralPath $SourceDirectory).Path
foreach ($entry in @(@($manifest.gguf,$manifest.ggufSha256),@($manifest.tokenizer,$manifest.tokenizerSha256))) {
    $sourcePath = Join-Path $sourceRoot $entry[0]
    $actualHash = Get-StrawFileHash -LiteralPath $sourcePath
    if ($actualHash -cne $entry[1]) { throw "Pack integrity mismatch: $($entry[0])" }
}
foreach ($entry in @(@($manifest.gguf,$manifest.ggufSha256),@($manifest.tokenizer,$manifest.tokenizerSha256))) {
    Copy-StrawFile -Source (Join-Path $sourceRoot $entry[0]) -Destination (Join-Path $destination $entry[0]) -ExpectedSha256 $entry[1]
}
Write-Output "Staged verified $($manifest.modelId) pack."
