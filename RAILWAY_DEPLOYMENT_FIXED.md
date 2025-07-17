# Railway Deployment Troubleshooting Guide

## Issue Fixed

The main issue was in `nixpacks.toml` where `npm-9_x` was specified but this package is not
available in the current Nixpkgs repository used by Railway.

## Changes Made

### 1. Fixed nixpacks.toml

- **Before**: `nixPkgs = ["nodejs-18_x", "npm-9_x"]`
- **After**: `nixPkgs = ["nodejs-20_x"]`

The npm package is included automatically with Node.js, so there's no need to specify it separately.

### 2. Updated Node.js Version

- Changed from Node.js 18 to Node.js 20 for better compatibility
- Node.js 20 is more stable and has better support in Railway's environment

## Files Modified

1. `/nixpacks.toml` - Fixed the npm package reference and updated Node.js version
2. Created `/railway-deploy-ultimate.sh` - Comprehensive deployment script
3. Created `/nixpacks-alternative.toml` - Alternative configuration if needed

## Next Steps

### To deploy:

1. Login to Railway: `railway login`
2. Run the deployment script: `./railway-deploy-ultimate.sh`

### Alternative manual deployment:

```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set VITE_SUPABASE_URL=your_supabase_url
railway variables set VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Deploy
railway deploy
```

### Monitor deployment:

```bash
railway logs          # View deployment logs
railway status        # Check service status
railway domain        # Get your app URL
```

## Common Issues and Solutions

### 1. Build Fails

- Check logs: `railway logs --build`
- Verify environment variables: `railway variables`
- Test local build: `npm run build`

### 2. App Won't Start

- Check start command in nixpacks.toml
- Verify PORT environment variable is set
- Check runtime logs: `railway logs`

### 3. Environment Variables

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NODE_ENV=production`
- `PORT=3000`

### 4. Package Issues

If npm packages fail to install:

- Check package.json engines specification
- Verify Node.js version compatibility
- Try using nixpacks-alternative.toml

## Testing Before Deployment

Always test locally first:

```bash
npm run build      # Test build
npm start          # Test start command
```

## Architecture Notes

- Uses Vite for building the React application
- Serves static files through npm start (vite preview)
- PWA configuration with service worker
- TypeScript with strict type checking
