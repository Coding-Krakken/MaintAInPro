# Repository Labels Configuration

This file documents the GitHub labels used in the autonomous development loop.

## Automated System Labels

- **autoplan** (Color: #0366d6)
  - Description: Issue created automatically by the Blueprint planner
  - Used by: Planner workflow

- **agent-ok** (Color: #28a745)
  - Description: Issue approved for GitHub Copilot coding agent
  - Required for: Copilot agent to work on the issue

- **automerge** (Color: #6f42c1)
  - Description: PR approved for automatic merging after CI passes
  - Used by: PR pipeline for auto-merge

- **blocked** (Color: #d73a49)
  - Description: Work is blocked pending resolution
  - Prevents: Automatic processing

- **needs-human** (Color: #fbca04)
  - Description: Requires human review or intervention
  - Triggers: Manual review process

## Manual Setup Required

These labels need to be created manually in the GitHub repository:

1. Go to repository Settings > Labels
2. Create each label with the specified name, color, and description
3. Or use GitHub CLI:

```bash
gh label create "autoplan" --color "0366d6" --description "Issue created automatically by the Blueprint planner"
gh label create "agent-ok" --color "28a745" --description "Issue approved for GitHub Copilot coding agent"
gh label create "automerge" --color "6f42c1" --description "PR approved for automatic merging after CI passes"
gh label create "blocked" --color "d73a49" --description "Work is blocked pending resolution"
gh label create "needs-human" --color "fbca04" --description "Requires human review or intervention"
```

## Usage Patterns

### Automated Flow
1. Planner creates issue with `autoplan` + `agent-ok`
2. Copilot agent creates PR for `agent-ok` issues
3. Human adds `automerge` to approved PRs
4. CI automatically merges PRs with `automerge` after checks pass

### Manual Intervention
- Add `blocked` to pause automatic processing
- Add `needs-human` when Copilot needs guidance
- Remove `agent-ok` to exclude from automated processing
