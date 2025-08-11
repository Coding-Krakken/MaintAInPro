#!/bin/bash

# Script to create GitHub issues from markdown files and add them to the MaintAInPro Roadmap project
# Combines and optimizes previous create_github_issues.sh and add_issues_to_project.sh logic

PROJECT_OWNER="Coding-Krakken"
PROJECT_NAME="MaintAInPro Roadmap"
PROJECT_NUMBER=1 # Hardcoded for classic user project

created_count=0
skipped_count=0
failed_count=0
not_in_project_urls=()
duplicate_issue_numbers=()
deleted_count=0

declare -A issue_title_to_number

echo "Fetching all existing issues..."


# Function to normalize text (lowercase, remove punctuation, trim spaces)
normalize_text() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '[:punct:]' | xargs
}

# Function to calculate similarity (returns percent similarity)
similarity() {
  local a="$1"
  local b="$2"
  # Use awk to get common length
  local len_a=${#a}
  local len_b=${#b}
  local min_len=$((len_a<len_b?len_a:len_b))
  local match=0
  for ((i=0; i<min_len; i++)); do
    if [[ "${a:i:1}" == "${b:i:1}" ]]; then
      match=$((match+1))
    fi
  done
  echo $((100*match/(len_a>len_b?len_a:len_b)))
}

declare -A issue_title_to_number
declare -A issue_body_to_number
declare -A issue_number_to_body
issue_titles=()
issue_bodies=()
issue_numbers=()



# Use Python script for optimal duplicate detection
issues_json=$(gh issue list --state all --limit 1000 --json number,title,body)
duplicate_issue_numbers=()
while IFS= read -r num; do
  duplicate_issue_numbers+=("$num")
done < <(echo "$issues_json" | python3 /workspaces/MaintAInPro/scripts/project-management/detect_duplicates.py)

echo "Fetching all project items..."
project_items_json=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json)
project_item_urls=$(echo "$project_items_json" | jq -r '.items[].content_url')
declare -A project_item_urls_map
for url in $project_item_urls; do
  project_item_urls_map["$url"]=1
done

run_sync_issues=false
run_add_to_project=false
run_check_duplicates=false
run_delete_duplicates=false

for arg in "$@"; do
  case $arg in
    --sync-issues|-s)
      run_sync_issues=true
      ;;
    --add-to-project|-a)
      run_add_to_project=true
      ;;
    --check-duplicates|-c)
      run_check_duplicates=true
      ;;
    --delete-duplicates|-d)
      run_delete_duplicates=true
      ;;
    *)
      ;;
  esac
done

if ! $run_sync_issues && ! $run_add_to_project && ! $run_check_duplicates && ! $run_delete_duplicates; then
  echo "Usage: $0 [--sync-issues|-s] [--add-to-project|-a] [--check-duplicates|-c] [--delete-duplicates|-d]"
  exit 0
fi

if $run_sync_issues; then
  echo "Processing markdown files for issue creation..."
  for issue_file in $(find /workspaces/MaintAInPro/issues -type f -name '*.md'); do
    title=$(head -n 1 "$issue_file" | sed 's/^# //')
    clean_title=$(printf "%s" "$title" | xargs)
    issue_number="${issue_title_to_number["$clean_title"]}"
    issue_url="https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$issue_number"

    # Only create issue if title does not exist in lookup
    if [[ -z "$issue_number" ]]; then
      echo "🚀 Creating issue: $title (from $issue_file)"
      gh issue create \
        --title "$title" \
        --body-file "$issue_file" \
        --label "agent-ok" \
        --assignee "Coding-Krakken"
      if [[ $? -eq 0 ]]; then
        new_issue_number=$(gh issue list --search "$title" --state all --json number,title | jq -r ".[] | select(.title == \"$title\") | .number")
        issue_number="$new_issue_number"
        issue_url="https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$issue_number"
        echo "✅ Successfully created issue: $title (#$issue_number)"
        created_count=$((created_count + 1))
        issue_title_to_number["$clean_title"]="$issue_number"
      else
        echo "❌ Failed to create issue: $title (from $issue_file)"
        failed_count=$((failed_count + 1))
        continue
      fi
      sleep 1
    else
      echo "⚠️ Issue already exists: $title (#$issue_number, skipping creation)"
      skipped_count=$((skipped_count + 1))
    fi
  done
  echo ""
  echo "🎉 Issue sync completed!"
  echo "📊 Summary:"
  echo "   - Total issues processed: $((created_count + skipped_count + failed_count))"
  echo "   - Total issues created: $created_count"
  echo "   - Total issues skipped (already exist): $skipped_count"
  echo "   - Total issues failed: $failed_count"
  echo ""
  echo "🔗 View issues at: https://github.com/$PROJECT_OWNER/MaintAInPro/issues"
fi

if $run_add_to_project; then
  echo "Manual assignment required for these issues (not yet in project):"
  for issue_file in $(find /workspaces/MaintAInPro/issues -type f -name '*.md'); do
    title=$(head -n 1 "$issue_file" | sed 's/^# //')
    clean_title=$(printf "%s" "$title" | xargs)
    issue_number="${issue_title_to_number["$clean_title"]}"
    issue_url="https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$issue_number"
    if [[ -n "$issue_number" ]]; then
      if [[ -z "${project_item_urls_map["$issue_url"]}" ]]; then
        echo "$issue_url"
      fi
    fi
  done
fi

if $run_check_duplicates; then
  echo "Duplicate issues detected (consider deleting these):"
  for num in "${duplicate_issue_numbers[@]}"; do
    echo "https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$num"
  done
fi

if $run_delete_duplicates; then
  echo "Duplicate issues detected (deleting these):"
  for num in "${duplicate_issue_numbers[@]}"; do
    issue_title=$(gh issue view "$num" --json title | jq -r '.title' | xargs)
    canonical_num="${issue_title_to_number["$issue_title"]}"
    if [[ "$num" != "$canonical_num" ]]; then
      echo "Deleting duplicate issue: https://github.com/$PROJECT_OWNER/MaintAInPro/issues/$num"
      gh issue delete "$num" --repo "$PROJECT_OWNER/MaintAInPro" --yes
      if [[ $? -eq 0 ]]; then
        deleted_count=$((deleted_count + 1))
      fi
    fi
  done
  echo ""
  echo "Total duplicate issues deleted: $deleted_count"
fi
