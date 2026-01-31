# 🚀 INSTRUCCIONES CLARAS - PASO A PASO
## Sistema de Seguridad Pública - Despliegue al Servidor

---

## 🎯 LO QUE TIENES QUE HACER

TÚ tienes que copiar los archivos desde tu Mac al servidor. Yo no puedo hacerlo directamente, pero voy a prepararte TODO para que sea súper fácil.

---

## 📋 PASO 1: VERIFICAR CONEXIÓN SSH

Abre una terminal en tu Mac y ejecuta:

```bash
ssh mid@66.179.189.92
```

- **Contraseña**: `ed`

Si te conecta exitosamente, ¡perfecto! Sal con `exit` y continúa al siguiente paso.

Si NO te puedes conectar, necesitas:
1. Verificar que el IP es correcto
2. Verificar que el usuario `mid` existe en el servidor
3. Verificar que tu contraseña SSH es correcta

---

## 📋 PASO 2: COPIAR ARCHIVOS AL SERVIDOR

### Opción A: Usar el script automatizado

```bash
# En tu Mac (terminal local)
cd /Users/misael/Documents/Projects/public_security
./scripts/deploy-to-server.sh
```

Este script:
1. Te pedirá tu contraseña de SSH (ed)
2. Copia todos los archivos automáticamente
3. Configura permisos
4. Te pedirá que edites `.env.production`
5. Despliega la aplicación

**Si funciona, ¡LISTO!** Ve al paso 3.

---

### Opción B: Copiar manualmente (si el script falla)

```bash
# En tu Mac (terminal local)
cd /Users/misael/Documents/Projects/public_security

# Copiar archivos al servidor
rsync -avz --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='coverage' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  . mid@66.179.189.92:/var/www/public_security/
```

**Te pedirá contraseña**: `ed`

**Tiempo**: 5-10 minutos dependiendo de tu conexión

---

## 📋 PASO 3: EN EL SERVIDOR - CONFIGURAR

Una vez que los archivos están copiados:

```bash
# Conéctate al servidor
ssh mid@66.179.189.92

# Ve al directorio
cd /var/www/public_security

# Dar permisos a scripts
chmod +x scripts/*.sh

# Crear directorios necesarios
mkdir -p backups logs docker/postgres

# Copiar archivo de entorno
cp .env.production.example .env.production

# Editar variables críticas
nano .env.production
```

**CAMBIAR OBLIGATORIAMENTE**:

```bash
# Generar passwords únicos
openssl rand -base64 32
```

Y reemplazar en `.env.production`:
- `POSTGRES_PASSWORD` = <password generado>
- `JWT_SECRET` = <password generado>
- `JWT_REFRESH_SECRET` = <password generado>
- `SESSION_SECRET` = <password generado>
- `RABBITMQ_PASSWORD` = <password generado>
- `GRAFANA_PASSWORD` = <password generado>

**Guarda** con `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## 📋 PASO 4: EN SERVIDOR - DESPLEGAR

```bash
# Ejecutar despliegue
./scripts/deploy-production.sh
```

Esto toma 10-15 minutos. Verás que:
- Instala dependencias
- Compila Next.js
- Construye imágenes Docker
- Ejecuta migraciones
- Inicia todos los servicios

---

## 📋 PASO 5: VERIFICAR

```bash
# Health check
curl http://localhost:3000/api/health

# Ver contenedores
docker-compose ps

# Ver logs (si hay errores)
docker-compose logs app
```

---

## 📋 PASO 6: PRIMER LOGIN

Abre tu navegador y ve a:

**http://66.179.189.92:3000**

- **Email**: `admin@seguridad.gob.mx`
- **Password**: `Admin123!`

**⚠️ CAMBIAR PASSWORD INMEDIATAMENTE**

---

## 📋 PASO 7: EJECUTAR TESTS (OPCIONAL)

```bash
# En el servidor
cd /var/www/public_security
./scripts/run-tests.sh
```

Esto toma 5-8 minutos y prueba que todo funciona.

---

## 🆘 SI ALGO SALE MAL

### Error: "Connection refused"
```bash
# Verificar que el servidor permite SSH
# Contactar al proveedor del servidor
```

### Error: "Permission denied"
```bash
# Asegurarte de que tu usuario tiene permisos
# Pedir al administrador: sudo chown -R mid:mid /var/www/public_security
```

### Error: "Docker build failed"
```bash
# Verificar que Docker está instalado
docker --version
# Si no está instalado:
# curl -fsSL https://get.docker.com -o get-docker.sh
# sudo sh get-docker.sh
```

---

## 📞 AYUDA

Si tienes problemas, lee estos archivos en el servidor:

```bash
# En el servidor
cd /var/www/public_security

# Guía completa
cat GUIA_DESERVUEGO.md

# Guía de tests
cat tests/QUICK_START.md
```

O ejecuta:

```bash
# Health check del sistema
./scripts/health-check.sh
```

---

## ✅ RESUMEN

1. **Conectar al servidor**: `ssh mid@66.179.189.92` (password: ed)
2. **Copiar archivos**: `./scripts/deploy-to-server.sh` o rsync manual
3. **Editar .env.production**: Generar passwords con `openssl rand -base64 32`
4. **Desplegar**: `./scripts/deploy-production.sh`
5. **Verificar**: `curl http://localhost:3000/api/health`
6. **Login**: http://66.179.189.92:3000
7. **Tests**: `./scripts/run-tests.sh`

---

**Tiempo total**: 30-40 minutos todo incluido.

**¿Listo? ¡VAMOS!** 🚀
