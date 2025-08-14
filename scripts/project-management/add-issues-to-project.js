#!/usr/bin/env node

/**
 * Script to add all open issues to the 'MaintAInPro Roadmap' GitHub Project
 * This script uses GitHub's GraphQL API for Projects v2
 */

import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
// ARCHIVED: This script used GraphQL for Projects V2 and is deprecated.
// All project/issue management is now handled by sync_issues_and_project.sh using classic project commands.
// Do not use this script. See sync_issues_and_project.sh for current logic.

// Configuration
const OWNER = 'Coding-Krakken';
const REPO = 'MaintAInPro';
const PROJECT_TITLE = 'MaintAInPro Roadmap';

// Initialize GitHub clients
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
});

/**
 * Get all open issues from the repository
 */
async function getOpenIssues() {
  console.log('🔍 Fetching open issues...');

  try {
    const issues = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await octokit.rest.issues.listForRepo({
        owner: OWNER,
        repo: REPO,
        state: 'open',
        page: page,
        per_page: perPage,
      });

      if (response.data.length === 0) break;

      // Filter out pull requests (GitHub API returns both issues and PRs)
      const actualIssues = response.data.filter(issue => !issue.pull_request);
      issues.push(...actualIssues);

      console.log(`   Found ${actualIssues.length} issues on page ${page}`);

      if (response.data.length < perPage) break;
      page++;
    }

    console.log(`✅ Total open issues found: ${issues.length}`);
    return issues;
  } catch (error) {
    console.error('❌ Error fetching issues:', error.message);
    throw error;
  }
}

/**
 * Find or create the MaintAInPro Roadmap project
 */
async function findOrCreateProject() {
  console.log('🔍 Looking for MaintAInPro Roadmap project...');

  try {
    // First, get the organization/user info
    const { data: orgData } = await octokit.rest.repos.get({
      owner: OWNER,
      repo: REPO,
    });

    const isOrg = orgData.owner.type === 'Organization';

    // Query to find existing projects
    const findProjectQuery = `
      query($owner: String!) {
        ${isOrg ? 'organization' : 'user'}(login: $owner) {
          projectsV2(first: 100) {
            nodes {
              id
              title
              number
            }
          }
        }
      }
    `;

    const findResult = await graphqlWithAuth(findProjectQuery, {
      owner: OWNER,
    });

    const projects = isOrg
      ? findResult.organization.projectsV2.nodes
      : findResult.user.projectsV2.nodes;

    // Look for existing project
    const existingProject = projects.find(p => p.title === PROJECT_TITLE);

    if (existingProject) {
      console.log(`✅ Found existing project: ${PROJECT_TITLE} (${existingProject.number})`);
      return existingProject;
    }

    console.log(`📝 Creating new project: ${PROJECT_TITLE}...`);

    // Create new project
    const createProjectQuery = `
      mutation($ownerId: ID!, $title: String!) {
        createProjectV2(input: {
          ownerId: $ownerId
          title: $title
        }) {
          projectV2 {
            id
            title
            number
          }
        }
      }
    `;

    const ownerResult = await graphqlWithAuth(
      `
      query($owner: String!) {
        ${isOrg ? 'organization' : 'user'}(login: $owner) {
          id
        }
      }
    `,
      {
        owner: OWNER,
      }
    );

    const ownerId = isOrg ? ownerResult.organization.id : ownerResult.user.id;

    const createResult = await graphqlWithAuth(createProjectQuery, {
      ownerId: ownerId,
      title: PROJECT_TITLE,
    });

    const newProject = createResult.createProjectV2.projectV2;
    console.log(`✅ Created new project: ${PROJECT_TITLE} (${newProject.number})`);

    return newProject;
  } catch (error) {
    console.error('❌ Error finding/creating project:', error.message);
    throw error;
  }
}

/**
 * Add issues to the project
 */
async function addIssuesToProject(project, issues) {
  console.log(`📝 Adding ${issues.length} issues to project...`);

  try {
    let addedCount = 0;
    let skippedCount = 0;

    for (const issue of issues) {
      try {
        // Get the issue node ID (required for GraphQL)
        const issueQuery = `
          query($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
              issue(number: $number) {
                id
                title
              }
            }
          }
        `;

        const issueResult = await graphqlWithAuth(issueQuery, {
          owner: OWNER,
          repo: REPO,
          number: issue.number,
        });

        const issueNodeId = issueResult.repository.issue.id;

        // Add issue to project
        const addItemQuery = `
          mutation($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemByContentId(input: {
              projectId: $projectId
              contentId: $contentId
            }) {
              item {
                id
              }
            }
          }
        `;

        await graphqlWithAuth(addItemQuery, {
          projectId: project.id,
          contentId: issueNodeId,
        });

        console.log(`   ✅ Added issue #${issue.number}: ${issue.title}`);
        addedCount++;

        // Rate limiting - be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  Issue #${issue.number} already in project`);
          skippedCount++;
        } else {
          console.error(`   ❌ Failed to add issue #${issue.number}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Added: ${addedCount} issues`);
    console.log(`   - Skipped: ${skippedCount} issues`);
    console.log(`   - Total: ${issues.length} issues processed`);
  } catch (error) {
    console.error('❌ Error adding issues to project:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting GitHub Project Issue Management...\n');

    // Validate environment
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    // Step 1: Get all open issues
    const issues = await getOpenIssues();

    if (issues.length === 0) {
      console.log('ℹ️  No open issues found. Nothing to do.');
      return;
    }

    // Step 2: Find or create the project
    const project = await findOrCreateProject();

    // Step 3: Add issues to project
    await addIssuesToProject(project, issues);

    console.log('\n🎉 Successfully completed GitHub Project management!');
    console.log(`   Project: https://github.com/${OWNER}/${REPO}/projects/${project.number}`);
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
