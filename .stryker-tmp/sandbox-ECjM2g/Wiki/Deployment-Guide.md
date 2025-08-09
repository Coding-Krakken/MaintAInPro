# 🚀 Deployment Guide

Complete guide for deploying MaintAInPro CMMS to production environments including Vercel, Railway, Docker, and on-premises installations.

## 📋 Table of Contents

- [**Overview**](#-overview)
- [**Vercel Deployment (Recommended)**](#-vercel-deployment-recommended)
- [**Railway Deployment**](#-railway-deployment)
- [**Docker Deployment**](#-docker-deployment)
- [**On-Premises Installation**](#-on-premises-installation)
- [**Environment Configuration**](#-environment-configuration)
- [**Database Setup**](#-database-setup)
- [**SSL & Security**](#-ssl--security)
- [**Monitoring & Health Checks**](#-monitoring--health-checks)
- [**Maintenance & Updates**](#-maintenance--updates)

## 🎯 Overview

MaintAInPro supports multiple deployment options to fit different organizational needs:

| Platform | Best For | Complexity | Scaling | Cost |
|----------|----------|------------|---------|------|
| **Vercel** | Quick deployment, global CDN | Low | Automatic | Free tier available |
| **Railway** | Full-stack hosting | Medium | Manual | Pay-as-you-go |
| **Docker** | Containerized environments | Medium | Manual | Infrastructure costs |
| **On-Premises** | Air-gapped, compliance | High | Manual | Hardware + maintenance |

### System Requirements

**Minimum Production Requirements:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps
- **Database**: PostgreSQL 14+

**Recommended Production:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps
- **Database**: PostgreSQL 15+ with connection pooling

## 🌐 Vercel Deployment (Recommended)

Vercel provides the easiest deployment with global CDN, automatic scaling, and zero configuration.

### Prerequisites

- Vercel account (free tier sufficient for testing)
- GitHub repository access
- PostgreSQL database (Neon, Supabase, or self-hosted)

### Step 1: Vercel Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Clone and navigate to project
git clone https://github.com/Coding-Krakken/MaintAInPro.git
cd MaintAInPro

# 4. Deploy to Vercel
vercel --prod
```

### Step 2: Environment Variables

Configure environment variables in Vercel dashboard:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/maintainpro"

# Application
NODE_ENV="production"
SESSION_SECRET="your-super-secure-session-secret"
JWT_SECRET="your-jwt-secret-key"

# Application URLs
FRONTEND_URL="https://your-app.vercel.app"
API_URL="https://your-app.vercel.app/api"

# Optional: File Upload
UPLOAD_PROVIDER="vercel"  # or "local", "s3", "gcs"
MAX_FILE_SIZE="10485760"  # 10MB

# Optional: Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Step 3: Database Configuration

```bash
# 1. Create PostgreSQL database
# Option A: Neon (recommended for Vercel)
# Visit: https://neon.tech
# Create database and copy connection string

# Option B: Supabase
# Visit: https://supabase.com
# Create project and copy connection string

# 2. Run database migrations
npm run db:push

# 3. Seed with initial data (optional)
npm run seed
```

### Step 4: Custom Domain (Optional)

1. **Add domain in Vercel dashboard**:
   - Go to Project Settings → Domains
   - Add your custom domain

2. **Configure DNS**:
   ```
   Type: CNAME
   Name: your-domain.com (or subdomain)
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**: Automatically provisioned by Vercel

### Vercel Configuration

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🚂 Railway Deployment

Railway provides a simple platform for full-stack applications with integrated database hosting.

### Step 1: Railway Setup

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Deploy
railway up
```

### Step 2: Database Setup

```bash
# Add PostgreSQL to your Railway project
railway add postgresql

# Get database URL
railway variables
```

### Step 3: Environment Configuration

Set environment variables in Railway dashboard:

```bash
DATABASE_URL="postgresql://postgres:pass@host:5432/railway"
NODE_ENV="production"
SESSION_SECRET="your-session-secret"
JWT_SECRET="your-jwt-secret"
PORT="5000"
```

### Step 4: Deploy Application

```bash
# Build and deploy
railway up --detach

# View logs
railway logs

# Check status
railway status
```

### Railway Configuration

**railway.json:**
```json
{
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

## 🐳 Docker Deployment

Docker deployment provides consistent environments and easy scaling.

### Step 1: Build Docker Image

```bash
# Build production image
docker build -t maintainpro:latest .

# Or build for specific platform
docker build --platform linux/amd64 -t maintainpro:latest .
```

### Step 2: Docker Compose Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/maintainpro
      - SESSION_SECRET=your-session-secret
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=maintainpro
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Run with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 4: Nginx Configuration

**nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 🏢 On-Premises Installation

For organizations requiring full control over their infrastructure.

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Create database user
sudo -u postgres createuser --pwprompt maintainpro

# Create database
sudo -u postgres createdb -O maintainpro maintainpro

# Test connection
psql -h localhost -U maintainpro -d maintainpro
```

### Step 3: Application Setup

```bash
# Clone repository
git clone https://github.com/Coding-Krakken/MaintAInPro.git
cd MaintAInPro

# Install dependencies
npm install

# Build application
npm run build

# Set up environment
cp .env.example .env.production
# Edit .env.production with your settings

# Run database migrations
npm run db:push

# Seed initial data
npm run seed
```

### Step 4: Process Management

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'maintainpro',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    restart_delay: 4000,
    error_file: '/var/log/maintainpro/error.log',
    out_file: '/var/log/maintainpro/out.log',
    log_file: '/var/log/maintainpro/combined.log'
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up startup script
pm2 startup
```

### Step 5: Nginx Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/maintainpro
```

**maintainpro nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static/ {
        alias /path/to/MaintAInPro/client/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/maintainpro /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Core Application
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="generate-strong-secret-key"
JWT_SECRET="generate-jwt-secret-key"

# Database
DATABASE_URL="postgresql://user:pass@host:5432/maintainpro"
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="10"

# URLs
FRONTEND_URL="https://your-domain.com"
API_URL="https://your-domain.com/api"

# File Storage
UPLOAD_PROVIDER="local"  # or "s3", "gcs", "azure"
UPLOAD_PATH="/var/uploads"
MAX_FILE_SIZE="10485760"

# Email Configuration
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"
EMAIL_FROM="MaintAInPro <noreply@your-domain.com>"

# Security
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_WINDOW="15"  # minutes
RATE_LIMIT_MAX="100"    # requests per window

# Monitoring
LOG_LEVEL="info"
ENABLE_METRICS="true"
HEALTH_CHECK_INTERVAL="30"  # seconds

# Background Jobs
ENABLE_BACKGROUND_JOBS="true"
PM_GENERATION_CRON="0 2 * * *"  # Daily at 2 AM
```

### Generating Secrets

```bash
# Generate session secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64

# Generate encryption key
openssl rand -hex 32
```

## 🗄️ Database Setup

### PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### Database Configuration

**Create database and user:**
```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create user
CREATE USER maintainpro WITH ENCRYPTED PASSWORD 'secure_password';

-- Create database
CREATE DATABASE maintainpro OWNER maintainpro;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE maintainpro TO maintainpro;

-- Create extensions
\c maintainpro
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

**Performance tuning (postgresql.conf):**
```bash
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connections
max_connections = 100

# Logging
log_statement = 'ddl'
log_min_duration_statement = 1000

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

### Database Migrations

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:push

# Verify schema
npm run db:studio
```

## 🔒 SSL & Security

### SSL Certificate Setup

**Option 1: Let's Encrypt (Recommended)**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Option 2: Commercial Certificate**
```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate CSR
openssl req -new -key private.key -out certificate.csr

# Install certificate from CA
# Configure in nginx.conf
```

### Security Headers

**nginx.conf security additions:**
```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

# Hide server version
server_tokens off;
```

### Application Security

**Rate limiting:**
```javascript
// Express rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

**Input validation:**
```javascript
// Zod validation for all inputs
const { z } = require('zod');

const workOrderSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
});
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

The application includes a health check endpoint at `/api/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T15:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "memory": "healthy",
    "disk": "healthy"
  }
}
```

### Application Monitoring

**PM2 Monitoring:**
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart if needed
pm2 restart maintainpro
```

**Log Management:**
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/maintainpro

# Add configuration
/var/log/maintainpro/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

### Database Monitoring

**PostgreSQL monitoring:**
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check database size
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database;
```

### Uptime Monitoring

Set up external monitoring with services like:
- **Pingdom**: Website monitoring
- **UptimeRobot**: Free uptime monitoring
- **StatusCake**: Comprehensive monitoring
- **New Relic**: Application performance monitoring

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks

**Daily:**
- Check application logs for errors
- Monitor system resources (CPU, memory, disk)
- Verify backup completion
- Review security alerts

**Weekly:**
- Update system packages
- Review performance metrics
- Check disk space usage
- Test backup restoration

**Monthly:**
- Update Node.js and npm packages
- Review and update SSL certificates
- Analyze user access logs
- Performance optimization review

### Application Updates

```bash
# 1. Backup current version
cp -r MaintAInPro MaintAInPro-backup-$(date +%Y%m%d)

# 2. Pull updates
cd MaintAInPro
git pull origin main

# 3. Install dependencies
npm install

# 4. Run migrations
npm run db:push

# 5. Build application
npm run build

# 6. Restart services
pm2 restart maintainpro

# 7. Verify deployment
curl http://localhost:5000/api/health
```

### Backup Strategy

**Database Backup:**
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/var/backups/maintainpro"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U maintainpro maintainpro > "$BACKUP_DIR/maintainpro_$DATE.sql"

# Keep only last 30 backups
find $BACKUP_DIR -name "maintainpro_*.sql" -mtime +30 -delete
```

**File Backup:**
```bash
# Backup uploaded files
rsync -av /var/uploads/ /var/backups/uploads/

# Backup application files
tar -czf /var/backups/app/maintainpro_$(date +%Y%m%d).tar.gz /path/to/MaintAInPro
```

### Rollback Procedures

**Application Rollback:**
```bash
# 1. Stop current application
pm2 stop maintainpro

# 2. Restore previous version
rm -rf MaintAInPro
mv MaintAInPro-backup-YYYYMMDD MaintAInPro

# 3. Restore database (if needed)
psql -h localhost -U maintainpro maintainpro < backup.sql

# 4. Restart application
pm2 start maintainpro
```

## 🆘 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
pm2 logs maintainpro

# Check port availability
netstat -tulpn | grep :5000

# Check environment variables
pm2 env maintainpro
```

**Database connection issues:**
```bash
# Test database connection
psql $DATABASE_URL

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**High memory usage:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart application
pm2 restart maintainpro
```

### Performance Issues

**Slow database queries:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

**High CPU usage:**
```bash
# Check CPU usage
top
htop

# Check process details
ps aux | grep node
```

For additional troubleshooting, see **[[Troubleshooting]]** guide.

---

## 🎉 Deployment Success

Following this guide should result in a production-ready MaintAInPro deployment with:

- ✅ **High Availability**: Proper load balancing and failover
- ✅ **Security**: SSL encryption and security headers
- ✅ **Performance**: Optimized configuration and caching
- ✅ **Monitoring**: Health checks and alerting
- ✅ **Backup**: Automated backup and recovery procedures

**Next Steps:**
1. Review **[[Security Guide]]** for additional hardening
2. Set up **[[Operations Guide]]** monitoring procedures
3. Train users with **[[User Guide]]**
4. Plan regular maintenance and updates

---

*Deployment Guide last updated: January 2025*