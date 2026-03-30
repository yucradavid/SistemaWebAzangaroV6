# Base de datos local y Supabase

Este backend depende de PostgreSQL y del esquema `auth.users`, asi que no debe levantarse con SQLite.

## Conexion local recomendada

Usa estos valores en `.env`:

```env
DB_CONNECTION=pgsql
DB_TARGET=local
DB_LOCAL_HOST=127.0.0.1
DB_LOCAL_PORT=5432
DB_LOCAL_DATABASE=bakendcermat_local
DB_LOCAL_USERNAME=postgres
DB_LOCAL_PASSWORD=
DB_LOCAL_SSLMODE=disable
DB_SUPABASE_HOST=aws-0-us-west-2.pooler.supabase.com
DB_SUPABASE_PORT=5432
DB_SUPABASE_DATABASE=postgres
DB_SUPABASE_USERNAME=postgres.your-project-ref
DB_SUPABASE_PASSWORD=your-password
DB_SUPABASE_SSLMODE=require
```

## Cambiar entre local y Supabase

Desde `bakendcermat` ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\set-db-target.ps1 -Target local
```

o:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\set-db-target.ps1 -Target supabase
```

El script solo cambia `DB_TARGET` dentro de `.env` y limpia la cache de configuracion.

## Restaurar el dump localmente

Desde `bakendcermat` ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-local-postgres.ps1
```

Si ya existe la base y quieres reconstruirla desde cero:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-local-postgres.ps1 -Recreate
```

El script:

1. crea la base `bakendcermat_local` si no existe,
2. importa `backup_utf8.sql`,
3. registra las migraciones base que ya vienen implicitas en el dump,
4. ejecuta `php artisan migrate --force`,
5. limpia la cache de configuracion.

## Errores esperados durante la restauracion

El dump viene de Supabase. Es normal ver errores por:

- roles como `supabase_admin`,
- extensiones como `pg_graphql` o `supabase_vault`.

Mientras existan `public.*` y `auth.users`, el backend puede funcionar localmente.
