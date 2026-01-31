-- ===========================================
-- Database Seed Script
-- Sistema de Seguridad Pública
-- ===========================================

-- Insert default corporation (National Level)
INSERT INTO corporations (id, name, type, level, address, phone, email, is_active, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Secretaría de Seguridad Nacional',
    'FEDERAL',
    'NATIONAL',
    'Av. Constituyentes 100, Colonia Tacubaya, CDMX',
    '+52 55 1234 5678',
    'contacto@seguridad.gob.mx',
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user
-- Password: Admin123! (bcrypt hash)
INSERT INTO users (id, corporation_id, email, password_hash, role, is_active, email_verified, mfa_enabled, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@seguridad.gob.mx',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6xSJKBHXLi',
    'national_admin',
    true,
    true,
    false,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert default deduction types
INSERT INTO deduction_types (name, description, percentage, is_active, created_at) VALUES
    ('ISR', 'Impuesto Sobre la Renta', NULL, true, NOW()),
    ('IMSS', 'Instituto Mexicano del Seguro Social', NULL, true, NOW()),
    ('SGMM', 'Sistema de Ahorro para el Retiro', NULL, true, NOW()),
    ('INFONAVIT', 'Instituto del Fondo Nacional de la Vivienda', NULL, true, NOW()),
    ('Penalización por Retardo', 'Descuento por llegadas tarde', NULL, true, NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert example personnel records
INSERT INTO personnel (
    id,
    corporation_id,
    first_name,
    last_name,
    badge_number,
    rank,
    position,
    status,
    hire_date,
    created_at
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Juan',
        'García',
        'GN-001',
        'CAPTAIN',
        'Commanding Officer',
        'ACTIVE',
        '2020-01-15',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'María',
        'Rodríguez',
        'GN-002',
        'LIEUTENANT',
        'Shift Supervisor',
        'ACTIVE',
        '2020-02-01',
        NOW()
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        'Carlos',
        'Martínez',
        'GN-003',
        'SERGEANT',
        'Field Officer',
        'ACTIVE',
        '2020-03-10',
        NOW()
    )
ON CONFLICT (badge_number) DO NOTHING;

-- Insert example shifts
INSERT INTO shifts (
    id,
    corporation_id,
    name,
    start_time,
    end_time,
    days_of_week,
    is_active,
    created_at
) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Turno Matutino',
        '06:00',
        '14:00',
        '1,2,3,4,5',
        true,
        NOW()
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'Turno Vespertino',
        '14:00',
        '22:00',
        '1,2,3,4,5',
        true,
        NOW()
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        'Turno Nocturno',
        '22:00',
        '06:00',
        '1,2,3,4,5,6,7',
        true,
        NOW()
    )
ON CONFLICT DO NOTHING;

-- Insert example salary config
INSERT INTO salary_configs (
    id,
    corporation_id,
    personnel_id,
    base_salary,
    benefits,
    is_active,
    created_at
) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '25000.00',
        '5000.00',
        true,
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '20000.00',
        '4000.00',
        true,
        NOW()
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        '18000.00',
        '3500.00',
        true,
        NOW()
    )
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database seeded successfully!';
    RAISE NOTICE 'Default admin credentials:';
    RAISE NOTICE '  Email: admin@seguridad.gob.mx';
    RAISE NOTICE '  Password: Admin123!';
END $$;
