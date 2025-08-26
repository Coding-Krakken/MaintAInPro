# ADR: Bootstrap Red→Green Development System

## Status

Accepted

## Context

MaintAInPro requires a fail-fast, test-first development system to ensure code
quality, rapid feedback, and atomic changes. The current system has quality
gates but lacks continuous watchers and structured prompt-based development
workflows.

Current challenges:

- Lint warnings are not blocking (71 warnings present)
- No continuous watchers for instant feedback
- Manual quality checks slow down development cycle
- Inconsistent development experience across team
- No standardized prompts for common development tasks

## Decision

Implement a comprehensive red→green bootstrap system with:

**1. Hard Guardrails**

- Enforce `--max-warnings=0` in ESLint configuration
- Add `.gitattributes` for consistent line endings
- Ensure TypeScript strict mode enforcement
- Maintain structured ADR documentation

**2. Continuous Watchers**

- Concurrent watchers: `npm run dev:watch`
- Individual watchers: types, lint, test, build
- VS Code tasks with problem matchers
- Background processes with automatic restart

**3. Enhanced CI Gates**

- Matrix jobs for parallel execution
- Fail-fast on any warning/error
- Proper caching for npm dependencies
- Coverage thresholds enforced

**4. Prompt Library**

- Standardized prompts in `.copilot/prompts/`
- VS Code snippets for quick access
- Surgical, minimal-change focused prompts
- Documentation-driven development

**5. Developer Experience**

- 5-command quickstart guide
- Automated problem detection
- Instant feedback loops
- Consistent tooling across environments

## Consequences

### Positive

- **Fast Feedback**: Changes get immediate validation (<2s)
- **Quality Enforcement**: Zero tolerance for warnings in CI
- **Consistency**: Standardized development workflows
- **Productivity**: Automated watchers reduce manual steps
- **Maintainability**: Structured prompts enable precise changes

### Negative

- **Initial Overhead**: Setting up watchers and tooling
- **Strict Standards**: All existing warnings must be addressed
- **Tool Complexity**: More moving parts to understand
- **Resource Usage**: Multiple concurrent watchers consume more CPU/memory

### Mitigation Strategies

- Gradual rollout with incremental validation
- Preserve existing scripts (additive approach)
- Clear documentation and runbooks
- Safe rollback procedures documented

## Implementation

### Files Modified/Added

- `package.json`: Added watcher scripts
- `.vscode/tasks.json`: Enhanced VS Code integration
- `.gitattributes`: Line ending consistency
- `artifacts/bootstrap/plan.md`: Detailed implementation plan
- `.copilot/prompts/`: Reusable development prompts

### Validation Criteria

- [ ] `npm run dev:watch` starts clean
- [ ] All watchers provide instant feedback
- [ ] `npm run lint:check --max-warnings=0` passes
- [ ] CI pipeline is green
- [ ] Prompt library is accessible

## Related ADRs

- [Elite CI/CD Pipeline](../adr/adr-elite-ci-cd.md)
- Future ADR for prompt-driven development

---

This ADR documents the decision to bootstrap MaintAInPro into a red→green
development system optimized for fail-fast, test-first workflows with continuous
watchers and structured development prompts.
