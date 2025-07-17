# Railway Deployment Checklist

## Pre-Deployment Checks

### 1. Environment Configuration

- [ ] All Supabase environment variables are set in Railway dashboard
- [ ] `VITE_SUPABASE_URL` configured
- [ ] `VITE_SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `DATABASE_URL` configured (if using direct database access)

### 2. Build Configuration

- [ ] `railway.toml` is configured with Docker builder:
  ```toml
  [build]
  builder = "DOCKERFILE"
  dockerfilePath = "Dockerfile"
  ```
- [ ] `nixpacks.toml` is **removed** (causes conflicts with Docker builds)
- [ ] `Dockerfile` is present and properly configured

### 3. Vite Configuration

- [ ] `vite.config.ts` includes Railway health check host:
  ```typescript
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['healthcheck.railway.app'],
  }
  ```

### 4. Package.json Scripts

- [ ] `start` script uses vite preview:
      `"start": "vite preview --port ${PORT:-3000} --host 0.0.0.0"`
- [ ] `prepare` script handles husky gracefully: `"prepare": "husky install || true"`

### 5. Docker Configuration

- [ ] Dockerfile uses Node.js 18 Alpine
- [ ] `--ignore-scripts` flag is used for npm ci to skip husky
- [ ] `curl` is installed for health checks
- [ ] Non-root user is created and used
- [ ] Port 3000 is exposed

## Deployment Process

### 1. Code Changes

1. Make necessary code changes
2. Test locally with `npm run build` and `npm run preview`
3. Ensure health check works: `curl http://localhost:3000/`

### 2. Git Operations

1. Stage changes: `git add .`
2. Commit with conventional format: `git commit -m "fix: description of changes"`
3. Push to main: `git push origin main`

### 3. Railway Deployment

1. Deploy: `railway up`
2. Monitor build logs: `railway logs -b`
3. Monitor runtime logs: `railway logs`
4. Check health status in Railway dashboard

## Common Issues & Solutions

### Issue: Build fails with nixpacks errors

**Solution:** Ensure `nixpacks.toml` is deleted and `railway.toml` uses Docker builder

### Issue: Health check fails with 403 errors

**Solution:** Add `healthcheck.railway.app` to `allowedHosts` in `vite.config.ts`

### Issue: Husky errors in Docker build

**Solution:** Use `--ignore-scripts` flag and make prepare script conditional

### Issue: npm flag errors

**Solution:** Use modern npm syntax (`--omit=dev` instead of `--only=production`)

### Issue: Container fails to start

**Solution:** Check that `start` script uses correct vite preview command with proper host binding

## File Structure Verification

Ensure these files exist and are properly configured:

- ✅ `Dockerfile` - Single-stage build with proper configuration
- ✅ `railway.toml` - Docker builder configuration
- ✅ `vite.config.ts` - Proper preview configuration
- ✅ `package.json` - Correct start script and husky handling
- ❌ `nixpacks.toml` - Should be deleted to avoid conflicts

## Success Indicators

- [ ] Build logs show "Using Detected Dockerfile"
- [ ] Build completes successfully
- [ ] Health check passes
- [ ] Application is accessible at Railway URL
- [ ] No 403 errors in logs
- [ ] PWA features work correctly

## Rollback Plan

If deployment fails:

1. Check recent commits: `git log --oneline -5`
2. Revert problematic commit: `git revert <commit-hash>`
3. Push revert: `git push origin main`
4. Redeploy: `railway up`

## Monitoring

After successful deployment:

- Monitor application logs: `railway logs`
- Check Railway dashboard for metrics
- Test all major application features
- Verify PWA installation works
- Test Supabase integration

## Contact Information

For deployment issues:

- Check Railway documentation: https://docs.railway.app
- Review Vite deployment guide: https://vitejs.dev/guide/static-deploy.html
- Supabase documentation: https://supabase.com/docs
