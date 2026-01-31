#!/bin/bash
# ===========================================
# Run E2E Tests Script
# Sistema de Seguridad Pública
# ===========================================

set -e

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
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
# CONFIGURACIÓN
# ===========================================

# Verificar si estamos en producción
if [ -n "$BASE_URL" ]; then
    PRODUCTION_MODE=true
    log_info "Modo producción detectado. URL: $BASE_URL"
else
    PRODUCTION_MODE=false
    BASE_URL="http://localhost:3000"
    log_info "Modo desarrollo. URL: $BASE_URL"
fi

# ===========================================
# PRE-CHECKS
# ===========================================

log_info "Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
fi

# Verificar Playwright
if ! command -v npx &> /dev/null; then
    log_error "npx no está disponible"
    exit 1
fi

# Verificar que la aplicación está corriendo
if [ "$PRODUCTION_MODE" = true ]; then
    log_info "Verificando que la aplicación está corriendo en $BASE_URL..."

    if ! curl -f -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        log_error "La aplicación no está respondiendo en $BASE_URL"
        log_error "Asegúrate de que el servidor esté corriendo antes de ejecutar los tests"
        exit 1
    fi

    log_success "Aplicación está corriendo ✓"
else
    log_info "Modo desarrollo: Iniciando servidor de desarrollo..."

    # Verificar si ya está corriendo
    if curl -f -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
        log_warning "El servidor ya está corriendo. Reutilizando..."
    else
        log_info "Iniciando servidor en background..."
        npm run dev &
        DEV_SERVER_PID=$!

        # Esperar a que el servidor inicie
        log_info "Esperando a que el servidor inicie..."
        MAX_WAIT=30
        WAIT_COUNT=0

        while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
            if curl -f -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
                log_success "Servidor iniciado ✓"
                break
            fi
            sleep 1
            WAIT_COUNT=$((WAIT_COUNT + 1))
            echo -n "."
        done

        if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
            log_error "El servidor no inició a tiempo"
            exit 1
        fi
    fi
fi

# ===========================================
# EJECUTAR TESTS
# ===========================================

log_info "Ejecutando tests E2E con Playwright..."
echo ""

# Opciones de Playwright
PLAYWRIGHT_OPTS=""

# Modo producción: solo Chromium, sin videos
if [ "$PRODUCTION_MODE" = true ]; then
    PLAYWRIGHT_OPTS="--project=chromium"
    log_info "Optimizado para producción (Chromium only)"
fi

# Ejecutar tests
if [ "$PRODUCTION_MODE" = true ]; then
    # En producción, ejecutar tests en modo headless
    BASE_URL="$BASE_URL" npx playwright test $PLAYWRIGHT_OPTS
else
    # En desarrollo, mostrar UI
    npx playwright test $PLAYWRIGHT_OPTS
fi

TEST_EXIT_CODE=$?

# ===========================================
# POST-TEST
# ===========================================

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    log_success "========================================="
    log_success "¡TODOS LOS TESTS PASARON!"
    log_success "========================================="

    # Mostrar reporte
    if [ -f "playwright-report/index.html" ]; then
        log_info "Reporte HTML: playwright-report/index.html"
    fi

    if [ -f "test-results/results.json" ]; then
        log_info "Resultados JSON: test-results/results.json"
    fi

    # Resumen
    log_info "Para ver el reporte completo:"
    log_info "  npx playwright show-report"
else
    log_error "========================================="
    log_error "ALGUNOS TESTS FALLARON"
    log_error "========================================="

    log_info "Revisando reporte para ver detalles..."

    # Mostrar reporte si está disponible
    if [ -f "playwright-report/index.html" ]; then
        log_info "Reporte HTML: playwright-report/index.html"
        log_info "Abre el archivo en tu navegador para ver detalles"
    fi

    # Mostrar screenshots si existen
    if [ -d "test-results/screenshots" ]; then
        SCREENSHOTS=$(ls -1 test-results/screenshots/*.png 2>/dev/null | wc -l)
        if [ "$SCREENSHOTS" -gt 0 ]; then
            log_warning "Screenshots de fallos: test-results/screenshots/"
        fi
    fi

    # Mostrar videos si existen
    if [ -d "test-results/videos" ]; then
        VIDEOS=$(ls -1 test-results/videos/*.webm 2>/dev/null | wc -l)
        if [ "$VIDEOS" -gt 0 ]; then
            log_warning "Videos de fallos: test-results/videos/"
        fi
    fi
fi

# ===========================================
# CLEANUP (Solo en desarrollo)
# ===========================================

if [ "$PRODUCTION_MODE" = false ] && [ -n "$DEV_SERVER_PID" ]; then
    log_info "Deteniendo servidor de desarrollo..."
    kill $DEV_SERVER_PID 2>/dev/null || true
    log_success "Servidor detenido ✓"
fi

# ===========================================
# RETORNAR EXIT CODE
# ===========================================

exit $TEST_EXIT_CODE
