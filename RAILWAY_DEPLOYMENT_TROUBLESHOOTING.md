# Railway Deployment Troubleshooting Guide

# Railway Deployment Troubleshooting Guide

## Healthcare Failure Fix (July 17, 2025)

### Issue Identified

The Railway deployment was failing during the health check phase. The main issues were:

1. **Missing curl in Alpine image**: The health check was using `wget` but Alpine doesn't have it by
   default
2. **Incorrect health check timing**: The start period was too short for the application to fully
   start
3. **Missing --no-clipboard flag**: The serve command could have issues in headless environments
4. **Environment variable handling**: Missing .env.local file causing build failures

### Applied Fixes

#### 1. Updated Dockerfile Health Check

```dockerfile
# Health check - use curl instead of wget and add proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1
```

#### 2. Added curl to Alpine Image

```dockerfile
# Install serve globally and curl for health checks
RUN npm install -g serve && \
    apk add --no-cache curl
```

#### 3. Improved Environment Variable Handling

```dockerfile
# Handle environment variables - copy if exists, otherwise use example
RUN if [ -f .env.local ]; then \
      echo "Using existing .env.local"; \
    else \
      echo "Creating .env.local from .env.example"; \
      cp .env.example .env.local || echo "No .env.example found, using empty env"; \
    fi
```

#### 4. Updated Railway Configuration

```toml
[deploy]
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
startCommand = "serve -s dist -l $PORT --no-clipboard"
```

#### 5. Enhanced Start Command

```dockerfile
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000} --no-clipboard"]
```

### New Deployment Script

Created `railway-deploy-fixed.sh` that:

- Sets required environment variables
- Tests local build first
- Tests Docker build
- Provides better error messages and guidance

### Testing Results

- ✅ Docker build successful
- ✅ Container starts correctly
- ✅ Health check passes
- ✅ Application serves content on configured port

## Current Build Issues

Based on the Railway build logs, the Docker build process is running but may be encountering issues.
Here are the optimizations and fixes applied:

## Changes Made

### 1. Dockerfile Optimizations

- **Fixed build dependencies**: Removed `--only=production` from builder stage to include dev
  dependencies needed for build
- **Simplified production stage**: Removed unnecessary package.json copying and npm install in
  production stage
- **Added health check**: Added proper health check for Railway's deployment verification
- **Improved port handling**: Better environment variable handling for PORT

### 2. Railway Configuration Updates

- **Switched to Dockerfile builder**: Changed from nixpacks to explicit dockerfile builder for
  better control
- **Added explicit start command**: Specified the start command for clarity
- **Maintained health check settings**: Kept health check configuration for deployment verification

### 3. Docker Ignore Improvements

- **Enhanced file exclusion**: Better exclusion of unnecessary files from build context
- **Removed lock files**: Let npm ci handle package-lock.json internally
- **Added more development files**: Excluded IDE files and temporary directories

## Testing the Build

### Local Docker Build Test

```bash
# Run the Docker build test script
./test-docker-build.sh
```

### Local Build Verification

```bash
# Test the build process
npm run build

# Test the serve command
npm run start
```

## Deployment Process

### Option 1: Using Railway CLI

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway auth login

# Deploy using the script
./railway-deploy.sh
```

### Option 2: Git-based Deployment

1. Commit your changes to Git
2. Push to your Railway-connected repository
3. Railway will automatically detect the Dockerfile and build

## Common Issues and Solutions

### 1. Build Timeouts

- **Symptom**: Build process hangs or times out
- **Solution**: The optimized Dockerfile should reduce build time by better layer caching

### 2. Port Binding Issues

- **Symptom**: Application starts but isn't accessible
- **Solution**: Railway sets PORT environment variable, our configuration handles this properly

### 3. Build Context Too Large

- **Symptom**: Build fails due to context size
- **Solution**: Enhanced .dockerignore excludes unnecessary files

### 4. Missing Dependencies

- **Symptom**: Build fails with missing packages
- **Solution**: Builder stage now includes all dependencies needed for build

## Health Check

The application includes a health check that:

- Checks every 30 seconds
- Times out after 10 seconds
- Gives 5 seconds startup time
- Retries 3 times before marking as unhealthy

## Environment Variables

Make sure to set these in Railway:

- `PORT`: Automatically set by Railway
- `NODE_ENV`: Set to "production" for production builds
- Any application-specific environment variables for Supabase, etc.

## Next Steps

1. Test the Docker build locally using `./test-docker-build.sh`
2. If local build succeeds, deploy using `./railway-deploy.sh`
3. Monitor the Railway deployment logs for any remaining issues
4. Check the health check endpoint at `https://your-domain.railway.app/`

## Build Process Flow

1. **Builder Stage**: Install all dependencies → Copy source → Build application
2. **Production Stage**: Install serve → Copy built assets → Setup user → Start application

The multi-stage build ensures a smaller final image while maintaining all build capabilities.
