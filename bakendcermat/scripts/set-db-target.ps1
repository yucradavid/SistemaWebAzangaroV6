param(
    [ValidateSet("local", "supabase")]
    [string]$Target
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envPath = Join-Path $projectRoot ".env"

if (-not (Test-Path $envPath)) {
    throw "No se encontro el archivo .env en $projectRoot"
}

$lines = Get-Content $envPath
$targetLine = "DB_TARGET=$Target"
$updated = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^DB_TARGET=') {
        $lines[$i] = $targetLine
        $updated = $true
        break
    }
}

if (-not $updated) {
    $newLines = New-Object System.Collections.Generic.List[string]
    $newLines.AddRange([string[]]$lines)
    $newLines.Add($targetLine)
    $lines = $newLines
}

Set-Content -Path $envPath -Value $lines

Push-Location $projectRoot
try {
    php artisan config:clear
} finally {
    Pop-Location
}

Write-Host "Base activa cambiada a: $Target"
