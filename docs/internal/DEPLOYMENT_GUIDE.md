# 🚀 Production Deployment Guide

## Pre-Production Checklist

### Security Hardening

- [ ] Penetration test completado (herramientas: OWASP ZAP, Burp Suite)
- [ ] Dependencias auditadas (`npm audit fix`)
- [ ] Variables de entorno configuradas en producción
- [ ] HTTPS obligatorio (TLS 1.3)
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] SQL injection prevention (Drizzle ORM ya lo maneja)
- [ ] XSS prevention (input sanitization)

### Performance Optimization

- [ ] Load testing con 5,000+ usuarios concurrentes
- [ ] Database indexing optimizado
- [ ] Redis caching habilitado
- [ ] CDN configurado (Vercel/Cloudflare)
- [ ] Imágenes optimizadas
- [ ] Code splitting optimizado
- [ ] Database connection pooling (PgBouncer)

### Database Backup

- [ ] Backups automatizados configurados (diario)
- [ ] Backups encriptados (AES-256)
- [ ] Retención de backups: 90 días
- [ ] Restore testing completado
- [ ] Off-site backup (S3 Glacier)

### Monitoring & Alerts

- [ ] Prometheus + Grafana dashboard
- [ ] Application logging (Winston, Pino)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Alertas configuradas (email, Slack, PagerDuty)

---

## Deployment Options

### Option A: Vercel (Recomendado para Next.js)

#### Pros
- ✅ Zero config deployment
- ✅ CDN global incluido
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Edge functions

#### Steps

1. **Configurar Variables de Entorno en Vercel**
   ```bash
   # En Vercel Dashboard
   DATABASE_URL=postgresql://user:pass@host:5432/db
   REDIS_URL=redis://host:6379
   JWT_SECRET=your-production-secret
   MAPBOX_ACCESS_TOKEN=your-token
   ```

2. **Deploy con Vercel CLI**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Configurar Custom Domain**
   - Agregar dominio en Vercel Dashboard
   - Configurar DNS apuntando a Vercel

4. **Setup PostgreSQL**
   - Usar Vercel Postgres (recomendado) o NeonDB
   - O hacer connection a PostgreSQL propio

5. **Setup Redis**
   - Usar Upstash Redis (recomendado)
   - O Redis Cloud (AWS)

### Option B: AWS (Más control)

#### Infrastructure

1. **ECS Fargate** (Contenedores)
2. **RDS PostgreSQL** (Multi-AZ)
3 **ElastiCache** (Redis)
4 **S3** (Storage)
5 **CloudFront** (CDN)
6 **Route53** (DNS)
7 **ALB** (Load Balancer)

#### Deploy con Docker

```bash
# Build Docker image
docker build -t public-security .

# Tag para ECR
docker tag public-security:latest <ecr-repo-url>

# Push a ECR
docker push <ecr-repo-url>:latest
```

#### Terraform Infrastructure

```hcl
# infrastructure/main.tf
terraform {
  source = "hashicorp/aws"
  version = "~> 5.0"
}

resource "aws_ecs_service" "app" {
  name            = "public-security"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.app.id
  }
}
```

### Option C: Azure (Gobierno México)

#### Services

- **Azure Kubernetes Service (AKS)**
- **Azure Database for PostgreSQL**
- **Azure Cache for Redis**
- **Azure Blob Storage**
- **Azure Front Door** (CDN)
- **Azure Key Vault** (Secrets)

#### Ventajas para Gobierno

- ✅ Cumplimiento de datos en territorio nacional
- ✅ FedRAMP authorization
- ✅ Azure Government Cloud

---

## Environment Variables for Production

```bash
# Database
DATABASE_URL=<production-postgres-url>
POSTGRES_POOL_SIZE=20

# Redis
REDIS_URL=<production-redis-url>

# JWT
JWT_SECRET=<super-secure-random-64-char-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Mapbox
MAPBOX_ACCESS_TOKEN=<mapbox-token>

# APIs Mexicanas
VERIFICAMEX_API_KEY=<key>
LLAVEMX_API_KEY=<key>

# SAFR (opcional)
SAFR_API_KEY=<key>

# Application
NODE_ENV=production
APP_URL=https://seguridadpublica.gob.mx
NEXT_PUBLIC_APP_URL=https://seguridadpublica.gob.mx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<password>
SMTP_FROM=noreply@seguridadpublica.gob.mx

# AWS S3 (si se usa)
AWS_S3_BUCKET=public-security-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>

# Sentry (error tracking)
SENTRY_DSN=<sentry-dsn>
```

---

## Load Testing Script

```javascript
// load-test.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  vus: 5000, // 5,000 usuarios concurrentes
  duration: '30m',
};

export default function () {
  // Test login
  const loginRes = http.post('http://localhost:3000/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nacional.mx',
      password: 'Admin123!',
    }),
  });

  check(loginRes.status, 200);

  const token = loginRes.json('data.accessToken');

  // Test personnel list
  const listRes = http.get('http://localhost:3000/api/personnel', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(listRes.status, 200);

  // Sleep entre requests (think time)
  sleep(1);
};
```

Run con:
```bash
k6 run load-test.js
```

---

## Security Audit Commands

```bash
# Scan de vulnerabilidades
npm audit

# Verificar dependencias outdated
npm outdated

# Test de SQL injection (manual)
# Ya prevenido por Drizzle ORM

# Test de XSS
# Input sanitization en todos los endpoints
```

---

## Continuous Deployment Pipeline

### GitHub Actions Production Workflow

```yaml
name: Production Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run test
          npm run test:e2e

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run database migrations
        run: npm run db:migrate

      - name: Notify success
        if: success()
        run: |
          echo "Deployment successful!"
          # Enviar notificación a Slack, etc.
```

---

## Monitoring Setup

### Prometheus + Grafana

```yaml
# docker-compose-monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: password
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
```

### Key Metrics to Monitor

- **Application**: Response time, Error rate, Request rate
- **Database**: Connection pool, Query time, Deadlocks
- **Redis**: Memory usage, Hit rate, Connections
- **WebSocket**: Active connections, Message rate
- **System**: CPU, Memory, Disk I/O

---

## Disaster Recovery Plan

### Backup Strategy

1. **Daily Backups**: Automatizados a las 3:00 AM CST
2. **Retention**: 90 días en S3 Glacier
3. **RTO**: 4 horas (Recovery Time Objective)
4. **RPO**: 1 hora (Recovery Point Objective)

### Failover Plan

1. **Primary Region**: us-east-1
2. **Backup Region**: west-2 (read replica)
3. **DNS Failover**: Route53 health checks
4. **Load Balancer**: Active-passive failover

---

## Post-Deployment Verification

### Checklist

#### Functionality
- [ ] Login/logout funciona
- [ ] Multi-tenancy aísla correctamente
- [ ] Audit logs se registran
- [ ] GPS tracking recibe datos
- [ ] Reports se generan correctamente

#### Performance
- [ ] API response < 200ms (p95)
- [ ] Database queries < 100ms (p95)
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

#### Security
- [ ] All APIs require authentication
- [ ] RLS policies activas
- [ ] HTTPS enforced
- [ ] No sensitive data in logs
- [ ] Rate limiting funciona

---

## Contact & Support

**Technical Lead**: [Your Name]
**Email**: soporte@seguridadpublica.gob.mx
**Emergency**: [Phone Number]

---

**¡SISTEMA LISTO PARA PRODUCCIÓN! 🇲🇽🚀**
