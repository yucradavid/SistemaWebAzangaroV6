# Instalación en una PC nueva

## ⚠️ Después de cada git pull — checklist obligatorio

Un `git pull` no aplica todo solo. Estas son las cosas que se olvidan y
causan errores confusos (500, 503, subida de archivos rota, etc.) si no se
revisan a mano después de traer cambios:

1. **Compara tu `.env` contra `.env.example`** para ver si hay variables
   nuevas que agregar (`.env` está en `.gitignore`, así que un `git pull`
   nunca lo toca — si alguien agrega una variable nueva a `.env.example`,
   tenés que copiarla vos mismo).

   PowerShell:
   ```powershell
   Compare-Object (Get-Content .env.example | ForEach-Object { ($_ -split '=')[0] }) `
                  (Get-Content .env | ForEach-Object { ($_ -split '=')[0] })
   ```
   O más simple: abrí ambos archivos y revisá a ojo si `.env.example` tiene
   alguna línea que tu `.env` no tiene.

   **Caso puntual: RENIEC.** Si vas a usar el autocompletado por RENIEC en
   el formulario de admisión, agregá a tu `.env` las credenciales
   `RENIEC_BASE_URL`, `RENIEC_TOKEN`, `RENIEC_CLIENT_ID`,
   `RENIEC_CLIENT_SECRET`, `RENIEC_API_KEY` (ver `.env.example`). Sin ellas,
   el endpoint `/api/public/reniec-lookup` responde `503` de forma
   controlada — no rompe el resto del sistema, simplemente esa función en
   particular no queda disponible.

2. **Instalá dependencias si `composer.json`/`package.json` cambiaron**:
   ```bash
   composer install
   npm install --legacy-peer-deps
   ```

3. **Aplicá migraciones nuevas** (revisá primero con `migrate:status` cuáles
   quedan "Pending"):
   ```bash
   php artisan migrate
   ```

4. **Verificá los requisitos de PHP** (extensión GD activa, límites de
   subida) — ver sección
   [Requisitos de PHP para procesamiento de imágenes](#requisitos-de-php-para-procesamiento-de-imágenes-portadas-del-sitio)
   más abajo.

5. **Corré `storage:link`** si es la primera vez que instalás el proyecto en
   esta máquina, o si el módulo de portadas/noticias empieza a dar 403/404
   al cargar imágenes.

6. **Verificá que `APP_URL` coincide con el puerto real** en el que corrés
   `php artisan serve` — ver sección
   [`APP_URL` debe coincidir con el puerto real de `php artisan serve`](#app_url-debe-coincidir-con-el-puerto-real-de-php-artisan-serve)
   más abajo.

7. **Limpiá la caché de configuración** si algo no refleja los cambios
   recientes (por ejemplo, si tocaste `.env` después de que Laravel ya
   había cacheado la config):
   ```bash
   php artisan config:clear
   ```

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

### `APP_URL` debe coincidir con el puerto real de `php artisan serve`

`APP_URL` (por defecto `http://localhost:8000`) se usa para construir las
URLs públicas de archivos servidos desde `storage/app/public` (disco
`public`, ver `config/filesystems.php`) — por ejemplo las portadas de
`site_page_covers` o cualquier imagen subida a futuro. Esa URL **se arma una
sola vez a partir del valor fijo de `APP_URL` del `.env`**, no de la petición
real entrante, así que si corres el backend en un puerto distinto
(`php artisan serve --port=8080`, o cualquier otra configuración en la PC de
otra persona del equipo) y no actualizas `APP_URL` para que coincida, las
URLs de esas imágenes van a apuntar al puerto equivocado y no van a cargar
en el navegador aunque el archivo exista físicamente en disco.

Si cambias el puerto de `php artisan serve`, actualiza `APP_URL` en el mismo
`.env` y corre `php artisan config:clear` (o `config:cache` si usas caché de
config) para que el cambio se aplique.

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

## Requisitos de PHP para procesamiento de imágenes (portadas del sitio)

El módulo de portadas (`site_page_covers`) usa `intervention/image` + la
extensión **GD** de PHP para generar los 3 tamaños WebP al subir una imagen.
Si estos requisitos no están, la subida falla con errores confusos en vez de
un mensaje claro.

1. **Extensión GD activa.** Verificá con:
   ```bash
   php -m | grep -i gd        # Git Bash / WSL
   php -m | findstr gd        # PowerShell
   ```
   Si no aparece nada, buscá la línea `;extension=gd` en tu `php.ini`
   (`php --ini` te dice cuál es el archivo cargado) y quitale el `;` para
   habilitarla. Necesita el archivo `php_gd.dll` presente en tu carpeta
   `ext/` (ya viene con la mayoría de instalaciones de PHP en Windows,
   solo está deshabilitada por defecto).

2. **Límites de subida en `php.ini`.** Laravel valida hasta 8MB
   (`max:8192` en el controlador), pero si `upload_max_filesize` en
   `php.ini` es menor (el default de PHP es `2M`), el archivo se corta
   *antes* de llegar a Laravel y la subida falla sin un mensaje útil.
   Necesitás como mínimo:
   ```ini
   upload_max_filesize = 10M
   post_max_size = 12M
   ```

3. **`memory_limit`** — esto **no** requiere tocar `php.ini`: el
   controlador (`SitePageCoverController::update`) ya eleva el límite a
   512M con `ini_set()` acotado solo a esa petición, porque decodificar una
   foto de celular real en GD puede pesar 40-60MB+ en memoria. No hace
   falta ninguna acción manual acá, es solo para que sepas por qué no está
   en la lista de cosas a configurar.

Después de cualquier cambio a `php.ini`, reiniciá `php artisan serve` (o
cualquier proceso PHP que ya esté corriendo) para que tome el nuevo valor —
un servidor ya arrancado sigue usando la configuración con la que inició.

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
