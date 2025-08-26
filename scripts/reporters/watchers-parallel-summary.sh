#!/bin/bash
set -e

# Remove old logs
rm -f types.log lint.log test.log build.log


# Run all watchers sequentially, redirect output to logs
node --experimental-modules scripts/reporters/spinner.js &
SPINNER_PID=$!
npm run types > types.log 2>&1
npm run lint:check > lint.log 2>&1
npm run test:run > test.log 2>&1
npm run build > build.log 2>&1

# Kill spinner
kill $SPINNER_PID

# Print summary
node scripts/reporters/watchers-summary.cjs
