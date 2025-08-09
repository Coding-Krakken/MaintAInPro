#!/usr/bin/env node

/**
 * Vercel Integration Helper
 * Extracts Vercel configuration and helps set up GitHub secrets
 */

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔧 Setting up Vercel integration for autonomous deployment...\n');

// Read Vercel project configuration
const projectConfig = JSON.parse(fs.readFileSync('setup/.vercel/project.json', 'utf8'));

console.log('📋 Vercel Project Configuration:');
console.log(`   Project ID: ${projectConfig.projectId}`);
console.log(`   Organization ID: ${projectConfig.orgId}`);
console.log(`   Project Name: ${projectConfig.projectName}\n`);

// Check if user is logged into Vercel
try {
  const whoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Logged into Vercel as: ${whoami}`);
} catch (error) {
  console.log('❌ Not logged into Vercel. Run: vercel login');
  process.exit(1);
}

// Check if GitHub CLI can access the repository
try {
  execSync('gh auth status', { stdio: 'pipe' });
  console.log('✅ GitHub CLI authenticated');
} catch (error) {
  console.log('❌ GitHub CLI not authenticated. Run: gh auth login');
  process.exit(1);
}

console.log('\n🔑 Setting up GitHub repository secrets...\n');

// Set the Vercel secrets in GitHub
try {
  console.log('Setting VERCEL_PROJECT_ID...');
  execSync(`gh secret set VERCEL_PROJECT_ID --body "${projectConfig.projectId}"`, {
    stdio: 'pipe',
  });
  console.log('✅ VERCEL_PROJECT_ID set');

  console.log('Setting VERCEL_ORG_ID...');
  execSync(`gh secret set VERCEL_ORG_ID --body "${projectConfig.orgId}"`, { stdio: 'pipe' });
  console.log('✅ VERCEL_ORG_ID set');
} catch (error) {
  console.log('❌ Failed to set GitHub secrets:', error.message);
  process.exit(1);
}

// Handle Vercel token
console.log('\n🎯 Vercel Token Setup:');
console.log('We need to set your VERCEL_TOKEN. You have two options:\n');

console.log('Option 1 - Use existing token from Vercel CLI config:');
try {
  const configPath = execSync('vercel --global-config', { encoding: 'utf8' }).trim();
  console.log(`   Check: ${configPath}/auth.json for existing token`);
} catch (error) {
  console.log('   Could not locate Vercel config');
}

console.log('\nOption 2 - Create a new token:');
console.log('   1. Go to: https://vercel.com/account/tokens');
console.log('   2. Create new token with "Full Access" scope');
console.log('   3. Run: gh secret set VERCEL_TOKEN --body "your_token_here"');

console.log(
  '\n🚀 After setting VERCEL_TOKEN, the autonomous deployment loop will be fully operational!'
);

console.log('\n📊 Current GitHub Secrets Status:');
try {
  const secrets = JSON.parse(
    execSync('gh api repos/:owner/:repo/actions/secrets', { encoding: 'utf8' })
  );
  const secretNames = secrets.secrets.map(s => s.name);

  ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'].forEach(secret => {
    const status = secretNames.includes(secret) ? '✅' : '❌';
    console.log(`   ${status} ${secret}`);
  });
} catch (error) {
  console.log('   Could not check secrets status');
}

console.log('\n💡 Quick Test Commands:');
console.log('   # Test local deployment:');
console.log('   npm run build && vercel');
console.log('   ');
console.log('   # Trigger autonomous deployment:');
console.log('   git commit --allow-empty -m "test: trigger autonomous deployment" && git push');
