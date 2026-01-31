-- ============================================
-- RLS Helper Functions & Triggers
-- Sistema Nacional de Seguridad Pública
-- ============================================

-- ============================================
-- FUNCIONES HELPER PARA RLS
-- ============================================

-- Función: Setear el contexto de la corporación actual
CREATE OR REPLACE FUNCTION set_corporation_context(corporation_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_corporation_id', corporation_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Setear el contexto del usuario actual
CREATE OR REPLACE FUNCTION set_user_context(user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener la corporación del usuario actual
CREATE OR REPLACE FUNCTION get_user_corporation(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_corporation_id UUID;
BEGIN
  SELECT corporation_id INTO user_corporation_id
  FROM users
  WHERE id = user_id;

  RETURN user_corporation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Limpiar todo el contexto
CREATE OR REPLACE FUNCTION clear_context()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_corporation_id', NULL, true);
  PERFORM set_config('app.current_user_id', NULL, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN DE AUDITORÍA AUTOMÁTICA
-- ============================================

-- Función: Loggear cambios en audit_logs
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  corporation_id UUID;
  action_type VARCHAR(10);
BEGIN
  -- Obtener user_id del contexto
  user_id := current_setting('app.current_user_id', true)::UUID;

  -- Obtener corporation_id del contexto
  corporation_id := current_setting('app.current_corporation_id', true)::UUID;

  -- Determinar tipo de acción
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
  ELSE
    RETURN NEW;
  END IF;

  -- Insertar en audit_logs
  INSERT INTO audit_logs (
    timestamp,
    user_id,
    corporation_id,
    action,
    resource,
    resource_id,
    success,
    failure_reason
  ) VALUES (
    NOW(),
    user_id,
    corporation_id,
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    true,
    NULL
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS DE AUDITORÍA
-- ============================================

-- Tablas sensibles que requieren auditoría automática
DROP TRIGGER IF EXISTS audit_personnel ON personnel;
CREATE TRIGGER audit_personnel
  AFTER INSERT OR UPDATE OR DELETE ON personnel
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_weapons ON weapons;
CREATE TRIGGER audit_weapons
  AFTER INSERT OR UPDATE OR DELETE ON weapons
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_arrests ON arrests;
CREATE TRIGGER audit_arrests
  AFTER INSERT OR UPDATE OR DELETE ON arrests
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_vehicles ON vehicles;
CREATE TRIGGER audit_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Personal activo por corporación
CREATE OR REPLACE VIEW active_personnel_by_corporation AS
SELECT
  c.name AS corporation_name,
  c.type AS corporation_type,
  COUNT(p.id) AS active_officers,
  COUNT(*) FILTER (WHERE p.rank = 'Comandante') AS commanders,
  COUNT(*) FILTER (WHERE p.rank = 'Oficial') AS officers
FROM corporations c
LEFT JOIN personnel p ON p.corporation_id = c.id AND p.status = 'active'
GROUP BY c.id, c.name, c.type
ORDER BY c.type, c.name;

-- Vista: Armamento por estado
CREATE OR REPLACE VIEW weapons_status_by_corporation AS
SELECT
  c.name AS corporation_name,
  COUNT(w.id) AS total_weapons,
  COUNT(*) FILTER (WHERE w.status = 'available') AS available,
  COUNT(*) FILTER (WHERE w.status = 'assigned') AS assigned,
  COUNT(*) FILTER (WHERE w.status = 'maintenance') AS maintenance,
  COUNT(*) FILTER (WHERE w.assigned_to IS NOT NULL) AS in_use
FROM corporations c
LEFT JOIN weapons w ON w.corporation_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Vista: Vehículos por estado
CREATE OR REPLACE VIEW vehicles_status_by_corporation AS
SELECT
  c.name AS corporation_name,
  COUNT(v.id) AS total_vehicles,
  COUNT(*) FILTER (WHERE v.status = 'active') AS active,
  COUNT(*) FILTER (WHERE v.status = 'maintenance') AS maintenance,
  COUNT(*) FILTER (WHERE v.status = 'out_of_service') AS out_of_service,
  AVG(v.current_mileage) AS avg_mileage
FROM corporations c
LEFT JOIN vehicles v ON v.corporation_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Vista: Arrestos últimos 30 días
CREATE OR REPLACE VIEW recent_arrests AS
SELECT
  a.id,
  a.arrest_date,
  a.detainee_name,
  a.charges,
  a.location,
  p.first_name || ' ' || p.last_name AS officer_name,
  c.name AS corporation_name
FROM arrests a
JOIN personnel p ON a.officer_id = p.id
JOIN corporations c ON a.corporation_id = c.id
WHERE a.arrest_date >= NOW() - INTERVAL '30 days'
ORDER BY a.arrest_date DESC;

-- ============================================
-- ÍNDICES PARA PERFORMANCE DE AUDITORÍA
-- ============================================

-- Índice compuesto para búsquedas comunes en audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_corporation
  ON audit_logs(user_id, corporation_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_timestamp
  ON audit_logs(resource, timestamp DESC);

-- ============================================
-- FUNCIONES DE UTILIDAD
-- ============================================

-- Función: Verificar si un usuario tiene acceso a una corporación
CREATE OR REPLACE FUNCTION check_corporation_access(user_id UUID, target_corporation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_corporation_id UUID;
  user_role VARCHAR(50);
BEGIN
  -- Obtener datos del usuario
  SELECT corporation_id, role INTO user_corporation_id, user_role
  FROM users
  WHERE id = user_id;

  -- Admin nacional tiene acceso a todo
  IF user_role = 'national_admin' THEN
    RETURN true;
  END IF;

  -- Admin estatal tiene acceso a su corporación y municipales hijas
  IF user_role = 'state_admin' THEN
    IF user_corporation_id = target_corporation_id THEN
      RETURN true;
    END IF;

    -- Verificar si es corporación hija
    IF EXISTS (
      SELECT 1 FROM corporations
      WHERE id = target_corporation_id
      AND parent_id = user_corporation_id
    ) THEN
      RETURN true;
    END IF;
  END IF;

  -- Admin municipal y otros solo su propia corporación
  IF user_corporation_id = target_corporation_id THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener jerarquía de corporaciones (para admin estatal)
CREATE OR REPLACE FUNCTION get_corporation_hierarchy(corporation_id UUID)
RETURNS TABLE (id UUID, name VARCHAR, type VARCHAR, level INT) AS $$
DECLARE
  corp_type VARCHAR(50);
BEGIN
  -- Obtener tipo de corporación
  SELECT type INTO corp_type
  FROM corporations
  WHERE id = corporation_id;

  -- Si es federal, retornar solo ella
  IF corp_type = 'federal' THEN
    RETURN QUERY
    SELECT id, name, type, 0
    FROM corporations
    WHERE id = corporation_id;
  END IF;

  -- Si es estatal, retornarla + municipales hijas
  IF corp_type = 'estatal' THEN
    RETURN QUERY
    SELECT id, name, type,
      CASE WHEN id = corporation_id THEN 0 ELSE 1 END
    FROM corporations
    WHERE id = corporation_id
    OR parent_id = corporation_id;
  END IF;

  -- Si es municipal, retornar solo ella
  IF corp_type = 'municipal' THEN
    RETURN QUERY
    SELECT id, name, type, 0
    FROM corporations
    WHERE id = corporation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPLETADO
-- ============================================
SELECT 'Migration 0003: RLS Helper Functions - COMPLETED' AS status;
SELECT '  - Funciones de contexto (set_corporation_context, set_user_context)' AS info;
SELECT '  - Función de auditoría automática (audit_log_trigger)' AS info;
SELECT '  - Triggers de auditoría en tablas sensibles' AS info;
SELECT '  - Vistas útiles (active_personnel, weapons_status, vehicles_status)' AS info;
SELECT '  - Función de verificación de acceso (check_corporation_access)' AS info;
SELECT '  - Función de jerarquía (get_corporation_hierarchy)' AS info;
