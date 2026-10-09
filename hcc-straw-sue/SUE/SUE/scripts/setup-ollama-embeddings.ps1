param(
    [string]$EmbedModel = "mxbai-embed-small-v1",
    [switch]$Run
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    function Write-Step([string]$Message) { Write-Host "[STEP] $Message" -ForegroundColor Cyan }
}
if (-not (Get-Command Write-Info -ErrorAction SilentlyContinue)) {
    function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Gray }
}
if (-not (Get-Command Write-Success -ErrorAction SilentlyContinue)) {
    function Write-Success([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
}

function Setup-Ollama-Embeddings {
    param([string]$Model = "mxbai-embed-small-v1")

    Write-Step "Setting up Minimal Embedding Models"

    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Error "Ollama CLI not found. Install Ollama first: https://ollama.com/download"
        return $false
    }

    try {
        Write-Info "Pulling embedding model: $Model"
        $pullResult = & ollama pull $Model 2>&1

        if ($LASTEXITCODE -ne 0 -and ($pullResult -notmatch "already exists|already installed")) {
            Write-Warning "Embedding model pull failed: $pullResult"
            return $false
        }

        Write-Success "Embedding model ready: $Model"
        Write-Info "Testing embedding generation..."

        $testBody = @{
            model = $Model
            input = "test"
        } | ConvertTo-Json -Depth 5

        $resp = Invoke-RestMethod `
            -Uri "http://localhost:11434/api/embed" `
            -Method Post `
            -ContentType "application/json" `
            -Body $testBody

        if ($resp.embeddings -and $resp.embeddings.Count -gt 0) {
            Write-Success "Embedding API confirmed working"

            $vectorDimension = 0
            if ($resp.embeddings[0] -is [System.Array]) {
                $vectorDimension = $resp.embeddings[0].Count
            }
            elseif ($resp.embeddings -is [System.Array]) {
                $vectorDimension = $resp.embeddings.Count
            }

            if ($vectorDimension -gt 0) {
                Write-Info "Embedding dimension: $vectorDimension"
            }
            else {
                Write-Warning "Could not infer embedding dimension from API response."
            }

            return $true
        }

        Write-Warning "Embedding API returned no embeddings"
        return $false
    }
    catch {
        Write-Error "Failed to setup embeddings: $_"
        return $false
    }
}

if ($Run) {
    $ok = Setup-Ollama-Embeddings -Model $EmbedModel
    if (-not $ok) {
        exit 1
    }
}
