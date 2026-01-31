# Apache Superset - Guía de Instalación y Configuración

## 📊 ¿Qué es Apache Superset?

Apache Superset es una plataforma de Business Intelligence (BI) de código moderno que permite explorar y visualizar datos, desde simples gráficos de barras hasta dashboards complejos.

## 🎯 Objetivo de esta Fase

Configurar Superset para crear dashboards de analytics que permitan:
- Visualizar incidencia delictiva en tiempo real
- Analizar recursos humanos (personal, turnos, asistencia)
- Gestionar inventario (armamento, vehículos)
- Monitorear KPIs operacionales

---

## 🚀 Instalación de Apache Superset

### Opción 1: Docker (Recomendado para Producción)

#### 1. Crear docker-compose para Superset

```yaml
# docker-compose.superset.yml
version: '3.8'

services:
  superset:
    image: apache/superset:latest
    container_name: superset
    environment:
      - SUPERSET_SECRET_KEY=thisismyencryptedsecretkey123456
      - SUPERSET_LOAD_EXAMPLES=no
    ports:
      - "8088:8088"
    volumes:
      - superset_home:/app/superset_home
      - superset_db:/app/superset_db
    depends_on:
      - superset_db
    command: >
      sh -c "
        superset db upgrade &&
        superset fab create-admin \
          --username admin \
          --firstname Admin \
          --lastname User \
          --email admin@seguridad-publica.gob.mx \
          --password admin123 &&
        superset init &&
        gunicorn --bind 0.0.0.0:8088 --access-logfile - --error-logfile - --workers 4 --worker-class gthread --threads 20 --timeout 120 superset.app:create_app()
      "

  superset_db:
    image: postgres:16
    container_name: superset_db
    environment:
      - POSTGRES_DB=superset
      - POSTGRES_USER=superset
      - POSTGRES_PASSWORD=superset123
    volumes:
      - superset_postgres_data:/var/lib/postgresql/data

volumes:
  superset_home:
  superset_db:
  superset_postgres_data:
```

#### 2. Levantar Superset

```bash
docker-compose -f docker-compose.superset.yml up -d
```

#### 3. Acceder a Superset

```
URL: http://localhost:8088
Usuario: admin
Contraseña: admin123
```

---

### Opción 2: Instalación Local (para Desarrollo)

#### 1. Requisitos Previos

```bash
# Python 3.10+
sudo apt-get update
sudo apt-get install python3.10 python3.10-venv build-essential

# System dependencies
sudo apt-get install \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpq-dev \
  libmysqlclient-dev
```

#### 2. Crear Virtual Environment

```bash
# Crear directorio
mkdir -p ~/superset
cd ~/superset

# Crear venv
python3.10 -m venv venv
source venv/bin/activate

# Instalar Superset
pip install apache-superset
```

#### 3. Inicializar Base de Datos

```bash
# Crear base de datos
superset db upgrade

# Crear usuario admin
superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname User \
  --email admin@seguridad-publica.gob.mx \
  --password admin123

# Inicializar Superset
superset init
```

#### 4. Ejecutar Superset

```bash
# Development server
superset run -h 0.0.0.0 -p 8088 --with-threads --reload --debugger
```

---

## 🔗 Conectar Superset a PostgreSQL del Sistema

### Paso 1: Configurar Conexión a Base de Datos

1. En Superset, ir a **Settings** → **Database Connections**
2. Click en **+ Database**
3. Seleccionar **PostgreSQL**
4. Configurar conexión:

```
Connection String:
postgresql://admin:password@host.docker.internal:5432/public_security
```

**NOTA**: `host.docker.internal` permite que el container Docker acceda a la base de datos en el host.

### Paso 2: Configurar Row-Level Security (RLS) en Superset

Para aislar datos por corporación, necesitamos configurar RLS en Superset:

```python
# En el SQL Lab de Superset, crear función para setear corporation_id

CREATE OR REPLACE FUNCTION set_superset_corporation_id(user_id INTEGER)
RETURNS VOID AS $$
DECLARE
  corp_id UUID;
BEGIN
  -- Obtener corporation_id del usuario
  SELECT corporation_id INTO corp_id
  FROM users
  WHERE id = user_id;

  -- Setear RLS context
  PERFORM set_config('app.current_corporation_id', corp_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 3: Crear Virtual Datasets

Para cada módulo, crear datasets que apliquen RLS:

```sql
-- Dataset: personnel_with_rls
SELECT *
FROM personnel
WHERE corporation_id = current_setting('app.current_corporation_id')::UUID;

-- Dataset: weapons_with_rls
SELECT *
FROM weapons
WHERE corporation_id = current_setting('app.current_corporation_id')::UUID;

-- Dataset: arrests_with_rls
SELECT *
FROM arrests
WHERE corporation_id = current_setting('app.current_corporation_id')::UUID;
```

---

## 📈 Crear Dashboards

### Dashboard 1: Incidencia Delictiva

#### Fuentes de Datos
- Tabla: `arrests`
- Campos: `arrest_date`, `charges`, `location`, `corporation_id`

#### Gráficos
1. **Línea de Tiempo**: Arrestos por día (últimos 30 días)
   - Tipo: Time Series Line Chart
   - X-Axis: arrest_date
   - Metric: COUNT(*)

2. **Heatmap Geográfico**: Arrestos por ubicación
   - Tipo: Mapbox Heatmap
   - Lat/Long: location_lat, location_lng
   - Metric: COUNT(*)

3. **Top 10 Delitos**: Más frecuentes
   - Tipo: Bar Chart
   - Dimension: charges
   - Metric: COUNT(*)
   - Sort: Descending

4. **KPI Cards**:
   - Total Arrestos (Mes Actual)
   - % vs Mes Anterior
   - Arrestos por Día (Promedio)

### Dashboard 2: Recursos Humanos

#### Fuentes de Datos
- Tabla: `personnel`
- Tabla: `shifts`
- Tabla: `shift_attendance`

#### Gráficos
1. **Distribución por Rango**: Treemap
   - Tipo: Treemap
   - Dimension: rank
   - Metric: COUNT(*)

2. **Asistencia Semanal**: Area Chart
   - Tipo: Time Series Area Chart
   - X-Axis: date
   - Metric: AVG(attendance_rate)

3. **Personal por Estado**: Pie Chart
   - Tipo: Pie Chart
   - Dimension: status (active, suspended, retired)
   - Metric: COUNT(*)

4. **KPI Cards**:
   - Personal Activo Total
   - Personal en Turno Ahora
   - Tasa de Asistencia (Mes)

### Dashboard 3: Inventario de Armamento

#### Fuentes de Datos
- Tabla: `weapons`
- Tabla: `weapon_assignments`

#### Gráficos
1. **Armas por Tipo**: Bar Chart
   - Tipo: Bar Chart
   - Dimension: weapon_type
   - Metric: COUNT(*)

2. **Estado de Armamento**: Pie Chart
   - Tipo: Pie Chart
   - Dimension: status
   - Metric: COUNT(*)

3. **Asignaciones por Oficial**: Table
   - Tipo: Table with Pagination
   - Columnas: officer_name, weapon_type, assignment_date
   - Filter: WHERE status = 'assigned'

4. **KPI Cards**:
   - Total Armas
   - Armas Asignadas (%)
   - Armas en Mantenimiento
   - Armas Disponibles

### Dashboard 4: Gestión de Vehículos

#### Fuentes de Datos
- Tabla: `vehicles`
- Tabla: `vehicle_assignments`
- Tabla: `gps_tracking`

#### Gráficos
1. **Flota por Estado**: Pie Chart
   - Tipo: Pie Chart
   - Dimension: status (active, maintenance, decommissioned)
   - Metric: COUNT(*)

2. **Vehículos en Servicio**: Big Number with Trendline
   - Tipo: Big Number
   - Metric: COUNT(*) WHERE status = 'active'
   - Subtitle: Últimas 24 horas

3. **Ruta de Patrullas**: Mapbox Line Chart
   - Tipo: Mapbox Scatter Plot
   - Lat/Long: vehicle_lat, vehicle_lng
   - Color: status

4. **KPI Cards**:
   - Total Patrullas
   - Patrullas Activas Ahora
   - Patrullas en Taller
   - Combustible Consumido (Mes)

### Dashboard 5: KPIs Operacionales

#### Fuentes de Datos
- Todas las tablas combinadas

#### Gráficos
1. **Response Time Promedio**: Big Number
   - Tipo: Big Number
   - Metric: AVG(response_time)
   - Dataset: incidents

2. **Arrestos por Turno**: Bar Chart
   - Tipo: Grouped Bar Chart
   - Dimension: shift_type
   - Metric: COUNT(arrests)

3. **Eficiencia Operacional**: Gauge Chart
   - Tipo: Gauge
   - Metric: (resolved_incidents / total_incidents) * 100

4. **KPI Cards**:
   - Incidentes Reportados (Hoy)
   - Incidentes Resueltos (Hoy)
   - Tasa de Resolución (%)
   - Tiempo Promedio de Respuesta

---

## 🔄 Actualización de Datos

### Refresh Automático de Dashboards

Configurar cache timeout para cada dashboard:

1. Ir a **Dashboards** → **Edit Dashboard**
2. Click en **...** → **Force Refresh**
3. Configurar cache TTL:
   - Dashboards de Tiempo Real: 30 segundos
   - Dashboards Operacionales: 5 minutos
   - Dashboards Estadísticos: 1 hora

### Scheduled Reports

Automatizar envío de reports por email:

1. Ir a **Reports** → **+ Report**
2. Configurar:
   - **Name**: "Reporte Diario de Operaciones"
   - **Dashboard**: Seleccionar dashboard
   - **Recipients**: emails de administradores
   - **Schedule**: Every day at 8:00 AM
   - **Format**: PDF
   - **Format Options**: Landscape orientation

---

## 🔐 Seguridad y Permisos

### Row-Level Security (RLS)

Configurar RLS por corporación en Superset:

```python
# En SQL Lab, ejecutar:

-- Crear tabla de usuarios de Superset
CREATE TABLE superset_users (
  superset_user_id INTEGER PRIMARY KEY,
  corporation_id UUID NOT NULL
);

-- Insertar mapeo de usuarios
INSERT INTO superset_users (superset_user_id, corporation_id)
VALUES 
  (1, 'corporation-a-uuid'),
  (2, 'corporation-b-uuid');

-- Crear función para aplicar RLS
CREATE OR REPLACE FUNCTION apply_superset_rls()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config(
    'app.current_corporation_id',
    (SELECT corporation_id FROM superset_users WHERE superset_user_id = current_user_id())::TEXT,
    TRUE
  );
END;
$$ LANGUAGE plpgsql;
```

### Roles y Permisos

1. **Admin Nacional**: Acceso a todos los datos
2. **Admin Estatal**: Solo datos de su corporación
3. **Comandante**: Solo datos de su estación
4. **Oficial**: Solo view, no edit

---

## 📱 Embedding Dashboards en Next.js

### Opción 1: Iframe

```tsx
// /src/app/(dashboard)/analytics/page.tsx

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      <iframe
        src="http://localhost:8088/superset/dashboard/1/?standalone=true"
        className="w-full h-screen border-0"
        title="Superset Dashboard"
      />
    </div>
  );
}
```

### Opción 2: Superset Embedded SDK (Recomendado)

```bash
npm install @superset-ui/embedded-sdk
```

```tsx
// /src/app/(dashboard)/analytics/page.tsx

'use client';

import { useEffect, useRef } from 'react';
import { embeddedDashboard } from '@superset-ui/embedded-sdk';

export default function AnalyticsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    embeddedDashboard({
      id: '1', // Dashboard ID
      supersetDomain: 'http://localhost:8088',
      mountPoint: containerRef.current!,
      fetchGuestToken: async () => {
        const response = await fetch('/api/superset/guest-token');
        return await response.json();
      },
      dashboardConfig: {
        hideTitle: true,
        hideTab: true,
        filters: {
          expanded: true,
        },
      },
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <div ref={containerRef} className="w-full h-screen" />
    </div>
  );
}
```

---

## 🚀 Próximos Pasos

1. ✅ Instalar Superset (Docker o Local)
2. ✅ Conectar a PostgreSQL del sistema
3. ✅ Configurar Row-Level Security
4. ✅ Crear los 5 dashboards principales
5. ✅ Configurar scheduled reports
6. ✅ Embed dashboards en Next.js
7. ✅ Configurar refresh automático

---

## 📚 Recursos Adicionales

- [Apache Superset Documentation](https://superset.apache.org/docs/)
- [Superset Docker Compose](https://github.com/apache/superset/blob/master/Dockerfile)
- [Row-Level Security Guide](https://superset.apache.org/docs/security/)
- [Dashboard Embedding](https://superset.apache.org/docs/security/)

---

**¿Listo para visualizar tus datos como nunca antes?** 🚀
