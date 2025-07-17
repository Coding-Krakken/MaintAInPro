# GitHub Secrets Setup for Railway CI/CD

This document outlines the GitHub secrets required for the Railway CI/CD pipeline to function
properly.

## Required Secrets

### Railway Authentication

- **`RAILWAY_STAGING_TOKEN`**: Railway API token for staging deployments
- **`RAILWAY_PRODUCTION_TOKEN`**: Railway API token for production deployments

### Application Configuration

- **`SUPABASE_URL`**: Your Supabase project URL
- **`SUPABASE_ANON_KEY`**: Your Supabase anonymous key
- **`SUPABASE_SERVICE_KEY`**: Your Supabase service role key

### Deployment URLs (Repository Variables)

- **`STAGING_URL`**: Your Railway staging deployment URL
- **`PRODUCTION_URL`**: Your Railway production deployment URL

### Additional Services (Optional)

- **`LHCI_GITHUB_APP_TOKEN`**: Lighthouse CI GitHub app token
- **`CODECOV_TOKEN`**: Codecov token for coverage reporting

## Setting Up Railway Tokens

1. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:

   ```bash
   railway login
   ```

3. **Create API Token**:
   - Go to your Railway dashboard
   - Navigate to Account Settings → API Tokens
   - Create a new token with deployment permissions
   - Copy the token

4. **Set up separate projects** (recommended):
   - Create a staging project in Railway
   - Create a production project in Railway
   - Generate separate tokens for each environment

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the appropriate name and value

## Example Railway Project Setup

### Staging Environment

- **Project Name**: `maintainpro-staging`
- **Branch**: `develop`
- **Environment Variables**:
  ```
  NODE_ENV=staging
  VITE_APP_ENVIRONMENT=staging
  VITE_SUPABASE_URL=your_staging_supabase_url
  VITE_SUPABASE_ANON_KEY=your_staging_supabase_key
  ```

### Production Environment

- **Project Name**: `maintainpro-production`
- **Branch**: `main`
- **Environment Variables**:
  ```
  NODE_ENV=production
  VITE_APP_ENVIRONMENT=production
  VITE_SUPABASE_URL=your_production_supabase_url
  VITE_SUPABASE_ANON_KEY=your_production_supabase_key
  ```

## Testing the Setup

1. **Run local validation**:

   ```bash
   ./validate-railway-deployment.sh
   ```

2. **Test with a pull request**:
   - Create a PR to trigger the Railway deployment test workflow
   - Check the GitHub Actions logs for any issues

3. **Deploy to staging**:
   - Push to the `develop` branch
   - Monitor the staging deployment in Railway dashboard

4. **Deploy to production**:
   - Push to the `main` branch
   - Monitor the production deployment in Railway dashboard

## Troubleshooting

### Common Issues

1. **Invalid Railway Token**:
   - Ensure the token has proper permissions
   - Check that the token hasn't expired
   - Verify the token is associated with the correct project

2. **Missing Environment Variables**:
   - Ensure all required Supabase credentials are set
   - Check that environment variables are properly configured in Railway

3. **Build Failures**:
   - Run `./validate-railway-deployment.sh` locally first
   - Check the Docker build logs in GitHub Actions
   - Verify all dependencies are properly installed

4. **Health Check Failures**:
   - Ensure the health check endpoint is responding
   - Check that the container starts properly
   - Verify the PORT environment variable is set correctly

### Getting Help

1. Check the Railway deployment troubleshooting guide
2. Review GitHub Actions logs for detailed error messages
3. Use Railway CLI to debug deployment issues:
   ```bash
   railway logs
   railway status
   ```

## Security Best Practices

1. **Use separate tokens** for staging and production
2. **Limit token permissions** to only what's necessary
3. **Rotate tokens regularly** (every 90 days recommended)
4. **Use environment-specific Supabase projects**
5. **Monitor token usage** in Railway dashboard

## Workflow Integration

The CI/CD pipeline will automatically:

- ✅ Test Docker builds on every PR
- ✅ Simulate Railway deployments
- ✅ Validate configuration files
- ✅ Deploy to staging on `develop` branch
- ✅ Deploy to production on `main` branch
- ✅ Run health checks after deployment
- ✅ Send notifications on success/failure
