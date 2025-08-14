# Automatic Domain Management Guide

This guide explains how MaintAInPro automatically manages custom domain pointing
to ensure your domains always point to the latest deployments.

## Overview

The system automatically manages two sets of domains:

### Main Branch (Production)

- `unitedautosupply.org` → Latest main branch deployment
* `www.unitedautosupply.org` is a CNAME alias for `unitedautosupply.org` and does not require separate alias updates.

### Stable Branch

- `uasmaintenance.com` → Latest stable branch deployment
- `www.uasmaintenance.com` → Latest stable branch deployment

## How It Works

### 1. Automatic GitHub Actions (Recommended)

When you push to `main` or `stable` branches, GitHub Actions automatically:

1. **Deploy to Vercel** - Creates new deployment
2. **Update Domain Aliases** - Points domains to new deployment
3. **Verify Deployment** - Confirms everything is working

#### Setup Requirements

Ensure these secrets are configured in GitHub Settings > Secrets and variables >
Actions:

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

#### Branch Mapping

- **Push to `main`** → Updates `unitedautosupply.org` and
   *Note: `www.unitedautosupply.org` is managed as a CNAME and does not require direct alias updates.*
- **Push to `stable`** → Updates `uasmaintenance.com` and
  `www.uasmaintenance.com`

### 2. Manual Domain Management

Use the provided script for manual control:

```bash
# List current domain aliases
./scripts/development/domain-management.sh list

# Update main branch domains to latest deployment
./scripts/development/domain-management.sh update-main

# Update stable branch domains to latest deployment
./scripts/development/domain-management.sh update-stable

# Update all domains to latest deployment
./scripts/development/domain-management.sh update-all

# Verify domain status
./scripts/development/domain-management.sh verify

# Show setup instructions
./scripts/development/domain-management.sh setup
```

### 3. Manual Vercel CLI Commands

For direct control:

```bash
# Get latest deployment
vercel ls --scope coding-krakken-projects

# Update specific domain
vercel alias set <deployment-url> unitedautosupply.org --scope coding-krakken-projects

# List current aliases
vercel alias ls --scope coding-krakken-projects
```

## Deployment Workflows

### Automatic Flow

1. **Developer pushes to main/stable**
2. **GitHub Actions triggers**
3. **Code builds and deploys to Vercel**
4. **Domain aliases update automatically**
5. **Health checks verify deployment**
6. **Domains serve latest code**

### Manual Override Flow

1. **Run domain management script**
2. **Script gets latest deployment URL**
3. **Updates domain aliases**
4. **Verifies pointing status**

## Troubleshooting

### Domain Not Updating

1. **Check GitHub Actions logs**:
   - Go to Actions tab in GitHub
   - Look for "Deploy & Verify" or "Automatic Domain Management" workflows
   - Check for failures in domain alias steps

2. **Verify Vercel permissions**:

   ```bash
   vercel domains ls --scope coding-krakken-projects
   ```

3. **Manual update**:
   ```bash
   ./scripts/development/domain-management.sh update-main
   ```

### DNS Propagation

- Domain changes may take 5-15 minutes to propagate globally
- Use different browsers or incognito mode to test
- Check with DNS lookup tools: `nslookup unitedautosupply.org`

### GitHub Actions Not Triggering

1. **Check branch protection rules**
2. **Verify secrets are set correctly**
3. **Ensure workflow files are in `.github/workflows/`**
4. **Check workflow permissions**

## Configuration Files

### `.github/workflows/deploy.yml`

- Main deployment workflow
- Handles build, deploy, and domain updates
- Triggers on push to main, stable, or Replit branches

### `.github/workflows/domain-management.yml`

- Dedicated domain management workflow
- Can be triggered manually
- Provides force update option

### `vercel.json`

- Vercel configuration
- Specifies build settings and routing
- Enables deployment for main and stable branches

### `scripts/development/domain-management.sh`

- Manual domain management script
- Provides easy CLI interface
- Includes verification and status checks

## Best Practices

### 1. Use Branch Strategy

- **main**: Production-ready code → `unitedautosupply.org`
- **stable**: Tested stable releases → `uasmaintenance.com`
- **feature branches**: Use Vercel preview URLs

### 2. Monitor Deployments

- Check GitHub Actions for deployment status
- Verify domain updates in Vercel dashboard
- Use health checks to confirm deployment success

### 3. Emergency Procedures

- Keep manual scripts ready for quick fixes
- Know how to rollback via Vercel dashboard
- Have monitoring alerts set up

## Advanced Configuration

### Force Update All Domains

Use the GitHub Actions manual trigger:

1. Go to Actions tab
2. Select "Automatic Domain Management"
3. Click "Run workflow"
4. Enable "Force update all domain aliases"
5. Run workflow

### Custom Domain Configuration

To add new domains:

1. **Add domain to Vercel**:

   ```bash
   vercel domains add your-new-domain.com --scope coding-krakken-projects
   ```

2. **Update scripts** to include new domain in arrays

3. **Update GitHub Actions** to handle new domain mapping

### Monitoring and Alerts

Set up monitoring for:

- Deployment failures
- Domain pointing issues
- SSL certificate renewals
- Performance metrics

## Security Considerations

- Keep Vercel tokens secure and rotate regularly
- Use least-privilege access for GitHub Actions
- Monitor domain changes for unauthorized updates
- Set up alerts for deployment failures

## Support

For issues with automatic domain management:

1. Check this documentation
2. Review GitHub Actions logs
3. Use manual scripts for quick fixes
4. Check Vercel dashboard for deployment status
5. Create GitHub issue with `domain-management` label
