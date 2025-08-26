# Development Watchers Runbook

Guide for running continuous watchers that provide instant feedback during development.

## Quick Start

```bash
# Start all watchers concurrently
npm run dev:watch

# Individual watchers
npm run types:watch    # TypeScript compilation
npm run lint:watch     # ESLint with zero warnings
npm run test:watch     # Vitest unit tests
npm run build:watch    # Vite build process
```

## Watcher Overview

| Watcher | Purpose | Feedback Time | Restart Trigger |
|---------|---------|---------------|-----------------|
| `types:watch` | TypeScript compilation | ~1-2s | .ts/.tsx file changes |
| `lint:watch` | ESLint with `--max-warnings=0` | ~2-3s | .ts/.tsx/.js/.jsx changes |
| `test:watch` | Vitest unit/integration tests | ~1-5s | Test files and source changes |
| `build:watch` | Vite production build | ~3-10s | Source file changes |

## Watcher Details

### TypeScript Watcher (`types:watch`)
```bash
npm run types:watch
```

**What it does:**
- Runs `tsc --noEmit --incremental --watch`
- Checks TypeScript compilation without emitting files
- Uses incremental compilation for speed
- Enforces strict TypeScript configuration

**Output:**
- ✅ `No errors found` - All types are valid
- ❌ `Error TS2345` - Type errors with file:line references

**Troubleshooting:**
- Slow compilation? Delete `.tsbuildinfo` and restart
- Memory issues? Restart watcher every few hours
- False errors? Restart TypeScript service in VS Code

### ESLint Watcher (`lint:watch`)
```bash
npm run lint:watch
```

**What it does:**
- Runs ESLint with `--max-warnings=0` flag
- Enforces zero tolerance for warnings
- Watches all .ts/.tsx/.js/.jsx files
- Uses eslint.config.js configuration

**Output:**
- ✅ No output = No issues found
- ❌ Error/warning count with file locations

**Common Issues:**
- `Unexpected any`: Replace with proper types
- `unused-vars`: Remove or prefix with underscore
- `react-hooks/exhaustive-deps`: Add missing dependencies

### Test Watcher (`test:watch`)
```bash
npm run test:watch
```

**What it does:**
- Runs Vitest in watch mode with verbose reporter
- Watches source and test files
- Re-runs affected tests on changes
- Shows coverage information

**Interactive Commands:**
- `a` - Run all tests
- `f` - Run only failed tests
- `t` - Filter by test name pattern
- `q` - Quit watch mode

**Troubleshooting:**
- Stuck tests? Press `r` to restart
- Memory leaks? Restart watcher
- Slow tests? Run `npm run test:coverage` to identify bottlenecks

### Build Watcher (`build:watch`)
```bash
npm run build:watch
```

**What it does:**
- Runs Vite build in watch mode
- Builds for production with optimizations
- Watches all source files
- Outputs to `dist/public`

**Output Artifacts:**
- `dist/public/index.html` - Main HTML file
- `dist/public/assets/*.js` - JavaScript bundles
- `dist/public/assets/*.css` - Stylesheets

## VS Code Integration

### Running Watchers in VS Code

1. **Open Command Palette** (`Ctrl+Shift+P`)
2. Type "Tasks: Run Task"
3. Select watcher task:
   - "Dev Watchers (All)" - All watchers concurrently
   - "TypeScript Watch" - Types only
   - "ESLint Watch" - Linting only  
   - "Test Watch" - Tests only
   - "Build Watch" - Build only

### Problem Matchers

VS Code automatically captures watcher output and shows:
- **TypeScript errors**: In Problems panel with clickable links
- **ESLint warnings/errors**: Underlined in editor with quick fixes
- **Test failures**: In terminal with stack traces

### Integrated Terminal

Best practice: Use split terminals
- Terminal 1: `npm run dev:watch` (all watchers)
- Terminal 2: Manual commands (`npm run build`, etc.)
- Terminal 3: Git operations

## Troubleshooting

### Performance Issues

**High CPU Usage:**
```bash
# Reduce watcher intensity
npm run types:watch    # Run individually instead of all together
```

**Memory Leaks:**
```bash
# Restart watchers every few hours
pkill -f "tsc --watch"
npm run dev:watch
```

### Watcher Conflicts

**Port Conflicts:**
- Vite dev server: Check for port 5173 usage
- Test UI: Check for port 51204 usage

**File Lock Issues:**
```bash
# On Windows, restart VS Code if files appear locked
# On Linux/Mac, check file permissions
ls -la node_modules/.vite/
```

### Common Error Patterns

**ESLint Not Finding Config:**
```bash
# Ensure eslint.config.js exists and is valid
npx eslint --print-config client/src/App.tsx
```

**TypeScript Can't Find Files:**
```bash
# Check tsconfig.json paths and includes
npx tsc --listFiles | grep "your-file.ts"
```

**Vitest Import Errors:**
```bash
# Check vitest.config.ts path resolution
npm run test -- --reporter=verbose --run
```

## Best Practices

### Development Workflow

1. **Start watchers first:**
   ```bash
   npm run dev:watch
   ```

2. **Make changes in small increments:**
   - Change one file at a time
   - Wait for watchers to complete
   - Fix issues before moving on

3. **Red → Green → Refactor:**
   - Red: See failing test/lint/type check
   - Green: Make minimal change to pass
   - Refactor: Clean up while watchers are green

### Watcher Hygiene

**Daily Routine:**
- Morning: Start `npm run dev:watch`
- Check all watchers are green before first commit
- Evening: Stop watchers to free system resources

**Weekly Maintenance:**
```bash
# Clean up build artifacts
npm run clean
npm install    # Refresh dependencies
npm run dev:watch
```

### Integration with Git

**Pre-commit Workflow:**
1. Ensure all watchers are green ✅
2. Run full quality gate: `npm run quality`
3. Stage changes: `git add .`
4. Commit with descriptive message

**Pre-push Workflow:**
```bash
# Full validation (watchers may miss some edge cases)
npm run test:all
npm run build
```

## Configuration

### Customizing Watchers

**TypeScript Watcher Options:**
```json
// tsconfig.json
{
  "watchOptions": {
    "watchFile": "useFsEvents",
    "watchDirectory": "useFsEvents",
    "excludeDirectories": ["**/node_modules", "_build", "temp/*"]
  }
}
```

**ESLint Watcher Options:**
```js
// eslint.config.js
export default [
  {
    // Add custom ignore patterns for faster watching
    ignores: ["dist/**", "coverage/**", "**/node_modules/**"]
  }
];
```

**Vitest Watcher Options:**
```ts
// vitest.config.ts
export default defineConfig({
  test: {
    // Optimize for faster feedback
    pool: 'forks',
    isolate: false, // Faster but less isolated
  }
});
```

---

**Next Steps:**
- See [CI Runbook](./ci.md) for production quality gates
- Check [Testing Strategy](../../attached_assets/TestingStrategy_1752515902056.md) for comprehensive testing approach