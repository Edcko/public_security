#!/bin/bash
# ===========================================
# DEPLOY TO SERVER - Script Completo
# Copia y despliega el proyecto al servidor remoto
# ===========================================

set -e

# Configuración
SERVER_USER="mid"
SERVER_IP="66.179.189.92"
SERVER_DIR="/var/www/public_security"
LOCAL_DIR="/Users/misael/Documents/Projects/public_security"

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m'

log_info() {
    echo -e "${COLOR_BLUE}[INFO]${COLOR_NC} $1"
}

log_success() {
    echo -e "${COLOR_GREEN}[SUCCESS]${COLOR_NC} $1"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_NC} $1"
}

# ===========================================
# PASO 1: VERIFICAR ARCHIVOS LOCALES
# ===========================================

log_info "PASO 1: Verificando archivos locales..."

cd "$LOCAL_DIR" || {
    log_error "No se puede acceder al directorio del proyecto: $LOCAL_DIR"
    exit 1
}

# Verificar archivos críticos
REQUIRED_FILES=(
    "scripts/deploy-production.sh"
    "scripts/run-tests.sh"
    "docker-compose.yml"
    "Dockerfile.prod"
    "playwright.config.ts"
    ".env.production.example"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Falta archivo crítico: $file"
        exit 1
    fi
done

log_success "Todos los archivos críticos encontrados ✓"

# ===========================================
# PASO 2: PREPARAR SERVIDOR REMOTO
# ===========================================

log_info "PASO 2: Preparando servidor remoto..."

echo ""
echo "Ejecutando comandos en el servidor..."
echo ""

# Crear directorios en el servidor (usando ssh -t para sudo interactivo)
log_info "Se te pedirá tu contraseña de SSH dos veces..."
ssh -t ${SERVER_USER}@${SERVER_IP} "sudo mkdir -p $SERVER_DIR && sudo chown $USER:$USER $SERVER_DIR && echo 'Directorios creados ✓'"

log_success "Servidor preparado ✓"

# ===========================================
# PASO 3: COPIAR ARCHIVOS AL SERVIDOR
# ===========================================

log_info "PASO 3: Copiando archivos al servidor..."

# Excluir archivos innecesarios
EXCLUDE_ARGS=(
    --exclude='node_modules/'
    --exclude='.next/'
    --exclude='.git/'
    --exclude='coverage/'
    --exclude='test-results/'
    --exclude='playwright-report/'
    --exclude='playwright/.cache/'
    --exclude='*.log'
)

log_info "Iniciando rsync (puede tomar varios minutos)..."

rsync -avz "${EXCLUDE_ARGS[@]}" \
    "$LOCAL_DIR/" \
    ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/

log_success "Archivos copiados ✓"

# ===========================================
# PASO 4: CONFIGURAR EN SERVIDOR
# ===========================================

log_info "PASO 4: Configurando en servidor..."

log_info "Configurando permisos y directorios..."
ssh ${SERVER_USER}@${SERVER_IP} "cd $SERVER_DIR && chmod +x scripts/*.sh && mkdir -p backups logs docker/postgres && if [ ! -f .env.production ]; then cp .env.production.example .env.production && echo '⚠️  ATENCIÓN: Debes editar .env.production con tus valores reales'; fi && echo 'Configuración completada ✓'"

log_success "Configuración lista ✓"

# ===========================================
# PASO 5: DESPLEGAR APLICACIÓN
# ===========================================

log_info "PASO 5: Desplegando aplicación..."

ssh ${SERVER_USER}@${SERVER_IP} "cd $SERVER_DIR && ./scripts/deploy-production.sh"

log_success "Aplicación desplegada ✓"

# ===========================================
# PASO 6: VERIFICAR DESPLIEGUE
# ===========================================

log_info "PASO 6: Verificando despliegue..."

echo ""
log_info "Verificando health check..."
ssh ${SERVER_USER}@${SERVER_IP} 'curl -f http://localhost:3000/api/health' || log_error "Health check falló"

echo ""
log_info "Verificando contenedores..."
ssh ${SERVER_USER}@${SERVER_IP} 'docker-compose ps'

echo ""
log_success "========================================="
log_success "¡DESPLIEGUE COMPLETADO!"
log_success "========================================="
echo ""
log_info "La aplicación está corriendo en:"
log_info "  → http://66.179.189.92:3000"
log_info ""
log_info "Para configurar SSL, ejecuta:"
log_info "  ssh ${SERVER_USER}@${SERVER_IP}"
log_info "  cd $SERVER_DIR"
log_info "  sudo certbot --nginx -d tu-dominio.gob.mx"
echo ""
log_info "Para ejecutar tests:"
log_info "  ssh ${SERVER_USER}@${SERVER_IP}"
log_info "  cd $SERVER_DIR"
log_info "  ./scripts/run-tests.sh"
echo ""

exit 0
