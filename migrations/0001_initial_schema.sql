-- ============================================
-- Migración Inicial: Schema + Row-Level Security
-- Sistema Nacional de Seguridad Pública
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: corporations (Corporaciones Policiales)
-- ============================================
CREATE TABLE IF NOT EXISTS corporations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'federal', 'estatal', 'municipal'
  parent_id UUID REFERENCES corporations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: users (Usuarios del Sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  role VARCHAR(50) NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: personnel (Personal Policial)
-- ============================================
CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  badge_number VARCHAR(50) NOT NULL,
  curp VARCHAR(18) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  rank VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(corporation_id, badge_number)
);

-- ============================================
-- TABLA: weapons (Armamento)
-- ============================================
CREATE TABLE IF NOT EXISTS weapons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  serial_number VARCHAR(100) NOT NULL,
  weapon_type VARCHAR(50) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  caliber VARCHAR(20),
  status VARCHAR(20) DEFAULT 'available',
  assigned_to UUID REFERENCES personnel(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(corporation_id, serial_number)
);

-- ============================================
-- TABLA: vehicles (Vehículos)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  current_mileage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: arrests (Vitácora de Arrestos)
-- ============================================
CREATE TABLE IF NOT EXISTS arrests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  arrest_date TIMESTAMP NOT NULL,
  officer_id UUID NOT NULL REFERENCES personnel(id),
  detainee_name VARCHAR(255) NOT NULL,
  detainee_curp VARCHAR(18),
  detainee_age INTEGER,
  charges TEXT NOT NULL,
  location VARCHAR(255),
  incident_report TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: shifts (Turnos)
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  officer_id UUID NOT NULL REFERENCES personnel(id),
  shift_type VARCHAR(20) NOT NULL, -- 'morning', 'afternoon', 'night'
  shift_date DATE NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'checked_in', 'completed', 'missed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: attendance (Asistencia/Check-in/out)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  officer_id UUID NOT NULL REFERENCES personnel(id),
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  total_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: audit_logs (LFPDPPP Compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id),
  corporation_id UUID NOT NULL REFERENCES corporations(id),
  action VARCHAR(10) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT
);

-- ============================================
-- TABLA: gps_tracking (GPS en tiempo real)
-- ============================================
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed INTEGER,
  heading INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES RLS POR TABLA
-- ============================================

-- Policy: corporations (solo admins nacionales ven todo)
CREATE POLICY corporations_admin_policy ON corporations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_setting('app.current_user_id', true)::UUID
      AND users.role = 'national_admin'
    )
  );

-- Policy: users (solo ven users de su corporación)
CREATE POLICY users_isolation_policy ON users
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: personnel
CREATE POLICY personnel_isolation_policy ON personnel
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: weapons
CREATE POLICY weapons_isolation_policy ON weapons
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: vehicles
CREATE POLICY vehicles_isolation_policy ON vehicles
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: arrests
CREATE POLICY arrests_isolation_policy ON arrests
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: shifts
CREATE POLICY shifts_isolation_policy ON shifts
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: attendance
CREATE POLICY attendance_isolation_policy ON attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shifts
      WHERE shifts.id = attendance.shift_id
      AND shifts.corporation_id = current_setting('app.current_corporation_id', true)::UUID
    )
  );

-- Policy: audit_logs
CREATE POLICY audit_logs_isolation_policy ON audit_logs
  FOR ALL
  USING (corporation_id = current_setting('app.current_corporation_id', true)::UUID);

-- Policy: gps_tracking
CREATE POLICY gps_tracking_isolation_policy ON gps_tracking
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = gps_tracking.vehicle_id
      AND vehicles.corporation_id = current_setting('app.current_corporation_id', true)::UUID
    )
  );

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Corporations
CREATE INDEX IF NOT EXISTS idx_corporations_type ON corporations(type);
CREATE INDEX IF NOT EXISTS idx_corporations_parent ON corporations(parent_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_corporation ON users(corporation_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Personnel
CREATE INDEX IF NOT EXISTS idx_personnel_corporation ON personnel(corporation_id);
CREATE INDEX IF NOT EXISTS idx_personnel_badge ON personnel(badge_number);
CREATE INDEX IF NOT EXISTS idx_personnel_curp ON personnel(curp);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel(status);

-- Weapons
CREATE INDEX IF NOT EXISTS idx_weapons_corporation ON weapons(corporation_id);
CREATE INDEX IF NOT EXISTS idx_weapons_serial ON weapons(serial_number);
CREATE INDEX IF NOT EXISTS idx_weapons_assigned ON weapons(assigned_to);
CREATE INDEX IF NOT EXISTS idx_weapons_status ON weapons(status);

-- Vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_corporation ON vehicles(corporation_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Arrests
CREATE INDEX IF NOT EXISTS idx_arrests_corporation ON arrests(corporation_id);
CREATE INDEX IF NOT EXISTS idx_arrests_date ON arrests(arrest_date);
CREATE INDEX IF NOT EXISTS idx_arrests_officer ON arrests(officer_id);

-- Shifts
CREATE INDEX IF NOT EXISTS idx_shifts_corporation ON shifts(corporation_id);
CREATE INDEX IF NOT EXISTS idx_shifts_officer ON shifts(officer_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_shift ON attendance(shift_id);
CREATE INDEX IF NOT EXISTS idx_attendance_officer ON attendance(officer_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_corporation ON audit_logs(corporation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- GPS Tracking
CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_tracking(timestamp);

-- ============================================
-- COMPLETADO
-- ============================================
SELECT 'Migration 0001: Initial Schema + RLS - COMPLETED' AS status;
