# E2E Hardening

**Objective**: Add or repair Playwright E2E tests with proper data seeds and CI integration. Keep tests idempotent.

## Usage
Use when adding new E2E test coverage or fixing flaky E2E tests.

## Template

```
Add/repair Playwright tests for user flows: {USER_FLOWS}

**Requirements**:
- Tests must be idempotent (can run multiple times safely)
- Use proper test data seeds that clean up after themselves
- Follow page object model patterns from existing tests
- Include both happy path and error scenarios
- Gate in CI pipeline with proper retry strategy

**Test Structure**:
```typescript
// tests/e2e/{feature}/{flow}.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from '../helpers/auth';

test.describe('{Feature} Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.{ROLE});
    // Setup test data
  });
  
  test.afterEach(async () => {
    // Cleanup test data
  });
  
  test('{specific scenario}', async ({ page }) => {
    // Arrange
    // Act  
    // Assert
  });
});
```

**Data Seeding Pattern**:
- Use unique test data prefixes (test-{timestamp})
- Clean up in afterEach hooks
- Use database transactions when possible
- Mock external API calls

**CI Integration**:
- Add to .github/workflows/ci-cd.yml
- Use retry strategy for flaky tests
- Parallel execution where possible
- Screenshot/video on failure
```

## MaintAInPro Specific Examples

### Example: Work Order Management Flow

```
Add/repair Playwright tests for user flows: Work Order creation, assignment, completion

**User Flows to Test**:
1. Manager creates work order
2. Technician receives and accepts work order  
3. Technician completes work order with parts usage
4. Manager reviews and approves completion

**Test Files**:
- tests/e2e/work-orders/create-work-order.spec.ts
- tests/e2e/work-orders/complete-work-order.spec.ts  
- tests/e2e/work-orders/manager-approval.spec.ts

**Test Data Pattern**:
```typescript
const testWorkOrder = {
  title: `test-wo-${Date.now()}`,
  equipmentId: 'test-equipment-1',
  priority: 'high',
  description: 'Automated test work order'
};
```

**Page Objects**:
- tests/e2e/pages/WorkOrderPage.ts
- tests/e2e/pages/EquipmentPage.ts
- Use existing auth helpers from tests/e2e/helpers/auth.ts
```

### Example: Equipment Management Flow

```
Add/repair Playwright tests for user flows: Equipment registration, QR code generation, maintenance scheduling

**User Flows to Test**:
1. Admin adds new equipment with specifications
2. System generates QR code for equipment
3. Technician scans QR code and views equipment details
4. Manager schedules preventive maintenance

**Test Files**:
- tests/e2e/equipment/equipment-management.spec.ts
- tests/e2e/equipment/qr-code-workflow.spec.ts

**Mock Strategy**:
- Mock QR code scanner functionality
- Mock file uploads for equipment photos
- Use MSW for API mocking in E2E context
```

## E2E Best Practices for MaintAInPro

**Authentication**: Use existing `loginAs` helper with proper user roles
**Data Isolation**: Each test should use unique data to avoid conflicts  
**Selectors**: Use `data-testid` attributes, avoid fragile CSS selectors
**Waiting**: Use page.waitForLoadState() and explicit waits
**Mobile Testing**: Include viewport tests for mobile responsive design
**Performance**: Add basic performance assertions (loading times)
**Accessibility**: Include basic a11y checks with axe-playwright

**CI Configuration**:
```yaml
# In .github/workflows/ci-cd.yml
- name: E2E Tests
  run: npx playwright test --config tests/config/playwright.config.ts
  env:
    CI: true
    DATABASE_URL: ${{ secrets.DATABASE_TEST_URL }}
```