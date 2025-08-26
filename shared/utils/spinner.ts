import ora from 'ora';

export type SpinnerStep<T = unknown> = {
  text: string;
  action: () => Promise<T>;
};

/**
 * Runs a sequence of async steps with a single-line spinner, updating status for each step.
 * On error, spinner fails and throws. On success, spinner succeeds with final text.
 */
export async function runWithSpinner<T = unknown>(
  steps: SpinnerStep<T>[],
  finalText: string = 'Done!'
): Promise<T[]> {
  if (!steps.length) return [];
  const spinner = ora(steps[0].text).start();
  const results: T[] = [];
  try {
    for (let i = 0; i < steps.length; i++) {
      spinner.text = steps[i].text;
      const result = await steps[i].action();
      results.push(result);
    }
    spinner.succeed(finalText);
    return results;
  } catch (err: unknown) {
    spinner.fail(`Failed: ${spinner.text}`);
    throw err;
  }
}

// Example usage:
// import { runWithSpinner } from './utils/spinner';
// await runWithSpinner([
//   { text: 'Resolving packages...', action: async () => await resolvePackages() },
//   { text: 'Downloading dependencies...', action: async () => await downloadDeps() },
//   { text: 'Finishing up...', action: async () => await finishInstall() }
// ], 'Install complete!');
