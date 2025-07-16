# Railway Deployment Guide

This project is configured for deployment on Railway. The main issue was that Railway was
auto-detecting the project as a Deno project due to the `deno.json` file in the
`supabase/functions/` directory, when it should be treated as a Node.js project.

## Files Created for Railway Deployment

1. **railway.toml** - Railway configuration file
2. **nixpacks.toml** - Nixpacks configuration for Node.js detection
3. **.railwayignore** - Excludes supabase functions from detection
4. **Dockerfile** - Docker configuration for containerized deployment
5. **.dockerignore** - Optimizes Docker build
6. **Procfile** - Process file for Railway
7. **railway-deploy.sh** - Deployment script

## Deployment Methods

### Method 1: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

### Method 2: Using Docker

```bash
# Build the image
docker build -t maintainpro .

# Run locally to test
docker run -p 3000:3000 maintainpro
```

### Method 3: GitHub Integration

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the configuration and deploy

## Environment Variables

Set these environment variables in your Railway project:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=MaintainPro CMMS
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## Build Process

1. Railway detects this as a Node.js project
2. Installs dependencies with `npm ci`
3. Builds the application with `npm run build`
4. Serves the built files using `serve` package
5. Application runs on the PORT provided by Railway

## Troubleshooting

If Railway still detects as Deno:

1. Ensure `.railwayignore` is properly excluding `supabase/functions/`
2. Check that `package.json` has the correct `engines` field
3. Verify that the `nixpacks.toml` specifies Node.js providers

## Health Check

The application includes a health check endpoint at `/` that Railway will use to verify the
deployment is successful.
