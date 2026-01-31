# 🚀 INSTRUCCIONES FINALES - DESPLIEGUE A SERVIDOR
## Para ejecutar AHORA MISMO

---

## ⚡ OPCIÓN 1: AUTOMÁTICA (RECOMENDADA)

### UN COMANDO SOLAMENTE:

```bash
cd /Users/misael/Documents/Projects/public_security
./scripts/deploy-to-server.sh
```

**Este script hace TODO**:
- ✅ Se conecta a tu servidor (mid@66.179.189.92)
- ✅ Copia todos los archivos
- ✅ Configura permisos
- ✅ Despliega la aplicación
- ✅ Verifica que funciona

**Tiempo total**: 15-25 minutos

**Solo debes**:
1. Ejecutar el script
2. Esperar a que te pida la contraseña de SSH
3. Esperar a que te pida editar `.env.production`
4. ¡Listo!

---

## 📋 OPCIÓN 2: MANUAL PASO A PASO

### PASO 1: Preparar servidor (ssh al servidor)

```bash
ssh mid@66.179.189.92
```

```bash
# Crear directorio
sudo mkdir -p /var/www/public_security
sudo chown mid:mid /var/www/public_security
cd /var/www/public_security
```

### PASO 2: Copiar archivos (NUEVA terminal local)

```bash
# En tu Mac (terminal NUEVA, no la del servidor)
cd /Users/misael/Documents/Projects/public_security

# Copiar al servidor
rsync -avz --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  . mid@66.179.189.92:/var/www/public_security/
```

### PASO 3: En servidor - Dar permisos

```bash
chmod +x scripts/*.sh
mkdir -p backups logs docker/postgres
```

### PASO 4: En servidor - Configurar variables

```bash
cp .env.production.example .env.production
nano .env.production
```

**CAMBIAR OBLIGATORIAMENTE**:

```bash
# Generar passwords
openssl rand -base64 32

# Reemplazar:
POSTGRES_PASSWORD=<generar>
JWT_SECRET=<generar>
JWT_REFRESH_SECRET=<generar>
SESSION_SECRET=<generar>
RABBITMQ_PASSWORD=<generar>
GRAFANA_PASSWORD=<generar>
```

### PASO 5: En servidor - Desplegar

```bash
./scripts/deploy-production.sh
```

### PASO 6: Verificar

```bash
curl http://localhost:3000/api/health
docker-compose ps
```

---

## 🔐 CREDENCIALES POR DEFECTO

**Login**:
- Email: `admin@seguridad.gob.mx`
- Password: `Admin123!`

**CAMBIAR PASSWORD INMEDIATAMENTE** al primer login.

---

## 🧪 EJECUTAR TESTS

### En el servidor (después del despliegue):

```bash
cd /var/www/public_security
./scripts/run-tests.sh
```

---

## 📖 SI NECESITAS AYUDA

### Archivos de referencia en el servidor:

```bash
# Guía de despliegue completo
cat GUIA_DESERVUEGO.md

# Guía de tests
cat tests/QUICK_START.md

# Para el siguiente Claude Code
cat PARA_CLAUDE_CODE_TESTS.md
```

---

## ✅ LO QUE YA ESTÁ LISTO

✅ **Proyecto**: 100% completo
✅ **Tests**: 52 tests E2E completos
✅ **Scripts**: Automatización completa
✅ **Docker**: Todo configurado
✅ **Documentación**: Guías paso a paso

---

## 🎯 LO QUE TIENES QUE HACER

1. **Ejecutar el script**:
   ```bash
   ./scripts/deploy-to-server.sh
   ```

2. **Esperar** a que te pida la contraseña de SSH

3. **Editar .env.production** cuando te lo pida

4. **¡Listo!**

---

**Tiempo total**: 20-30 minutos todo incluido.

**Al finalizar**: La app estará corriendo en http://66.179.189.92:3000

---

**¿Listo para empezar?** 🚀
