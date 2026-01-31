# Guía de Deployment - Producción

## 📋 Resumen

Esta guía detalla el deployment del **Sistema Nacional de Gestión Policial** en un VPS de DigitalOcean.

---

## 🏦 Requisitos Previos

### Servidor (DigitalOcean VPS)

- **Mínimo**: 4GB RAM, 2 vCPUs, 80GB SSD
- **Recomendado**: 8GB RAM, 4 vCPUs, 160GB SSD
- **OS**: Ubuntu 22.04 LTS o superior
- **Dominio**: Nombre de dominio configurado con DNS A record apuntando a la IP del VPS

### Software Local

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+
- Git
- SSH client

---

## 🚀 Paso 1: Preparar el Servidor

### 1.1 Conectar al VPS

```bash
ssh root@tu-vps-ip
```

### 1.2 Actualizar el sistema

```bash
apt update && apt upgrade -y
```

### 1.3 Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 1.4 Crear usuario para deployment (OPCIONAL pero recomendado)

```bash
# Crear usuario
adduser deploy

# Dar permisos sudo
usermod -aG sudo deploy
usermod -aG docker deploy

# Configurar SSH keys
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 1.5 Configurar Firewall

```bash
# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activar firewall
ufw enable
```

---

## 📦 Paso 2: Preparar el Proyecto

### 2.1 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/public-security.git
cd public-security
```

### 2.2 Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.production.example .env.production

# Editar con valores reales
nano .env.production
```

**Variables CRÍTICAS que debes cambiar:**

```env
# Database - USAR CONTRASEÑAS FUERTES
DB_PASSWORD=su_contraseña_aquí

# JWT - GENERAR UNA CLAVE SEGURA
JWT_SECRET=generar_con_openssl_rand_base64_32

# Redis
REDIS_PASSWORD=otra_contraseña_segura

# RabbitMQ
RABBITMQ_PASSWORD=otra_contraseña_segura

# Mapbox
MAPBOX_ACCESS_TOKEN=tu_token_de_mapbox

# APIs Mexicanas (si tienes)
VERIFICAMEX_API_KEY=tu_api_key
LLAVE_MX_API_KEY=tu_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_WS_URL=wss://tu-dominio.com
```

### 2.3 Generar SSL Certificates (Let's Encrypt)

```bash
# Instalar certbot
apt install certbot -y

# Generar certificados
certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Certificados se guardan en:
# /etc/letsencrypt/live/tu-dominio.com/fullchain.pem -> cert.pem
# /etc/letsencrypt/live/tu-dominio.com/privkey.pem -> key.pem

# Copiar certificados al proyecto
mkdir -p docker/ssl
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem docker/ssl/key.pem
```

---

## 🚢 Paso 3: Deployment

### 3.1 Usar el script de deployment automatizado

```bash
# Desde tu máquina local
./scripts/deploy.sh production
```

**El script hace:**
1. Build local de la aplicación
2. Backup de archivos en el servidor
3. Copia de archivos vía rsync
4. Build de Docker image en servidor
5. Restart de contenedores
6. Health check de la aplicación

### 3.2 O deployment manual

```bash
# Copiar archivos al servidor
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  . root@tu-vps-ip:/var/www/public-security/

# Conectar al servidor
ssh root@tu-vps-ip

# Navegar al directorio
cd /var/www/public-security

# Iniciar contenedores
docker-compose -f docker/docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker/docker-compose.prod.yml logs -f
```

---

## ✅ Paso 4: Verificación

### 4.1 Verificar que todos los contenedores estén corriendo

```bash
docker-compose -f docker/docker-compose.prod.yml ps
```

**Deberías ver:**
- ✓ public_security_db (PostgreSQL)
- ✓ public_security_redis (Redis)
- ✓ public_security_mq (RabbitMQ)
- ✓ public_security_pgbouncer (PgBouncer)
- ✓ public_security_app (Next.js)
- ✓ public_security_nginx (Nginx)

### 4.2 Verificar health check

```bash
curl http://localhost:3000/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-29T..."
}
```

### 4.3 Verificar endpoints

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Verificar respuesta (debe ser 401 si no existe usuario, pero el endpoint responde)
```

### 4.4 Verificar logs

```bash
# Logs de todos los servicios
docker-compose -f docker/docker-compose.prod.yml logs -f

# Logs de un servicio específico
docker-compose -f docker/docker-compose.prod.yml logs -f app

# Logs de PostgreSQL
docker-compose -f docker/docker-compose.prod.yml logs -f postgres
```

---

## 📊 Paso 5: Configurar Monitoreo (Opcional pero Recomendado)

### 5.1 Instalar Prometheus + Grafana

```bash
# Crear docker-compose.override.yml para monitoreo
cat > docker/docker-compose.monitoring.yml <<EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"

volumes:
  prometheus_data:
  grafana_data:
EOF

# Incluir en deployment
docker-compose -f docker/docker-compose.prod.yml -f docker/docker-compose.monitoring.yml up -d
```

### 5.2 Configurar Uptime Monitoring

Usar servicios externos como:
- UptimeRobot (gratis)
- Pingdom
- StatusCake

---

## 🔄 Paso 6: Mantenimiento

### 6.1 Actualizar la aplicación

```bash
# En el servidor
cd /var/www/public-security

# Pull de cambios
git pull origin main

# Rebuild y restart
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### 6.2 Backups

**Base de datos:**
```bash
# Backup manual
docker-compose -f docker/docker-compose.prod.yml exec postgres \
  pg_dump -U admin public_security > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose -f docker/docker-compose.prod.yml exec -T postgres \
  psql -U admin public_security < backup_20240129.sql
```

**Automatizar backups (cron job):**
```bash
# Agregar al crontab
crontab -e

# Backup diario a las 3 AM
0 3 * * * cd /var/www/public-security && docker-compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U admin public_security > /backups/db_$(date +\%Y\%m\%d).sql
```

### 6.3 Logs Rotation

Docker hace logs rotation automáticamente, pero configurar tamaño máximo:

```yaml
# En docker-compose.prod.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🔒 Paso 7: Seguridad

### 7.1 Actualizar SSL automáticamente (Let's Encrypt)

```bash
# Crear script de renew
cat > /usr/local/bin/renew-ssl.sh <<EOF
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem /var/www/public-security/docker/ssl/cert.pem
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem /var/www/public-security/docker/ssl/key.pem
cd /var/www/public-security
docker-compose -f docker/docker-compose.prod.yml restart nginx
EOF

chmod +x /usr/local/bin/renew-ssl.sh

# Agregar al crontab (renovar mensualmente)
0 0 1 * * /usr/local/bin/renew-ssl.sh
```

### 7.2 Security Best Practices

- ✓ Usar contraseñas fuertes (mínimo 32 caracteres)
- ✓ Rotar credenciales cada 90 días
- ✓ Mantener el sistema actualizado (`apt update && apt upgrade`)
- ✓ Configurar rate limiting en Nginx (ya incluido)
- ✓ Usar firewall (UFW)
- ✓ Deshabilitar login por password, solo SSH keys
- ✓ Monitorear logs regularmente
- ✓ Configurar alerts de errores y accesos sospechosos

---

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs**: `docker-compose logs -f`
2. **Verificar contenedores**: `docker ps -a`
3. **Verificar recursos**: `htop`, `df -h`, `free -m`
4. **Reiniciar servicios**: `docker-compose restart`

---

## ✨ Checklist Pre-Deployment

- [ ] Servidor configurado (Docker, Docker Compose)
- [ ] Dominio configurado con DNS
- [ ] SSL certificates generados
- [ ] Variables de entorno configuradas
- [ ] Build local exitoso
- [ ] Firewall configurado
- [ ] Backups automatizados configurados
- [ ] Monitoreo configurado
- [ ] Documentation actualizada

---

## 🎉 ¡Listo!

Tu sistema está deployado en producción.

**URLs:**
- 🌐 App: `https://tu-dominio.com`
- 📊 Grafana: `https://tu-dominio.com:3001`
- 🐰 RabbitMQ Management: `https://tu-dominio.com:15672`

**Credenciales iniciales:**
- Grafana: admin / admin (CAMBIAR DESPUÉS DEL PRIMER LOGIN)
- RabbitMQ: Ver variables de entorno
