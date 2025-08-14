# GitHub Projects Management Script

## Overview

This script (`scripts/project-management/add-issues-to-project.js`)
automatically adds all open issues from the MaintAInPro repository to the
"MaintAInPro Roadmap" GitHub Project.

## Features

- ✅ Fetches all open issues from the repository
- ✅ Creates the "MaintAInPro Roadmap" project if it doesn't exist
- ✅ Adds all issues to the project (skips duplicates)
- ✅ Provides detailed progress reporting
- ✅ Handles rate limiting appropriately
- ✅ Works with both Organization and User accounts

## Usage

### Prerequisites

1. GitHub token with appropriate permissions:
   - `repo` scope for reading issues
   - `project` scope for managing projects

2. Set the token as an environment variable:
   ```bash
   export GITHUB_TOKEN="your_github_token_here"
   ```

### Running the Script

```bash
# Using npm script (recommended)
npm run project:add-issues

# Or directly with node
node scripts/project-management/add-issues-to-project.js
```

### Expected Output

```
🚀 Starting GitHub Project Issue Management...

🔍 Fetching open issues...
   Found 25 issues on page 1
   Found 21 issues on page 2
✅ Total open issues found: 46

🔍 Looking for MaintAInPro Roadmap project...
📝 Creating new project: MaintAInPro Roadmap...
✅ Created new project: MaintAInPro Roadmap (1)

📝 Adding 46 issues to project...
   ✅ Added issue #68: 🚨 Production Deployment Failed - a356a4a
   ✅ Added issue #67: 🚨 Production Deployment Failed - 896d2b7
   ✅ Added issue #66: Create Preventive Maintenance Scheduler
   ...
   ✅ Added issue #39: Create Input Sanitization Utilities

📊 Summary:
   - Added: 46 issues
   - Skipped: 0 issues
   - Total: 46 issues processed

🎉 Successfully completed GitHub Project management!
   Project: https://github.com/Coding-Krakken/MaintAInPro/projects/1
```

## GitHub Actions Integration

You can also run this script in GitHub Actions by adding it to a workflow:

```yaml
name: Sync Issues to Project
on:
  issues:
    types: [opened]
  workflow_dispatch:

jobs:
  sync-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run project:add-issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Technical Details

### GitHub Projects v2 API

The script uses GitHub's Projects v2 GraphQL API, which provides:

- Better performance than REST API
- Native support for project management
- Atomic operations for adding items

### Rate Limiting

The script implements appropriate rate limiting:

- 100ms delay between issue additions
- Handles API errors gracefully
- Skips already-added issues

### Error Handling

- Validates environment variables
- Provides clear error messages
- Graceful handling of duplicate items
- Continues processing on individual failures

## Troubleshooting

### Permission Errors

- Ensure your GitHub token has `repo` and `project` scopes
- Check that you have admin access to the repository

### API Rate Limits

- The script implements delays to avoid rate limiting
- If you hit limits, wait and retry later

### Project Not Found

- The script will create the project if it doesn't exist
- Ensure your token has project creation permissions

## Integration with Existing Workflow

This script complements the existing blueprint planner workflow:

1. **Blueprint Planner** (`planner.yml`) creates issues from documentation
2. **Project Manager** (this script) organizes all issues into the roadmap
   project
3. **Agents** work on issues labeled with `agent-ok`

## Maintenance

The script is designed to be idempotent - you can run it multiple times safely:

- Won't create duplicate projects
- Won't add duplicate issues
- Provides clear status reporting

This ensures the roadmap stays synchronized with repository issues.
