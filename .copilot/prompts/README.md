# Copilot Prompt Library

Surgical, minimal-change focused prompts for MaintAInPro development. Use these prompts to ensure consistent, quality code changes.

## Quick Access

| Prompt | Use Case | Key Focus |
|--------|----------|-----------|
| [01-fix-tests.md](./01-fix-tests.md) | Fix failing tests | Minimal implementation to pass specific tests |
| [02-refactor-lint.md](./02-refactor-lint.md) | Clean up lint issues | No behavioral changes, only code style |
| [03-add-feature.md](./03-add-feature.md) | Implement new features | Full quality gates, tests included |
| [04-autofix-strategy.md](./04-autofix-strategy.md) | Complex issue resolution | Systematic approach with validation |
| [05-adr.md](./05-adr.md) | Document decisions | Structured architectural decisions |
| [06-e2e-hardening.md](./06-e2e-hardening.md) | E2E test coverage | Idempotent, CI-integrated tests |

## Usage Patterns

### Copy-Paste Workflow
1. **Identify the type** of change you need to make
2. **Copy the relevant prompt** from the appropriate file  
3. **Fill in the placeholders** with your specific details
4. **Paste into your Copilot chat** and execute

### VS Code Snippets
Use the code snippets (see `.vscode/snippets/copilot-prompts.code-snippets`):
- Type `cp-fix-tests` → Tab → Fill placeholders
- Type `cp-add-feature` → Tab → Fill placeholders  
- Type `cp-lint-fix` → Tab → Fill placeholders

## MaintAInPro Context

### Repository Structure
- **client/**: React 18 + TypeScript frontend
- **server/**: Express.js + TypeScript backend  
- **shared/**: Common types and validation
- **tests/**: Vitest unit/integration, Playwright E2E
- **config/**: Feature flags, environment configs

### Quality Gates  
All changes must pass:
- `npm run lint:check --max-warnings=0`
- `npm run type-check` 
- `npm run test:run`
- `npm run build`

### Development Workflow
1. **Red**: Write failing test or identify issue
2. **Green**: Make minimal change to pass
3. **Refactor**: Clean up with quality gates
4. **Document**: Update changelog, ADR if needed

## Prompt Principles

### Surgical Changes
- **Minimal scope**: Change only what's necessary
- **Preserve behavior**: Don't break existing functionality
- **Focused intent**: One clear objective per change

### Quality First  
- **Zero warnings**: Must pass `--max-warnings=0`
- **Test coverage**: Include tests for new functionality
- **Type safety**: No `any` types without justification

### Documentation
- **Rationale**: Explain why each change is needed
- **Traceability**: Link to tests, issues, or requirements
- **Rollback**: Document how to undo changes safely

## Examples

### Quick Fix
```
Using prompt: 01-fix-tests.md

Fix the failing tests: HealthDashboard > displays system metrics

**Scope**: client/src/components/admin/HealthDashboard.tsx
```

### Feature Addition
```
Using prompt: 03-add-feature.md  

Add QR code generation in client/src/components/equipment/QRCodeGenerator.tsx to satisfy: Generate equipment tracking codes with download functionality
```

### Strategic Fix
```
Using prompt: 04-autofix-strategy.md

## Change Plan
**Intent**: Fix WebSocket memory leaks causing performance degradation
**Scope**: server/websocket.ts, client/src/hooks/useWebSocket.ts
**Risks**: Existing connections might drop briefly
**Rollback**: git checkout HEAD~1 -- server/websocket.ts client/src/hooks/useWebSocket.ts
```

## Best Practices

### Before Using Prompts
- [ ] Understand the current code structure
- [ ] Identify the minimal scope needed  
- [ ] Check existing patterns to mirror
- [ ] Ensure you have failing tests (red state)

### After Using Prompts
- [ ] Run all quality gates
- [ ] Verify the change is minimal
- [ ] Test the specific functionality  
- [ ] Update documentation if needed
- [ ] Commit with descriptive message

## Contributing to Prompts

When you find a new pattern or improve existing prompts:
1. Update the relevant prompt file
2. Test the prompt with real scenarios
3. Document the changes in CHANGELOG.md
4. Submit PR with examples

---

These prompts are designed for surgical, test-first development. Use them to maintain MaintAInPro's quality standards while moving fast.