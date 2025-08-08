#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

function updateChangelog() {
  const changelogFile = 'CHANGELOG.md';
  
  try {
    // Get the commit message and author
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const commitAuthor = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    const commitSha = execSync('git log -1 --pretty=%h', { encoding: 'utf8' }).trim();
    const commitDate = new Date().toISOString().split('T')[0];
    
    // Skip if this looks like a merge commit or docs-only change
    if (commitMessage.startsWith('Merge') || 
        commitMessage.includes('docs:') || 
        commitMessage.includes('chore:') ||
        commitMessage.includes('ci:')) {
      console.log('Skipping changelog update for maintenance commit');
      return;
    }
    
    // Read existing changelog
    let content = '';
    if (fs.existsSync(changelogFile)) {
      content = fs.readFileSync(changelogFile, 'utf8');
    } else {
      content = '# Changelog\n\n' +
        'All notable changes to MaintAInPro CMMS will be documented in this file.\n\n' +
        'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n' +
        'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n' +
        '## [Unreleased]\n\n';
    }
    
    // Check if entry already exists
    if (content.includes(commitSha)) {
      console.log('Changelog entry already exists, skipping');
      return;
    }
    
    // Parse commit message for type
    let changeType = 'Changed';
    let cleanMessage = commitMessage;
    
    if (commitMessage.match(/^feat(\(.+\))?:/)) {
      changeType = 'Added';
      cleanMessage = commitMessage.replace(/^feat(\(.+\))?: /, '');
    } else if (commitMessage.match(/^fix(\(.+\))?:/)) {
      changeType = 'Fixed';
      cleanMessage = commitMessage.replace(/^fix(\(.+\))?: /, '');
    } else if (commitMessage.match(/^perf(\(.+\))?:/)) {
      changeType = 'Changed';
      cleanMessage = `Performance: ${commitMessage.replace(/^perf(\(.+\))?: /, '')}`;
    } else if (commitMessage.match(/^security(\(.+\))?:/)) {
      changeType = 'Security';
      cleanMessage = commitMessage.replace(/^security(\(.+\))?: /, '');
    } else if (commitMessage.match(/^refactor(\(.+\))?:/)) {
      changeType = 'Changed';
      cleanMessage = `Refactor: ${commitMessage.replace(/^refactor(\(.+\))?: /, '')}`;
    }
    
    // Find the Unreleased section
    const unreleasedMatch = content.match(/(## \[Unreleased\])([\s\S]*?)(## \[|$)/);
    if (!unreleasedMatch) {
      console.log('Could not find Unreleased section in changelog');
      return;
    }
    
    let unreleasedContent = unreleasedMatch[2];
    
    // Add new entry under appropriate category
    const categoryRegex = new RegExp(`### ${changeType}([\\s\\S]*?)(?=### |$)`);
    const categoryMatch = unreleasedContent.match(categoryRegex);
    
    const newEntry = `- ${cleanMessage} ([${commitSha}](https://github.com/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}))`;
    
    if (categoryMatch) {
      // Category exists, add to it
      const updatedCategory = categoryMatch[0] + '\n' + newEntry;
      unreleasedContent = unreleasedContent.replace(categoryMatch[0], updatedCategory);
    } else {
      // Category doesn't exist, create it
      const newCategory = `\n### ${changeType}\n${newEntry}\n`;
      unreleasedContent = unreleasedContent.trim() + newCategory;
    }
    
    // Reconstruct the content
    const newContent = content.replace(
      unreleasedMatch[0],
      `## [Unreleased]${unreleasedContent}\n\n${unreleasedMatch[3] || ''}`
    );
    
    fs.writeFileSync(changelogFile, newContent, 'utf8');
    console.log(`✅ Changelog updated with: ${cleanMessage}`);
    
  } catch (error) {
    console.error('Failed to update changelog:', error);
    // Don't fail the workflow for changelog issues
  }
}

updateChangelog();
