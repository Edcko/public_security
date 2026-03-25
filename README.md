# 🚔 Sistema Nacional de Gestión Policial (México)

**Sistema integral de gestión para seguridad pública a nivel nacional** con múltiples corporaciones policiales.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentación](#documentación)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## ✨ Características

### Módulos Principales

- **🔐 Autenticación y Autorización**
  - JWT con refresh tokens
  - MFA (Multi-Factor Authentication)
  - RBAC jerárquico con Casbin
  - Row-Level Security (RLS) por corporación

- **👮 Gestión de Personal**
  - CRUD de policías
  - Expedientes digitales
  - Jerarquía de rangos
  - Búsqueda avanzada

- **🔫 Control de Armamento**
  - Inventario de armas
  - Control de municiones
  - Asignación a oficiales
  - Mantenimiento y servicing

- **🚨 Gestión de Vehículos**
  - Flota de patrullas
  - GPS tracking en tiempo real
  - Asignación a oficiales
  - Mantenimiento programado

- **📅 Gestión de Turnos**
  - Turnos y horarios
  - Check-in/check-out
  - Cálculo de horas extra
  - Nómina base

- **📇 Vitácora de Arrestos**
  - Registro de arrestos
  - Reportes de incidentes
  - Evidencias digitales

- **📊 Analytics y Reportes**
  - Dashboards interactivos
  - Generación de PDFs
  - Exportación a Excel/CSV
  - Estadísticas automáticas

- **🗺️ Mapas en Tiempo Real**
  - GPS tracking de patrullas
  - Mapas de calor
  - Alertas geográficas
  - Routing optimizado

### Características Técnicas

- ✅ **PWA Ready** - Instalable como app nativa
- ✅ **Offline Mode** - Funciona sin conexión
- ✅ **Responsive** - Mobile-first design
- ✅ **Multi-Tenancy** - Aislamiento por corporación
- ✅ **Real-Time** - WebSockets para actualizaciones en vivo
- ✅ **Type-Safe** - TypeScript strict mode
- ✅ **Tested** - 70%+ coverage

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **Lenguaje**: TypeScript 5.0
- **Estilos**: Tailwind CSS 4
- **State**: React Hooks + Context
- **PWA**: Service Workers + Manifest

### Backend
- **API**: Next.js API Routes
- **Validación**: Zod 3.22
- **Auth**: JWT (jose) + Casbin RBAC
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 16

### Infraestructura
- **Container**: Docker + Docker Compose
- **Caching**: Redis 7
- **Message Queue**: RabbitMQ (opcional)
- **WebSockets**: Socket.io

### Testing
- **Unit**: Vitest
- **E2E**: Playwright
- **Load**: k6

### DevOps
- **CI/CD**: GitHub Actions
- **Quality**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 App                           │
├─────────────────────────────────────────────────────────────┤
│  /src/modules (Dominios de Negocio - DDD)                  │
│    /authentication         ← AuthN/AuthZ con Casbin RBAC   │
│    /corporations          ← Corporaciones policiales        │
│    /personnel             ← Expedientes de policías         │
│    /inventory             ← Armamento y municiones         │
│    /vehicles              ← Gestión de patrullas            │
│    /incidents             ← Vitácora de arrestos            │
│    /shifts                ← Turnos y nómina                 │
│    /biometrics            ← Integración biométrica          │
│    /gis                   ← Mapas y GPS tracking            │
│    /reports               ← Analytics y dashboards         │
├─────────────────────────────────────────────────────────────┤
│  /src/shared (Utilidades compartidas)                      │
│    /database              ← PostgreSQL + RLS context        │
│    /authentication        ← JWT + Casbin RBAC service      │
│    /logging               ← Audit logger (LFPDPPP)          │
│    /validation            ← Zod schemas                     │
│    /middleware            ← Auth guard, error handler       │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy: PostgreSQL Row-Level Security

Estrategia: Una sola base de datos con aislamiento a nivel de fila.

```sql
-- Todas las tablas tienen corporation_id
ALTER TABLE personnel ADD COLUMN corporation_id UUID NOT NULL;

-- Activar RLS
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento
CREATE POLICY personnel_isolation ON personnel
  USING (corporation_id = current_setting('app.current_corporation_id')::UUID);
```

---

## 📦 Instalación

### Prerrequisitos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (opcional)

### Pasos

1. **Clonar repositorio**
```bash
git clone https://github.com/Edcko/public_security.git
cd public-security
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar environment variables**
```bash
cp .env.example .env.local
# Editar .env.local con tus configuraciones
```

4. **Levantar base de datos**
```bash
npm run docker:up
```

5. **Correr migraciones**
```bash
npm run db:setup
```

6. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

7. **Abrir navegador**
```
http://localhost:3000
```

---

## 💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Build
npm run build            # Build de producción
npm run start            # Inicia servidor de producción

# Quality
npm run lint             # Ejecuta ESLint
npm run lint:fix         # Corrige automáticamente
npm run format           # Formatea código con Prettier

# Testing
npm test                 # Unit tests
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # Playwright UI

# Database
npm run db:migrate       # Corre migraciones
npm run db:push          # Push schema a DB
npm run db:studio        # Abre Drizzle Studio
npm run db:generate      # Genera migraciones
npm run db:reset         # Resetea base de datos

# Docker
npm run docker:up        # Levanta contenedores
npm run docker:down      # Detiene contenedores
npm run docker:logs      # Ver logs
```

### Estructura de Directorios

```
public-security/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # Route group para dashboard
│   │   │   ├── dashboard/
│   │   │   ├── personnel/
│   │   │   ├── inventory/
│   │   │   ├── vehicles/
│   │   │   ├── shifts/
│   │   │   ├── reports/
│   │   │   └── map/
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   │
│   ├── modules/                # Módulos de negocio
│   │   ├── authentication/
│   │   ├── corporations/
│   │   ├── personnel/
│   │   ├── inventory/
│   │   ├── vehicles/
│   │   ├── incidents/
│   │   ├── shifts/
│   │   ├── biometrics/
│   │   ├── gis/
│   │   └── reports/
│   │
│   ├── shared/                 # Utilidades compartidas
│   │   ├── database/
│   │   ├── authentication/
│   │   ├── logging/
│   │   ├── validation/
│   │   └── middleware/
│   │
│   ├── hooks/                  # Custom React hooks
│   └── test/                   # Test setup
│
├── tests/                      # Tests
│   ├── unit/                   # Unit tests
│   ├── e2e/                    # E2E tests
│   └── load/                   # Load tests
│
├── docs/                       # Documentación
│   ├── architecture.md
│   ├── api-documentation.md
│   ├── deployment/
│   ├── security/
│   └── analytics/
│
├── public/                     # Archivos estáticos
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
│
├── docker-compose.yml
├── Dockerfile.prod
├── nginx.conf
├── next.config.ts
├── package.json
└── README.md
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Ejecutar todos los tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# UI
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Ejecutar todos los tests
npm run test:e2e

# UI mode
npm run test:e2e:ui

# Tests específicos
npx playwright test personnel
```

### Load Tests (k6)

```bash
# Test seguro para desarrollo local (10 usuarios)
k6 run tests/load/light-load-test.js

# Test con 50 usuarios
k6 run --vus 50 --duration 5m tests/load/light-load-test.js
```

---

## 🚀 Deployment

### Desarrollo

```bash
npm run dev
```

### Producción

Ver guía completa: [Deployment Guide](./docs/deployment/DEPLOYMENT.md)

```bash
# Build
npm run build

# Start
npm run start
```

### Docker

```bash
# Build image
docker build -f Dockerfile.prod -t security-app .

# Run container
docker run -p 3000:3000 security-app
```

### DigitalOcean (VPS)

1. Crear droplet
2. SSH al servidor
3. Clonar repositorio
4. Configurar environment variables
5. Levantar con Docker Compose
6. Configurar SSL con Certbot

Ver guía completa: [Production Deployment](./docs/deployment/DEPLOYMENT.md)

---

## 📚 Documentación

- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api-documentation.md)
- [Deployment Guide](./docs/deployment/DEPLOYMENT.md)
- [Security Audit](./docs/security/SECURITY_AUDIT_CHECKLIST.md)
- [Apache Superset Setup](./docs/analytics/README_SUPERSET.md)
- [Load Testing Guide](./docs/load-testing/README.md)

---

## 🔒 Seguridad

### Características de Seguridad

- ✅ Row-Level Security (RLS) en PostgreSQL
- ✅ JWT con expiración corta (15 min) + refresh tokens (7 días)
- ✅ MFA para administradores
- ✅ Password hashing con bcrypt (cost 12)
- ✅ Rate limiting en todos los endpoints
- ✅ CORS configurado correctamente
- ✅ Security headers (HSTS, X-Frame-Options, CSP)
- ✅ Input sanitization con Zod
- ✅ SQL Injection protection (prepared statements)
- ✅ XSS protection
- ✅ CSRF protection

### Compliance

- ✅ **LFPDPPP** - Ley Federal de Protección de Datos Personales
- ✅ **LGPDPPSO** - Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados
- ✅ **OWASP Top 10** - Mitigaciones implementadas

### Security Audit

Ver checklist completo: [Security Audit Checklist](./docs/security/SECURITY_AUDIT_CHECKLIST.md)

---

## 🤝 Contribución

Contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: add some amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Conventional Commits

```
feat: nueva funcionalidad
fix: bug fix
docs: documentación
style: formato, estilo
refactor: refactorización
test: tests
chore: mantenimiento
```

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👥 Autores

- **Misael Rosas Carballo** - *Desarrollo inicial* - [GitHub](https://github.com/Edcko)

---

## 🙏 Agradecimientos

- Next.js team por el excelente framework
- Comunidades de código abierto
- Documentación de PostgreSQL, Casbin, y Drizzle

---

## 📞 Soporte

Para soporte, abre un issue en este repositorio.

---

**¿Listo para usar el sistema?** 🚀

[📖 Ver Documentación](./docs/) | [🚀 Deploy a Producción](./docs/deployment/DEPLOYMENT.md) | [🔒 Security Audit](./docs/security/SECURITY_AUDIT_CHECKLIST.md)
