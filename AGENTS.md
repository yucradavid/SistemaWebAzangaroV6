# Arquitectura del Sistema

- **sistema-educativo-frontend/**: Frontend activo desarrollado en Angular. Contiene componentes, rutas y servicios HTTP (`src/app/core/services/`) que consumen la API.
- **bakendcermat/**: Backend activo en Laravel 12 (API REST). Es la ÚNICA fuente de verdad de la lógica de negocio y de la base de datos (administrada mediante sus migraciones de Eloquent/Laravel en `database/migrations/`).
- **colegioscmat/**: Repositorio legacy de prototipado. DEBE SER IGNORADO por completo en cualquier desarrollo, consulta o migración.

# Reglas de Desarrollo
- **Base de Datos y API**: Toda modificación de tablas, campos, modelos o endpoints se realiza exclusivamente dentro de `bakendcermat/`.
- **Frontend**: La integración visual y consumo de la API se realiza dentro de `sistema-educativo-frontend/`.
- **Aislamiento**: No crear ni consultar ningún archivo dentro de `colegioscmat/`.
