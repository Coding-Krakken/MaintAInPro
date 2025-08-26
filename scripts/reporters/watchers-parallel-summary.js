import ora from 'ora';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const steps = [
  { name: 'Type Check against all files', cmd: 'npm run types', log: 'types.log' },
  { name: 'Lint against all files', cmd: 'npm run lint:check', log: 'lint.log' },
  { name: 'Test suite', cmd: 'npm run test:run', log: 'test.log' },
  { name: 'Build project', cmd: 'npm run build', log: 'build.log' },
];

function runStep(step) {
  return new Promise((resolve) => {
    const spinner = ora({
      text: `Running ${step.name}...`,
      spinner: 'dots',
    }).start();
    exec(step.cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      fs.writeFileSync(step.log, stdout + stderr);
      if (err) {
        spinner.fail(`✖ ${step.name}`);
        resolve({ name: step.name, status: 'failed' });
      } else {
        spinner.succeed(`✔ ${step.name}`);
        resolve({ name: step.name, status: 'succeeded' });
      }
    });
  });
}

async function main() {
  // Remove old logs
  for (const step of steps) {
  try { fs.unlinkSync(step.log); } catch (_unused) { /* ignore missing log */ }
  }

  const results = [];
  for (const step of steps) {
    const result = await runStep(step);
    results.push(result);
  }
  const failed = results.filter(r => r.status === 'failed');
  if (failed.length === 0) {
    ora().succeed('All watchers complete!');
  } else {
    ora().fail(`${failed.length} watcher(s) failed: ${failed.map(r => r.name).join(', ')}. See logs for details.`);
  }

  // Print summary
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const summaryScript = path.resolve(__dirname, 'watchers-summary.cjs');
  await import(summaryScript);
}

main();
