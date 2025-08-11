#!/usr/bin/env node

/**
 * Repository Configuration Checker
 * Validates if the GitHub repository has the required settings for autonomous workflows
 */

import { execSync } from 'child_process';

console.log('🔍 Checking GitHub Repository Configuration...\n');

// Check if gh CLI is available
try {
  execSync('gh --version', { stdio: 'pipe' });
  console.log('✅ GitHub CLI is available');
} catch (_error) {
  console.log('❌ GitHub CLI not found - install with: sudo apt install gh');
  process.exit(1);
}

// Check authentication
try {
  const _auth = execSync('gh auth status', { stdio: 'pipe', encoding: 'utf8' });
  console.log('✅ GitHub CLI authenticated');
} catch (_error) {
  console.log('❌ GitHub CLI not authenticated - run: gh auth login');
  process.exit(1);
}

console.log('\n📋 Repository Configuration Status:\n');

// Check branch protection
try {
  const _protection = execSync('gh api repos/:owner/:repo/branches/main/protection', {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  console.log('✅ Branch protection configured');
} catch (_error) {
  console.log('❌ Branch protection not configured');
}

// Check required labels
const requiredLabels = ['autoplan', 'agent-ok', 'automerge', 'blocked', 'needs-human'];
try {
  const labels = JSON.parse(
    execSync('gh api repos/:owner/:repo/labels', {
      stdio: 'pipe',
      encoding: 'utf8',
    })
  );

  const labelNames = labels.map(l => l.name);

  requiredLabels.forEach(label => {
    if (labelNames.includes(label)) {
      console.log(`✅ Label "${label}" exists`);
    } else {
      console.log(`❌ Label "${label}" missing`);
    }
  });
} catch (_error) {
  console.log('❌ Could not check labels');
}

// Check secrets (we can't see values, but can check if they exist)
try {
  const secrets = JSON.parse(
    execSync('gh api repos/:owner/:repo/actions/secrets', {
      stdio: 'pipe',
      encoding: 'utf8',
    })
  );

  const requiredSecrets = ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'];
  const secretNames = secrets.secrets.map(s => s.name);

  requiredSecrets.forEach(secret => {
    if (secretNames.includes(secret)) {
      console.log(`✅ Secret "${secret}" configured`);
    } else {
      console.log(`❌ Secret "${secret}" missing`);
    }
  });
} catch (_error) {
  console.log('❌ Could not check secrets');
}

// Check if GitHub Actions is enabled
try {
  execSync('gh api repos/:owner/:repo/actions/permissions', { stdio: 'pipe' });
  console.log('✅ GitHub Actions enabled');
} catch (_error) {
  console.log('❌ GitHub Actions not enabled or accessible');
}

console.log('\n🚀 Next Steps:');
console.log('1. Configure missing items using the REPOSITORY_SETUP.md guide');
console.log('2. Add required Vercel secrets to repository settings');
console.log('3. Set up branch protection rules');
console.log('4. Create missing labels');
console.log('5. Test workflows with a manual trigger');

console.log('\n💡 Quick Setup Commands:');
console.log('# Create labels:');
requiredLabels.forEach(label => {
  const colors = {
    autoplan: '0366d6',
    'agent-ok': '28a745',
    automerge: '6f42c1',
    blocked: 'd73a49',
    'needs-human': 'fbca04',
  };
  const descriptions = {
    autoplan: 'Issue created automatically by the Blueprint planner',
    'agent-ok': 'Issue approved for GitHub Copilot coding agent',
    automerge: 'PR approved for automatic merging after CI passes',
    blocked: 'Work is blocked pending resolution',
    'needs-human': 'Requires human review or intervention',
  };
  console.log(
    `gh label create "${label}" --color "${colors[label]}" --description "${descriptions[label]}"`
  );
});
