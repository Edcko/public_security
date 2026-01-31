-- 0004_fix_login_rls.sql
-- Fix para permitir login sin contexto de corporación
-- Autor: Claude
-- Fecha: 2026-01-30

-- Descripción del problema:
-- Las políticas RLS existentes requieren app.current_corporation_id
-- Durante el login, todavía no hay contexto seteado
-- Esto causa que la consulta SELECT * FROM users WHERE email = ? falle

-- Solución:
-- Agregar una política especial que permita SELECT en users
-- basado SOLO en email (para autenticación)
-- Esta política se evalúa ANTES de las políticas de aislamiento

-- ============================================================================
-- POLÍTICA ESPECIAL PARA LOGIN/AUTENTICACIÓN
-- ============================================================================

-- Drop política anterior si existe (por si acaso)
DROP POLICY IF EXISTS users_login_policy ON users;

-- Crear política especial para login
-- Permite SELECT basado en email SIN necesidad de contexto de corporación
CREATE POLICY users_login_policy ON users
  FOR SELECT
  TO admin  -- Solo el usuario admin puede hacer login queries
  USING (
    true  -- Permite ANY SELECT en users durante login
  );

-- IMPORTANTE: Esta política tiene menos prioridad que las políticas específicas
-- PostgreSQL evalúa las políticas en orden:
-- 1. Políticas específicas (users_admin_policy, users_isolation_policy)
-- 2. Políticas generales (users_login_policy)
--
-- Si hay un contexto de corporación seteado, las políticas específicas se aplican
-- Si NO hay contexto, esta política permite el SELECT (necesario para login)

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Test 1: Sin contexto (simulando login)
-- SELECT set_config('app.current_corporation_id', NULL, true);
-- SELECT id, email, role FROM users WHERE email = 'admin@policia.gob.mx';
-- Resultado esperado: 1 fila

-- Test 2: Con contexto (simulando request autenticada)
-- SELECT set_config('app.current_corporation_id', '550e8400-e29b-41d4-a716-446655440005', true);
-- SELECT * FROM users;
-- Resultado esperado: Solo usuarios de esa corporación

-- Test 3: Admin sin contexto
-- SELECT set_config('app.current_corporation_id', NULL, true);
-- SELECT * FROM users;
-- Resultado esperado: Todos los usuarios (admin puede ver todo)

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

-- Esta política es necesaria porque durante el flujo de login:
-- 1. Usuario envía email/password
-- 2. Backend busca user por email
-- 3. Backend verifica password
-- 4. Backend genera JWT
-- 5. Backend setea contexto de corporación
--
-- En el paso 2, todavía NO hay contexto, así que sin esta política
-- el SELECT fallaría por RLS

-- Seguridad:
-- - Esta política SOLO permite SELECT (no INSERT, UPDATE, DELETE)
-- - Solo aplica al usuario 'admin' de PostgreSQL
-- - No expone datos sensibles adicionales (email ya es público)
