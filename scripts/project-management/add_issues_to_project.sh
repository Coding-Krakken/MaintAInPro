#!/bin/bash

# Script to add all strategic issues to the 'MaintAInPro Roadmap' GitHub project
# This will add issues #27-66 (which correspond to our strategic issues #46-85)

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
  echo "Adding issue #$issue_number to project '$PROJECT_NAME' (Project #$PROJECT_NUMBER)"
  # Try to add the issue to the project
  gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$issue_url"
  if [[ $? -eq 0 ]]; then
    echo "✅ Successfully added issue #$issue_number to project"
  else
    echo "❌ Failed to add issue #$issue_number to project"
  fi
}

# Get the list of recently created issues (our strategic issues)
echo "📋 Getting list of strategic issues..."

# Get issues from 27 to 66 (these correspond to our strategic breakdown)
for issue_num in {27..66}; do
  add_issue_to_project "$issue_num"
  # Small delay to avoid rate limiting
  sleep 0.5
done

echo ""
echo "🎉 Project assignment completed!"
echo "📊 Summary:"
echo "   - Total issues processed: 40 (Issues #27-66)"
echo "   - Project: '$PROJECT_NAME' (Project #$PROJECT_NUMBER)"
echo ""
echo "🔗 View project at: https://github.com/users/Coding-Krakken/projects"
