# 🚀 DESPLIEGUE POR GIT - GUÍA COMPLETA

## PASO 1: Crear repositorio en GitHub

1. Andá a https://github.com/new
2. Nombre del repo: `public-security`
3. **NO** marques "Initialize with README"
4. Click en "Create repository"

---

## PASO 2: Subir el código a GitHub

Ejecutá estos comandos en tu Mac:

```bash
cd /Users/misael/Documents/Projects/public_security

# Verificar qué archivos se van a subir
git status

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "feat: initial commit - Public Security System v1.0.0

- Complete E2E testing with 52 tests
- Production-ready Docker deployment
- Full authentication with JWT + MFA
- Personnel, vehicles, weapons, incidents management
- GPS tracking and shift management
- Real-time reporting and analytics
- Comprehensive documentation"

# Agregar el remote (REEMPLAZA TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/public-security.git

# Subir a GitHub (main branch)
git push -u origin main
```

**Te va a pedir usuario y password de GitHub**:
- Usuario: tu usuario de GitHub
- Password: **tu Personal Access Token** (no tu password normal)

**¿No tenés Personal Access Token?**
1. Andá a https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Nombre: "Deploy Public Security"
4. Expiration: 90 days
5. Scopes: marca ✅ `repo` (full control)
6. Generá y copiá el token (GUARDALO, solo se muestra una vez)

---

## PASO 3: Verificar que subió todo

Andá a tu navegador:
```
https://github.com/TU_USUARIO/public-security
```

Verificá que veas:
- ✅ README.md
- ✅ src/
- ✅ docker-compose.yml
- ✅ scripts/
- ✅ tests/

---

## PASO 4: En el servidor - Clonar el repo

Conectate al servidor:

```bash
ssh mid@66.179.189.92
# Password: ed
```

Una vez en el servidor:

```bash
# Ir al directorio web
cd /var/www/

# Clonar el repo (REEMPLAZA TU_USUARIO)
git clone https://github.com/TU_USUARIO/public-security.git

# Entrar al directorio
cd public_security

# Dar permisos a scripts
chmod +x scripts/*.sh

# Crear directorios necesarios
mkdir -p backups logs docker/postgres
```

---

## PASO 5: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.production.example .env.production

# Editar
nano .env.production
```

**Generar passwords (6 veces)**:

```bash
openssl rand -base64 32
```

**Reemplazar en `.env.production`**:

```bash
POSTGRES_PASSWORD=primer_password_generado
JWT_SECRET=segundo_password_generado
JWT_REFRESH_SECRET=tercer_password_generado
SESSION_SECRET=cuarto_password_generado
RABBITMQ_PASSWORD=quinto_password_generado
GRAFANA_PASSWORD=sexto_password_generado
```

**Guarda**: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## PASO 6: Desplegar

```bash
./scripts/deploy-production.sh
```

Esto toma 10-15 minutos. El script:
- ✅ Instala dependencias
- ✅ Compila Next.js
- ✅ Construye imágenes Docker
- ✅ Ejecuta migraciones
- ✅ Inicia todos los servicios

---

## PASO 7: Verificar

```bash
# Health check
curl http://localhost:3000/api/health

# Ver contenedores
docker-compose ps

# Ver logs (si hay errores)
docker-compose logs app
```

---

## PASO 8: Acceder a la app

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

## 🔄 FUTURAS ACTUALIZACIONES

Cuando quieras actualizar el sistema:

### Desde tu Mac:

```bash
cd /Users/misael/Documents/Projects/public_security

# Hacer cambios
# ...

# Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push
```

### En el servidor:

```bash
ssh mid@66.179.189.92
cd /var/www/public_security

# Actualizar código
git pull

# Actualizar despliegue
./scripts/update-deployment.sh
```

---

## ✅ VENTAJAS DE USAR GIT

1. ✅ **Control de versiones** - Podés volver a versiones anteriores
2. ✅ **Más confiable** - No se corrompen archivos como con rsync
3. ✅ **Historial completo** - Ves todos los cambios
4. ✅ **Branching** - Podés hacer experiments en ramas
5. ✅ **Pull Requests** - Revisión de código
6. ✅ **CI/CD** - Automatización con GitHub Actions
7. ✅ **Backup** - Tu código está seguro en GitHub

---

## 🆘 PROBLEMAS COMUNES

### Error: "Permission denied (publickey)"

**Solución**: Usá HTTPS en lugar de SSH:

```bash
# Cambiar el remote
git remote set-url origin https://github.com/TU_USUARIO/public-security.git
```

### Error: "Authentication failed"

**Solución**: Usá Personal Access Token en lugar de password:
- Password: tu_token (no tu password de GitHub)

### Error: "git: command not found"

**Solución**: Instalá Git en el servidor

```bash
sudo apt update
sudo apt install git -y
```

---

## 📞 AYUDA

Si necesitás ayuda, ejecutá:

```bash
# En el servidor
cd /var/www/public_security
cat GUIA_DESERVUEGO.md
```

---

**Tiempo total**: 20-30 minutos

**¿Listo? Empezá desde el PASO 1** 🚀
