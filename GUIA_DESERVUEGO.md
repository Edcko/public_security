# 🚀 GUÍA DE DESPLIEGUE AL SERVIDOR
## Sistema de Seguridad Pública

---

## ⚡ MÉTODO AUTOMATIZADO (RECOMENDADO)

### Paso 1: Verificar conexión SSH

```bash
# Verificar que puedes conectar al servidor
ssh mid@66.179.189.92

# Te pedirá contraseña: ed
# Si conecta, ¡perfecto! Sal con 'exit'
```

### Paso 2: Ejecutar script automatizado

```bash
# Desde tu máquina local
cd /Users/misael/Documents/Projects/public_security
./scripts/deploy-to-server.sh
```

**Este script hace TODO automáticamente**:
1. ✅ Verifica archivos locales
2. ✅ Prepara servidor remoto
3. ✅ Copia todos los archivos (rsync)
4. ✅ Configura permisos
5. ✅ Despliega la aplicación
6. ✅ Verifica que funciona

---

## 📋 MÉTODO MANUAL (PASO A PASO)

### Paso 1: Conectar al servidor

```bash
ssh mid@66.179.189.92
```

### Paso 2: Crear directorios

```bash
# Crear directorio del proyecto
sudo mkdir -p /var/www/public_security

# Dar permisos a tu usuario
sudo chown mid:mid /var/www/public_security

# Ir al directorio
cd /var/www/public_security
```

### Paso 3: Copiar archivos (desde tu máquina local)

```bash
# En una terminal NUEVA en tu máquina local (no la del servidor)
cd /Users/misael/Documents/Projects/public_security

# Copiar archivos al servidor
rsync -avz --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='coverage' \
  . mid@66.179.189.92:/var/www/public_security/
```

**Tiempo estimado**: 5-10 minutos (depende de tu conexión)

### Paso 4: En el servidor - Dar permisos

```bash
# Dar permisos a scripts
chmod +x scripts/*.sh

# Crear directorios necesarios
mkdir -p backups logs docker/postgres
```

### Paso 5: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.production.example .env.production

# EDITAR con tus valores reales
nano .env.production
```

**⚠️ CAMBIAR OBLIGATORIAMENTE**:

```bash
# Generar passwords únicos
openssl rand -base64 32

# Y reemplazar en .env.production:
POSTGRES_PASSWORD=<password generado>
JWT_SECRET=<password generado>
JWT_REFRESH_SECRET=<password generado>
SESSION_SECRET=<password generado>
RABBITMQ_PASSWORD=<password generado>
GRAFANA_PASSWORD=<password generado>

# AWS Credentials
AWS_ACCESS_KEY_ID=<tu_key>
AWS_SECRET_ACCESS_KEY=<tu_secret>

# Mapbox Tokens
NEXT_PUBLIC_MAPBOX_TOKEN=<tu_token>
MAPBOX_PRIVATE_TOKEN=<tu_token>

# SMTP
SMTP_USER=<tu_email>
SMTP_PASSWORD=<tu_app_password>
```

### Paso 6: Desplegar

```bash
# UN COMANDO SOLAMENTE
./scripts/deploy-production.sh
```

**Este script hace**:
1. ✅ Verifica variables de entorno
2. ✅ Instala dependencias
3. ✅ Compila Next.js
4. ✅ Construye imagen Docker
5. ✅ Ejecuta migraciones
6. ✅ Inicia todos los servicios
7. ✅ Verifica health checks

**Tiempo**: 10-15 minutos

### Paso 7: Verificar

```bash
# Health check
curl http://localhost:3000/api/health

# Ver contenedores
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### Paso 8: Configurar SSL (OBLIGATORIO para producción)

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado (REEMPLAZAR con tu dominio real)
sudo certbot --nginx -d 66.179.189.92

# O con tu dominio
# sudo certbot --nginx -d tu-dominio.gob.mx
```

---

## 🧪 EJECUTAR TESTS EN PRODUCCIÓN

### Opción 1: Ejecutar tests

```bash
# En el servidor
./scripts/run-tests.sh
```

### Opción 2: Ejecutar tests con output completo

```bash
# Ver resultados completos
./scripts/run-tests.sh 2>&1 | tee test-results.log
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Permission denied"

```bash
# Dar permisos correctos
sudo chown -R mid:mid /var/www/public_security
```

### Error: "Cannot connect to server"

```bash
# Verificar que el servidor permite SSH
# Desde tu máquina local:
ssh mid@66.179.189.92

# Si pide contraseña, ingrésala
```

### Error: "rsync failed"

```bash
# Instalar rsync en Mac (si no está)
brew install rsync

# Verificar que SSH key está configurada
ssh-copy-id mid@66.179.189.92
```

### Error: "Docker build failed"

```bash
# Verificar que Docker está corriendo
sudo systemctl status docker

# Reintentar build
docker-compose down
docker-compose up -d --build
```

### Error: "Port 3000 already in use"

```bash
# Verificar qué está usando el puerto
sudo lsof -i :3000

# Matar proceso si necesario
sudo kill -9 <PID>

# O cambiar puerto en .env.production
PORT=3001 ./scripts/deploy-production.sh
```

---

## 🎯 POST-DESPLEGUE

### 1. Verificar que todo funciona

```bash
# Health check
curl http://66.179.189.92:3000/api/health

# Abrir en navegador
open http://66.179.189.92:3000

# O si configuraste SSL:
open https://66.179.189.92
```

### 2. Primer login

- **Email**: `admin@seguridad.gob.mx`
- **Password**: `Admin123!`

**⚠️ CAMBIAR PASSWORD INMEDIATAMENTE**

### 3. Configurar backup automático

```bash
# Editar crontab
crontab -e

# Agregar:
0 2 * * * cd /var/www/public_security && ./scripts/backup-database.sh
```

### 4. Ejecutar tests

```bash
./scripts/run-tests.sh
```

---

## 📚 ARCHIVOS IMPORTANTES EN EL SERVIDOR

```
/var/www/public_security/
├── scripts/
│   ├── deploy-production.sh       ⭐ Despliegue
│   ├── run-tests.sh                ⭐ Tests
│   ├── update-deployment.sh        ⭐ Actualizaciones
│   ├── health-check.sh              ⭐ Health check
│   ├── backup-database.sh           ⭐ Backup
│   └── restore-database.sh          ⭐ Restore
├── tests/
│   ├── README.md                    ⭐ Guía completa
│   ├── QUICK_START.md               ⭐ Guía rápida
│   └── e2e/                         ⭐ Tests
├── docker-compose.yml
├── Dockerfile.prod
├── nginx.conf
├── .env.production                ⭐ CONFIGURAR ESTE
└── README_DESPLIEGUE.md
```

---

## ✅ CHECKLIST FINAL

### Antes de Desplegar
- [ ] Tengo acceso SSH al servidor
- [ ] Conozco la contraseña del usuario mid
- [ ] Tengo AWS credentials (si voy a usar reconocimiento facial)
- [ ] Tengo Mapbox tokens (si voy a usar mapas)
- [ ] Tengo configurado SMTP (si voy a usar emails)

### Durante Despliegue
- [ ] Archivos copiados correctamente
- [ ] Permisos configurados
- [ ] .env.production configurado
- [ ] `deploy-production.sh` ejecutado sin errores
- [ ] Todos los contenedores "Up"

### Después de Desplegar
- [ ] Health check responde: `{"status":"healthy"}`
- [ ] App accesible en browser
- [ ] Login funcional con admin credentials
- [ ] Password admin cambiado
- [ ] SSL configurado
- [ ] Tests ejecutan correctamente
- [ ] Backup automático configurado

---

## 🎉 LISTO PARA PRODUCCIÓN

**URL**: http://66.179.189.92:3000
**Admin**: admin@seguridad.gob.mx / Admin123!

**Próximo paso**: Ejecutar `./scripts/deploy-to-server.sh` y listo.

---

**Versión**: 1.0.0
**Fecha**: 30 Enero 2026
**Estado**: ✅ Production Ready
