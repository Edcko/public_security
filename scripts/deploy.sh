#!/bin/bash

# Script de deployment a producción (DigitalOcean VPS)
# USO: ./scripts/deploy.sh [environment]
# Ejemplo: ./scripts/deploy.sh production

set -e  # Exit on error

# Configuración
ENVIRONMENT=${1:-production}
APP_NAME="public-security"
REMOTE_USER="root"
REMOTE_HOST="your-vps-ip-address"  # CAMBIAR por IP real
REMOTE_DIR="/var/www/${APP_NAME}"
DOCKER_COMPOSE_FILE="docker/docker-compose.prod.yml"

echo "🚀 Deploying ${APP_NAME} to ${ENVIRONMENT}..."
echo "Remote: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paso 1: Build local
echo -e "\n${YELLOW}📦 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Paso 2: Crear backup remoto
echo -e "\n${YELLOW}💾 Creating backup on remote server...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
  cd ${REMOTE_DIR}
  if [ -d ".env.production" ]; then
    cp .env.production .env.production.backup
    echo "✅ Backup created"
  fi
EOF

# Paso 3: Copiar archivos al servidor
echo -e "\n${YELLOW}📤 Copying files to remote server...${NC}"

# Crear directorio si no existe
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"

# Copiar archivos necesarios
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.env.local' \
  --exclude '__pycache__' \
  . ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo -e "${GREEN}✅ Files copied${NC}"

# Paso 4: Deploy en servidor remoto
echo -e "\n${YELLOW}🔧 Deploying on remote server...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
  cd ${REMOTE_DIR}

  # Detener contenedores existentes
  echo "Stopping existing containers..."
  docker-compose -f ${DOCKER_COMPOSE_FILE} down

  # Construir imagen
  echo "Building Docker image..."
  docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache

  # Iniciar contenedores
  echo "Starting containers..."
  docker-compose -f ${DOCKER_COMPOSE_FILE} up -d

  # Esperar a que la app esté lista
  echo "Waiting for app to be ready..."
  sleep 10

  # Verificar que los contenedores estén corriendo
  docker-compose -f ${DOCKER_COMPOSE_FILE} ps

  echo "✅ Deployment complete!"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Remote deployment failed${NC}"
    exit 1
fi

# Paso 5: Verificar deployment
echo -e "\n${YELLOW}🔍 Verifying deployment...${NC}"
echo "Checking app health..."

# Verificar health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://${REMOTE_HOST}:3000/api/health || echo "000")

if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✅ App is healthy!${NC}"
else
    echo -e "${RED}❌ App health check failed (HTTP $HEALTH_CHECK)${NC}"
    echo "Check logs with: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker-compose -f ${DOCKER_COMPOSE_FILE} logs'"
    exit 1
fi

echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
echo -e "🌐 App URL: http://${REMOTE_HOST}:3000"
echo -e "📊 Logs: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker-compose -f ${DOCKER_COMPOSE_FILE} logs -f'"
