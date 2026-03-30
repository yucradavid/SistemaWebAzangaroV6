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

function Sync-BaselineMigrations {
    param(
        [string]$PsqlPath,
        [string]$DatabaseName,
        [string]$DatabaseUser,
        [string]$DatabaseHost,
        [int]$DatabasePort
    )

    $baselineMigrations = @(
        "0001_01_01_000000_create_users_table",
        "0001_01_01_000001_create_cache_table",
        "0001_01_01_000002_create_jobs_table",
        "2026_02_07_033456_create_personal_access_tokens_table",
        "2026_02_07_035017_create_personal_access_tokens_table",
        "2026_03_03_000000_add_user_id_to_profiles_table"
    )

    foreach ($migration in $baselineMigrations) {
        $sql = @"
INSERT INTO public.migrations (migration, batch)
SELECT '$migration', 1
WHERE NOT EXISTS (
    SELECT 1
    FROM public.migrations
    WHERE migration = '$migration'
);
"@

        & $PsqlPath -U $DatabaseUser -h $DatabaseHost -p $DatabasePort -d $DatabaseName -c $sql | Out-Null
    }
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

Sync-BaselineMigrations -PsqlPath $psql -DatabaseName $Database -DatabaseUser $User -DatabaseHost $DbHost -DatabasePort $Port

Push-Location $projectRoot
try {
    php artisan migrate --force
    php artisan config:clear
} finally {
    Pop-Location
}

Write-Host "Base local restaurada y migraciones aplicadas en $Database."
