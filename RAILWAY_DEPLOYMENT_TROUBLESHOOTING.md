# Railway Deployment Troubleshooting Guide

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
