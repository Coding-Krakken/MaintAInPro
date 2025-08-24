#!/usr/bin/env bash
# MaintAInPro Copilot Orchestrator Script
# Runs all repo automation tasks in a single session

set -e

# 1. Code Quality Gates
npm run quality

# 2. Test Automation
npm run test:all

# 3. Dependency Updates (requires npm-check-updates)
npx npm-check-updates -u && npm install

# 4. Security Scan (SARIF report)
npm audit --json > SARIF report/security_audit.json

# 5. Wiki Sync (custom script)
if [ -f scripts/sync_wiki.sh ]; then
  bash scripts/sync_wiki.sh
fi

# 6. Release Notes/Changelog Generation
if [ -f scripts/generate_changelog.sh ]; then
  bash scripts/generate_changelog.sh
fi

# 7. Health Checks
if [ -f scripts/health_check.sh ]; then
  bash scripts/health_check.sh
fi

# 8. Audit & Traceability
if [ -f scripts/log_audit.sh ]; then
  bash scripts/log_audit.sh
fi

# 9. Config/Blueprint Validation
if [ -f scripts/validate_config.sh ]; then
  bash scripts/validate_config.sh
fi

# 10. Onboarding/Runbook Generation
if [ -f scripts/generate_onboarding.sh ]; then
  bash scripts/generate_onboarding.sh
fi

echo "Copilot Orchestrator: All automation tasks completed."
