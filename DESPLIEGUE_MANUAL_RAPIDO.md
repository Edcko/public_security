# 🚀 DESPLIEGUE MANUAL - PASOS RÁPIDOS

## Problem: El script automatizado no puede manejar sudo password

## Solución: Ejecutar manualmente (más confiable de todas formas)

---

## PASO 1: Conectarte al servidor

```bash
ssh mid@66.179.189.92
# Password: ed
```

## PASO 2: Crear directorios y dar permisos (UNA SOLA VEZ)

```bash
sudo mkdir -p /var/www/public_security
sudo chown mid:mid /var/www/public_security
exit
```

## PASO 3: Copiar archivos (DESDE TU MAC, terminal nueva)

```bash
cd /Users/misael/Documents/Projects/public_security

rsync -avz --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='coverage' \
  --exclude='test-results' \
  . mid@66.179.189.92:/var/www/public_security/
```

**Te va a pedir password**: `ed`

**Tiempo**: 5-10 minutos

## PASO 4: Conectarte de nuevo al servidor

```bash
ssh mid@66.179.189.92
cd /var/www/public_security
```

## PASO 5: Dar permisos y configurar

```bash
# Permisos a scripts
chmod +x scripts/*.sh

# Crear directorios necesarios
mkdir -p backups logs docker/postgres

# Copiar archivo de entorno
cp .env.production.example .env.production

# EDITAR VARIABLES CRÍTICAS
nano .env.production
```

**CAMBIAR OBLIGATORIAMENTE**:

Genera passwords únicos:

```bash
openssl rand -base64 32
# Ejecuta este comando varias veces y copia los resultados
```

Reemplaza en `.env.production`:
- `POSTGRES_PASSWORD` = <password generado>
- `JWT_SECRET` = <password generado>
- `JWT_REFRESH_SECRET` = <password generado>
- `SESSION_SECRET` = <password generado>
- `RABBITMQ_PASSWORD` = <password generado>
- `GRAFANA_PASSWORD` = <password generado>

**Guarda**: `Ctrl+O`, `Enter`, `Ctrl+X`

## PASO 6: Desplegar

```bash
./scripts/deploy-production.sh
```

**Tiempo**: 10-15 minutos

Este script hace:
- ✅ Verifica variables de entorno
- ✅ Instala dependencias
- ✅ Compila Next.js
- ✅ Construye imagen Docker
- ✅ Ejecuta migraciones
- ✅ Inicia todos los servicios
- ✅ Verifica health checks

## PASO 7: Verificar

```bash
# Health check
curl http://localhost:3000/api/health

# Ver contenedores
docker-compose ps

# Ver logs si hay errores
docker-compose logs app
```

## PASO 8: Acceder a la app

En tu navegador:

**http://66.179.189.92:3000**

- **Email**: `admin@seguridad.gob.mx`
- **Password**: `Admin123!`

**⚠️ CAMBIAR PASSWORD INMEDIATAMENTE**

---

## PASO 9: Ejecutar tests (OPCIONAL)

```bash
./scripts/run-tests.sh
```

---

## ✅ RESUMEN

1. **SSH al servidor**: `ssh mid@66.179.189.92` (password: ed)
2. **Crear directorios**: `sudo mkdir -p /var/www/public_security && sudo chown mid:mid /var/www/public_security`
3. **Copiar archivos**: `rsync` comando (desde tu Mac)
4. **Editar .env**: Generar passwords con `openssl rand -base64 32`
5. **Desplegar**: `./scripts/deploy-production.sh`
6. **Verificar**: `curl http://localhost:3000/api/health`
7. **Login**: http://66.179.189.92:3000
8. **Tests**: `./scripts/run-tests.sh`

---

**Tiempo total**: 30-40 minutos todo incluido.

**¿Por qué manual es mejor?**
- ✅ Más control sobre cada paso
- ✅ Podés ver errores en tiempo real
- ✅ Podés detener y corregir si algo sale mal
- ✅ No hay problemas con sudo password

---

**¿Listo? Empieza desde el PASO 1** 🚀
