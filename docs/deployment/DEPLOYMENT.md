# Deployment a Producción - Guía Completa

## 🚀 Estrategia de Deployment

### Opción 1: VPS (Recomendado para Mexico)
- Proveedor: DigitalOcean, Linode, Hetzner
- Costo: $20-50/mes
- Especificaciones: 4 CPU, 8GB RAM, 160GB SSD
- Ubicacion: Mexico City

### Opcion 2: Cloud Platform (Enterprise)
- Proveedor: AWS, Azure, GCP
- Costo: $100-500/mes
- Especificaciones: Variable

---

## 📋 Prerrequisitos

- [ ] Codigo subido a GitHub
- [ ] Environment variables configuradas
- [ ] Base de datos PostgreSQL lista
- [ ] Redis configurado
- [ ] Dominio comprado
- [ ] SSL Certificate listo (Let's Encrypt)

---

## 🔧 Paso 1: Preparar Servidor (VPS)

### Instalar Docker

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Habilitar Docker
systemctl enable docker
systemctl start docker
```

### Configurar Firewall

```bash
# Configurar UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🗄️ Paso 2: Configurar Base de Datos

### Crear Docker Compose para Produccion

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: public_security
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    restart: always

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://admin:password@postgres:5432/public_security
      REDIS_URL: redis://:@redis:6379
      JWT_SECRET: your-jwt-secret
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
    restart: always

volumes:
  postgres_data:
  redis_data:
```

---

## 🔒 Paso 3: Configurar SSL

### Instalar Certbot

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificate
certbot --nginx -d tu-dominio.com
```

---

## 📦 Paso 4: Deploy

### Construir y Levantar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/public-security.git
cd public-security

# Levantar contenedores
docker-compose up -d --build

# Verificar logs
docker-compose logs -f app
```

---

## ✅ Verificar Deployment

```bash
# Health check
curl https://tu-dominio.com/api/health

# Verificar contenedores
docker ps

# Verificar recursos
docker stats
```

---

## 🔄 CI/CD con GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: SERVER_HOST
          username: deploy
          key: SSH_PRIVATE_KEY
          script: |
            cd /home/deploy/public-security
            git pull origin main
            docker-compose up -d --build
```

---

## 📊 Monitoring

Instalar Prometheus + Grafana para monitorear:
- CPU, Memory usage
- Response times
- Database connections
- Error rates

---

## 🔐 Security Hardening

1. Fail2Ban para SSH
2. Automatic security updates
3. Regular security audits
4. Log aggregation

---

**¿Listo para deploy?** 🚀
