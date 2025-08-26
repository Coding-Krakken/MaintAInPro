# Red→Green System Bootstrap Plan

## Detected Stack & Tools

**Primary Stack:**

- **Frontend**: React 18 + TypeScript (client/)
- **Backend**: Express.js + TypeScript (server/)
- **Database**: PostgreSQL + Drizzle ORM
- **Shared**: Common schemas/types (shared/)

**Build & Development:**

- **Package Manager**: npm (package-lock.json detected)
- **Build Tool**: Vite (vite.config.ts)
- **TypeScript**: tsconfig.json with strict mode
- **Bundler**: Vite for client, tsx for server

**Quality Tools:**

- **Linter**: ESLint (eslint.config.js)
- **Formatter**: Prettier (.prettierrc)
- **Type Checker**: TypeScript compiler
- **Test Runner**: Vitest (vitest.config.ts) for unit/integration
- **E2E Testing**: Playwright (tests/config/playwright.config.ts)
- **Performance**: k6 (referenced in package.json)
- **Accessibility**: vitest-axe

**CI/CD:**

- **Platform**: GitHub Actions
- **Workflows**: ci-cd.yml, create-issues.yml, validate.yml
- **Deployment**: Vercel (vercel.json)

## Exact Files to Add/Modify

### Hard Guardrails

- **Add**: `.gitattributes` (missing)
- **Enhance**: `eslint.config.js` (add --max-warnings=0 enforcement)
- **Add**: `docs/decisions/` structure (referenced but missing proper ADR
  structure)
- **Update**: `CHANGELOG.md` (ensure "Unreleased" section)

### Continuous Watchers

- **Modify**: `package.json` (add concurrent watcher scripts)
- **Add**: `.vscode/tasks.json` (VS Code integration)
- **Add**: `Makefile` (cross-platform task runner)

### CI Gates

- **Enhance**: `.github/workflows/ci-cd.yml` (strengthen gates)
- **Update**: `.github/pull_request_template.md` (improve checklist)

### Prompt Library

- **Add**: `.copilot/prompts/01-fix-tests.md`
- **Add**: `.copilot/prompts/02-refactor-lint.md`
- **Add**: `.copilot/prompts/03-add-feature.md`
- **Add**: `.copilot/prompts/04-autofix-strategy.md`
- **Add**: `.copilot/prompts/05-adr.md`
- **Add**: `.copilot/prompts/06-e2e-hardening.md`
- **Add**: `.copilot/prompts/README.md`
- **Add**: `.vscode/snippets/copilot-prompts.code-snippets`

### Documentation & Runbooks

- **Add**: `docs/runbooks/dev-watchers.md`
- **Add**: `docs/runbooks/ci.md`
- **Add**: `artifacts/adr/adr-bootstrap-red-green-system.md`
- **Update**: `README.md` (Developer Quickstart section)

### Minimal Seeds

- **Fix**: Existing failing tests in
  `tests/unit/components/admin/HealthDashboard.unit.test.tsx`
- **Fix**: Lint issues (75 problems) - focus on errors first, unused variables
- **Fix**: Formatting issues (6 files)

## Watchers to Run for Each Stack

### JavaScript/TypeScript Watchers

```bash
# Concurrent watchers in package.json
"dev:watch": "concurrently -k -n TYPES,LINT,UNIT,BUILD \"npm:types:watch\" \"npm:lint:watch\" \"npm:test:watch\" \"npm:build:watch\""
"types:watch": "tsc --noEmit --incremental --watch"
"lint:watch": "eslint . --ext .ts,.tsx --max-warnings=0 --watch"
"test:watch": "vitest --watch --reporter=verbose"
"build:watch": "vite build --watch"
```

### VS Code Tasks

- `tsc:watch` - TypeScript compiler in watch mode
- `eslint:watch` - ESLint with problem matcher
- `vitest:watch` - Vitest with test explorer integration
- `build:watch` - Vite build watcher

## CI Job Matrix Specification

### Enhanced GitHub Actions Matrix

```yaml
strategy:
  matrix:
    include:
      - name: 'Lint & Format'
        job: 'lint'
        node-version: '18'
      - name: 'Type Check'
        job: 'typecheck'
        node-version: '18'
      - name: 'Unit Tests'
        job: 'test-unit'
        node-version: '18'
      - name: 'Integration Tests'
        job: 'test-integration'
        node-version: '18'
      - name: 'E2E Tests'
        job: 'test-e2e'
        node-version: '18'
      - name: 'Build'
        job: 'build'
        node-version: '18'
```

### Fail-Fast Gates

- ESLint: `--max-warnings=0`
- Prettier: `--check` mode
- TypeScript: `--noEmit` strict mode
- Tests: Coverage thresholds enforced
- Build: Must complete without errors

## Risk/Rollback Notes

### Rollback Strategy

1. **Configuration Files**: All new configs are additive - can be removed
   individually
2. **Package.json Scripts**: New scripts use distinct names - won't override
   existing
3. **CI Changes**: Enhanced existing workflow, can revert specific commits
4. **VS Code Settings**: Optional workspace configs, don't affect global IDE

### Risk Mitigation

- **Incremental Changes**: Each component can be added/tested independently
- **Preserve Existing**: Never weaken current standards, only strengthen
- **Backup Points**: Use git tags before major changes
- **Validation**: Each step validated before proceeding to next

### Safe Revert Commands

```bash
# Revert all bootstrap changes
git revert <bootstrap-commit-range>

# Remove specific components
git checkout HEAD~1 -- .copilot/
git checkout HEAD~1 -- .vscode/tasks.json
git checkout HEAD~1 -- package.json  # only if needed

# Restore original CI
git checkout HEAD~1 -- .github/workflows/ci-cd.yml
```

## Implementation Order

1. **Immediate Fixes** - Clean up existing lint/format issues
2. **Hard Guardrails** - Strengthen configs and add missing files
3. **Watchers** - Add concurrent development watchers
4. **CI Gates** - Enhance GitHub Actions pipeline
5. **Prompt Library** - Create reusable Copilot prompts
6. **Documentation** - Add runbooks and update README
7. **Validation** - Test entire system end-to-end

## Success Metrics

- **Zero Warnings**: ESLint --max-warnings=0 passes
- **Clean Formatting**: Prettier check passes
- **Type Safety**: tsc --noEmit passes
- **Test Coverage**: Vitest coverage thresholds met
- **CI Green**: All GitHub Actions jobs pass
- **Fast Feedback**: Watchers provide <2s feedback on changes
- **Developer Experience**: 5-command quickstart in README
