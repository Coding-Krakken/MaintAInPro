#!/usr/bin/env bash
# Health check script
set -e
npm run health || echo "Health check failed" > MaintAInPro.wiki/Health-Status.md
echo "Health check completed."
