#!/bin/bash

# Environment Variables Diagnostic Script
# Use this script to debug environment variable issues
# DO NOT run this in CI unless debugging - it may expose secrets

echo "🔍 Environment Variables Diagnostic"
echo "=================================="

echo ""
echo "📦 Node.js Environment:"
echo "NODE_VERSION: $(node --version 2>/dev/null || echo 'Not installed')"
echo "NPM_VERSION: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "NODE_ENV: ${NODE_ENV:-'not set'}"

echo ""
echo "🚀 Vercel Environment:"
echo "VERCEL_ENV: ${VERCEL_ENV:-'not set'}"
echo "VERCEL_URL: ${VERCEL_URL:-'not set'}"
echo "VERCEL_REGION: ${VERCEL_REGION:-'not set'}"
echo "VERCEL_GIT_COMMIT_SHA: ${VERCEL_GIT_COMMIT_SHA:-'not set'}"
echo "VERCEL_DEPLOYMENT_ID: ${VERCEL_DEPLOYMENT_ID:-'not set'}"

echo ""
echo "🔐 Authentication Variables:"
if [[ -n "$JWT_SECRET" ]]; then
  echo "JWT_SECRET: ✅ Set (${#JWT_SECRET} characters)"
else
  echo "JWT_SECRET: ❌ Not set"
fi

if [[ -n "$JWT_REFRESH_SECRET" ]]; then
  echo "JWT_REFRESH_SECRET: ✅ Set (${#JWT_REFRESH_SECRET} characters)"
else
  echo "JWT_REFRESH_SECRET: ❌ Not set"
fi

echo ""
echo "💾 Database Variables:"
if [[ -n "$DATABASE_URL" ]]; then
  echo "DATABASE_URL: ✅ Set"
  # Show only the protocol and host, not the full URL with credentials
  DB_MASKED=$(echo "$DATABASE_URL" | sed 's|://[^@]*@|://***:***@|')
  echo "DATABASE_URL (masked): $DB_MASKED"
else
  echo "DATABASE_URL: ❌ Not set"
fi

if [[ -n "$POSTGRES_URL" ]]; then
  echo "POSTGRES_URL: ✅ Set"
else
  echo "POSTGRES_URL: ❌ Not set"
fi

echo ""
echo "📧 Email Variables:"
if [[ -n "$SMTP_HOST" ]]; then
  echo "SMTP_HOST: ✅ Set ($SMTP_HOST)"
else
  echo "SMTP_HOST: ❌ Not set"
fi

if [[ -n "$SMTP_PORT" ]]; then
  echo "SMTP_PORT: ✅ Set ($SMTP_PORT)"
else
  echo "SMTP_PORT: ❌ Not set"
fi

echo ""
echo "🎛️ Feature Flags:"
echo "FEATURE_AI_ENABLED: ${FEATURE_AI_ENABLED:-'not set (defaults to false)'}"
echo "FEATURE_REALTIME_ENABLED: ${FEATURE_REALTIME_ENABLED:-'not set (defaults to false)'}"
echo "FEATURE_ADVANCED_ANALYTICS: ${FEATURE_ADVANCED_ANALYTICS:-'not set (defaults to false)'}"
echo "FEATURE_MOBILE_APP: ${FEATURE_MOBILE_APP:-'not set (defaults to false)'}"

echo ""
echo "📊 Monitoring Variables:"
if [[ -n "$SENTRY_DSN" ]]; then
  echo "SENTRY_DSN: ✅ Set"
else
  echo "SENTRY_DSN: ❌ Not set"
fi

if [[ -n "$ANALYTICS_ID" ]]; then
  echo "ANALYTICS_ID: ✅ Set ($ANALYTICS_ID)"
else
  echo "ANALYTICS_ID: ❌ Not set"
fi

echo ""
echo "🌐 API Keys & External Services:"
if [[ -n "$OPENAI_API_KEY" ]]; then
  echo "OPENAI_API_KEY: ✅ Set (${#OPENAI_API_KEY} characters)"
else
  echo "OPENAI_API_KEY: ❌ Not set"
fi

if [[ -n "$STRIPE_SECRET_KEY" ]]; then
  echo "STRIPE_SECRET_KEY: ✅ Set"
else
  echo "STRIPE_SECRET_KEY: ❌ Not set"
fi

echo ""
echo "⚙️ Build Variables:"
echo "BUILD_ID: ${BUILD_ID:-'not set'}"
echo "CI: ${CI:-'not set'}"
echo "GITHUB_SHA: ${GITHUB_SHA:-'not set'}"

echo ""
echo "📝 Required for Autonomous Operations:"
echo "VERCEL_TOKEN: ${VERCEL_TOKEN:+✅ Set}${VERCEL_TOKEN:-❌ Not set}"
echo "VERCEL_ORG_ID: ${VERCEL_ORG_ID:+✅ Set}${VERCEL_ORG_ID:-❌ Not set}"
echo "VERCEL_PROJECT_ID: ${VERCEL_PROJECT_ID:+✅ Set}${VERCEL_PROJECT_ID:-❌ Not set}"

echo ""
echo "=================================="
echo "✅ Diagnostic complete"

# Check for common issues
echo ""
echo "🔧 Common Issues Check:"

if [[ -z "$DATABASE_URL" ]]; then
  echo "⚠️  Missing DATABASE_URL - Application may fail to start"
fi

if [[ -z "$JWT_SECRET" ]]; then
  echo "⚠️  Missing JWT_SECRET - Authentication will fail"
fi

if [[ -z "$VERCEL_TOKEN" ]] && [[ "$CI" == "true" ]]; then
  echo "⚠️  Missing VERCEL_TOKEN - Automated deployments will fail"
fi

if [[ "$NODE_ENV" == "production" ]] && [[ -z "$SENTRY_DSN" ]]; then
  echo "⚠️  Missing SENTRY_DSN - Error tracking disabled in production"
fi

echo ""
echo "For setup instructions, see: Documentation/Development/Vercel.md"
