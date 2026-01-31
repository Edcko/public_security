# Monitoring & Alerting Setup Guide

## Overview

Este proyecto incluye monitoreo completo con Prometheus y alertas configurables.

## Stack de Monitoreo

- **Prometheus**: Recolección de métricas
- **Grafana**: Visualización de dashboards
- **AlertManager**: Gestión de alertas (opcional)
- **Slack/Email**: Canales de notificación

---

## 1. Configuración de Prometheus

### Instalación

#### Linux/Mac:
```bash
# Descargar Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.darwin-amd64.tar.gz
tar xvfz prometheus-2.45.0.darwin-amd64.tar.gz
cd prometheus-2.45.0.darwin-amd64
```

#### Docker:
```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### Configuración (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - 'alerts.yml'

scrape_configs:
  # Security Dashboard App
  - job_name: 'security-dashboard'
    static_configs:
      - targets: ['localhost:3000'] # Ajustar al puerto de tu app
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### Reglas de Alerta (`alerts.yml`)

```yaml
groups:
  - name: security_alerts
    interval: 30s
    rules:
      # Alta tasa de errores
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) /
          rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # Uso elevado de CPU
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"

      # Alta latencia de BD
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95,
            rate(db_query_duration_seconds_bucket[5m])
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries"
          description: "95th percentile latency is {{ $value }}s"

      # Fallo de conexión a BD
      - alert: DatabaseDown
        expr: up{job="security-dashboard"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          description: "Database has been down for more than 1 minute"

      # Memoria alta
      - alert: HighMemoryUsage
        expr: |
          memory_usage_bytes / (1024*1024*1024) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}GB"
```

### Iniciar Prometheus

```bash
# Con configuración personalizada
./prometheus --config.file=prometheus.yml

# Acceder a la UI de Prometheus
open http://localhost:9090
```

---

## 2. Configuración de Grafana

### Instalación

#### Docker (Recomendado):
```bash
docker run -d \
  --name grafana \
  -p 3001:3000 \
  --user "$(id -u):$(id -g)" \
  -v /path/to/grafana/data:/var/lib/grafana \
  grafana/grafana
```

#### Linux/Mac:
```bash
# Descargar e instalar
wget https://dl.grafana.com/oss/release/grafana-10.0.0.darwin-amd64.tar.gz
tar -zxvf grafana-10.0.0.darwin-amd64.tar.gz
cd grafana-10.0.0
./bin/grafana-server web
```

### Configurar Data Source de Prometheus

1. Acceder a Grafana: `http://localhost:3001`
2. Login default: `admin` / `admin`
3. Ir a **Configuration → Data Sources → Add data source**
4. Seleccionar **Prometheus**
5. Configurar:
   - **Name**: Prometheus
   - **URL**: `http://localhost:9090`
6. Click en **Save & Test**

### Importar Dashboard

Crea un nuevo dashboard con las siguientes queries:

#### Panel 1: Request Rate (Grafica)
```yaml
Title: HTTP Request Rate
Type: Graph
Query: rate(http_requests_total[5m])
Legend: {{method}} {{route}}
```

#### Panel 2: Error Rate (Grafica)
```yaml
Title: Error Rate % (5m)
Type: Stat
Query: |
  sum(rate(http_requests_total{status=~"5.."}[5m])) /
  sum(rate(http_requests_total[5m])) * 100
```

#### Panel 3: Response Time (Heatmap)
```yaml
Title: Request Duration
Type: Heatmap
Query: rate(http_request_duration_seconds_bucket[5m])
```

#### Panel 4: Database Query Duration (Grafica)
```yaml
Title: DB Query Duration (p95)
Type: Graph
Query: |
  histogram_quantile(0.95,
    rate(db_query_duration_seconds_bucket[5m])
  )
```

#### Panel 5: Active Users (Gauge)
```yaml
Title: Active Users
Type: Stat
Query: active_users
```

#### Panel 6: Memory Usage (Grafica)
```yaml
Title: Memory Usage
Type: Graph
Query: memory_usage_bytes / (1024*1024*1024)
Unit: Gigabytes
```

---

## 3. Configuración de Alertas

### Variables de Entorno

Agrega a tu `.env.local`:

```bash
# Slack Webhook (obtener de Slack App settings)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts
SLACK_USERNAME=Security Bot
SLACK_ICON_EMOJI=:rotating_light:

# Email SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=alerts@security.local
EMAIL_TO=admin@example.com,ops@example.com

# Webhook genérico (opcional)
ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

### Obtener Slack Webhook URL

1. Ir a https://api.slack.com/apps
2. Crear nueva app → "From scratch"
3. Ir a "Incoming Webhooks"
4. Toggle "Activate Incoming Webhooks"
5. Click "Add New Webhook to Workspace"
6. Seleccionar canal y copiar URL

### Enviar Alertas Manualmente

```typescript
import { alerts } from '@/shared/monitoring/alert.service';

// Alerta crítica
await alerts.securityThreat(
  'Intrusión Detectada',
  'Múltiples intentos de login fallidos detectados',
  { userId: '123', attempts: 5, ip: '192.168.1.1' }
);

// Alerta de warning
await alerts.highCPUUsage(85.5);

// Alerta de API
await alerts.slowResponseTime('/api/reports', 2500);
```

---

## 4. Métricas Disponibles

### Contadores (Counters)
- `http_requests_total` - Total de requests HTTP
- `db_query_total` - Total de queries a BD
- `auth_failures_total` - Total de fallos de autenticación

### Gauges
- `active_users` - Usuarios activos actuales
- `pending_requests` - Requests pendientes
- `database_connections` - Conexiones a BD activas
- `cpu_usage_percent` - Porcentaje de CPU
- `memory_usage_bytes` - Memoria usada en bytes
- `disk_usage_bytes` - Disco usado en bytes

### Histograms
- `http_request_duration_seconds` - Duración de requests HTTP
- `db_query_duration_seconds` - Duración de queries a BD
- `response_size_bytes` - Tamaño de respuestas HTTP

---

## 5. Health Checks

### Endpoints Disponibles

```
GET /api/health          - Health check completo
GET /api/health/ready    - Readiness probe
GET /api/health/live     - Liveness probe
GET /metrics             - Métricas Prometheus
```

### Ejemplo de Response

```json
{
  "status": "healthy",
  "timestamp": "2025-01-30T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "memory": {
      "status": "healthy",
      "heapUsed": "128.45 MB",
      "heapTotal": "256.00 MB",
      "percent": "50.17"
    }
  }
}
```

---

## 6. Docker Compose Completo

Para desplegar todo el stack de monitoreo:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  grafana-storage:
```

Ejecutar:
```bash
docker-compose up -d prometheus grafana alertmanager
```

---

## 7. Troubleshooting

### Prometheus no scrapea métricas
- Verificar que `/metrics` retorna datos: `curl http://localhost:3000/metrics`
- Revisar logs de Prometheus: `docker logs prometheus`
- Verificar configuración en `prometheus.yml`

### Grafana no muestra datos
- Verificar que el data source esté conectado
- Chequear el rango de tiempo seleccionado
- Probar la query en el "Explore" de Grafana

### Alertas no llegan a Slack
- Verificar que `SLACK_WEBHOOK_URL` esté correcta
- Testear el webhook manualmente:
  ```bash
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"Test message"}'
  ```

---

## 8. Recursos

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Slack API - Incoming Webhooks](https://api.slack.com/messaging/webhooks)
