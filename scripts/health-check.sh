#!/bin/bash
# ===========================================
# Health Check Script
# Sistema de Seguridad Pública
# ===========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service_name=$1
    local service_url=$2

    if curl -f -s ${service_url} > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} ${service_name}"
        return 0
    else
        echo -e "${RED}✗${NC} ${service_name}"
        return 1
    fi
}

echo "======================================"
echo "System Health Check"
echo "======================================"
echo ""

# Check services
FAILED=0

check_service "Next.js App (HTTP)" "http://localhost:3000" || FAILED=1
check_service "API Health" "http://localhost:3000/api/health" || FAILED=1
check_service "PostgreSQL" "http://localhost:5432" && \
    docker-compose exec -T postgres pg_isready -U admin > /dev/null 2>&1 || FAILED=1
check_service "Redis" "http://localhost:6379" && \
    docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 || FAILED=1

echo ""

# Check container status
echo "Container Status:"
echo "--------------------------------------"
docker-compose ps

echo ""

# Check disk usage
echo "Disk Usage:"
echo "--------------------------------------"
df -h | grep -E '(Filesystem|/dev/)'

echo ""

# Check memory usage
echo "Memory Usage:"
echo "--------------------------------------"
free -h 2>/dev/null || vm_stat 2>/dev/null || echo "Memory info not available"

echo ""

# Docker resource usage
echo "Docker Resource Usage:"
echo "--------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""

if [ ${FAILED} -eq 0 ]; then
    echo -e "${GREEN}======================================"
    echo "All services are healthy!"
    echo "======================================${NC}"
    exit 0
else
    echo -e "${RED}======================================"
    echo "Some services are not healthy!"
    echo "======================================${NC}"
    exit 1
fi
