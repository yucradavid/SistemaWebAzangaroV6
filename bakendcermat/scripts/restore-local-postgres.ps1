param(
    [string]$Database = "bakendcermat_local",
    [string]$User = "postgres",
    [string]$DbHost = "127.0.0.1",
    [int]$Port = 5432,
    [string]$DumpFile = "",
    [switch]$Recreate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-PsqlPath {
    $command = Get-Command psql -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = @(Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter psql.exe -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '\\bin\\psql\.exe$' } |
        Sort-Object FullName -Descending)

    if ($candidates.Count -gt 0) {
        return $candidates[0].FullName
    }

    throw "No se encontro psql.exe. Instala PostgreSQL o agrega psql al PATH."
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dumpPath = if ([string]::IsNullOrWhiteSpace($DumpFile)) {
    (Join-Path $projectRoot "backup_utf8.sql")
} else {
    (Resolve-Path $DumpFile).Path
}

if (-not (Test-Path $dumpPath)) {
    throw "No se encontro el dump: $dumpPath"
}

$psql = Get-PsqlPath

$existsOutput = & $psql -U $User -h $DbHost -p $Port -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname = '$Database';"
$exists = if ($null -eq $existsOutput) { "" } else { ([string]$existsOutput).Trim() }
if ($exists -eq "1" -and -not $Recreate) {
    throw "La base $Database ya existe. Usa -Recreate para recrearla desde cero o cambia el nombre con -Database."
}

if ($exists -eq "1" -and $Recreate) {
    & $psql -U $User -h $DbHost -p $Port -d postgres -c "DROP DATABASE ""$Database"" WITH (FORCE);"
}

if ($exists -ne "1" -or $Recreate) {
    & $psql -U $User -h $DbHost -p $Port -d postgres -c "CREATE DATABASE ""$Database"";"
}

& $psql -U $User -h $DbHost -p $Port -d $Database -f $dumpPath
if ($LASTEXITCODE -ne 0) {
    throw "La restauracion del dump termino con codigo $LASTEXITCODE."
}

Push-Location $projectRoot
try {
    # El dump importa filas con ids explicitos (COPY/INSERT) sin avanzar las
    # secuencias serial/bigserial asociadas. Si no se corrige, la siguiente
    # migracion que inserte en una tabla con id serial (p.ej. "migrations")
    # puede chocar contra un id ya existente con UniqueConstraintViolationException.
    php artisan db:fix-sequences
    php artisan migrate --force
    php artisan config:clear
} finally {
    Pop-Location
}

Write-Host "Base local restaurada y migraciones aplicadas en $Database."
