#!/usr/bin/env node
// MaintAInPro System Alert Issue Script
// Usage: node scripts/workflow-helpers/system-alert-issue.js

const { Octokit } = require("@octokit/rest");

const githubToken = process.env.GITHUB_TOKEN;
const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

if (!githubToken || !repoOwner || !repoName) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const octokit = new Octokit({ auth: githubToken });

async function main() {
  const issues = await octokit.issues.listForRepo({
    owner: repoOwner,
    repo: repoName,
    labels: ["🚨 system-alert", "🤖 automated"],
    state: "open"
  });

  if (issues.data.length > 0) {
    const existingIssue = issues.data[0];
    const updateBody = [
      "## 🚨 System Health Alert - Updated",
      "",
      "**Status:** 🟡 System Degraded",
      `**Last Check:** ${new Date().toISOString()}`,
      "**Alert Level:** Warning",
      "",
      "**Current Issues:**",
      "- Some services are experiencing issues",
      `- Check the monitoring workflow for details`,
      "",
      "**Services Status:**",
      "- 🌐 Production: Checking...",
      "- 🧪 Staging: Checking...",
      "- 🔌 API: Checking...",
      "- 🚀 CI/CD: Operational",
      "",
      "**Actions Taken:**",
      "1. Automated monitoring detected issues",
      "2. System alert triggered",
      "3. Investigation in progress",
      "",
      "**Next Steps:**",
      "1. 🔍 Check detailed logs and metrics",
      "2. 🔧 Identify root cause",
      "3. 🚀 Implement fix",
      "4. ✅ Verify resolution",
      "",
      "**Auto-updated by system monitoring** 🤖"
    ].join("\n");

    await octokit.issues.update({
      owner: repoOwner,
      repo: repoName,
      issue_number: existingIssue.number,
      body: updateBody
    });
  } else {
    const title = `🚨 System Health Alert - ${new Date().toISOString().split("T")[0]}`;
    const body = [
      "## 🚨 System Health Alert",
      "",
      "**Status:** 🟡 System Degraded",
      `**Detected:** ${new Date().toISOString()}`,
      "**Alert Level:** Warning",
      "",
      "**Issue Description:**",
      "Automated monitoring has detected degraded performance or availability issues with one or more system components.",
      "",
      "**Affected Services:**",
      "- Check the monitoring workflow for specific service status",
      "",
      "**Immediate Actions Required:**",
      "1. 🔍 Check application logs and error rates",
      "2. 🩺 Verify database connectivity and performance",
      "3. 🌐 Test all critical user flows",
      "",
      "**Auto-updated by system monitoring** 🤖"
    ].join("\n");

    await octokit.issues.create({
      owner: repoOwner,
      repo: repoName,
      title,
      body,
      labels: ["🚨 system-alert", "🤖 automated"]
    });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
