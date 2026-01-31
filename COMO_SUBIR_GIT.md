# 🚀 DESPLIEGUE POR GIT - INSTRUCCIONES RÁPIDAS

## RESUMEN: 3 PASOS SIMPLES

---

## 1️⃣ EN TU MAC - Preparar y subir

```bash
cd /Users/misael/Documents/Projects/public_security

# Ejecutar script automatizado
./scripts/setup-github.sh

# Seguir las instrucciones que te da el script:
# - Creá el repo en GitHub
# - Ejecutá: git push -u origin main
```

---

## 2️⃣ EN GITHUB - Crear repositorio

1. Andá a https://github.com/new
2. Nombre: `public-security`
3. **NO** marques "Initialize with README"
4. Click en "Create repository"

---

## 3️⃣ EN EL SERVIDOR - Clonar y desplegar

```bash
ssh mid@66.179.189.92
# Password: ed

cd /var/www/

# Clonar (REEMPLAZA TU_USUARIO)
git clone https://github.com/TU_USUARIO/public-security.git

cd public_security

# Configurar
chmod +x scripts/*.sh
mkdir -p backups logs docker/postgres
cp .env.production.example .env.production

# Editar passwords
nano .env.production
# Generar: openssl rand -base64 32 (6 veces)
# Reemplazar: POSTGRES_PASSWORD, JWT_SECRET, etc.

# Desplegar
./scripts/deploy-production.sh
```

---

## ✅ LISTO

**App en**: http://66.179.189.92:3000
**Login**: admin@seguridad.gob.mx / Admin123!

---

## 🔄 Para futuras actualizaciones

**Mac**:
```bash
git add .
git commit -m "feat: descripción"
git push
```

**Servidor**:
```bash
cd /var/www/public_security
git pull
./scripts/update-deployment.sh
```

---

**Tiempo total**: 20-30 minutos

**Guía completa**: mirá `DEPLOY_GIT.md`

**¿Empezamos? Ejecutá el PASO 1** 🚀
