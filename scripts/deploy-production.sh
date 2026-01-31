#!/bin/bash
# ===========================================
# Production Deploy Script
# Sistema de Seguridad Pública
# ===========================================

set -e  # Exit on error

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_NC='\033[0m' # No Color

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
# PRE-DEPLOY CHECKS
# ===========================================

log_info "Starting production deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    log_error ".env.production not found!"
    log_info "Creating .env.production from .env.production.example..."
    cp .env.production.example .env.production
    log_warning "Please edit .env.production with your production values BEFORE running this script again"
    exit 1
fi

# Source environment variables
log_info "Loading environment variables..."
set -a
source .env.production
set +a

# Check for required variables
log_info "Checking required environment variables..."
REQUIRED_VARS=("POSTGRES_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"CHANGE_THIS"* ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_error "The following required environment variables are missing or not set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    log_error "Please set them in .env.production and try again"
    exit 1
fi

log_success "All required environment variables are set"

# ===========================================
# BUILD
# ===========================================

log_info "Installing dependencies..."
npm ci --only=production

log_info "Building Next.js application..."
npm run build

log_success "Build completed successfully"

# ===========================================
# DATABASE MIGRATIONS
# ===========================================

log_info "Running database migrations..."
npm run db:push

log_success "Database migrations completed"

# ===========================================
# DOCKER DEPLOYMENT
# ===========================================

log_info "Building Docker image..."
docker build -f Dockerfile.prod -t public-security-app:latest .

log_success "Docker image built successfully"

log_info "Stopping existing containers..."
docker-compose down

log_info "Starting containers..."
docker-compose up -d

# ===========================================
# HEALTH CHECKS
# ===========================================

log_info "Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
log_info "Checking PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
    log_success "PostgreSQL is ready"
else
    log_error "PostgreSQL is not ready"
    exit 1
fi

# Check Redis
log_info "Checking Redis connection..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis is ready"
else
    log_error "Redis is not ready"
    exit 1
fi

# Check Next.js app
log_info "Checking Next.js application..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Next.js application is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "Next.js application failed to start"
    docker-compose logs app
    exit 1
fi

# ===========================================
# DEPLOYMENT COMPLETE
# ===========================================

echo ""
log_success "========================================="
log_success "Deployment completed successfully!"
log_success "========================================="
echo ""
log_info "Application is running at: http://localhost:3000"
log_info "Grafana is running at: http://localhost:3001"
log_info "RabbitMQ Management: http://localhost:15672"
echo ""
log_info "To view logs, run: docker-compose logs -f"
log_info "To stop the application, run: docker-compose down"
echo ""
log_warning "IMPORTANT: Remember to:"
log_warning "  - Configure SSL certificates for nginx"
log_warning "  - Set up proper backups"
log_warning "  - Configure monitoring alerts"
log_warning "  - Review security settings"
echo ""
