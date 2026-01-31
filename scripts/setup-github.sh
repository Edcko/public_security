#!/bin/bash
# ===========================================
# SETUP GITHUB - Prepara el repo para subir
# ===========================================

set -e

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
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

log_warning() {
    echo -e "${COLOR_YELLOW}[WARNING]${COLOR_NC} $1"
}

# ===========================================
# PASO 1: Verificar que estamos en el repo
# ===========================================

log_info "Verificando repositorio Git..."

if [ ! -d .git ]; then
    log_error "No es un repositorio Git. Inicializando..."
    git init
    log_success "Repo inicializado ✓"
fi

# ===========================================
# PASO 2: Verificar archivos
# ===========================================

log_info "Verificando archivos a commitear..."

# Verificar que hay archivos para commitear
if git status --porcelain | grep -q "^??"; then
    log_info "Archivos sin tracked encontrados"
fi

# ===========================================
# PASO 3: Agregar archivos
# ===========================================

log_info "Agregando archivos al staging area..."
git add .

log_success "Archivos agregados ✓"

# ===========================================
# PASO 4: Mostrar status
# ===========================================

echo ""
log_info "Status del repositorio:"
echo ""
git status --short
echo ""

# ===========================================
# PASO 5: Hacer commit
# ===========================================

log_info "Creando commit..."

git commit -m "feat: initial commit - Public Security System v1.0.0

- Complete E2E testing with 52 tests
- Production-ready Docker deployment
- Full authentication with JWT + MFA
- Personnel, vehicles, weapons, incidents management
- GPS tracking and shift management
- Real-time reporting and analytics
- Comprehensive documentation

Co-authored-by: Claude Code <claude@anthropic.com>" || {
    log_warning "No hay cambios para commitear o ya existe el commit"
}

log_success "Commit creado ✓"

# ===========================================
# PASO 6: Configurar remote
# ===========================================

echo ""
log_info "Configurando remote de GitHub..."
echo ""

# Preguntar por el usuario de GitHub
read -p "📝 Ingresá tu usuario de GitHub: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    log_error "Usuario de GitHub es obligatorio"
    exit 1
fi

GITHUB_REPO_URL="https://github.com/${GITHUB_USERNAME}/public-security.git"

# Verificar si ya existe un remote
if git remote get-url origin >/dev/null 2>&1; then
    log_warning "Ya existe un remote 'origin'"
    echo "  Remote actual: $(git remote get-url origin)"
    echo ""
    read -p "¿Querés actualizarlo? (y/n): " UPDATE_REMOTE

    if [ "$UPDATE_REMOTE" = "y" ] || [ "$UPDATE_REMOTE" = "Y" ]; then
        git remote set-url origin "$GITHUB_REPO_URL"
        log_success "Remote actualizado ✓"
    else
        log_info "Manteniendo remote existente"
    fi
else
    git remote add origin "$GITHUB_REPO_URL"
    log_success "Remote 'origin' agregado ✓"
fi

# ===========================================
# PASO 7: Instrucciones para GitHub
# ===========================================

echo ""
log_success "========================================="
log_success "REPO PREPARADO PARA SUBIR"
log_success "========================================="
echo ""
log_info "Próximos pasos:"
echo ""
echo "1️⃣  Creá el repositorio en GitHub:"
echo "   → https://github.com/new"
echo "   → Nombre: public-security"
echo "   → NO marques 'Initialize with README'"
echo ""
echo "2️⃣  Subí el código:"
echo "   ${COLOR_GREEN}git push -u origin main${COLOR_NC}"
echo ""
echo "3️⃣  Si te pide password:"
echo "   → Usuario: ${GITHUB_USERNAME}"
echo "   → Password: TU_PERSONAL_ACCESS_TOKEN"
echo ""
echo "4️⃣  ¿No tenés Personal Access Token?"
echo "   → https://github.com/settings/tokens"
echo "   → Generate new token (classic)"
echo "   → Scopes: marca ✅ repo"
echo ""
log_info "Una vez subido, continuá en el servidor:"
echo ""
echo "5️⃣  En el servidor (mid@66.179.189.92):"
echo "   ${COLOR_GREEN}cd /var/www"
echo "   git clone https://github.com/${GITHUB_USERNAME}/public-security.git${COLOR_NC}"
echo "   ${COLOR_GREEN}cd public_security${COLOR_NC}"
echo "   ${COLOR_GREEN}cp .env.production.example .env.production${COLOR_NC}"
echo "   ${COLOR_GREEN}nano .env.production  # Editar passwords${COLOR_NC}"
echo "   ${COLOR_GREEN}./scripts/deploy-production.sh${COLOR_NC}"
echo ""
echo "📖 Para más info, mirá: ${COLOR_YELLOW}DEPLOY_GIT.md${COLOR_NC}"
echo ""

exit 0
