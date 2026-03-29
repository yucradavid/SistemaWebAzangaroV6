-- Agregar tablas de catálogo financiero
-- Conceptos de cobro, planes financieros y descuentos/becas

-- =====================================================
-- TABLA: FEE_CONCEPTS (Conceptos de cobro)
-- =====================================================

-- Eliminar tipos existentes si existen
DROP TYPE IF EXISTS concept_type CASCADE;
DROP TYPE IF EXISTS concept_periodicity CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS discount_scope CASCADE;

CREATE TYPE concept_type AS ENUM ('matricula', 'pension', 'interes', 'certificado', 'taller', 'servicio', 'otro');
CREATE TYPE concept_periodicity AS ENUM ('unico', 'mensual', 'anual', 'opcional');
CREATE TYPE discount_type AS ENUM ('porcentaje', 'monto_fijo');
CREATE TYPE discount_scope AS ENUM ('todos', 'pension', 'matricula', 'especifico');

CREATE TABLE IF NOT EXISTS fee_concepts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type concept_type NOT NULL,
  base_amount numeric(10,2) NOT NULL CHECK (base_amount >= 0),
  periodicity concept_periodicity DEFAULT 'unico',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fee_concepts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLA: FINANCIAL_PLANS (Planes financieros)
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES fee_concepts(id) ON DELETE RESTRICT,
  number_of_installments integer NOT NULL CHECK (number_of_installments > 0),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLA: PLAN_INSTALLMENTS (Detalle de cuotas por plan)
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_installments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid NOT NULL REFERENCES financial_plans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL CHECK (installment_number > 0),
  due_date date NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, installment_number)
);

ALTER TABLE plan_installments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLA: DISCOUNTS (Descuentos y becas)
-- =====================================================

CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type discount_type NOT NULL,
  value numeric(10,2) NOT NULL CHECK (value >= 0),
  scope discount_scope DEFAULT 'todos',
  specific_concept_id uuid REFERENCES fee_concepts(id) ON DELETE SET NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLA: STUDENT_DISCOUNTS (Descuentos asignados a estudiantes)
-- =====================================================

CREATE TABLE IF NOT EXISTS student_discounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  discount_id uuid NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  notes text,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, discount_id, academic_year_id)
);

ALTER TABLE student_discounts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Modificar tabla CHARGES para incluir referencias
-- =====================================================

-- Agregar columnas faltantes a charges
ALTER TABLE charges 
  ADD COLUMN IF NOT EXISTS concept_id uuid REFERENCES fee_concepts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS period_month integer CHECK (period_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS period_year integer;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_charges_student ON charges(student_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
CREATE INDEX IF NOT EXISTS idx_charges_due_date ON charges(due_date);
CREATE INDEX IF NOT EXISTS idx_charges_concept ON charges(concept_id);
CREATE INDEX IF NOT EXISTS idx_payments_charge ON payments(charge_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_student_discounts_student ON student_discounts(student_id);
CREATE INDEX IF NOT EXISTS idx_plan_installments_plan ON plan_installments(plan_id);

-- =====================================================
-- POLÍTICAS RLS PARA TABLAS FINANCIERAS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Finance staff can read fee concepts" ON fee_concepts;
DROP POLICY IF EXISTS "Finance staff can manage fee concepts" ON fee_concepts;
DROP POLICY IF EXISTS "Finance staff can read financial plans" ON financial_plans;
DROP POLICY IF EXISTS "Finance staff can manage financial plans" ON financial_plans;
DROP POLICY IF EXISTS "Finance staff can read plan installments" ON plan_installments;
DROP POLICY IF EXISTS "Finance staff can manage plan installments" ON plan_installments;
DROP POLICY IF EXISTS "Finance staff can read discounts" ON discounts;
DROP POLICY IF EXISTS "Finance staff can manage discounts" ON discounts;
DROP POLICY IF EXISTS "Finance staff can read student discounts" ON student_discounts;
DROP POLICY IF EXISTS "Finance staff can manage student discounts" ON student_discounts;
DROP POLICY IF EXISTS "Users can read relevant charges" ON charges;
DROP POLICY IF EXISTS "Finance staff can manage charges" ON charges;
DROP POLICY IF EXISTS "Users can read relevant payments" ON payments;
DROP POLICY IF EXISTS "Finance staff can manage payments" ON payments;
DROP POLICY IF EXISTS "Users can read relevant receipts" ON receipts;
DROP POLICY IF EXISTS "Finance staff can manage receipts" ON receipts;
DROP POLICY IF EXISTS "Finance staff can read cash closures" ON cash_closures;
DROP POLICY IF EXISTS "Cashiers can manage cash closures" ON cash_closures;

-- Fee Concepts
CREATE POLICY "Finance staff can read fee concepts"
  ON fee_concepts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    )
  );

CREATE POLICY "Finance staff can manage fee concepts"
  ON fee_concepts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin')
    )
  );

-- Financial Plans
CREATE POLICY "Finance staff can read financial plans"
  ON financial_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    )
  );

CREATE POLICY "Finance staff can manage financial plans"
  ON financial_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin')
    )
  );

-- Plan Installments
CREATE POLICY "Finance staff can read plan installments"
  ON plan_installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    )
  );

CREATE POLICY "Finance staff can manage plan installments"
  ON plan_installments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin')
    )
  );

-- Discounts
CREATE POLICY "Finance staff can read discounts"
  ON discounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    )
  );

CREATE POLICY "Finance staff can manage discounts"
  ON discounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin')
    )
  );

-- Student Discounts
CREATE POLICY "Finance staff can read student discounts"
  ON student_discounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    ) OR
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    ) OR
    student_id IN (
      SELECT sg.student_id FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

CREATE POLICY "Finance staff can manage student discounts"
  ON student_discounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin')
    )
  );

-- Charges (lectura)
CREATE POLICY "Users can read relevant charges"
  ON charges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    ) OR
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    ) OR
    student_id IN (
      SELECT sg.student_id FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

-- Charges (escritura)
CREATE POLICY "Finance staff can manage charges"
  ON charges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'cashier')
    )
  );

-- Payments (lectura)
CREATE POLICY "Users can read relevant payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    ) OR
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    ) OR
    student_id IN (
      SELECT sg.student_id FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

-- Payments (escritura)
CREATE POLICY "Finance staff can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'cashier')
    )
  );

-- Receipts (lectura)
CREATE POLICY "Users can read relevant receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    ) OR
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    ) OR
    student_id IN (
      SELECT sg.student_id FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

-- Receipts (escritura)
CREATE POLICY "Finance staff can manage receipts"
  ON receipts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'cashier')
    )
  );

-- Cash Closures (lectura)
CREATE POLICY "Finance staff can read cash closures"
  ON cash_closures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'director', 'cashier')
    )
  );

-- Cash Closures (escritura)
CREATE POLICY "Cashiers can manage cash closures"
  ON cash_closures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('finance', 'admin', 'cashier')
    )
  );
