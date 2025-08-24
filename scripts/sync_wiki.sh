#!/usr/bin/env bash
# sync_wiki.sh: Syncs source-of-truth docs to the Wiki repo
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
WIKI_DIR="$REPO_ROOT/MaintAInPro.wiki"

# List of source-of-truth files to sync (add more as needed)
FILES_TO_SYNC=(
  "$REPO_ROOT/README.md"
  "$REPO_ROOT/docs/vision.md"
  "$REPO_ROOT/docs/discovery.md"
  "$REPO_ROOT/docs/architecture/README.md"
  "$REPO_ROOT/docs/decisions/README.md"
  "$REPO_ROOT/docs/ops/README.md"
  "$REPO_ROOT/runbooks/calibration.md"
  "$REPO_ROOT/requirements/frd.md"
  "$REPO_ROOT/requirements/nfr.yml"
  "$REPO_ROOT/requirements/compliance.yml"
  "$REPO_ROOT/requirements/privacy.yml"
)

for src in "${FILES_TO_SYNC[@]}"; do
  fname=$(basename "$src")
  cp "$src" "$WIKI_DIR/$fname"
done

cd "$WIKI_DIR"
git add .
git commit -m "Auto-sync Wiki from source-of-truth files [ci skip]"
git push
