# 🚀 COMANDOS EXACTOS - EDCKO

## PASO 1: En tu Mac - Subir el código

```bash
cd /Users/misael/Documents/Projects/public_security

# Agregar el remote
git remote add origin https://github.com/Edcko/public-security.git

# Verificar que se agregó
git remote -v

# Hacer commit
git add .
git commit -m "feat: production-ready Public Security System v1.0.0

- Complete E2E testing (52 tests)
- Docker deployment ready
- Full auth with JWT + MFA
- Personnel, vehicles, weapons, incidents management
- GPS tracking & shifts
- Real-time reporting
- Comprehensive documentation"

# Subir a GitHub
git push -u origin main
```

**Si te pide password**:
- Usuario: `Edcko`
- Password: **tu Personal Access Token**

¿No tenés token? Generalo en:
https://github.com/settings/tokens

---

## PASO 2: En el servidor - Clonar y desplegar

```bash
# Conectarse al servidor
ssh mid@66.179.189.92
# Password: ed

# Ir al directorio web
cd /var/www/

# Clonar el repositorio
git clone https://github.com/Edcko/public-security.git

# Entrar al directorio
cd public_security

# Dar permisos a scripts
chmod +x scripts/*.sh

# Crear directorios necesarios
mkdir -p backups logs docker/postgres

# Copiar archivo de entorno
cp .env.production.example .env.production

# Editar variables de entorno
nano .env.production
```

### Editar estas 6 variables:

Genera passwords únicos:
```bash
openssl rand -base64 32
# Ejecuta 6 veces y copia los resultados
```

Reemplaza en `.env.production`:
- `POSTGRES_PASSWORD` = primer_password
- `JWT_SECRET` = segundo_password
- `JWT_REFRESH_SECRET` = tercer_password
- `SESSION_SECRET` = cuarto_password
- `RABBITMQ_PASSWORD` = quinto_password
- `GRAFANA_PASSWORD` = sexto_password

Guarda: `Ctrl+O`, `Enter`, `Ctrl+X`

### Desplegar:

```bash
./scripts/deploy-production.sh
```

**Tiempo**: 10-15 minutos

---

## PASO 3: Verificar

```bash
# Health check
curl http://localhost:3000/api/health

# Ver contenedores
docker-compose ps
```

---

## PASO 4: Acceder a la app

**URL**: http://66.179.189.92:3000

**Login**:
- Email: `admin@seguridad.gob.mx`
- Password: `Admin123!`

**⚠️ Cambiar password inmediatamente**

---

## PASO 5: Ejecutar tests (OPCIONAL)

```bash
./scripts/run-tests.sh
```

---

## ✅ LISTO

**Tiempo total**: 20-25 minutos

---

## 🔄 Para futuras actualizaciones

**Desde tu Mac**:
```bash
cd /Users/misael/Documents/Projects/public_security
git add .
git commit -m "feat: descripción del cambio"
git push
```

**En el servidor**:
```bash
cd /var/www/public_security
git pull
./scripts/update-deployment.sh
```

---

**¿Listo? Empezá con el PASO 1** 🚀
