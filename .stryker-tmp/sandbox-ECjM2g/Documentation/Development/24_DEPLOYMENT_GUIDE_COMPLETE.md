# MaintAInPro Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying MaintAInPro CMMS to
various environments, from development to production.

## Prerequisites

### System Requirements

**Minimum:**

- Node.js 18+
- PostgreSQL 13+ (optional - has in-memory fallback)
- 2GB RAM
- 10GB disk space

**Recommended:**

- Node.js 20+
- PostgreSQL 15+
- 4GB RAM
- 50GB disk space
- Load balancer for production

### Environment Setup

Create a `.env` file with required variables:

```bash
# Required
NODE_ENV=production
PORT=5000

# Database (optional - uses in-memory storage as fallback)
DATABASE_URL=postgresql://username:password@host:5432/database

# Optional Configuration
SESSION_SECRET=your-secure-session-secret-min-32-chars
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://your-domain.com

# Security (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-jwt-secret

# Logging (optional)
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Deployment Options

### 1. Railway Deployment (Recommended)

Railway provides the easiest deployment experience with automatic builds and
PostgreSQL integration.

#### Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template)

#### Manual Railway Deployment

1. **Connect Repository**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Initialize project
   railway init
   ```

2. **Configure Environment Variables**

   ```bash
   # Set production environment
   railway variables set NODE_ENV=production

   # Optional: Add PostgreSQL database
   railway add postgresql

   # The DATABASE_URL will be automatically set
   ```

3. **Deploy**

   ```bash
   # Deploy current branch
   railway up

   # Deploy with custom settings
   railway up --detach
   ```

4. **Monitor Deployment**

   ```bash
   # View logs
   railway logs

   # Check service status
   railway status
   ```

### 2. Docker Deployment

#### Build Docker Image

```bash
# Build image
docker build -t maintainpro:latest .

# Build with specific tag
docker build -t maintainpro:v1.3.0 .
```

#### Run with Docker

```bash
# Run with environment file
docker run -d \
  --name maintainpro \
  --env-file .env \
  -p 5000:5000 \
  maintainpro:latest

# Run with inline environment variables
docker run -d \
  --name maintainpro \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -p 5000:5000 \
  maintainpro:latest
```

For complete deployment instructions, see the full guide in the project
documentation.

---

_Last updated: August 2025_ _Deployment Guide Version: v1.3.0_
