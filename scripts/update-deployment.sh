#!/bin/bash
# ===========================================
# Zero-Downtime Deployment Script
# Sistema de Seguridad Pública
# ===========================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ===========================================
# PRE-UPDATE CHECKS
# ===========================================

log_info "Starting zero-downtime deployment..."

# Check if running
if ! docker-compose ps | grep -q "Up"; then
    log_warning "No containers are running. Starting fresh deployment..."
    ./scripts/deploy-production.sh
    exit 0
fi

# ===========================================
# BUILD NEW VERSION
# ===========================================

log_info "Building new version..."
docker build -f Dockerfile.prod -t public-security-app:new .

log_success "New version built successfully"

# ===========================================
# GRACEFUL SWITCHOVER
# ===========================================

log_info "Performing graceful switchover..."

# Tag current version as old
docker tag public-security-app:latest public-security-app:old || true

# Tag new version as latest
docker tag public-security-app:new public-security-app:latest

# Restart with new image (rolling restart)
log_info "Restarting containers..."
docker-compose up -d --no-deps --build app

# ===========================================
# HEALTH CHECK NEW VERSION
# ===========================================

log_info "Waiting for new version to be healthy..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "New version is healthy"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_warning "New version failed health check. Rolling back..."
    docker tag public-security-app:old public-security-app:latest
    docker-compose up -d --no-deps app
    log_info "Rollback completed"
    exit 1
fi

# ===========================================
# CLEANUP
# ===========================================

log_info "Cleaning up old images..."
docker rmi public-security-app:old public-security-app:new 2>/dev/null || true

log_success "Zero-downtime deployment completed successfully!"
