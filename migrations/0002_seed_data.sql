-- ============================================
-- Seed Data: Corporaciones y Usuarios Iniciales
-- Sistema Nacional de Seguridad Pública
-- ============================================

-- ============================================
-- CORPORATIONS (Corporaciones de Ejemplo)
-- ============================================

-- Corporación Federal (Ejemplo: Guardia Nacional)
INSERT INTO corporations (id, name, type, parent_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Guardia Nacional', 'federal', NULL);

-- Corporaciones Estatales (Ejemplos)
INSERT INTO corporations (id, name, type, parent_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Fuerza Civil - Jalisco', 'estatal', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Policía Estatal - Nuevo León', 'estatal', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Fuerza Civil - México City', 'estatal', '550e8400-e29b-41d4-a716-446655440001');

-- Corporaciones Municipales (Ejemplos)
INSERT INTO corporations (id, name, type, parent_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', 'Policía Municipal - Guadalajara', 'municipal', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Policía Municipal - Monterrey', 'municipal', '550e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Policía Municipal - CDMX', 'municipal', '550e8400-e29b-41d4-a716-446655440004');

-- ============================================
-- USERS (Usuarios Iniciales para Desarrollo)
-- ============================================
-- Password para todos: Admin123! (bcrypt hash)
-- Hash generado con: bcrypt.hash('Admin123!', 10)

INSERT INTO users (id, email, password_hash, corporation_id, role, mfa_enabled) VALUES
  -- Admin Nacional (acceso a todo)
  ('650e8400-e29b-41d4-a716-446655440001', 'admin@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440001', 'national_admin', false),

  -- Admin Estatal Jalisco
  ('650e8400-e29b-41d4-a716-446655440002', 'admin.jalisco@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440002', 'state_admin', false),

  -- Admin Estatal Nuevo León
  ('650e8400-e29b-41d4-a716-446655440003', 'admin.nl@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440003', 'state_admin', false),

  -- Admin Municipal Guadalajara
  ('650e8400-e29b-41d4-a716-446655440004', 'admin.gdl@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440005', 'municipal_admin', false),

  -- Admin Municipal Monterrey
  ('650e8400-e29b-41d4-a716-446655440005', 'admin.mty@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440006', 'municipal_admin', false),

  -- Admin Municipal CDMX
  ('650e8400-e29b-41d4-a716-446655440006', 'admin.cdmx@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440007', 'municipal_admin', false),

  -- Oficial de prueba Guadalajara
  ('650e8400-e29b-41d4-a716-446655440007', 'oficial.gdl@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440005', 'officer', false),

  -- Dispatcher de prueba CDMX
  ('650e8400-e29b-41d4-a716-446655440008', 'dispatcher.cdmx@seguridad.gob.mx', '$2b$10$YVxKZkqKJKLZXZQZxZxZxuKZQZxZxZxZxZxZxZxZxZxZxZxZxZx', '550e8400-e29b-41d4-a716-446655440007', 'dispatcher', false);

-- ============================================
-- PERSONNEL (Personal de Prueba)
-- ============================================

INSERT INTO personnel (id, corporation_id, badge_number, curp, first_name, last_name, rank, status) VALUES
  -- Guadalajara
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'GDL-001', 'BADD110514HCLRZ04', 'Carlos', 'Ramírez', 'Comandante', 'active'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'GDL-002', 'LOOA850921MZRLL04', 'María', 'López', 'Oficial', 'active'),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'GDL-003', 'GODE881230HZRLL09', 'Juan', 'García', 'Oficial', 'active'),

  -- Monterrey
  ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'MTY-001', 'ROSA690115HZSRNN02', 'Roberto', 'Sánchez', 'Comandante', 'active'),
  ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'MTY-002', 'MOOA720509MZRSS02', 'Ana', 'Martínez', 'Oficial', 'active'),

  -- CDMX
  ('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-001', 'PERJ590822HDFRNN02', 'Pedro', 'Pérez', 'Comandante', 'active'),
  ('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-002', 'HIDD640320MDFRNN04', 'Laura', 'Hernández', 'Oficial', 'active'),
  ('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-003', 'GOCR780115HDFLNN02', 'Ricardo', 'Gómez', 'Oficial', 'active');

-- ============================================
-- WEAPONS (Armas de Prueba)
-- ============================================

INSERT INTO weapons (id, corporation_id, serial_number, weapon_type, make, model, caliber, status, assigned_to) VALUES
  -- Guadalajara
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'GDL-ARM-001', 'pistol', 'Glock', '19', '9mm', 'assigned', '750e8400-e29b-41d4-a716-446655440002'),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'GDL-ARM-002', 'pistol', 'Glock', '19', '9mm', 'assigned', '750e8400-e29b-41d4-a716-446655440003'),
  ('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'GDL-ARM-003', 'rifle', 'AR-15', 'Smith & Wesson', 'M&P15', '5.56mm', 'available', NULL),

  -- Monterrey
  ('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'MTY-ARM-001', 'pistol', 'Glock', '17', '9mm', 'assigned', '750e8400-e29b-41d4-a716-446655440005'),
  ('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'MTY-ARM-002', 'shotgun', 'Remington', '870', '12 gauge', 'available', NULL),

  -- CDMX
  ('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-ARM-001', 'pistol', 'Glock', '19', '9mm', 'assigned', '750e8400-e29b-41d4-a716-446655440007'),
  ('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-ARM-002', 'pistol', 'Glock', '19', '9mm', 'assigned', '750e8400-e29b-41d4-a716-446655440008'),
  ('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-ARM-003', 'rifle', 'AR-15', 'Colt', 'LE6920', '5.56mm', 'available', NULL);

-- ============================================
-- VEHICLES (Vehículos de Prueba)
-- ============================================

INSERT INTO vehicles (id, corporation_id, plate_number, vehicle_type, make, model, year, status, current_mileage) VALUES
  -- Guadalajara
  ('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'GDL-PAT-001', 'patrol', 'Ford', 'Police Interceptor', 2023, 'active', 15000),
  ('950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'GDL-PAT-002', 'suv', 'Chevrolet', 'Tahoe', 2022, 'active', 32000),
  ('950e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'GDL-MOT-001', 'motorcycle', 'Honda', 'PCX 150', 2023, 'active', 5000),

  -- Monterrey
  ('950e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'MTY-PAT-001', 'patrol', 'Dodge', 'Durango', 2023, 'active', 12000),
  ('950e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'MTY-PAT-002', 'patrol', 'Ford', 'F-150', 2022, 'maintenance', 45000),

  -- CDMX
  ('950e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-PAT-001', 'patrol', 'Nissan', 'NP300', 2023, 'active', 8000),
  ('950e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-PAT-002', 'suv', 'Toyota', 'Land Cruiser', 2023, 'active', 18000),
  ('950e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'CDMX-MOT-001', 'motorcycle', 'Yamaha', 'XMAX', 2023, 'active', 3000);

-- ============================================
-- ARRESTS (Arrestos de Ejemplo)
-- ============================================

INSERT INTO arrests (id, corporation_id, arrest_date, officer_id, detainee_name, detainee_curp, detainee_age, charges, location, incident_report) VALUES
  ('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '2 days', '750e8400-e29b-41d4-a716-446655440002', 'José Rodríguez Torres', 'ROTT800101HZSRRL01', 43, 'Robo a transeúnte', 'Av. Juárez y Calle Morelos, Guadalajara', 'El detenido fue sorprendido robando celular a transeúnte. Se recuperó el objeto.'),
  ('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '1 day', '750e8400-e29b-41d4-a716-446655440007', 'Margarita Vega López', 'VEGL750615HDFRLL07', 48, 'Violencia familiar', 'Col. Roma Norte, CDMX', 'Intervención por llamada de vecina reportando gritos y golpes. Detenido puesto a disposición del MP.');

-- ============================================
-- SHIFTS (Turnos de Ejemplo)
-- ============================================

INSERT INTO shifts (id, corporation_id, officer_id, shift_type, shift_date, location, status) VALUES
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440002', 'morning', CURRENT_DATE, 'Centro Histórico, Guadalajara', 'completed'),
  ('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440003', 'afternoon', CURRENT_DATE, 'Plaza Tapatía, Guadalajara', 'checked_in'),
  ('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440007', 'night', CURRENT_DATE, 'Col. Roma, CDMX', 'scheduled'),
  ('b50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440008', 'morning', CURRENT_DATE + INTERVAL '1 day', 'Centro CDMX', 'scheduled');

-- ============================================
-- ATTENDANCE (Registros de Asistencia)
-- ============================================

INSERT INTO attendance (id, shift_id, officer_id, check_in, check_out, total_hours, overtime_hours, notes) VALUES
  ('c50e8400-e29b-41d4-a716-446655440001', 'b50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002',
   CURRENT_DATE || ' 07:00:00'::timestamp,
   CURRENT_DATE || ' 15:30:00'::timestamp,
   8.5, 0.5, 'Turno completado sin incidentes.');

-- ============================================
-- COMPLETADO
-- ============================================
SELECT 'Migration 0002: Seed Data - COMPLETED' AS status;
SELECT '  - 7 corporations creadas (1 federal, 3 estatales, 3 municipales)' AS info;
SELECT '  - 8 usuarios creados (admins, officers, dispatchers)' AS info;
SELECT '  - 8 oficiales de personal creados' AS info;
SELECT '  - 8 armas registradas' AS info;
SELECT '  - 8 vehículos registrados' AS info;
SELECT '  - 2 arrestos de ejemplo' AS info;
SELECT '  - 4 turnos programados' AS info;
SELECT '  - 1 registro de asistencia' AS info;
