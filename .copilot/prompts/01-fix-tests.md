# Fix Failing Tests

**Objective**: Implement only what's required to pass failing tests. Make
minimal changes.

## Usage

Copy this prompt when you need to fix failing tests without side effects.

## Template

```
Fix the failing tests: {TEST_NAMES}

**Scope**: Modify only files in: {PATHS}

**Requirements**:
- Implement minimal code to pass the failing tests
- Do NOT refactor unrelated code
- Do NOT fix unrelated tests
- Keep changes surgical and focused
- Preserve existing behavior for passing tests

**Deliverables**:
1. Minimal diff showing only necessary changes
2. Brief rationale explaining why each change is needed
3. Confirmation that target tests now pass
4. Verification that no existing tests are broken

**Example Paths**: tests/unit/components/admin/, src/components/admin/
**Example Test Names**: HealthDashboard.unit.test.tsx > displays websocket connections

Run tests after changes: `npm run test -- {SPECIFIC_TEST_FILE}`
```

## MaintAInPro Specific Examples

```
Fix the failing tests: HealthDashboard.unit.test.tsx > displays websocket connections by warehouse

**Scope**: Modify only files in: client/src/components/admin/HealthDashboard.tsx, tests/unit/components/admin/HealthDashboard.unit.test.tsx

Focus on the WebSocket connections display logic - likely missing UI elements or incorrect test expectations.
```

```
Fix the failing tests: auth.integration.test.ts > login flow

**Scope**: Modify only files in: server/services/auth/, tests/integration/auth.integration.test.ts

Ensure authentication middleware and session management work as expected by the test.
```
