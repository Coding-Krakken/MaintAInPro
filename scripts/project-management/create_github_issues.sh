#!/bin/bash

# Script to create GitHub issues from our strategic breakdown
# This will create issues #46-85 based on our focused task breakdown

echo "🚀 Creating GitHub issues for MaintAInPro strategic roadmap..."

# Function to create GitHub issue
create_github_issue() {
  local issue_num=$1
  local issue_file="/workspaces/MaintAInPro/issues/$issue_num/issue.md"
  if [[ -f "$issue_file" ]]; then
    # Extract title from the first line (removing # prefix)
    local title=$(head -n 1 "$issue_file" | sed 's/^# //')
    # Check if an issue with this title already exists
    local existing_issue=$(gh issue list --search "$title" --state all --json title | jq -r ".[] | select(.title == \"$title\") | .title")
    if [[ "$existing_issue" == "$title" ]]; then
  echo "⚠️ Issue already exists: $title (from $issue_file, skipping)"
      return
    fi
    # Create the issue and capture the issue number
    echo "Creating issue: $title"
    gh issue create \
      --title "$title" \
      --body-file "$issue_file" \
      --label "agent-ok" \
      --assignee "@me"
    if [[ $? -eq 0 ]]; then
      echo "✅ Successfully created issue #$issue_num: $title"
    else
      echo "❌ Failed to create issue #$issue_num: $title"
    fi
  else
    echo "❌ Issue file not found: $issue_file"
  fi
}


# Create issues from all markdown files in the issues/ directory (recursively)
find /workspaces/MaintAInPro/issues -type f -name '*.md' | while read issue_file; do
  # Extract issue number or filename for logging
  issue_id=$(basename $(dirname "$issue_file"))
  # Only process files that start with a markdown heading (likely an issue)
  if grep -q '^# ' "$issue_file"; then
    # Extract title from the first line
    title=$(head -n 1 "$issue_file" | sed 's/^# //')
    # Check if an issue with this title already exists
    existing_issue=$(gh issue list --search "$title" --state all --json title | jq -r ".[] | select(.title == \"$title\") | .title")
    if [[ "$existing_issue" == "$title" ]]; then
      echo "⚠️ Issue already exists: $title (skipping)"
      continue
    fi
  echo "🚀 Creating issue: $title (from $issue_file)"
    gh issue create \
      --title "$title" \
      --body-file "$issue_file" \
      --label "agent-ok" \
      --assignee "@me"
    if [[ $? -eq 0 ]]; then
  echo "✅ Successfully created issue: $title (from $issue_file)"
    else
  echo "❌ Failed to create issue: $title (from $issue_file)"
    fi
  else
  echo "❌ Skipping $issue_file (no markdown heading found)"
  fi
done


# Track summary stats
created_count=0
skipped_count=0
failed_count=0

# Create issues from all markdown files in the issues/ directory (recursively)

# Batch fetch all existing issues
existing_issues=$(gh issue list --state all --json title | jq -r '.[] | .title')
declare -A existing_titles
for title in $existing_issues; do
  existing_titles["$title"]=1
done

find /workspaces/MaintAInPro/issues -type f -name '*.md' | while read issue_file; do
  title=$(head -n 1 "$issue_file" | sed 's/^# //')
  if [[ -n "${existing_titles["$title"]}" ]]; then
    echo "⚠️ Issue already exists: $title (skipping)"
    skipped_count=$((skipped_count+1))
    continue
  fi
  echo "🚀 Creating issue: $title (from $issue_file)"
  gh issue create \
    --title "$title" \
    --body-file "$issue_file" \
    --label "agent-ok" \
    --assignee "@me"
  if [[ $? -eq 0 ]]; then
    echo "✅ Successfully created issue: $title (from $issue_file)"
    created_count=$((created_count+1))
  else
    echo "❌ Failed to create issue: $title (from $issue_file)"
    failed_count=$((failed_count+1))
  fi
  sleep 1
done

echo ""
echo "🎉 GitHub issue creation completed!"
echo "📊 Summary:"
echo "   - Total issues created: $created_count"
echo "   - Total issues skipped: $skipped_count"
echo "   - Total issues failed: $failed_count"
echo "   - Each issue labeled with 'agent-ok'"
echo "   - All issues assigned to current user"
echo ""
echo "🔗 View issues at: https://github.com/Coding-Krakken/MaintAInPro/issues"
