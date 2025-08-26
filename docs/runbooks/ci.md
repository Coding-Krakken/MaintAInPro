# CI/CD Pipeline Runbook

Comprehensive guide for understanding, debugging, and maintaining the
MaintAInPro CI/CD pipeline.

## Pipeline Overview

The CI/CD pipeline runs on GitHub Actions with multiple jobs for quality gates,
testing, and deployment.

### Trigger Events

- **Push to main**: Full pipeline with deployment
- **Pull Request**: All quality gates, no deployment
- **Manual dispatch**: Full pipeline with optional deployment

### Job Matrix

| Job                  | Purpose                  | Duration  | Failure Rate |
| -------------------- | ------------------------ | --------- | ------------ |
| **lint-and-format**  | Code quality checks      | ~2-3 min  | <5%          |
| **type-check**       | TypeScript compilation   | ~1-2 min  | <2%          |
| **test-unit**        | Unit tests with coverage | ~3-5 min  | <10%         |
| **test-integration** | Integration tests        | ~5-8 min  | <15%         |
| **test-e2e**         | End-to-end tests         | ~8-12 min | <20%         |
| **build**            | Production build         | ~3-5 min  | <5%          |
| **security**         | Dependency audit & scan  | ~2-3 min  | <8%          |
| **deploy**           | Vercel deployment        | ~2-4 min  | <3%          |

## Quality Gates

### Gate 1: Code Quality (`lint-and-format`)

**Commands:**

```bash
npm run lint:check --max-warnings=0
npm run format:check
```

**Success Criteria:**

- Zero ESLint errors or warnings
- All files properly formatted with Prettier
- No unused imports or variables

**Common Failures:**

```bash
# Lint warnings
✖ 71 problems (0 errors, 71 warnings)

# Format issues
[warn] Code style issues found in 6 files
```

**Debug Locally:**

```bash
# Check what CI sees
npm run lint:check --max-warnings=0
npm run format:check

# Fix issues
npm run lint      # Auto-fix lint issues
npm run format    # Auto-format files
```

### Gate 2: Type Safety (`type-check`)

**Commands:**

```bash
npm run type-check
```

**Success Criteria:**

- TypeScript compilation succeeds
- No type errors in strict mode
- All imports resolve correctly

**Common Failures:**

```bash
# Type errors
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
error TS2307: Cannot find module './missing-file'
```

**Debug Locally:**

```bash
# Check compilation
npm run type-check

# Debug specific file
npx tsc --noEmit client/src/problem-file.tsx

# Check imports
npx tsc --listFiles | grep "missing-file"
```

### Gate 3: Unit Tests (`test-unit`)

**Commands:**

```bash
npm run test:unit
npm run test:coverage
```

**Success Criteria:**

- All unit tests pass
- Coverage thresholds met (85% lines, 80% functions)
- No flaky or skipped tests

**Common Failures:**

```bash
# Test failures
FAIL tests/unit/components/HealthDashboard.unit.test.tsx
  ✕ displays websocket connections by warehouse

# Coverage below threshold
ERROR: Coverage for lines (82.45%) does not meet global threshold (85%)
```

**Debug Locally:**

```bash
# Run specific test
npm run test -- tests/unit/components/HealthDashboard.unit.test.tsx

# Debug mode
npm run test:ui

# Check coverage
npm run test:coverage
open coverage/index.html
```

### Gate 4: Integration Tests (`test-integration`)

**Commands:**

```bash
npm run test:integration
```

**Success Criteria:**

- All integration tests pass
- Database connections work
- API endpoints respond correctly

**Common Failures:**

```bash
# Database connection
Error: connect ECONNREFUSED 127.0.0.1:5432

# API timeout
Error: Timeout of 5000ms exceeded
```

**Debug Locally:**

```bash
# Ensure database is running
npm run db:push

# Run integration tests
npm run test:integration

# Check specific service
npm run test -- tests/integration/auth.integration.test.ts
```

### Gate 5: E2E Tests (`test-e2e`)

**Commands:**

```bash
npm run test:e2e
```

**Success Criteria:**

- Critical user flows work end-to-end
- Authentication flows complete
- UI interactions respond correctly

**Common Failures:**

```bash
# Element not found
Error: Waiting for element to be visible: [data-testid="login-button"]

# Network timeout
Error: Page timeout 30000ms exceeded
```

**Debug Locally:**

```bash
# Start test server
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug -- --grep "login flow"

# Check screenshots
open test-results/
```

### Gate 6: Build (`build`)

**Commands:**

```bash
npm run build
```

**Success Criteria:**

- Production build completes successfully
- All assets are generated
- Bundle sizes within limits

**Common Failures:**

```bash
# Build errors
Error: Could not resolve import "./missing-module"

# Bundle too large
Warning: entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit
```

**Debug Locally:**

```bash
# Check build
npm run build

# Analyze bundle
npm run build -- --analyze

# Check bundle sizes
ls -la dist/public/assets/
```

## CI Artifacts

### Build Artifacts

- **Location**: GitHub Actions Artifacts section
- **Retention**: 30 days
- **Contents**:
  - `dist/` - Production build
  - `coverage/` - Test coverage reports
  - `test-results/` - Test outputs and screenshots

### Download Artifacts

```bash
# Using GitHub CLI
gh run download <run-id> --name build-artifacts

# Or from GitHub UI
# Go to Actions → Select run → Download artifacts
```

### Coverage Reports

- **Unit Coverage**: `coverage/index.html`
- **E2E Results**: `test-results/reports/playwright-report/index.html`
- **Performance**: `test-results/performance/`

## Debugging CI Failures

### Access CI Logs

**GitHub Web Interface:**

1. Go to repository → Actions tab
2. Click on failing workflow run
3. Click on failing job
4. Expand step to see detailed logs

**GitHub CLI:**

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Download logs
gh run download <run-id> --name logs
```

### Common Debug Strategies

**1. Reproduce Locally**

```bash
# Run the same commands CI runs
npm ci                    # Same as CI install
npm run lint:check --max-warnings=0
npm run type-check
npm run test:run
npm run build
```

**2. Check Environment Differences**

```bash
# Node version (should match CI)
node --version   # CI uses Node 18

# Environment variables
echo $NODE_ENV   # Should be test/development

# Dependencies
npm ls           # Check for missing/extra packages
```

**3. Enable Debug Output**

```bash
# Enable debug logging
DEBUG=* npm run test:integration

# Verbose npm
npm run build --verbose

# TypeScript tracing
npx tsc --noEmit --extendedDiagnostics
```

### Flaky Test Management

**Identify Flaky Tests:**

```bash
# Run tests multiple times
for i in {1..10}; do npm run test:e2e || echo "Run $i failed"; done
```

**Common Flaky Patterns:**

- **Timing Issues**: Use proper waits instead of hardcoded delays
- **Test Data Conflicts**: Ensure test isolation with unique data
- **Network Issues**: Mock external API calls
- **Resource Cleanup**: Proper teardown in afterEach hooks

**Fix Strategy:**

1. **Isolate**: Run flaky test alone to understand failure
2. **Debug**: Add logging to understand timing/state issues
3. **Stabilize**: Use proper waits, mocks, and cleanup
4. **Verify**: Run 10+ times to confirm stability

## Caching Strategy

### NPM Dependencies

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
```

**Cache Hit Rate**: ~90% (dependencies change infrequently) **Cache Size**:
~200MB **Build Time Savings**: ~30-60 seconds

### TypeScript Compilation

```yaml
- uses: actions/cache@v3
  with:
    path: node_modules/.cache/tsc
    key: tsc-${{ hashFiles('**/*.ts', '**/*.tsx', 'tsconfig.json') }}
```

### Cache Debugging

```bash
# Check cache keys in CI logs
grep -r "Cache hit" .github/workflows/

# Force cache miss (if needed)
# Update package-lock.json or tsconfig.json
```

## Security Scanning

### Dependency Audit

```bash
npm audit                    # Check vulnerabilities
npm audit fix               # Auto-fix where possible
npm audit fix --force       # Force fixes (may break things)
```

### SARIF Upload

CI uploads security findings to GitHub Security tab:

- **Location**: Security → Code scanning alerts
- **Format**: SARIF (Static Analysis Results Interchange Format)
- **Tools**: ESLint security rules, npm audit

### Secret Scanning

GitHub automatically scans for:

- API keys
- Database connection strings
- Authentication tokens

**False Positives**: Use `.gitignore` and clean commit history

## Deployment Pipeline

### Vercel Integration

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Deployment Stages

1. **Build**: Production build with optimizations
2. **Upload**: Assets uploaded to Vercel CDN
3. **Deploy**: New deployment created
4. **Health Check**: Verify deployment is responding
5. **Promote**: Set as production (if main branch)

### Rollback Strategy

```bash
# Using Vercel CLI
vercel --prod rollback

# Or from Vercel dashboard
# Go to deployments → Select previous version → Promote
```

## Monitoring & Alerts

### CI Health Metrics

- **Build Success Rate**: Target >95%
- **Average Build Time**: Target <15 minutes
- **Flaky Test Rate**: Target <5%

### Alert Thresholds

- **Multiple consecutive failures**: Slack notification
- **Build time > 20 minutes**: Performance investigation
- **Security vulnerabilities**: Immediate notification

### Dashboard Links

- [GitHub Actions](https://github.com/Coding-Krakken/MaintAInPro/actions)
- [Vercel Deployments](https://vercel.com/dashboard)
- [Coverage Reports](https://codecov.io/gh/Coding-Krakken/MaintAInPro) (if
  configured)

## Maintenance Tasks

### Weekly

- [ ] Review failed builds and fix any patterns
- [ ] Update dependencies with security fixes
- [ ] Check cache hit rates and optimize if needed
- [ ] Review flaky tests and stabilize

### Monthly

- [ ] Update GitHub Actions to latest versions
- [ ] Review and rotate secrets if needed
- [ ] Analyze build performance trends
- [ ] Update this runbook with new patterns

### Quarterly

- [ ] Major dependency updates
- [ ] Review and update CI strategy
- [ ] Performance benchmarking
- [ ] Security audit of CI pipeline

---

**Emergency Contacts:**

- **CI Issues**: Check GitHub Status page first
- **Deployment Issues**: Vercel Status page
- **Security Issues**: Follow incident response process

**Related Documentation:**

- [Development Watchers](./dev-watchers.md)
- [Elite CI/CD ADR](../../artifacts/adr/adr-elite-ci-cd.md)
- [Testing Strategy](../../attached_assets/TestingStrategy_1752515902056.md)
