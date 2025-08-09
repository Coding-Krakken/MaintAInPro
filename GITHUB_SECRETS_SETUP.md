# 🔑 Manual GitHub Secrets Setup

Based on your Vercel configuration, here are the exact values to set as GitHub
repository secrets:

## Repository Secrets

Go to: https://github.com/Coding-Krakken/MaintAInPro/settings/secrets/actions

### Add these 3 secrets:

1. **VERCEL_PROJECT_ID**

   ```
   prj_QKNlZLePMBtX7PrxjDSGMtMfxQqc
   ```

2. **VERCEL_ORG_ID**

   ```
   team_N5PeW8xQIHhvV4b48HCN9kwp
   ```

3. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create new token with "Full Access" scope
   - Copy the token value

## Alternative: GitHub CLI Commands

If you have admin access, you can run these commands:

```bash
gh secret set VERCEL_PROJECT_ID --body "prj_QKNlZLePMBtX7PrxjDSGMtMfxQqc"
gh secret set VERCEL_ORG_ID --body "team_N5PeW8xQIHhvV4b48HCN9kwp"
gh secret set VERCEL_TOKEN --body "your_vercel_token_here"
```

## Verification

After setting the secrets, test the autonomous deployment:

```bash
# Trigger deployment workflow
git commit --allow-empty -m "test: trigger autonomous deployment"
git push

# Check workflow status
gh run list --limit 3
```

## Next Steps

Once secrets are configured:

1. ✅ Blueprint Planner is working (creates issues every 6 hours)
2. ✅ GitHub issues are being created with `agent-ok` labels
3. 🔄 Deploy workflow will work once secrets are added
4. 🚀 Full autonomous loop will be operational

The autonomous development loop is 99% complete - just add those 3 secrets! 🎯
