// @ts-nocheck
// 
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  coverageAnalysis: 'off',
  mutate: [
    'client/src/services/healthService.ts'
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  allowEmpty: true,
  disableTypeChecks: true
};