# Feature Flags Configuration

This directory contains the feature flag configuration for the MaintAInPro CMMS
platform, enabling safer rollouts and controlled experimentation.

## Overview

Feature flags allow us to:

- **Safe Rollouts**: Deploy features with controlled rollout percentages
- **Environment Control**: Enable features only in specific environments
- **Experimentation**: A/B test new functionality with targeted user groups
- **Risk Mitigation**: Quickly disable features if issues arise
- **Compliance**: Meet NFRs for reliability and agility

## Usage

### Basic Feature Checking

```typescript
import { isFeatureEnabled } from '../config/feature-flags';

// Simple feature check
if (isFeatureEnabled('qrCodeGeneration')) {
  // Render QR code functionality
}

// With user-specific rollout
const userPercentile = getUserPercentile(user.id); // 0-100
if (isFeatureEnabled('predictiveMaintenanceAlerts', userPercentile)) {
  // Show predictive maintenance features
}

// Environment-specific check
if (isFeatureEnabled('webhookIntegrations', 0, 'production')) {
  // Enable webhook functionality
}
```

### Getting Feature Configuration

```typescript
import { getFeatureConfig } from '../config/feature-flags';

const config = getFeatureConfig('workOrderBatchOperations');
if (config?.metadata?.requiresPermission) {
  // Check user permissions before enabling
}
```

### Development Helpers

```typescript
import { logFeatureFlags, getEnabledFeatures } from '../config/feature-flags';

// Log all feature flags in development
logFeatureFlags();

// Get list of enabled features
const enabledFeatures = getEnabledFeatures('development');
```

## Feature Categories

### Core Work Order Features

- `workOrderAutomation`: Automated work order generation
- `workOrderEscalation`: Automatic escalation system
- `workOrderBatchOperations`: Bulk work order operations

### Equipment & Asset Management

- `qrCodeGeneration`: QR code generation for equipment
- `equipmentPerformanceAnalytics`: MTBF/MTTR analytics
- `predictiveMaintenanceAlerts`: AI-powered predictions

### Inventory & Parts Management

- `partsConsumptionTracking`: Real-time inventory updates
- `inventoryReorderAlerts`: Low stock notifications
- `bulkInventoryOperations`: Bulk inventory management

### Preventive Maintenance

- `automaticPMScheduling`: Automated PM scheduling
- `pmComplianceTracking`: PM compliance monitoring
- `pmTemplateLibrary`: Reusable PM templates

### User Experience & Interface

- `realTimeNotifications`: WebSocket notifications
- `darkModeSupport`: Dark theme support
- `mobileOptimization`: Enhanced mobile interface

### Integration & API Features

- `webhookIntegrations`: External system integration
- `apiRateLimiting`: Enhanced rate limiting
- `auditLogExport`: Compliance report exports

### Performance & Caching

- `redisCache`: Redis-based caching
- `queryOptimization`: Database query optimization
- `fileCompressionUpload`: Automatic file compression

### Security & Compliance

- `twoFactorAuthentication`: 2FA support
- `encryptedFileStorage`: Encrypted file storage
- `advancedAuditLogging`: Enhanced audit logging

## Configuration Properties

Each feature flag includes:

| Property            | Type     | Description                      |
| ------------------- | -------- | -------------------------------- |
| `enabled`           | boolean  | Global on/off switch             |
| `description`       | string   | Human-readable description       |
| `rolloutPercentage` | number   | Gradual rollout control (0-100%) |
| `environments`      | string[] | Allowed environments             |
| `metadata`          | object   | Additional configuration data    |

## Environment Strategy

- **Development**: All experimental features available
- **Staging**: Production-ready features for testing
- **Production**: Stable, fully-tested features only

## Rollout Strategy

1. **0%**: Feature disabled, development only
2. **25%**: Limited beta testing
3. **50%**: Expanded testing group
4. **75%**: Pre-production validation
5. **100%**: Full rollout

## Best Practices

### Adding New Features

1. Start with `enabled: false` and `rolloutPercentage: 0`
2. Test in development environment first
3. Gradually increase rollout percentage
4. Add comprehensive metadata for complex features

### Removing Features

1. Set `enabled: false` to disable immediately
2. Remove from environments array to restrict access
3. After validation period, remove the flag entirely

### Monitoring

- Monitor feature usage through analytics
- Track rollout impact on system performance
- Use metadata to store rollback plans

## Integration Examples

### React Components

```tsx
import { isFeatureEnabled } from '../config/feature-flags';

const WorkOrderPage = () => {
  const showBatchOperations = isFeatureEnabled('workOrderBatchOperations');

  return <div>{showBatchOperations && <BatchOperationsPanel />}</div>;
};
```

### API Routes

```typescript
import { isFeatureEnabled } from '../config/feature-flags';

app.post('/api/webhooks', (req, res) => {
  if (!isFeatureEnabled('webhookIntegrations')) {
    return res.status(404).json({ error: 'Feature not available' });
  }

  // Process webhook
});
```

### Middleware

```typescript
import { isFeatureEnabled } from '../config/feature-flags';

const featureGuard = (featureName: keyof FeatureFlags) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(featureName)) {
      return res.status(404).json({ error: 'Feature not available' });
    }
    next();
  };
};

// Usage
app.use('/api/bulk-inventory', featureGuard('bulkInventoryOperations'));
```

## Rollback Procedures

To rollback a feature:

1. **Immediate**: Set `enabled: false` in `config/feature-flags.ts`
2. **Targeted**: Adjust `rolloutPercentage` to reduce exposure
3. **Environmental**: Remove from `environments` array
4. **Emergency**: Deploy with feature completely removed

## Future Enhancements

- Database-driven feature flags for runtime changes
- User group targeting (role-based, organization-based)
- A/B testing framework integration
- Feature flag analytics dashboard
- Automatic rollback based on error rates
