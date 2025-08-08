# Vercel Deployment Configuration

This document outlines the Vercel deployment setup for MaintAInPro CMMS, including required secrets, environment variables, and deployment strategies.

## Overview

MaintAInPro is configured for deployment on Vercel with:
- **Frontend**: Static build served via Vercel's CDN
- **Backend**: Express.js API running as serverless functions
- **Database**: PostgreSQL (external provider)
- **Monitoring**: Health checks and error tracking

## Required Secrets

### Core Vercel Secrets
These secrets must be configured in your Vercel project dashboard:

```bash
# Vercel CLI Configuration
VERCEL_TOKEN="vercel_token_here"           # Vercel API token for deployments
VERCEL_ORG_ID="team_org_id"                # Your Vercel organization/team ID
VERCEL_PROJECT_ID="project_id_here"        # Your Vercel project ID
```

### Application Secrets

#### Authentication & Security
```bash
JWT_SECRET="your-super-secret-jwt-key-here"              # 256-bit secret for JWT tokens
JWT_REFRESH_SECRET="your-refresh-secret-here"            # Separate secret for refresh tokens
ENCRYPTION_KEY="32-character-encryption-key"             # For sensitive data encryption
```

#### Database
```bash
DATABASE_URL="postgresql://user:pass@host:port/db"       # Primary PostgreSQL connection
POSTGRES_URL="postgresql://user:pass@host:port/db"       # Alternative PostgreSQL URL
```

#### Email & Communications
```bash
SMTP_HOST="smtp.provider.com"                            # SMTP server hostname
SMTP_PORT="587"                                          # SMTP port (587 for TLS)
SMTP_USER="your-email@domain.com"                        # SMTP username
SMTP_PASS="your-smtp-password"                           # SMTP password
SMTP_FROM="noreply@maintainpro.com"                      # From email address
```

#### External APIs (Optional)
```bash
OPENAI_API_KEY="sk-your-openai-key"                      # For AI features
STRIPE_SECRET_KEY="sk_live_your-stripe-key"              # For billing
SENTRY_DSN="https://your-sentry-dsn"                     # Error tracking
ANALYTICS_ID="your-analytics-id"                         # Web analytics
```

## Feature Flags

Control feature rollouts with environment variables:

```bash
# AI & Machine Learning
FEATURE_AI_ENABLED="true"                                # Enable AI-powered features
FEATURE_PREDICTIVE_MAINTENANCE="false"                   # Predictive maintenance algorithms

# Real-time Features
FEATURE_REALTIME_ENABLED="true"                          # WebSocket real-time updates
FEATURE_LIVE_NOTIFICATIONS="true"                        # Live notification system

# Analytics & Reporting
FEATURE_ADVANCED_ANALYTICS="true"                        # Advanced reporting features
FEATURE_CUSTOM_DASHBOARDS="false"                        # Custom dashboard builder

# Mobile & Apps
FEATURE_MOBILE_APP="false"                               # Mobile app API endpoints
FEATURE_OFFLINE_MODE="false"                             # Offline functionality

# Experimental
FEATURE_BETA_UI="false"                                  # Beta UI components
FEATURE_NEW_WORKFLOW_ENGINE="false"                      # New workflow system
```

## Environment Setup

### 1. Local Development
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local

# Test environment
npm run scripts/print_env.sh
```

### 2. Vercel Project Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Set secrets (run for each secret)
vercel env add VARIABLE_NAME
```

### 3. GitHub Secrets (for CI/CD)
Add these secrets to your GitHub repository settings:

```
VERCEL_TOKEN          # Vercel API token
VERCEL_ORG_ID         # Organization ID  
VERCEL_PROJECT_ID     # Project ID
CODECOV_TOKEN         # Code coverage reporting (optional)
```

## Deployment Configuration

### Build Settings
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm ci`

### Function Settings
- **Runtime**: Node.js 18.x
- **Timeout**: 10 seconds (API), 5 seconds (health)
- **Memory**: 1024 MB
- **Region**: Auto (global distribution)

### Domain Setup
- **Production**: `app.maintainpro.com`
- **Preview**: `preview-{branch}.maintainpro.com`
- **Development**: `localhost:3000`

## Health Check Endpoint

The application includes a comprehensive health check at `/health`:

```json
{
  "status": "ok",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "sha": "abc123...",
  "buildId": "deployment-id",
  "environment": "production",
  "region": "iad1",
  "url": "app.maintainpro.com",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": { "rss": 52428800, "heapUsed": 28311552 },
  "features": {
    "auth": "enabled",
    "database": "enabled",
    "redis": "disabled",
    "email": "enabled"
  }
}
```

## Monitoring & Alerts

### Vercel Analytics
- **Core Web Vitals**: Automatically tracked
- **Function Metrics**: Execution time, memory usage
- **Error Rate**: 4xx/5xx response monitoring

### Custom Monitoring
```bash
# Health check monitoring (external)
curl -f https://app.maintainpro.com/health || exit 1

# Database connectivity check
curl -f https://app.maintainpro.com/api/health/db || exit 1

# Feature flag status
curl -s https://app.maintainpro.com/health | jq .features
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
vercel logs --follow

# Local build test
npm run build
npm run start
```

#### 2. Function Timeouts
- Review function execution time in Vercel dashboard
- Optimize database queries
- Implement caching for slow operations

#### 3. Environment Variable Issues
```bash
# Verify all variables are set
npm run scripts/print_env.sh

# Check Vercel environment
vercel env ls
```

#### 4. Database Connection Issues
- Verify DATABASE_URL format
- Check connection pooling limits
- Review PostgreSQL logs

### Emergency Procedures

#### Quick Rollback
```bash
# Promote previous deployment
vercel promote DEPLOYMENT_URL --scope=team

# Or revert via dashboard
# Vercel Dashboard > Deployments > Previous > Promote
```

#### Feature Flag Emergency Disable
```bash
# Disable problematic feature immediately
vercel env add FEATURE_PROBLEMATIC_FEATURE false
```

#### Manual Health Check
```bash
# Test all endpoints
curl -f https://app.maintainpro.com/health
curl -f https://app.maintainpro.com/api/health
curl -f https://app.maintainpro.com/api/auth/status
```

## Security Considerations

### Secret Management
- Use Vercel's encrypted environment variables
- Rotate secrets regularly (quarterly)
- Never commit secrets to git
- Use different secrets for production/preview/development

### Network Security
- Enable Vercel's DDoS protection
- Configure rate limiting in application
- Use HTTPS everywhere (automatic with Vercel)
- Implement proper CORS policies

### Access Control
- Limit Vercel team access
- Use GitHub branch protection rules
- Require reviews for production deployments
- Enable audit logging

## Performance Optimization

### CDN & Caching
- Static assets cached at edge locations
- API responses cached with appropriate headers
- Database query caching in application layer

### Bundle Optimization
- Code splitting for large applications
- Tree shaking for unused code
- Compression and minification
- Image optimization with Vercel's Image API

### Function Performance
- Cold start optimization
- Memory allocation tuning
- Connection pooling
- Async/await best practices

## Cost Management

### Resource Usage
- Monitor function execution time
- Track bandwidth usage
- Review build minutes
- Optimize for cost efficiency

### Scaling Considerations
- Auto-scaling with Vercel Pro/Enterprise
- Database connection limits
- External service rate limits
- Cost alerts and budgets

## Support & Resources

### Documentation Links
- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Contact Information
- **Technical Issues**: Create GitHub issue with `deployment` label
- **Security Issues**: Email security@maintainpro.com
- **Vercel Support**: Use Vercel dashboard support chat

---

**Last Updated**: January 8, 2025  
**Version**: 1.0.0  
**Maintainer**: MaintAInPro Development Team
