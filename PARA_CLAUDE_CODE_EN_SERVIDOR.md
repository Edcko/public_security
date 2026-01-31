# 🤖 Hola Claude Code! (Para cuando estés en el servidor)

## Tu misión: Desplegar este proyecto en producción

---

## ⚡ COMANDO ÚNICO PARA DESPLEGAR

```bash
./scripts/deploy-production.sh
```

**Eso es todo.** El script hace todo automáticamente.

---

## 📋 Si algo falla, lee esto:

### Paso 1: Verificar requisitos
```bash
docker --version    # Debe ser 24+
docker-compose --version  # Debe ser 2.20+
free -h            # Mínimo 8GB RAM
df -h              # Mínimo 50GB disco
```

### Paso 2: Configurar variables
```bash
cp .env.production.example .env.production
nano .env.production

# CAMBIAR OBLIGATORIAMENTE:
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
RABBITMQ_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# Y configurar:
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
NEXT_PUBLIC_MAPBOX_TOKEN, MAPBOX_PRIVATE_TOKEN
SMTP_USER, SMTP_PASSWORD
```

### Paso 3: Dar permisos
```bash
chmod +x scripts/*.sh
mkdir -p backups logs docker/postgres
```

### Paso 4: Desplegar
```bash
./scripts/deploy-production.sh
```

### Paso 5: Verificar
```bash
./scripts/health-check.sh

# Debe decir: "All services are healthy!"
```

### Paso 6: Configurar SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.gob.mx
```

---

## ✅ CÓMO SABER QUE FUNCIONÓ

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
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

```bash
# Ver logs
docker-compose logs -f app

# Reiniciar todo
docker-compose restart

# Ver health check completo
./scripts/health-check.sh
```

---

## 📚 DOCUMENTACIÓN COMPLETA

- `README_DESPLIEGUE.md` - Guía rápida
- `DOCKER_COMPLETO_PRODUCCION.md` - Guía completa
- `DEPLOYMENT_GUIDE.md` - Troubleshooting detallado

---

## 🎯 LO QUE HACE EL SCRIPT

El `deploy-production.sh` hace automáticamente:
1. Verifica variables de entorno
2. Instala dependencias
3. Compila Next.js
4. Construye imagen Docker
5. Ejecuta migraciones
6. Inicia todos los servicios
7. Verifica health checks

**Tiempo**: ~10-15 minutos

---

## 🎉 RESULTADO FINAL

**App**: https://tu-dominio.gob.mx
**Admin**: admin@seguridad.gob.mx (CAMBIAR PASSWORD)

**Estado**: Production Ready

---

**Versión**: 1.0.0
**Fecha**: 30 Enero 2026

**¡Exitos con el despliegue!** 🚀
