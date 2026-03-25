# 🚀 DESPLIEGUE A PRODUCCIÓN - INSTRUCCIONES COMPLETAS
## Para el próximo Claude Code en el servidor

---

## 🎯 MISIÓN

Este documento contiene **TODAS las instrucciones** necesarias para que el siguiente Claude Code despliegue el sistema en producción sin necesidad de consultar nada más.

---

## 📋 PASO 1: VERIFICAR REQUISITOS

### Ejecutar estos comandos en el servidor:

```bash
# Verificar Docker instalado
docker --version
# Debe mostrar: Docker version 24.0+

# Verificar Docker Compose
docker-compose --version
# Debe mostrar: Docker Compose version 2.20+

# Verificar memoria disponible
free -h
# Mínimo: 8GB, Recomendado: 16GB

# Verificar espacio en disco
df -h
# Mínimo: 50GB disponibles
```

**Si algo falta, instalar:**

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 📋 PASO 2: PREPARAR EL PROYECTO

### Si vienes del repositorio:

```bash
# Clonar
git clone <repositorio>
cd public_security

# Crear directorios necesarios
mkdir -p backups logs docker/postgres
```

### Si copias los archivos localmente:

```bash
# Desde tu máquina local
rsync -avz --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  /Users/misael/Documents/Projects/public_security/ \
  user@server:/var/www/public_security/

# En el servidor
cd /var/www/public_security
mkdir -p backups logs docker/postgres
```

---

## 📋 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### Copiar y editar el archivo de entorno:

```bash
cp .env.production.example .env.production
nano .env.production
```

### ⚠️ CAMBIAR OBLIGATORIAMENTE ESTOS VALORES:

```bash
# Generar passwords únicos con:
openssl rand -base64 32

# Y reemplazar en .env.production:
POSTGRES_PASSWORD=<password generado>
JWT_SECRET=<password generado>
JWT_REFRESH_SECRET=<password generado>
SESSION_SECRET=<password generado>
RABBITMQ_PASSWORD=<password generado>
GRAFANA_PASSWORD=<password generado>

# Configurar AWS (obtener de tu cuenta)
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key

# Configurar Mapbox (obtener de mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=tu_public_token
MAPBOX_PRIVATE_TOKEN=tu_private_token

# Configurar SMTP (usar Gmail App Password)
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
```

---

## 📋 PASO 4: DAR PERMISOS A SCRIPTS

```bash
chmod +x scripts/*.sh
ls -la scripts/
# Debe mostrar todos los scripts con permisos -rwxr-xr-x
```

---

## 📋 PASO 5: EJECUTAR DESPLIEGUE

```bash
# UN COMANDO SOLAMENTE
./scripts/deploy-production.sh
```

Este script hará **TOD0** automáticamente:
1. Verificar variables de entorno
2. Instalar dependencias
3. Compilar Next.js
4. Construir imagen Docker
5. Ejecutar migraciones de DB
6. Iniciar todos los servicios
7. Verificar health checks

**Tiempo estimado**: 10-15 minutos

---

## 📋 PASO 6: VERIFICAR DESPLIEGUE

### Ejecutar health check:

```bash
./scripts/health-check.sh
```

**Salida esperada (EXIT SUCCESS)**:
```
======================================
System Health Check
======================================

✓ Next.js App (HTTP)
✓ API Health
✓ PostgreSQL
✓ Redis

======================================
All services are healthy!
======================================
```

### Verificar manualmente:

```bash
# Verificar todos los containers corriendo
docker-compose ps
# Debe mostrar todos con estado "Up"

# Ver logs de la app
docker-compose logs -f app
# No debe haber errores

# Verificar endpoints
curl http://localhost:3000/api/health
# Debe retornar JSON con status: "healthy"
```

---

## 📋 PASO 7: PRIMER LOGIN

### Acceder a la aplicación:

1. Abrir navegador: `http://localhost:3000`
2. Login con:
   - Email: `admin@seguridad.gob.mx`
   - Password: `Admin123!`

### ⚠️ CAMBIAR PASSWORD INMEDIATAMENTE

1. Ir a `/profile`
2. Cambiar password
3. Configurar MFA (opcional pero recomendado)

---

## 📋 PASO 8: CONFIGURAR SSL/HTTPS (OBLIGATORIO PARA PRODUCCIÓN)

### Usar Certbot con Let's Encrypt:

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado (reemplazar con tu dominio real)
sudo certbot --nginx -d tu-dominio.gob.mx -d www.tu-dominio.gob.mx

# Verificar renovación automática
sudo certbot renew --dry-run
```

### Configurar renovación automática:

```bash
# Agregar al crontab
sudo crontab -e

# Agregar esta línea:
0 0 * * * certbot renew --quiet --post-hook "docker-compose restart nginx"
```

---

## 📋 PASO 9: CONFIGURAR BACKUP AUTOMÁTICO

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * cd /var/www/public_security && ./scripts/backup-database.sh >> /var/log/backups.log 2>&1

# Verificar que se agregó correctamente
crontab -l
```

---

## 📋 PASO 10: CONFIGURAR FIREWALL

```bash
# Instalar ufw
sudo apt install ufw -y

# Configurar reglas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## 🎯 VERIFICACIÓN FINAL

### Ejecutar este checklist completo:

```bash
# 1. Verificar servicios corriendo
docker-compose ps
# [ ] Todos los servicios "Up"

# 2. Health check
./scripts/health-check.sh
# [ ] All services are healthy

# 3. Verificar endpoints
curl http://localhost:3000/api/health
# [ ] Retorna {"status":"healthy"}

# 4. Verificar logs (no errores)
docker-compose logs app | tail -20
# [ ] Sin errores críticos

# 5. Verificar backup configurado
crontab -l | grep backup
# [ ] Backup job existe

# 6. Verificar firewall
sudo ufw status
# [ ] Firewall activo

# 7. Verificar SSL
curl -I https://tu-dominio.gob.mx
# [ ] 200 OK con HTTPS
```

---

## 🔄 ACTUALIZACIONES FUTURAS

### Para actualizar el sistema sin downtime:

```bash
# UN COMANDO SOLAMENTE
./scripts/update-deployment.sh
```

Hace:
- Pull del último código
- Compila nueva versión
- Health check
- Switchover graceful
- Rollback automático si falla

---

## 🆘 SOLUCIÓN DE PROBLEMAS RÁPIDA

### La app no inicia:

```bash
docker-compose logs app
docker-compose restart app
```

### Error de base de datos:

```bash
docker-compose logs postgres
docker-compose restart postgres
```

### Reiniciar todo:

```bash
docker-compose down
docker-compose up -d
```

### Ver health check completo:

```bash
./scripts/health-check.sh
```

---

## 📞 CONTACTO

Si algo no funciona:
1. Verificar logs: `docker-compose logs -f`
2. Ejecutar health check: `./scripts/health-check.sh`
3. Revisar DEPLOYMENT_GUIDE.md para solución de problemas detallada

---

## ✅ CHECKLIST FINAL

Antes de considerar el despliegue completo:

- [ ] Docker y Docker Compose instalados
- [ ] Proyecto copiado al servidor
- [ ] .env.production configurado con passwords únicos
- [ ] Scripts con permisos de ejecución
- [ ] `./scripts/deploy-production.sh` ejecutado exitosamente
- [ ] `./scripts/health-check.sh` pasa
- [ ] Login funcional con admin credentials
- [ ] Password admin cambiado
- [ ] SSL/HTTPS configurado con Certbot
- [ ] Firewall configurado
- [ ] Backup automático en cron
- [ ] Primera copia de seguridad manual hecha

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

**URL**: https://tu-dominio.gob.mx
**Admin**: admin@seguridad.gob.mx (cambiar password inmediatamente)

**Generado**: 30 de Enero, 2026
**Versión**: 1.0.0 Production Ready

---

**Este es el único documento necesario para desplegar en producción.**
