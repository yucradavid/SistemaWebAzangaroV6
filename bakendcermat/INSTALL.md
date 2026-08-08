# Instalación en una PC nueva

Guía para dejar `bakendcermat` corriendo desde cero en una máquina que nunca
tuvo el proyecto (o que solo tiene el repo clonado, sin base de datos local).

Requisitos previos: PHP 8.2+, Composer, PostgreSQL 14+ instalado localmente
(con `psql`/`pg_dump` disponibles, normalmente en
`C:\Program Files\PostgreSQL\<version>\bin`).

## 1. Clonar / actualizar el repo

```bash
git clone <url-del-repo>
cd bakendcermat
```

o, si ya lo tenías clonado:

```bash
git pull
```

## 2. Instalar dependencias

```bash
composer install
```

## 3. Configurar `.env`

```bash
cp .env.example .env
```

Edita `.env` y ajusta al menos las credenciales de PostgreSQL local:

```env
DB_TARGET=local
DB_LOCAL_HOST=127.0.0.1
DB_LOCAL_PORT=5432
DB_LOCAL_DATABASE=bakendcermat_local
DB_LOCAL_USERNAME=postgres
DB_LOCAL_PASSWORD=<tu-password-de-postgres>
DB_LOCAL_SSLMODE=disable
```

Ver `LOCAL_POSTGRES.md` para más detalle sobre `DB_TARGET` (local vs Supabase)
y `scripts/set-db-target.ps1`.

## 4. Generar la app key

```bash
php artisan key:generate
```

## 5. Restaurar el esquema + datos base

**Este es el paso que reemplaza a `migrate:fresh --seed`.** El dump de
Supabase (`backupcole.sql`) incluye sintaxis específica de `psql`
(`COPY ... FROM stdin`, `\restrict`/`\unrestrict`) que PDO/Laravel **no puede
ejecutar**, así que la restauración se hace con `psql` directamente, no con
migraciones de Laravel.

> `backup_utf8.sql` (dump antiguo, 8-jun) quedó obsoleto: tiene 106 filas con
> texto en doble-encoding UTF-8 (p. ej. `"PÃ©rez"` en vez de `"Pérez"`) y 6
> funciones PL/pgSQL con literales de texto corruptos. `backupcole.sql`
> (4-ago) es estructuralmente equivalente — mismas 39 tablas y 66 funciones —
> pero con el encoding correcto. Usa siempre `backupcole.sql`.

Desde `bakendcermat`, en PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-local-postgres.ps1
```

No hace falta crear la base de datos a mano: el script la crea si no existe.
Si ya existe y quieres reconstruirla desde cero:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-local-postgres.ps1 -Recreate
```

Qué hace el script exactamente:

1. Crea la base `bakendcermat_local` si no existe (o la recrea con `-Recreate`).
2. Importa `backupcole.sql` con `psql -f` (entiende `COPY`/metacomandos, PDO no).
3. Marca como ya aplicadas en `migrations` las migraciones cuyo efecto ya viene
   incluido en el dump, para que Laravel no intente re-crearlas.
4. Ejecuta `php artisan db:fix-sequences` para resincronizar las secuencias
   `serial`/`bigserial`/`identity` del esquema `public` (p. ej. `migrations.id`,
   `personal_access_tokens.id`) con el `MAX(id)` real de cada tabla. El dump
   inserta filas con ids explícitos sin avanzar sus secuencias, así que sin
   este paso la siguiente migración que inserte en una de esas tablas puede
   fallar con `UniqueConstraintViolationException` (id duplicado). No toca
   ninguna fila de datos, solo el contador interno de la secuencia — es
   seguro correrlo también a mano en cualquier momento (con `--dry-run` para
   ver qué corregiría sin aplicar cambios).
5. Ejecuta `php artisan migrate --force` para aplicar el resto de migraciones
   (las que son posteriores al dump).
6. Limpia la caché de configuración.

Es normal ver errores durante la importación por roles/extensiones de
Supabase que no existen en Postgres local (`supabase_admin`, `pg_graphql`,
`supabase_vault`, etc.) — son inofensivos mientras `public.*` y `auth.users`
se hayan importado. Ver `LOCAL_POSTGRES.md`.

## 6. Verificar que todo quedó en orden

```bash
php artisan migrate:status
```

Todas las migraciones deben aparecer como `Ran`. Si alguna aparece pendiente,
revisa el mensaje de error de `restore-local-postgres.ps1` en el paso 5.

## Nota importante sobre `migrate:fresh --seed`

`migrate:fresh --seed` **ya no reconstruye el dataset completo** (usuarios,
estudiantes, años académicos, etc.). Solo dropea y vuelve a crear las tablas
a partir de las migraciones de Laravel + corre `DatabaseSeeder`, que
actualmente solo siembra `PromotionRuleSeeder` (reglas de promoción, sin
datos de negocio). La migración
`database/migrations/2026_01_01_000000_import_base_schema.php` que antes
intentaba importar el dump ahora es un no-op intencional — nunca funcionó de
forma confiable porque usaba `DB::unprepared()` (PDO), que no soporta la
sintaxis de `psql` del dump.

Para reconstruir una base con los datos reales, usa siempre el flujo del
paso 5 (`restore-local-postgres.ps1`), no `migrate:fresh --seed`.
