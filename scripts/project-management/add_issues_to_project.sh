#!/bin/bash


# Script to add all strategic issues to the 'MaintAInPro Roadmap' GitHub project
# This will add issues #27-66 (which correspond to our strategic issues #46-85)
#
# NOTE: Always run this script after create_github_issues.sh to ensure all issues exist before adding to the project.

echo "🚀 Adding all strategic issues to 'MaintAInPro Roadmap' project..."


# Project owner and name
PROJECT_OWNER="Coding-Krakken"
PROJECT_NAME="MaintAInPro Roadmap"

# Get the project number for the project name (handle array output)
PROJECT_LIST_JSON=$(gh project list --owner "$PROJECT_OWNER" --format json)
echo "--- DEBUG: Raw project list JSON ---"
echo "$PROJECT_LIST_JSON"
echo "--- END DEBUG ---"
if [[ -z "$PROJECT_LIST_JSON" ]]; then
  echo "❌ Could not fetch project list. Exiting."
  exit 1
fi
PROJECT_NUMBER=$(echo "$PROJECT_LIST_JSON" | jq -r ".projects[] | select(.title == \"$PROJECT_NAME\") | .number")
if [[ -z "$PROJECT_NUMBER" ]]; then
  echo "❌ Could not find project number for '$PROJECT_NAME'. Exiting."
  exit 1
fi

# Function to add issue to project

add_issue_to_project() {
  local issue_number=$1
  local issue_url="https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$issue_number"
  # Check if the issue is already in the project
  local already_added=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | jq -r ".items[] | select(.content_url == \"$issue_url\") | .content_url")
  if [[ "$already_added" == "$issue_url" ]]; then
    echo "⚠️ Issue #$issue_number already in project. Skipping."
    return 1
  fi
  echo "Adding issue #$issue_number to project '$PROJECT_NAME' (Project #$PROJECT_NUMBER)"
  # Try to add the issue to the project
  gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$issue_url"
  if [[ $? -eq 0 ]]; then
    echo "✅ Successfully added issue #$issue_number to project"
    return 0
  else
    echo "❌ Failed to add issue #$issue_number to project"
    return 2
  fi
}

# Get the list of recently created issues (our strategic issues)
echo "📋 Getting list of strategic issues..."

# Batch fetch all existing issues and project items
existing_issues=$(gh issue list --state all --json number,title | jq -r '.[] | "\(.number):\(.title)"')
existing_project_items=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json | jq -r '.items[].content_url')

# Build lookup maps
declare -A issue_title_to_number
while IFS=: read -r num title; do
  issue_title_to_number["$title"]=$num
done <<< "$existing_issues"

declare -A project_item_urls
for url in $existing_project_items; do
  project_item_urls["$url"]=1
done

# Add all issues from markdown files in the issues/ directory (recursively)
created_count=0
skipped_count=0
failed_count=0
find /workspaces/MaintAInPro/issues -type f -name '*.md' | while read issue_file; do
  # Extract issue number or filename for logging
  issue_id=$(basename $(dirname "$issue_file"))
  # Only process files that start with a markdown heading (likely an issue)
  if grep -q '^# ' "$issue_file"; then
    # Try to extract the GitHub issue number from the filename or directory
    # If the issue was just created, try to find its number by title
    title=$(head -n 1 "$issue_file" | sed 's/^# //')
    issue_number=${issue_title_to_number["$title"]}
    issue_url="https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$issue_number"
    if [[ -z "$issue_number" ]]; then
      echo "❌ Could not find GitHub issue for $title (from $issue_file, skipping)"
      continue
    fi
    echo "🔗 Processing: $title (GitHub issue #$issue_number, from $issue_file)"
    if [[ -n "${project_item_urls["$issue_url"]}" ]]; then
      echo "⚠️ Issue #$issue_number already in project. Skipping."
      skipped_count=$((skipped_count+1))
    else
      # Try to add the issue to the project
      gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$issue_url"
      if [[ $? -eq 0 ]]; then
        echo "✅ Successfully added issue #$issue_number to project"
        created_count=$((created_count+1))
      else
        echo "❌ Failed to add issue #$issue_number to project"
        failed_count=$((failed_count+1))
      fi
    fi
  else
  echo "❌ Skipping $issue_file (no markdown heading found)"
    skipped_count=$((skipped_count+1))
  fi
done

echo ""
echo "🎉 Project assignment completed!"
echo "📊 Summary:"
echo "   - Total issues processed: $((created_count + skipped_count + failed_count))"
echo "   - Total issues added: $created_count"
echo "   - Total issues skipped: $skipped_count"
echo "   - Total issues failed: $failed_count"
echo "   - Project: '$PROJECT_NAME' (Project #$PROJECT_NUMBER)"
echo ""
echo "🔗 View project at: https://github.com/users/Coding-Krakken/projects"
