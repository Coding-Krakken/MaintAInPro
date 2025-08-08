#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getDeploymentMetadata() {
  const metadata = {
    timestamp: new Date().toISOString(),
    timestampLocal: new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    actor: process.env.GITHUB_ACTOR || 'unknown',
    source: process.env.GITHUB_EVENT_NAME === 'push' ? 'Direct Push' : 'Copilot/CI',
    sha: process.env.GITHUB_SHA?.substring(0, 7) || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown',
    deploymentId: 'pending',
    productionUrl: 'pending',
    previewUrl: 'n/a',
    healthCheckResult: 'pending',
    rollbackActions: 'none',
    featureFlags: {
      aiEnabled: process.env.FEATURE_AI_ENABLED || 'false',
      realtimeEnabled: process.env.FEATURE_REALTIME_ENABLED || 'false',
      advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS || 'false',
      mobileApp: process.env.FEATURE_MOBILE_APP || 'false'
    }
  };
  
  // Try to get PR number from commit message or GitHub context
  try {
    const { execSync } = require('child_process');
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' });
    const prMatch = commitMessage.match(/#(\d+)/);
    if (prMatch) {
      metadata.prNumber = prMatch[1];
    }
  } catch (error) {
    console.log('Could not extract PR number:', error.message);
  }
  
  // Try to get issue number from PR or commit
  try {
    const { execSync } = require('child_process');
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' });
    const issueMatch = commitMessage.match(/(?:closes?|fixes?|resolves?)\s+#(\d+)/i);
    if (issueMatch) {
      metadata.issueNumber = issueMatch[1];
    }
  } catch (error) {
    console.log('Could not extract issue number:', error.message);
  }
  
  return metadata;
}

async function updateDeploymentLog() {
  const deploymentsDir = 'Documentation/Blueprint/5-Traceability';
  const deploymentsFile = path.join(deploymentsDir, 'Deployments.md');
  
  ensureDirectory(deploymentsDir);
  
  const metadata = getDeploymentMetadata();
  
  // Create or read existing deployments file
  let content = '';
  if (fs.existsSync(deploymentsFile)) {
    content = fs.readFileSync(deploymentsFile, 'utf8');
  } else {
    content = '# Deployment Traceability Log\n\n' +
      'This file tracks all production deployments with complete metadata for auditing and incident response.\n\n' +
      '## Deployment History\n\n' +
      '| Date/Time (UTC) | Date/Time (Local) | Actor | Source | Git SHA | PR # | Issue # | Deployment ID | Production URL | Health Check | Rollback Actions | Feature Flags |\n' +
      '|-----------------|-------------------|-------|--------|---------|------|---------|---------------|----------------|--------------|------------------|---------------|\n';
  }
  
  // Check if this deployment is already recorded (avoid duplicates)
  const deploymentId = `${metadata.sha}-${metadata.timestamp.substring(0, 16)}`;
  if (content.includes(deploymentId)) {
    console.log('Deployment already recorded, skipping duplicate');
    return;
  }
  
  // Format feature flags for display
  const flagsDisplay = Object.entries(metadata.featureFlags)
    .map(([key, value]) => `${key}:${value}`)
    .join(', ');
  
  // Create new row
  const newRow = `| ${metadata.timestamp} | ${metadata.timestampLocal} | ${metadata.actor} | ${metadata.source} | \`${metadata.sha}\` | ${metadata.prNumber || 'n/a'} | ${metadata.issueNumber || 'n/a'} | \`${deploymentId}\` | ${metadata.productionUrl} | ${metadata.healthCheckResult} | ${metadata.rollbackActions} | ${flagsDisplay} |`;
  
  // Add new row to the table
  content += newRow + '\n';
  
  // Write back to file
  fs.writeFileSync(deploymentsFile, content, 'utf8');
  
  console.log('✅ Deployment record added to traceability log');
  console.log(`Deployment ID: ${deploymentId}`);
  console.log(`SHA: ${metadata.sha}`);
  console.log(`Actor: ${metadata.actor}`);
}

updateDeploymentLog().catch(error => {
  console.error('Failed to update deployment log:', error);
  process.exit(1);
});
