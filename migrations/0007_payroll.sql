-- Migration: Payroll System
-- Created: 2025-01-30
-- Description: Agrega tablas para sistema de nómina

-- Tabla de configuración salarial por rango
CREATE TABLE IF NOT EXISTS salary_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id UUID NOT NULL REFERENCES corporations(id) ON DELETE CASCADE,
  rank VARCHAR(50) NOT NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  benefits DECIMAL(12, 2) DEFAULT 0,
  bonuses DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(corporation_id, rank)
);

-- Tabla de nómina (registros de pago)
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id UUID NOT NULL REFERENCES corporations(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  benefits DECIMAL(12, 2) DEFAULT 0,
  bonuses DECIMAL(12, 2) DEFAULT 0,
  deductions DECIMAL(12, 2) DEFAULT 0,
  total_pay DECIMAL(12, 2) NOT NULL,
  payment_date DATE,
  payment_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de deducciones (ISR, IMSS, etc.)
CREATE TABLE IF NOT EXISTS deduction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  percentage DECIMAL(5, 2),
  fixed_amount DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payroll_records_corporation ON payroll_records(corporation_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_personnel ON payroll_records(personnel_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_salary_configs_corporation ON salary_configs(corporation_id);

-- Comments
COMMENT ON TABLE salary_configs IS 'Configuración salarial por rango y corporación';
COMMENT ON TABLE payroll_records IS 'Registros de nómina del personal';
COMMENT ON TABLE deduction_types IS 'Tipos de deducciones (ISR, IMSS, etc.)';
COMMENT ON COLUMN payroll_records.payment_status IS 'pending, paid, cancelled';

-- Insertar deducciones comunes (valores por defecto para México)
INSERT INTO deduction_types (name, description, percentage) VALUES
  ('ISR', 'Impuesto Sobre la Renta', NULL),
  ('IMSS', 'Instituto Mexicano del Seguro Social', NULL),
  ('Aportación Patronal', 'Aportaciones del patrón', NULL)
ON CONFLICT (name) DO NOTHING;

-- Crear tabla de configuración de deducciones por corporación
CREATE TABLE IF NOT EXISTS corporation_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id UUID NOT NULL REFERENCES corporations(id) ON DELETE CASCADE,
  deduction_type_id UUID NOT NULL REFERENCES deduction_types(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2),
  fixed_amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(corporation_id, deduction_type_id)
);

CREATE INDEX IF NOT EXISTS idx_corporation_deductions_corporation ON corporation_deductions(corporation_id);
