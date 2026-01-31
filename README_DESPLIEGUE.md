# 🚀 INSTRUCCIONES DE DESPLIEGUE A PRODUCCIÓN

## Para el siguiente Claude Code en el servidor

---

## ⚡ QUICK START (5 minutos)

Si todo está configurado, solo ejecutar:

```bash
./scripts/deploy-production.sh
```

---

## 📋 PASOS COMPLETOS

### 1. Verificar requisitos

```bash
docker --version        # Docker 24+
docker-compose --version  # Docker Compose 2.20+
free -h                 # Mínimo 8GB RAM
df -h                   # Mínimo 50GB disco
```

### 2. Copiar proyecto al servidor

```bash
# Opción A: Desde repositorio
git clone <repo> && cd public_security

# Opción B: Desde local
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /local/path/ user@server:/var/www/public_security/
```

### 3. Configurar variables de entorno

```bash
cp .env.production.example .env.production
nano .env.production
```

**⚠️ CAMBIAR OBLIGATORIAMENTE**:

```bash
# Generar con: openssl rand -base64 32
POSTGRES_PASSWORD=<GENERAR>
JWT_SECRET=<GENERAR>
JWT_REFRESH_SECRET=<GENERAR>
SESSION_SECRET=<GENERAR>
RABBITMQ_PASSWORD=<GENERAR>
GRAFANA_PASSWORD=<GENERAR>

# Tu cuenta AWS
AWS_ACCESS_KEY_ID=<tu_key>
AWS_SECRET_ACCESS_KEY=<tu_secret>

# Tu cuenta Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=<tu_token>
MAPBOX_PRIVATE_TOKEN=<tu_token>

# Tu SMTP
SMTP_USER=<tu_email>
SMTP_PASSWORD=<tu_app_password>
```

### 4. Dar permisos y crear directorios

```bash
chmod +x scripts/*.sh
mkdir -p backups logs docker/postgres
```

### 5. Desplegar

```bash
./scripts/deploy-production.sh
```

### 6. Verificar

```bash
./scripts/health-check.sh
```

Salida esperada: **"All services are healthy!"**

### 7. Configurar SSL (OBLIGATORIO para producción)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.gob.mx
```

### 8. Configurar backup automático

```bash
crontab -e
# Agregar: 0 2 * * * cd /var/www/public_security && ./scripts/backup-database.sh
```

---

## 🎯 VERIFICACIÓN FINAL

```bash
# [ ] Todos los servicios "Up"
docker-compose ps

# [ ] Health check pasa
./scripts/health-check.sh

# [ ] API responde
curl http://localhost:3000/api/health

# [ ] Login funciona
# Browser: http://localhost:3000
# Email: admin@seguridad.gob.mx
# Password: Admin123!
# CAMBIAR PASSWORD INMEDIATAMENTE

# [ ] SSL funciona
curl -I https://tu-dominio.gob.mx
```

---

## 🔄 Para actualizar en el futuro

```bash
git pull
./scripts/update-deployment.sh
```

Zero-downtime garantizado.

---

## 🆘 Problemas

```bash
# Ver logs
docker-compose logs -f app

# Reiniciar todo
docker-compose restart

# Ver health check
./scripts/health-check.sh
```

---

## ✅ CHECKLIST

- [ ] Docker instalado
- [ ] Proyecto en servidor
- [ ] .env.production configurado
- [ ] Scripts ejecutables
- [ ] `./scripts/deploy-production.sh` ✓
- [ ] `./scripts/health-check.sh` ✓
- [ ] Login funcional
- [ ] Password cambiado
- [ ] SSL configurado
- [ ] Backup automático
- [ ] Firewall configurado

---

**URL**: https://tu-dominio.gob.mx
**Admin**: admin@seguridad.gob.mx (CAMBIAR PASSWORD)

**Versión**: 1.0.0
**Fecha**: 30 Enero 2026
