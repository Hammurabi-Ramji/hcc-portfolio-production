function Get-StrawFileHash {
    param([Parameter(Mandatory=$true)][string]$LiteralPath)
    $stream = [IO.File]::OpenRead($LiteralPath)
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant()
    } finally { $sha.Dispose(); $stream.Dispose() }
}
function Copy-StrawFile {
    param([Parameter(Mandatory=$true)][string]$Source,
          [Parameter(Mandatory=$true)][string]$Destination,
          [string]$ExpectedSha256)
    if ([IO.Path]::GetFullPath($Source) -eq [IO.Path]::GetFullPath($Destination)) { return }
    if ($ExpectedSha256 -and [IO.File]::Exists($Destination)) {
        if ((Get-StrawFileHash -LiteralPath $Destination) -ceq $ExpectedSha256) { return }
    }
    # Stream large GGUF files with a fixed buffer instead of CopyFile's cache.
    $inputStream = [IO.File]::OpenRead($Source)
    try {
        $outputStream = [IO.File]::Open($Destination,[IO.FileMode]::Create,[IO.FileAccess]::Write,[IO.FileShare]::None)
        try { $inputStream.CopyTo($outputStream,1048576); $outputStream.Flush($true) }
        finally { $outputStream.Dispose() }
    } finally { $inputStream.Dispose() }
}
