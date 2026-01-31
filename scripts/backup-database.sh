#!/bin/bash
# ===========================================
# Database Backup Script
# Sistema de Seguridad Pública
# ===========================================

set -e

# Load environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/public_security_backup_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Creating backup: ${BACKUP_FILE}"

# Create backup
docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > ${BACKUP_FILE}

echo "Backup completed: ${BACKUP_FILE}"

# Keep only last 7 days of backups
echo "Cleaning old backups (keeping last 7 days)..."
find ${BACKUP_DIR} -name "public_security_backup_*.sql.gz" -mtime +7 -delete

echo "Backup cleanup completed"
