# Migraciones de Base de Datos

Sistema de migraciones SQL para el Sistema Nacional de Seguridad Pública.

## 📋 Migraciones Disponibles

### 0001_initial_schema.sql
**Descripción**: Schema inicial con todas las tablas y Row-Level Security (RLS)

**Contenido**:
- 10 tablas principales (corporations, users, personnel, weapons, vehicles, arrests, shifts, attendance, audit_logs, gps_tracking)
- Políticas de RLS para aislamiento por corporación
- 40+ índices para performance
- Extensiones PostgreSQL (uuid-ossp, pgcrypto)

### 0002_seed_data.sql
**Descripción**: Datos iniciales para desarrollo y testing

**Contenido**:
- 7 corporaciones (1 federal, 3 estatales, 3 municipales)
- 8 usuarios de prueba (admins, officers, dispatchers)
- Password por defecto: `Admin123!`
- 8 oficiales de personal
- 8 armas de ejemplo
- 8 vehículos de ejemplo
- 2 arrestos de ejemplo
- 4 turnos programados
- 1 registro de asistencia

### 0003_rls_helpers.sql
**Descripción**: Funciones helper y triggers para RLS y auditoría

**Contenido**:
- Funciones de contexto (set_corporation_context, set_user_context)
- Trigger de auditoría automática en tablas sensibles
- Vistas útiles (active_personnel_by_corporation, weapons_status, vehicles_status)
- Función de verificación de acceso (check_corporation_access)
- Función de jerarquía (get_corporation_hierarchy)

## 🚀 Uso Rápido

### 1. Iniciar Docker (si no está corriendo)
```bash
docker-compose up -d
```

### 2. Ejecutar todas las migraciones
```bash
npm run db:setup
```

### 3. Verificar que todo esté funcionando
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U admin -d public_security

# Verificar tablas creadas
\dt

# Verificar datos de ejemplo
SELECT * FROM corporations;
SELECT * FROM users;
SELECT * FROM personnel;
```

## 🔧 Comandos Disponibles

### npm run db:setup
Ejecuta todas las migraciones pendientes en orden.

```bash
npm run db:setup
```

**Salida esperada**:
```
🚀 Migration Runner - Sistema Nacional de Seguridad Pública
📦 Database: postgresql://admin:****@localhost:5432/public_security

✅ Tabla de migraciones verificada
📊 Migraciones ya ejecutadas: 0
📋 Migraciones pendientes: 3

📄 Ejecutando: 0001_initial_schema.sql
✅ 0001_initial_schema.sql - COMPLETADO

📄 Ejecutando: 0002_seed_data.sql
✅ 0002_seed_data.sql - COMPLETADO

📄 Ejecutando: 0003_rls_helpers.sql
✅ 0003_rls_helpers.sql - COMPLETADO

============================================================
📊 RESUMEN
============================================================
✅ Ejecutadas correctamente: 3

✨ Todas las migraciones se ejecutaron correctamente!
```

### npm run db:reset
**PELIGROSO**: Elimina TODO y recrea la base de datos desde cero.

```bash
npm run db:reset
```

**Usar solo en desarrollo** cuando quieras empezar de nuevo.

## 📊 Tabla de Tracking

Las migraciones ejecutadas se registran en la tabla `schema_migrations`:

```sql
SELECT * FROM schema_migrations ORDER BY executed_at;
```

**Resultado**:
```
     version      |        executed_at        |         filename
------------------+--------------------------+--------------------------
 0001             | 2026-01-29 02:14:23.456   | 0001_initial_schema.sql
 0002             | 2026-01-29 02:46:12.789   | 0002_seed_data.sql
 0003             | 2026-01-29 02:48:34.123   | 0003_rls_helpers.sql
```

## 🧪 Testing de RLS

Después de ejecutar las migraciones, puedes verificar que RLS funciona:

```sql
-- 1. Conectar como usuario normal
\c public_security admin

-- 2. Setear contexto de corporación Guadalajara
SELECT set_config('app.current_corporation_id', '550e8400-e29b-41d4-a716-446655440005', true);

-- 3. Intentar ver personal (SOLO debe ver de Guadalajara)
SELECT p.*, c.name AS corporation
FROM personnel p
JOIN corporations c ON p.corporation_id = c.id;

-- Resultado: Solo 3 oficiales de Guadalajara

-- 4. Cambiar a contexto de CDMX
SELECT set_config('app.current_corporation_id', '550e8400-e29b-41d4-a716-446655440007', true);

-- 5. Ver personal nuevamente (SOLO debe ver de CDMX)
SELECT p.*, c.name AS corporation
FROM personnel p
JOIN corporations c ON p.corporation_id = c.id;

-- Resultado: Solo 3 oficiales de CDMX
```

## 🔍 Verificar Vistas Creadas

```sql
-- Personal activo por corporación
SELECT * FROM active_personnel_by_corporation;

-- Armamento por estado
SELECT * FROM weapons_status_by_corporation;

-- Vehículos por estado
SELECT * FROM vehicles_status_by_corporation;

-- Arrestos recientes (últimos 30 días)
SELECT * FROM recent_arrests;
```

## 📝 Crear Nuevas Migraciones

### Convención de Nomenclatura
```
[version]_[description].sql

Ejemplos:
- 0004_add_biometrics_table.sql
- 0005_create_gps_functions.sql
- 0006_add_user_preferences.sql
```

### Proceso

1. **Crear el archivo SQL**
```bash
# Crear nueva migración
cat > migrations/0004_add_new_feature.sql << 'EOF'
-- Descripción de la migración
-- Autor: Tu nombre
-- Fecha: $(date +%Y-%m-%d)

-- Tu SQL aquí
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ...
);
EOF
```

2. **Ejecutar la migración**
```bash
npm run db:setup
```

3. **Verificar que funcionó**
```bash
docker-compose exec postgres psql -U admin -d public_security
\d new_feature
```

## 🐛 Troubleshooting

### Error: "connection refused"
**Problema**: Docker no está corriendo.

**Solución**:
```bash
docker-compose up -d
docker-compose ps  # Verificar que todos los servicios estén "Up"
```

### Error: "relation already exists"
**Problema**: La migración ya se ejecutó anteriormente.

**Solución**:
```bash
# Verificar qué migraciones se ejecutaron
docker-compose exec postgres psql -U admin -d public_security
SELECT * FROM schema_migrations;

# Si necesitas re-ejecutar, primero elimina la entrada
DELETE FROM schema_migrations WHERE version = '0001';
```

### Error: "must be owner of table"
**Problema**: Permisos insuficientes.

**Solución**:
```bash
# Conectar como superuser (postgres)
docker-compose exec postgres psql -U postgres -d public_security

-- Otorgar permisos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
```

### Reiniciar desde cero
```bash
# Detener Docker
docker-compose down

# Eliminar volúmenes (BORRA TODOS LOS DATOS)
docker-compose down -v

# Levantar nuevamente
docker-compose up -d

# Ejecutar migraciones
npm run db:setup
```

## 📚 Referencias

- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/xfunc.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)

## ✅ Checklist Post-Migración

Después de ejecutar las migraciones, verificar:

- [ ] Todas las tablas creadas: `\dt`
- [ ] Todas las vistas creadas: `\dv`
- [ ] Todas las funciones creadas: `\df`
- [ ] Datos de prueba insertados: `SELECT COUNT(*) FROM personnel;`
- [ ] RLS habilitado en tablas sensibles:
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
- [ ] Índices creados:
  ```sql
  SELECT indexname, tablename
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
  ```
- [ ] Audit logs funcionando:
  ```sql
  INSERT INTO personnel (corporation_id, badge_number, curp, first_name, last_name, rank)
  VALUES ('550e8400-e29b-41d4-a716-446655440005', 'TEST-001', 'TEST000000TESTTEST00', 'Test', 'User', 'Oficial');

  SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1;
  -- Debe ver el registro de CREATE
  ```

---

**¿Listo? Ejecuta `npm run db:setup` y vamos! 🚀**
