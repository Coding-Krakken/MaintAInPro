#!/usr/bin/env bash
# Config validation script
set -e
npm run validate:config || echo "Config validation failed" > MaintAInPro.wiki/Config-Validation.md
echo "Config validation completed."
