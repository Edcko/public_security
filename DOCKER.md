# Docker Setup - Local Development

Esta configuración de Docker Compose levanta todos los servicios necesarios para desarrollo local.

## 📋 Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **PostgreSQL** | 5432 | Base de datos principal |
| **PgBouncer** | 6432 | Connection pooling |
| **Redis** | 6379 | Caching y sesiones |
| **RabbitMQ** | 5672, 15672 | Message queue (15672 = Management UI) |
| **Grafana** | 3001 | Monitoreo (opcional) |

## 🚀 Inicio Rápido

### 1. Copiar variables de entorno

```bash
cp .env.example .env.local
```

### 2. Iniciar todos los servicios

```bash
# Iniciar todos los servicios (sin Grafana)
docker-compose up -d

# Incluir Grafana (monitoreo)
docker-compose --profile monitoring up -d
```

### 3. Verificar que los servicios están corriendo

```bash
docker-compose ps
```

### 4. Ver logs de un servicio específico

```bash
# PostgreSQL
docker-compose logs -f postgres

# RabbitMQ
docker-compose logs -f rabbitmq

# Todos los servicios
docker-compose logs -f
```

## 🔧 Comandos Útiles

### Detener servicios

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (cuidado: borra datos)
docker-compose down -v
```

### Reiniciar un servicio específico

```bash
docker-compose restart postgres
```

### Ejecutar comandos dentro de un contenedor

```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U admin -d public_security

# Acceder a Redis
docker-compose exec redis redis-cli

# Ver RabbitMQ connections
docker-compose exec rabbitmq rabbitmqctl list_connections
```

## 📊 Interfaces Web

- **RabbitMQ Management UI**: http://localhost:15672
  - Usuario: `admin`
  - Password: `password`
  
- **Grafana** (si está corriendo): http://localhost:3001
  - Usuario: `admin`
  - Password: `admin`

## 🗄️ Database Setup

Después de levantar los servicios, necesitas ejecutar las migraciones:

```bash
# Correr migraciones de Drizzle
npm run db:push

# O migrar con archivos SQL
npm run db:migrate
```

## 🐛 Troubleshooting

### Los contenedores no inician

```bash
# Ver logs detallados
docker-compose logs

# Rebuild contenedores
docker-compose up -d --build
```

### Puerto ya está en uso

Cambia el puerto en `.env.local`:

```bash
# Ejemplo: cambiar puerto de PostgreSQL
POSTGRES_PORT=5433
```

### Permisos de volumes (Linux/Mac)

```bash
# Dar permisos a volúmenes
sudo chown -R $USER:$USER docker/
```

### Limpiar todo y empezar de cero

```bash
# Detener y eliminar todo (contenedores, volúmenes, redes)
docker-compose down -v

# Eliminar imágenes de Docker
docker rmi $(docker images -q public_security_*)
```

## 📝 Notas de Desarrollo

- Los datos persisten en Docker volumes
- Para resetear la base de datos: `docker-compose down -v` y luego `docker-compose up -d`
- Redis está configurado con AOF (append-only file) para persistencia
- RabbitMQ tiene UI de management en el puerto 15672
