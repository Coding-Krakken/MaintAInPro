# Railway Deployment Fix Summary

## Problem Overview

The Railway deployment was failing due to conflicts between nixpacks and Docker build systems,
incorrect npm flags, and Vite preview server configuration issues.

## Key Issues Identified

### 1. Build System Conflicts

- **Problem**: `nixpacks.toml` and `railway.toml` were both present, causing Railway to use nixpacks
  instead of Docker
- **Solution**: Deleted `nixpacks.toml` and ensured `railway.toml` specifies Docker builder

### 2. NPM Flag Syntax Errors

- **Problem**: Using deprecated `--only=production` flag and incorrect `--omit=dev=false` syntax
- **Solution**: Updated to modern npm syntax with `--omit=dev` and `--ignore-scripts`

### 3. Husky Integration Issues

- **Problem**: Husky trying to install git hooks in Docker environment without git
- **Solution**: Made prepare script conditional: `"prepare": "husky install || true"`

### 4. Vite Preview Server Restrictions

- **Problem**: Vite preview server blocking Railway health check requests from
  `healthcheck.railway.app`
- **Solution**: Added `allowedHosts: ['healthcheck.railway.app']` to preview configuration

## Files Modified

### 1. `railway.toml`

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### 2. `Dockerfile`

```dockerfile
# Simple Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies for build
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S viteuser -u 1001

# Change ownership and switch user
RUN chown -R viteuser:nodejs /app
USER viteuser

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["npm", "start"]
```

### 3. `vite.config.ts`

```typescript
export default defineConfig({
  // ... other config
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['healthcheck.railway.app'],
  },
});
```

### 4. `package.json` (prepare script)

```json
{
  "scripts": {
    "prepare": "husky install || true"
  }
}
```

### 5. Files Removed

- `nixpacks.toml` - Deleted to prevent conflicts with Docker build

## Deployment Process Fixed

### Before (Failed)

1. Railway detected nixpacks.toml
2. Used nixpacks builder despite railway.toml configuration
3. npm flags caused syntax errors
4. Husky failed in Docker environment
5. Health check failed due to host restrictions

### After (Success)

1. Railway detects Dockerfile (no nixpacks.toml)
2. Uses Docker builder as specified in railway.toml
3. Modern npm syntax works correctly
4. Husky installs gracefully or skips if no git
5. Health check passes with allowed hosts configuration

## Environment Variables

All Supabase environment variables are properly set in Railway dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Build Process

The successful build process now:

1. Uses Node.js 18 Alpine base image
2. Installs all dependencies (including dev) for build
3. Builds the Vite application
4. Installs curl for health checks
5. Creates non-root user for security
6. Starts with `npm start` (vite preview)

## Success Metrics

- Build time: ~149 seconds
- Health check: Passes successfully
- Application: Accessible at Railway URL
- PWA features: Working correctly
- Supabase integration: Functional

## Prevention Strategy

1. Always use Docker for Railway deployments (more reliable than nixpacks)
2. Keep deployment configuration files up to date
3. Test locally before deploying
4. Monitor build logs for early issue detection
5. Use the deployment checklist for consistency

## Additional Notes

- Single-stage Docker build is sufficient for this application
- Vite preview server is appropriate for production serving
- Health check configuration is critical for Railway deployments
- Environment variables must be set in Railway dashboard, not in code
