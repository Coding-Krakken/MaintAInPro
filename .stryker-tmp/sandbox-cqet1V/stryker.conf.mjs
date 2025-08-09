// @ts-nocheck
// 
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: [
    'client/src/services/healthService.ts'
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  }
};