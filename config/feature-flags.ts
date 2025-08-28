/**
 * Feature Flags Configuration
 *
 * This module provides centralized feature flag configuration for safer rollouts
 * and experimentation across the MaintAInPro CMMS platform.
 *
 * Usage:
 *
 * ```typescript
 * import { featureFlags, isFeatureEnabled } from '@/config/feature-flags';
 *
 * // Check if a feature is enabled
 * if (isFeatureEnabled('qrCodeGeneration')) {
 *   // Render QR code functionality
 * }
 *
 * // Access feature configuration
 * const config = featureFlags.workOrderAutomation;
 * ```
 */

/**
 * Feature flag configuration structure
 */
export interface FeatureFlag {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Feature description for documentation */
  description: string;
  /** Rollout percentage (0-100) for gradual deployment */
  rolloutPercentage: number;
  /** Environment restrictions */
  environments?: ('development' | 'staging' | 'production')[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Available feature flags for the CMMS platform
 */
export interface FeatureFlags {
  // Core Work Order Features
  workOrderAutomation: FeatureFlag;
  workOrderEscalation: FeatureFlag;
  workOrderBatchOperations: FeatureFlag;

  // Equipment & Asset Management
  qrCodeGeneration: FeatureFlag;
  equipmentPerformanceAnalytics: FeatureFlag;
  predictiveMaintenanceAlerts: FeatureFlag;

  // Inventory & Parts Management
  partsConsumptionTracking: FeatureFlag;
  inventoryReorderAlerts: FeatureFlag;
  bulkInventoryOperations: FeatureFlag;

  // Preventive Maintenance
  automaticPMScheduling: FeatureFlag;
  pmComplianceTracking: FeatureFlag;
  pmTemplateLibrary: FeatureFlag;

  // User Experience & Interface
  realTimeNotifications: FeatureFlag;
  darkModeSupport: FeatureFlag;
  mobileOptimization: FeatureFlag;

  // Integration & API Features
  webhookIntegrations: FeatureFlag;
  apiRateLimiting: FeatureFlag;
  auditLogExport: FeatureFlag;

  // Performance & Caching
  redisCache: FeatureFlag;
  queryOptimization: FeatureFlag;
  fileCompressionUpload: FeatureFlag;

  // Security & Compliance
  twoFactorAuthentication: FeatureFlag;
  encryptedFileStorage: FeatureFlag;
  advancedAuditLogging: FeatureFlag;

  // Pest Control Platform Features
  pestControlPlatform: FeatureFlag;
  pestControlCustomerPortal: FeatureFlag;
  pestControlAIChatbot: FeatureFlag;
  pestControlTechnicianApp: FeatureFlag;
  pestControlRouteOptimization: FeatureFlag;
  pestControlChemicalTracking: FeatureFlag;
  pestControlAIQuotes: FeatureFlag;
  pestControlCRM: FeatureFlag;
  pestControlComplianceReporting: FeatureFlag;
  pestControlPaymentProcessing: FeatureFlag;
}

/**
 * Default feature flag configuration
 *
 * Each feature includes:
 * - enabled: Whether the feature is active
 * - description: What the feature does
 * - rolloutPercentage: Gradual rollout control (0-100%)
 * - environments: Which environments the feature is available in
 */
export const featureFlags: FeatureFlags = {
  // Core Work Order Features
  workOrderAutomation: {
    enabled: true,
    description: 'Automated work order generation and processing',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  workOrderEscalation: {
    enabled: true,
    description: 'Automatic escalation of overdue work orders',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  workOrderBatchOperations: {
    enabled: false,
    description: 'Bulk operations on multiple work orders',
    rolloutPercentage: 0,
    environments: ['development', 'staging'],
    metadata: { plannedRelease: 'v2.1.0' },
  },

  // Equipment & Asset Management
  qrCodeGeneration: {
    enabled: true,
    description: 'QR code generation for equipment identification',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  equipmentPerformanceAnalytics: {
    enabled: true,
    description: 'MTBF, MTTR, and availability metrics',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  predictiveMaintenanceAlerts: {
    enabled: false,
    description: 'AI-powered predictive maintenance recommendations',
    rolloutPercentage: 25,
    environments: ['development', 'staging'],
    metadata: { requiresAIModel: true, plannedRelease: 'v3.0.0' },
  },

  // Inventory & Parts Management
  partsConsumptionTracking: {
    enabled: true,
    description: 'Real-time parts consumption and inventory updates',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  inventoryReorderAlerts: {
    enabled: true,
    description: 'Automatic reorder notifications for low inventory',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  bulkInventoryOperations: {
    enabled: false,
    description: 'Bulk inventory adjustments and transfers',
    rolloutPercentage: 0,
    environments: ['development'],
    metadata: { requiresPermission: 'inventory:bulk_edit' },
  },

  // Preventive Maintenance
  automaticPMScheduling: {
    enabled: true,
    description: 'Automated preventive maintenance scheduling',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  pmComplianceTracking: {
    enabled: true,
    description: 'Compliance monitoring for PM schedules',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  pmTemplateLibrary: {
    enabled: false,
    description: 'Reusable PM procedure templates',
    rolloutPercentage: 50,
    environments: ['development', 'staging'],
    metadata: { requiresTemplateEngine: true },
  },

  // User Experience & Interface
  realTimeNotifications: {
    enabled: true,
    description: 'WebSocket-powered real-time notifications',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  darkModeSupport: {
    enabled: true,
    description: 'Dark theme support for better user experience',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  mobileOptimization: {
    enabled: false,
    description: 'Enhanced mobile interface optimizations',
    rolloutPercentage: 75,
    environments: ['development', 'staging'],
    metadata: { requiresMobileFramework: true },
  },

  // Integration & API Features
  webhookIntegrations: {
    enabled: false,
    description: 'Webhook support for external system integration',
    rolloutPercentage: 0,
    environments: ['development'],
    metadata: { requiresWebhookInfrastructure: true },
  },

  apiRateLimiting: {
    enabled: true,
    description: 'Enhanced API rate limiting and throttling',
    rolloutPercentage: 100,
    environments: ['staging', 'production'],
  },

  auditLogExport: {
    enabled: false,
    description: 'Export audit logs for compliance reporting',
    rolloutPercentage: 0,
    environments: ['development', 'staging'],
    metadata: { requiresComplianceRole: true },
  },

  // Performance & Caching
  redisCache: {
    enabled: true,
    description: 'Redis-based caching for improved performance',
    rolloutPercentage: 100,
    environments: ['staging', 'production'],
  },

  queryOptimization: {
    enabled: true,
    description: 'Optimized database queries and indexing',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  fileCompressionUpload: {
    enabled: true,
    description: 'Automatic file compression on upload',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  // Security & Compliance
  twoFactorAuthentication: {
    enabled: false,
    description: 'Two-factor authentication support',
    rolloutPercentage: 0,
    environments: ['development', 'staging'],
    metadata: { requiresTOTPLibrary: true, plannedRelease: 'v2.2.0' },
  },

  encryptedFileStorage: {
    enabled: false,
    description: 'Encrypted storage for sensitive files',
    rolloutPercentage: 0,
    environments: ['development'],
    metadata: { requiresEncryptionKeys: true },
  },

  advancedAuditLogging: {
    enabled: true,
    description: 'Enhanced audit logging for compliance',
    rolloutPercentage: 100,
    environments: ['staging', 'production'],
  },

  // Pest Control Platform Features
  pestControlPlatform: {
    enabled: true,
    description: 'Core pest control platform functionality',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
    metadata: { requiredForPestControlBusiness: true },
  },

  pestControlCustomerPortal: {
    enabled: true,
    description: 'Customer portal for bookings, payments, and service history',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  pestControlAIChatbot: {
    enabled: false,
    description: 'AI-powered chatbot for customer service and bookings',
    rolloutPercentage: 25,
    environments: ['development', 'staging'],
    metadata: { requiresAIModel: true, plannedRelease: 'v2.0.0' },
  },

  pestControlTechnicianApp: {
    enabled: true,
    description: 'Mobile app for technicians with routing and compliance',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  pestControlRouteOptimization: {
    enabled: false,
    description: 'AI-powered route optimization for technicians',
    rolloutPercentage: 50,
    environments: ['development', 'staging'],
    metadata: { requiresGoogleMapsAPI: true },
  },

  pestControlChemicalTracking: {
    enabled: true,
    description: 'EPA-compliant chemical inventory and usage tracking',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
    metadata: { requiresEPACompliance: true },
  },

  pestControlAIQuotes: {
    enabled: false,
    description: 'AI-powered quote generation with risk assessment',
    rolloutPercentage: 25,
    environments: ['development'],
    metadata: { requiresAIModel: true, plannedRelease: 'v2.1.0' },
  },

  pestControlCRM: {
    enabled: false,
    description: 'AI-powered CRM with lead scoring and churn prediction',
    rolloutPercentage: 0,
    environments: ['development'],
    metadata: { requiresAIModel: true, plannedRelease: 'v3.0.0' },
  },

  pestControlComplianceReporting: {
    enabled: true,
    description: 'Regulatory compliance reporting for EPA and state requirements',
    rolloutPercentage: 100,
    environments: ['staging', 'production'],
    metadata: { requiresEPACompliance: true },
  },

  pestControlPaymentProcessing: {
    enabled: false,
    description: 'Integrated payment processing for pest control services',
    rolloutPercentage: 0,
    environments: ['development', 'staging'],
    metadata: { requiresPaymentGateway: true },
  },
};

/**
 * Utility function to check if a feature is enabled
 *
 * @param featureName - The name of the feature to check
 * @param userPercentile - User percentile for rollout testing (0-100)
 * @param environment - Current environment
 * @returns Whether the feature is enabled for this context
 */
export function isFeatureEnabled(
  featureName: keyof FeatureFlags,
  userPercentile: number = 0,
  environment: string = process.env.NODE_ENV || 'development'
): boolean {
  const feature = featureFlags[featureName];

  if (!feature) {
    console.warn(`Feature flag '${featureName}' not found`);
    return false;
  }

  // Check if feature is globally disabled
  if (!feature.enabled) {
    return false;
  }

  // Check environment restrictions
  if (feature.environments && !feature.environments.includes(environment as 'development' | 'production' | 'staging')) {
    return false;
  }

  // Check rollout percentage
  if (userPercentile > feature.rolloutPercentage) {
    return false;
  }

  return true;
}

/**
 * Get all enabled features for the current environment
 *
 * @param environment - Current environment
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(
  environment: string = process.env.NODE_ENV || 'development'
): string[] {
  return Object.entries(featureFlags)
    .filter(
      ([_, feature]) =>
        feature.enabled &&
  (!feature.environments || feature.environments.includes(environment as string))
    )
    .map(([name]) => name);
}

/**
 * Get feature configuration with metadata
 *
 * @param featureName - The name of the feature
 * @returns Feature configuration or null if not found
 */
export function getFeatureConfig(featureName: keyof FeatureFlags): FeatureFlag | null {
  return featureFlags[featureName] || null;
}

/**
 * Development helper: log all feature flags and their status
 */
export function logFeatureFlags(environment: string = process.env.NODE_ENV || 'development'): void {
  if (environment === 'production') {
    return; // Don't log in production
  }

  console.group('🚀 Feature Flags Status');
  Object.entries(featureFlags).forEach(([name, config]) => {
    const status = isFeatureEnabled(name as keyof FeatureFlags, 0, environment) ? '✅' : '❌';
    console.log(`${status} ${name}: ${config.description} (${config.rolloutPercentage}%)`);
  });
  console.groupEnd();
}
