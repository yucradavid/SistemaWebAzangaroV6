-- Actualizar esquema de cash_closures para coincidir con la interfaz del frontend

-- Agregar columnas faltantes
ALTER TABLE cash_closures 
  ADD COLUMN IF NOT EXISTS cashier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS opening_time timestamptz,
  ADD COLUMN IF NOT EXISTS closing_time timestamptz,
  ADD COLUMN IF NOT EXISTS total_cash numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cards numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_transfers numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_yape numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_plin numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payments_count integer DEFAULT 0;

-- Migrar datos existentes
UPDATE cash_closures 
SET 
  cashier_id = closed_by,
  total_amount = actual_balance,
  total_cash = cash_received
WHERE cashier_id IS NULL;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cash_closures_cashier ON cash_closures(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cash_closures_date ON cash_closures(closure_date);
CREATE INDEX IF NOT EXISTS idx_cash_closures_opening_time ON cash_closures(opening_time);
