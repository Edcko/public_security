#!/bin/bash
# ===========================================
# Database Restore Script
# Sistema de Seguridad Pública
# ===========================================

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Load environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
fi

echo "WARNING: This will replace the current database with the backup."
echo "Backup file: ${BACKUP_FILE}"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Restoring database from backup..."

# Restore backup
gunzip -c ${BACKUP_FILE} | docker-compose exec -T postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

echo "Database restore completed"
