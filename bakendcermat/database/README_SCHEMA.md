# Estado del esquema de base de datos

## Tablas sin migración create_*
Las siguientes tablas fueron creadas directamente desde `backupcole.sql` y NO tienen
migración Laravel `create_*`:
- fee_concepts
- charges
- payments
- receipts
- discounts
- student_discounts
- financial_plans
- plan_installments
- cash_closures

## Para instalar en un entorno nuevo
1. Crear la base de datos PostgreSQL.
2. Ejecutar: `psql -d bakendcermat_local -f backupcole.sql`
3. Ejecutar: `php artisan migrate` (solo aplica alteraciones sobre el esquema ya existente).

## Migraciones de alteración existentes
- `2026_03_25_120000_normalize_finance_schema_and_add_void_columns.php`: agrega columnas
  `method`, `reference`, `paid_at`, `voided_at`, `voided_by`, `void_reason` (payments),
  `number`, `issued_at`, `total` (receipts), `notes`, `discount_amount`, `paid_amount`,
  `voided_at`, `voided_by`, `void_reason` (charges), de forma adaptativa con
  `Schema::hasColumn`.
- `2026_03_14_204919_make_charge_id_nullable_in_payments_table.php`: migración vacía
  (no-op), no modifica la tabla `payments`.
- `2026_03_29_030000_make_payments_charge_id_nullable.php`: es la que realmente
  elimina el `NOT NULL` y reconstruye la FK de `payments.charge_id`.
