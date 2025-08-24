#!/usr/bin/env bash
# Onboarding guide generation script
set -e
cat runbooks/oncall.md runbooks/release_steps.md runbooks/rollback.md > MaintAInPro.wiki/Onboarding-Guide.md
echo "Onboarding guide generated."
