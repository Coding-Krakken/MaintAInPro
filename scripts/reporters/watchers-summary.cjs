#!/usr/bin/env node
/* global console */
const fs = require('fs');
const chalk = require('chalk');

function parseLog(file) {
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf8');
  return content;
}

function summarizeTypeCheck(log) {
  if (!log) return chalk.gray('No type check output.');
  const errorLines = log.split('\n').filter(l => l.includes('error TS'));
  if (errorLines.length === 0) return chalk.green('Type Check: No errors');
  let details = errorLines.map(l => chalk.red(l)).join('\n');
  return chalk.redBright(`Type Check: ${errorLines.length} error(s)\n`) + details;
}

function summarizeLint(log) {
  if (!log) return chalk.gray('No lint output.');
  const errorLines = log.split('\n').filter(l => l.includes('error'));
  const warningLines = log.split('\n').filter(l => l.includes('warning'));
  let details = '';
  if (errorLines.length) details += chalk.redBright(`\nLint Errors:\n`) + errorLines.map(l => chalk.red(l)).join('\n');
  if (warningLines.length) details += chalk.yellowBright(`\nLint Warnings:\n`) + warningLines.map(l => chalk.yellow(l)).join('\n');
  if (!details) return chalk.green('Lint: No errors or warnings');
  return chalk.yellowBright(`Lint: ${errorLines.length} error(s), ${warningLines.length} warning(s)`) + details;
}

function summarizeTest(log) {
  if (!log) return chalk.gray('No test output.');
  const passed = (log.match(/✓/g) || []).length;
  const failed = (log.match(/✗|FAIL|error|failed/g) || []).length;
  let details = '';
  // Show failed test files and lines
  const failLines = log.split('\n').filter(l => /FAIL|✗|error|failed/.test(l));
  if (failLines.length) details += chalk.redBright(`\nFailed Tests/Files:\n`) + failLines.map(l => chalk.red(l)).join('\n');
  return chalk.cyanBright(`Tests: ${passed} passed, ${failed} failed`) + details;
}

function summarizeBuild(log) {
  if (!log) return chalk.gray('No build output.');
  const errors = (log.match(/error/g) || []).length;
  if (errors === 0) return chalk.green('Build: No errors');
  let details = log.split('\n').filter(l => l.includes('error')).map(l => chalk.red(l)).join('\n');
  return chalk.redBright(`Build: ${errors} error(s)\n`) + details;
}

console.log(chalk.bold.bgBlue('\n===== Watchers Summary Report ====='));

const typeLog = parseLog('types.log');
const lintLog = parseLog('lint.log');
const testLog = parseLog('test.log');
const buildLog = parseLog('build.log');

console.log(summarizeTypeCheck(typeLog));
console.log(summarizeLint(lintLog));
console.log(summarizeTest(testLog));
console.log(summarizeBuild(buildLog));
console.log(chalk.bold.bgBlue('===================================\n'));
