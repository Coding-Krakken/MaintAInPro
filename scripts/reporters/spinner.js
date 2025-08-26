import ora from 'ora';

const spinner = ora('Running watchers...').start();

// Wait until killed by parent script
process.on('SIGTERM', () => {
  spinner.succeed('Watchers complete!');
  process.exit(0);
});

// If killed by SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  spinner.stop();
  process.exit(0);
});

// Prevent script from exiting
setInterval(() => {}, 1000);
