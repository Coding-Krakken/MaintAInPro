# Refactor Lint Issues

**Objective**: Eliminate lint errors/warnings without changing behavior. Mirror
existing patterns.

## Usage

Copy this prompt when ESLint or other linters report issues that need fixing.

## Template

```
Eliminate lint errors in: {PATHS}

**Rules**:
- NO behavioral changes
- NO logic modifications
- Mirror patterns from: {REFERENCE_FILE}
- Keep changes minimal
- Focus on: unused variables, type annotations, formatting

**Current Lint Issues**: {LINT_OUTPUT}

**Approach**:
1. Remove unused imports/variables (prefix with _ if needed for parameters)
2. Add proper type annotations instead of `any`
3. Fix formatting issues
4. Ensure consistent code style

**Verification**:
- `npm run lint:check --max-warnings=0` must pass
- `npm run test:run` must still pass (no behavioral changes)

**Deliverables**:
- Minimal diff with only lint fixes
- Confirmation that lint check passes
- Brief explanation of each fix
```

## MaintAInPro Specific Examples

```
Eliminate lint errors in: server/services/enhanced-logging.service.ts

**Current Lint Issues**:
- Line 33: Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
- Line 215: Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

**Reference File**: server/services/auth/security.service.ts (for type patterns)

Focus on replacing `any` with proper types like `Record<string, unknown>` or specific interfaces.
```

```
Eliminate lint errors in: client/src/components/admin/HealthDashboard.tsx

**Current Lint Issues**:
- Line 19: 'Users' is defined but never used no-unused-vars

**Approach**: Remove unused import or prefix parameter with underscore if it's needed for future use.
```

## Common Patterns in MaintAInPro

- **Unused params**: Prefix with `_` (e.g., `_unusedParam`)
- **Any types**: Use `Record<string, unknown>` or create specific interfaces
- **Database results**: Use Drizzle-generated types from `shared/`
- **API responses**: Use types from `shared/types/`
