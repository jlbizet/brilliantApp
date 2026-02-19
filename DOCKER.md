# Docker Deployment Guide

This guide explains how to deploy the Dental Clinic CRM using Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                        │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Nginx   │────│ Frontend │────│  Backend │             │
│  │  (443)   │    │  (80)    │    │  (3000)  │             │
│  └──────────┘    └──────────┘    └────┬─────┘             │
│                                        │                    │
│                               ┌────────┴────────┐          │
│                               │                 │          │
│                          ┌────┴────┐      ┌────┴────┐     │
│                          │Postgres │      │  Redis  │     │
│                          │ (5432)  │      │ (6379)  │     │
│                          └─────────┘      └─────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)

## Quick Start

### 1. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd dental-crm

# Copy environment file
cp .env.example .env

# Edit .env with your production values
nano .env
```

### 2. Required Environment Variables

```env
# Database (Change these!)
DB_USER=dental_user
DB_PASSWORD=your_secure_password_here
DB_NAME=dental_crm

# JWT Secrets (Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Application
FRONTEND_URL=http://localhost
VITE_API_URL=/api
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up -d

# Or build without cache (clean build)
docker-compose build --no-cache
docker-compose up -d
```

### 4. Verify Deployment

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f backend

# Health check
curl http://localhost/api/v1/health
```

## Development Mode

For development with hot-reload:

```bash
# Start with development configuration
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or use the start script
./start.sh docker
```

## Production Deployment

### With SSL (Nginx)

```bash
# Place SSL certificates
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Start with nginx
docker-compose --profile with-nginx up -d
```

### Environment-Specific Configurations

#### Production (Default)
```bash
docker-compose up -d
```

#### Staging
```bash
# Create staging override
cp docker-compose.yml docker-compose.staging.yml
# Modify ports and environment

# Start staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

## Data Persistence

Volumes are used for data persistence:

- `postgres_data` - Database files
- `redis_data` - Cache data
- `uploads_data` - User uploads (documents, images)

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U dental_user dental_crm > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U dental_user dental_crm < backup.sql
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations (if needed)
docker-compose exec backend npx prisma migrate deploy
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Scale Services

```bash
# Scale backend to 3 instances (requires load balancer)
docker-compose up -d --scale backend=3
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 80
sudo lsof -i :80

# Change port in .env
FRONTEND_PORT=8080
```

### Database Connection Failed

```bash
# Check database health
docker-compose exec postgres pg_isready -U dental_user

# View database logs
docker-compose logs postgres

# Reset database (WARNING: DATA LOSS)
docker-compose down -v
docker-compose up -d
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check for port conflicts
docker-compose ps

# Restart specific service
docker-compose restart backend
```

### Rebuild Clean

```bash
# Remove everything including volumes
docker-compose down -v

# Remove all images
docker rmi dental-crm-backend dental-crm-frontend

# Rebuild from scratch
docker-compose up -d --build
```

## Security Best Practices

1. **Change default passwords** in `.env`
2. **Use strong JWT secrets** (min 32 characters)
3. **Enable firewall** - only expose ports 80 and 443
4. **Regular updates** - keep base images updated
5. **Use SSL** in production with valid certificates
6. **Backup regularly** - automate database backups

## Performance Tuning

### Resource Limits

Add to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Database Optimization

```bash
# Connect to database
docker-compose exec postgres psql -U dental_user -d dental_crm

# Check slow queries
\timing on
```

## Monitoring

### Health Endpoints

- Backend: `GET /api/v1/health`
- Frontend: `GET /health`
- Database: `docker-compose exec postgres pg_isready`

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean unused data
docker system prune
```

## Uninstall

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (data will be lost)
docker-compose down -v

# Remove images
docker rmi dental-crm-backend dental-crm-frontend
```

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Health check: `curl http://localhost/api/v1/health`
- Documentation: See README.md
