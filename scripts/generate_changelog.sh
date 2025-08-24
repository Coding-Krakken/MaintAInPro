#!/usr/bin/env bash
# Generate changelog from git history
set -e
git log --pretty=format:'* %s (%an, %ad)' --date=short > MaintAInPro.wiki/Changelog.md
echo "Changelog updated."
