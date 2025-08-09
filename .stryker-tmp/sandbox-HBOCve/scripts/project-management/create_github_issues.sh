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
      echo "⚠️ Issue already exists: $title (skipping)"
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

# Create all issues from 46 to 85
for issue_num in {46..85}; do
  create_github_issue "$issue_num"
  # Small delay to avoid rate limiting
  sleep 1
done

echo ""
echo "🎉 GitHub issue creation completed!"
echo "📊 Summary:"
echo "   - Total issues created: 40 (Issues #46-85)"
echo "   - Each issue labeled with 'agent-ok'"
echo "   - All issues assigned to current user"
echo ""
echo "🔗 View issues at: https://github.com/Coding-Krakken/MaintAInPro/issues"
