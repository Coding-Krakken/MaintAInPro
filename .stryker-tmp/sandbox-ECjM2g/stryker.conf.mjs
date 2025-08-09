// @ts-nocheck
// 
/**
 * Stryker.js Mutation Testing Configuration
 * Basic setup for TypeScript/React project with Vitest
 */
export default {
  // Package manager to use
  packageManager: 'npm',
  
  // Output reporters
  reporters: ['html', 'clear-text', 'progress'],
  
  // Test runner
  testRunner: 'vitest',
  
  // Coverage analysis mode
  coverageAnalysis: 'perTest',
  
  // Files to mutate - targeting healthService.ts as specified
  mutate: [
    'client/src/services/healthService.ts'
  ],
  
  // Mutation score thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Additional configuration
  allowEmpty: true,
  timeoutMS: 30000,
  maxConcurrentTestRunners: 2
};