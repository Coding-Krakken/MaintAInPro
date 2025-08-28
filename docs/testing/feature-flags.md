# Feature Flag Testing Strategy

## Overview

This document outlines the comprehensive testing approach for feature flags in
the CMMS platform. Feature flags enable gradual rollouts, A/B testing, and safe
deployment of new functionality while maintaining system stability and user
experience.

## Feature Flag Implementation

Our feature flag system uses environment-based configuration with the following
current flags:

- `FEATURE_AI_ENABLED` - AI-powered maintenance recommendations
- `FEATURE_REALTIME_ENABLED` - Real-time notifications and updates
- `FEATURE_ADVANCED_ANALYTICS` - Enhanced reporting and analytics
- `FEATURE_MOBILE_APP` - Mobile application features

## Testing Strategy Overview

### Testing Pyramid for Feature Flags

1. **Unit Tests** (70%) - Test flag conditions and business logic
2. **Integration Tests** (20%) - Test flag interactions with services
3. **End-to-End Tests** (10%) - Test complete user workflows with flags

### Core Testing Principles

- **Test Both States**: Always test both enabled and disabled states
- **Isolation**: Each flag state should be tested independently
- **Performance**: Verify flags don't impact system performance
- **Security**: Ensure flags don't expose unauthorized functionality
- **Rollback Safety**: Test that disabling flags works seamlessly

---

## 1. Unit Testing for Feature Flags

### 1.1. Component Testing with Feature Flags

```typescript
// Example: AI Recommendations component test
describe('AIRecommendationsWidget', () => {
  it('renders AI recommendations when feature is enabled', () => {
    const mockConfig = { FEATURE_AI_ENABLED: 'true' };

    render(
      <FeatureFlagProvider config={mockConfig}>
        <AIRecommendationsWidget workOrderId="WO-001" />
      </FeatureFlagProvider>
    );

    expect(screen.getByText(/AI Recommendations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply suggestion/i })).toBeInTheDocument();
  });

  it('shows fallback content when AI feature is disabled', () => {
    const mockConfig = { FEATURE_AI_ENABLED: 'false' };

    render(
      <FeatureFlagProvider config={mockConfig}>
        <AIRecommendationsWidget workOrderId="WO-001" />
      </FeatureFlagProvider>
    );

    expect(screen.getByText(/Manual Planning/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI Recommendations/i)).not.toBeInTheDocument();
  });
});
```

### 1.2. Hook Testing with Feature Flags

```typescript
// Example: useRealtimeUpdates hook test
describe('useRealtimeUpdates', () => {
  it('establishes WebSocket connection when realtime is enabled', () => {
    const mockConfig = { FEATURE_REALTIME_ENABLED: 'true' };

    const { result } = renderHook(() => useRealtimeUpdates('work-orders'), {
      wrapper: ({ children }) => (
        <FeatureFlagProvider config={mockConfig}>
          {children}
        </FeatureFlagProvider>
      ),
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionType).toBe('websocket');
  });

  it('uses polling fallback when realtime is disabled', () => {
    const mockConfig = { FEATURE_REALTIME_ENABLED: 'false' };

    const { result } = renderHook(() => useRealtimeUpdates('work-orders'), {
      wrapper: ({ children }) => (
        <FeatureFlagProvider config={mockConfig}>
          {children}
        </FeatureFlagProvider>
      ),
    });

    expect(result.current.connectionType).toBe('polling');
    expect(result.current.pollInterval).toBe(5000); // 5 second fallback
  });
});
```

### 1.3. Business Logic Testing

```typescript
// Example: Work order assignment logic with AI
describe('WorkOrderAssignmentService', () => {
  it('uses AI-based assignment when feature is enabled', async () => {
    process.env.FEATURE_AI_ENABLED = 'true';

    const workOrder = createMockWorkOrder({ priority: 'high' });
    const assignment = await assignWorkOrder(workOrder);

    expect(assignment.assignmentMethod).toBe('ai-optimized');
    expect(assignment.confidence).toBeGreaterThan(0.8);
    expect(assignment.technician.skills).toContain(workOrder.required_skill);
  });

  it('uses manual assignment rules when AI is disabled', async () => {
    process.env.FEATURE_AI_ENABLED = 'false';

    const workOrder = createMockWorkOrder({ priority: 'high' });
    const assignment = await assignWorkOrder(workOrder);

    expect(assignment.assignmentMethod).toBe('rule-based');
    expect(assignment.criteria).toEqual([
      'availability',
      'proximity',
      'skill_match',
    ]);
  });
});
```

---

## 2. Integration Testing with Feature Flags

### 2.1. API Endpoint Testing

```typescript
// Example: Analytics API integration test
describe('Analytics API Integration', () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await seedWorkOrderData();
  });

  it('returns advanced analytics when feature is enabled', async () => {
    process.env.FEATURE_ADVANCED_ANALYTICS = 'true';

    const response = await request(app)
      .get('/api/analytics/work-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('predictiveInsights');
    expect(response.body).toHaveProperty('trendAnalysis');
    expect(response.body).toHaveProperty('optimizationSuggestions');
    expect(response.body.dataPoints).toBeGreaterThan(10);
  });

  it('returns basic analytics when advanced feature is disabled', async () => {
    process.env.FEATURE_ADVANCED_ANALYTICS = 'false';

    const response = await request(app)
      .get('/api/analytics/work-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).not.toHaveProperty('predictiveInsights');
    expect(response.body).toHaveProperty('basicMetrics');
    expect(response.body.basicMetrics).toHaveProperty('totalWorkOrders');
    expect(response.body.basicMetrics).toHaveProperty('completionRate');
  });
});
```

### 2.2. Database Integration Testing

```typescript
// Example: Equipment monitoring with feature flags
describe('Equipment Monitoring Integration', () => {
  it('stores sensor data when realtime feature is enabled', async () => {
    process.env.FEATURE_REALTIME_ENABLED = 'true';

    const sensorData = {
      equipment_id: 'EQ-001',
      temperature: 75.5,
      pressure: 145.2,
      timestamp: new Date(),
    };

    await processSensorReading(sensorData);

    const storedData = await db
      .select()
      .from(sensor_readings)
      .where(eq(sensor_readings.equipment_id, 'EQ-001'));

    expect(storedData).toHaveLength(1);
    expect(storedData[0].temperature).toBe(75.5);

    // Verify real-time notification was sent
    const notifications = await getRealtimeNotifications('EQ-001');
    expect(notifications).toHaveLength(1);
  });

  it('skips real-time processing when feature is disabled', async () => {
    process.env.FEATURE_REALTIME_ENABLED = 'false';

    const sensorData = {
      equipment_id: 'EQ-001',
      temperature: 75.5,
      pressure: 145.2,
      timestamp: new Date(),
    };

    await processSensorReading(sensorData);

    const storedData = await db
      .select()
      .from(sensor_readings)
      .where(eq(sensor_readings.equipment_id, 'EQ-001'));

    expect(storedData).toHaveLength(1); // Data still stored

    // Verify no real-time notification sent
    const notifications = await getRealtimeNotifications('EQ-001');
    expect(notifications).toHaveLength(0);
  });
});
```

---

## 3. End-to-End Testing Scenarios

### 3.1. Complete Workflow Testing

```typescript
// Example: Mobile app workflow with feature flags
test('Mobile technician workflow with all features enabled', async ({
  page,
}) => {
  // Set feature flags via environment or test configuration
  await page.addInitScript(() => {
    window.featureFlags = {
      FEATURE_MOBILE_APP: 'true',
      FEATURE_AI_ENABLED: 'true',
      FEATURE_REALTIME_ENABLED: 'true',
    };
  });

  // Login as mobile technician
  await page.goto('http://localhost:4173/mobile/login');
  await loginAsTechnician(page);

  // Verify mobile-specific features are available
  await expect(
    page.locator('[data-testid="offline-sync-indicator"]')
  ).toBeVisible();
  await expect(page.locator('[data-testid="qr-scanner-button"]')).toBeVisible();

  // Navigate to work order
  await page.click('[data-testid="assigned-work-orders"]');
  await page.click('[data-testid="work-order-card"]:first-child');

  // Verify AI recommendations are shown
  await expect(
    page.locator('[data-testid="ai-recommendations"]')
  ).toBeVisible();
  await expect(page.locator('[data-testid="suggested-parts"]')).toBeVisible();

  // Complete work order with real-time updates
  await page.click('[data-testid="start-work-button"]');

  // Verify real-time status update
  await expect(page.locator('[data-testid="status-indicator"]')).toHaveText(
    'In Progress'
  );

  // Complete and verify real-time sync
  await page.click('[data-testid="complete-work-order"]');
  await expect(
    page.locator('[data-testid="success-notification"]')
  ).toBeVisible();
});

test('Fallback workflow with mobile features disabled', async ({ page }) => {
  await page.addInitScript(() => {
    window.featureFlags = {
      FEATURE_MOBILE_APP: 'false',
      FEATURE_AI_ENABLED: 'false',
      FEATURE_REALTIME_ENABLED: 'false',
    };
  });

  // Mobile users get redirected to desktop interface
  await page.goto('http://localhost:4173/mobile/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);

  // Verify desktop features work without mobile enhancements
  await loginAsTechnician(page);
  await page.click('[data-testid="work-orders-menu"]');

  // No AI recommendations shown
  await expect(
    page.locator('[data-testid="ai-recommendations"]')
  ).not.toBeVisible();

  // Manual refresh required instead of real-time updates
  await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
});
```

### 3.2. Progressive Feature Rollout Testing

```typescript
// Example: A/B testing scenario
test('A/B test new analytics dashboard', async ({ page, context }) => {
  // Simulate 50% rollout
  const userId = await getUserId(context);
  const isInTestGroup = userId.hashCode() % 2 === 0;

  await page.addInitScript(inTestGroup => {
    window.featureFlags = {
      FEATURE_ADVANCED_ANALYTICS: inTestGroup ? 'true' : 'false',
    };
  }, isInTestGroup);

  await page.goto('http://localhost:4173/dashboard');
  await loginAsManager(page);

  if (isInTestGroup) {
    // Test new analytics features
    await page.click('[data-testid="analytics-menu"]');
    await expect(
      page.locator('[data-testid="predictive-charts"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="optimization-insights"]')
    ).toBeVisible();

    // Verify enhanced functionality
    await page.click('[data-testid="generate-forecast-button"]');
    await expect(
      page.locator('[data-testid="forecast-results"]')
    ).toBeVisible();
  } else {
    // Test control group experience
    await page.click('[data-testid="analytics-menu"]');
    await expect(page.locator('[data-testid="basic-reports"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="predictive-charts"]')
    ).not.toBeVisible();
  }
});
```

---

## 4. Performance Testing Considerations

### 4.1. Feature Flag Performance Impact

```typescript
// Example: Performance test for feature flag evaluation
describe('Feature Flag Performance', () => {
  it('evaluates flags without significant performance impact', async () => {
    const iterations = 10000;

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const isAIEnabled = evaluateFeatureFlag('FEATURE_AI_ENABLED', 'user123');
      const isRealtimeEnabled = evaluateFeatureFlag(
        'FEATURE_REALTIME_ENABLED',
        'user123'
      );

      // Simulate typical flag-dependent operation
      if (isAIEnabled && isRealtimeEnabled) {
        await processWithAIAndRealtime();
      } else {
        await processStandard();
      }
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;

    // Flag evaluation should add minimal overhead (< 1ms per evaluation)
    expect(avgTime).toBeLessThan(1);
  });
});
```

### 4.2. Memory Usage with Feature Flags

```typescript
// Example: Memory impact test
describe('Feature Flag Memory Usage', () => {
  it('does not cause memory leaks with frequent flag checks', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate heavy flag usage
    for (let i = 0; i < 100000; i++) {
      const config = getFeatureFlagConfig();
      evaluateFlags(config, `user-${i % 1000}`);
    }

    // Force garbage collection
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (< 10MB for 100k operations)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---

## 5. Security and Access Control Testing

### 5.1. Feature Flag Authorization

```typescript
// Example: Role-based feature access test
describe('Feature Flag Security', () => {
  it('restricts advanced features to authorized roles', async () => {
    const regularUser = createTestUser({ role: 'technician' });
    const adminUser = createTestUser({ role: 'admin' });

    // Regular user should not access advanced analytics
    const regularContext = createUserContext(regularUser);
    expect(
      evaluateFeatureFlag('FEATURE_ADVANCED_ANALYTICS', regularContext)
    ).toBe(false);

    // Admin user should have access
    const adminContext = createUserContext(adminUser);
    expect(
      evaluateFeatureFlag('FEATURE_ADVANCED_ANALYTICS', adminContext)
    ).toBe(true);
  });

  it('prevents feature flag tampering via client-side', async ({ page }) => {
    await page.goto('http://localhost:4173/dashboard');

    // Attempt to modify flags via browser console
    await page.evaluate(() => {
      window.featureFlags = { FEATURE_AI_ENABLED: 'true' };
      localStorage.setItem(
        'featureFlags',
        JSON.stringify({
          FEATURE_AI_ENABLED: 'true',
        })
      );
    });

    // Refresh to ensure server-side validation
    await page.reload();

    // Verify server-side flags take precedence
    const aiSection = page.locator('[data-testid="ai-recommendations"]');
    if (process.env.FEATURE_AI_ENABLED !== 'true') {
      await expect(aiSection).not.toBeVisible();
    }
  });
});
```

---

## 6. CI/CD Pipeline Integration

### 6.1. Automated Feature Flag Testing

```yaml
# Example: GitHub Actions workflow for feature flag testing
name: Feature Flag Tests
on: [push, pull_request]

jobs:
  test-feature-combinations:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ai_enabled: ['true', 'false']
        realtime_enabled: ['true', 'false']
        analytics_enabled: ['true', 'false']

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with feature flag combination
        env:
          FEATURE_AI_ENABLED: ${{ matrix.ai_enabled }}
          FEATURE_REALTIME_ENABLED: ${{ matrix.realtime_enabled }}
          FEATURE_ADVANCED_ANALYTICS: ${{ matrix.analytics_enabled }}
        run: |
          echo "Testing combination: AI=${{ matrix.ai_enabled }}, Realtime=${{ matrix.realtime_enabled }}, Analytics=${{ matrix.analytics_enabled }}"
          npm run test:unit
          npm run test:integration
```

### 6.2. Feature Flag Validation Gates

```typescript
// Example: Pre-deployment validation
describe('Deployment Readiness', () => {
  it('validates all feature flag combinations work', async () => {
    const flagCombinations = [
      { FEATURE_AI_ENABLED: 'true', FEATURE_REALTIME_ENABLED: 'true' },
      { FEATURE_AI_ENABLED: 'true', FEATURE_REALTIME_ENABLED: 'false' },
      { FEATURE_AI_ENABLED: 'false', FEATURE_REALTIME_ENABLED: 'true' },
      { FEATURE_AI_ENABLED: 'false', FEATURE_REALTIME_ENABLED: 'false' },
    ];

    for (const flags of flagCombinations) {
      // Set environment variables
      Object.assign(process.env, flags);

      // Test critical workflows
      await testWorkOrderCreation();
      await testEquipmentMonitoring();
      await testUserAuthentication();

      console.log(`✅ Combination validated:`, flags);
    }
  });

  it('ensures graceful degradation paths exist', async () => {
    // Test with all features disabled
    process.env.FEATURE_AI_ENABLED = 'false';
    process.env.FEATURE_REALTIME_ENABLED = 'false';
    process.env.FEATURE_ADVANCED_ANALYTICS = 'false';
    process.env.FEATURE_MOBILE_APP = 'false';

    // Core functionality should still work
    const workOrder = await createWorkOrder(mockWorkOrderData);
    expect(workOrder.id).toBeDefined();

    const equipment = await getEquipmentList();
    expect(equipment.length).toBeGreaterThan(0);

    const users = await getUserList();
    expect(users.length).toBeGreaterThan(0);
  });
});
```

---

## 7. Monitoring and Observability

### 7.1. Feature Flag Usage Metrics

```typescript
// Example: Usage tracking test
describe('Feature Flag Metrics', () => {
  it('tracks feature flag usage accurately', async () => {
    const metricsCollector = createMockMetricsCollector();

    // Simulate user interactions with features
    await simulateUserSession({
      userId: 'user123',
      actions: [
        { type: 'VIEW_AI_RECOMMENDATIONS', featureFlag: 'FEATURE_AI_ENABLED' },
        {
          type: 'USE_REALTIME_UPDATES',
          featureFlag: 'FEATURE_REALTIME_ENABLED',
        },
        {
          type: 'GENERATE_ANALYTICS',
          featureFlag: 'FEATURE_ADVANCED_ANALYTICS',
        },
      ],
    });

    // Verify metrics are collected
    const metrics = metricsCollector.getMetrics();
    expect(metrics['feature_flag_usage.FEATURE_AI_ENABLED']).toBe(1);
    expect(metrics['feature_flag_usage.FEATURE_REALTIME_ENABLED']).toBe(1);
    expect(metrics['feature_flag_usage.FEATURE_ADVANCED_ANALYTICS']).toBe(1);
  });
});
```

### 7.2. Error Monitoring with Feature Flags

```typescript
// Example: Error tracking with feature context
describe('Feature Flag Error Monitoring', () => {
  it('includes feature flag context in error reports', async () => {
    const errorReporter = createMockErrorReporter();

    process.env.FEATURE_AI_ENABLED = 'true';

    try {
      await generateAIRecommendations('invalid-work-order-id');
    } catch (error) {
      // Verify error includes feature flag context
      expect(error.context).toEqual({
        featureFlags: {
          FEATURE_AI_ENABLED: 'true',
          FEATURE_REALTIME_ENABLED: 'false',
          FEATURE_ADVANCED_ANALYTICS: 'false',
          FEATURE_MOBILE_APP: 'false',
        },
      });
    }
  });
});
```

---

## 8. Best Practices and Guidelines

### 8.1. Feature Flag Testing Checklist

**Before Releasing a Feature Flag:**

- [ ] Unit tests cover both enabled/disabled states
- [ ] Integration tests validate service interactions
- [ ] Performance impact assessed and acceptable
- [ ] Security implications reviewed and tested
- [ ] Graceful degradation paths implemented
- [ ] Rollback procedures documented and tested
- [ ] Monitoring and alerting configured
- [ ] Documentation updated

### 8.2. Common Testing Patterns

**DO:**

- ✅ Test both flag states in every test suite
- ✅ Use consistent flag naming conventions
- ✅ Mock feature flags in unit tests
- ✅ Test flag evaluation performance
- ✅ Verify proper access controls
- ✅ Include flags in error context
- ✅ Test combinations of multiple flags

**DON'T:**

- ❌ Rely only on manual testing
- ❌ Skip testing the disabled state
- ❌ Hardcode flag values in tests
- ❌ Ignore performance implications
- ❌ Bypass security validations
- ❌ Deploy without rollback plans
- ❌ Leave dead code after flag removal

### 8.3. Rollback and Cleanup Strategy

```typescript
// Example: Feature flag cleanup test
describe('Feature Flag Lifecycle', () => {
  it('safely removes deprecated feature flags', async () => {
    // Test that removing flag doesn't break existing functionality
    delete process.env.DEPRECATED_FEATURE_FLAG;

    // Core functionality should remain intact
    await testCoreWorkflows();

    // Verify no references to deprecated flag exist
    const codebase = await scanCodebaseForReferences('DEPRECATED_FEATURE_FLAG');
    expect(codebase.references).toHaveLength(0);
  });
});
```

### 8.4. Testing Environment Configuration

```typescript
// Example: Test environment setup
export function setupFeatureFlagTestEnvironment(flags: Record<string, string>) {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, flags);
  });

  afterEach(() => {
    process.env = originalEnv;
  });
}

// Usage in tests
describe('Work Order Service with AI', () => {
  setupFeatureFlagTestEnvironment({
    FEATURE_AI_ENABLED: 'true',
    FEATURE_REALTIME_ENABLED: 'false',
  });

  // Tests run with consistent flag configuration
});
```

---

## Conclusion

Feature flag testing is crucial for maintaining system reliability while
enabling rapid feature deployment. This strategy ensures that:

- All feature states are thoroughly tested
- Performance impact is monitored and controlled
- Security and access controls are properly validated
- Rollback procedures are reliable and tested
- Team confidence in deployments remains high

Regular review and updates of this testing strategy will ensure it continues to
meet the evolving needs of the CMMS platform and its users.
