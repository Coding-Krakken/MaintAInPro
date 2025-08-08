# Repository Configuration Checklist

This document outlines the manual GitHub repository settings required to enable the autonomous development loop.

## Required GitHub Repository Settings

### 1. Branch Protection Rules

Navigate to **Settings → Branches → Add rule** for `main` branch:

```
✅ Branch name pattern: main
✅ Restrict pushes that create files larger than 100MB
✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale reviews when new commits are pushed
  ✅ Require review from code owners (if CODEOWNERS exists)
✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Status checks: 
      - Build & Tests
      - Security Scan
      - Documentation Check
      - Performance Check
✅ Require conversation resolution before merging
✅ Include administrators (recommended)
```

### 2. Auto-merge Settings

Navigate to **Settings → General → Pull Requests**:

```
✅ Allow auto-merge
✅ Automatically delete head branches
✅ Allow squash merging (recommended)
✅ Allow merge commits (optional)
✅ Allow rebase merging (optional)
```

### 3. Repository Secrets

Navigate to **Settings → Secrets and variables → Actions**:

#### Required Secrets
```bash
VERCEL_TOKEN          # Vercel API token for deployments
VERCEL_ORG_ID         # Your Vercel organization ID
VERCEL_PROJECT_ID     # Your Vercel project ID
```

#### Optional Secrets
```bash
CODECOV_TOKEN         # For code coverage reporting
SENTRY_DSN           # For error tracking
SLACK_WEBHOOK        # For deployment notifications
```

### 4. Security Settings

Navigate to **Settings → Code security and analysis**:

```
✅ Dependency graph
✅ Dependabot alerts
✅ Dependabot security updates
✅ Code scanning (CodeQL)
✅ Secret scanning
✅ Private vulnerability reporting
```

### 5. Issue and PR Templates

These are automatically configured by the setup:

```
✅ .github/pull_request_template.md
✅ .github/copilot-instructions.md
✅ .github/LABELS.md
```

### 6. Repository Labels

Create these labels manually or use GitHub CLI:

#### Using GitHub CLI:
```bash
gh label create "autoplan" --color "0366d6" --description "Issue created automatically by the Blueprint planner"
gh label create "agent-ok" --color "28a745" --description "Issue approved for GitHub Copilot coding agent"
gh label create "automerge" --color "6f42c1" --description "PR approved for automatic merging after CI passes"
gh label create "blocked" --color "d73a49" --description "Work is blocked pending resolution"
gh label create "needs-human" --color "fbca04" --description "Requires human review or intervention"
```

#### Manual Creation:
1. Go to **Issues → Labels**
2. Click **New label** for each:
   - **autoplan** (blue #0366d6): Issue created automatically by the Blueprint planner
   - **agent-ok** (green #28a745): Issue approved for GitHub Copilot coding agent
   - **automerge** (purple #6f42c1): PR approved for automatic merging after CI passes
   - **blocked** (red #d73a49): Work is blocked pending resolution
   - **needs-human** (yellow #fbca04): Requires human review or intervention

### 7. GitHub Actions Permissions

Navigate to **Settings → Actions → General**:

```
✅ Actions permissions: Allow all actions and reusable workflows
✅ Workflow permissions: Read and write permissions
  ✅ Allow GitHub Actions to create and approve pull requests
```

### 8. Vercel Integration

#### Option A: Vercel GitHub App (Recommended)
1. Install [Vercel GitHub App](https://vercel.com/integrations/github)
2. Configure deployment settings in Vercel dashboard
3. Set environment variables in Vercel project settings

#### Option B: Manual Setup
1. Create Vercel project linked to repository
2. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm ci`

### 9. CODEOWNERS (Optional)

Create `.github/CODEOWNERS` for sensitive areas:

```bash
# Global owners
* @team-leads

# Security and CI
.github/ @devops-team
server/middleware/auth.ts @security-team
shared/schema.ts @architecture-team

# Documentation
Documentation/ @tech-writers
*.md @tech-writers
```

### 10. GitHub Copilot for Business

Enable Copilot for your organization:

1. Navigate to **Organization Settings → Copilot**
2. Enable GitHub Copilot
3. Configure policies and permissions
4. Assign Copilot licenses to relevant team members

## Verification Checklist

After configuration, verify the setup:

### ✅ Basic Functionality
- [ ] Create a test issue with `agent-ok` label
- [ ] Verify Copilot can access the repository
- [ ] Test PR creation and auto-merge flow
- [ ] Confirm Vercel deployment works

### ✅ Security
- [ ] Branch protection prevents direct pushes to main
- [ ] Required status checks are enforced
- [ ] Secret scanning is active
- [ ] CodeQL analysis runs on PRs

### ✅ Autonomous Loop
- [ ] Blueprint planner can create issues
- [ ] Issues are automatically assigned to Copilot
- [ ] PRs trigger CI pipeline
- [ ] Successful PRs auto-merge with `automerge` label
- [ ] Deployments trigger post-merge traceability

### ✅ Error Handling
- [ ] Failed deployments trigger recovery procedures
- [ ] Health check failures initiate rollback
- [ ] Critical issues create emergency tickets
- [ ] Manual intervention points work correctly

## Troubleshooting

### Common Issues

#### 1. Auto-merge Not Working
```bash
# Check branch protection rules
# Verify required status checks are passing
# Ensure auto-merge is enabled in repository settings
```

#### 2. Vercel Deployment Failures
```bash
# Verify VERCEL_TOKEN has correct permissions
# Check VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct
# Review Vercel project settings match repository
```

#### 3. GitHub Actions Permission Issues
```bash
# Check Actions permissions allow write access
# Verify GITHUB_TOKEN has sufficient permissions
# Review branch protection rules don't block Actions
```

#### 4. Copilot Not Responding to Issues
```bash
# Verify issue has 'agent-ok' label
# Check Copilot has access to repository
# Ensure issue format matches expected template
```

### Emergency Procedures

#### Disable Autonomous Loop
1. Add `blocked` label to all open issues
2. Disable GitHub Actions workflows
3. Review and manually control deployments

#### Reset Configuration
1. Remove all autonomous labels from issues
2. Clear branch protection rules temporarily
3. Re-run setup checklist
4. Test with single issue before full activation

## Support

For configuration issues:
- **Technical Problems**: Create issue with `needs-human` label
- **Security Concerns**: Contact security team immediately
- **Access Issues**: Check with GitHub organization administrators

---

**Last Updated**: January 8, 2025  
**Version**: 1.0.0  
**Next Review**: As needed based on GitHub feature updates
